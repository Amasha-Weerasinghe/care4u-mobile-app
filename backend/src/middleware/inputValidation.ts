import { body } from 'express-validator';

// Login validation (OTP-based)
export const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

// OTP validation
export const otpValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

// Resend OTP validation
export const resendOTPValidation = [
  body('email').isEmail().withMessage('Please enter a valid email')
];

// Profile creation validation
export const createProfileValidation = [
  body('first_name').notEmpty().trim().withMessage('First name is required'),
  body('last_name').notEmpty().trim().withMessage('Last name is required'),
  body('contact_number').notEmpty().trim().withMessage('Contact number is required'),
  body('birth_date').isISO8601().withMessage('Please enter a valid date of birth'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Please select a valid gender'),
  body('height').isNumeric().withMessage('Height must be a number'),
  body('weight').isNumeric().withMessage('Weight must be a number'),
  body('emergency_contact_name').notEmpty().trim().withMessage('Emergency contact name is required'),
  body('emergency_contact_number').notEmpty().trim().withMessage('Emergency contact number is required'),
  body('dietary_preference').isIn(['veg', 'non-veg']).withMessage('Please select a valid dietary preference'),
  body('calorie_intake_goal').isNumeric().withMessage('Calorie intake goal must be a number'),
  body('calorie_burn_goal').isNumeric().withMessage('Calorie burn goal must be a number')
];

// Profile update validation (all fields optional)
export const updateProfileValidation = [
  body('first_name').optional().notEmpty().trim().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().trim().withMessage('Last name cannot be empty'),
  body('contact_number').optional().notEmpty().trim().withMessage('Contact number cannot be empty'),
  body('birth_date').optional().isISO8601().withMessage('Please enter a valid date of birth'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Please select a valid gender'),
  body('height').optional().isNumeric().withMessage('Height must be a number'),
  body('weight').optional().isNumeric().withMessage('Weight must be a number'),
  body('emergency_contact_name').optional().notEmpty().trim().withMessage('Emergency contact name cannot be empty'),
  body('emergency_contact_number').optional().notEmpty().trim().withMessage('Emergency contact number cannot be empty'),
  body('dietary_preference').optional().isIn(['veg', 'non-veg']).withMessage('Please select a valid dietary preference'),
  body('calorie_intake_goal').optional().isNumeric().withMessage('Calorie intake goal must be a number'),
  body('calorie_burn_goal').optional().isNumeric().withMessage('Calorie burn goal must be a number')
];
