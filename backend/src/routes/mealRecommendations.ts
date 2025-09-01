import express from 'express';
import { MealRecommendationController } from '../controllers/mealRecommendationController';
import { authenticateToken } from '../middleware/auth';
import { validateMealType, validateLimit, validateMealId } from '../middleware/mealRecommendationValidation';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get meal recommendations for the authenticated user
router.get('/', validateLimit, MealRecommendationController.getMealRecommendations);

// Get meal recommendations for all meal types
router.get('/all', validateLimit, MealRecommendationController.getAllMealRecommendations);

// Get weekly meal recommendations
router.get('/weekly', validateLimit, MealRecommendationController.getWeeklyMealRecommendations);

// Get available meal types
router.get('/types/available', MealRecommendationController.getAvailableMealTypes);

// Get meal recommendations statistics
router.get('/stats/count', MealRecommendationController.getMealRecommendationsStats);

// Get meal recommendations by meal type
router.get('/type/:meal_type', validateMealType, validateLimit, MealRecommendationController.getMealRecommendationsByType);

// Get meal recommendation by ID
router.get('/:meal_id', validateMealId, MealRecommendationController.getMealRecommendationById);

export default router;
