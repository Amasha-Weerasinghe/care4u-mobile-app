import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export const sendOTPEmail = async (email: string, otp: string) => {
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
    const info = await transporter.sendMail(mailOptions);

    return true;
  } catch (error) {
    console.error('Error sending email: ', error);
    return false;
  }
};

export default transporter;
