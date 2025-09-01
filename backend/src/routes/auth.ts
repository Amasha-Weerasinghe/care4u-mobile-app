import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';
import {
  loginValidation,
  otpValidation,
  resendOTPValidation,
  createProfileValidation,
  updateProfileValidation
} from '../middleware/inputValidation';

const router = express.Router();

// Authentication routes
router.post('/login', loginValidation, AuthController.login);
router.post('/verify-otp', otpValidation, AuthController.verifyOTP);
router.post('/resend-otp', resendOTPValidation, AuthController.resendOTP);

// Profile routes
router.post('/profile', authenticateToken, createProfileValidation, AuthController.createProfile);
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, updateProfileValidation, AuthController.updateProfile);

// User data route
router.get('/user', authenticateToken, AuthController.getProfile);

// Complete profile route
router.post('/complete-profile', authenticateToken, createProfileValidation, AuthController.createProfile);

// Update profile route
router.put('/update-profile', authenticateToken, updateProfileValidation, AuthController.updateProfile);

// Auth status check
router.get('/check', authenticateToken, AuthController.checkAuth);

export default router;
