import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props { onPress: () => void; label?: string; }

export default function BackButton({ onPress, label = '返回' }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.btn}>
      <Text style={styles.arrow}>‹</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  arrow: { fontSize: 22, color: COLORS.primary, fontWeight: '700', lineHeight: 24 },
  label: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
});
