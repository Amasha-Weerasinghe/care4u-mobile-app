import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  IconButton,
  List,
  Divider,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

const BloodSugarGuidelinesScreen: React.FC = () => {
  const navigation = useNavigation();

  const bloodSugarRanges = [
    {
      range: 'Normal',
      value: '70-99 mg/dL',
      color: '#4CAF50',
      description: 'Healthy blood sugar level',
      icon: 'check-circle',
    },
    {
      range: 'Elevated',
      value: '100-125 mg/dL',
      color: '#FF9800',
      description: 'Pre-diabetes range',
      icon: 'alert-circle',
    },
    {
      range: 'High',
      value: '126-199 mg/dL',
      color: '#F44336',
      description: 'Diabetes range',
      icon: 'alert',
    },
    {
      range: 'Diabetes',
      value: '200+ mg/dL',
      color: '#9C27B0',
      description: 'Severe hyperglycemia',
      icon: 'alert-octagon',
    },
    {
      range: 'Low',
      value: '< 70 mg/dL',
      color: '#FF6B6B',
      description: 'Hypoglycemia',
      icon: 'alert-circle',
    },
  ];

  const managementTips = [
    {
      title: 'Regular Monitoring',
      description: 'Check your blood sugar levels regularly as recommended by your healthcare provider.',
      icon: 'test-tube',
    },
    {
      title: 'Healthy Diet',
      description: 'Follow a balanced diet with controlled carbohydrates and regular meal timing.',
      icon: 'food-apple',
    },
    {
      title: 'Physical Activity',
      description: 'Engage in regular exercise to help maintain healthy blood sugar levels.',
      icon: 'run',
    },
    {
      title: 'Medication Adherence',
      description: 'Take prescribed medications as directed by your healthcare provider.',
      icon: 'pill',
    },
    {
      title: 'Stress Management',
      description: 'Practice stress-reduction techniques as stress can affect blood sugar levels.',
      icon: 'meditation',
    },
  ];

  const warningSigns = [
    {
      symptom: 'Frequent urination',
      description: 'Increased need to urinate, especially at night',
    },
    {
      symptom: 'Excessive thirst',
      description: 'Feeling very thirsty even after drinking water',
    },
    {
      symptom: 'Fatigue',
      description: 'Feeling tired and lacking energy',
    },
    {
      symptom: 'Blurred vision',
      description: 'Difficulty seeing clearly',
    },
    {
      symptom: 'Slow-healing wounds',
      description: 'Cuts and bruises that take longer to heal',
    },
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
          Blood Sugar Guidelines
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Understanding Blood Sugar Levels
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Blood sugar (glucose) is the main sugar found in your blood and comes from the food you eat. 
              It's your body's main source of energy. Understanding your blood sugar levels is crucial for 
              maintaining good health, especially if you have diabetes or are at risk.
            </Text>
          </Card.Content>
        </Card>

        {/* Blood Sugar Ranges */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Blood Sugar Ranges
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Here are the general blood sugar level ranges and what they mean:
            </Text>
            
            {bloodSugarRanges.map((range, index) => (
              <View key={index}>
                <View style={styles.rangeItem}>
                  <MaterialCommunityIcons 
                    name={range.icon as any} 
                    size={24} 
                    color={range.color} 
                  />
                  <View style={styles.rangeInfo}>
                    <Text variant="titleMedium" style={styles.rangeTitle}>
                      {range.range}
                    </Text>
                    <Text variant="headlineSmall" style={[styles.rangeValue, { color: range.color }]}>
                      {range.value}
                    </Text>
                    <Text variant="bodyMedium" style={styles.rangeDescription}>
                      {range.description}
                    </Text>
                  </View>
                </View>
                {index < bloodSugarRanges.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Management Tips */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Management Tips
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Here are some important tips for managing your blood sugar levels:
            </Text>
            
            {managementTips.map((tip, index) => (
              <View key={index}>
                <List.Item
                  title={tip.title}
                  description={tip.description}
                  left={() => (
                    <MaterialCommunityIcons 
                      name={tip.icon as any} 
                      size={24} 
                      color={COLORS.primary} 
                    />
                  )}
                  titleStyle={styles.tipTitle}
                  descriptionStyle={styles.tipDescription}
                />
                {index < managementTips.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Warning Signs */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Warning Signs
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              Be aware of these common symptoms that may indicate blood sugar issues:
            </Text>
            
            {warningSigns.map((sign, index) => (
              <View key={index}>
                <List.Item
                  title={sign.symptom}
                  description={sign.description}
                  left={() => (
                    <MaterialCommunityIcons 
                      name="alert-circle" 
                      size={24} 
                      color={COLORS.warning} 
                    />
                  )}
                  titleStyle={styles.warningTitle}
                  descriptionStyle={styles.warningDescription}
                />
                {index < warningSigns.length - 1 && <Divider style={styles.divider} />}
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Important Note */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Important Note
            </Text>
            <Text variant="bodyMedium" style={styles.cardDescription}>
              These guidelines are for educational purposes only. Always consult with your healthcare 
              provider for personalized advice and treatment plans. Your target blood sugar ranges 
              may vary based on your individual health condition, age, and other factors.
            </Text>
            <Text variant="bodyMedium" style={[styles.cardDescription, styles.emergencyText]}>
              If you experience severe symptoms like confusion, difficulty breathing, or loss of 
              consciousness, seek emergency medical attention immediately.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
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
  card: {
    marginBottom: 16,
    backgroundColor: COLORS.white,
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  rangeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  rangeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rangeTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  rangeValue: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rangeDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  tipTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  tipDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  warningTitle: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  warningDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  divider: {
    marginVertical: 8,
  },
  emergencyText: {
    color: COLORS.error,
    fontWeight: '600',
    marginTop: 8,
  },
});

export default BloodSugarGuidelinesScreen;
