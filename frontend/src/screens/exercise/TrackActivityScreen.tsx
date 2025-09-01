import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  IconButton,
  Button,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import exerciseService from '../../services/exerciseService';
import authService from '../../services/authService';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';
import { COLORS } from '../../constants/theme';

interface RouteParams {
  activity: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  selectedDate?: string;
}

const TrackActivityScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { activity, selectedDate } = route.params as RouteParams;

  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activityStartTime, setActivityStartTime] = useState<Date | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);

  // Load user data to get calorie burn goal and weight
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userResponse = await authService.getUser();
        if (userResponse.success) {
          setUser(userResponse.profile);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    loadUserData();
  }, []);

  // Get user's calorie burn goal 
  const dailyCalorieGoal = user?.calorie_burn_goal || 500;
  
  // MET values (Metabolic Equivalent of Task) for different activities
  const getMETValue = (activityName: string): number => {
    const activityNameLower = activityName.toLowerCase();
    switch (activityNameLower) {
      case 'walking':
        return 3.5; 
      case 'running':
        return 8.0; 
      case 'cycling':
        return 6.0; 
      case 'yoga':
        return 2.5; 
      case 'stretching':
        return 2.0; 
      case 'zumba':
        return 7.0; 
      default:
        return 4.0; 
    }
  };
  
  // Calculate calories burned using MET formula
  // Calories = MET × Weight (kg) × Duration (hours)
  const calculateCaloriesBurned = (seconds: number): number => {
    const metValue = getMETValue(activity.name);
    const weightKg = user?.weight ? parseFloat(user.weight) : 70; 
    const durationHours = seconds / 3600; 
    const calories = metValue * weightKg * durationHours;
    return Math.round(calories);
  };
  
  const caloriesPerMinute = calculateCaloriesBurned(60); 
  const minutesNeededForGoal = Math.ceil(dailyCalorieGoal / caloriesPerMinute);
  const remainingMinutesForGoal = Math.max(0, minutesNeededForGoal - Math.floor(elapsedTime / 60));

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTracking = () => {
    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
    
    intervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  };

  const pauseTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsPaused(true);
    pausedTimeRef.current = elapsedTime;
  };

  const resumeTracking = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now() - (pausedTimeRef.current * 1000);
    
    intervalRef.current = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = Math.floor((currentTime - startTimeRef.current) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  };

  const stopTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (elapsedTime > 0) {
      Alert.alert(
        'Stop Activity',
        `Do you want to save this ${activity.name} session?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Save',
            onPress: saveActivity,
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const saveActivity = async () => {
    setLoading(true);
    try {
      // Send duration in seconds 
      const caloriesBurned = calculateCaloriesBurned(elapsedTime);
      
      await exerciseService.createExercise({
        activity_type: activity.name.toLowerCase(),
        duration_seconds: elapsedTime,
        calories_burned: caloriesBurned,
        notes: `${activity.name} session`,
        activity_date: selectedDate, 
      });

      Alert.alert(
        'Activity Saved',
        `Your ${activity.name} session has been saved successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert(
        'Error',
        'Failed to save activity. Please try again.',
        [
          {
            text: 'OK',
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getActivityIcon = (activityName: string): string => {
    const iconMap: { [key: string]: string } = {
      walking: 'walk',
      running: 'run',
      stretching: 'human-handsup',
      yoga: 'meditation',
      zumba: 'dance',
      cycling: 'bike',
    };
    return iconMap[activityName.toLowerCase()] || 'run';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="close"
          size={24}
          onPress={() => {
            if (isTracking) {
              Alert.alert(
                'Stop Tracking',
                'Are you sure you want to stop tracking? Your progress will be lost.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },
                  {
                    text: 'Stop',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
          iconColor={COLORS.primary}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          {activity.name}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Activity Icon */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={getActivityIcon(activity.name) as any}
            size={120}
            color={activity.color}
          />
        </View>

                 {/* Timer */}
         <View style={styles.timerContainer}>
           <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
         </View>

         {/* Real-time Calorie Display */}
         {elapsedTime > 0 && (
           <View style={styles.calorieContainer}>
             <Text style={styles.calorieText}>
               {calculateCaloriesBurned(elapsedTime)} calories burned
             </Text>
           </View>
         )}

         {/* Progress Message */}
         {remainingMinutesForGoal > 0 && (
           <Text style={styles.progressText}>
             {remainingMinutesForGoal} more minutes to reach daily burn goal of {dailyCalorieGoal} calories
           </Text>
         )}
         {remainingMinutesForGoal === 0 && elapsedTime > 0 && (
           <Text style={styles.progressText}>
             Great job! You've reached your daily burn goal of {dailyCalorieGoal} calories
           </Text>
         )}

        {/* Control Buttons */}
        <View style={styles.controlsContainer}>
          {!isTracking ? (
            <Button
              mode="contained"
              onPress={startTracking}
              style={[styles.controlButton, { backgroundColor: activity.color }]}
              contentStyle={styles.buttonContent}
            >
              <MaterialCommunityIcons name="play" size={24} color="white" />
              <Text style={styles.buttonText}>Start</Text>
            </Button>
          ) : (
            <View style={styles.buttonRow}>
              {isPaused ? (
                <Button
                  mode="contained"
                  onPress={resumeTracking}
                  style={[styles.controlButton, { backgroundColor: activity.color }]}
                  contentStyle={styles.buttonContent}
                >
                  <MaterialCommunityIcons name="play" size={24} color="white" />
                  <Text style={styles.buttonText}>Resume</Text>
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={pauseTracking}
                  style={[styles.controlButton, { backgroundColor: activity.color }]}
                  contentStyle={styles.buttonContent}
                >
                  <MaterialCommunityIcons name="pause" size={24} color="white" />
                  <Text style={styles.buttonText}>Pause</Text>
                </Button>
              )}
              
              <Button
                mode="outlined"
                onPress={stopTracking}
                style={[styles.controlButton, styles.stopButton]}
                contentStyle={styles.buttonContent}
              >
                <MaterialCommunityIcons name="stop" size={24} color={COLORS.error} />
                <Text style={[styles.buttonText, { color: COLORS.error }]}>Stop</Text>
              </Button>
            </View>
          )}
        </View>
      </View>

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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  timerContainer: {
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  calorieContainer: {
    marginBottom: 20,
  },
  calorieText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  progressText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 60,
  },
  controlsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
  },
  controlButton: {
    borderRadius: 50,
    minWidth: 120,
  },
  stopButton: {
    borderColor: COLORS.error,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackActivityScreen;
