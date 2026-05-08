import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { COLORS } from '../theme/colors';
import BackButton from '../components/BackButton';
import { detectBrand, BRAND_GUIDES } from '../utils/deviceBrand';
import {
  openAlarmPermissionSettings,
  scheduleTestAlarm,
} from '../services/notifeeService';
import { RootStackParamList } from '../navigation/AppNavigator';

export const PERMISSION_GUIDE_SEEN_KEY = 'permission-guide-seen';

type Nav = StackNavigationProp<RootStackParamList>;

export default function PermissionCheckScreen() {
  const navigation = useNavigation<Nav>();
  const [notifAuthorized, setNotifAuthorized] = useState<boolean | null>(null);

  const refreshNotificationStatus = useCallback(async () => {
    try {
      const settings = await notifee.getNotificationSettings();
      setNotifAuthorized(
        settings.authorizationStatus === AuthorizationStatus.AUTHORIZED,
      );
    } catch {
      setNotifAuthorized(null);
    }
  }, []);

  // Re-check whenever this screen regains focus — covers the user
  // returning from system settings.
  useFocusEffect(
    useCallback(() => {
      refreshNotificationStatus();
    }, [refreshNotificationStatus]),
  );

  useEffect(() => {
    refreshNotificationStatus();
  }, [refreshNotificationStatus]);

  async function onTestAlarm() {
    try {
      await scheduleTestAlarm();
      Alert.alert(
        '测试闹钟已设定',
        '请在 30 秒内将本 App 切到后台或锁屏。如果到时听到声音并看到通知，说明权限配置正确。',
      );
    } catch (e) {
      Alert.alert('设定失败', '无法设置测试闹钟，请检查精确闹钟权限是否已开启。');
    }
  }

  async function onDone() {
    await AsyncStorage.setItem(PERMISSION_GUIDE_SEEN_KEY, '1');
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('Tab');
    }
  }

  const brand = detectBrand();
  const guide = BRAND_GUIDES[brand];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>权限自检</Text>
      </View>

      <Text style={styles.intro}>
        为了让闹钟能在锁屏 / 后台正常响铃，请确认以下设置都已开启。
      </Text>

      {/* Notification permission */}
      <Pressable
        style={styles.permRow}
        onPress={async () => {
          await notifee.openNotificationSettings();
        }}
      >
        <View style={styles.permRowLeft}>
          <Text style={styles.permTitle}>通知权限</Text>
          <Text style={styles.permDesc}>必须允许，否则闹铃无法弹出</Text>
        </View>
        <Text
          style={[
            styles.permStatus,
            notifAuthorized === true && styles.permStatusOk,
            notifAuthorized === false && styles.permStatusBad,
          ]}
        >
          {notifAuthorized === true
            ? '✅ 已开启'
            : notifAuthorized === false
              ? '❌ 去开启'
              : '检查中…'}
        </Text>
      </Pressable>

      {/* Exact alarm permission — no programmatic status check on all
          Android versions; just provide the entry point. */}
      <Pressable style={styles.permRow} onPress={openAlarmPermissionSettings}>
        <View style={styles.permRowLeft}>
          <Text style={styles.permTitle}>精确闹钟权限</Text>
          <Text style={styles.permDesc}>Android 12+ 必需，控制闹钟是否能精准触发</Text>
        </View>
        <Text style={styles.permStatusNeutral}>去设置 ›</Text>
      </Pressable>

      {/* Brand-specific guide */}
      {guide && (
        <View style={styles.brandBox}>
          <Text style={styles.brandTitle}>⚠️ {guide.title} 用户必读</Text>
          <Text style={styles.brandIntro}>{guide.intro}</Text>
          {guide.steps.map((step, i) => (
            <View key={i} style={styles.brandStep}>
              <Text style={styles.brandStepNum}>{i + 1}.</Text>
              <Text style={styles.brandStepText}>{step}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Test alarm */}
      <Pressable style={styles.testBtn} onPress={onTestAlarm}>
        <Text style={styles.testBtnText}>🔔 测试闹钟（30 秒后响）</Text>
      </Pressable>
      <Text style={styles.testHint}>
        点击后请将 App 切到后台或锁屏，模拟真实闹钟场景。
      </Text>

      {/* Done CTA */}
      <Pressable style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneBtnText}>我已设置好</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  intro: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 21,
    marginBottom: 16,
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  permRowLeft: { flex: 1, paddingRight: 12 },
  permTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  permDesc: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  permStatus: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  permStatusOk: { color: COLORS.success },
  permStatusBad: { color: COLORS.danger },
  permStatusNeutral: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  brandBox: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 14,
    marginTop: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#F0DD7E',
  },
  brandTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  brandIntro: { fontSize: 13, color: COLORS.text, marginBottom: 8 },
  brandStep: { flexDirection: 'row', marginBottom: 4 },
  brandStepNum: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    width: 22,
  },
  brandStepText: { fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 21 },
  testBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  testBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  testHint: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  doneBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
