import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS } from '../constants/theme';
import mealService from '../services/mealService';
import sugarService from '../services/sugarService';
import exerciseService from '../services/exerciseService';
import { CalorieGoals } from '../types';
import { SugarRecord, SugarSummary } from '../services/sugarService';
import { ExerciseActivity, ExerciseSummary } from '../services/exerciseService';

const { width: screenWidth } = Dimensions.get('window');

type ChartType = 'meal' | 'sugar' | 'exercise';
type TimeRange = 'weekly' | 'monthly';

// Helper function to group data by weeks within the current month
const groupDataByWeeks = (records: any[], valueKey: string) => {
  const weeklyData: { weekNumber: number; total: number; count: number; startDate: string }[] = [];
  
  records.forEach((record) => {
    const recordDate = new Date(record.date);
    const dayOfMonth = recordDate.getDate();
    const weekNumber = Math.ceil(dayOfMonth / 7);
    
    const existingWeek = weeklyData.find(week => week.weekNumber === weekNumber);
    
    if (existingWeek) {
      existingWeek.total += record[valueKey] || 0;
      existingWeek.count += 1;
    } else {
      weeklyData.push({
        weekNumber,
        total: record[valueKey] || 0,
        count: 1,
        startDate: record.date,
      });
    }
  });
  
  return weeklyData.sort((a, b) => a.weekNumber - b.weekNumber);
};

interface ChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
    color?: (opacity: number) => string;
    strokeWidth?: number;
  }>;
}

interface AnalyticsSummary {
  totalCalories: number;
  averageCalories: number;
  totalMeals: number;
  averageBloodSugar: number;
  totalSugarRecords: number;
  totalCaloriesBurned: number;
  totalExerciseSessions: number;
  averageCaloriesBurned: number;
}

const AnalyticsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeChart, setActiveChart] = useState<ChartType>('meal');
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mealData, setMealData] = useState<ChartData | null>(null);
  const [sugarData, setSugarData] = useState<ChartData | null>(null);
  const [exerciseData, setExerciseData] = useState<ChartData | null>(null);
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalCalories: 0,
    averageCalories: 0,
    totalMeals: 0,
    averageBloodSugar: 0,
    totalSugarRecords: 0,
    totalCaloriesBurned: 0,
    totalExerciseSessions: 0,
    averageCaloriesBurned: 0,
  });
  const [hasData, setHasData] = useState(false);

  // Tooltip state for chart data points
  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    value: number;
    label: string;
    x: number;
    y: number;
  } | null>(null);

  // Cache for storing loaded data
  const [dataCache, setDataCache] = useState<{
    meal: { [key: string]: any };
    sugar: { [key: string]: any };
    exercise: { [key: string]: any };
  }>({
    meal: {},
    sugar: {},
    exercise: {},
  });

  useEffect(() => {
    loadChartData();
  }, [activeChart, timeRange]);

  // Generate date range for the selected time period
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    
    // Get today's date
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (timeRange === 'weekly') {
      const currentDayOfWeek = today.getDay();
      const daysToSubtract = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
      
      // Start from Monday of current week
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysToSubtract);
      
      // End on Sunday of current week 
      endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6);
    } else {
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    }
    
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayString = formatLocalDate(today);
    const startDateString = formatLocalDate(startDate);
    const endDateString = formatLocalDate(endDate);
    
    return { startDate, endDate };
  };

  // Generate cache key for current chart and time range
  const getCacheKey = (chartType: ChartType) => {
    const { startDate, endDate } = getDateRange();
    const formatLocalDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    return `${chartType}_${timeRange}_${formatLocalDate(startDate)}_${formatLocalDate(endDate)}`;
  };

  const loadChartData = async (clearCache = false) => {
    setLoading(true);
    try {
      if (clearCache) {
        setDataCache({
          meal: {},
          sugar: {},
          exercise: {},
        });
      }
      
      switch (activeChart) {
        case 'meal':
          await loadMealData();
          break;
        case 'sugar':
          await loadSugarData();
          break;
        case 'exercise':
          await loadExerciseData();
          break;
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChartData(true);
    setRefreshing(false);
  };

  const loadMealData = async () => {
    try {
      const cacheKey = getCacheKey('meal');
      
      if (dataCache.meal[cacheKey]) {
        const cachedData = dataCache.meal[cacheKey];
        setMealData(cachedData.chartData);
        setSummary(prev => ({ ...prev, ...cachedData.summary }));
        setHasData(cachedData.hasData);
        return;
      }

      const { startDate, endDate } = getDateRange();
      
      // Generate all dates in range
      const dates = [];
      const currentDate = new Date(startDate);
      const endDateCopy = new Date(endDate);
      
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      while (currentDate <= endDateCopy) {
        dates.push(formatLocalDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Parallel API calls for all dates
      const apiPromises = dates.map(async (dateStr) => {
        try {
          const response = await mealService.getMealRecords(dateStr);
          return {
            date: dateStr,
            success: response.success,
            records: response.records || [],
          };
        } catch (error) {
          return {
            date: dateStr,
            success: false,
            records: [],
          };
        }
      });

      const results = await Promise.all(apiPromises);
      
      // Process results
      const records = results.map(result => ({
        date: result.date,
        calories: result.success && result.records.length > 0 
          ? result.records.reduce((sum, record) => sum + record.total_calories, 0)
          : 0,
      }));

      let totalCalories = 0;
      let totalMeals = 0;

      results.forEach(result => {
        if (result.success && result.records.length > 0) {
          totalCalories += result.records.reduce((sum, record) => sum + record.total_calories, 0);
          totalMeals += result.records.length;
        }
      });

      // Generate chart data
      let chartData: ChartData;
      if (timeRange === 'monthly') {
        const weeklyData = groupDataByWeeks(records, 'calories');
        chartData = {
          labels: weeklyData.map(week => `Week ${week.weekNumber.toString().padStart(2, '0')}`),
          datasets: [{
            data: weeklyData.map(week => week.total),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          }],
        };
      } else {
        // For weekly view, show daily data
        chartData = {
          labels: records.map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          }),
          datasets: [{
            data: records.map(r => r.calories),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          }],
        };
      }

      const hasAnyData = records.some(r => r.calories > 0);
      const summaryData = {
        totalCalories,
        averageCalories: records.length > 0 ? totalCalories / records.length : 0,
        totalMeals,
      };
      setDataCache(prev => ({
        ...prev,
        meal: {
          ...prev.meal,
          [cacheKey]: {
            chartData,
            summary: summaryData,
            hasData: hasAnyData,
          },
        },
      }));

      setMealData(chartData);
      setSummary(prev => ({ ...prev, ...summaryData }));
      setHasData(hasAnyData);
    } catch (error) {
      console.error('Error loading meal data:', error);
    }
  };

  const loadSugarData = async () => {
    try {
      const cacheKey = getCacheKey('sugar');
      
      if (dataCache.sugar[cacheKey]) {
        const cachedData = dataCache.sugar[cacheKey];
        setSugarData(cachedData.chartData);
        setSummary(prev => ({ ...prev, ...cachedData.summary }));
        setHasData(cachedData.hasData);
        return;
      }

      const { startDate, endDate } = getDateRange();
      
      // Generate all dates in range
      const dates = [];
      const currentDate = new Date(startDate);
      const endDateCopy = new Date(endDate);
      
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      while (currentDate <= endDateCopy) {
        dates.push(formatLocalDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Parallel API calls for all dates
      const apiPromises = dates.map(async (dateStr) => {
        try {
          const response = await sugarService.getSugarRecords(dateStr);
          return {
            date: dateStr,
            success: response.success,
            records: response.records || [],
          };
        } catch (error) {
          return {
            date: dateStr,
            success: false,
            records: [],
          };
        }
      });

      const results = await Promise.all(apiPromises);
      
      // Process all records efficiently
      const allRecords: SugarRecord[] = [];
      results.forEach(result => {
        if (result.success && result.records.length > 0) {
          allRecords.push(...result.records);
        }
      });

      // Group by date and calculate averages
      const dailyAverages: { [key: string]: number[] } = {};
      allRecords.forEach(record => {
        const date = record.record_date.split('T')[0];
        if (!dailyAverages[date]) {
          dailyAverages[date] = [];
        }
        dailyAverages[date].push(record.blood_sugar_value);
      });

      // Fill in missing dates with 0
      const chartRecords = dates.map(dateStr => ({
        date: dateStr,
        average: dailyAverages[dateStr] && dailyAverages[dateStr].length > 0 
          ? dailyAverages[dateStr].reduce((sum, val) => sum + val, 0) / dailyAverages[dateStr].length 
          : 0,
      }));

      // Generate chart data
      let chartData: ChartData;
      if (timeRange === 'monthly') {
        const weeklyData = groupDataByWeeks(chartRecords, 'average');
        chartData = {
          labels: weeklyData.map(week => `Week ${week.weekNumber.toString().padStart(2, '0')}`),
          datasets: [{
            data: weeklyData.map(week => week.total / week.count),
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 3,
          }],
        };
      } else {
        // For weekly view, show daily data
        chartData = {
          labels: chartRecords.map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          }),
          datasets: [{
            data: chartRecords.map(r => r.average),
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 3,
          }],
        };
      }

      const hasAnyData = chartRecords.some(r => r.average > 0);
      const totalSugarRecords = allRecords.length;
      const averageBloodSugar = totalSugarRecords > 0
        ? allRecords.reduce((sum, record) => sum + record.blood_sugar_value, 0) / totalSugarRecords
        : 0;

      const summaryData = {
        averageBloodSugar,
        totalSugarRecords,
      };

      
      setDataCache(prev => ({
        ...prev,
        sugar: {
          ...prev.sugar,
          [cacheKey]: {
            chartData,
            summary: summaryData,
            hasData: hasAnyData,
          },
        },
      }));

      setSugarData(chartData);
      setSummary(prev => ({ ...prev, ...summaryData }));
      setHasData(hasAnyData);
    } catch (error) {
      console.error('Error loading sugar data:', error);
    }
  };

  const loadExerciseData = async () => {
    try {
      const cacheKey = getCacheKey('exercise');
      
      if (dataCache.exercise[cacheKey]) {
        const cachedData = dataCache.exercise[cacheKey];
        setExerciseData(cachedData.chartData);
        setSummary(prev => ({ ...prev, ...cachedData.summary }));
        setHasData(cachedData.hasData);
        return;
      }

      const { startDate, endDate } = getDateRange();
      const dates = [];
      const currentDate = new Date(startDate);
      const endDateCopy = new Date(endDate);
      
      const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      while (currentDate <= endDateCopy) {
        dates.push(formatLocalDate(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Single API call to get all exercise history
      const response = await exerciseService.getExerciseHistory({});
      const allActivities = response.activities;

      // Filter activities within the date range
      const filteredActivities = allActivities.filter(activity => {
        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        
        let activityDateStr;
        if (typeof activity.activity_date === 'string') {
          
          activityDateStr = activity.activity_date.split('T')[0];
        } else {
        
          const activityDate = new Date(activity.activity_date);
          activityDateStr = formatLocalDate(activityDate);
        }
        
        const startDateStr = formatLocalDate(startDate);
        const endDateStr = formatLocalDate(endDate);
        
        return activityDateStr >= startDateStr && activityDateStr <= endDateStr;
      });

      // Group by date and calculate total calories burned
      const dailyCalories: { [key: string]: number } = {};
      filteredActivities.forEach(activity => {
        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };
        
        let dateStr;
        if (typeof activity.activity_date === 'string') {
          dateStr = activity.activity_date.split('T')[0];
        } else {
          const activityDate = new Date(activity.activity_date);
          dateStr = formatLocalDate(activityDate);
        }
        
        if (!dailyCalories[dateStr]) {
          dailyCalories[dateStr] = 0;
        }
        dailyCalories[dateStr] += activity.calories_burned;
      });

      // Fill in missing dates with 0
      const chartRecords = dates.map(dateStr => ({
        date: dateStr,
        calories: dailyCalories[dateStr] || 0,
      }));

      // Generate chart data
      let chartData: ChartData;
      if (timeRange === 'monthly') {
        const weeklyData = groupDataByWeeks(chartRecords, 'calories');
        chartData = {
          labels: weeklyData.map(week => `Week ${week.weekNumber.toString().padStart(2, '0')}`),
          datasets: [{
            data: weeklyData.map(week => week.total),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          }],
        };
      } else {
        // For weekly view, show daily data
        chartData = {
          labels: chartRecords.map(r => {
            const date = new Date(r.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          }),
          datasets: [{
            data: chartRecords.map(r => r.calories),
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 3,
          }],
        };
      }

      const totalCaloriesBurned = chartRecords.reduce((sum, record) => sum + record.calories, 0);
      const totalExerciseSessions = filteredActivities.length;
      const averageCaloriesBurned = totalExerciseSessions > 0 ? totalCaloriesBurned / totalExerciseSessions : 0;
      const hasAnyData = chartRecords.some(r => r.calories > 0) || totalCaloriesBurned > 0;

      const summaryData = {
        totalCaloriesBurned,
        totalExerciseSessions,
        averageCaloriesBurned,
      };

      setDataCache(prev => ({
        ...prev,
        exercise: {
          ...prev.exercise,
          [cacheKey]: {
            chartData,
            summary: summaryData,
            hasData: hasAnyData,
          },
        },
      }));

      setExerciseData(chartData);
      setSummary(prev => ({ ...prev, ...summaryData }));
      setHasData(hasAnyData);
    } catch (error) {
      console.error('Error loading exercise data:', error);
    }
  };

  const getChartData = () => {
    switch (activeChart) {
      case 'meal':
        return mealData;
      case 'sugar':
        return sugarData;
      case 'exercise':
        return exerciseData;
      default:
        return null;
    }
  };

  const getChartTitle = () => {
    switch (activeChart) {
      case 'meal':
        return 'Calorie Intake';
      case 'sugar':
        return 'Blood Sugar Levels';
      case 'exercise':
        return 'Calories Burned';
      default:
        return '';
    }
  };

  const getChartColor = () => {
    switch (activeChart) {
      case 'meal':
        return COLORS.primary;
      case 'sugar':
        return COLORS.primary;
      case 'exercise':
        return COLORS.primary;
      default:
        return COLORS.primary;
    }
  };

  const getChartIcon = () => {
    switch (activeChart) {
      case 'meal':
        return '🍽️';
      case 'sugar':
        return '🩸';
      case 'exercise':
        return '🏃‍♂️';
      default:
        return '📊';
    }
  };

  const getChartDescription = () => {
    const timeDescription = timeRange === 'weekly' ? 'daily' : 'weekly';
    
    switch (activeChart) {
      case 'meal':
        return `Track your ${timeDescription} calorie consumption`;
      case 'sugar':
        return `Monitor your ${timeDescription} blood sugar trends`;
      case 'exercise':
        return `See your ${timeDescription} fitness activity progress`;
      default:
        return '';
    }
  };

  const getSummaryData = () => {

    switch (activeChart) {
      case 'meal':
        return [
          { label: 'Total Calories', value: `${(summary.totalCalories || 0).toFixed(0)}`, unit: 'cal' },
          { label: 'Daily Average', value: `${(summary.averageCalories || 0).toFixed(0)}`, unit: 'cal' },
          { label: 'Total Meals', value: (summary.totalMeals || 0).toString(), unit: '' },
        ];
      case 'sugar':
        return [
          { label: 'Average Level', value: `${(summary.averageBloodSugar || 0).toFixed(1)}`, unit: 'mg/dL' },
          { label: 'Total Records', value: (summary.totalSugarRecords || 0).toString(), unit: '' },
        ];
      case 'exercise':
        return [
          { label: 'Total Burned', value: `${(summary.totalCaloriesBurned || 0).toFixed(0)}`, unit: 'cal' },
          { label: 'Daily Average', value: `${(summary.averageCaloriesBurned || 0).toFixed(0)}`, unit: 'cal' },
          { label: 'Sessions', value: (summary.totalExerciseSessions || 0).toString(), unit: '' },
        ];
      default:
        return [];
    }
  };

  const navigateChart = (direction: 'left' | 'right') => {
    const charts: ChartType[] = ['meal', 'sugar', 'exercise'];
    const currentIndex = charts.indexOf(activeChart);
    
    if (direction === 'left') {
      const newIndex = currentIndex === 0 ? charts.length - 1 : currentIndex - 1;
      setActiveChart(charts[newIndex]);
    } else {
      const newIndex = currentIndex === charts.length - 1 ? 0 : currentIndex + 1;
      setActiveChart(charts[newIndex]);
    }
    
    setDataCache({
      meal: {},
      sugar: {},
      exercise: {},
    });
  };

  const chartConfig = {
    backgroundColor: COLORS.background,
    backgroundGradientFrom: COLORS.background,
    backgroundGradientTo: COLORS.background,
    decimalPlaces: 0,
    color: (opacity = 1) => getChartColor(),
    labelColor: (opacity = 1) => COLORS.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: getChartColor(),
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: COLORS.borderLight,
      strokeWidth: 1,
    },
  };

  // Handle chart data point touch
  const handleDataPointClick = (data: any) => {
    if (data && data.value !== undefined) {
      const chartData = getChartData();
      if (chartData && chartData.labels && chartData.labels[data.index]) {
        setTooltipData({
          visible: true,
          value: data.value,
          label: chartData.labels[data.index],
          x: data.x,
          y: data.y,
        });
        
        // Auto-hide tooltip after 3 seconds
        setTimeout(() => {
          setTooltipData(null);
        }, 3000);
      }
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Text style={styles.emptyStateIcon}>📊</Text>
      <Text style={styles.emptyStateTitle}>No Data Available</Text>
      <Text style={styles.emptyStateDescription}>
        Start tracking your {activeChart === 'meal' ? 'meals' : activeChart === 'sugar' ? 'blood sugar' : 'exercise'} to see your {timeRange === 'weekly' ? 'daily' : 'weekly'} progress here.
      </Text>
    </View>
  );

  const renderChart = () => {
    const data = getChartData();
    
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={getChartColor()} />
          <Text style={styles.loadingText}>Loading your data...</Text>
        </View>
      );
    }

    const hasSummaryData = summary.totalCaloriesBurned > 0 || summary.totalExerciseSessions > 0 ||
                          summary.totalCalories > 0 || summary.totalSugarRecords > 0;

    const hasChartData = data?.datasets?.[0]?.data?.some(value => value > 0);

    if (!data || !data.datasets?.length || (!hasData && !hasSummaryData && !hasChartData)) {

      return renderEmptyState();
    }

    return (
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={screenWidth - 80}
          height={320}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withDots={true}
          withShadow={false}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          onDataPointClick={handleDataPointClick}
        />
        
        {/* Tooltip */}
        {tooltipData && tooltipData.visible && (
          <View style={[styles.tooltip, { left: tooltipData.x - 50, top: tooltipData.y - 80 }]}>
            <Text style={styles.tooltipLabel}>{tooltipData.label}</Text>
            <Text style={styles.tooltipValue}>
              {tooltipData.value.toFixed(1)}
              <Text style={styles.tooltipUnit}>
                {activeChart === 'sugar' ? ' mg/dL' : ' cal'}
              </Text>
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderSummaryCards = () => {
    const summaryData = getSummaryData();
    if (!summaryData || summaryData.length === 0) return null;

    return (
      <View style={styles.summaryContainer}>
        {summaryData.map((item, index) => (
          <Card key={index} style={styles.summaryCard}>
            <Card.Content style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={[styles.summaryValue, { color: getChartColor() }]}>
                {item.value}
                <Text style={styles.summaryUnit}> {item.unit}</Text>
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
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
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            iconColor={COLORS.primary}
          />
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Analytics
          </Text>
        </View>

        {/* Chart Navigation */}
        <View style={styles.chartNavigation}>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateChart('left')}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.chartTitleContainer}>
            <Text style={styles.chartIcon}>{getChartIcon()}</Text>
            <Text style={[styles.chartTitle, { color: getChartColor() }]}>
              {getChartTitle()}
            </Text>
            <Text style={styles.chartDescription}>{getChartDescription()}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => navigateChart('right')}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Time Range Tabs */}
        <View style={styles.tabContainer}>
          <Chip
          onPress={() => setTimeRange('weekly')}
          style={[styles.tab, timeRange === 'weekly' && styles.activeTab]}
          textStyle={[styles.tabText, timeRange === 'weekly' && styles.activeTabText]}
        >
          Weekly
        </Chip>
        <Chip
          onPress={() => setTimeRange('monthly')}
          style={[styles.tab, timeRange === 'monthly' && styles.activeTab]}
          textStyle={[styles.tabText, timeRange === 'monthly' && styles.activeTabText]}
        >
          Monthly
        </Chip>
        </View>

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Chart Container */}
        <Card style={styles.chartCard}>
          <Card.Content style={styles.chartContent}>
            {renderChart()}
          </Card.Content>
        </Card>

        {/* Chart Indicators */}
        <View style={styles.indicators}>
          {['meal', 'sugar', 'exercise'].map((chart, index) => (
            <TouchableOpacity
              key={chart}
              style={[
                styles.indicator,
                activeChart === chart && { backgroundColor: getChartColor() }
              ]}
              onPress={() => {
                setActiveChart(chart as ChartType);
                // Clear cache when switching charts
                setDataCache({
                  meal: {},
                  sugar: {},
                  exercise: {},
                });
              }}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
  chartNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  navButtonText: {
    fontSize: 24,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  chartTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  chartDescription: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    marginHorizontal: 8,
    backgroundColor: COLORS.surface,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.white,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    elevation: 2,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryUnit: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chartCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 4,
  },
  chartContent: {
    padding: 20,
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
  },
  chart: {
    borderRadius: 16,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1000,
  },
  tooltipLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  tooltipValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tooltipUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  emptyStateContainer: {
    height: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },

  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    gap: 8,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.textSecondary,
  },
});

export default AnalyticsScreen;
