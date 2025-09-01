import pool from '../config/database';
import { SugarRecord, SugarSummary, CreateSugarRecordRequest } from '../types/sugar.types';
import { isValidDate } from '../utils/timeUtils';

export class SugarModel {
  // Create sugar record
  static async createSugarRecord(data: {
    user_id: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    blood_sugar_value: number;
    record_date: string;
  }): Promise<SugarRecord> {
    // Ensure the date is properly formatted and handle timezone issues
    let processedDate = data.record_date;

    // If the date contains time information, extract only the date part
    if (processedDate.includes('T')) {
      processedDate = processedDate.split('T')[0];
    }

    // Validate the date format (YYYY-MM-DD)
    if (!isValidDate(processedDate)) {
      throw new Error('Invalid date format. Expected YYYY-MM-DD');
    }

    // Store the date using explicit DATE casting
    const result = await pool.query(
      `INSERT INTO sugar_records (user_id, meal_type, blood_sugar_value, record_date) 
       VALUES ($1, $2, $3, $4::date) 
       RETURNING id, user_id, meal_type, blood_sugar_value,
                TO_CHAR(record_date, 'YYYY-MM-DD') as record_date,
                created_at, updated_at`,
      [data.user_id, data.meal_type, data.blood_sugar_value, processedDate]
    );

    return result.rows[0];
  }

  // Get sugar records for a user
  static async getSugarRecords(userId: number, recordDate?: string, mealType?: string): Promise<SugarRecord[]> {
    let query = `
      SELECT id, user_id, meal_type, blood_sugar_value,
             TO_CHAR(record_date, 'YYYY-MM-DD') as record_date,
             created_at, updated_at
      FROM sugar_records
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (recordDate) {
      let processedDate = recordDate;
      if (processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }

      query += ` AND record_date = $${paramIndex}::date`;
      params.push(processedDate);
      paramIndex++;
    }

    if (mealType) {
      query += ` AND meal_type = $${paramIndex}`;
      params.push(mealType);
      paramIndex++;
    }

    query += ' ORDER BY record_date DESC, created_at DESC';

    const result = await pool.query(query, params);

    return result.rows;
  }

  // Get sugar summary for a user
  static async getSugarSummary(userId: number, recordDate?: string): Promise<SugarSummary> {
    let query = `
      SELECT id, user_id, meal_type, blood_sugar_value,
             TO_CHAR(record_date, 'YYYY-MM-DD') as record_date,
             created_at, updated_at
      FROM sugar_records
      WHERE user_id = $1
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    if (recordDate) {
      let processedDate = recordDate;
      if (processedDate.includes('T')) {
        processedDate = processedDate.split('T')[0];
      }
      query += ` AND record_date = $${paramIndex}::date`;
      params.push(processedDate);
      paramIndex++;
    }

    query += ' ORDER BY record_date DESC, created_at DESC';

    const result = await pool.query(query, params);
    const records = result.rows;

    // Calculate summary
    const totalRecords = records.length;
    const averageBloodSugar = totalRecords > 0
      ? Math.round(records.reduce((sum, record) => sum + record.blood_sugar_value, 0) / totalRecords)
      : 0;
    const highestBloodSugar = totalRecords > 0 ? Math.max(...records.map(record => record.blood_sugar_value)) : 0;
    const lowestBloodSugar = totalRecords > 0 ? Math.min(...records.map(record => record.blood_sugar_value)) : 0;

    return {
      totalRecords,
      averageBloodSugar,
      highestBloodSugar,
      lowestBloodSugar,
      records
    };
  }

  // Update sugar record
  static async updateSugarRecord(id: number, userId: number, data: {
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    blood_sugar_value: number;
    record_date: string;
  }): Promise<SugarRecord> {
    let processedDate = data.record_date;
    if (processedDate.includes('T')) {
      processedDate = processedDate.split('T')[0];
    }

    const result = await pool.query(
      `UPDATE sugar_records SET 
        meal_type = $1, 
        blood_sugar_value = $2, 
        record_date = $3::date,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $4 AND user_id = $5 
        RETURNING id, user_id, meal_type, blood_sugar_value,
                 TO_CHAR(record_date, 'YYYY-MM-DD') as record_date,
                 created_at, updated_at`,
      [data.meal_type, data.blood_sugar_value, processedDate, id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Sugar record not found or access denied');
    }

    return result.rows[0];
  }

  // Delete sugar record
  static async deleteSugarRecord(id: number, userId: number): Promise<void> {
    const result = await pool.query(
      'DELETE FROM sugar_records WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      throw new Error('Sugar record not found or access denied');
    }
  }

  // Delete sugar records by date and type
  static async deleteSugarRecordsByDateAndType(userId: number, recordDate: string, mealType: string): Promise<number> {
    let processedDate = recordDate;
    if (processedDate.includes('T')) {
      processedDate = processedDate.split('T')[0];
    }

    const result = await pool.query(
      'DELETE FROM sugar_records WHERE user_id = $1 AND record_date = $2::date AND meal_type = $3',
      [userId, processedDate, mealType]
    );

    return result.rowCount || 0;
  }

  // Check if sugar record exists for a specific meal type and date
  static async checkSugarRecordExists(userId: number, mealType: string, recordDate: string): Promise<boolean> {
    let processedDate = recordDate;
    if (processedDate.includes('T')) {
      processedDate = processedDate.split('T')[0];
    }

    const result = await pool.query(
      'SELECT id FROM sugar_records WHERE user_id = $1 AND meal_type = $2 AND record_date = $3::date',
      [userId, mealType, processedDate]
    );

    return result.rows.length > 0;
  }
}
