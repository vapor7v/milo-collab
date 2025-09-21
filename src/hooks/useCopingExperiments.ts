import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/integrations/firebase/client';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  where
} from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';

export interface CopingExperiment {
  id: string;
  title: string;
  description: string;
  category: 'mindfulness' | 'social' | 'physical' | 'cognitive' | 'emotional';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number; // in minutes
  instructions: string[];
  expectedOutcome: string;
  createdAt: Timestamp;
  scheduledFor?: Timestamp;
  completedAt?: Timestamp;
  userRating?: number; // 1-5 scale
  outcomeNotes?: string;
  isActive: boolean;
  aiGenerated: boolean;
}

export interface ExperimentResult {
  experimentId: string;
  userId: string;
  completedAt: Timestamp;
  rating: number;
  notes: string;
  effectiveness: 'very_helpful' | 'somewhat_helpful' | 'neutral' | 'not_helpful' | 'made_worse';
  moodBefore: number; // 1-10 scale
  moodAfter: number; // 1-10 scale
  stressBefore: number; // 1-10 scale
  stressAfter: number; // 1-10 scale
}

export interface ExperimentInsight {
  id: string;
  userId: string;
  insight: string;
  category: string;
  confidence: number;
  generatedAt: Timestamp;
  basedOnExperiments: string[]; // experiment IDs
}

