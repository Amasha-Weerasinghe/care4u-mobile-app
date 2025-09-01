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
import sugarService, { SugarSummary } from '../../services/sugarService';
import PaperActivityIndicator from '../../components/PaperActivityIndicator';
import { COLORS } from '../../constants/theme';

const SugarScreen: React.FC = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySummary, setTodaySummary] = useState<SugarSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load today's sugar summary
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await sugarService.getTodaySugarSummary();
      setTodaySummary(response.summary);
    } catch (error) {
      console.error('Error loading today\'s sugar summary:', error);
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

  // Get blood sugar status color
  const getBloodSugarStatusColor = (value: number): string => {
    if (value < 70) return '#FF6B6B'; // Low
    if (value < 100) return '#4CAF50'; // Normal
    if (value < 126) return '#FF9800'; // Elevated
    if (value < 200) return '#F44336'; // High
    return '#9C27B0'; // Very High
  };

  // Navigate to record screen
  const handleRecordBloodSugar = () => {
    navigation.navigate('RecordBloodSugar' as never);
  };

  // Navigate to history screen
  const handleViewHistory = () => {
    navigation.navigate('SugarHistory' as never);
  };

  // Navigate to guidelines screen
  const handleViewGuidelines = () => {
    navigation.navigate('BloodSugarGuidelines' as never);
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
            Let's Track Your Blood Sugar
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Monitor Your Blood Sugar Levels & Maintain Healthy Habits
          </Text>
        </View>

        {/* Action Cards */}
        <View style={styles.actionCards}>
          {/* Record Blood Sugar Card */}
          <TouchableOpacity onPress={handleRecordBloodSugar} style={styles.cardContainer}>
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="test-tube" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Record Blood Sugar
                  </Text>
                  <Text variant="bodyMedium" style={styles.cardSubtitle}>
                    Track Your Blood Sugar Levels
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Blood Sugar History Card */}
          <TouchableOpacity onPress={handleViewHistory} style={styles.cardContainer}>
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="chart-line" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Blood Sugar History
                  </Text>
                  <Text variant="bodyMedium" style={styles.cardSubtitle}>
                    View Your Past Blood Sugar Records
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Guidelines Card */}
          <TouchableOpacity onPress={handleViewGuidelines} style={styles.cardContainer}>
            <Card style={styles.actionCard}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialCommunityIcons name="information" size={32} color={COLORS.primary} />
                </View>
                <View style={styles.cardText}>
                  <Text variant="titleMedium" style={styles.cardTitle}>
                    Blood Sugar Guidelines
                  </Text>
                  <Text variant="bodyMedium" style={styles.cardSubtitle}>
                    Learn About Healthy Blood Sugar Levels
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
                      {todaySummary.totalRecords}
                    </Text>
                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                      RECORDS
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text variant="headlineMedium" style={styles.summaryValue}>
                      {todaySummary.averageBloodSugar}
                    </Text>
                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                      AVERAGE (mg/dL)
                    </Text>
                  </View>
                  <View style={styles.summaryStat}>
                    <Text variant="headlineMedium" style={[
                      styles.summaryValue,
                      { color: todaySummary.averageBloodSugar > 0 ? getBloodSugarStatusColor(todaySummary.averageBloodSugar) : COLORS.primary }
                    ]}>
                                             {todaySummary.averageBloodSugar > 0 ? 
                         (todaySummary.averageBloodSugar < 70 ? 'Low' :
                          todaySummary.averageBloodSugar < 100 ? 'Normal' :
                          todaySummary.averageBloodSugar < 126 ? 'Elevated' :
                          todaySummary.averageBloodSugar < 200 ? 'High' : 'Very High') : 'None'
                       }
                    </Text>
                    <Text variant="bodyMedium" style={styles.summaryLabel}>
                      STATUS
                    </Text>
                  </View>
                </View>

                {/* Progress Bar for Average Blood Sugar */}
                {todaySummary.averageBloodSugar > 0 && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text variant="bodyMedium" style={styles.progressTitle}>
                        Average Blood Sugar Level
                      </Text>
                      <Text variant="bodyMedium" style={[
                        styles.progressValue,
                        { color: getBloodSugarStatusColor(todaySummary.averageBloodSugar) }
                      ]}>
                        {todaySummary.averageBloodSugar} mg/dL
                      </Text>
                    </View>
                    <ProgressBar
                      progress={Math.min(todaySummary.averageBloodSugar / 200, 1)}
                      color={getBloodSugarStatusColor(todaySummary.averageBloodSugar)}
                      style={styles.progressBar}
                    />
                  </View>
                )}

                {/* Today's Records */}
                {todaySummary.records.length > 0 && (
                  <View style={styles.recordsSection}>
                    <Text variant="titleMedium" style={styles.recordsTitle}>
                      Today's Records
                    </Text>
                    {todaySummary.records.slice(0, 3).map((record) => {
                      const statusColor = getBloodSugarStatusColor(record.blood_sugar_value);
                      const statusText = record.blood_sugar_value < 70 ? 'Low' :
                                        record.blood_sugar_value < 100 ? 'Normal' :
                                        record.blood_sugar_value < 126 ? 'Elevated' :
                                        record.blood_sugar_value < 200 ? 'High' : 'Very High';
                      
                      return (
                        <View key={record.id} style={styles.recordItem}>
                          <View style={styles.recordInfo}>
                            <Text variant="bodyMedium" style={styles.mealType}>
                              {record.meal_type.charAt(0).toUpperCase() + record.meal_type.slice(1)}
                            </Text>
                            <Text variant="bodySmall" style={styles.recordTime}>
                              {new Date(record.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Text>
                          </View>
                          <View style={styles.recordValue}>
                            <Text variant="titleMedium" style={[
                              styles.bloodSugarValue,
                              { color: statusColor }
                            ]}>
                              {record.blood_sugar_value}
                            </Text>
                            <Text variant="bodySmall" style={styles.unit}>
                              mg/dL
                            </Text>
                          </View>
                          <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
                            <Text style={styles.statusChipText}>
                              {statusText}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                    {todaySummary.records.length > 3 && (
                      <Text variant="bodySmall" style={styles.moreRecords}>
                        +{todaySummary.records.length - 3} more records
                      </Text>
                    )}
                  </View>
                )}

                {todaySummary.records.length === 0 && (
                  <Text style={styles.noRecordsText}>
                    No blood sugar records for today. Start tracking your blood sugar levels!
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
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  recordsSection: {
    marginTop: 8,
  },
  recordsTitle: {
    marginBottom: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
    marginBottom: 8,
  },
  recordInfo: {
    flex: 1,
  },
  mealType: {
    color: COLORS.text,
    fontWeight: '600',
  },
  recordTime: {
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  recordValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginRight: 12,
  },
  bloodSugarValue: {
    fontWeight: 'bold',
  },
  unit: {
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusChipText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  moreRecords: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  noRecordsText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default SugarScreen;
