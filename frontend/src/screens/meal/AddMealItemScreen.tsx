import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Text, 
  TextInput, 
  Button, 
  SegmentedButtons,
  HelperText,
  IconButton,
  Chip,
  List
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import mealService from '../../services/mealService';

const AddMealItemScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Check if we're in edit mode
  const editItem = (route.params as any)?.item;
  const isEditMode = !!editItem;
  
  const [category, setCategory] = useState<string>('');
  const [itemName, setItemName] = useState('');
  const [quantityGrams, setQuantityGrams] = useState('100');
  const [calories, setCalories] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'add' | 'update'>('add');
  const [userFoodItems, setUserFoodItems] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  // Function to display appropriate calorie information for different food types
  const getDisplayCalories = () => {
    const caloriesPer100g = calculateCaloriesPer100g();
    if (caloriesPer100g <= 0) return '';
    
    // For bread items, show calories for a typical serving 
    if (itemName.toLowerCase().includes('bread') || category === 'Bread') {
      const caloriesPer25g = Math.round((caloriesPer100g * 25) / 100);
      return `${caloriesPer25g} cal (25g slice)`;
    }
    
    // For other items, show per 100g as usual
    return `${caloriesPer100g} cal/100g`;
  };

  useEffect(() => {
    loadCategories();
    loadUserFoodItems();
  }, []);

  // Update quantity when category changes
  useEffect(() => {
    if (category === 'Bread') {
      setQuantityGrams('25');
    } else if (quantityGrams === '25' && category !== 'Bread') {
      setQuantityGrams('100');
    }
  }, [category]);

  const loadCategories = async () => {
    try {
      const response = await mealService.getFoodCategories();
      if (response.success) {
        const apiCategories = response.categories || [];
        const unwantedCategories = ['Breakfast', 'Nuts', 'Oils', 'Snacks'];
        const filteredApiCategories = apiCategories.filter(cat => !unwantedCategories.includes(cat));
        const allCategories = [...new Set([...fixedCategories, ...filteredApiCategories])];
        setCategories(allCategories);
      } else {
        setCategories(fixedCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(fixedCategories);
    }
  };

  const loadUserFoodItems = async () => {
    try {
      const response = await mealService.getUserFoodItems();
      if (response.success) {
        setUserFoodItems(response.foodItems);
      }
    } catch (error) {
      console.error('Error loading user food items:', error);
    }
  };

  const loadEditData = (item: any) => {
    setCategory(item.category);
    setItemName(item.name);
    // Set appropriate default quantity based on category
    const defaultQuantity = item.category === 'Bread' ? '25' : '100';
    setQuantityGrams(defaultQuantity); 
    setCalories(item.calories_per_100g.toString());
    setOriginalData({
      category: item.category,
      name: item.name,
      calories_per_100g: item.calories_per_100g
    });
    setSelectedItem(item);
  };

  const handleCategorySelect = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setHasChanges(true);
  };

  const validateForm = () => {
    if (!category) {
      Alert.alert('Error', 'Please select or add a category');
      return false;
    }
    if (!itemName.trim()) {
      Alert.alert('Error', 'Please enter meal item name');
      return false;
    }
    if (!quantityGrams || parseFloat(quantityGrams) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return false;
    }
    if (!calories || parseFloat(calories) <= 0) {
      Alert.alert('Error', 'Please enter valid calories');
      return false;
    }
    return true;
  };

  const saveMealItem = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      // Calculate calories per 100g for storage
      const quantity = parseFloat(quantityGrams);
      const totalCalories = parseFloat(calories);
      const caloriesPer100g = Math.round((totalCalories / quantity) * 100);

      const foodItemData = {
        name: itemName.trim(),
        category: category,
        calories_per_100g: caloriesPer100g,
        is_veg: true 
      };

      let response;
      if (selectedItem) {
        // Update existing item
        response = await mealService.updateFoodItem(selectedItem.id, foodItemData);
        if (response.success) {
          Alert.alert('Success', 'Meal item updated successfully!', [
            { text: 'OK', onPress: () => {
              loadUserFoodItems(); 
              setSelectedItem(null);
              setCategory('');
              setItemName('');
              setQuantityGrams('100');
              setCalories('');
              setHasChanges(false);
            }}
          ]);
        }
      } else {
        // Create new item
        response = await mealService.createFoodItem(foodItemData);
        if (response.success) {
          Alert.alert('Success', 'Meal item added successfully!', [
            { text: 'OK', onPress: () => {
              loadUserFoodItems(); 
              setCategory('');
              setItemName('');
              setQuantityGrams('100');
              setCalories('');
              setHasChanges(false);
            }}
          ]);
        }
      }
    } catch (error) {
      console.error('Error saving meal item:', error);
      Alert.alert('Error', isEditMode ? 'Failed to update meal item' : 'Failed to save meal item');
    } finally {
      setLoading(false);
    }
  };

  const calculateCaloriesPer100g = () => {
    const quantity = parseFloat(quantityGrams) || 0;
    const totalCalories = parseFloat(calories) || 0;
    
    if (quantity > 0 && totalCalories > 0) {
      return Math.round((totalCalories / quantity) * 100);
    }
    return 0;
  };

  const handleDeleteItem = (itemId: number) => {
    Alert.alert(
      'Delete Meal Item',
      'Are you sure you want to delete this meal item? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await mealService.deleteFoodItem(itemId);
              if (response.success) {
                Alert.alert('Success', 'Meal item deleted successfully!', [
                  { text: 'OK', onPress: () => {
                    loadUserFoodItems(); 
                    setSelectedItem(null);
                    setCategory('');
                    setItemName('');
                    setQuantityGrams('100');
                    setCalories('');
                    setHasChanges(false);
                  }}
                ]);
              }
            } catch (error) {
              console.error('Error deleting meal item:', error);
              Alert.alert('Error', 'Failed to delete meal item');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBackPress = () => {
    if (hasChanges) {
      Alert.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() }
        ]
      );
    } else {
      navigation.goBack();
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
          {activeTab === 'update' && selectedItem ? 'Edit Meal Item' : 'Add Meal Item'}
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tab Selection */}
        <View style={styles.tabContainer}>
          <SegmentedButtons
            value={activeTab}
            onValueChange={(value) => {
              setActiveTab(value as 'add' | 'update');
              setCategory('');
              setItemName('');
              setQuantityGrams('100');
              setCalories('');
              setSelectedItem(null);
              setHasChanges(false);
            }}
            buttons={[
              { value: 'add', label: 'Add New' },
              { value: 'update', label: 'Update' }
            ]}
            style={styles.tabButtons}
          />
        </View>

        {activeTab === 'add' ? (
          /* Add New Tab Content */
          <>
            {/* Category Selection */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Select Category
              </Text>
              
              {/* Nutritional Categories */}
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    selected={category === cat}
                    onPress={() => handleCategorySelect(cat)}
                    style={styles.gridCategoryChip}
                    mode={category === cat ? "flat" : "outlined"}
                  >
                    {cat}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Meal Item Name */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Meal Item Name
              </Text>
              <TextInput
                label="Enter meal item name"
                value={itemName}
                onChangeText={(text) => {
                  setItemName(text);
                  setHasChanges(true);
                }}
                mode="outlined"
                style={styles.input}
                placeholder="e.g., Grilled Chicken Breast"
              />
            </View>

            {/* Quantity and Calories */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Quantity & Calories
              </Text>
              
              <View style={styles.row}>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Quantity (grams)"
                    value={quantityGrams}
                    onChangeText={(text) => {
                      setQuantityGrams(text);
                      setHasChanges(true);
                    }}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="100"
                    right={<TextInput.Affix text="g" />}
                  />
                </View>
                <View style={styles.halfWidth}>
                  <TextInput
                    label="Calories"
                    value={calories}
                    onChangeText={(text) => {
                      setCalories(text);
                      setHasChanges(true);
                    }}
                    mode="outlined"
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="165"
                    right={<TextInput.Affix text="cal" />}
                  />
                </View>
              </View>

              {/* Calories calculation */}
              {calculateCaloriesPer100g() > 0 && (
                <View style={styles.calculationCard}>
                  <Text style={styles.calculationTitle}>
                    {itemName.toLowerCase().includes('bread') || category === 'Bread' ? 'Calories per slice:' : 'Calories per 100g:'}
                  </Text>
                  <Text style={styles.calculationValue}>{getDisplayCalories()}</Text>
                </View>
              )}
            </View>

            {/* Preview */}
            {itemName && category && (
              <View style={styles.section}>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Preview
                </Text>
                <View style={styles.previewCard}>
                  <Text style={styles.previewTitle}>{itemName}</Text>
                  <Text style={styles.previewCategory}>Category: {category}</Text>
                  <Text style={styles.previewDetails}>
                    {quantityGrams}g = {calories} calories ({getDisplayCalories()})
                  </Text>
                </View>
              </View>
            )}
          </>
        ) : (
          /* Update Tab Content */
          <>
            {/* User's Food Items List */}
            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Your Food Items
              </Text>
              {userFoodItems.length === 0 ? (
                <Text style={styles.emptyText}>No food items found. Create some in the "Add New" tab!</Text>
              ) : (
                userFoodItems.map((item) => (
                  <List.Item
                    key={item.id}
                    title={item.name}
                    description={`${item.category} • ${item.name.toLowerCase().includes('bread') || item.category === 'Bread' ? `${Math.round((item.calories_per_100g * 25) / 100)} cal (25g slice)` : `${item.calories_per_100g} cal/100g`}`}
                    left={(props) => <List.Icon {...props} icon="food" />}
                    right={(props) => (
                      <View style={styles.itemActions}>
                        <IconButton
                          {...props}
                          icon="pencil"
                          size={20}
                          onPress={() => loadEditData(item)}
                        />
                        <IconButton
                          {...props}
                          icon="delete"
                          size={20}
                          iconColor={COLORS.textSecondary}
                          onPress={() => handleDeleteItem(item.id)}
                        />
                      </View>
                    )}
                    style={[
                      styles.listItem,
                      selectedItem?.id === item.id && styles.selectedListItem
                    ]}
                  />
                ))
              )}
            </View>

            {/* Edit Form (only show when item is selected) */}
            {selectedItem && (
              <>
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Edit: {selectedItem.name}
                  </Text>
                  
                  {/* Category Selection */}
                  <View style={styles.categoriesGrid}>
                    {categories.map((cat) => (
                      <Chip
                        key={cat}
                        selected={category === cat}
                        onPress={() => handleCategorySelect(cat)}
                        style={styles.gridCategoryChip}
                        mode={category === cat ? "flat" : "outlined"}
                      >
                        {cat}
                      </Chip>
                    ))}
                  </View>
                </View>

                {/* Meal Item Name */}
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Meal Item Name
                  </Text>
                  <TextInput
                    label="Enter meal item name"
                    value={itemName}
                    onChangeText={(text) => {
                      setItemName(text);
                      setHasChanges(true);
                    }}
                    mode="outlined"
                    style={styles.input}
                    placeholder="e.g., Grilled Chicken Breast"
                  />
                </View>

                {/* Quantity and Calories */}
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Quantity & Calories
                  </Text>
                  
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <TextInput
                        label="Quantity (grams)"
                        value={quantityGrams}
                        onChangeText={(text) => {
                          setQuantityGrams(text);
                          setHasChanges(true);
                        }}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="100"
                        right={<TextInput.Affix text="g" />}
                      />
                    </View>
                    <View style={styles.halfWidth}>
                      <TextInput
                        label="Calories"
                        value={calories}
                        onChangeText={(text) => {
                          setCalories(text);
                          setHasChanges(true);
                        }}
                        mode="outlined"
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="165"
                        right={<TextInput.Affix text="cal" />}
                      />
                    </View>
                  </View>

                  {/* Calories calculation */}
                  {calculateCaloriesPer100g() > 0 && (
                    <View style={styles.calculationCard}>
                      <Text style={styles.calculationTitle}>
                        {itemName.toLowerCase().includes('bread') || category === 'Bread' ? 'Calories per slice:' : 'Calories per 100g:'}
                      </Text>
                      <Text style={styles.calculationValue}>{getDisplayCalories()}</Text>
                    </View>
                  )}
                </View>

                {/* Preview */}
                {itemName && category && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Preview
                    </Text>
                    <View style={styles.previewCard}>
                      <Text style={styles.previewTitle}>{itemName}</Text>
                      <Text style={styles.previewCategory}>Category: {category}</Text>
                      <Text style={styles.previewDetails}>
                        {quantityGrams}g = {calories} calories ({getDisplayCalories()})
                      </Text>
                    </View>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={saveMealItem}
          loading={loading}
          disabled={!category || !itemName.trim() || !quantityGrams || !calories}
          style={styles.saveButton}
          contentStyle={styles.buttonContent}
          labelStyle={styles.buttonLabel}
          theme={{
            colors: {
              primary: COLORS.primary,
              onPrimary: COLORS.textLight,
            },
          }}
        >
          {selectedItem ? 'Update' : 'Save'}
        </Button>
      </View>
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

  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCategoryChip: {
    marginBottom: 8,
  },
  categoryGroupTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
    marginTop: 16,
  },

  selectedCategorySection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.lightPurple,
    borderRadius: 8,
  },
  selectedCategoryText: {
    color: COLORS.white,
    fontWeight: '500',
  },
  selectedCategoryName: {
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  calculationCard: {
    backgroundColor: COLORS.lightPrimary,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  calculationTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  calculationValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  previewCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  previewCategory: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 4,
  },
  previewDetails: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: 16,
    backgroundColor: COLORS.white,
    elevation: 4,
  },
  saveButton: {
    paddingVertical: 4,
  },
  buttonContent: {
    paddingVertical: 4,
    minHeight: 40,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },

  tabContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  tabButtons: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 20,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItem: {
    marginBottom: 4,
    borderRadius: 8,
  },
  selectedListItem: {
    backgroundColor: COLORS.lightPrimary,
  },
});

export default AddMealItemScreen;
