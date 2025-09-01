import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button, IconButton, Card, Chip, SegmentedButtons } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/theme';
import mealService from '../../services/mealService';
import { MealTemplate } from '../../types';

const MealTemplatesScreen = () => {
  const navigation = useNavigation();
  const [templates, setTemplates] = useState<MealTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null);
  const [mealDate, setMealDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    loadTemplates();
  }, [selectedMealType]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await mealService.getMealTemplates(selectedMealType);
      if (response.success) {
        setTemplates(response.templates || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      Alert.alert('Error', 'Failed to load meal templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template: MealTemplate) => {
    setSelectedTemplate(template);
    showDatePickerForMealType(template, template.meal_type);
  };

  const showDatePickerForMealType = (template: MealTemplate, selectedMealType: string) => {
    setSelectedTemplate(template);
    (template as any).selectedMealType = selectedMealType;
    setShowDatePicker(true);
  };

  const handleDateConfirm = async (selectedDate: Date) => {
    if (!selectedTemplate) return;
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const selectedDateString = `${year}-${month}-${day}`;
    
    setMealDate(selectedDateString);
    setShowDatePicker(false);

    try {
      setLoading(true);
      
      const mealTypeToUse = (selectedTemplate as any).selectedMealType || selectedTemplate.meal_type;
      
      // Create meal record from template
      const response = await mealService.createMealRecord({
        meal_type: mealTypeToUse,
        meal_date: selectedDateString,
        items: selectedTemplate.items.map(item => ({
          food_item_id: item.food_item_id,
          quantity_grams: item.quantity_grams
        }))
      });

      if (response.success) {
        Alert.alert('Success', `Meal recorded successfully!`, [
          { text: 'OK', onPress: () => {
            setSelectedTemplate(null);
            navigation.goBack();
          }}
        ]);
      }
    } catch (error) {
      console.error('Error creating meal from template:', error);
      Alert.alert('Error', 'Failed to record meal from template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = (template: MealTemplate) => {
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await mealService.deleteMealTemplate(template.id);
              if (response.success) {
                Alert.alert('Success', 'Template deleted successfully!', [
                  { text: 'OK', onPress: () => loadTemplates() }
                ]);
              } else {
                Alert.alert('Error', 'Failed to delete template');
              }
            } catch (error) {
              console.error('Error deleting template:', error);
              Alert.alert('Error', 'Failed to delete template');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const filteredTemplates = templates.filter(template => 
    template.meal_type === selectedMealType
  );

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' }
  ];

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
          Meal Templates
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meal Type Filter */}
        <View style={styles.filterSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Filter by Meal Type
          </Text>
          <SegmentedButtons
            value={selectedMealType}
            onValueChange={setSelectedMealType}
            buttons={mealTypes}
            style={styles.filterButtons}
          />
        </View>

        {/* Templates List */}
        <View style={styles.templatesSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Your Templates
          </Text>
          
          {filteredTemplates.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {`No ${selectedMealType} templates found. Create some in the Add Meal screen!`}
              </Text>
            </View>
          ) : (
            filteredTemplates.map(template => (
              <Card key={template.id} style={styles.templateCard}>
                <Card.Content>
                  <View style={styles.templateHeader}>
                    <View style={styles.templateInfo}>
                                          <Chip mode="outlined" style={styles.mealTypeChip}>
                      {template.meal_type.charAt(0).toUpperCase() + template.meal_type.slice(1)}
                    </Chip>
                      <Text variant="bodyMedium" style={styles.calorieInfo}>
                        {template.total_calories} calories
                      </Text>
                    </View>
                    <View style={styles.templateActions}>
                      <Button
                        mode="contained"
                        onPress={() => handleUseTemplate(template)}
                        style={styles.recordButton}
                        contentStyle={styles.recordButtonContent}
                        labelStyle={styles.recordButtonLabel}
                        theme={{ colors: { primary: COLORS.primary, onPrimary: COLORS.textLight } }}
                      >
                        Record New Meal
                      </Button>
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDeleteTemplate(template)}
                        iconColor={COLORS.textSecondary}
                      />
                    </View>
                  </View>
                  
                  {/* Template Items */}
                  <View style={styles.itemsSection}>
                    <Text variant="bodySmall" style={styles.itemsTitle}>
                      Items ({template.items.length}):
                    </Text>
                    {template.items.map((item, index) => (
                      <Text key={index} style={styles.itemText}>
                        • {item.food_name} ({item.quantity_grams}g - {item.calories} cal)
                      </Text>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={new Date(mealDate)}
          mode="date"
          display="calendar"
                      onChange={(event, selectedDate) => {
              if (event.type === 'set' && selectedDate) {
              const today = new Date();
              today.setHours(23, 59, 59, 999);
              if (selectedDate <= today) {
                handleDateConfirm(selectedDate);
              } else {
                Alert.alert('Invalid Date', 'Please select a valid date (not in the future)');
              }
            } else if (event.type === 'dismissed') {
              setShowDatePicker(false);
              setSelectedTemplate(null);
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
  filterSection: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  filterButtons: {
    marginBottom: 8,
  },
  templatesSection: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  templateCard: {
    marginBottom: 12,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  mealTypeChip: {
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  calorieInfo: {
    color: COLORS.textSecondary,
  },
  templateActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordButton: {
    marginRight: 8,
  },
  recordButtonContent: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 32,
  },
  recordButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  itemsSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  itemsTitle: {
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
});

export default MealTemplatesScreen;

