/**
 * Database Package
 * Provides database client and repository access
 */

export { DatabaseClient, getDatabase, closeDatabase } from './client';
export { InvestigationRepository } from './repositories/investigation-repository';
