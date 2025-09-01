import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, Surface, HelperText } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/theme';
import authService from '../services/authService';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendOTP = async () => {
    setEmailError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login({ email: email.trim() });
      
      if (response.success) {
        // Navigate to OTP verification screen
        navigation.navigate('OTPVerification', { email: email.trim() });
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to send OTP. Please try again.'
      );
    } finally {
      setLoading(false);
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
            <Text variant="headlineMedium" style={styles.title}>
              Welcome to Care4U 👋
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Enter your email to login
            </Text>
          </View>

          {/* Form */}
          <Surface style={styles.formSurface} elevation={2}>
            <TextInput
              label="Email Address"
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              mode="outlined"
              left={<TextInput.Icon icon="email" />}
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
              error={!!emailError}
              theme={{
                colors: {
                  primary: COLORS.primary,
                  error: COLORS.error,
                  onSurfaceVariant: COLORS.textSecondary,
                },
              }}
            />
            
            {emailError && (
              <HelperText type="error" visible={!!emailError} style={styles.errorText}>
                {emailError}
              </HelperText>
            )}

            <Button
              mode="contained"
              onPress={handleSendOTP}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="email-send"
              theme={{
                colors: {
                  primary: COLORS.primary,
                  onPrimary: COLORS.textLight,
                },
              }}
            >
              Send Verification Code
            </Button>
          </Surface>

          {/* Footer */}
          <View style={styles.footer}>
            <Text variant="bodySmall" style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
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
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20, 
    paddingVertical: 20 * 2, 
  },
  header: {
    alignItems: 'center',
    marginBottom: 20, 
    flex: 1,
    justifyContent: 'center',
    marginTop: 60,
  },
  title: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 80,
    fontWeight: 'bold',
  },
  subtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formSurface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    marginHorizontal: 8,
  },
  textInput: {
    marginBottom: 20,
    backgroundColor: COLORS.background,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  button: {
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
    minHeight: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    marginBottom: 16,
  },
  footer: {
    marginTop: 20 * 2, 
  },
  footerText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;

