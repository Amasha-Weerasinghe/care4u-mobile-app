import express from 'express';
import { ExerciseController } from '../controllers/exerciseController';
import { authenticateToken } from '../middleware/auth';
import {
  validateCreateExercise,
  validateUpdateExercise,
  validateExerciseId,
  validateDateParam,
  validateDateRange,
  validateCalculateCalories
} from '../middleware/exerciseValidation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create new exercise activity
router.post('/create', validateCreateExercise, ExerciseController.createExercise);

// Get today's exercise summary
router.get('/today-summary', ExerciseController.getTodayExerciseSummary);

// Get daily exercise summary for a specific date
router.get('/daily-summary/:date', validateDateParam, ExerciseController.getDailyExerciseSummary);

// Get exercise history with optional filters
router.get('/history', ExerciseController.getExerciseHistory);

// Get exercise summary for a specific date
router.get('/summary/:date', validateDateParam, ExerciseController.getExerciseSummaryByDate);

// Get exercise statistics for a date range
router.get('/stats', validateDateRange, ExerciseController.getExerciseStats);

// Get available activity types
router.get('/activity-types', ExerciseController.getActivityTypes);

// Calculate calories burned for an activity
router.post('/calculate-calories', validateCalculateCalories, ExerciseController.calculateCalories);

// Delete exercise activities by date and type
router.delete('/', ExerciseController.deleteExerciseActivitiesByDateAndType);

// Get exercise activity by ID
router.get('/:id', validateExerciseId, ExerciseController.getExerciseById);

// Update exercise activity
router.put('/:id', validateExerciseId, validateUpdateExercise, ExerciseController.updateExercise);

// Delete exercise activity
router.delete('/:id', validateExerciseId, ExerciseController.deleteExercise);

export default router;
