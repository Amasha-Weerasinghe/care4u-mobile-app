import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text, Card, Button, useTheme, IconButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { RecommendedMealItem, DayMeals } from '../types';
import mealRecommendationService, { 
  MealRecommendation, 
  WeeklyMealRecommendation,
  WeeklyMealRecommendationsResponse 
} from '../services/mealRecommendationService';
import PaperActivityIndicator from '../components/PaperActivityIndicator';

interface MealRecommendationScreenProps {
  navigation: any;
}

const MealRecommendationScreen: React.FC<MealRecommendationScreenProps> = ({ navigation }) => {
  const theme = useTheme();
  const [selectedDay, setSelectedDay] = useState<string>('monday');
  const [loading, setLoading] = useState(true);

  const [weeklyMeals, setWeeklyMeals] = useState<WeeklyMealRecommendation[]>([]);

  useEffect(() => {
    loadWeeklyMealRecommendations();
  }, []);

  const loadWeeklyMealRecommendations = async () => {
    try {
      setLoading(true);
      const response: WeeklyMealRecommendationsResponse = await mealRecommendationService.getWeeklyMealRecommendations(1);
      if (response.success && response.data && Array.isArray(response.data)) {
        const validatedData = response.data.map(day => ({
          day: day.day || '',
          date: day.date || '',
          breakfast: Array.isArray(day.breakfast) ? day.breakfast.filter(meal => meal && meal.meal_id) : [],
          lunch: Array.isArray(day.lunch) ? day.lunch.filter(meal => meal && meal.meal_id) : [],
          dinner: Array.isArray(day.dinner) ? day.dinner.filter(meal => meal && meal.meal_id) : [],
          totalCalories: typeof day.totalCalories === 'number' ? day.totalCalories : 0
        }));
        setWeeklyMeals(validatedData);
      } else {
        setWeeklyMeals([]);
      }
    } catch (error) {
      console.error('Error loading weekly meal recommendations:', error);
      Alert.alert('Error', 'Failed to load meal planner');
      setWeeklyMeals([]);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (day: string) => {
    const dayNames: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday',
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };
    return dayNames[day] || day;
  };

  const getMealIcon = (mealName: string) => {
    if (mealName.toLowerCase().includes('string hoppers')) {
      return 'food-croissant';
    } else if (mealName.toLowerCase().includes('rice')) {
      return 'food-fork-drink';
    } else {
      return 'food-variant';
    }
  };

  const renderMealCard = (meal: MealRecommendation) => {
    // Add null check for meal object
    if (!meal || !meal.meal_id) {
      return (
        <Card style={styles.mealCard}>
          <Card.Content style={styles.mealCardContent}>
            <Text style={styles.noMealsText}>Invalid meal data</Text>
          </Card.Content>
        </Card>
      );
    }

    return (
      <Card key={meal.meal_id} style={styles.mealCard}>
        <Card.Content style={styles.mealCardContent}>
          <View style={styles.mealHeader}>
            <View style={styles.mealTitleSection}>
              <MaterialCommunityIcons
                name={getMealIcon(meal.meal || '')}
                size={20}
                color={COLORS.primary}
                style={styles.mealIcon}
              />
              <Text style={styles.mealName}>{meal.meal || 'Unnamed Meal'}</Text>
              <Text style={styles.calorieText}>{meal.calories || 0} Cal</Text>
              <View style={styles.vegBadge}>
                <Text style={styles.vegText}>{meal.is_veg ? 'Veg' : 'Non-Veg'}</Text>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDaySelector = () => {
    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    return (
      <View style={styles.daySelectorContainer}>
        <View style={styles.daySelector}>
          {days.map((day, index) => {
            const dayName = dayNames[index];
            const isSelected = selectedDay === dayName;
            
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dayButton, isSelected && styles.selectedDayButton]}
                onPress={() => setSelectedDay(dayName)}
              >
                <Text style={[styles.dayButtonText, isSelected && styles.selectedDayButtonText]}>
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.daySelectorTitle}>Your meal plan for {getDayName(selectedDay)}</Text>
      </View>
    );
  };

  const getSelectedDayMeals = () => {
    const dayMeals = weeklyMeals.find(day => day.day === selectedDay);
    if (!dayMeals) {
      return {
        day: selectedDay,
        date: '',
        breakfast: [],
        lunch: [],
        dinner: [],
        totalCalories: 0
      };
    }
    return dayMeals;
  };

  const selectedDayMeals = getSelectedDayMeals();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PaperActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading meal planner...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.contentWrapper}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor={COLORS.primary}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Meal Planner
          </Text>
        </View>

        {renderDaySelector()}

        <View style={styles.mealsContainer}>
          {selectedDayMeals ? (
            <>
              <Text style={styles.categoryTitle}>Breakfast</Text>
              {selectedDayMeals.breakfast && selectedDayMeals.breakfast.length > 0 && selectedDayMeals.breakfast[0] ? (
                renderMealCard(selectedDayMeals.breakfast[0])
              ) : (
                <Text style={styles.noMealsText}>No breakfast meals available</Text>
              )}
              
              <Text style={styles.categoryTitle}>Lunch</Text>
              {selectedDayMeals.lunch && selectedDayMeals.lunch.length > 0 && selectedDayMeals.lunch[0] ? (
                renderMealCard(selectedDayMeals.lunch[0])
              ) : (
                <Text style={styles.noMealsText}>No lunch meals available</Text>
              )}
              
              <Text style={styles.categoryTitle}>Dinner</Text>
              {selectedDayMeals.dinner && selectedDayMeals.dinner.length > 0 && selectedDayMeals.dinner[0] ? (
                renderMealCard(selectedDayMeals.dinner[0])
              ) : (
                <Text style={styles.noMealsText}>No dinner meals available</Text>
              )}
            </>
          ) : (
            <Text style={styles.noMealsText}>No meals available for this day</Text>
          )}
        </View>

        {selectedDayMeals && selectedDayMeals.totalCalories !== undefined && (
          <View style={styles.totalIntake}>
            <Text style={styles.totalIntakeText}>
              Total Intake : {selectedDayMeals.totalCalories} Cal
            </Text>
          </View>
        )}
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
  },
  contentContainer: {
    paddingBottom: 20,
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
  daySelectorContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  daySelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B46C1',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
    fontStyle: 'italic',
  },
  mealsContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 4,
    marginBottom: 8,
    paddingLeft: 4,
  },
  noMealsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  mealCard: {
    backgroundColor: '#F8F5FF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mealCardContent: {
    padding: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  mealIcon: {
    marginRight: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  vegBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  vegText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  calorieText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  totalIntake: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  totalIntakeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  selectedDayButton: {
    backgroundColor: COLORS.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedDayButtonText: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
});

export default MealRecommendationScreen;
