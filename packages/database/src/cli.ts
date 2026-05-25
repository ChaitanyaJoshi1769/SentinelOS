#!/usr/bin/env node

import { getDatabase, closeDatabase } from './client';
import { runMigrations } from './migrations/run';
import pino from 'pino';

const logger = pino();

/**
 * CLI for database operations
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'migrate':
        logger.info('Running database migrations...');
        await runMigrations();
        logger.info('✓ Migrations completed');
        break;

      case 'seed':
        logger.info('Seeding database...');
        await seedDatabase();
        logger.info('✓ Database seeded');
        break;

      case 'health':
        await checkHealth();
        break;

      case 'reset':
        logger.warn('Resetting database...');
        await resetDatabase();
        logger.info('✓ Database reset');
        break;

      default:
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    logger.error({ error }, 'Command failed');
    process.exit(1);
  }
}

async function checkHealth() {
  try {
    const db = getDatabase();
    const isHealthy = await db.healthCheck();

    if (isHealthy) {
      logger.info('✓ Database connection healthy');
      console.log('✓ Database is running and accessible');
    } else {
      logger.error('Database health check failed');
      process.exit(1);
    }
  } finally {
    await closeDatabase();
  }
}

async function seedDatabase() {
  const db = getDatabase();

  try {
    // Check if database is empty
    const investigationRepository = db.getInvestigationRepository();

    // Try to fetch existing data
    const { total } = await investigationRepository.findAll(1, 0);

    if (total > 0) {
      logger.info('Database already has data. Skipping seed.');
      return;
    }

    logger.info('Database is empty. Adding seed data...');

    // Add sample investigations
    const sampleInvestigations = [
      {
        alert_id: 'alert_seed_001',
        status: 'complete',
        confidence: 0.92,
        findings: [
          {
            title: 'Suspicious Process Creation',
            description: 'PowerShell execution from unusual parent',
            severity: 'high',
            evidence: ['powershell.exe', 'explorer.exe parent'],
          },
        ],
        timeline: [],
        recommendations: ['Isolate endpoint', 'Reset credentials'],
        ai_narrative: 'Confirmed compromise with high confidence.',
      },
    ];

    for (const inv of sampleInvestigations) {
      await investigationRepository.create(inv);
    }

    logger.info(`Added ${sampleInvestigations.length} sample investigations`);
  } finally {
    await closeDatabase();
  }
}

async function resetDatabase() {
  const db = getDatabase();

  try {
    // Drop all tables
    const dropQueries = [
      'DROP TABLE IF EXISTS approval_requests CASCADE',
      'DROP TABLE IF EXISTS remediation_actions CASCADE',
      'DROP TABLE IF EXISTS threat_paths CASCADE',
      'DROP TABLE IF EXISTS threat_edges CASCADE',
      'DROP TABLE IF EXISTS threat_nodes CASCADE',
      'DROP TABLE IF EXISTS security_metrics CASCADE',
      'DROP TABLE IF EXISTS threat_actors CASCADE',
      'DROP TABLE IF EXISTS investigations CASCADE',
    ];

    for (const query of dropQueries) {
      await db.execute(query);
    }

    logger.info('All tables dropped');

    // Run migrations again
    await runMigrations();
  } finally {
    await closeDatabase();
  }
}

function printUsage() {
  console.log(`
Database CLI

Usage: db-cli [command]

Commands:
  migrate     Run database migrations
  seed        Seed database with sample data
  health      Check database connection health
  reset       Reset database and run migrations
  help        Show this help message
  `);
}

// Run CLI
main();
