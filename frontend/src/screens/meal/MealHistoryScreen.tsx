import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Modal, RefreshControl } from 'react-native';
import { 
  Text, 
  Button, 
  Card, 
  SegmentedButtons,
  IconButton,
  Chip,
  Divider,
  TextInput
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import mealService from '../../services/mealService';
import { MealRecord, CalorieGoals } from '../../types';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';

const MealHistoryScreen = () => {
  const navigation = useNavigation();
  
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    return dateString;
  });
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate);
  const [mealRecords, setMealRecords] = useState<MealRecord[]>([]);
  const [calorieGoals, setCalorieGoals] = useState<CalorieGoals | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingMeal, setDeletingMeal] = useState<number | null>(null);

  useEffect(() => {
    loadMealRecords();
    loadCalorieGoals();
  }, [selectedDate]);

  // Refresh data when screen comes into focus 
  useFocusEffect(
    React.useCallback(() => {
      loadMealRecords();
      loadCalorieGoals();
    }, [selectedDate])
  );

  const loadMealRecords = async () => {
    try {
      setLoading(true);
      const response = await mealService.getMealRecords(selectedDate);
      if (response.success) {
        setMealRecords(response.records);
      }
    } catch (error: any) {
      console.error('Error loading meal records:', error);
      console.error('Error details:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to load meal records');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMealRecords(), loadCalorieGoals()]);
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

  const handleDeleteMeal = async (mealId: number) => {
    setDeletingMeal(mealId);
    try {
      const response = await mealService.deleteMealRecord(mealId);
      if (response.success) {
        await loadMealRecords();
      } else {
        Alert.alert('Error', 'Failed to delete meal record');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      Alert.alert('Error', 'Failed to delete meal record. Please try again.');
    } finally {
      setDeletingMeal(null);
    }
  };

  // Confirm individual meal deletion
  const confirmDeleteMeal = (mealId: number, mealType: string) => {
    Alert.alert(
      'Delete Meal',
      `Are you sure you want to delete this ${mealType} meal?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteMeal(mealId),
        },
      ]
    );
  };

  const handleClearAllMeals = async () => {
    try {
      setLoading(true);
      const response = await mealService.deleteMealRecordsByDateAndType(selectedDate, selectedMealType);
      if (response.success) {
        await loadMealRecords();
      } else {
        Alert.alert('Error', 'Failed to clear meal records');
      }
    } catch (error) {
      console.error('Error clearing meals:', error);
      Alert.alert('Error', 'Failed to clear meal records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm clear all meals
  const confirmClearAllMeals = () => {
    Alert.alert(
      'Clear All Meals',
      `This will permanently delete ALL ${selectedMealType} meals for ${formatDate(selectedDate)}. This action cannot be undone. Are you sure?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: handleClearAllMeals,
        },
      ]
    );
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    const today = new Date();
        today.setHours(23, 59, 59, 999);

    // Use timezone-safe date formatting 
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayString = `${todayYear}-${todayMonth}-${todayDay}`;
    
    if (tempDate && tempDate <= todayString) {
      setSelectedDate(tempDate);
      setShowDatePicker(false);
    } else {
      Alert.alert('Invalid Date', 'Please select a valid date (not in the future)');
    }
  };

  const getMealTypeColor = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return COLORS.primary;
      case 'lunch': return COLORS.secondary;
      case 'dinner': return COLORS.success;
      case 'snack': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const getCalorieStatusColor = (calories: number, mealType: string) => {
    if (!calorieGoals) return COLORS.success;
    
    const dailyGoal = calorieGoals.calorie_intake_goal;
    const mealTypeGoal = dailyGoal / 4;
    
    if (calories > mealTypeGoal) {
      return COLORS.error;
    } else if (calories > mealTypeGoal * 0.8) {
      return COLORS.warning;
    } else {
      return COLORS.success;
    }
  };

  const calculateTotalCalories = () => {
    // Calculate total calories for all meals on the selected date
    return mealRecords
      .filter(record => normalizeDate(record.meal_date) === selectedDate)
      .reduce((total, record) => total + record.total_calories, 0);
  };

  const getMealsForSelectedDate = () => {
    return mealRecords.filter(record => normalizeDate(record.meal_date) === selectedDate);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Helper function to normalize date format for comparison
  const normalizeDate = (dateValue: string | Date) => {
    if (typeof dateValue === 'string') {
      const dateOnly = dateValue.split('T')[0];
      return dateOnly;
    }
    // If it's a Date object, convert to YYYY-MM-DD format
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filter records by selected meal type and date
  const filteredRecords = mealRecords.filter(record =>
    record.meal_type === selectedMealType && normalizeDate(record.meal_date) === selectedDate
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          iconColor={COLORS.primary}
        />
        <Text variant="headlineSmall" style={styles.headerTitle}>
          Meal History
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
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
        {/* Date Selection */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Date
          </Text>
          <Button
            mode="outlined"
            onPress={handleDatePress}
            icon="calendar"
            style={styles.dateButton}
          >
            {formatDate(selectedDate)}
          </Button>
        </View>

        {/* Meal Type Filter */}
        <View style={styles.section}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Meal Type
          </Text>
          <SegmentedButtons
            value={selectedMealType}
            onValueChange={setSelectedMealType}
            buttons={[
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
              { value: 'snack', label: 'Snack' }
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Daily Summary */}
        {getMealsForSelectedDate().length > 0 ? (
          <View style={styles.section}>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.summaryTitle}>
                  Daily Summary
                </Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{calculateTotalCalories()}</Text>
                    <Text style={styles.summaryLabel}>Total Calories</Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>{getMealsForSelectedDate().length}</Text>
                    <Text style={styles.summaryLabel}>Meals Recorded</Text>
                  </View>
                  {calorieGoals && (
                    <View style={styles.summaryStat}>
                      <Text style={[styles.summaryValue, { 
                        color: calculateTotalCalories() > calorieGoals.calorie_intake_goal ? COLORS.error : COLORS.success 
                      }]}>
                        {Math.round((calculateTotalCalories() / calorieGoals.calorie_intake_goal) * 100)}%
                      </Text>
                      <Text style={styles.summaryLabel}>Of Daily Goal</Text>
                    </View>
                  )}
                </View>
              </Card.Content>
            </Card>
          </View>
        ) : (
          <View style={styles.section}>
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text style={styles.emptyText}>
                  No meals recorded for {formatDate(selectedDate)}
                </Text>
                <Text style={[styles.emptyText, { marginTop: 8, fontSize: 12 }]}>
                  Start by adding meals from the Add Meal screen
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Meal Records */}
        {getMealsForSelectedDate().length > 0 && (
          <View style={styles.section}>
            <View style={styles.recordsHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Meal Records
              </Text>
              {filteredRecords.length > 0 && (
                <Button
                  mode="outlined"
                  onPress={confirmClearAllMeals}
                  icon="delete-sweep"
                  textColor={COLORS.textSecondary}
                  style={styles.clearAllButton}
                >
                  Clear All
                </Button>
              )}
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <PaperActivityIndicator size="large" />
                <Text style={styles.loadingText}>Loading meals...</Text>
              </View>
            ) : filteredRecords.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Card.Content>
                  <Text style={styles.emptyText}>
                    No {selectedMealType} meals recorded for {formatDate(selectedDate)}
                  </Text>
                  <Text style={[styles.emptyText, { marginTop: 8, fontSize: 12 }]}>
                    Try selecting a different date or meal type
                  </Text>
                </Card.Content>
              </Card>
            ) : (
              filteredRecords.map((record, index) => (
                <Card key={record.id} style={styles.mealCard}>
                  <Card.Content>
                    <View style={styles.mealHeader}>
                      <View style={styles.calorieInfo}>
                        <Text style={[styles.calorieValue, { 
                          color: getCalorieStatusColor(record.total_calories, record.meal_type) 
                        }]}>
                          {record.total_calories} cal
                        </Text>
                        {calorieGoals && (
                          <Text style={[styles.calorieGoal, { 
                            color: getCalorieStatusColor(record.total_calories, record.meal_type) 
                          }]}>
                            Goal: {Math.round(calorieGoals.calorie_intake_goal / 4)} cal
                          </Text>
                        )}
                      </View>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => confirmDeleteMeal(record.id, record.meal_type)}
                        disabled={deletingMeal === record.id}
                        iconColor={COLORS.textSecondary}
                      />
                    </View>
                    
                    {record.calorie_status && (
                      <View style={styles.statusContainer}>
                        <Text style={[styles.statusText, { 
                          color: getCalorieStatusColor(record.total_calories, record.meal_type) 
                        }]}>
                          {record.calorie_status.message}
                        </Text>
                      </View>
                    )}
                    
                    <Divider style={styles.divider} />
                    
                    <View style={styles.foodItemsContainer}>
                      <Text variant="bodyMedium" style={styles.foodItemsTitle}>
                        Food Items:
                      </Text>
                      {Array.isArray(record.items) && record.items.length > 0 ? (
                        record.items.map((item, itemIndex) => (
                          <View key={itemIndex} style={styles.foodItem}>
                            <Text style={styles.foodItemName}>{item.food_name}</Text>
                            <Text style={styles.foodItemDetails}>
                              {item.quantity_grams}g • {item.calories} cal
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.emptyText}>No food items recorded</Text>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(tempDate)}
          mode="date"
          display="calendar"
          onChange={(event, selectedDate) => {
            if (event.type === 'set' && selectedDate) {
              const today = new Date();
              today.setHours(23, 59, 59, 999); // Set to end of today
              if (selectedDate <= today) {
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const selectedDateString = `${year}-${month}-${day}`;

                setTempDate(selectedDateString);
                setSelectedDate(selectedDateString);
                setShowDatePicker(false);
              } else {
                Alert.alert('Invalid Date', 'Please select a valid date (not in the future)');
              }
            } else if (event.type === 'dismissed') {
              setShowDatePicker(false);
            }
          }}
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
  content: {
    flex: 1,
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
  segmentedButtons: {
    marginBottom: 8,
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
  mealCard: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  calorieInfo: {
    alignItems: 'flex-end',
  },
  calorieValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  calorieGoal: {
    fontSize: 12,
    marginTop: 2,
  },
  statusContainer: {
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 8,
  },
  foodItemsContainer: {
    marginTop: 8,
  },
  foodItemsTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  foodItemName: {
    flex: 1,
    color: COLORS.textPrimary,
  },
  foodItemDetails: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.backgroundSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearAllButton: {
    marginLeft: 10,
  },

});

export default MealHistoryScreen;

