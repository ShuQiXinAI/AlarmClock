import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 0.6, marginBottom: 8, textTransform: 'uppercase',
  },
});
