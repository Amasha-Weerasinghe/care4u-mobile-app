import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, IconButton, Card } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import { useAppointments } from '../../contexts/AppointmentContext';

const AppointmentDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();
  const { addAppointment, updateAppointment, loading } = useAppointments();
  
  // Check if we're editing an existing appointment or copying from past appointment
  const appointmentToEdit = (route.params as any)?.appointmentToEdit;
  const appointmentToCopy = (route.params as any)?.appointmentToCopy;
  const isEditing = !!appointmentToEdit;
  const isCopying = !!appointmentToCopy;
  
  const parseTimeToDate = (timeString: string): Date => {
    const timeMatch = timeString.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!timeMatch) return new Date();
    
    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  // initial values based on editing, copying, or creating new
  const getInitialTitle = () => {
    if (appointmentToEdit) return appointmentToEdit.title;
    if (appointmentToCopy) return appointmentToCopy.title;
    return '';
  };

  const getInitialDate = () => {
    if (appointmentToEdit) return new Date(appointmentToEdit.date);
    if (appointmentToCopy) {
      // For copied appointments, set to tomorrow to ensure it's in the future
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
    return new Date();
  };

  const getInitialTime = () => {
    if (appointmentToEdit) return parseTimeToDate(appointmentToEdit.time);
    if (appointmentToCopy) return parseTimeToDate(appointmentToCopy.time);
    return new Date();
  };

  const getInitialLocation = () => {
    if (appointmentToEdit) return appointmentToEdit.location;
    if (appointmentToCopy) return appointmentToCopy.location;
    return '';
  };

  const getInitialNotes = () => {
    if (appointmentToEdit) return appointmentToEdit.notes;
    if (appointmentToCopy) return appointmentToCopy.notes;
    return '';
  };

  const [title, setTitle] = useState(getInitialTitle());
  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [selectedTime, setSelectedTime] = useState(getInitialTime());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState(getInitialLocation());
  const [notes, setNotes] = useState(getInitialNotes());

  // Format date for display
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Format time for display
  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Handle date selection
  const handleDateConfirm = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  // Handle time selection
  const handleTimeConfirm = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setSelectedTime(selectedTime);
    }
  };

  // Handle back press with discard confirmation
  const handleBackPress = () => {
    if (title.trim() || location.trim() || notes.trim()) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
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

  const handleSave = async () => {
    if (!title?.trim()) {
      Alert.alert('Error', 'Please enter an appointment title');
      return;
    }

    try {
      if (isEditing) {
        // Update existing appointment
        const updates = {
          title: title.trim(),
          date: formatDate(selectedDate),
          time: formatTime(selectedTime),
          location: location?.trim() || '',
          notes: notes?.trim() || ''
        };

        // Update appointment in context
        await updateAppointment(appointmentToEdit.id, updates);
      } else {
        // Create new appointment (from scratch or copied from past appointment)
        const newAppointment = {
          title: title.trim(),
          date: formatDate(selectedDate),
          time: formatTime(selectedTime),
          location: location?.trim() || '',
          notes: notes?.trim() || ''
        };

        // Add appointment to context
        await addAppointment(newAppointment);
      }
      (navigation as any).goBack();
    } catch (error) {
      console.error('Appointment save failed:', error instanceof Error ? error.message : 'Unknown error');
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save appointment');
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
           {isEditing ? 'Edit Appointment' : isCopying ? 'New Appointment' : 'Appointment Details'}
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
              {/* Copy indicator */}
              {isCopying && (
                <View style={styles.copyIndicator}>
                  <Text style={styles.copyIndicatorText}>
                    Copying from past appointments. Choose your next date
                  </Text>
                </View>
              )}
              
              {/* Title */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Title *
                </Text>
                <TextInput
                  mode="outlined"
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter appointment title"
                  style={styles.input}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                />
              </View>

              {/* Date Selection */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Date *
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

              {/* Time Selection */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Time *
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setShowTimePicker(true)}
                  style={styles.dateButton}
                  icon="clock"
                >
                  {formatTime(selectedTime)}
                </Button>
              </View>

              {/* Location */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Location
                </Text>
                <TextInput
                  mode="outlined"
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter location"
                  style={styles.input}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                />
              </View>

              {/* Notes */}
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Notes
                </Text>
                <TextInput
                  mode="outlined"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any additional notes"
                  style={styles.input}
                  outlineColor={COLORS.border}
                  activeOutlineColor={COLORS.primary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Create Button */}
               <Button
                 mode="contained"
                 onPress={handleSave}
                 disabled={!title.trim() || loading}
                 style={styles.saveButton}
                 buttonColor={COLORS.primary}
                 textColor={COLORS.white}
                 loading={loading}
               >
                 {isEditing ? 'Update Appointment' : isCopying ? 'Create New Appointment' : 'Create Appointment'}
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
              minimumDate={isCopying ? new Date(new Date().setDate(new Date().getDate() + 1)) : new Date()}
            />
          )}

          {/* Time Picker Modal */}
          {showTimePicker && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display="default"
              onChange={handleTimeConfirm}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  input: {
    marginTop: 8,
  },
  dateButton: {
    marginTop: 8,
  },
  saveButton: {
    marginTop: 16,
    paddingVertical: 8,
  },
  copyIndicator: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  copyIndicatorText: {
    color: '#42A5F5',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AppointmentDetailsScreen;
