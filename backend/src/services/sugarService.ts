import { SugarModel } from '../models/sugarModel';
import { SugarRecord, SugarSummary } from '../types/sugar.types';
import { getCurrentDate, isValidDate } from '../utils/timeUtils';

export class SugarService {
  // Create sugar record
  static async createSugarRecord(data: {
    user_id: number;
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    blood_sugar_value: number;
    record_date: string;
  }): Promise<SugarRecord> {
    if (data.blood_sugar_value <= 0 || data.blood_sugar_value > 1000) {
      throw new Error('Blood sugar value must be between 1 and 1000 mg/dL');
    }

    // Check if record already exists for this meal type and date
    const exists = await SugarModel.checkSugarRecordExists(data.user_id, data.meal_type, data.record_date);
    if (exists) {
      throw new Error(`Blood sugar record already exists for ${data.meal_type} on ${data.record_date}`);
    }

    return await SugarModel.createSugarRecord(data);
  }

  // Get sugar records
  static async getSugarRecords(userId: number, recordDate?: string, mealType?: string): Promise<SugarRecord[]> {
    return await SugarModel.getSugarRecords(userId, recordDate, mealType);
  }

  // Get sugar summary
  static async getSugarSummary(userId: number, recordDate?: string): Promise<SugarSummary> {
    return await SugarModel.getSugarSummary(userId, recordDate);
  }

  // Update sugar record
  static async updateSugarRecord(id: number, userId: number, data: {
    meal_type: 'breakfast' | 'lunch' | 'dinner';
    blood_sugar_value: number;
    record_date: string;
  }): Promise<SugarRecord> {
    if (data.blood_sugar_value <= 0 || data.blood_sugar_value > 1000) {
      throw new Error('Blood sugar value must be between 1 and 1000 mg/dL');
    }

    // Check if another record exists for this meal type and date 
    const existingRecord = await SugarModel.getSugarRecords(userId, data.record_date, data.meal_type);
    const conflictingRecord = existingRecord.find(record => record.id !== id);
    if (conflictingRecord) {
      throw new Error(`Blood sugar record already exists for ${data.meal_type} on ${data.record_date}`);
    }

    return await SugarModel.updateSugarRecord(id, userId, data);
  }

  // Delete sugar record
  static async deleteSugarRecord(id: number, userId: number): Promise<void> {
    await SugarModel.deleteSugarRecord(id, userId);
  }

  // Delete sugar records by date and type
  static async deleteSugarRecordsByDateAndType(userId: number, recordDate: string, mealType: string): Promise<number> {
    const validMealTypes = ['breakfast', 'lunch', 'dinner'];
    if (!validMealTypes.includes(mealType)) {
      throw new Error('Invalid meal type. Must be breakfast, lunch, or dinner.');
    }

    // Validate date format (YYYY-MM-DD)
    if (!isValidDate(recordDate)) {
      throw new Error('Invalid date format. Must be YYYY-MM-DD.');
    }

    return await SugarModel.deleteSugarRecordsByDateAndType(userId, recordDate, mealType);
  }

  // Get blood sugar status based on value
  static getBloodSugarStatus(bloodSugarValue: number): {
    status: 'normal' | 'elevated' | 'high' | 'very_high' | 'low' | 'very_low';
    message: string;
    color: string;
  } {
    if (bloodSugarValue < 70) {
      return {
        status: 'low',
        message: 'Blood sugar is low. Consider eating something.',
        color: '#FF6B6B'
      };
    } else if (bloodSugarValue < 100) {
      return {
        status: 'normal',
        message: 'Blood sugar is in normal range.',
        color: '#4CAF50'
      };
    } else if (bloodSugarValue < 126) {
      return {
        status: 'elevated',
        message: 'Blood sugar is elevated. Monitor closely.',
        color: '#FF9800'
      };
    } else if (bloodSugarValue < 200) {
      return {
        status: 'high',
        message: 'Blood sugar is high. Consider medication or diet adjustment.',
        color: '#F44336'
      };
    } else {
      return {
        status: 'very_high',
        message: 'Blood sugar is very high. Seek medical attention.',
        color: '#9C27B0'
      };
    }
  }

  // Get today's sugar summary
  static async getTodaySugarSummary(userId: number): Promise<{
    totalRecords: number;
    averageBloodSugar: number;
    records: SugarRecord[];
    date: string;
  }> {
    // Get today's date in YYYY-MM-DD format
    const todayString = getCurrentDate();

    const summary = await SugarModel.getSugarSummary(userId, todayString);

    return {
      ...summary,
      date: todayString
    };
  }
}
