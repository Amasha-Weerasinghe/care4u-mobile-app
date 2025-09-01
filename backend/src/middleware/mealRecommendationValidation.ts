import { Request, Response, NextFunction } from 'express';

export const validateMealType = (req: Request, res: Response, next: NextFunction) => {
  const { meal_type } = req.params;
  const validMealTypes = ['breakfast', 'lunch', 'dinner'];

  if (meal_type && !validMealTypes.includes(meal_type.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: 'Invalid meal type. Must be one of: breakfast, lunch, dinner'
    });
  }

  next();
};

export const validateLimit = (req: Request, res: Response, next: NextFunction) => {
  const { limit, limit_per_type, limit_per_meal } = req.query;

  const validateLimitValue = (value: any, paramName: string): boolean => {
    if (value) {
      const numValue = parseInt(value as string);
      if (isNaN(numValue) || numValue < 1 || numValue > 50) {
        res.status(400).json({
          success: false,
          error: `${paramName} must be a number between 1 and 50`
        });
        return false;
      }
    }
    return true;
  };

  if (!validateLimitValue(limit, 'limit')) return;
  if (!validateLimitValue(limit_per_type, 'limit_per_type')) return;
  if (!validateLimitValue(limit_per_meal, 'limit_per_meal')) return;

  next();
};

export const validateMealId = (req: Request, res: Response, next: NextFunction) => {
  const { meal_id } = req.params;

  if (!meal_id || meal_id.trim() === '') {
    return res.status(400).json({
      success: false,
      error: 'Meal ID is required'
    });
  }

  next();
};
