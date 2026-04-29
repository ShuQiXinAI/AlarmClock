import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Alarm, DISMISS_METHODS } from '../types';
import { COLORS } from '../theme/colors';
import ToggleSwitch from './ToggleSwitch';
import DismissBadge from './DismissBadge';

interface Props {
  alarm: Alarm;
  onPress: () => void;
  onToggle: (active: boolean) => void;
}

export default function AlarmCard({ alarm, onPress, onToggle }: Props) {
  const m = DISMISS_METHODS[alarm.method];
  return (
    <Pressable onPress={onPress} style={[styles.card, {
      borderLeftColor: alarm.active ? m.color : '#e0daf5',
      opacity: alarm.active ? 1 : 0.65,
      shadowColor: m.color,
      shadowOpacity: alarm.active ? 0.15 : 0,
    }]}>
      <View style={styles.info}>
        <Text style={[styles.time, { color: alarm.active ? COLORS.text : COLORS.textMuted }]}>
          {alarm.time}
        </Text>
        <Text style={styles.label}>{alarm.label}</Text>
        <DismissBadge method={alarm.method} small />
      </View>
      <Pressable onPress={e => { e.stopPropagation?.(); onToggle(!alarm.active); }}>
        <ToggleSwitch value={alarm.active} onChange={onToggle} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white', borderRadius: 18, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderLeftWidth: 4, elevation: 2,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  info:  { flex: 1 },
  time:  { fontSize: 34, fontWeight: '900', letterSpacing: -1, lineHeight: 38 },
  label: { fontSize: 13, color: '#585278', marginTop: 3, fontWeight: '600' },
});