export const useCopingExperiments = () => {
  const { user } = useAuth();
  const [activeExperiments, setActiveExperiments] = useState<CopingExperiment[]>([]);
  const [completedExperiments, setCompletedExperiments] = useState<CopingExperiment[]>([]);
  const [experimentInsights, setExperimentInsights] = useState<ExperimentInsight[]>([]);
  const [loading, setLoading] = useState(false);

  // Load user's experiments
  const loadExperiments = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const experimentsRef = collection(db, 'user_experiments', user.uid, 'experiments');
      const q = query(experimentsRef, orderBy('createdAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);

      const experiments: CopingExperiment[] = [];
      snapshot.forEach(doc => {
        experiments.push({ id: doc.id, ...doc.data() } as CopingExperiment);
      });

      const active = experiments.filter(exp => exp.isActive && !exp.completedAt);
      const completed = experiments.filter(exp => exp.completedAt);

      setActiveExperiments(active);
      setCompletedExperiments(completed);
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Generate AI-powered coping experiment
  const generateExperiment = useCallback(async (
    category?: CopingExperiment['category'],
    difficulty?: CopingExperiment['difficulty']
  ): Promise<CopingExperiment | null> => {
    if (!user?.uid) return null;

    try {
      setLoading(true);
      const ai = getGenerativeAIService();

      if (!ai) return null;

      // Get user's recent experiment history for personalization
      const recentResults = await getRecentExperimentResults();

      const prompt = `
        Generate a personalized coping experiment for a wellness app user.

        User context:
        - Recent experiments completed: ${recentResults.length}
        - Preferred categories: ${category || 'any'}
        - Difficulty level: ${difficulty || 'adaptive'}

        Recent experiment effectiveness:
        ${recentResults.slice(0, 5).map(result =>
          `${result.effectiveness} (${result.rating}/5)`
        ).join(', ')}

        Create a behavioral experiment that:
        1. Is practical and actionable
        2. Takes 5-30 minutes to complete
        3. Has measurable outcomes
        4. Is appropriate for the user's experience level
        5. Includes clear instructions and expected benefits

        Return in this JSON format:
        {
          "title": "Experiment title",
          "description": "Brief description",
          "category": "mindfulness|social|physical|cognitive|emotional",
          "difficulty": "easy|medium|hard",
          "duration": 15,
          "instructions": ["Step 1", "Step 2", "Step 3"],
          "expectedOutcome": "Expected benefits and outcomes"
        }
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsed = JSON.parse(text);
      const experiment: CopingExperiment = {
        ...parsed,
        id: '',
        createdAt: Timestamp.now(),
        isActive: true,
        aiGenerated: true
      };

      // Save to database
      const experimentsRef = collection(db, 'user_experiments', user.uid, 'experiments');
      const docRef = doc(experimentsRef);
      await setDoc(docRef, { ...experiment, id: docRef.id });

      setActiveExperiments(prev => [{ ...experiment, id: docRef.id }, ...prev]);
      return { ...experiment, id: docRef.id };

    } catch (error) {
      console.error('Error generating experiment:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Get recent experiment results for personalization
  const getRecentExperimentResults = useCallback(async (): Promise<ExperimentResult[]> => {
    if (!user?.uid) return [];

    try {
      const resultsRef = collection(db, 'experiment_results');
      const q = query(
        resultsRef,
        where('userId', '==', user.uid),
        orderBy('completedAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const results: ExperimentResult[] = [];

      snapshot.forEach(doc => {
        results.push({ ...doc.data() } as ExperimentResult);
      });

      return results;
    } catch (error) {
      console.error('Error getting experiment results:', error);
      return [];
    }
  }, [user?.uid]);

  // Complete an experiment and record results
  const completeExperiment = useCallback(async (
    experimentId: string,
    rating: number,
    effectiveness: ExperimentResult['effectiveness'],
    moodBefore: number,
    moodAfter: number,
    stressBefore: number,
    stressAfter: number,
    notes?: string
  ): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setLoading(true);

      // Update experiment status
      const experimentRef = doc(db, 'user_experiments', user.uid, 'experiments', experimentId);
      await updateDoc(experimentRef, {
        completedAt: Timestamp.now(),
        userRating: rating,
        outcomeNotes: notes,
        isActive: false
      });

      // Save detailed results
      const result: ExperimentResult = {
        experimentId,
        userId: user.uid,
        completedAt: Timestamp.now(),
        rating,
        notes: notes || '',
        effectiveness,
        moodBefore,
        moodAfter,
        stressBefore,
        stressAfter
      };

      const resultsRef = collection(db, 'experiment_results');
      await setDoc(doc(resultsRef), result);

      // Update local state
      setActiveExperiments(prev => prev.filter(exp => exp.id !== experimentId));
      const completedExp = activeExperiments.find(exp => exp.id === experimentId);
      if (completedExp) {
        setCompletedExperiments(prev => [{
          ...completedExp,
          completedAt: Timestamp.now(),
          userRating: rating,
          outcomeNotes: notes,
          isActive: false
        }, ...prev]);
      }

      // Generate insights if enough data
      await generateInsights();

      return true;
    } catch (error) {
      console.error('Error completing experiment:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, activeExperiments]);

  // Generate AI-powered insights from experiment data
  const generateInsights = useCallback(async (): Promise<void> => {
    if (!user?.uid) return;

    try {
      const ai = getGenerativeAIService();
      if (!ai) return;

      const recentResults = await getRecentExperimentResults();
      if (recentResults.length < 3) return; // Need minimum data

      const prompt = `
        Analyze these coping experiment results and generate personalized insights:

        Recent experiments (${recentResults.length} total):
        ${recentResults.map(result => `
          - Rating: ${result.rating}/5
          - Effectiveness: ${result.effectiveness}
          - Mood change: ${result.moodBefore} → ${result.moodAfter}
          - Stress change: ${result.stressBefore} → ${result.stressAfter}
          - Notes: ${result.notes}
        `).join('\n')}

        Generate 2-3 data-driven insights about:
        1. What types of experiments work best
        2. Patterns in mood/stress changes
        3. Recommendations for future experiments
        4. Personal coping strategies that are effective

        Make insights specific, actionable, and encouraging.
        Return as a JSON array of insight objects:
        [{"insight": "insight text", "category": "category", "confidence": 0.85}]
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const parsed = JSON.parse(text);
      const insights: ExperimentInsight[] = parsed.map((insight: any) => ({
        id: '',
        userId: user.uid,
        insight: insight.insight,
        category: insight.category,
        confidence: insight.confidence,
        generatedAt: Timestamp.now(),
        basedOnExperiments: recentResults.map(r => r.experimentId)
      }));

      // Save insights
      const insightsRef = collection(db, 'experiment_insights', user.uid, 'insights');
      for (const insight of insights) {
        const docRef = doc(insightsRef);
        await setDoc(docRef, { ...insight, id: docRef.id });
      }

      // Load updated insights
      await loadInsights();

    } catch (error) {
      console.error('Error generating insights:', error);
    }
  }, [user?.uid, getRecentExperimentResults]);

  // Load experiment insights
  const loadInsights = useCallback(async (): Promise<void> => {
    if (!user?.uid) return;

    try {
      const insightsRef = collection(db, 'experiment_insights', user.uid, 'insights');
      const q = query(insightsRef, orderBy('generatedAt', 'desc'), limit(10));
      const snapshot = await getDocs(q);

      const insights: ExperimentInsight[] = [];
      snapshot.forEach(doc => {
        insights.push({ id: doc.id, ...doc.data() } as ExperimentInsight);
      });

      setExperimentInsights(insights);
    } catch (error) {
      console.error('Error loading insights:', error);
    }
  }, [user?.uid]);

  // Get experiment statistics
  const getExperimentStats = useCallback(() => {
    const totalCompleted = completedExperiments.length;
    const averageRating = completedExperiments.length > 0
      ? completedExperiments.reduce((sum, exp) => sum + (exp.userRating || 0), 0) / completedExperiments.length
      : 0;

    const categoryStats = completedExperiments.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostEffectiveCategory = Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    return {
      totalCompleted,
      averageRating: Math.round(averageRating * 10) / 10,
      mostEffectiveCategory,
      categoryBreakdown: categoryStats
    };
  }, [completedExperiments]);

  // Initialize
  useEffect(() => {
    if (user?.uid) {
      loadExperiments();
      loadInsights();
    }
  }, [user?.uid, loadExperiments, loadInsights]);

  return {
    activeExperiments,
    completedExperiments,
    experimentInsights,
    loading,
    generateExperiment,
    completeExperiment,
    getExperimentStats,
    loadExperiments,
    loadInsights
  };
};