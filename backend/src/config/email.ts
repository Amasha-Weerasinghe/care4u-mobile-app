import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';

const envFile = process.env.NODE_ENV === 'production' ? '.env.prod' : '.env';
dotenv.config({ path: path.join(__dirname, '../../', envFile) });

// Create transporter with production-optimized settings
const createTransporter = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const baseConfig = {
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  };

  if (isProduction) {
    return nodemailer.createTransport({
      ...baseConfig,
      // Production settings with better timeout handling
      connectionTimeout: 60000, // 60 seconds
      greetingTimeout: 30000,   // 30 seconds
      socketTimeout: 60000,     // 60 seconds
      // Connection pooling for better performance
      pool: true,
      maxConnections: 3, // Reduced for production stability
      maxMessages: 50,
      rateDelta: 30000, // 30 seconds
      rateLimit: 3, // max 3 emails per rateDelta
      // Additional production settings
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    });
  } else {
    return nodemailer.createTransport({
      ...baseConfig,
      // Development settings
      connectionTimeout: 30000,
      greetingTimeout: 15000,
      socketTimeout: 30000
    });
  }
};

const transporter = createTransporter();

export const sendOTPEmail = async (email: string, otp: string, retryCount = 0): Promise<boolean> => {
  const mailOptions = {
    from: process.env.FROM_EMAIL,
    to: email,
    subject: 'Your Care4U App Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h1 style="color: #333; text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 20px;">
          <span style="color: #1875C3;">Care</span><span style="color: #1875C3;">4U</span>
        </h1>
        <div style="background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 25px; margin-bottom: 20px;">
          <p style="color: #333; font-size: 16px; margin-bottom: 15px;">Your verification code is shown below. Please enter it in the Care4U mobile app to complete your sign-in.</p>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 15px auto; max-width: 200px;">
            <h1 style="color: #1875C3; font-size: 32px; margin: 0; font-weight: bold; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="color: #333; font-size: 14px; margin-bottom: 0;">If you did not try to log in, you can safely ignore this email.</p>
        </div>
        <p style="color: #333; font-size: 11px; text-align: center; margin-top: 20px;">© 2025 Care4U™. All Rights Reserved.</p>
      </div>
    `
  };

  try {
    // Verify connection before sending
    await transporter.verify();
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return true;
  } catch (error: any) {
    console.error('Error sending email (attempt', retryCount + 1, '):', error);
    
    // Retry logic for connection timeouts
    if (error.code === 'ETIMEDOUT' && retryCount < 2) {
      console.log('Retrying email send in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return sendOTPEmail(email, otp, retryCount + 1);
    }
    
    // Log specific error details
    if (error.code === 'ETIMEDOUT') {
      console.error('Email connection timeout after 3 attempts');
    } else if (error.code === 'EAUTH') {
      console.error('Email authentication failed - check Gmail credentials');
    } else {
      console.error('Email sending failed:', error.message);
    }
    
    return false;
  }
};

export default transporter;
