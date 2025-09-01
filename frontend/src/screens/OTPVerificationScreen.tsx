import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/theme';
import CustomButton from '../components/CustomButton';
import authService from '../services/authService';

type OTPVerificationScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OTPVerification'>;
type OTPVerificationScreenRouteProp = RouteProp<RootStackParamList, 'OTPVerification'>;

interface OTPVerificationScreenProps {
  navigation: OTPVerificationScreenNavigationProp;
  route: OTPVerificationScreenRouteProp;
}

const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({ navigation, route }) => {
  const { email } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Initialize countdown when screen loads
    setCountdown(60);
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

   
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit code');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.verifyOTP({
        email,
        otp: otpString,
      });

      if (response.success) {
        // Store the token
        await authService.setAuthToken(response.token);

        //  3 user flow cases 
        if (response.redirectTo === 'complete-profile') {
          // Case 1 & 2: New user or incomplete profile
          navigation.replace('CompleteProfile', {
            email,
            token: response.token,
          });
        } else if (response.redirectTo === 'home') {
          // Case 3: Complete profile - go to home
          navigation.replace('MainTabs');
        } else {

          if (response.isNewUser) {
            navigation.replace('CompleteProfile', {
              email,
              token: response.token,
            });
          } else {
            navigation.replace('MainTabs');
          }
        }
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to verify OTP. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const response = await authService.login({ email });
      
      if (response.success) {
        Alert.alert('Success', 'New verification code sent to your email');
        setCountdown(60);
        // Clear the already entered OTP
        setOtp(['', '', '', '', '', '']);
        
        inputRefs.current[0]?.focus();
      } else {
        Alert.alert('Error', response.message || 'Failed to resend OTP');
      }
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to resend OTP. Please try again.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.email}>{email}</Text>
          </View>

          {/* Code Expiration Timer */}
          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Code expires in:</Text>
            <Text style={styles.timerValue}>
              {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
            </Text>
          </View>

          {/* OTP Input Card */}
          <View style={styles.otpCard}>
            <Text style={styles.otpLabel}>Enter Verification Code</Text>
            <View style={styles.otpInputs}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref!)}
                  style={styles.otpInput}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  autoFocus={index === 0}
                />
              ))}
            </View>
          </View>

          {/* Action Buttons Card */}
          <View style={styles.buttonCard}>
            <TouchableOpacity
              style={[
                styles.verifyButton,
                (loading || otp.join('').length !== 6 || countdown === 0) && styles.disabledButton
              ]}
              onPress={handleVerifyOTP}
              disabled={loading || otp.join('').length !== 6 || countdown === 0}
            >
              <View style={styles.verifyButtonContent}>
                <View style={styles.checkmarkCircle}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={[
                  styles.verifyButtonText,
                  (loading || otp.join('').length !== 6 || countdown === 0) && styles.disabledButtonText
                ]}>Verify Code</Text>
              </View>
            </TouchableOpacity>

            <CustomButton
              title={
                countdown > 0
                  ? `? Resend Code (${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')})`
                  : '? Resend Code'
              }
              onPress={handleResendOTP}
              loading={resendLoading}
              disabled={resendLoading || countdown > 0}
              variant="outline"
              style={styles.resendButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Didn't receive the code? Check your spam folder or try resending.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', 
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    textAlign: 'center',
  },
  timerContainer: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 160,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timerLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timerValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  otpCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  otpLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  otpInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  otpInput: {
    width: 44,
    height: 44,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#2563EB',
    borderRadius: 8,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
    backgroundColor: COLORS.background,
  },
  buttonCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  verifyButton: {
    marginBottom: 16,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  verifyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkmarkText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: 'bold',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.background,
  },
  disabledButton: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.6,
  },
  disabledButtonText: {
    color: COLORS.textSecondary,
  },
  resendButton: {
    marginBottom: 16,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  enabledResendButton: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  footer: {
    marginTop: 16,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default OTPVerificationScreen;

