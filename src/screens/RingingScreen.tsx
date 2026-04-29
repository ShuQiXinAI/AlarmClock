import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Audio } from 'expo-av';

import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import { DISMISS_METHODS } from '../types';
import DismissBadge from '../components/DismissBadge';
import { useAlarmStore } from '../store/alarmStore';

// ─── Types ───────────────────────────────────────────────────────────────────

type RingingRoute = RouteProp<RootStackParamList, 'Ringing'>;
type RingingNav = StackNavigationProp<RootStackParamList>;

// ─── Button labels by method ─────────────────────────────────────────────────

const BUTTON_LABELS: Record<string, string> = {
  math:  '起来解题！',
  blink: '起来眨眼！',
  shake: '起来摇晃！',
};

const METHOD_COLORS: Record<string, string> = {
  math:  COLORS.mathColor,
  blink: COLORS.blinkColor,
  shake: COLORS.shakeColor,
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function RingingScreen() {
  const route = useRoute<RingingRoute>();
  const navigation = useNavigation<RingingNav>();
  const { alarmId } = route.params;

  const alarm = useAlarmStore(s => s.alarms).find(a => a.id === alarmId);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Load and play looping alarm audio on mount; unload on unmount
  useEffect(() => {
    let mounted = true;

    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          require('../../assets/sounds/alarm.mp3'),
          { isLooping: true, shouldPlay: true },
        );
        if (mounted) {
          soundRef.current = sound;
        } else {
          await sound.unloadAsync();
        }
      } catch {
        // Audio file may not exist — render screen normally without audio
      }
    };

    loadSound();

    return () => {
      mounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  // ── No alarm found ──────────────────────────────────────────────────────────
  if (!alarm) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>找不到闹钟</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ── Challenge button handler ────────────────────────────────────────────────
  const handleChallenge = () => {
    const { method } = alarm;
    if (method === 'math') {
      navigation.navigate('MathUnlock', { alarmId });
    } else if (method === 'shake') {
      navigation.navigate('ShakeUnlock', { alarmId });
    } else {
      navigation.navigate('BlinkUnlock', { alarmId });
    }
  };

  const buttonLabel = BUTTON_LABELS[alarm.method] ?? '起来！';
  const buttonColor = METHOD_COLORS[alarm.method] ?? COLORS.primary;

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Center content ── */}
      <View style={styles.center}>
        <Text style={styles.timeText}>{alarm.time}</Text>
        <Text style={styles.labelText}>{alarm.label}</Text>
        <DismissBadge method={alarm.method} />
      </View>

      {/* ── Bottom action ── */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.challengeButton, { backgroundColor: buttonColor }]}
          onPress={handleChallenge}
          activeOpacity={0.85}
        >
          <Text style={styles.challengeButtonText}>{buttonLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text, // #0C0B1E — dark dramatic background
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  labelText: {
    fontSize: 20,
    color: COLORS.border,
    marginBottom: 8,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  challengeButton: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  challengeButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  // Error state
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 80,
  },
  backButton: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
