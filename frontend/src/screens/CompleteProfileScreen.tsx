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
import { TextInput, Button, Text, Surface, HelperText, SegmentedButtons } from 'react-native-paper';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS } from '../constants/theme';
import authService from '../services/authService';

type CompleteProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CompleteProfile'>;
type CompleteProfileScreenRouteProp = RouteProp<RootStackParamList, 'CompleteProfile'>;

interface CompleteProfileScreenProps {
  navigation: CompleteProfileScreenNavigationProp;
  route: CompleteProfileScreenRouteProp;
}

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({ navigation, route }) => {
  const { email, token } = route.params;
  
  const [formData, setFormData] = useState({
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
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Update form validity whenever formData or errors change
  useEffect(() => {
    const valid = isFormComplete();
    setIsFormValid(valid);
  }, [formData, errors]);

  const updateFormData = (field: string, value: string) => {
    let processedValue = value;
    
    // birth date - auto-format with dashes
    if (field === 'birth_date') {
      const numbersOnly = value.replace(/\D/g, '');
      
      if (numbersOnly.length === 0) {
        processedValue = '';
      } else if (numbersOnly.length <= 4) {
        processedValue = numbersOnly;
      } else if (numbersOnly.length <= 6) {
        processedValue = `${numbersOnly.slice(0, 4)}-${numbersOnly.slice(4)}`;
      } else if (numbersOnly.length <= 8) {
        processedValue = `${numbersOnly.slice(0, 4)}-${numbersOnly.slice(4, 6)}-${numbersOnly.slice(6, 8)}`;
      } else {
        processedValue = `${numbersOnly.slice(0, 4)}-${numbersOnly.slice(4, 6)}-${numbersOnly.slice(6, 8)}`;
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    if (processedValue.trim()) {
      let fieldError = '';
      
      // Validate field format when not empty
      switch (field) {
        case 'first_name':
        case 'last_name':
          if (!validateName(processedValue)) {
            fieldError = 'Name can only contain letters - No spaces or numbers';
          }
          break;
        case 'emergency_contact_name':
          if (!validateFullName(processedValue)) {
            fieldError = 'Emergency contact name must contain first and last name (letters and spaces only)';
          }
          break;
        case 'contact_number':
        case 'emergency_contact_number':
          if (!validatePhoneNumber(processedValue)) {
            fieldError = 'Phone number must be 10 digits and start with 0';
          } else {
            // Check if both contact numbers are the same
            const otherNumber = field === 'contact_number' ? formData.emergency_contact_number : formData.contact_number;
            if (processedValue === otherNumber && otherNumber) {
              fieldError = 'Your Contact Number and Emergency Contact Number cannot be the same';
            }
          }
          break;
        case 'birth_date':
          if (!validateDate(processedValue)) {
            fieldError = 'Please enter a valid date - Cannot be a future date';
          }
          break;
        case 'height':
          if (!validateHeight(processedValue)) {
            fieldError = 'Height must be numbers only between 100cm and 250cm';
          }
          break;
        case 'weight':
          if (!validateWeight(processedValue)) {
            fieldError = 'Weight must be numbers only between 30kg and 300kg';
          }
          break;
        case 'calorie_intake_goal':
          if (!validateCalorieIntakeGoal(processedValue)) {
            fieldError = 'Daily calorie intake goal must be between 1,500 and 3,500 kcal';
          }
          break;
        case 'calorie_burn_goal':
          if (!validateCalorieBurnGoal(processedValue)) {
            fieldError = 'Daily calorie burn goal must be between 200 and 1,000 kcal';
          }
          break;
      }
      
      if (fieldError) {
        setErrors(prev => ({ ...prev, [field]: fieldError }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
    
    // Auto-calculate BMI when height or weight changes
    if (field === 'height' || field === 'weight') {
      const height = field === 'height' ? processedValue : formData.height;
      const weight = field === 'weight' ? processedValue : formData.weight;
      
      if (height && weight) {
        const heightInMeters = parseFloat(height) / 100;
        const weightInKg = parseFloat(weight);
        const bmi = weightInKg / (heightInMeters * heightInMeters);
        setFormData(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
      }
    }
  };

  // validate when user leaves a field
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    const value = formData[field as keyof typeof formData];
    const stringValue = String(value);
    let fieldError = '';
    
    // Check for required fields
    if (!value || (typeof value === 'string' && !value.trim())) {
       switch (field) {
         case 'first_name':
           fieldError = 'First name is required';
           break;
         case 'last_name':
           fieldError = 'Last name is required';
           break;
         case 'contact_number':
           fieldError = 'Contact number is required';
           break;
         case 'emergency_contact_name':
           fieldError = 'Emergency Contact Name is required';
           break;
         case 'emergency_contact_number':
           fieldError = 'Emergency Contact Number is required';
           break;
         case 'birth_date':
           fieldError = 'Birth date is required';
           break;
         case 'height':
           fieldError = 'Height is required';
           break;
         case 'weight':
           fieldError = 'Weight is required';
           break;
         case 'calorie_intake_goal':
           fieldError = 'Daily Calorie Intake Goal is required';
           break;
         case 'calorie_burn_goal':
           fieldError = 'Daily Calorie Burn Goal is required';
           break;
       }
     } else {
       // Validate field format when not empty
       switch (field) {
                  case 'first_name':
          case 'last_name':
          if (!validateName(stringValue)) {
               fieldError = 'Name can only contain letters - No spaces or numbers';
             }
             break;
                     case 'emergency_contact_name':
          if (!validateFullName(stringValue)) {
               fieldError = 'Emergency contact name must contain first and last name (letters and spaces only)';
             }
             break;
         case 'contact_number':
         case 'emergency_contact_number':
          if (!validatePhoneNumber(stringValue)) {
             fieldError = 'Phone number must be 10 digits and start with 0';
           } else {
             // Check if both contact numbers are the same
             const otherNumber = field === 'contact_number' ? formData.emergency_contact_number : formData.contact_number;
            if (stringValue === otherNumber && otherNumber) {
                fieldError = 'Your Contact Number and Emergency Contact Number cannot be the same';
              }
           }
           break;
                  case 'birth_date':
          if (!validateDate(stringValue)) {
              fieldError = 'Please enter a valid date - Cannot be a future date';
            }
            break;
         case 'height':
          if (!validateHeight(stringValue)) {
             fieldError = 'Height must be numbers only between 100cm and 250cm';
           }
           break;
         case 'weight':
          if (!validateWeight(stringValue)) {
             fieldError = 'Weight must be numbers only between 30kg and 300kg';
           }
           break;
         case 'calorie_intake_goal':
          if (!validateCalorieIntakeGoal(stringValue)) {
             fieldError = 'Daily calorie intake goal must be between 1,500 and 3,500 kcal';
           }
           break;
         case 'calorie_burn_goal':
          if (!validateCalorieBurnGoal(stringValue)) {
             fieldError = 'Daily calorie burn goal must be between 200 and 1,000 kcal';
           }
           break;
       }
     }
    
    if (fieldError) {
      setErrors(prev => ({ ...prev, [field]: fieldError }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation helper functions
  const validateName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z]+$/;
    return nameRegex.test(name.trim());
  };

  const validateFullName = (name: string): boolean => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    return nameRegex.test(name.trim()) && name.trim().split(' ').length >= 2;
  };

  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^0[0-9]{9}$/;
    return phoneRegex.test(phone.trim());
  };

  const validateDate = (date: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const inputDate = new Date(date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return inputDate <= today;
  };

  const validateHeight = (height: string): boolean => {
    const heightRegex = /^[0-9]+$/;
    if (!heightRegex.test(height)) return false;
    const heightNum = parseFloat(height);
    return heightNum >= 100 && heightNum <= 250; // Adult range: 100cm to 250cm (1.0m to 2.5m)
  };

  const validateWeight = (weight: string): boolean => {
    const weightRegex = /^[0-9]+$/;
    if (!weightRegex.test(weight)) return false;
    const weightNum = parseFloat(weight);
    return weightNum >= 30 && weightNum <= 300; // Adult range: 30kg to 300kg
  };

  const validateCalorieGoal = (calories: string): boolean => {
    const calorieRegex = /^[0-9]+$/;
    if (!calorieRegex.test(calories)) return false;
    const calorieNum = parseFloat(calories);
    return calorieNum >= 100 && calorieNum <= 5000; // 100 to 5000 calories
  };

  const validateCalorieIntakeGoal = (calories: string): boolean => {
    const calorieRegex = /^[0-9]+$/;
    if (!calorieRegex.test(calories)) return false;
    const calorieNum = parseFloat(calories);
    return calorieNum >= 1500 && calorieNum <= 3500; // 1,500-3,500 kcal/day
  };

  const validateCalorieBurnGoal = (calories: string): boolean => {
    const calorieRegex = /^[0-9]+$/;
    if (!calorieRegex.test(calories)) return false;
    const calorieNum = parseFloat(calories);
    return calorieNum >= 200 && calorieNum <= 1000; // 200-1,000 kcal/day
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // First Name validation
    if (!formData.first_name.trim()) {
              newErrors.first_name = 'First Name is required';
         } else if (!validateName(formData.first_name)) {
       newErrors.first_name = 'First name can only contain letters - No spaces or numbers';
     }

    // Last Name validation
    if (!formData.last_name.trim()) {
              newErrors.last_name = 'Last Name is required';
         } else if (!validateName(formData.last_name)) {
       newErrors.last_name = 'Last name can only contain letters - No spaces or numbers';
     }

    // Contact Number validation
    if (!formData.contact_number.trim()) {
              newErrors.contact_number = 'Contact Number is required';
    } else if (!validatePhoneNumber(formData.contact_number)) {
      newErrors.contact_number = 'Contact number must be 10 digits and start with 0';
    } else if (formData.contact_number === formData.emergency_contact_number && formData.emergency_contact_number) {
      newErrors.contact_number = 'Your Contact Number and Emergency Contact Number cannot be the same';
    }

    // Emergency Contact Name validation
    if (!formData.emergency_contact_name.trim()) {
      newErrors.emergency_contact_name = 'Emergency Contact Name is required';
         } else if (!validateFullName(formData.emergency_contact_name)) {
       newErrors.emergency_contact_name = 'Emergency contact name must contain first and last name (letters and spaces only)';
     }

    // Emergency Contact Number validation
    if (!formData.emergency_contact_number.trim()) {
      newErrors.emergency_contact_number = 'Emergency Contact Number is required';
    } else if (!validatePhoneNumber(formData.emergency_contact_number)) {
      newErrors.emergency_contact_number = 'Emergency contact number must be 10 digits and start with 0';
    } else if (formData.emergency_contact_number === formData.contact_number && formData.contact_number) {
      newErrors.emergency_contact_number = 'Your Contact Number and Emergency Contact Number cannot be the same';
    }

    // Birth Date validation
    if (!formData.birth_date) {
              newErrors.birth_date = 'Birth Date is required';
    } else if (!validateDate(formData.birth_date)) {
      newErrors.birth_date = 'Please enter a valid date - Cannot be a future date';
    }

    // Height validation
    if (!formData.height.trim()) {
              newErrors.height = 'Height is required';
         } else if (!validateHeight(formData.height)) {
       newErrors.height = 'Height must be numbers only between 100cm and 250cm';
     }

    // Weight validation
    if (!formData.weight.trim()) {
              newErrors.weight = 'Weight is required';
         } else if (!validateWeight(formData.weight)) {
       newErrors.weight = 'Weight must be numbers only between 30kg and 300kg';
     }

    // Calorie Intake Goal validation
    if (!formData.calorie_intake_goal.trim()) {
      newErrors.calorie_intake_goal = 'Daily Calorie Intake Goal is required';
    } else if (!validateCalorieIntakeGoal(formData.calorie_intake_goal)) {
      newErrors.calorie_intake_goal = 'Daily calorie intake goal must be between 1,500 and 3,500 kcal';
    }

    // Calorie Burn Goal validation
    if (!formData.calorie_burn_goal.trim()) {
      newErrors.calorie_burn_goal = 'Daily Calorie Burn Goal is required';
    } else if (!validateCalorieBurnGoal(formData.calorie_burn_goal)) {
      newErrors.calorie_burn_goal = 'Daily calorie burn goal must be between 200 and 1,000 kcal';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if all required fields are filled and valid
  const isFormComplete = (): boolean => {
    const requiredFields = [
      'first_name',
      'last_name',
      'contact_number',
      'birth_date',
      'emergency_contact_name',
      'emergency_contact_number',
      'height',
      'weight'
    ];

    // Check if all required fields have values
    for (const field of requiredFields) {
      const value = formData[field as keyof typeof formData];
      if (!value || (typeof value === 'string' && !value.trim())) {
        return false;
      }
    }

    // Check if all fields pass validation
    const validationChecks = [
      validateName(formData.first_name),
      validateName(formData.last_name),
      validatePhoneNumber(formData.contact_number),
      validateDate(formData.birth_date),
      validateFullName(formData.emergency_contact_name),
      validatePhoneNumber(formData.emergency_contact_number),
      validateHeight(formData.height),
      validateWeight(formData.weight)
    ];

    // Check if contact numbers are different
    const contactNumbersAreDifferent = formData.contact_number !== formData.emergency_contact_number;

    return validationChecks.every(check => check === true) && contactNumbersAreDifferent;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authService.completeProfile({
        ...formData,
        birth_date: formData.birth_date,
      });

      if (response.success) {
        // Store the permanent token
        await authService.setAuthToken(response.token);
        await authService.setUserData(response.user);

        Alert.alert(
          'Success',
          'Profile completed successfully!',
          [
            {
              text: 'OK',
              onPress: () => navigation.replace('MainTabs'),
            },
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to complete profile');
      }
    } catch (error: any) {
      console.error('Profile completion error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to complete profile. Please try again.'
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
            <Text variant="headlineLarge" style={styles.title}>
              Complete Your Profile
            </Text>
            <Text variant="bodyLarge" style={styles.subtitle}>
              Please provide your details to complete your account setup
            </Text>
          </View>

          {/* Form */}
          <Surface style={styles.formSurface} elevation={2}>
                         <TextInput
               label="First Name *"
               placeholder="Enter your first name"
               value={formData.first_name}
               onChangeText={(value) => updateFormData('first_name', value)}
               onBlur={() => handleFieldBlur('first_name')}
               mode="outlined"
               left={<TextInput.Icon icon="account" />}
               style={styles.textInput}
               outlineStyle={styles.inputOutline}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurfaceVariant: COLORS.textSecondary,
                 },
               }}
             />
            <HelperText type="error" visible={!!(errors.first_name && touchedFields.first_name)}>
              {errors.first_name}
            </HelperText>

                         <TextInput
               label="Last Name *"
               placeholder="Enter your last name"
               value={formData.last_name}
               onChangeText={(value) => updateFormData('last_name', value)}
               onBlur={() => handleFieldBlur('last_name')}
               mode="outlined"
               left={<TextInput.Icon icon="account" />}
               style={styles.textInput}
               outlineStyle={styles.inputOutline}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurfaceVariant: COLORS.textSecondary,
                 },
               }}
             />
            <HelperText type="error" visible={!!(errors.last_name && touchedFields.last_name)}>
              {errors.last_name}
            </HelperText>

                         <TextInput
               label="Contact Number *"
               placeholder="Enter your contact number"
               value={formData.contact_number}
               onChangeText={(value) => updateFormData('contact_number', value)}
               onBlur={() => handleFieldBlur('contact_number')}
               keyboardType="phone-pad"
               mode="outlined"
               left={<TextInput.Icon icon="phone" />}
               style={styles.textInput}
               outlineStyle={styles.inputOutline}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurfaceVariant: COLORS.textSecondary,
                 },
               }}
             />
            <HelperText type="error" visible={!!(errors.contact_number && touchedFields.contact_number)}>
              {errors.contact_number}
            </HelperText>

                         <TextInput
               label="Birth Date *"
               placeholder="YYYYMMDD (e.g., 20010228)"
               value={formData.birth_date}
               onChangeText={(value) => updateFormData('birth_date', value)}
               onBlur={() => handleFieldBlur('birth_date')}
               keyboardType="numeric"
               mode="outlined"
               left={<TextInput.Icon icon="calendar" />}
               style={styles.textInput}
               outlineStyle={styles.inputOutline}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurfaceVariant: COLORS.textSecondary,
                 },
               }}
             />
            <HelperText type="error" visible={!!(errors.birth_date && touchedFields.birth_date)}>
              {errors.birth_date}
            </HelperText>

            {/* Height and Weight Section */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                                 <TextInput
                   label="Height (cm) *"
                   placeholder="170"
                   value={formData.height}
                   onChangeText={(value) => updateFormData('height', value)}
                   onBlur={() => handleFieldBlur('height')}
                   keyboardType="numeric"
                   mode="outlined"
                   left={<TextInput.Icon icon="ruler" />}
                   style={styles.textInput}
                   outlineStyle={styles.inputOutline}
                   theme={{
                     colors: {
                       primary: COLORS.primary,
                       onSurfaceVariant: COLORS.textSecondary,
                     },
                   }}
                 />
                <HelperText type="error" visible={!!(errors.height && touchedFields.height)}>
                  {errors.height}
                </HelperText>
              </View>

              <View style={styles.halfWidth}>
                                 <TextInput
                   label="Weight (kg) *"
                   placeholder="70"
                   value={formData.weight}
                   onChangeText={(value) => updateFormData('weight', value)}
                   onBlur={() => handleFieldBlur('weight')}
                   keyboardType="numeric"
                   mode="outlined"
                   left={<TextInput.Icon icon="scale" />}
                   style={styles.textInput}
                   outlineStyle={styles.inputOutline}
                   theme={{
                     colors: {
                       primary: COLORS.primary,
                       onSurfaceVariant: COLORS.textSecondary,
                     },
                   }}
                 />
                <HelperText type="error" visible={!!(errors.weight && touchedFields.weight)}>
                  {errors.weight}
                </HelperText>
              </View>
            </View>

            {/* BMI Display */}
            {formData.bmi > 0 && (
              <View style={styles.bmiContainer}>
                <Text variant="bodyMedium" style={styles.bmiLabel}>
                  Your BMI: <Text style={styles.bmiValue}>{formData.bmi}</Text>
                </Text>
                <Text variant="bodySmall" style={styles.bmiCategory}>
                                  {formData.bmi < 18.5 ? 'Underweight' :
                 formData.bmi < 25 ? 'Normal weight' :
                 formData.bmi < 30 ? 'Overweight' : 'Obese'}
                </Text>
              </View>
            )}

            {/* Calorie Goals Section */}
            <Text variant="bodyMedium" style={styles.fieldLabel}>Daily Calorie Goals</Text>
            
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <TextInput
                  label="Daily Intake"
                  placeholder="2000"
                  value={formData.calorie_intake_goal}
                  onChangeText={(value) => updateFormData('calorie_intake_goal', value)}
                  onBlur={() => handleFieldBlur('calorie_intake_goal')}
                  keyboardType="numeric"
                  mode="outlined"
                  left={<TextInput.Icon icon="food-apple" />}
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  theme={{
                    colors: {
                      primary: COLORS.primary,
                      onSurfaceVariant: COLORS.textSecondary,
                    },
                  }}
                />
                <HelperText type="error" visible={!!(errors.calorie_intake_goal && touchedFields.calorie_intake_goal)}>
                  {errors.calorie_intake_goal}
                </HelperText>
              </View>

              <View style={styles.halfWidth}>
                <TextInput
                  label="Daily Burn"
                  placeholder="500"
                  value={formData.calorie_burn_goal}
                  onChangeText={(value) => updateFormData('calorie_burn_goal', value)}
                  onBlur={() => handleFieldBlur('calorie_burn_goal')}
                  keyboardType="numeric"
                  mode="outlined"
                  left={<TextInput.Icon icon="fire" />}
                  style={styles.textInput}
                  outlineStyle={styles.inputOutline}
                  theme={{
                    colors: {
                      primary: COLORS.primary,
                      onSurfaceVariant: COLORS.textSecondary,
                    },
                  }}
                />
                <HelperText type="error" visible={!!(errors.calorie_burn_goal && touchedFields.calorie_burn_goal)}>
                  {errors.calorie_burn_goal}
                </HelperText>
              </View>
            </View>



            {/* Gender Selection */}
            <Text variant="bodyMedium" style={styles.fieldLabel}>Gender</Text>
                         <SegmentedButtons
               value={formData.gender}
               onValueChange={(value) => updateFormData('gender', value)}
               buttons={[
                 { value: 'male', label: 'Male', icon: 'gender-male' },
                 { value: 'female', label: 'Female', icon: 'gender-female' },
                 { value: 'other', label: 'Other', icon: 'account-question' },
               ]}
               style={styles.segmentedButtons}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurface: COLORS.textSecondary,
                 },
               }}
             />

            {/* Dietary Preference */}
            <Text variant="bodyMedium" style={styles.fieldLabel}>Meal Preference</Text>
            <SegmentedButtons
              value={formData.dietary_preference}
              onValueChange={(value) => updateFormData('dietary_preference', value)}
              buttons={[
                { value: 'veg', label: 'Vegetarian', icon: 'food-apple' },
                { value: 'non-veg', label: 'Non-Vegetarian', icon: 'food-drumstick' },
              ]}
              style={styles.segmentedButtons}
              theme={{
                colors: {
                  primary: COLORS.primary,
                  onSurface: COLORS.textSecondary,
                },
              }}
            />

                         <TextInput
               label="Emergency Contact Name *"
               placeholder="Enter emergency contact name"
               value={formData.emergency_contact_name}
               onChangeText={(value) => updateFormData('emergency_contact_name', value)}
               onBlur={() => handleFieldBlur('emergency_contact_name')}
               mode="outlined"
               left={<TextInput.Icon icon="account-alert" />}
               style={styles.textInput}
               outlineStyle={styles.inputOutline}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurfaceVariant: COLORS.textSecondary,
                 },
               }}
             />
            <HelperText type="error" visible={!!(errors.emergency_contact_name && touchedFields.emergency_contact_name)}>
              {errors.emergency_contact_name}
            </HelperText>

                         <TextInput
               label="Emergency Contact Number *"
               placeholder="Enter emergency contact number"
               value={formData.emergency_contact_number}
               onChangeText={(value) => updateFormData('emergency_contact_number', value)}
               onBlur={() => handleFieldBlur('emergency_contact_number')}
               keyboardType="phone-pad"
               mode="outlined"
               left={<TextInput.Icon icon="phone-alert" />}
               style={styles.textInput}
               outlineStyle={styles.inputOutline}
               theme={{
                 colors: {
                   primary: COLORS.primary,
                   onSurfaceVariant: COLORS.textSecondary,
                 },
               }}
             />
            <HelperText type="error" visible={!!(errors.emergency_contact_number && touchedFields.emergency_contact_number)}>
              {errors.emergency_contact_number}
            </HelperText>

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading || !isFormValid}
              style={styles.button}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="account-check"
              theme={{
                colors: {
                  primary: COLORS.primary,
                  onPrimary: COLORS.textLight,
                },
              }}
            >
              Complete Profile
            </Button>
            
            
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
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
    marginBottom: 30,
  },
  textInput: {
    marginBottom: 8,
    backgroundColor: COLORS.background,
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  button: {
    marginTop: 20,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
    minHeight: 48,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  bmiContainer: {
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  bmiLabel: {
    color: COLORS.text,
    marginBottom: 4,
  },
  bmiValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 18,
  },
  bmiCategory: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
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
});

export default CompleteProfileScreen;

