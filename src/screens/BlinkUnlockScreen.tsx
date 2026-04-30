import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Use the legacy Camera which supports onFacesDetected + type prop
import { Camera, CameraType } from 'expo-camera/legacy';
import {
  FaceDetectorMode,
  FaceDetectorLandmarks,
  FaceDetectorClassifications,
} from 'expo-face-detector';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';
import { useBlink, FaceDetectionResult } from '../hooks/useBlink';
import { stopAlarm } from '../services/alarmAudio';

// ─── Types ───────────────────────────────────────────────────────────────────

type BlinkUnlockRoute = RouteProp<RootStackParamList, 'BlinkUnlock'>;
type BlinkUnlockNav = StackNavigationProp<RootStackParamList>;

// ─── Constants ───────────────────────────────────────────────────────────────

const TARGET_BLINKS = 3;
const BG_COLOR = '#0C0B1E';
const ACCENT_COLOR = '#7C5CBF';
const ACCENT_BRIGHT = '#A87FFF';

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function BlinkUnlockScreen() {
  const route = useRoute<BlinkUnlockRoute>();
  const navigation = useNavigation<BlinkUnlockNav>();
  const { alarmId } = route.params;

  const recordSuccess = useStatsStore(s => s.recordSuccess);

  const [count, setCount] = useState(0);
  const completedRef = useRef(false);

  // ─── Blink handler ───────────────────────────────────────────────────────

  const handleBlink = useCallback(() => {
    if (completedRef.current) return;

    setCount(prev => {
      const next = prev + 1;
      if (next >= TARGET_BLINKS) {
        completedRef.current = true;
        stopAlarm(alarmId);
        recordSuccess('blink');
        navigation.navigate('Success');
      }
      return next;
    });
  }, [alarmId, recordSuccess, navigation]);

  const { hasPermission, onFacesDetected } = useBlink(handleBlink);

  // ─── Render: waiting for permission ──────────────────────────────────────

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={ACCENT_BRIGHT} />
        <Text style={styles.waitText}>等待权限...</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.waitText}>等待权限...</Text>
        <Text style={styles.subtitleText}>请在设置中开启摄像头权限</Text>
      </SafeAreaView>
    );
  }

  // ─── Render: camera + overlay ─────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera preview fills the screen */}
      <View style={styles.cameraWrapper}>
        <Camera
          style={StyleSheet.absoluteFill}
          type={CameraType.front}
          onFacesDetected={onFacesDetected as (result: any) => void}
          faceDetectorSettings={{
            mode: FaceDetectorMode.fast,
            detectLandmarks: FaceDetectorLandmarks.all,
            runClassifications: FaceDetectorClassifications.all,
            minDetectionInterval: 100,
            tracking: false,
          }}
        />

        {/* Overlay UI on top of camera */}
        <View style={styles.overlay}>
          {/* Top instruction */}
          <View style={styles.topSection}>
            <Text style={styles.titleText}>眨眼解锁闹钟</Text>
            <Text style={styles.subtitleText}>慢慢眨眼，直到清醒！</Text>
          </View>

          {/* Blink counter badge */}
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>
              眨眼 {count} / {TARGET_BLINKS} 次
            </Text>
          </View>

          {/* Dot indicators */}
          <View style={styles.dotsRow}>
            {Array.from({ length: TARGET_BLINKS }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < count ? styles.dotFilled : styles.dotEmpty,
                ]}
              />
            ))}
          </View>
        </View>
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
    justifyContent: 'center',
  },
  waitText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  cameraWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
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
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 15,
    color: '#D0C8F0',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  counterBadge: {
    backgroundColor: 'rgba(124, 92, 191, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: ACCENT_BRIGHT,
  },
  counterText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  dotEmpty: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  dotFilled: {
    backgroundColor: ACCENT_COLOR,
    borderWidth: 1.5,
    borderColor: ACCENT_BRIGHT,
  },
});
