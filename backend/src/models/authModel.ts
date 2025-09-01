import pool from '../config/database';
import { User, CompleteProfileRequest, UpdateProfileRequest } from '../types/auth.types';

export class AuthModel {
  // User Authentication Operations
  static async findUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  static async createUser(email: string): Promise<User> {
    const result = await pool.query(
      'INSERT INTO users (email) VALUES ($1) RETURNING *',
      [email]
    );
    return result.rows[0];
  }

  static async updateUserOTP(userId: number, otp: string, expiresAt: Date): Promise<void> {
    // First get the user's email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return;

    const email = userResult.rows[0].email;

    // Delete any existing OTP for this email
    await pool.query('DELETE FROM otp_verification WHERE email = $1', [email]);

    // Insert new OTP
    await pool.query(
      'INSERT INTO otp_verification (email, otp, expires_at) VALUES ($1, $2, $3)',
      [email, otp, expiresAt]
    );
  }

  static async verifyUserOTP(userId: number, otp: string): Promise<boolean> {
    // First get the user's email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) return false;

    const email = userResult.rows[0].email;

    // Check if OTP exists and is valid
    const otpResult = await pool.query(
      'SELECT * FROM otp_verification WHERE email = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpResult.rows.length === 0) return false;

    // Delete the used OTP
    await pool.query('DELETE FROM otp_verification WHERE email = $1 AND otp = $2', [email, otp]);

    return true;
  }

  // User Profile Operations
  static async createUserProfile(data: {
    user_id: number;
    first_name: string;
    last_name: string;
    contact_number: string;
    birth_date: string;
    gender: string;
    height: number;
    weight: number;
    emergency_contact_name: string;
    emergency_contact_number: string;
    dietary_preference: string;
    calorie_intake_goal: number;
    calorie_burn_goal: number;
  }): Promise<User> {
    // Calculate BMI
    const heightInMeters = data.height / 100;
    const bmi = data.weight / (heightInMeters * heightInMeters);
    const roundedBmi = Math.round(bmi * 10) / 10;

    const result = await pool.query(
      `UPDATE users SET 
        first_name = $2, last_name = $3, contact_number = $4, 
        birth_date = $5, gender = $6, height = $7, weight = $8,
        emergency_contact_name = $9, emergency_contact_number = $10,
        dietary_preference = $11, calorie_intake_goal = $12, calorie_burn_goal = $13,
        bmi = $14, is_profile_complete = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 RETURNING *`,
      [
        data.user_id, data.first_name, data.last_name, data.contact_number,
        data.birth_date, data.gender, data.height, data.weight,
        data.emergency_contact_name, data.emergency_contact_number,
        data.dietary_preference, data.calorie_intake_goal, data.calorie_burn_goal,
        roundedBmi
      ]
    );
    return result.rows[0];
  }

  static async getUserProfile(userId: number): Promise<User | null> {
    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async updateUserProfile(userId: number, data: Partial<User>): Promise<User> {
    const fields = Object.keys(data).filter(key => key !== 'id' && key !== 'created_at');
    const values = Object.values(data).filter((_, index) => fields[index]);

    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const query = `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`;

    const result = await pool.query(query, [userId, ...values]);
    return result.rows[0];
  }
}
