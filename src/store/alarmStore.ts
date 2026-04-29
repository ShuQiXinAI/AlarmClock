import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types';
import { scheduleAlarm, cancelAlarm } from '../services/notifeeService';

interface AlarmStore {
  alarms: Alarm[];
  addAlarm: (data: Omit<Alarm, 'id' | 'notifeeJobId'>) => Promise<void>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string, active: boolean) => Promise<void>;
}

export const useAlarmStore = create<AlarmStore>()(
  persist(
    (set, get) => ({
      alarms: [],

      addAlarm: async (data) => {
        const alarm: Alarm = { ...data, id: Date.now().toString() };
        if (alarm.active) {
          alarm.notifeeJobId = await scheduleAlarm(alarm);
        }
        set(s => ({ alarms: [...s.alarms, alarm] }));
      },

      updateAlarm: async (alarm) => {
        const old = get().alarms.find(a => a.id === alarm.id);
        if (old?.notifeeJobId) await cancelAlarm(old.notifeeJobId);
        if (alarm.active) {
          alarm.notifeeJobId = await scheduleAlarm(alarm);
        }
        set(s => ({ alarms: s.alarms.map(a => a.id === alarm.id ? alarm : a) }));
      },

      deleteAlarm: async (id) => {
        const alarm = get().alarms.find(a => a.id === id);
        if (alarm?.notifeeJobId) await cancelAlarm(alarm.notifeeJobId);
        set(s => ({ alarms: s.alarms.filter(a => a.id !== id) }));
      },

      toggleAlarm: async (id, active) => {
        const alarm = get().alarms.find(a => a.id === id);
        if (!alarm) return;
        if (alarm.notifeeJobId) await cancelAlarm(alarm.notifeeJobId);
        let notifeeJobId: string | undefined;
        if (active) notifeeJobId = await scheduleAlarm({ ...alarm, active });
        set(s => ({
          alarms: s.alarms.map(a => a.id === id ? { ...a, active, notifeeJobId } : a),
        }));
      },
    }),
    { name: 'alarm-store', storage: createJSONStorage(() => AsyncStorage) },
  ),
);
