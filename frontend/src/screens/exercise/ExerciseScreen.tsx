import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  ProgressBar,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import exerciseService, { ExerciseSummary } from '../../services/exerciseService';
import authService from '../../services/authService';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';
import { COLORS } from '../../constants/theme';
import { formatDuration, getDurationUnit } from '../../utils/timeUtils';

const ExerciseScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySummary, setTodaySummary] = useState<ExerciseSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  // Load today's exercise summary and user data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Load user data to get calorie burn goal
      const userResponse = await authService.getUser();
      if (userResponse.success) {
        setUser(userResponse.profile);
      }

      // Load exercise summary
      const response = await exerciseService.getTodayExerciseSummary();
      setTodaySummary(response.summary);
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Navigate to record activity screen
  const handleRecordActivity = () => {
    navigation.navigate('RecordActivity' as never);
  };

  // Navigate to activity history screen
  const handleViewHistory = () => {
    navigation.navigate('ActivityHistory' as never);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentWrapper}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Let's Track Your Exercise
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Monitor Your Physical Activity & Stay Active
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCards}>
          {/* Record Activity Card */}
          <TouchableOpacity onPress={handleRecordActivity} style={styles.cardContainer}>
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="run" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Record Activity
                  </Text>
                  <Text variant="bodyMedium" style={styles.cardSubtitle}>
                    Track Your Workout Sessions
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Activity History Card */}
          <TouchableOpacity onPress={handleViewHistory} style={styles.cardContainer}>
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="chart-line" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Activity History
                  </Text>
                  <Text variant="bodyMedium" style={styles.cardSubtitle}>
                    View Your Past Workout Records
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.summaryTitle}>
              Today's Summary
            </Text>
            
            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : todaySummary ? (
              <View style={styles.summaryContent}>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text variant="headlineMedium" style={styles.summaryValue}>
                      {todaySummary.totalActivities}
                    </Text>
                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                      ACTIVITIES
                    </Text>
                  </View>
                                     <View style={styles.summaryStat}>
                     <Text variant="headlineMedium" style={styles.summaryValue}>
                       {formatDuration(todaySummary.totalDuration)}
                     </Text>
                     <Text variant="bodyMedium" style={styles.summaryLabel}>
                       {getDurationUnit(todaySummary.totalDuration)}
                     </Text>
                   </View>
                  <View style={styles.summaryStat}>
                    <Text variant="headlineMedium" style={styles.summaryValue}>
                      {todaySummary.totalCaloriesBurned}
                    </Text>
                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                      CALORIES
                    </Text>
                  </View>
                </View>

                {/* Progress Bar for Daily Goal */}
                {todaySummary.totalCaloriesBurned > 0 && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text variant="bodyMedium" style={styles.progressTitle}>
                        Daily Calorie Goal
                      </Text>
                      <Text variant="bodyMedium" style={styles.progressValue}>
                        {todaySummary.totalCaloriesBurned}/{user?.calorie_burn_goal || 500} cal
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.min(todaySummary.totalCaloriesBurned / (user?.calorie_burn_goal || 500), 1)}
                      color={COLORS.primary}
                      style={styles.progressBar}
                    />
                  </View>
                )}

                {/* Today's Activities */}
                {todaySummary.activities.length > 0 && (
                  <View style={styles.activitiesSection}>
                    <Text variant="titleMedium" style={styles.activitiesTitle}>
                      Today's Activities
                    </Text>
                                         {todaySummary.activities.slice(0, 3).map((activity) => (
                       <View key={activity.id} style={styles.activityItem}>
                        <View style={styles.activityInfo}>
                          <Text variant="bodyMedium" style={styles.activityType}>
                            {activity.activity_type}
                          </Text>
                                                     <Text variant="bodySmall" style={styles.activityTime}>
                            {new Date(activity.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>
                                                                          <View style={styles.activityValue}>
                           <Text variant="titleMedium" style={styles.durationValue}>
                             {formatDuration(activity.duration_seconds)}
                           </Text>
                         </View>
                        <View style={styles.caloriesChip}>
                          <Text style={styles.caloriesChipText}>
                            {activity.calories_burned} cal
                          </Text>
                                                 </View>
                       </View>
                     ))}
                    {todaySummary.activities.length > 3 && (
                      <Text variant="bodySmall" style={styles.moreActivities}>
                        +{todaySummary.activities.length - 3} more activities
                      </Text>
                    )}
                  </View>
                )}

                {todaySummary.activities.length === 0 && (
                  <Text style={styles.noActivitiesText}>
                    No exercise activities for today. Start tracking your workouts!
                  </Text>
                )}
              </View>
            ) : null}
          </Card.Content>
        </Card>
      </ScrollView>

      {loading && <PaperActivityIndicator />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentWrapper: {
    flex: 1,
    paddingVertical: 40,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 60,
  },
  header: {
    padding: 20,
    paddingTop: 40,
    backgroundColor: COLORS.white,
  },
  title: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.primary,
    opacity: 0.9,
    textAlign: 'center',
  },
  actionCards: {
    padding: 20,
  },
  cardContainer: {
    marginBottom: 16,
  },
  actionCard: {
    elevation: 2,
    backgroundColor: COLORS.white,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: COLORS.textSecondary,
  },
  summaryCard: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 2,
  },
  summaryTitle: {
    color: COLORS.text,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
    color: COLORS.error,
    fontStyle: 'italic',
  },
  summaryContent: {
    gap: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryValue: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    color: COLORS.text,
    fontWeight: '600',
  },
  progressValue: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  activitiesSection: {
    marginTop: 8,
  },
  activitiesTitle: {
    marginBottom: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    color: COLORS.text,
    fontWeight: '600',
  },
  activityTime: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  activityValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  durationValue: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  unit: {
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  caloriesChip: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  caloriesChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  moreActivities: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  noActivitiesText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default ExerciseScreen;
