import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Chip,
  SegmentedButtons,
  HelperText,
  IconButton,
  useTheme
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import mealService from '../../services/mealService';
import { FoodItem, MealItem, CalorieGoals } from '../../types';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';

const AddMealScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [mealDate, setMealDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<MealItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [totalCalories, setTotalCalories] = useState(0);
  const [calorieGoals, setCalorieGoals] = useState<CalorieGoals | null>(null);
  const [quantityInputs, setQuantityInputs] = useState<{[key: number]: string}>({});

  // Lazy loading and pagination
  const [displayedFoodItems, setDisplayedFoodItems] = useState<FoodItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    calculateTotalCalories();
  }, [selectedItems]);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      
      // Load essential data first 
      const [categoriesResponse, calorieGoalsResponse] = await Promise.allSettled([
        mealService.getFoodCategories(),
        mealService.getCalorieGoals()
      ]);

      // Handle categories
      if (categoriesResponse.status === 'fulfilled' && categoriesResponse.value.success) {
        const apiCategories = categoriesResponse.value.categories || [];
        const unwantedCategories = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Nuts', 'Oils', 'Snacks'];
        const filteredApiCategories = apiCategories.filter(cat => !unwantedCategories.includes(cat));
        const allCategories = [...new Set([...fixedCategories, ...filteredApiCategories])];
        setCategories(allCategories);
      } else {
        setCategories(fixedCategories);
      }

      // Handle calorie goals
      if (calorieGoalsResponse.status === 'fulfilled' && calorieGoalsResponse.value.success) {
        setCalorieGoals(calorieGoalsResponse.value.calorieGoals);
      }

      // Load food items separately 
      loadFoodItems();

    } catch (error) {
      console.error('Error loading initial data:', error);
      setCategories(fixedCategories);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadFoodItems = async () => {
    try {
      setLoading(true);
      const response = await mealService.getFoodItems();
      if (response.success) {
        setFoodItems(response.foodItems);
      }
    } catch (error) {
      console.error('Error loading food items:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fixed nutritional categories 
  const fixedCategories = [
    'Bread',
    'Rice',
    'Pasta & Noodles',
    'Fruits',
    'Vegetables',
    'Grains',
    'Protein',
    'Dairy',
    'Nuts & Seeds',
    'Beverages',
    'Desserts',
    'Green Leaves',
    'Sweets',
    'Oils & Fats',
    'Salads'
  ];

  // Removed getServingSize function - users can now enter exact quantities

  // Function to clean bread item names
  const getDisplayName = (item: FoodItem) => {
    if (item.name.toLowerCase().includes('bread') || item.category === 'Bread') {
      // Remove (25g) from bread names
      return item.name.replace(/\s*\(25g\)/gi, '').trim();
    }
    return item.name;
  };

  // Function to display appropriate calorie information for different food types
  const getDisplayCalories = (item: FoodItem) => {
    // For bread items, show calories for a typical serving (25g slice)
    if (item.name.toLowerCase().includes('bread') || item.category === 'Bread') {
      const caloriesPer25g = Math.round((item.calories_per_100g * 25) / 100);
      return `${caloriesPer25g} cal (25g slice)`;
    }
    
    // For other items, show per 100g as usual
    return `${item.calories_per_100g} cal/100g`;
  };

  // Optimized filtering with useMemo 
  const filteredFoodItems = React.useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = (item: FoodItem) => item.name.toLowerCase().includes(searchLower);
    const matchesCategory = (item: FoodItem) => !selectedCategory || item.category === selectedCategory;
    
    return foodItems.filter(item => matchesSearch(item) && matchesCategory(item));
  }, [foodItems, searchQuery, selectedCategory]);

  // Update displayed items when filtered items change
  useEffect(() => {
    const startIndex = 0;
    const endIndex = ITEMS_PER_PAGE;
    const itemsToShow = filteredFoodItems.slice(startIndex, endIndex);
    setDisplayedFoodItems(itemsToShow);
    setCurrentPage(1);
    setHasMoreItems(filteredFoodItems.length > ITEMS_PER_PAGE);
  }, [filteredFoodItems]);

  // Load more items function
  const loadMoreItems = () => {
    if (!hasMoreItems) return;
    
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const newItems = filteredFoodItems.slice(startIndex, endIndex);
    
    if (newItems.length > 0) {
      setDisplayedFoodItems(prev => [...prev, ...newItems]);
      setCurrentPage(prev => prev + 1);
      setHasMoreItems(endIndex < filteredFoodItems.length);
    } else {
      setHasMoreItems(false);
    }
  };

  const calculateTotalCalories = () => {
    const total = selectedItems.reduce((sum, item) => sum + item.calories, 0);
    setTotalCalories(total);
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
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

  const addFoodItem = (foodItem: FoodItem) => {
    const existingItem = selectedItems.find(item => item.food_item_id === foodItem.id);
    
    if (existingItem) {
      // If item already exists, just increment by 10g (small increment)
      const newQuantity = existingItem.quantity_grams + 10;
      const updatedItems = selectedItems.map(item => 
        item.food_item_id === foodItem.id 
          ? { ...item, quantity_grams: newQuantity }
          : item
      );
      setSelectedItems(updatedItems);
      setQuantityInputs({...quantityInputs, [foodItem.id]: newQuantity.toString()});
    } else {
      // Add new item with default quantity (25g for bread, 100g for others)
      const defaultQuantity = (foodItem.name.toLowerCase().includes('bread') || foodItem.category === 'Bread') ? 25 : 100;
      const newItem: MealItem = {
        food_item_id: foodItem.id,
        food_name: foodItem.name,
        quantity_grams: defaultQuantity, // Default 25g for bread, 100g for others
        calories: Math.round((foodItem.calories_per_100g * defaultQuantity) / 100)
      };
      setSelectedItems([...selectedItems, newItem]);
      setQuantityInputs({...quantityInputs, [foodItem.id]: defaultQuantity.toString()});
    }
  };

  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const updatedItems = selectedItems.map(item => {
      if (item.food_item_id === itemId) {
        // Find the food item to get calories_per_100g
        const foodItem = foodItems.find(fi => fi.id === itemId);
        if (foodItem) {
          const calories = Math.round((foodItem.calories_per_100g * quantity) / 100);
          return { ...item, quantity_grams: quantity, calories };
        }
        return item;
      }
      return item;
    });
    setSelectedItems(updatedItems);
  };

  const incrementQuantity = (itemId: number) => {
    const currentItem = selectedItems.find(item => item.food_item_id === itemId);
    if (currentItem) {
      updateItemQuantity(itemId, currentItem.quantity_grams + 1);
    }
  };

  const decrementQuantity = (itemId: number) => {
    const currentItem = selectedItems.find(item => item.food_item_id === itemId);
    if (currentItem && currentItem.quantity_grams > 1) {
      updateItemQuantity(itemId, currentItem.quantity_grams - 1);
    }
  };

  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(item => item.food_item_id !== itemId));
    // Clean up input state
    const newInputs = {...quantityInputs};
    delete newInputs[itemId];
    setQuantityInputs(newInputs);
  };

  const handleBackPress = () => {
    if (selectedItems.length > 0) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved items. Are you sure you want to discard them?',
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

  const saveMeal = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    try {
      setLoading(true);

      
      const response = await mealService.createMealRecord({
        meal_type: mealType,
        meal_date: mealDate,
        items: selectedItems.map(item => ({
          food_item_id: item.food_item_id,
          quantity_grams: item.quantity_grams
        }))
      });

      if (response.success) {
        Alert.alert('Success', 'Meal saved successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving meal:', error);
      Alert.alert('Error', 'Failed to save meal');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    Alert.alert(
      'Save Options',
      'How would you like to save this meal?',
      [
        {
          text: 'Save Meal',
          onPress: saveMeal
        },
        {
          text: 'Save as Template',
          onPress: saveAsTemplate
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const saveAsTemplate = async () => {
    if (selectedItems.length === 0) {
      Alert.alert('Error', 'Please add at least one food item');
      return;
    }

    // Generate a default template name
    const defaultName = `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} Template`;
    
    try {
      setLoading(true);
      
      // Create meal record first 
      const mealResponse = await mealService.createMealRecord({
        meal_type: mealType,
        meal_date: mealDate,
        items: selectedItems.map(item => ({
          food_item_id: item.food_item_id,
          quantity_grams: item.quantity_grams
        }))
      });

      if (!mealResponse.success) {
        throw new Error('Failed to create meal record');
      }

      // Then create meal template
      const templateResponse = await mealService.createMealTemplate({
        name: defaultName,
        meal_type: mealType,
        items: selectedItems.map(item => ({
          food_item_id: item.food_item_id,
          quantity_grams: item.quantity_grams
        }))
      });

      if (templateResponse.success) {
        Alert.alert('Success', `Meal saved and "${defaultName}" template created!`, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // If template creation fails, we still have the meal record
        Alert.alert('Partial Success', 'Meal saved but template creation failed.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Error saving meal as template:', error);
      Alert.alert('Error', 'Failed to save meal and template');
    } finally {
      setLoading(false);
    }
  };

  const getCalorieStatusColor = () => {
    if (!calorieGoals || totalCalories === 0) {
      return COLORS.success;
    }

    const dailyGoal = calorieGoals.calorie_intake_goal;
    const mealTypeGoal = dailyGoal / 4; // Distribute daily goal across 4 meals

    if (totalCalories > mealTypeGoal) {
      return COLORS.error; 
    } else if (totalCalories > mealTypeGoal * 0.8) {
      return COLORS.warning; 
    } else {
      return COLORS.success; 
    }
  };

  const getCalorieStatusText = () => {
    if (totalCalories === 0) {
      return 'No Items';
    }

    if (!calorieGoals) {
      return 'Good';
    }

    const dailyGoal = calorieGoals.calorie_intake_goal;
    const mealTypeGoal = dailyGoal / 4; // Distribute daily goal across 4 meals

    if (totalCalories > mealTypeGoal) {
      return `Exceeding Goal (${mealTypeGoal} cal)`;
    } else if (totalCalories > mealTypeGoal * 0.8) {
      return `Approaching Goal (${mealTypeGoal} cal)`;
    } else {
      return `Within Goal (${mealTypeGoal} cal)`;
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
          Add Meal
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Initial Loading State */}
        {initialLoading ? (
          <View style={styles.loadingContainer}>
            <PaperActivityIndicator size="large" />
            <Text style={styles.loadingText}>Loading food items...</Text>
          </View>
        ) : (
          <>
            {/* Date Selection - Show First */}
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
                {formatDate(tempDate)}
              </Button>
            </View>

            {/* Meal Type Selection - Show Second */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Meal Type
              </Text>
              <SegmentedButtons
                value={mealType}
                onValueChange={setMealType}
                buttons={[
                  { value: 'breakfast', label: 'Breakfast' },
                  { value: 'lunch', label: 'Lunch' },
                  { value: 'dinner', label: 'Dinner' },
                  { value: 'snack', label: 'Snack' }
                ]}
                style={styles.segmentedButtons}
              />
            </View>

            {/* Total Calories - Always Show */}
            <View style={styles.section}>
              <View style={styles.totalSection}>
                <Text variant="titleLarge" style={styles.totalTitle}>
                  Total Calories: {totalCalories}
                </Text>
                <Text style={[styles.calorieStatus, { color: getCalorieStatusColor() }]}>
                  Status: {getCalorieStatusText()}
                </Text>
              </View>
            </View>

            {/* Selected Items - Show when items exist */}
            {selectedItems.length > 0 && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Selected Items ({selectedItems.length})
                </Text>
                <Text variant="bodySmall" style={styles.sectionSubtitle}>
                  Adjust quantities to match what you actually ate
                </Text>
                {selectedItems.map(item => (
                  <Card key={item.food_item_id} style={styles.selectedItemCard}>
                    <Card.Content style={styles.selectedItemContent}>
                      {/* Food Item Header */}
                      <View style={styles.foodItemHeader}>
                        <View style={styles.foodItemInfo}>
                          <Text variant="titleMedium" style={styles.selectedItemName}>
                            {item.food_name}
                          </Text>
                          <View style={styles.calorieBadge}>
                            <Text variant="bodySmall" style={styles.calorieBadgeText}>
                              {item.calories} cal
                            </Text>
                          </View>
                        </View>
                        <IconButton
                          icon="delete"
                          size={20}
                          onPress={() => removeItem(item.food_item_id)}
                          iconColor={COLORS.textSecondary}
                          style={styles.deleteButton}
                        />
                      </View>
                      
                      {/* Quantity Controls */}
                      <View style={styles.quantitySection}>
                        <Text variant="bodySmall" style={styles.quantityLabel}>
                          Quantity (grams)
                        </Text>
                        <View style={styles.quantityControls}>
                          <IconButton
                            icon="minus"
                            size={20}
                            onPress={() => {
                              decrementQuantity(item.food_item_id);
                              const newQuantity = item.quantity_grams - 1;
                              setQuantityInputs({...quantityInputs, [item.food_item_id]: newQuantity.toString()});
                            }}
                            style={styles.quantityButton}
                            iconColor={COLORS.primary}
                          />
                          <View style={styles.quantityInputContainer}>
                            <TextInput
                              value={quantityInputs[item.food_item_id] || item.quantity_grams.toString()}
                              onChangeText={(text) => {
                                setQuantityInputs({...quantityInputs, [item.food_item_id]: text});
                                const quantity = parseInt(text);
                                if (!isNaN(quantity) && quantity > 0) {
                                  updateItemQuantity(item.food_item_id, quantity);
                                }
                              }}
                              onBlur={() => {
                                const currentValue = quantityInputs[item.food_item_id];
                                const quantity = parseInt(currentValue);
                                if (isNaN(quantity) || quantity <= 0) {
                                  setQuantityInputs({...quantityInputs, [item.food_item_id]: item.quantity_grams.toString()});
                                }
                              }}
                              keyboardType="numeric"
                              mode="outlined"
                              style={styles.quantityInput}
                              right={<TextInput.Affix text="g" />}
                              placeholder="Enter amount"
                            />
                          </View>
                          <IconButton
                            icon="plus"
                            size={20}
                            onPress={() => {
                              incrementQuantity(item.food_item_id);
                              const newQuantity = item.quantity_grams + 1;
                              setQuantityInputs({...quantityInputs, [item.food_item_id]: newQuantity.toString()});
                            }}
                            style={styles.quantityButton}
                            iconColor={COLORS.primary}
                          />
                        </View>
                      </View>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}

            {/* Search and Filter */}
            <View style={styles.section}>
              <TextInput
                label="Search food items"
                value={searchQuery}
                onChangeText={setSearchQuery}
                mode="outlined"
                left={<TextInput.Icon icon="magnify" />}
                style={styles.searchInput}
              />
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
                <Chip
                  selected={selectedCategory === ''}
                  onPress={() => setSelectedCategory('')}
                  style={styles.categoryChip}
                >
                  All
                </Chip>

                {categories.map(category => (
                  <Chip
                    key={category}
                    selected={selectedCategory === category}
                    onPress={() => setSelectedCategory(category)}
                    style={styles.categoryChip}
                  >
                    {category}
                  </Chip>
                ))}
              </ScrollView>
            </View>

            {/* Food Items List */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Available Food Items
              </Text>
              <Text variant="bodySmall" style={styles.sectionSubtitle}>
                Tap to add items, then adjust quantities to match what you ate
              </Text>
              {loading ? (
                <View style={styles.foodItemsLoadingContainer}>
                  <PaperActivityIndicator size="small" />
                  <Text style={styles.foodItemsLoadingText}>Loading food items...</Text>
                </View>
              ) : displayedFoodItems.length > 0 ? (
                <>
                  {displayedFoodItems.map(item => (
                    <Card key={item.id} style={styles.foodItemCard}>
                      <Card.Content style={styles.foodItemContent}>
                        <View style={styles.foodItemMainInfo}>
                          <Text variant="titleMedium" style={styles.foodItemName}>
                            {getDisplayName(item)}
                          </Text>
                          <Text variant="bodyMedium" style={styles.foodItemCalories}>
                            {getDisplayCalories(item)}
                          </Text>
                        </View>
                        
                        <View style={styles.foodItemRightSection}>
                          {item.category && (
                            <Chip mode="outlined" style={styles.categoryTag}>
                              {item.category}
                            </Chip>
                          )}
                          <Button
                            mode="contained"
                            onPress={() => addFoodItem(item)}
                            style={styles.addButton}
                            labelStyle={styles.addButtonLabel}
                            theme={{ colors: { primary: COLORS.primary, onPrimary: COLORS.textLight } }}
                          >
                            Add
                          </Button>
                        </View>
                      </Card.Content>
                    </Card>
                  ))}
                  {hasMoreItems && (
                    <Button
                      mode="outlined"
                      onPress={loadMoreItems}
                      style={styles.loadMoreButton}
                      contentStyle={styles.buttonContent}
                      labelStyle={styles.buttonLabel}
                      theme={{ colors: { primary: COLORS.primary, onPrimary: COLORS.textLight } }}
                    >
                      Load More
                    </Button>
                  )}
                </>
              ) : (
                <Text style={styles.noItemsText}>No food items found</Text>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Action Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleNext}
          loading={loading}
          disabled={selectedItems.length === 0}
          style={styles.nextButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          theme={{
            colors: {
              primary: COLORS.primary,
              onPrimary: COLORS.textLight,
            },
          }}
        >
          Record Meal
        </Button>
      </View>

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
                // Use timezone-safe date formatting to avoid UTC conversion issues
                const year = selectedDate.getFullYear();
                const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const day = String(selectedDate.getDate()).padStart(2, '0');
                const selectedDateString = `${year}-${month}-${day}`;
                

                
                setTempDate(selectedDateString);
                setMealDate(selectedDateString); 
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    marginBottom: 12,
    fontStyle: 'italic',
  },

  segmentedButtons: {
    marginBottom: 8,
  },
  searchInput: {
    marginBottom: 12,
  },
  dateButton: {
    marginBottom: 12,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryChip: {
    marginRight: 8,
  },

  foodItemCard: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  foodItemContent: {
    padding: 16,
  },
  foodItemMainInfo: {
    marginBottom: 8,
  },
  foodItemName: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontSize: 17,
    marginBottom: 4,
    lineHeight: 22,
  },
  foodItemCalories: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  foodItemRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    backgroundColor: COLORS.lightPrimary,
    borderColor: COLORS.primary,
    borderWidth: 1,
  },
  addButton: {
    borderRadius: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  addButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedItemCard: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedItemContent: {
    padding: 12,
  },
  foodItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  foodItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedItemName: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    fontSize: 16,
    marginRight: 12,
  },
  calorieBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  calorieBadgeText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  deleteButton: {
    margin: 0,
  },
  quantitySection: {
    backgroundColor: COLORS.lightPrimary,
    padding: 8,
    borderRadius: 8,
  },
  quantityLabel: {
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
    fontSize: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    backgroundColor: COLORS.white,
    margin: 0,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    width: 36,
    height: 36,
  },
  quantityInputContainer: {
    width: 80,
    marginHorizontal: 8,
  },
  quantityInput: {
    backgroundColor: COLORS.white,
    textAlign: 'center',
    height: 36,
    fontSize: 14,
  },
  totalSection: {
    padding: 16,
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  totalTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  calorieGoal: {
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  calorieStatus: {
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    elevation: 4,
  },
  nextButton: {
    width: '60%',
    alignSelf: 'center',
  },
  buttonContent: {
    paddingVertical: 4,
    minHeight: 40,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  templateButton: {
    flex: 1,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  loadMoreButton: {
    marginTop: 12,
    alignSelf: 'center',
  },
  foodItemsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  foodItemsLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  noItemsText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: COLORS.textSecondary,
  },

});

export default AddMealScreen;

