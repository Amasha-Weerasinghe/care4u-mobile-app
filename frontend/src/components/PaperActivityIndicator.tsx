import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import { COLORS } from '../constants/theme';

interface PaperActivityIndicatorProps {
  animating?: boolean;
  color?: string;
  size?: 'small' | 'large' | number;
  hidesWhenStopped?: boolean;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  text?: string;
}

const PaperActivityIndicator: React.FC<PaperActivityIndicatorProps> = ({
  animating = true,
  color = COLORS.primary,
  size = 'large',
  hidesWhenStopped = true,
  style,
  containerStyle,
  text,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      <ActivityIndicator
        animating={animating}
        color={color}
        size={size}
        hidesWhenStopped={hidesWhenStopped}
        style={[styles.indicator, style]}
      />
      {text && (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  indicator: {
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default PaperActivityIndicator;

