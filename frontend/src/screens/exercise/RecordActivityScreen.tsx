import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  Text,
  IconButton,
  Button,
  Card,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

const RecordActivityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const activities = [
    {
      id: 'walking',
      name: 'Walking',
      icon: 'walk',
      color: '#9C27B0',
    },
    {
      id: 'running',
      name: 'Running',
      icon: 'run',
      color: '#9C27B0',
    },
    {
      id: 'stretching',
      name: 'Stretching',
      icon: 'human-handsup',
      color: '#9C27B0',
    },
    {
      id: 'yoga',
      name: 'Yoga',
      icon: 'meditation',
      color: '#9C27B0',
    },
    {
      id: 'zumba',
      name: 'Zumba',
      icon: 'dance-pole',
      color: '#9C27B0',
    },
    {
      id: 'cycling',
      name: 'Cycling',
      icon: 'bike',
      color: '#9C27B0',
    },
  ];

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleActivitySelect = (activity: typeof activities[0]) => {
    navigation.navigate('TrackActivity', { 
      activity,
      selectedDate: selectedDate.toISOString().split('T')[0] 
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          iconColor={COLORS.primary}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Select Activity
        </Text>
      </View>

      {/* Date Selection */}
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Date
        </Text>
        <Button
          mode="outlined"
          onPress={showDatePickerModal}
          icon="calendar"
          style={styles.dateButton}
        >
          {formatDate(selectedDate)}
        </Button>
      </View>

      {/* Activity Grid */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Choose Activity
        </Text>
        <View style={styles.gridContainer}>
          {activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() => handleActivitySelect(activity)}
            >
              <View style={[styles.iconContainer, { backgroundColor: activity.color + '20' }]}>
                <MaterialCommunityIcons
                  name={activity.icon as any}
                  size={48}
                  color={activity.color}
                />
              </View>
              <Text style={styles.activityName}>{activity.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  dateButton: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityCard: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
});

export default RecordActivityScreen;
