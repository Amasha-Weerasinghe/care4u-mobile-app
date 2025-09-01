import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { TextInput, Button, Text, Surface, HelperText, SegmentedButtons, IconButton } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/theme';
import authService from '../services/authService';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    dietary_preference: 'veg' as 'veg' | 'non-veg',
    birth_date: '',
    gender: 'male' as 'male' | 'female' | 'other',
    emergency_contact_number: '',
    emergency_contact_name: '',
    contact_number: '',
    height: '',
    weight: '',
    bmi: 0,
    calorie_intake_goal: '',
    calorie_burn_goal: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await authService.getUser();

      if (response.success) {
        const user = response.profile;

        // Format birth date
        let formattedBirthDate = '';
        if (user.birth_date) {
          const date = new Date(user.birth_date);
          formattedBirthDate = date.toISOString().split('T')[0];
        }
        
        setUserData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          dietary_preference: user.dietary_preference || 'veg',
          birth_date: formattedBirthDate,
          gender: user.gender || 'male',
          emergency_contact_number: user.emergency_contact_number || '',
          emergency_contact_name: user.emergency_contact_name || '',
          contact_number: user.contact_number || '',
          height: user.height ? user.height.toString() : '',
          weight: user.weight ? user.weight.toString() : '',
          bmi: user.bmi || 0,
          calorie_intake_goal: user.calorie_intake_goal ? user.calorie_intake_goal.toString() : '',
          calorie_burn_goal: user.calorie_burn_goal ? user.calorie_burn_goal.toString() : '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Format validation functions
  const validatePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone) ? '' : 'Please enter a valid 10-digit phone number';
  };

  const validateNumber = (value: string, fieldName: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return '';
  };

  const validateCalorieIntakeGoal = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < 1500 || num > 3500) {
      return 'Daily calorie intake goal must be between 1,500 and 3,500 kcal';
    }
    return '';
  };

  const validateCalorieBurnGoal = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < 200 || num > 1000) {
      return 'Daily calorie burn goal must be between 200 and 1,000 kcal';
    }
    return '';
  };

  const validateHeight = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < 100 || num > 250) {
      return 'Height must be between 100cm and 250cm';
    }
    return '';
  };

  const validateWeight = (value: string): string => {
    if (!value) return '';
    const num = parseFloat(value);
    if (isNaN(num) || num < 30 || num > 300) {
      return 'Weight must be between 30kg and 300kg';
    }
    return '';
  };

  const validateName = (name: string): string => {
    if (!name) return '';
    if (name.length < 2) {
      return 'Name must be at least 2 characters long';
    }
    return '';
  };

  const validateFullName = (name: string): string => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (words.length < 2) {
      return 'Please enter first and last name';
    }
    if (words.some(word => word.length < 2)) {
      return 'Each name part must be at least 2 characters';
    }
    return '';
  };

  const updateFormData = (field: string, value: string) => {
    setUserData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Real-time validation for contact numbers
    if (field === 'contact_number' || field === 'emergency_contact_number') {
      // Check if both numbers are the same
      const contactNumber = field === 'contact_number' ? value : userData.contact_number;
      const emergencyNumber = field === 'emergency_contact_number' ? value : userData.emergency_contact_number;
      
      if (contactNumber && emergencyNumber && contactNumber === emergencyNumber) {
        setErrors(prev => ({
          ...prev,
          contact_number: 'Your Contact Number and Emergency Contact Number cannot be the same',
          emergency_contact_number: 'Your Contact Number and Emergency Contact Number cannot be the same'
        }));
      } else {
        // Clear the duplicate number error if numbers are different
        setErrors(prev => {
          const newErrors = { ...prev };
          if (newErrors.contact_number === 'Your Contact Number and Emergency Contact Number cannot be the same') {
            delete newErrors.contact_number;
          }
          if (newErrors.emergency_contact_number === 'Your Contact Number and Emergency Contact Number cannot be the same') {
            delete newErrors.emergency_contact_number;
          }
          return newErrors;
        });
      }
    }
    
    // Auto-calculate BMI when height or weight changes
    if (field === 'height' || field === 'weight') {
      const height = field === 'height' ? value : userData.height;
      const weight = field === 'weight' ? value : userData.weight;
      
      if (height && weight) {
        const heightInMeters = parseFloat(height) / 100;
        const weightInKg = parseFloat(weight);
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        setUserData(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
      }
    }
  };

  const validateField = (field: string, value: string | number) => {
    let error = '';
    const stringValue = String(value);
    
    switch (field) {
      case 'first_name':
      case 'last_name':
        error = validateName(stringValue);
        break;
      case 'contact_number':
        error = validatePhoneNumber(stringValue);
        // Check if contact number is the same as emergency contact number
        if (!error && stringValue && stringValue === userData.emergency_contact_number) {
          error = 'Your Contact Number and Emergency Contact Number cannot be the same';
        }
        break;
      case 'emergency_contact_number':
        error = validatePhoneNumber(stringValue);
        // Check if emergency contact number is the same as contact number
        if (!error && stringValue && stringValue === userData.contact_number) {
          error = 'Your Contact Number and Emergency Contact Number cannot be the same';
        }
        break;
      case 'height':
        error = validateHeight(stringValue);
        break;
      case 'weight':
        error = validateWeight(stringValue);
        break;
      case 'calorie_intake_goal':
        error = validateCalorieIntakeGoal(stringValue);
        break;
      case 'calorie_burn_goal':
        error = validateCalorieBurnGoal(stringValue);
        break;
      case 'emergency_contact_name':
        error = validateFullName(stringValue);
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return error;
  };

  const handleFieldBlur = (field: string, value: string) => {
    validateField(field, value);
  };

  const hasValidationErrors = (): boolean => {
    return Object.values(errors).some(error => error !== '');
  };

  const handleSave = async () => {
    // Validate all fields with content
    const fieldsToValidate = [
      'first_name', 'last_name', 'contact_number', 'emergency_contact_name',
      'emergency_contact_number', 'height', 'weight', 'calorie_intake_goal', 'calorie_burn_goal'
    ];
    
    let hasErrors = false;
    fieldsToValidate.forEach(field => {
      const value = userData[field as keyof typeof userData];
      if (value && validateField(field, value)) {
        hasErrors = true;
      }
    });

    // Additional validation for contact numbers being different
    if (userData.contact_number && userData.emergency_contact_number &&
        userData.contact_number === userData.emergency_contact_number) {
      setErrors(prev => ({
        ...prev,
        contact_number: 'Your Contact Number and Emergency Contact Number cannot be the same',
        emergency_contact_number: 'Your Contact Number and Emergency Contact Number cannot be the same'
      }));
      hasErrors = true;
    }

    if (hasErrors) {
      Alert.alert('Validation Error', 'Please fix the validation errors before saving.');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.updateProfile({
        ...userData,
        birth_date: userData.birth_date,
      });

      if (response.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
        setErrors({});
        await loadUserData();
      } else {
        Alert.alert('Error', response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (isEditing) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setIsEditing(false);
              setErrors({});
              loadUserData(); 
            }
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const toggleEditing = () => {
    if (isEditing) {
      setIsEditing(false);
      setErrors({});
      loadUserData();
    } else {
      setIsEditing(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={handleBack}
            iconColor={COLORS.primary}
          />
          <Text style={styles.headerTitle}>Profile</Text>
          <IconButton
            icon={isEditing ? "close" : "pencil"}
            size={24}
            onPress={toggleEditing}
            iconColor={COLORS.primary}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={styles.profileSurface} elevation={2}>
            {/* Personal Information */}
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="First Name"
                  value={userData.first_name}
                  onChangeText={(value) => updateFormData('first_name', value)}
                  onBlur={() => handleFieldBlur('first_name', userData.first_name)}
                  mode="outlined"
                  disabled={!isEditing}
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.first_name}
                />
                {errors.first_name ? (
                  <HelperText type="error" visible={!!errors.first_name}>
                    {errors.first_name}
                  </HelperText>
                ) : null}
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Last Name"
                  value={userData.last_name}
                  onChangeText={(value) => updateFormData('last_name', value)}
                  onBlur={() => handleFieldBlur('last_name', userData.last_name)}
                  mode="outlined"
                  disabled={!isEditing}
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.last_name}
                />
                {errors.last_name ? (
                  <HelperText type="error" visible={!!errors.last_name}>
                    {errors.last_name}
                  </HelperText>
                ) : null}
              </View>
            </View>

            <TextInput
              label="Contact Number"
              value={userData.contact_number}
              onChangeText={(value) => updateFormData('contact_number', value)}
              onBlur={() => handleFieldBlur('contact_number', userData.contact_number)}
              mode="outlined"
              disabled={!isEditing}
              keyboardType="phone-pad"
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
              error={!!errors.contact_number}
            />
            {errors.contact_number ? (
              <HelperText type="error" visible={!!errors.contact_number}>
                {errors.contact_number}
              </HelperText>
            ) : null}

            <TextInput
              label="Birth Date"
              value={userData.birth_date}
              mode="outlined"
              disabled={true}
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
            />

            {/* Read-only Age and BMI */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.readOnlyLabel}>Age</Text>
                <Text style={styles.readOnlyValue}>{calculateAge(userData.birth_date)} years</Text>
              </View>
              <View style={styles.halfWidth}>
                <Text style={styles.readOnlyLabel}>BMI</Text>
                <Text style={styles.readOnlyValue}>{userData.bmi > 0 ? userData.bmi : 'N/A'}</Text>
              </View>
            </View>

            {/* Health Information */}
            <Text style={styles.sectionTitle}>Health Information</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Height (cm)"
                  value={userData.height}
                  onChangeText={(value) => updateFormData('height', value)}
                  onBlur={() => handleFieldBlur('height', userData.height)}
                  mode="outlined"
                  disabled={!isEditing}
                  keyboardType="numeric"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.height}
                />
                {errors.height ? (
                  <HelperText type="error" visible={!!errors.height}>
                    {errors.height}
                  </HelperText>
                ) : null}
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Weight (kg)"
                  value={userData.weight}
                  onChangeText={(value) => updateFormData('weight', value)}
                  onBlur={() => handleFieldBlur('weight', userData.weight)}
                  mode="outlined"
                  disabled={!isEditing}
                  keyboardType="numeric"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.weight}
                />
                {errors.weight ? (
                  <HelperText type="error" visible={!!errors.weight}>
                    {errors.weight}
                  </HelperText>
                ) : null}
              </View>
            </View>

            <Text style={styles.fieldLabel}>Gender</Text>
            <SegmentedButtons
              value={userData.gender}
              onValueChange={(value) => updateFormData('gender', value)}
              buttons={[
                { value: 'male', label: 'Male', icon: 'gender-male', disabled: !isEditing },
                { value: 'female', label: 'Female', icon: 'gender-female', disabled: !isEditing },
                { value: 'other', label: 'Other', icon: 'account-question', disabled: !isEditing },
              ]}
              style={styles.segmentedButtons}
            />

            <Text style={styles.fieldLabel}>Meal Preference</Text>
            <SegmentedButtons
              value={userData.dietary_preference}
              onValueChange={(value) => updateFormData('dietary_preference', value)}
              buttons={[
                { value: 'veg', label: 'Vegetarian', icon: 'food-apple', disabled: !isEditing },
                { value: 'non-veg', label: 'Non-Vegetarian', icon: 'food-drumstick', disabled: !isEditing },
              ]}
              style={styles.segmentedButtons}
            />

            {/* Calorie Goals Section */}
            <Text style={styles.sectionTitle}>Calorie Goals</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Daily Intake Goal"
                  value={userData.calorie_intake_goal}
                  onChangeText={(value) => updateFormData('calorie_intake_goal', value)}
                  onBlur={() => handleFieldBlur('calorie_intake_goal', userData.calorie_intake_goal)}
                  mode="outlined"
                  disabled={!isEditing}
                  keyboardType="numeric"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.calorie_intake_goal}
                />
                {errors.calorie_intake_goal ? (
                  <HelperText type="error" visible={!!errors.calorie_intake_goal}>
                    {errors.calorie_intake_goal}
                  </HelperText>
                ) : null}
              </View>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Daily Burn Goal"
                  value={userData.calorie_burn_goal}
                  onChangeText={(value) => updateFormData('calorie_burn_goal', value)}
                  onBlur={() => handleFieldBlur('calorie_burn_goal', userData.calorie_burn_goal)}
                  mode="outlined"
                  disabled={!isEditing}
                  keyboardType="numeric"
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  error={!!errors.calorie_burn_goal}
                />
                {errors.calorie_burn_goal ? (
                  <HelperText type="error" visible={!!errors.calorie_burn_goal}>
                    {errors.calorie_burn_goal}
                  </HelperText>
                ) : null}
              </View>
            </View>

            {/* Emergency Contact */}
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            
            <TextInput
              label="Emergency Contact Name"
              value={userData.emergency_contact_name}
              onChangeText={(value) => updateFormData('emergency_contact_name', value)}
              onBlur={() => handleFieldBlur('emergency_contact_name', userData.emergency_contact_name)}
              mode="outlined"
              disabled={!isEditing}
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
              error={!!errors.emergency_contact_name}
            />
            {errors.emergency_contact_name ? (
              <HelperText type="error" visible={!!errors.emergency_contact_name}>
                {errors.emergency_contact_name}
              </HelperText>
            ) : null}

            <TextInput
              label="Emergency Contact Number"
              value={userData.emergency_contact_number}
              onChangeText={(value) => updateFormData('emergency_contact_number', value)}
              onBlur={() => handleFieldBlur('emergency_contact_number', userData.emergency_contact_number)}
              mode="outlined"
              disabled={!isEditing}
              keyboardType="phone-pad"
              style={styles.textInput}
              outlineStyle={styles.inputOutline}
              error={!!errors.emergency_contact_number}
            />
            {errors.emergency_contact_number ? (
              <HelperText type="error" visible={!!errors.emergency_contact_number}>
                {errors.emergency_contact_number}
              </HelperText>
            ) : null}

            {/* Save Button */}
            {isEditing && (
              <Button
                mode="contained"
                onPress={handleSave}
                loading={loading}
                disabled={hasValidationErrors()}
                style={[styles.saveButton, hasValidationErrors() && styles.saveButtonDisabled]}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
                theme={{
                  colors: {
                    primary: COLORS.primary,
                    onPrimary: COLORS.textLight,
                  },
                }}
              >
                Save Changes
              </Button>
            )}
          </Surface>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 24,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 3,
  },
  profileSurface: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
    marginTop: 8,
  },
  textInput: {
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  readOnlyLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  fieldLabel: {
    color: COLORS.text,
    marginBottom: 8,
    marginTop: 8,
    fontWeight: '500',
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    paddingVertical: 8,
    minHeight: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;

