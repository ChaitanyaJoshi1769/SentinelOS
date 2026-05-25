import fs from 'fs';
import path from 'path';
import { getDatabase, closeDatabase } from '../client';
import pino from 'pino';

const logger = pino();

/**
 * Run all migrations in order
 */
async function runMigrations() {
  const db = getDatabase();

  try {
    // Check if database is healthy
    const isHealthy = await db.healthCheck();
    if (!isHealthy) {
      throw new Error('Database connection failed');
    }

    logger.info('Database connection successful');

    // Get all migration files
    const migrationsDir = path.join(__dirname);
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    logger.info(`Found ${files.length} migration files`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      logger.info(`Running migration: ${file}`);

      try {
        // Split by semicolon and filter empty statements
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        for (const statement of statements) {
          await db.execute(statement);
        }

        logger.info(`✓ Migration completed: ${file}`);
      } catch (error) {
        logger.error(
          { error, file },
          'Migration failed'
        );
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error({ error }, 'Migration failed');
    process.exit(1);
  } finally {
    await closeDatabase();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
