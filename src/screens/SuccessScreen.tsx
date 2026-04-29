import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useStatsStore } from '../store/statsStore';
import { COLORS } from '../theme/colors';

type SuccessNavProp = StackNavigationProp<RootStackParamList, 'Success'>;

export default function SuccessScreen() {
  const navigation = useNavigation<SuccessNavProp>();
  const stats = useStatsStore(s => s.stats);

  const handleReturn = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Tab' }] });
  };

  return (
    <LinearGradient
      colors={['#3B35D4', '#C026A8']}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Celebration emoji */}
          <Text style={styles.emoji}>🎉</Text>

          {/* Title */}
          <Text style={styles.title}>解锁成功！</Text>

          {/* Points earned */}
          <Text style={styles.pointsEarned}>+10 分</Text>

          {/* Stats summary */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.points}</Text>
                <Text style={styles.statLabel}>总积分</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.streakDays}</Text>
                <Text style={styles.statLabel}>连续天数</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.totalUnlocks}</Text>
                <Text style={styles.statLabel}>总解锁</Text>
              </View>
            </View>
          </View>

          {/* New achievements */}
          {stats.achievements.length > 0 && (
            <View style={styles.achievementHint}>
              <Text style={styles.achievementHintText}>
                🏆 已获得 {stats.achievements.length} 个成就
              </Text>
            </View>
          )}

          {/* Return button */}
          <TouchableOpacity style={styles.returnButton} onPress={handleReturn} activeOpacity={0.85}>
            <Text style={styles.returnButtonText}>返回主界面</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 20,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  pointsEarned: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFD700',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  achievementHint: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  achievementHintText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  returnButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 16,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  returnButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: '800',
  },
});
