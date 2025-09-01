import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Dimensions,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { 
  Text, 
  IconButton, 
  Card, 
  ProgressBar,
  Avatar,
  Chip,
  Button,
  ActivityIndicator
} from 'react-native-paper';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabParamList } from '../types';
import { COLORS } from '../constants/theme';
import authService from '../services/authService';
import mealService from '../services/mealService';
import exerciseService from '../services/exerciseService';
import sugarService from '../services/sugarService';
import { User, TodaySummary, Appointment } from '../types';
import { useAppointments } from '../contexts/AppointmentContext';
import { appointmentService } from '../services/appointmentService';


type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface HealthTip {
  id: number;
  message: string;
  icon: string;
  color: string;
  bgColor: string;
  type: 'tip' | 'warning' | 'reminder';
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { appointments } = useAppointments();
  const [user, setUser] = useState<User | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [exerciseSummary, setExerciseSummary] = useState<any>(null);
  const [sugarSummary, setSugarSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sugarLevel, setSugarLevel] = useState<number | null>(null);
  const [sugarStatus, setSugarStatus] = useState<'normal' | 'warning'>('normal');
  const [latestSugarRecord, setLatestSugarRecord] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [lastTipUpdate, setLastTipUpdate] = useState<Date>(new Date());
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  // Load upcoming appointments from backend
  const loadUpcomingAppointments = async () => {
    try {
      setAppointmentsLoading(true);
      const response = await appointmentService.getUpcomingAppointments(10);
      setUpcomingAppointments(response.appointments);
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  // Get upcoming appointments for display (max 3)
  const getUpcomingAppointments = (): Appointment[] => {
    return upcomingAppointments.slice(0, 3);
  };

  // Get meal data for today
  const getMealData = () => {
    if (!todaySummary?.meals) return { breakfast: 0, lunch: 0, dinner: 0 };
    
    const meals = todaySummary.meals;
    const breakfast = meals.find(m => m.meal_type === 'breakfast')?.total_calories || 0;
    const lunch = meals.find(m => m.meal_type === 'lunch')?.total_calories || 0;
    const dinner = meals.find(m => m.meal_type === 'dinner')?.total_calories || 0;
    
    return { breakfast, lunch, dinner };
  };

  // Calculate dynamic meal goals based on user's daily calorie goal
  const getMealGoals = () => {
    const dailyGoal = user?.calorie_intake_goal || 2000; 
    
    // Distribute daily goal across meals (breakfast: 25%, lunch: 35%, dinner: 40%)
    const breakfastGoal = Math.round(dailyGoal * 0.25);
    const lunchGoal = Math.round(dailyGoal * 0.35);
    const dinnerGoal = Math.round(dailyGoal * 0.40);
    
    return { breakfastGoal, lunchGoal, dinnerGoal };
  };

  // Calculate progress percentage for meal
  const getMealProgress = (calories: number, goal: number) => {
    return Math.min(calories / goal, 1);
  };

  // Circular Progress Component
  const CircularProgress = ({ progress, size = 60, strokeWidth = 4, color = COLORS.primary, children }: {
    progress: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    children?: React.ReactNode;
  }) => {
    const clampedProgress = Math.min(Math.max(progress, 0), 1);
    const angle = clampedProgress * 360;

    return (
      <View style={[styles.circularProgressContainer, { width: size, height: size }]}>
        {/* Background circle */}
        <View style={[styles.circularProgressBackground, { 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: '#E0E0E0'
        }]} />
        
        {/* Progress circle using conic gradient simulation */}
        <View style={[styles.circularProgressFill, {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: angle > 0 ? color : 'transparent',
          borderRightColor: angle > 90 ? color : 'transparent',
          borderBottomColor: angle > 180 ? color : 'transparent',
          borderLeftColor: angle > 270 ? color : 'transparent',
          transform: [{ rotate: '-90deg' }],
          position: 'absolute',
        }]} />
        
        {/* Content */}
        <View style={styles.circularProgressContent}>
          {children}
        </View>
      </View>
    );
  };


  // Health tips array with 20 tips
  const healthTips: HealthTip[] = [
    {
      id: 1,
      message: 'Drinking at least 1.5 to 2 liters of water a day helps flush toxins from your body',
      icon: 'water',
      color: COLORS.primary,
      bgColor: '#E3F2FD',
      type: 'tip'
    },
    {
      id: 2,
      message: 'Walking 10,000 steps daily can significantly improve your cardiovascular health',
      icon: 'walk',
      color: COLORS.success,
      bgColor: '#E8F5E8',
      type: 'tip'
    },
    {
      id: 3,
      message: 'Eating a balanced breakfast within 2 hours of waking up helps regulate blood sugar',
      icon: 'food-apple',
      color: COLORS.warning,
      bgColor: '#FFF3E0',
      type: 'tip'
    },
    {
      id: 4,
      message: 'Getting 7-9 hours of quality sleep is essential for overall health and recovery',
      icon: 'sleep',
      color: COLORS.secondary,
      bgColor: '#F3E5F5',
      type: 'tip'
    },
    {
      id: 5,
      message: 'Regular blood sugar monitoring helps you understand how food affects your levels',
      icon: 'test-tube',
      color: COLORS.error,
      bgColor: '#FFEBEE',
      type: 'reminder'
    },
    {
      id: 6,
      message: 'Including protein in every meal helps maintain stable blood sugar levels',
      icon: 'food-steak',
      color: COLORS.success,
      bgColor: '#E8F5E8',
      type: 'tip'
    },
    {
      id: 7,
      message: 'Stress management techniques like deep breathing can help control blood sugar',
      icon: 'heart-pulse',
      color: COLORS.primary,
      bgColor: '#E3F2FD',
      type: 'tip'
    },
    {
      id: 8,
      message: 'Regular exercise helps your body use insulin more effectively',
      icon: 'run',
      color: COLORS.success,
      bgColor: '#E8F5E8',
      type: 'tip'
    },
    {
      id: 9,
      message: 'Eating slowly and mindfully can help prevent overeating and blood sugar spikes',
      icon: 'clock-outline',
      color: COLORS.warning,
      bgColor: '#FFF3E0',
      type: 'tip'
    },
    {
      id: 10,
      message: 'Fiber-rich foods help slow down sugar absorption in your bloodstream',
      icon: 'leaf',
      color: COLORS.success,
      bgColor: '#E8F5E8',
      type: 'tip'
    },
    {
      id: 11,
      message: 'Regular checkups with your doctor are crucial for managing diabetes effectively',
      icon: 'medical-bag',
      color: COLORS.primary,
      bgColor: '#E3F2FD',
      type: 'reminder'
    },
    {
      id: 12,
      message: 'Avoiding sugary drinks and processed foods can help maintain stable blood sugar',
      icon: 'cup-off',
      color: COLORS.error,
      bgColor: '#FFEBEE',
      type: 'warning'
    },
    {
      id: 13,
      message: 'Small, frequent meals throughout the day can help maintain steady blood sugar',
      icon: 'food-fork-drink',
      color: COLORS.warning,
      bgColor: '#FFF3E0',
      type: 'tip'
    },
    {
      id: 14,
      message: 'Monitoring your weight regularly helps track your health progress',
      icon: 'scale-bathroom',
      color: COLORS.secondary,
      bgColor: '#F3E5F5',
      type: 'tip'
    },
    {
      id: 15,
      message: 'Alcohol can affect blood sugar levels - drink in moderation and with food',
      icon: 'glass-cocktail',
      color: COLORS.warning,
      bgColor: '#FFF3E0',
      type: 'warning'
    },
    {
      id: 16,
      message: 'Keeping a food diary helps identify which foods affect your blood sugar',
      icon: 'notebook',
      color: COLORS.primary,
      bgColor: '#E3F2FD',
      type: 'tip'
    },
    {
      id: 17,
      message: 'Regular foot care is important for people with diabetes',
      icon: 'foot-print',
      color: COLORS.secondary,
      bgColor: '#F3E5F5',
      type: 'reminder'
    },
    {
      id: 18,
      message: 'Strength training exercises help build muscle and improve insulin sensitivity',
      icon: 'dumbbell',
      color: COLORS.success,
      bgColor: '#E8F5E8',
      type: 'tip'
    },
    {
      id: 19,
      message: 'Quitting smoking can significantly improve your diabetes management',
      icon: 'smoking-off',
      color: COLORS.error,
      bgColor: '#FFEBEE',
      type: 'warning'
    },
    {
      id: 20,
      message: 'Staying hydrated helps your kidneys function properly and flush excess sugar',
      icon: 'cup-water',
      color: COLORS.primary,
      bgColor: '#E3F2FD',
      type: 'tip'
    }
  ];

  useEffect(() => {
    loadHomeData();
    initializeTipSystem();
  }, []);

  // Refresh data
  useFocusEffect(
    React.useCallback(() => {
      loadHomeData();
    }, [])
  );

  const formatDateForComparison = (dateString: string): string => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Initialize tip system and set up hourly updates
  const initializeTipSystem = () => {
    const currentHour = new Date().getHours();
    const tipIndex = currentHour % healthTips.length;
    setCurrentTipIndex(tipIndex);
    setLastTipUpdate(new Date());

    const interval = setInterval(() => {
      setCurrentTipIndex(prevIndex => (prevIndex + 1) % healthTips.length);
      setLastTipUpdate(new Date());
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  };

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const userResponse = await authService.getUser();
      if (userResponse.success) {
        setUser(userResponse.profile);
      }

      // Load today's meal summary
      try {
        const mealResponse = await mealService.getTodaySummary();
        if (mealResponse.success) {
          setTodaySummary(mealResponse.summary);
        }
      } catch (error) {
        console.error('Background meal data loading failed:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Load today's exercise summary
      try {
        const exerciseResponse = await exerciseService.getTodayExerciseSummary();
        setExerciseSummary(exerciseResponse.summary);
      } catch (error) {
        console.error('Background exercise data loading failed:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Load today's sugar summary
      try {
        const sugarResponse = await sugarService.getTodaySugarSummary();
        if (sugarResponse.success) {
          setSugarSummary(sugarResponse.summary);
          if (sugarResponse.summary.records.length > 0) {
            const latestRecord = sugarResponse.summary.records[0];
            setSugarLevel(latestRecord.blood_sugar_value);
            setSugarStatus(latestRecord.blood_sugar_value > 120 ? 'warning' : 'normal');
            setLatestSugarRecord(latestRecord);
          }
        }
      } catch (error) {
        console.error('Background sugar data loading failed:', error instanceof Error ? error.message : 'Unknown error');
      }

      await loadUpcomingAppointments();

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeData();
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleSettingsPress = () => {
    Alert.alert('Settings', 'Settings screen coming soon!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const handleMealPlannerPress = () => {
    navigation.navigate('MealRecommendation');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getCurrentDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const formatExerciseDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getMealTypeLabel = (mealType: string) => {
    switch (mealType?.toLowerCase()) {
      case 'breakfast':
        return 'Breakfast';
      case 'lunch':
        return 'Lunch';
      case 'dinner':
        return 'Dinner';
      case 'snack':
        return 'Snack';
      case 'before_meal':
        return 'Before Meal';
      case 'after_meal':
        return 'After Meal';
      case 'fasting':
        return 'Fasting';
      default:
        return 'Sugar Level';
    }
  };

  const getSugarAlert = () => {
    if (sugarStatus === 'warning') {
      return {
        type: 'warning',
        icon: 'alert',
        message: 'Your Sugar Level Is above Normal Levels!',
        color: COLORS.error,
        bgColor: '#FEF2F2'
      };
    }
    
    // Get current tip from the health tips array
    const currentTip = healthTips[currentTipIndex];
    return {
      type: currentTip.type,
      icon: currentTip.icon,
      message: currentTip.message,
      color: currentTip.color,
      bgColor: currentTip.bgColor
    };
  };

  const getNutrientProgress = (current: number, goal: number) => {
    return Math.min(current / goal, 1);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading your health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sugarAlert = getSugarAlert();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <IconButton
              icon="account"
              size={24}
              onPress={handleProfilePress}
              iconColor={COLORS.textSecondary}
            />
            <View style={styles.headerText}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.date}>{getCurrentDate()}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <IconButton
              icon="dots-vertical"
              size={24}
              onPress={() => {
                Alert.alert(
                  'Logout',
                  'Do you want to log out?',
                  [
                    {
                      text: 'No',
                      style: 'cancel'
                    },
                    {
                      text: 'Yes',
                      onPress: handleLogout,
                      style: 'destructive'
                    }
                  ]
                );
              }}
              iconColor={COLORS.textSecondary}
            />
          </View>
        </View>

        {/* Alert/Tip Section */}
        <Card style={[styles.alertCard, { backgroundColor: sugarAlert.bgColor }]}>
          <View style={styles.alertContent}>
            <IconButton
              icon={sugarAlert.icon}
              size={24}
              iconColor={sugarAlert.color}
              style={styles.alertIcon}
            />
            <Text style={[styles.alertText, { color: COLORS.textPrimary }]}>
              {sugarAlert.message}
            </Text>
          </View>
        </Card>

        {/* Checkup and Exercise Row */}
        <View style={styles.rowContainer}>
          {/* Checkup Card */}
          <Card style={[styles.card, styles.checkupCard]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>
                {upcomingAppointments.length} upcoming appointments
              </Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={() => navigation.navigate('Appointment')}
                iconColor={COLORS.primary}
              />
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Appointment')} activeOpacity={0.7}>
              <View style={styles.checkupList}>
                {appointmentsLoading ? (
                  <View style={styles.checkupItem}>
                    <Text style={styles.checkupDate}>Loading...</Text>
                    <Text style={styles.checkupTitle}>appointments</Text>
                  </View>
                ) : (() => {
                  const upcomingAppointments = getUpcomingAppointments();
                  const items = [];
                  
                  // Add actual appointments (max 3)
                  upcomingAppointments.forEach((appointment) => {
                    items.push(
                      <View key={appointment.id} style={styles.checkupItem}>
                        <Text style={styles.checkupDate}>
                          {new Date(appointment.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <Text style={styles.checkupTitle}>{appointment.title}</Text>
                      </View>
                    );
                  });
                  
                  // If there are more than 3 appointments, show "see more" text
                  if (upcomingAppointments.length > 3) {
                    items.push(
                      <View key="see-more" style={styles.checkupItem}>
                        <Text style={styles.checkupDate}>Click to see</Text>
                        <Text style={styles.checkupTitle}>more appointments</Text>
                      </View>
                    );
                  } else {
                    // Add placeholder items to fill remaining slots
                    for (let i = upcomingAppointments.length; i < 3; i++) {
                      items.push(
                        <View key={`placeholder-${i}`} style={styles.checkupItem}>
                          <Text style={styles.checkupDate}>No appointment</Text>
                          <Text style={styles.checkupTitle}>Tap + to add one</Text>
                        </View>
                      );
                    }
                  }
                  
                  return items;
                })()}
              </View>
            </TouchableOpacity>
          </Card>

          {/* Exercise Card */}
          <Card style={[styles.card, styles.exerciseCard]}>
            <View style={styles.exerciseContent}>
              <View style={styles.exerciseIcon}>
                <IconButton
                  icon="run"
                  size={32}
                  iconColor={COLORS.secondary}
                />
              </View>
              <Text style={styles.exerciseLabel}>You Burned</Text>
              <Text style={styles.exerciseCalories}>
                {exerciseSummary?.totalCaloriesBurned || 0} cal / {formatExerciseDuration(exerciseSummary?.totalDuration || 0)}
              </Text>
              {user?.calorie_burn_goal && exerciseSummary?.totalCaloriesBurned > 0 && (
                <Text style={styles.exerciseSubtext}>
                  {Math.round((exerciseSummary.totalCaloriesBurned / user.calorie_burn_goal) * 100)}% of daily burn goal
                </Text>
              )}
              {(!exerciseSummary || (exerciseSummary.totalCaloriesBurned === 0 && exerciseSummary.totalDuration === 0)) && (
                <Text style={styles.exerciseSubtext}>No exercise recorded today</Text>
              )}
            </View>
          </Card>
        </View>

        {/* Sugar Level Display */}
        <Card style={[styles.card, styles.sugarCard, { backgroundColor: sugarLevel ? (sugarStatus === 'warning' ? '#FFEBEE' : '#E8F5E8') : '#E8F5E8' }]}>
          <View style={styles.sugarContent}>
            {sugarLevel ? (
              <>
                <Text style={[styles.sugarValue, { color: sugarStatus === 'warning' ? COLORS.error : COLORS.success }]}>
                  {sugarLevel}
                </Text>
                <Text style={styles.sugarLabel}>
                  Sugar Level Before {getMealTypeLabel(latestSugarRecord?.meal_type)}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.exerciseSubtext}>
                  No sugar recorded today
                </Text>
              </>
            )}
          </View>
        </Card>

        {/* Meal Progress Section */}
        <Card style={[styles.card, styles.marginedCard, { backgroundColor: '#F8F9FF' }]}>
          <Text style={styles.calorieTitle}>
            {todaySummary?.totalCalories || 0}/{user?.calorie_intake_goal || 2000} Calories Consumed Today
          </Text>
          
          <View style={styles.mealProgressContainer}>
            {(() => {
              const mealData = getMealData();
              const { breakfastGoal, lunchGoal, dinnerGoal } = getMealGoals();
              
              return (
                <>
                  <View style={styles.mealProgressItem}>
                    <CircularProgress 
                      progress={getMealProgress(mealData.breakfast, breakfastGoal)}
                      color={COLORS.success}
                    >
                      <Text style={styles.mealProgressText}>
                        {Math.round((mealData.breakfast / breakfastGoal) * 100)}%
                      </Text>
                    </CircularProgress>
                    <Text style={styles.mealProgressLabel}>Breakfast</Text>
                    <Text style={styles.mealProgressCalories}>
                      {mealData.breakfast}/{breakfastGoal} cal
                    </Text>
                  </View>

                  <View style={styles.mealProgressItem}>
                    <CircularProgress 
                      progress={getMealProgress(mealData.lunch, lunchGoal)}
                      color={COLORS.warning}
                    >
                      <Text style={styles.mealProgressText}>
                        {Math.round((mealData.lunch / lunchGoal) * 100)}%
                      </Text>
                    </CircularProgress>
                    <Text style={styles.mealProgressLabel}>Lunch</Text>
                    <Text style={styles.mealProgressCalories}>
                      {mealData.lunch}/{lunchGoal} cal
                    </Text>
                  </View>

                  <View style={styles.mealProgressItem}>
                    <CircularProgress 
                      progress={getMealProgress(mealData.dinner, dinnerGoal)}
                      color={COLORS.secondary}
                    >
                      <Text style={styles.mealProgressText}>
                        {Math.round((mealData.dinner / dinnerGoal) * 100)}%
                      </Text>
                    </CircularProgress>
                    <Text style={styles.mealProgressLabel}>Dinner</Text>
                    <Text style={styles.mealProgressCalories}>
                      {mealData.dinner}/{dinnerGoal} cal
                    </Text>
                  </View>
                </>
              );
            })()}
          </View>
        </Card>

        {/* Meal Planner Section */}
        <Card style={[styles.card, styles.marginedCard, { backgroundColor: '#F0F8FF' }]}>
          <View style={styles.mealPlannerContent}>
            <View style={styles.mealPlannerText}>
              <Text style={styles.mealPlannerTitle}>Plan you meals</Text>
              <Text style={styles.mealPlannerSubtitle}>Find the healthiest meal for you!</Text>
              <Button
                mode="text"
                onPress={handleMealPlannerPress}
                textColor={COLORS.primary}
                style={styles.mealPlannerButton}
              >
                Tap to see your meal plan
              </Button>
            </View>
            <IconButton
              icon="clipboard-text"
              size={32}
              iconColor={COLORS.primary}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 40,
    backgroundColor: COLORS.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 8,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  alertCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  alertIcon: {
    margin: 0,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  card: {
    elevation: 2,
    marginBottom: 16,
  },
  marginedCard: {
    marginHorizontal: 16,
  },
  checkupCard: {
    flex: 2,
    backgroundColor: '#E3F2FD', 
  },
  exerciseCard: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  checkupList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  checkupItem: {
    marginBottom: 8,
  },
  checkupDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  checkupTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  exerciseContent: {
    alignItems: 'center',
    padding: 16,
  },
  exerciseIcon: {
    marginBottom: 8,
  },
  exerciseLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  exerciseCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  exerciseSubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  sugarCard: {
    marginHorizontal: 16,
  },
  sugarContent: {
    alignItems: 'center',
    padding: 16,
  },
  sugarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sugarValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sugarLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  calorieTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  nutrientContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  nutrientItem: {
    marginBottom: 16,
  },
  nutrientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  nutrientValue: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  mealProgressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  mealProgressItem: {
    alignItems: 'center',
    flex: 1,
  },
  mealProgressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  mealProgressLabel: {
    fontSize: 12,
    color: COLORS.textPrimary,
    fontWeight: '500',
    marginBottom: 4,
  },
  mealProgressCalories: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  circularProgressContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularProgressBackground: {
    position: 'absolute',
  },
  circularProgressFill: {
    position: 'absolute',
  },
  circularProgressContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealPlannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  mealPlannerText: {
    flex: 1,
  },
  mealPlannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  mealPlannerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  mealPlannerButton: {
    alignSelf: 'flex-start',
    margin: 0,
    padding: 0,
  },
});

export default HomeScreen;

