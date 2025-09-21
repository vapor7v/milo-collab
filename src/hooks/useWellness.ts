import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { wellnessAnalysisService, WellnessPlan } from '@/lib/wellnessAnalysis';
import { db } from '@/integrations/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';

export const useWellness = () => {
  const { user } = useAuth();
  const [wellnessPlan, setWellnessPlan] = useState<WellnessPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for real-time updates to wellness plan
  useEffect(() => {
    if (!user) {
      setWellnessPlan(null);
      setError(null);
      return;
    }

    const planRef = doc(db, 'wellness_profiles', user.uid);
    const unsubscribe = onSnapshot(planRef, (doc) => {
      if (doc.exists()) {
        setWellnessPlan(doc.data() as WellnessPlan);
        setError(null); // Clear any previous errors
      } else {
        setWellnessPlan(null);
      }
    }, (error) => {
      console.error('Error listening to wellness plan:', error);
      // Don't set error for permission issues - just log and continue
      if (error.code !== 'permission-denied') {
        setError('Failed to load wellness plan');
      }
      setWellnessPlan(null);
    });

    return () => unsubscribe();
  }, [user]);

  const analyzeWellness = async () => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const plan = await wellnessAnalysisService.analyzeUserWellness(user.uid);
      if (plan) {
        setWellnessPlan(plan);
        return plan;
      } else {
        setError('No chat messages found for analysis');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze wellness';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTodaysActivities = () => {
    if (!wellnessPlan) return [];

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay();
    const todayKey = days[today] as keyof typeof wellnessPlan.weeklyPlan;

    return wellnessPlan.weeklyPlan[todayKey] || [];
  };

  return {
    wellnessPlan,
    loading,
    error,
    analyzeWellness,
    getTodaysActivities,
    scores: wellnessPlan?.scores || null,
    recommendations: wellnessPlan?.recommendations || []
  };
};