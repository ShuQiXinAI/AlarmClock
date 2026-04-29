import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DismissMethod, DISMISS_METHODS } from '../types';

interface Props { method: DismissMethod; small?: boolean; }

export default function DismissBadge({ method, small = false }: Props) {
  const m = DISMISS_METHODS[method];
  return (
    <View style={[styles.badge, { backgroundColor: m.color + '22' }]}>
      <Text style={[styles.text, { color: m.color, fontSize: small ? 10 : 12 }]}>
        {m.emoji} {m.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  text:  { fontWeight: '700' },
});
