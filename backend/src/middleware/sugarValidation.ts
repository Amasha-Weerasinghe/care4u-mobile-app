import { body, param, query } from 'express-validator';

export const createSugarRecordValidation = [
  body('meal_type')
    .isIn(['breakfast', 'lunch', 'dinner'])
    .withMessage('Meal type must be breakfast, lunch, or dinner'),
  body('blood_sugar_value')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Blood sugar value must be between 1 and 1000 mg/dL'),
  body('record_date')
    .isISO8601()
    .withMessage('Record date must be a valid date')
];

export const updateSugarRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Record ID must be a positive integer'),
  body('meal_type')
    .isIn(['breakfast', 'lunch', 'dinner'])
    .withMessage('Meal type must be breakfast, lunch, or dinner'),
  body('blood_sugar_value')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Blood sugar value must be between 1 and 1000 mg/dL'),
  body('record_date')
    .isISO8601()
    .withMessage('Record date must be a valid date')
];

export const getSugarRecordsValidation = [
  query('record_date')
    .optional()
    .isISO8601()
    .withMessage('Record date must be a valid date'),
  query('meal_type')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner'])
    .withMessage('Meal type must be breakfast, lunch, or dinner')
];

export const getSugarSummaryValidation = [
  query('record_date')
    .optional()
    .isISO8601()
    .withMessage('Record date must be a valid date')
];

export const deleteSugarRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Record ID must be a positive integer')
];
