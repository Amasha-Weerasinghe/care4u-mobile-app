import jwt from 'jsonwebtoken';
import { AuthModel } from '../models/authModel';
import { sendOTPEmail } from '../config/email';
import { User, OTPResult, ProfileResult } from '../types/auth.types';

export class AuthService {
  // Authentication 
  static async sendOTP(email: string): Promise<OTPResult> {
    try {
      // Check if user exists
      const user = await AuthModel.findUserByEmail(email);
      
      if (!user) {
        // Create new user if doesn't exist
        const newUser = await AuthModel.createUser(email);
        
        // Generate and send OTP
        const otp = this.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); // 1 minute

        await AuthModel.updateUserOTP(newUser.id, otp, otpExpiresAt);
        await sendOTPEmail(email, otp);

        return {
          success: true,
          message: 'OTP sent successfully',
          userId: newUser.id
        };
      } else {
        // User exists, generate new OTP
        const otp = this.generateOTP();
        const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); 

        await AuthModel.updateUserOTP(user.id, otp, otpExpiresAt);
        await sendOTPEmail(email, otp);

        return {
          success: true,
          message: 'OTP sent successfully',
          userId: user.id
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  static async verifyOTP(email: string, otp: string): Promise<any> {
    try {
      // Find user by email
      const user = await AuthModel.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify OTP
      const isOTPValid = await AuthModel.verifyUserOTP(user.id, otp);
      if (!isOTPValid) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check if user has complete profile
      const profile = await AuthModel.getUserProfile(user.id);
      const isProfileComplete = profile && 
        profile.first_name && 
        profile.last_name && 
        profile.contact_number && 
        profile.birth_date && 
        profile.gender && 
        profile.height && 
        profile.weight && 
        profile.emergency_contact_name && 
        profile.emergency_contact_number;

      if (isProfileComplete) {
        // Returning User with Complete Profile , create permanent JWT token
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET!,
          { expiresIn: '30d' }
        );

        return {
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            isProfileComplete: true
          },
          isNewUser: false,
          redirectTo: 'home'
        };
      } else {
        // First time User OR Returning User with Incomplete Profile , create temporary token
        const tempToken = jwt.sign(
          { userId: user.id, email: user.email },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        );

        return {
          success: true,
          message: 'Please complete your profile',
          token: tempToken,
          user: {
            id: user.id,
            email: user.email,
            isProfileComplete: false
          },
          isNewUser: !profile, 
          redirectTo: 'complete-profile'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'OTP verification failed'
      };
    }
  }

  static async resendOTP(email: string): Promise<OTPResult> {
    try {
      // Find user by email
      const user = await AuthModel.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Generate new OTP
      const otp = this.generateOTP();
      const otpExpiresAt = new Date(Date.now() + 1 * 60 * 1000); 

      await AuthModel.updateUserOTP(user.id, otp, otpExpiresAt);
      await sendOTPEmail(email, otp);

      return {
        success: true,
        message: 'OTP sent successfully',
        userId: user.id
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  // Profile Business Logic
  static async createProfile(userId: number, profileData: {
    first_name: string;
    last_name: string;
    contact_number: string;
    birth_date: string;
    gender: string;
    height: number;
    weight: number;
    emergency_contact_name: string;
    emergency_contact_number: string;
    dietary_preference: string;
    calorie_intake_goal: number;
    calorie_burn_goal: number;
  }): Promise<ProfileResult> {
    try {
      // Check if profile is already complete
      const existingProfile = await AuthModel.getUserProfile(userId);
      if (existingProfile && 
          existingProfile.first_name && 
          existingProfile.last_name && 
          existingProfile.contact_number && 
          existingProfile.birth_date && 
          existingProfile.gender && 
          existingProfile.height && 
          existingProfile.weight && 
          existingProfile.emergency_contact_name && 
          existingProfile.emergency_contact_number) {
        return {
          success: false,
          message: 'Profile already exists'
        };
      }

      // Validate business rules
      if (profileData.height <= 0 || profileData.weight <= 0) {
        return {
          success: false,
          message: 'Height and weight must be positive numbers'
        };
      }

      if (profileData.calorie_intake_goal <= 0 || profileData.calorie_burn_goal <= 0) {
        return {
          success: false,
          message: 'Calorie goals must be positive numbers'
        };
      }

      // Create profile
      const profile = await AuthModel.createUserProfile({
        user_id: userId,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        contact_number: profileData.contact_number,
        birth_date: profileData.birth_date,
        gender: profileData.gender,
        height: profileData.height,
        weight: profileData.weight,
        emergency_contact_name: profileData.emergency_contact_name,
        emergency_contact_number: profileData.emergency_contact_number,
        dietary_preference: profileData.dietary_preference,
        calorie_intake_goal: profileData.calorie_intake_goal,
        calorie_burn_goal: profileData.calorie_burn_goal
      });

      // Generate permanent JWT token after profile completion
      const token = jwt.sign(
        { userId: userId, email: profile.email },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      return {
        success: true,
        message: 'Profile created successfully',
        token,
        user: {
          id: userId,
          email: profile.email,
          first_name: profile.first_name,
          last_name: profile.last_name,
          is_profile_complete: true
        },
        profile
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create profile'
      };
    }
  }

  static async getProfile(userId: number): Promise<ProfileResult> {
    try {
      const profile = await AuthModel.getUserProfile(userId);
      if (!profile) {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        profile
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get profile'
      };
    }
  }

  static async updateProfile(userId: number, profileData: Partial<User>): Promise<ProfileResult> {
    try {
      // Check if profile exists
      const existingProfile = await AuthModel.getUserProfile(userId);
      if (!existingProfile) {
        return {
          success: false,
          message: 'Profile not found'
        };
      }

      // Validate business rules
      if (profileData.height && profileData.height <= 0) {
        return {
          success: false,
          message: 'Height must be a positive number'
        };
      }

      if (profileData.weight && profileData.weight <= 0) {
        return {
          success: false,
          message: 'Weight must be a positive number'
        };
      }

      if (profileData.calorie_intake_goal && profileData.calorie_intake_goal <= 0) {
        return {
          success: false,
          message: 'Calorie intake goal must be a positive number'
        };
      }

      if (profileData.calorie_burn_goal && profileData.calorie_burn_goal <= 0) {
        return {
          success: false,
          message: 'Calorie burn goal must be a positive number'
        };
      }

      // Update profile
      const profile = await AuthModel.updateUserProfile(userId, profileData);

      return {
        success: true,
        message: 'Profile updated successfully',
        profile
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }

  // Utility Methods
  private static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async validateToken(token: string): Promise<{ userId: number; email: string } | null> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      return null;
    }
  }
}
