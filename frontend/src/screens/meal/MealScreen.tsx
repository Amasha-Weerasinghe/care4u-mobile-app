import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, ProgressBar } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import mealService from '../../services/mealService';
import { CalorieGoals, TodaySummary } from '../../types';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';

const MealScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [calorieGoals, setCalorieGoals] = useState<CalorieGoals | null>(null);
  const [todaySummary, setTodaySummary] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setError(null);
      const [goalsResponse, summaryResponse] = await Promise.all([
        mealService.getCalorieGoals(),
        mealService.getTodaySummary()
      ]);
      
      if (goalsResponse.success) {
        setCalorieGoals(goalsResponse.calorieGoals);
      }
      
      if (summaryResponse.success) {
        setTodaySummary(summaryResponse.summary);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const loadCalorieGoals = async () => {
    try {
      const response = await mealService.getCalorieGoals();
      if (response.success) {
        setCalorieGoals(response.calorieGoals);
      }
    } catch (error) {
      console.error('Error loading calorie goals:', error);
    }
  };

  const mealOptions = [
    {
      id: 'add-meal',
      title: 'Add Meal',
      description: 'Record Your Daily Meals',
      icon: '🍽️',
      route: 'AddMeal'
    },
    {
      id: 'meal-items',
      title: 'Add Meal Items',
      description: 'Add New Food Items To Database',
      icon: '🥗',
      route: 'AddMealItem'
    },
    {
      id: 'templates',
      title: 'Meal Templates',
      description: 'Save & Reuse Your Favorite Meal Combinations',
      icon: '📋',
      route: 'MealTemplates'
    },
    {
      id: 'history',
      title: 'Meal History',
      description: 'View Your Past Meal Records',
      icon: '📊',
      route: 'MealHistory'
    }
  ];

  const handleOptionPress = (route: string) => {
    // @ts-ignore - Navigation type will be defined later
    navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.contentWrapper}
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
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>
            Let's Track Your Meals
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Track Your Nutrition & Maintain Healthy Eating Habits
          </Text>
        </View>

        <View style={styles.optionsContainer}>
        {mealOptions.map((option) => (
          <Card
            key={option.id}
            style={styles.card}
            onPress={() => handleOptionPress(option.route)}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={styles.cardIcon}>{option.icon}</Text>
              <View style={styles.cardText}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {option.title}
                </Text>
                <Text variant="bodyMedium" style={styles.cardDescription}>
                  {option.description}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}
        </View>

        <View style={styles.quickStats}>
          <Text variant="titleMedium" style={styles.statsTitle}>
            Today's Summary
          </Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <PaperActivityIndicator size="small" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <Button 
                mode="outlined" 
                onPress={loadData}
                style={styles.retryButton}
                compact
              >
                Retry
              </Button>
            </View>
          ) : todaySummary ? (
            <>
              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressText}>
                    {todaySummary.totalCalories} / {todaySummary.calorieGoal} calories
                  </Text>
                  <Text style={styles.progressPercentage}>
                    {todaySummary.progressPercentage.toFixed(1)}%
                  </Text>
                </View>
                <ProgressBar 
                  progress={Math.min(todaySummary.progressPercentage / 100, 1)} 
                  color={todaySummary.progressPercentage > 100 ? COLORS.error : COLORS.primary}
                  style={styles.progressBar}
                />
                <Text style={styles.remainingText}>
                  {todaySummary.remainingCalories} calories remaining
                </Text>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todaySummary.totalCalories}</Text>
                  <Text style={styles.statLabel}>Calories</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{todaySummary.totalMeals}</Text>
                  <Text style={styles.statLabel}>Meals</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {todaySummary.calorieGoal}
                  </Text>
                  <Text style={styles.statLabel}>Daily Goal</Text>
                </View>
              </View>

              {/* All Meal Types Status */}
              <View style={styles.allMealsSection}>
                <Text style={styles.allMealsTitle}>Today's Meals</Text>
                {todaySummary.meals.length > 0 ? (
                  todaySummary.meals.map((meal) => (
                    <View key={meal.id} style={styles.mealItem}>
                      <Text style={styles.mealType}>
                        {meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}
                      </Text>
                      <Text style={styles.mealCalories}>
                        {meal.total_calories} cal
                      </Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noMealsText}>No meals recorded today</Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No data available</Text>
              <Button 
                mode="outlined" 
                onPress={loadData}
                style={styles.retryButton}
                compact
              >
                Refresh
              </Button>
            </View>
          )}
        </View>
      </ScrollView>
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
  optionsContainer: {
    padding: 20,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    backgroundColor: COLORS.white,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  cardIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  quickStats: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 2,
  },
  statsTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    width: '80%',
  },
  emptyContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  remainingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  allMealsSection: {
    marginTop: 16,
  },
  allMealsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border || '#E0E0E0',
  },
  mealType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  mealCalories: {
    fontSize: 14,
    color: COLORS.primary,
  },
  noMealsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default MealScreen;

