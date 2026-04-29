import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';
import { useShake } from '../hooks/useShake';

// ─── Types ───────────────────────────────────────────────────────────────────

type ShakeUnlockRoute = RouteProp<RootStackParamList, 'ShakeUnlock'>;
type ShakeUnlockNav = StackNavigationProp<RootStackParamList>;

// ─── Constants ───────────────────────────────────────────────────────────────

const TARGET_SHAKES = 30;
const BG_COLOR = '#0C0B1E';
const SHAKE_COLOR = '#D4830A';
const SHAKE_COLOR_BRIGHT = '#FF9F1C';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ShakeUnlockScreen() {
  const route = useRoute<ShakeUnlockRoute>();
  const navigation = useNavigation<ShakeUnlockNav>();
  const { alarmId: _alarmId } = route.params;

  const recordSuccess = useStatsStore(s => s.recordSuccess);

  const [count, setCount] = useState(0);
  const completedRef = useRef(false);

  // ─── Pulse animation ─────────────────────────────────────────────────────

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.85)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1.15,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.85,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulseLoop.current.start();

    return () => {
      pulseLoop.current?.stop();
    };
  }, [scaleAnim, opacityAnim]);

  // ─── Shake handler ───────────────────────────────────────────────────────

  const handleShake = useCallback(() => {
    if (completedRef.current) return;

    setCount(prev => {
      const next = prev + 1;
      if (next >= TARGET_SHAKES) {
        completedRef.current = true;
        pulseLoop.current?.stop();
        recordSuccess('shake');
        navigation.navigate('Success');
      }
      return next;
    });
  }, [recordSuccess, navigation]);

  useShake(handleShake);

  // ─── Progress ────────────────────────────────────────────────────────────

  const progress = Math.min(count / TARGET_SHAKES, 1);
  const progressPercent = Math.round(progress * 100);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Top label ── */}
      <View style={styles.topSection}>
        <Text style={styles.titleText}>摇动手机解锁闹钟</Text>
        <Text style={styles.subtitleText}>用力摇晃，直到清醒！</Text>
      </View>

      {/* ── Animated icon ── */}
      <View style={styles.centerSection}>
        <Animated.Text
          style={[
            styles.shakeEmoji,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          📳
        </Animated.Text>

        <Animated.Text
          style={[
            styles.shakeLabel,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          震动！
        </Animated.Text>
      </View>

      {/* ── Counter ── */}
      <View style={styles.counterSection}>
        <Text style={styles.counterText}>
          已摇晃: {count} / {TARGET_SHAKES} 次
        </Text>

        {/* Progress bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progressPercent}%` as `${number}%` },
            ]}
          />
        </View>

        <Text style={styles.progressPercent}>{progressPercent}%</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 15,
    color: '#A09CC0',
    textAlign: 'center',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  shakeEmoji: {
    fontSize: 96,
    textAlign: 'center',
  },
  shakeLabel: {
    fontSize: 40,
    fontWeight: '900',
    color: SHAKE_COLOR_BRIGHT,
    letterSpacing: 4,
    textAlign: 'center',
  },
  counterSection: {
    alignItems: 'center',
    width: '100%',
    gap: 12,
  },
  counterText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  progressBarTrack: {
    width: '100%',
    height: 12,
    backgroundColor: '#2A2848',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: SHAKE_COLOR,
    borderRadius: 6,
  },
  progressPercent: {
    fontSize: 14,
    color: '#A09CC0',
    fontWeight: '600',
  },
});
