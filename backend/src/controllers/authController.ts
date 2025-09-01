import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../types/auth.types';
import { AuthService } from '../services/authService';

export class AuthController {
  /**
   * Handles user login by sending OTP to the provided email
   * @param req - The request object containing email
   * @param res - The response object
   * @returns Promise<void>
   */
  static async login(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const result = await AuthService.sendOTP(email);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Verifies the OTP provided by the user for authentication
   * @param req - The request object containing email and OTP
   * @param res - The response object
   * @returns Promise<void>
   */
  static async verifyOTP(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { email, otp } = req.body;
      const result = await AuthService.verifyOTP(email, otp);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Resends OTP to the user's email address
   * @param req - The request object containing email
   * @param res - The response object
   * @returns Promise<void>
   */
  static async resendOTP(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const { email } = req.body;
      const result = await AuthService.resendOTP(email);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Creates a user profile for the authenticated user
   * @param req - The authenticated request containing profile data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async createProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const userId = req.user!.userId;
      const profileData = req.body;
      const result = await AuthService.createProfile(userId, profileData);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Create profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Retrieves the profile information for the authenticated user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const result = await AuthService.getProfile(userId);

      if (result.success) {
        res.json(result);
      } else {
        res.status(404).json(result);
      }
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Updates the profile information for the authenticated user
   * @param req - The authenticated request containing updated profile data
   * @param res - The response object
   * @returns Promise<void>
   */
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Invalid input data',
          errors: errors.array()
        });
      }

      const userId = req.user!.userId;
      const profileData = req.body;
      const result = await AuthService.updateProfile(userId, profileData);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Checks the authentication status of the current user
   * @param req - The authenticated request
   * @param res - The response object
   * @returns Promise<void>
   */
  static async checkAuth(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user!.userId;
      const result = await AuthService.getProfile(userId);

      res.json({
        success: true,
        message: 'User is authenticated',
        user: {
          id: userId,
          email: req.user!.email
        },
        hasProfile: result.success
      });
    } catch (error) {
      console.error('Check auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
