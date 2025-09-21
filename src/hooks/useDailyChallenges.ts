import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

export interface DailyChallenge {
  meditationCompleted: boolean;
  journalCompleted: boolean;
  date: string;
  userId: string;
  lastUpdated: Timestamp;
}

export const useDailyChallenges = () => {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const loadTodaysChallenges = async () => {
    if (!user || !user.uid) return;

    try {
      setLoading(true);
      const challengeRef = doc(db, 'daily_challenges', user.uid, 'dates', today);
      const challengeSnap = await getDoc(challengeRef);

      if (challengeSnap.exists()) {
        const data = challengeSnap.data() as DailyChallenge;
        setChallenges(data);
      } else {
        // Initialize today's challenges
        const newChallenge: DailyChallenge = {
          meditationCompleted: false,
          journalCompleted: false,
          date: today,
          userId: user.uid,
          lastUpdated: Timestamp.now()
        };
        setChallenges(newChallenge);
      }
    } catch (error) {
      console.error('Error loading daily challenges:', error);
      setChallenges(null);
    } finally {
      setLoading(false);
    }
  };

  const saveTodaysChallenges = async (updatedChallenges: DailyChallenge) => {
    if (!user || !user.uid) return;

    try {
      const challengeRef = doc(db, 'daily_challenges', user.uid, 'dates', today);
      updatedChallenges.lastUpdated = Timestamp.now();
      await setDoc(challengeRef, updatedChallenges);
      setChallenges(updatedChallenges);
    } catch (error) {
      console.error('Error saving daily challenges:', error);
    }
  };

  const markMeditationCompleted = async () => {
    if (!challenges) return;

    const updatedChallenges = {
      ...challenges,
      meditationCompleted: true
    };

    await saveTodaysChallenges(updatedChallenges);
  };

  const markJournalCompleted = async () => {
    if (!challenges) return;

    const updatedChallenges = {
      ...challenges,
      journalCompleted: true
    };

    await saveTodaysChallenges(updatedChallenges);
  };

  const getCompletedCount = () => {
    if (!challenges) return 0;
    let count = 0;
    if (challenges.meditationCompleted) count++;
    if (challenges.journalCompleted) count++;
    return count;
  };

  const getTotalCount = () => {
    return 2; // Always 2 mandatory challenges: meditation and journal
  };

  const getCompletionPercentage = () => {
    const total = getTotalCount();
    if (total === 0) return 0;
    return Math.round((getCompletedCount() / total) * 100);
  };

  // Load today's challenges
  useEffect(() => {
    if (!user) {
      setChallenges(null);
      return;
    }

    loadTodaysChallenges();
  }, [user]);

  return {
    challenges,
    loading,
    markMeditationCompleted,
    markJournalCompleted,
    getCompletedCount,
    getTotalCount,
    getCompletionPercentage,
    refreshChallenges: loadTodaysChallenges
  };
};