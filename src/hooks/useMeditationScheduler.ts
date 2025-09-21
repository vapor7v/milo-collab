import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';

interface WorkHours {
  start: string;
  end: string;
}

interface FreeTimeWindow {
  start: Date;
  end: Date;
  duration: number; // in minutes
}

interface MeditationSchedule {
  enabled: boolean;
  workHours: WorkHours;
  preferredDuration: number; // minutes
  remindersPerDay: number;
  lastScheduled: Date | null;
}

export const useMeditationScheduler = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<MeditationSchedule | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [nextReminder, setNextReminder] = useState<Date | null>(null);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission === 'granted';
    }
    return false;
  }, []);

  // Calculate free time windows based on work hours
  const calculateFreeTimeWindows = useCallback((workHours: WorkHours): FreeTimeWindow[] => {
    const now = new Date();
    const windows: FreeTimeWindow[] = [];

    // Parse work hours
    const [workStartHour, workStartMin] = workHours.start.split(':').map(Number);
    const [workEndHour, workEndMin] = workHours.end.split(':').map(Number);

    const workStart = new Date(now);
    workStart.setHours(workStartHour, workStartMin, 0, 0);

    const workEnd = new Date(now);
    workEnd.setHours(workEndHour, workEndMin, 0, 0);

    // Morning free time (before work)
    if (workStart.getTime() > now.getTime()) {
      const morningStart = new Date(now);
      morningStart.setHours(6, 0, 0, 0); // 6 AM

      if (morningStart.getTime() < workStart.getTime()) {
        windows.push({
          start: morningStart,
          end: workStart,
          duration: (workStart.getTime() - morningStart.getTime()) / (1000 * 60)
        });
      }
    }

    // Evening free time (after work)
    const eveningEnd = new Date(now);
    eveningEnd.setHours(22, 0, 0, 0); // 10 PM

    if (workEnd.getTime() < eveningEnd.getTime()) {
      windows.push({
        start: workEnd,
        end: eveningEnd,
        duration: (eveningEnd.getTime() - workEnd.getTime()) / (1000 * 60)
      });
    }

    // Weekend free time (if it's weekend)
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;
    if (isWeekend) {
      const weekendStart = new Date(now);
      weekendStart.setHours(8, 0, 0, 0);

      const weekendEnd = new Date(now);
      weekendEnd.setHours(20, 0, 0, 0);

      windows.push({
        start: weekendStart,
        end: weekendEnd,
        duration: (weekendEnd.getTime() - weekendStart.getTime()) / (1000 * 60)
      });
    }

    return windows.filter(window => window.duration >= 15); // Only windows with at least 15 minutes
  }, []);

  // Schedule meditation reminders
  const scheduleReminders = useCallback(async (windows: FreeTimeWindow[], remindersPerDay: number) => {
    if (notificationPermission !== 'granted' || !('serviceWorker' in navigator)) {
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Clear existing reminders
      const existingReminders = await registration.getNotifications();
      existingReminders.forEach(notification => notification.close());

      // Schedule new reminders
      const remindersScheduled = [];
      const usedTimes = new Set<string>();

      for (let i = 0; i < remindersPerDay && windows.length > 0; i++) {
        // Pick a random window
        const windowIndex = Math.floor(Math.random() * windows.length);
        const window = windows[windowIndex];

        // Calculate a random time within the window
        const windowDuration = window.end.getTime() - window.start.getTime();
        const randomOffset = Math.random() * windowDuration;
        const reminderTime = new Date(window.start.getTime() + randomOffset);

        // Ensure it's not too close to existing reminders (at least 2 hours apart)
        const timeKey = `${reminderTime.getHours()}:${Math.floor(reminderTime.getMinutes() / 30) * 30}`;
        if (usedTimes.has(timeKey)) {
          continue; // Try again
        }
        usedTimes.add(timeKey);

        // Schedule the reminder
        const delay = reminderTime.getTime() - Date.now();
        if (delay > 0 && delay < 24 * 60 * 60 * 1000) { // Within 24 hours
          setTimeout(() => {
            registration.showNotification('🧘 Time for Meditation', {
              body: 'Take a few minutes to center yourself and breathe. Your well-being matters!',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'meditation-reminder',
              requireInteraction: false
            });
          }, delay);

          remindersScheduled.push(reminderTime);
        }
      }

      if (remindersScheduled.length > 0) {
        setNextReminder(remindersScheduled[0]);
      }

      // Update last scheduled time
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          'meditationSchedule.lastScheduled': new Date()
        });
      }

    } catch (error) {
      console.error('Error scheduling meditation reminders:', error);
    }
  }, [notificationPermission, user]);

  // Load user schedule and work hours
  const loadSchedule = useCallback(async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const workHours = userData.workHours || { start: '09:00', end: '17:00' };

        const userSchedule: MeditationSchedule = {
          enabled: userData.meditationSchedule?.enabled ?? true,
          workHours,
          preferredDuration: userData.meditationSchedule?.preferredDuration ?? 10,
          remindersPerDay: userData.meditationSchedule?.remindersPerDay ?? 2,
          lastScheduled: userData.meditationSchedule?.lastScheduled?.toDate() || null
        };

        setSchedule(userSchedule);

        // Schedule reminders if enabled
        if (userSchedule.enabled) {
          const freeWindows = calculateFreeTimeWindows(workHours);
          await scheduleReminders(freeWindows, userSchedule.remindersPerDay);
        }
      }
    } catch (error) {
      console.error('Error loading meditation schedule:', error);
    }
  }, [user, calculateFreeTimeWindows, scheduleReminders]);

  // Update schedule settings
  const updateSchedule = useCallback(async (updates: Partial<MeditationSchedule>) => {
    if (!user || !schedule) return;

    try {
      const updatedSchedule = { ...schedule, ...updates };
      setSchedule(updatedSchedule);

      await updateDoc(doc(db, 'users', user.uid), {
        meditationSchedule: {
          ...updatedSchedule,
          lastScheduled: updatedSchedule.lastScheduled || null
        }
      });

      // Reschedule if enabled
      if (updatedSchedule.enabled) {
        const freeWindows = calculateFreeTimeWindows(updatedSchedule.workHours);
        await scheduleReminders(freeWindows, updatedSchedule.remindersPerDay);
      }
    } catch (error) {
      console.error('Error updating meditation schedule:', error);
    }
  }, [user, schedule, calculateFreeTimeWindows, scheduleReminders]);

  // Initialize
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
    loadSchedule();
  }, [loadSchedule]);

  // Schedule daily reminders
  useEffect(() => {
    if (!schedule?.enabled) return;

    const checkAndSchedule = async () => {
      const now = new Date();
      const lastScheduled = schedule.lastScheduled;

      // Schedule new reminders if it's been more than 24 hours or never scheduled
      if (!lastScheduled || (now.getTime() - lastScheduled.getTime()) > 24 * 60 * 60 * 1000) {
        const freeWindows = calculateFreeTimeWindows(schedule.workHours);
        await scheduleReminders(freeWindows, schedule.remindersPerDay);
      }
    };

    // Check every hour
    const interval = setInterval(checkAndSchedule, 60 * 60 * 1000);
    checkAndSchedule(); // Check immediately

    return () => clearInterval(interval);
  }, [schedule, calculateFreeTimeWindows, scheduleReminders]);

  return {
    schedule,
    notificationPermission,
    nextReminder,
    requestNotificationPermission,
    updateSchedule,
    calculateFreeTimeWindows
  };
};