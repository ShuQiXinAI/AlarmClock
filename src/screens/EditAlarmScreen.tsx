import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { COLORS } from '../theme/colors';
import BackButton from '../components/BackButton';
import DismissBadge from '../components/DismissBadge';
import { useAlarmStore } from '../store/alarmStore';
import { DismissMethod, DISMISS_METHODS } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type EditAlarmRoute = RouteProp<RootStackParamList, 'EditAlarm'>;
type EditAlarmNav = StackNavigationProp<RootStackParamList>;

const DISMISS_METHOD_KEYS: DismissMethod[] = ['math', 'blink', 'shake'];
const DAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function parseTime(time: string): { hours: number; minutes: number } {
  const [h, m] = time.split(':').map(Number);
  return { hours: h ?? 7, minutes: m ?? 0 };
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export default function EditAlarmScreen() {
  const route = useRoute<EditAlarmRoute>();
  const navigation = useNavigation<EditAlarmNav>();
  const { alarmId } = route.params ?? {};

  const alarms = useAlarmStore(s => s.alarms);
  const addAlarm = useAlarmStore(s => s.addAlarm);
  const updateAlarm = useAlarmStore(s => s.updateAlarm);
  const deleteAlarm = useAlarmStore(s => s.deleteAlarm);

  const existingAlarm = alarmId ? alarms.find(a => a.id === alarmId) : undefined;
  const isEditing = !!existingAlarm;

  const initialTime = parseTime(existingAlarm?.time ?? '07:00');

  const [hours, setHours] = useState(initialTime.hours);
  const [minutes, setMinutes] = useState(initialTime.minutes);
  const [label, setLabel] = useState(existingAlarm?.label ?? '起床');
  const [method, setMethod] = useState<DismissMethod>(existingAlarm?.method ?? 'math');
  const [repeatDays, setRepeatDays] = useState<number[]>(existingAlarm?.repeatDays ?? []);
  const [showPicker, setShowPicker] = useState(false);

  // Build a Date carrying the currently-selected hours/minutes for the picker.
  const pickerValue = useMemo(() => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    return d;
  }, [hours, minutes]);

  function onTimeChange(event: DateTimePickerEvent, date?: Date) {
    // Android dismisses the dialog after selection ('set') or cancel ('dismissed').
    // iOS keeps the spinner inline, so we leave it visible.
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'set' && date) {
      setHours(date.getHours());
      setMinutes(date.getMinutes());
    }
  }

  function toggleDay(day: number) {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  }

  async function handleSave() {
    const time = formatTime(hours, minutes);
    if (isEditing && existingAlarm) {
      await updateAlarm({
        ...existingAlarm,
        time,
        label,
        method,
        repeatDays,
      });
    } else {
      await addAlarm({ time, label, method, active: true, repeatDays });
    }
    navigation.goBack();
  }

  async function handleDelete() {
    if (!alarmId) return;
    Alert.alert('删除闹钟', '确定要删除这个闹钟吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteAlarm(alarmId);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{isEditing ? '编辑闹钟' : '设置闹钟'}</Text>
      </View>

      {/* Time Picker — tap the time to open the native wheel picker. */}
      <Pressable style={styles.timePicker} onPress={() => setShowPicker(true)}>
        <Text style={styles.timeText}>{formatTime(hours, minutes)}</Text>
        <Text style={styles.timeHint}>点击修改时间</Text>
      </Pressable>

      {showPicker && (
        <DateTimePicker
          mode="time"
          display="spinner"
          value={pickerValue}
          is24Hour
          onChange={onTimeChange}
        />
      )}

      {/* Label */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>标签</Text>
        <TextInput
          style={styles.textInput}
          value={label}
          onChangeText={setLabel}
          placeholder="闹钟名称"
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {/* Dismiss Method */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>解锁方式</Text>
        <View style={styles.methodRow}>
          {DISMISS_METHOD_KEYS.map(m => (
            <Pressable
              key={m}
              style={[styles.methodCard, method === m && styles.methodCardSelected]}
              onPress={() => setMethod(m)}
            >
              <DismissBadge method={m} />
              <Text style={styles.methodDesc}>{DISMISS_METHODS[m].desc}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Repeat Days */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>重复</Text>
        <View style={styles.daysRow}>
          {DAY_LABELS.map((label, index) => {
            const selected = repeatDays.includes(index);
            return (
              <Pressable
                key={index}
                style={[styles.dayBtn, selected && styles.dayBtnSelected]}
                onPress={() => toggleDay(index)}
              >
                <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Save Button */}
      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>保存</Text>
      </Pressable>

      {/* Delete Button (edit mode only) */}
      {isEditing && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>删除闹钟</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  timePicker: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  timeText: {
    fontSize: 72,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 4,
  },
  timeHint: {
    marginTop: 8,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    gap: 6,
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
  },
  methodDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  daysRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
  },
  dayBtn: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  dayBtnSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  deleteBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
