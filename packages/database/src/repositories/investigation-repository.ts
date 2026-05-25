import { Investigation, InvestigationSchema } from '@sentinelos/schema';
import { DatabaseClient } from '../client';

/**
 * Investigation Repository
 * Handles database operations for investigations
 */
export class InvestigationRepository {
  constructor(private db: DatabaseClient) {}

  /**
   * Find investigation by ID
   */
  async findById(investigationId: string): Promise<Investigation | null> {
    const query = `
      SELECT * FROM investigations
      WHERE investigation_id = $1
    `;

    const result = await this.db.getOne<Investigation>(query, [investigationId]);
    return result || null;
  }

  /**
   * Find all investigations with optional filtering
   */
  async findAll(
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<{ data: Investigation[]; total: number }> {
    let query = 'SELECT * FROM investigations';
    const params: any[] = [];

    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const data = await this.db.getMany<Investigation>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as count FROM investigations';
    if (status) {
      countQuery += ' WHERE status = $1';
    }

    const countResult = await this.db.getOne<{ count: string }>(
      countQuery,
      status ? [status] : []
    );
    const total = parseInt(countResult?.count || '0', 10);

    return { data, total };
  }

  /**
   * Create new investigation
   */
  async create(investigation: Omit<Investigation, 'investigation_id' | 'created_at' | 'updated_at'>): Promise<Investigation> {
    const investigationId = `inv_${Date.now()}`;
    const now = Date.now();

    const query = `
      INSERT INTO investigations (
        investigation_id, alert_id, created_at, updated_at,
        status, confidence, findings, timeline, recommendations, ai_narrative
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      investigationId,
      investigation.alert_id,
      now,
      now,
      investigation.status,
      investigation.confidence,
      JSON.stringify(investigation.findings),
      JSON.stringify(investigation.timeline),
      JSON.stringify(investigation.recommendations),
      investigation.ai_narrative,
    ];

    const result = await this.db.getOne<Investigation>(query, values);
    if (!result) {
      throw new Error('Failed to create investigation');
    }

    return result;
  }

  /**
   * Update investigation
   */
  async update(
    investigationId: string,
    updates: Partial<Investigation>
  ): Promise<Investigation> {
    const allowedFields = ['status', 'confidence', 'findings', 'timeline', 'recommendations', 'ai_narrative'];
    const setClause: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (field in updates) {
        setClause.push(`${field} = $${paramCount++}`);
        const value = (updates as any)[field];
        values.push(typeof value === 'object' ? JSON.stringify(value) : value);
      }
    }

    if (setClause.length === 0) {
      return this.findById(investigationId) as Promise<Investigation>;
    }

    setClause.push(`updated_at = $${paramCount++}`);
    values.push(Date.now());
    values.push(investigationId);

    const query = `
      UPDATE investigations
      SET ${setClause.join(', ')}
      WHERE investigation_id = $${paramCount}
      RETURNING *
    `;

    const result = await this.db.getOne<Investigation>(query, values);
    if (!result) {
      throw new Error('Investigation not found');
    }

    return result;
  }

  /**
   * Delete investigation
   */
  async delete(investigationId: string): Promise<boolean> {
    const query = 'DELETE FROM investigations WHERE investigation_id = $1';
    const affected = await this.db.execute(query, [investigationId]);
    return affected > 0;
  }
}
