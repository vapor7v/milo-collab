import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/integrations/firebase/client';
import { doc, getDoc } from 'firebase/firestore';

interface UserSchedule {
  workStart: string;
  workEnd: string;
}

interface NotificationState {
  isActive: boolean;
  message: string;
  type: 'meditation' | 'reminder' | 'break';
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [userSchedule, setUserSchedule] = useState<UserSchedule | null>(null);
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [isFreeTime, setIsFreeTime] = useState(false);

  // Load user schedule from onboarding data
  useEffect(() => {
    if (!user) {
      setUserSchedule(null);
      return;
    }

    const loadUserSchedule = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.workHours && data.workHours.start && data.workHours.end) {
            setUserSchedule(data.workHours);
          } else {
            console.log('No work hours found in user data');
            setUserSchedule(null);
          }
        } else {
          console.log('User document not found');
          setUserSchedule(null);
        }
      } catch (error) {
        console.error('Error loading user schedule:', error);
        setUserSchedule(null);
      }
    };

    loadUserSchedule();
  }, [user]);

  // Check if current time is within free time slots
  useEffect(() => {
    if (!userSchedule || !userSchedule.workStart || !userSchedule.workEnd) {
      setIsFreeTime(false);
      return;
    }

    const checkFreeTime = () => {
      try {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();

        const [startHour, startMinute] = userSchedule.workStart.split(':').map(Number);
        const [endHour, endMinute] = userSchedule.workEnd.split(':').map(Number);

        const workStart = startHour * 100 + startMinute;
        const workEnd = endHour * 100 + endMinute;

        // Consider free time as outside work hours
        const freeTime = currentTime < workStart || currentTime > workEnd;
        setIsFreeTime(freeTime);

        // Schedule meditation notifications during free time
        if (freeTime && !notification) {
          scheduleMeditationNotification();
        } else if (!freeTime && notification?.type === 'meditation') {
          // Clear meditation notification when back at work
          setNotification(null);
        }
      } catch (error) {
        console.error('Error checking free time:', error);
        setIsFreeTime(false);
      }
    };

    checkFreeTime();
    const interval = setInterval(checkFreeTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [userSchedule, notification]);

  const scheduleMeditationNotification = () => {
    // Schedule a meditation challenge notification
    const messages = [
      "🌸 Time for a quick meditation break! Take 5 minutes to breathe and reset.",
      "🧘‍♀️ Your mind could use a moment of peace. Ready for a meditation session?",
      "🌺 Free time alert! How about a calming meditation to recharge?",
      "🕊️ Perfect moment for mindfulness. Join me for a meditation challenge?",
      "🌿 Take a breath. Your daily meditation challenge is waiting for you."
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    setNotification({
      isActive: true,
      message: randomMessage,
      type: 'meditation'
    });

    // Auto-dismiss after 10 minutes
    setTimeout(() => {
      setNotification(null);
    }, 10 * 60 * 1000);
  };

  const dismissNotification = () => {
    setNotification(null);
  };

  const startMeditationChallenge = () => {
    // Navigate to meditation challenge or mark as started
    setNotification(null);
    // You could navigate to a meditation page here
    console.log('Starting meditation challenge...');
  };

  return {
    notification,
    isFreeTime,
    userSchedule,
    dismissNotification,
    startMeditationChallenge,
    scheduleMeditationNotification
  };
};