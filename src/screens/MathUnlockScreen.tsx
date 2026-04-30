import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { COLORS } from '../theme/colors';
import BackButton from '../components/BackButton';
import { useAlarmStore } from '../store/alarmStore';
import { useStatsStore } from '../store/statsStore';
import { generateQuestion } from '../utils/mathChallenge';
import { stopAlarm } from '../services/alarmAudio';

// ─── Types ───────────────────────────────────────────────────────────────────

type MathUnlockRoute = RouteProp<RootStackParamList, 'MathUnlock'>;
type MathUnlockNav = StackNavigationProp<RootStackParamList>;

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MathUnlockScreen() {
  const route = useRoute<MathUnlockRoute>();
  const navigation = useNavigation<MathUnlockNav>();
  const { alarmId } = route.params;

  const alarm = useAlarmStore(s => s.alarms).find(a => a.id === alarmId);
  const recordSuccess = useStatsStore(s => s.recordSuccess);
  const consecutiveMathCorrect = useStatsStore(s => s.stats.consecutiveMathCorrect);
  const resetConsecutiveMath = useStatsStore(s => s.resetConsecutiveMath);

  const [currentQuestion, setCurrentQuestion] = useState(() => generateQuestion());
  const [inputValue, setInputValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = () => {
    const userAnswer = parseInt(inputValue, 10);

    if (isNaN(userAnswer)) {
      setErrorMessage('请输入数字');
      return;
    }

    if (userAnswer === currentQuestion.answer) {
      // Correct answer
      stopAlarm(alarmId);
      const method = alarm?.method ?? 'math';
      recordSuccess(method, consecutiveMathCorrect + 1);
      navigation.navigate('Success');
    } else {
      // Wrong answer
      resetConsecutiveMath();
      setErrorMessage('答错了！再试一次');
      setInputValue('');
      setCurrentQuestion(generateQuestion());
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>数学解锁</Text>
      </View>

      {/* ── Content ── */}
      <View style={styles.content}>
        {/* Consecutive correct counter */}
        {consecutiveMathCorrect > 0 && (
          <Text style={styles.streakText}>
            连续答对: {consecutiveMathCorrect} 题
          </Text>
        )}

        {/* Question */}
        <Text style={styles.questionText}>
          {currentQuestion.question} = ?
        </Text>

        {/* Input */}
        <TextInput
          style={styles.input}
          value={inputValue}
          onChangeText={setInputValue}
          keyboardType="numeric"
          placeholder="输入答案"
          placeholderTextColor={COLORS.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        {/* Error message */}
        {errorMessage !== null && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          activeOpacity={0.85}
        >
          <Text style={styles.submitButtonText}>确认</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },
  streakText: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.mathColor,
    textAlign: 'center',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    backgroundColor: COLORS.surface,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    fontWeight: '600',
    textAlign: 'center',
  },
  submitButton: {
    width: '100%',
    backgroundColor: COLORS.mathColor,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.mathColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
