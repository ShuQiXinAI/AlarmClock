import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { useStatsStore } from '../store/statsStore';
import { ACHIEVEMENTS } from '../utils/achievements';
import SectionLabel from '../components/SectionLabel';

export default function StatsScreen() {
  const stats = useStatsStore(s => s.stats);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.header}>我的成就</Text>

        {/* Stats summary row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>🔥</Text>
            <Text style={styles.summaryValue}>{stats.streakDays}</Text>
            <Text style={styles.summaryUnit}>天</Text>
            <Text style={styles.summaryLabel}>连续打卡</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>⭐</Text>
            <Text style={styles.summaryValue}>{stats.points}</Text>
            <Text style={styles.summaryUnit}> </Text>
            <Text style={styles.summaryLabel}>总积分</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryEmoji}>⏰</Text>
            <Text style={styles.summaryValue}>{stats.totalUnlocks}</Text>
            <Text style={styles.summaryUnit}>次</Text>
            <Text style={styles.summaryLabel}>总解锁</Text>
          </View>
        </View>

        {/* Achievements section */}
        <View style={styles.section}>
          <SectionLabel>成就徽章</SectionLabel>
          <View style={styles.badgeGrid}>
            {ACHIEVEMENTS.map(achievement => {
              const unlocked = stats.achievements.includes(achievement.id);
              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.badgeCard,
                    unlocked ? styles.badgeCardUnlocked : styles.badgeCardLocked,
                  ]}
                >
                  <Text style={[styles.badgeEmoji, !unlocked && styles.badgeEmojiLocked]}>
                    {unlocked ? achievement.emoji : '🔒'}
                  </Text>
                  <Text
                    style={[styles.badgeName, !unlocked && styles.badgeNameLocked]}
                    numberOfLines={1}
                  >
                    {achievement.name}
                  </Text>
                  <Text
                    style={[styles.badgeDesc, !unlocked && styles.badgeDescLocked]}
                    numberOfLines={2}
                  >
                    {achievement.desc}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Method stats section */}
        <View style={styles.section}>
          <SectionLabel>解锁方式统计</SectionLabel>
          <View style={styles.methodList}>
            <View style={styles.methodRow}>
              <View style={[styles.methodDot, { backgroundColor: COLORS.mathColor }]} />
              <Text style={styles.methodLabel}>🧮 答题模式</Text>
              <Text style={styles.methodCount}>{stats.methodCounts.math} 次</Text>
            </View>
            <View style={styles.methodRow}>
              <View style={[styles.methodDot, { backgroundColor: COLORS.blinkColor }]} />
              <Text style={styles.methodLabel}>👁️ 眨眼模式</Text>
              <Text style={styles.methodCount}>{stats.methodCounts.blink} 次</Text>
            </View>
            <View style={styles.methodRow}>
              <View style={[styles.methodDot, { backgroundColor: COLORS.shakeColor }]} />
              <Text style={styles.methodLabel}>📳 摇晃模式</Text>
              <Text style={styles.methodCount}>{stats.methodCounts.shake} 次</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 20,
  },

  // Stats summary
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    lineHeight: 28,
  },
  summaryUnit: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  // Section
  section: {
    marginBottom: 28,
  },

  // Achievement badges grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  badgeCard: {
    width: '47%',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  badgeCardUnlocked: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary + '40',
  },
  badgeCardLocked: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  badgeEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  badgeEmojiLocked: {
    opacity: 0.4,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  badgeNameLocked: {
    color: COLORS.textMuted,
  },
  badgeDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
  badgeDescLocked: {
    opacity: 0.6,
  },

  // Method stats
  methodList: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  methodDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  methodLabel: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600',
  },
  methodCount: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
