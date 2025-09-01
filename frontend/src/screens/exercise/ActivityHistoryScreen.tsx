import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  SegmentedButtons,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import exerciseService, { ExerciseActivity, ExerciseSummary } from '../../services/exerciseService';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';
import { COLORS } from '../../constants/theme';
import { formatDuration } from '../../utils/timeUtils';

const ActivityHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<ExerciseActivity[]>([]);
  const [dailySummary, setDailySummary] = useState<ExerciseSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedActivityType, setSelectedActivityType] = useState<string>('walking');
  const [error, setError] = useState<string | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get today's date in YYYY-MM-DD format 
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const [historyResponse, summaryResponse] = await Promise.all([
        exerciseService.getExerciseHistory({
          date: dateString,
          activity_type: selectedActivityType,
        }),
        exerciseService.getDailyExerciseSummary(dateString)
      ]);
      
      setActivities(historyResponse.activities);
      setDailySummary(summaryResponse.summary);
    } catch (error) {
      console.error('Error loading exercise data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedActivityType]);


  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  
  const handleDateConfirm = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get activity icon
  const getActivityIcon = (activityName: string): string => {
    const iconMap: { [key: string]: string } = {
      walking: 'walk',
      running: 'run',
      stretching: 'human-handsup',
      yoga: 'meditation',
      zumba: 'dance-pole',
      cycling: 'bike',
    };
    return iconMap[activityName.toLowerCase()] || 'run';
  };

  // Handle delete activity
  const handleDeleteActivity = async (activityId: number) => {
    setDeletingActivity(activityId);
    try {
      await exerciseService.deleteExercise(activityId);
      await loadData();
    } catch (error) {
      console.error('Error deleting activity:', error);
      Alert.alert('Error', 'Failed to delete activity. Please try again.');
    } finally {
      setDeletingActivity(null);
    }
  };

  // Confirm delete activity
  const confirmDeleteActivity = (activityId: number, activityType: string) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete this ${activityType} activity?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteActivity(activityId),
        },
      ]
    );
  };

  const handleClearAllActivities = async () => {
    setClearingAll(true);
    try {
      // Get today's date in YYYY-MM-DD format 
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const response = await exerciseService.deleteExerciseActivitiesByDateAndType(
        dateString,
        selectedActivityType
      );
      Alert.alert('Success', `${response.deletedCount} activities deleted successfully.`);
      await loadData();
    } catch (error) {
      console.error('Error clearing all activities:', error);
      Alert.alert('Error', 'Failed to clear all activities. Please try again.');
    } finally {
      setClearingAll(false);
    }
  };

  // Confirm clear all activities
  const confirmClearAllActivities = () => {
    Alert.alert(
      'Clear All Activities',
      `Are you sure you want to delete all ${selectedActivityType} activities for ${formatDate(selectedDate)}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: handleClearAllActivities,
        },
      ]
    );
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
          Activity History
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Date Selection */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Date
          </Text>
          <Button
            mode="outlined"
            onPress={() => setShowDatePicker(true)}
            icon="calendar"
            style={styles.dateButton}
          >
            {formatDate(selectedDate)}
          </Button>
        </View>

        {/* Activity Type Filter */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Activity Type
          </Text>
          <View style={styles.activityTypeContainer}>
            <SegmentedButtons
              value={selectedActivityType}
              onValueChange={setSelectedActivityType}
              buttons={[
                { value: 'walking', label: 'Walking' },
                { value: 'running', label: 'Running' },
                { value: 'cycling', label: 'Cycling' },
              ]}
              style={styles.segmentedButtons}
            />
            <SegmentedButtons
              value={selectedActivityType}
              onValueChange={setSelectedActivityType}
              buttons={[
                { value: 'stretching', label: 'Stretching' },
                { value: 'yoga', label: 'Yoga' },
                { value: 'zumba', label: 'Zumba' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>
        </View>

        {/* Daily Summary */}
        {dailySummary && (
          <View style={styles.section}>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.summaryTitle}>
                  Daily Summary
                </Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {dailySummary.totalActivities}
                    </Text>
                    <Text style={styles.summaryLabel}>
                      Activities
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {formatDuration(dailySummary.totalDuration)}
                    </Text>
                    <Text style={styles.summaryLabel}>
                      Total Time
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {dailySummary.totalCaloriesBurned}
                    </Text>
                    <Text style={styles.summaryLabel}>
                      Calories
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Activity History */}
        <View style={styles.section}>
          <View style={styles.recordsHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Activity History
            </Text>
                         {activities.length > 0 && (
               <Button
                 mode="outlined"
                 onPress={confirmClearAllActivities}
                 disabled={clearingAll}
                 icon="delete-sweep"
                 textColor={COLORS.textSecondary}
                 style={styles.clearAllButton}
               >
                 Clear All
               </Button>
             )}
          </View>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
          {activities.length > 0 ? (
            activities.map((activity) => (
              <Card key={activity.id} style={styles.historyCard}>
                <Card.Content style={styles.historyCardContent}>
                  <View style={styles.historyIcon}>
                    <MaterialCommunityIcons
                      name={getActivityIcon(activity.activity_type) as any}
                      size={32}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text variant="titleMedium" style={styles.historyActivityType}>
                      {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                    </Text>
                    <Text variant="bodySmall" style={styles.historyDate}>
                      {new Date(activity.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    {activity.notes && (
                      <Text variant="bodySmall" style={styles.historyNotes}>
                        {activity.notes}
                      </Text>
                    )}
                  </View>
                  <View style={styles.historyStats}>
                    <Text variant="titleMedium" style={styles.historyDuration}>
                      {formatDuration(activity.duration_seconds)}
                    </Text>
                    <Text variant="bodyMedium" style={styles.historyCalories}>
                      {activity.calories_burned} cal
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => confirmDeleteActivity(activity.id, activity.activity_type)}
                    disabled={deletingActivity === activity.id}
                    iconColor={COLORS.textSecondary}
                  />
                </Card.Content>
              </Card>
            ))
          ) : (
            <Text style={styles.noHistoryText}>
              No activities found for the selected date and type.
            </Text>
          )}
        </View>
      </ScrollView>

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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllButton: {
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  summaryTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  dateButton: {
    marginBottom: 12,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.error,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  activityTypeContainer: {
    gap: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  historyCard: {
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  historyCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    marginRight: 16,
  },
  historyInfo: {
    flex: 1,
  },
  historyActivityType: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyDate: {
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  historyNotes: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  historyStats: {
    alignItems: 'flex-end',
  },
  historyDuration: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  historyCalories: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  noHistoryText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default ActivityHistoryScreen;
