import { useState } from 'react';
import { useAuth } from './useAuth';
import { useGamification } from './useGamification';
import { getGenerativeAIService } from '@/integrations/firebase/client';

export interface AIMotivation {
  message: string;
  type: 'encouragement' | 'challenge' | 'reflection' | 'celebration';
  emoji: string;
}

export interface AIPersonalizedTip {
  title: string;
  description: string;
  category: 'meditation' | 'exercise' | 'nutrition' | 'sleep' | 'social';
  difficulty: 'easy' | 'medium' | 'hard';
}

export const useAIGamification = () => {
  const { user } = useAuth();
  const { stats } = useGamification();
  const [loading, setLoading] = useState(false);
  const [aiDisabled, setAiDisabled] = useState(false);

  const generateMotivation = async (): Promise<AIMotivation> => {
    if (!user || !stats) {
      return {
        message: "Keep going! Every step counts toward your wellness journey.",
        type: 'encouragement',
        emoji: '💪'
      };
    }

    // If AI is disabled due to previous failures, return fallback immediately
    if (aiDisabled) {
      return {
        message: "You're making great progress! Keep building those healthy habits! 🌱",
        type: 'encouragement' as const,
        emoji: '🌱'
      };
    }

    try {
      setLoading(true);
      const ai = getGenerativeAIService();

      if (!ai) {
        setAiDisabled(true);
        return {
          message: "Stay consistent! Your daily efforts are creating lasting change! 💪",
          type: 'encouragement' as const,
          emoji: '💪'
        };
      }

      const prompt = `
        Generate a personalized motivation message for a wellness app user with these stats:
        - Level: ${stats.level}
        - Current Streak: ${stats.currentStreak} days
        - Total Tasks Completed: ${stats.totalTasksCompleted}
        - Health Points: ${stats.health}/100
        - XP: ${stats.xp}

        Create a short, encouraging message (under 100 characters) that:
        1. Acknowledges their current progress
        2. Motivates them to continue
        3. Includes an appropriate emoji
        4. Matches their achievement level

        Return in this format: {"message": "your message", "type": "encouragement|challenge|reflection|celebration", "emoji": "emoji"}
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (parseError) {
        // Fallback if AI returns malformed JSON
        return {
          message: "You're doing amazing! Keep up the great work! 🌟",
          type: 'encouragement' as const,
          emoji: '🌟'
        };
      }
    } catch (error: any) {
      // Check if it's an API key/blocked error
      if (error?.message?.includes('API_KEY_SERVICE_BLOCKED') ||
          error?.message?.includes('403') ||
          error?.message?.includes('blocked')) {
        setAiDisabled(true);
        // Only log once when disabling AI
        console.warn('AI service blocked, using fallback content');
      } else {
        // Log other errors but don't spam console
        console.error('Error generating AI motivation:', error?.message || error);
      }

      return {
        message: "Every small step leads to big changes. You've got this! ✨",
        type: 'encouragement' as const,
        emoji: '✨'
      };
    } finally {
      setLoading(false);
    }
  };

  const generatePersonalizedTips = async (): Promise<AIPersonalizedTip[]> => {
    if (!user || !stats) {
      return [{
        title: "Start Small",
        description: "Begin with 5-minute meditation sessions to build your practice.",
        category: 'meditation' as const,
        difficulty: 'easy' as const
      }];
    }

    // If AI is disabled due to previous failures, return fallback immediately
    if (aiDisabled) {
      return [
        {
          title: "Daily Movement",
          description: "Take a 10-minute walk or do some light stretching to stay active.",
          category: 'exercise' as const,
          difficulty: 'easy' as const
        },
        {
          title: "Mindful Moments",
          description: "Pause for 2 minutes of deep breathing when you feel stressed.",
          category: 'meditation' as const,
          difficulty: 'easy' as const
        },
        {
          title: "Healthy Hydration",
          description: "Drink a glass of water and notice how it makes you feel refreshed.",
          category: 'nutrition' as const,
          difficulty: 'easy' as const
        }
      ];
    }

    try {
      setLoading(true);
      const ai = getGenerativeAIService();

      if (!ai) {
        setAiDisabled(true);
        return [{
          title: "Build Habits",
          description: "Focus on one small, positive change today. Small steps lead to big results!",
          category: 'meditation' as const,
          difficulty: 'easy' as const
        }];
      }

      const prompt = `
        Generate 3 personalized wellness tips for a user with these characteristics:
        - Level: ${stats.level}
        - Current Streak: ${stats.currentStreak} days
        - Health Points: ${stats.health}/100
        - Total Tasks: ${stats.totalTasksCompleted}

        Each tip should include:
        - title: Short, catchy title
        - description: 1-2 sentence explanation
        - category: meditation|exercise|nutrition|sleep|social
        - difficulty: easy|medium|hard

        Consider their current level and streak when suggesting appropriate challenges.
        Return as a JSON array of objects.
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const parsed = JSON.parse(text);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch (parseError) {
        // Fallback tips
        return [
          {
            title: "Mindful Breathing",
            description: "Practice 4-7-8 breathing: inhale for 4 counts, hold for 7, exhale for 8.",
            category: 'meditation' as const,
            difficulty: 'easy' as const
          },
          {
            title: "Gratitude Practice",
            description: "Write down 3 things you're grateful for each evening.",
            category: 'social' as const,
            difficulty: 'easy' as const
          },
          {
            title: "Nature Walk",
            description: "Take a 20-minute walk in nature to boost your mood and energy.",
            category: 'exercise' as const,
            difficulty: 'medium' as const
          }
        ];
      }
    } catch (error: any) {
      // Check if it's an API key/blocked error
      if (error?.message?.includes('API_KEY_SERVICE_BLOCKED') ||
          error?.message?.includes('403') ||
          error?.message?.includes('blocked')) {
        setAiDisabled(true);
        console.warn('AI service blocked, using fallback tips');
      } else {
        console.error('Error generating AI tips:', error?.message || error);
      }

      return [{
        title: "Stay Consistent",
        description: "Consistency is key to building healthy habits. Keep showing up for yourself!",
        category: 'meditation' as const,
        difficulty: 'easy' as const
      }];
    } finally {
      setLoading(false);
    }
  };

  const generateAchievementCelebration = async (achievementId: string): Promise<string> => {
    if (!stats) return "Congratulations on your achievement! 🎉";

    // If AI is disabled, return fallback immediately
    if (aiDisabled) {
      return `Fantastic! You've unlocked "${achievementId}"! Keep up the amazing work! 🏆🎉`;
    }

    try {
      const ai = getGenerativeAIService();

      if (!ai) {
        setAiDisabled(true);
        return `Congratulations! "${achievementId}" unlocked! You're doing great! 🌟🏆`;
      }

      const prompt = `
        Create a celebratory message for this achievement: ${achievementId}
        User stats: Level ${stats.level}, ${stats.currentStreak} day streak, ${stats.totalTasksCompleted} tasks completed

        Make it personalized, encouraging, and fun. Keep it under 150 characters.
        Include relevant emojis and make it feel like a special moment.
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      // Check if it's an API key/blocked error
      if (error?.message?.includes('API_KEY_SERVICE_BLOCKED') ||
          error?.message?.includes('403') ||
          error?.message?.includes('blocked')) {
        setAiDisabled(true);
        console.warn('AI service blocked, using fallback celebration');
      } else {
        console.error('Error generating celebration:', error?.message || error);
      }

      return `Amazing achievement unlocked! You're crushing your wellness goals! 🏆✨`;
    }
  };

  const generateStreakEncouragement = async (): Promise<string> => {
    if (!stats) return "Keep your streak going! 🔥";

    // If AI is disabled, return fallback immediately
    if (aiDisabled) {
      return `Day ${stats.currentStreak}! You're building an amazing habit! Keep it up! 🔥`;
    }

    try {
      const ai = getGenerativeAIService();

      if (!ai) {
        setAiDisabled(true);
        return `Day ${stats.currentStreak}! Your consistency is inspiring! Stay strong! 💪`;
      }

      const prompt = `
        Create an encouraging message about maintaining a streak.
        Current streak: ${stats.currentStreak} days
        Longest streak: ${stats.longestStreak} days
        Level: ${stats.level}

        Make it motivating and specific to their current progress.
        Keep it under 120 characters with emojis.
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error: any) {
      // Check if it's an API key/blocked error
      if (error?.message?.includes('API_KEY_SERVICE_BLOCKED') ||
          error?.message?.includes('403') ||
          error?.message?.includes('blocked')) {
        setAiDisabled(true);
        console.warn('AI service blocked, using fallback streak message');
      } else {
        console.error('Error generating streak encouragement:', error?.message || error);
      }

      return `Day ${stats.currentStreak}! You're on fire! Keep the momentum going! 🔥`;
    }
  };

  return {
    generateMotivation,
    generatePersonalizedTips,
    generateAchievementCelebration,
    generateStreakEncouragement,
    loading
  };
};