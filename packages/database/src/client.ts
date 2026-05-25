import { Pool, QueryResult } from 'pg';
import pino from 'pino';
import { InvestigationRepository } from './repositories/investigation-repository';

const logger = pino();

/**
 * Database Client
 * Manages PostgreSQL connection and provides query methods
 */
export class DatabaseClient {
  private pool: Pool;

  constructor(connectionString?: string) {
    const connStr =
      connectionString ||
      process.env.DATABASE_URL ||
      'postgresql://localhost/sentinelos';

    this.pool = new Pool({
      connectionString: connStr,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected error on idle client', err);
    });

    logger.info('Database client initialized');
  }

  /**
   * Execute a query
   */
  async query<T = any>(
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, values);
      const duration = Date.now() - start;

      if (duration > 1000) {
        logger.warn(
          { duration, query: text },
          'Slow query detected'
        );
      }

      return result;
    } catch (error) {
      logger.error(
        { error, query: text, values },
        'Database query error'
      );
      throw error;
    }
  }

  /**
   * Get a single row
   */
  async getOne<T = any>(
    text: string,
    values?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(text, values);
    return result.rows[0] || null;
  }

  /**
   * Get multiple rows
   */
  async getMany<T = any>(
    text: string,
    values?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(text, values);
    return result.rows;
  }

  /**
   * Execute insert/update/delete and return affected count
   */
  async execute(text: string, values?: any[]): Promise<number> {
    const result = await this.query(text, values);
    return result.rowCount || 0;
  }

  /**
   * Execute transaction
   */
  async transaction<T>(
    callback: (client: DatabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      const result = await callback(this);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.pool.query('SELECT NOW()');
      return result.rows.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get Investigation Repository
   */
  getInvestigationRepository(): InvestigationRepository {
    return new InvestigationRepository(this);
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connection pool closed');
  }
}

// Singleton instance
let instance: DatabaseClient | null = null;

export function getDatabase(): DatabaseClient {
  if (!instance) {
    instance = new DatabaseClient();
  }
  return instance;
}

export async function closeDatabase(): Promise<void> {
  if (instance) {
    await instance.close();
    instance = null;
  }
}
