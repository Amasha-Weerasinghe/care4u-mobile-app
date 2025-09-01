import { Request, Response, NextFunction } from 'express';
import { isValidDate, isFutureDate } from '../utils/timeUtils';

export const validateCreateExercise = (req: Request, res: Response, next: NextFunction): void => {
  const { activity_type, duration_seconds, calories_burned } = req.body;

  // Check required fields
  if (!activity_type || !duration_seconds || calories_burned === undefined) {
    res.status(400).json({
      success: false,
      message: 'Missing required fields: activity_type, duration_seconds, calories_burned'
    });
    return;
  }

  // Validate activity type
  if (typeof activity_type !== 'string' || activity_type.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Activity type must be a non-empty string'
    });
    return;
  }

  // Validate duration seconds
  if (typeof duration_seconds !== 'number' || duration_seconds <= 0) {
    res.status(400).json({
      success: false,
      message: 'Duration must be a positive number'
    });
    return;
  }

  // Validate calories burned
  if (typeof calories_burned !== 'number' || calories_burned < 0) {
    res.status(400).json({
      success: false,
      message: 'Calories burned must be a non-negative number'
    });
    return;
  }

  // Validate activity type against allowed values
  const validActivityTypes = [
    'walking', 'running', 'cycling', 'yoga', 'stretching',
    'zumba'
  ];

  const normalizedActivityType = activity_type.toLowerCase().trim();
  if (!validActivityTypes.includes(normalizedActivityType)) {
    res.status(400).json({
      success: false,
      message: 'Invalid activity type. Please choose a valid exercise activity.'
    });
    return;
  }

  // Validate notes if provided
  if (req.body.notes !== undefined && (typeof req.body.notes !== 'string' || req.body.notes.length > 500)) {
    res.status(400).json({
      success: false,
      message: 'Notes must be a string with maximum 500 characters'
    });
    return;
  }

  next();
};

export const validateUpdateExercise = (req: Request, res: Response, next: NextFunction): void => {
  const { activity_type, duration_seconds, calories_burned, notes } = req.body;

  // Validate activity_type if provided
  if (activity_type !== undefined) {
    if (typeof activity_type !== 'string' || activity_type.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Activity type must be a non-empty string'
      });
      return;
    }

    const validActivityTypes = [
      'walking', 'running', 'cycling', 'yoga', 'stretching',
      'zumba'
    ];

    const normalizedActivityType = activity_type.toLowerCase().trim();
    if (!validActivityTypes.includes(normalizedActivityType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid activity type. Please choose a valid exercise activity.'
      });
      return;
    }
  }

  // Validate duration seconds if provided
  if (duration_seconds !== undefined) {
    if (typeof duration_seconds !== 'number' || duration_seconds <= 0) {
      res.status(400).json({
        success: false,
        message: 'Duration must be a positive number'
      });
      return;
    }
  }

  // Validate calories burned if provided
  if (calories_burned !== undefined) {
    if (typeof calories_burned !== 'number' || calories_burned < 0) {
      res.status(400).json({
        success: false,
        message: 'Calories burned must be a non-negative number'
      });
      return;
    }
  }

  // Validate notes if provided
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
    res.status(400).json({
      success: false,
      message: 'Notes must be a string with maximum 500 characters'
    });
    return;
  }

  next();
};

export const validateExerciseId = (req: Request, res: Response, next: NextFunction): void => {
  const exerciseId = parseInt(req.params.id);

  if (isNaN(exerciseId) || exerciseId <= 0) {
    res.status(400).json({
      success: false,
      message: 'Invalid exercise ID'
    });
    return;
  }

  next();
};

export const validateDateParam = (req: Request, res: Response, next: NextFunction): void => {
  const { date } = req.params;

  if (!date) {
    res.status(400).json({
      success: false,
      message: 'Date parameter is required'
    });
    return;
  }

  // Validate date format (YYYY-MM-DD)
  if (!isValidDate(date)) {
    res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD format.'
    });
    return;
  }

  // Validate that date is not in the future
  if (isFutureDate(date)) {
    res.status(400).json({
      success: false,
      message: 'Date cannot be in the future'
    });
    return;
  }

  next();
};

export const validateDateRange = (req: Request, res: Response, next: NextFunction): void => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({
      success: false,
      message: 'Both startDate and endDate parameters are required'
    });
    return;
  }

  if (typeof startDate !== 'string' || typeof endDate !== 'string') {
    res.status(400).json({
      success: false,
      message: 'startDate and endDate must be strings'
    });
    return;
  }

  // Validate date format (YYYY-MM-DD)
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    res.status(400).json({
      success: false,
      message: 'Invalid date format. Use YYYY-MM-DD format.'
    });
    return;
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    res.status(400).json({
      success: false,
      message: 'Start date cannot be after end date'
    });
    return;
  }

  if (isFutureDate(endDate)) {
    res.status(400).json({
      success: false,
      message: 'End date cannot be in the future'
    });
    return;
  }

  next();
};

export const validateCalculateCalories = (req: Request, res: Response, next: NextFunction): void => {
  const { activityType, durationMinutes, userWeight } = req.body;

  // Check required fields
  if (!activityType || durationMinutes === undefined) {
    res.status(400).json({
      success: false,
      message: 'Activity type and duration are required'
    });
    return;
  }

  // Validate activityType
  if (typeof activityType !== 'string' || activityType.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: 'Activity type must be a non-empty string'
    });
    return;
  }

  // Validate durationMinutes
  if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
    res.status(400).json({
      success: false,
      message: 'Duration must be a positive number'
    });
    return;
  }

  // Validate userWeight if provided
  if (userWeight !== undefined) {
    if (typeof userWeight !== 'number' || userWeight <= 0 || userWeight > 500) {
      res.status(400).json({
        success: false,
        message: 'User weight must be a positive number between 1 and 500 kg'
      });
      return;
    }
  }

  next();
};
