import { body } from 'express-validator';

export const foodItemValidation = [
  body('name').notEmpty().trim().withMessage('Food item name is required'),
  body('category').notEmpty().trim().withMessage('Category is required'),
  body('calories_per_100g').isNumeric().withMessage('Calories must be a number'),
  body('is_veg').isBoolean().withMessage('is_veg must be a boolean')
];

export const calorieGoalsValidation = [
  body('calorie_intake_goal').isNumeric().withMessage('Calorie intake goal must be a number'),
  body('calorie_burn_goal').isNumeric().withMessage('Calorie burn goal must be a number')
];

export const mealTemplateValidation = [
  body('name').notEmpty().trim().withMessage('Template name is required'),
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.food_item_id').isNumeric().withMessage('Food item ID must be a number'),
  body('items.*.quantity_grams').isNumeric().withMessage('Quantity must be a number')
];

export const mealRecordValidation = [
  body('meal_type').isIn(['breakfast', 'lunch', 'dinner', 'snack']).withMessage('Invalid meal type'),
  body('meal_date').isISO8601().withMessage('Invalid date format'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.food_item_id').isNumeric().withMessage('Food item ID must be a number'),
  body('items.*.quantity_grams').isNumeric().withMessage('Quantity must be a number')
];
