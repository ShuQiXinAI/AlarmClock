import React from 'react';
import { View, Text, Pressable, FlatList, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS } from '../theme/colors';
import AlarmCard from '../components/AlarmCard';
import { useAlarmStore } from '../store/alarmStore';

type AlarmState = Parameters<Parameters<typeof useAlarmStore>[0]>[0];
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeNavProp = StackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();
  const alarms = useAlarmStore((s: AlarmState) => s.alarms);
  const toggleAlarm = useAlarmStore((s: AlarmState) => s.toggleAlarm);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>叫不醒你不罢休</Text>
        <Pressable onPress={() => navigation.navigate('EditAlarm', {})}>
          <Text style={styles.addButton}>+</Text>
        </Pressable>
      </View>

      {/* Alarm list */}
      <FlatList
        data={alarms}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <AlarmCard
            alarm={item}
            onPress={() => navigation.navigate('EditAlarm', { alarmId: item.id })}
            onToggle={(active: boolean) => toggleAlarm(item.id, active)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{'还没有闹钟\n点击 + 添加第一个'}</Text>
          </View>
        }
        contentContainerStyle={alarms.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
  },
  addButton: {
    fontSize: 32,
    color: COLORS.primary,
    lineHeight: 36,
  },
  separator: {
    height: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 26,
  },
  emptyList: {
    flex: 1,
  },
});
