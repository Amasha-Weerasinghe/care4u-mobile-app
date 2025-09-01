import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  SegmentedButtons,
  HelperText,
  IconButton,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import sugarService, { CreateSugarRecordRequest } from '../../services/sugarService';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';
import { COLORS } from '../../constants/theme';

type MealType = 'breakfast' | 'lunch' | 'dinner';

const RecordBloodSugarScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mealType, setMealType] = useState<MealType>('breakfast');
  const [bloodSugarValue, setBloodSugarValue] = useState('');
  const [bloodSugarError, setBloodSugarError] = useState('');

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateConfirm = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  // Validate blood sugar value
  const validateBloodSugar = (value: string): boolean => {
    const numValue = parseInt(value);
    if (!value.trim()) {
      setBloodSugarError('Blood sugar value is required');
      return false;
    }
    if (isNaN(numValue) || numValue <= 0 || numValue > 1000) {
      setBloodSugarError('Blood sugar value must be between 1 and 1000 mg/dL');
      return false;
    }
    setBloodSugarError('');
    return true;
  };

  // Handle blood sugar value change
  const handleBloodSugarChange = (value: string) => {
    setBloodSugarValue(value);
    if (bloodSugarError) {
      validateBloodSugar(value);
    }
  };

  // Save blood sugar record
  const handleSave = async () => {
    if (!validateBloodSugar(bloodSugarValue)) {
      return;
    }

    setLoading(true);
    try {
      const recordData: CreateSugarRecordRequest = {
        meal_type: mealType,
        blood_sugar_value: parseInt(bloodSugarValue),
        record_date: formatDate(selectedDate),
      };

      const response = await sugarService.createSugarRecord(recordData);
      
      Alert.alert(
        'Success',
        response.message,
        [
          {
            text: 'OK',
            onPress: () => {
              setBloodSugarValue('');
              setBloodSugarError('');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error saving blood sugar record:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save blood sugar record',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Get blood sugar status color
  const getBloodSugarStatusColor = (value: number): string => {
    if (value < 70) return '#FF6B6B'; // Low
    if (value < 100) return '#4CAF50'; // Normal
    if (value < 126) return '#FF9800'; // Elevated
    if (value < 200) return '#F44336'; // High
    return '#9C27B0'; // Very High
  };

  const bloodSugarNum = parseInt(bloodSugarValue) || 0;
  const statusColor = bloodSugarNum > 0 ? getBloodSugarStatusColor(bloodSugarNum) : COLORS.primary;

  // Handle back press with discard confirmation
  const handleBackPress = () => {
    if (bloodSugarValue.trim()) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved blood sugar value. Are you sure you want to discard it?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={handleBackPress}
          iconColor={COLORS.primary}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Record Blood Sugar
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Card.Content>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Date
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
                icon="calendar"
              >
                {formatDate(selectedDate)}
              </Button>
            </View>

            {/* Meal Type Selection */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Meal Type
              </Text>
              <SegmentedButtons
                value={mealType}
                onValueChange={setMealType as (value: string) => void}
                buttons={[
                  { value: 'breakfast', label: 'Breakfast' },
                  { value: 'lunch', label: 'Lunch' },
                  { value: 'dinner', label: 'Dinner' },
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Blood Sugar Value Input */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Blood Sugar Value (mg/dL)
              </Text>
              <TextInput
                mode="outlined"
                value={bloodSugarValue}
                onChangeText={handleBloodSugarChange}
                keyboardType="numeric"
                placeholder="Enter blood sugar value"
                style={[
                  styles.input,
                  { borderColor: statusColor }
                ]}
                right={
                  bloodSugarNum > 0 ? (
                    <TextInput.Icon
                      icon="test-tube"
                      color={statusColor}
                    />
                  ) : undefined
                }
              />
              <HelperText type="error" visible={!!bloodSugarError}>
                {bloodSugarError}
              </HelperText>
              
              {/* Blood Sugar Status Indicator */}
              {bloodSugarNum > 0 && (
                <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
                  <Text style={styles.statusText}>
                    {bloodSugarNum < 70 ? 'Low' :
                     bloodSugarNum < 100 ? 'Normal' :
                     bloodSugarNum < 126 ? 'Elevated' :
                     bloodSugarNum < 200 ? 'High' : 'Very High'}
                  </Text>
                </View>
              )}
            </View>

            {/* Save Button */}
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={loading || !bloodSugarValue.trim()}
              style={styles.saveButton}
              loading={loading}
            >
              {loading ? 'Saving...' : 'Save Blood Sugar Record'}
            </Button>
          </Card.Content>
        </Card>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={handleDateConfirm}
            maximumDate={new Date()}
          />
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {loading && <PaperActivityIndicator />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 40,
    backgroundColor: COLORS.white,
  },
  headerTitle: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 8,
    color: COLORS.text,
    fontWeight: '600',
  },
  dateButton: {
    marginTop: 8,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  input: {
    marginTop: 8,
  },
  statusIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
});

export default RecordBloodSugarScreen;
