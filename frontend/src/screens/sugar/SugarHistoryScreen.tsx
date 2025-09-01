import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  IconButton,
  SegmentedButtons,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import sugarService, { SugarRecord, SugarSummary } from '../../services/sugarService';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';
import { COLORS } from '../../constants/theme';

const SugarHistoryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sugarRecords, setSugarRecords] = useState<SugarRecord[]>([]);
  const [sugarSummary, setSugarSummary] = useState<SugarSummary | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<string>('breakfast');
  const [deletingRecord, setDeletingRecord] = useState<number | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Load sugar records
  const loadSugarRecords = useCallback(async () => {
    setLoading(true);
    try {
      const dateString = formatDateForAPI(selectedDate);
      const mealTypeFilter = selectedMealType;
      
      const [recordsResponse, summaryResponse] = await Promise.all([
        sugarService.getSugarRecords(dateString, mealTypeFilter),
        sugarService.getSugarSummary(dateString)
      ]);

      setSugarRecords(recordsResponse.records);
      setSugarSummary(summaryResponse.summary);
    } catch (error) {
      console.error('Error loading sugar records:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to load sugar records',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedMealType]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSugarRecords();
    setRefreshing(false);
  }, [loadSugarRecords]);

  const handleDateConfirm = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    setDeletingRecord(recordId);
    try {
      await sugarService.deleteSugarRecord(recordId);
      await loadSugarRecords();
    } catch (error) {
      console.error('Error deleting sugar record:', error);
      Alert.alert('Error', 'Failed to delete sugar record. Please try again.');
    } finally {
      setDeletingRecord(null);
    }
  };

  const confirmDeleteRecord = (recordId: number) => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this blood sugar record?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteRecord(recordId),
        },
      ]
    );
  };

  const handleClearAllRecords = async () => {
    setClearingAll(true);
    try {
      const dateString = formatDateForAPI(selectedDate);
      const response = await sugarService.deleteSugarRecordsByDateAndType(
        dateString,
        selectedMealType
      );
      Alert.alert('Success', `${response.deletedCount} records deleted successfully.`);
      await loadSugarRecords();
    } catch (error) {
      console.error('Error clearing all records:', error);
      Alert.alert('Error', 'Failed to clear all records. Please try again.');
    } finally {
      setClearingAll(false);
    }
  };

  // Confirm clear all records
  const confirmClearAllRecords = () => {
    Alert.alert(
      'Clear All Records',
      `Are you sure you want to delete all ${selectedMealType} records for ${formatDate(selectedDate)}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: handleClearAllRecords,
        },
      ]
    );
  };

  // Get blood sugar status color
  const getBloodSugarStatusColor = (value: number): string => {
    if (value < 70) return '#FF6B6B'; // Low
    if (value < 100) return '#4CAF50'; // Normal
    if (value < 126) return '#FF9800'; // Elevated
    if (value < 200) return '#F44336'; // High
    return '#9C27B0'; // Very High
  };

  // Get blood sugar status text
  const getBloodSugarStatusText = (value: number): string => {
    if (value < 70) return 'Low';
    if (value < 100) return 'Normal';
    if (value < 126) return 'Elevated';
    if (value < 200) return 'High';
    return 'Very High';
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadSugarRecords();
    }, [loadSugarRecords])
  );

  // Filter records based on selected meal type
  const filteredRecords = sugarRecords.filter(record => record.meal_type === selectedMealType);
  
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
          Blood Sugar Records
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

          {/* Meal Type */}
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
                { value: 'dinner', label: 'Dinner' }
              ]}
              style={styles.segmentedButtons}
            />
          </View>

        {/* Daily Summary */}
        {sugarSummary && (
          <View style={styles.section}>
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.summaryTitle}>
                  Daily Summary
                </Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {sugarSummary.totalRecords}
                    </Text>
                    <Text style={styles.summaryLabel}>
                      Records
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {sugarSummary.averageBloodSugar}
                    </Text>
                    <Text style={styles.summaryLabel}>
                      Average (mg/dL)
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text style={styles.summaryValue}>
                      {sugarSummary.averageBloodSugar > 0 ? 
                        (sugarSummary.averageBloodSugar < 70 ? 'Low' :
                         sugarSummary.averageBloodSugar < 100 ? 'Normal' :
                         sugarSummary.averageBloodSugar < 126 ? 'Elevated' :
                         sugarSummary.averageBloodSugar < 200 ? 'High' : 'Very High') : 'None'
                      }
                    </Text>
                    <Text style={styles.summaryLabel}>
                      Status
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Sugar Records */}
        <View style={styles.section}>
          <View style={styles.recordsHeader}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Blood Sugar Records
            </Text>
            {filteredRecords.length > 0 && (
              <Button
                mode="outlined"
                onPress={confirmClearAllRecords}
                disabled={clearingAll}
                icon="delete-sweep"
                textColor={COLORS.textSecondary}
                style={styles.clearAllButton}
              >
                Clear All
              </Button>
            )}
          </View>
          {filteredRecords.length === 0 ? (
            <Text style={styles.noRecordsText}>
              No blood sugar records found for this date and meal type.
            </Text>
          ) : (
            filteredRecords.map((record) => {
              const statusColor = getBloodSugarStatusColor(record.blood_sugar_value);
              const statusText = getBloodSugarStatusText(record.blood_sugar_value);
              
              return (
                <Card key={record.id} style={styles.recordCard}>
                  <Card.Content style={styles.recordCardContent}>
                    <View style={styles.recordInfo}>
                      <Text variant="titleMedium" style={styles.mealType}>
                        {record.meal_type.charAt(0).toUpperCase() + record.meal_type.slice(1)}
                      </Text>
                      <Text variant="bodyMedium" style={styles.recordDate}>
                        {new Date(record.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    
                    <View style={styles.recordDetails}>
                      <View style={styles.bloodSugarValue}>
                        <Text variant="headlineMedium" style={[styles.value, { color: statusColor }]}>
                          {record.blood_sugar_value}
                        </Text>
                        <Text variant="bodyMedium" style={styles.unit}>
                          mg/dL
                        </Text>
                      </View>
                      
                      <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
                        <Text style={styles.statusChipText}>
                          {statusText}
                        </Text>
                      </View>
                    </View>
                    
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => confirmDeleteRecord(record.id)}
                      disabled={deletingRecord === record.id}
                      iconColor={COLORS.textSecondary}
                    />
                  </Card.Content>
                </Card>
              );
            })
          )}
        </View>

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
  dateButton: {
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  card: {
    marginBottom: 16,
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
  noRecordsText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 16,
  },
  recordCard: {
    marginBottom: 8,
    backgroundColor: COLORS.white,
  },
  recordCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  mealType: {
    color: COLORS.text,
    fontWeight: '600',
  },
  recordDate: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recordDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bloodSugarValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontWeight: 'bold',
  },
  unit: {
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusMessage: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
});

export default SugarHistoryScreen;
