import { useState, useEffect, useCallback } from 'react';
import { useAIGamification } from '@/hooks/useAIGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Sparkles, RefreshCw, Heart, Target } from 'lucide-react';
import { getCategoryIcon, getDifficultyColor } from '../lib/utils';

export const AIWellnessCoach = () => {
  const {
    generateMotivation,
    generatePersonalizedTips,
    generateStreakEncouragement,
    loading
  } = useAIGamification();

  const [currentMotivation, setCurrentMotivation] = useState<string>('');
  const [currentTips, setCurrentTips] = useState<{ category: string; title: string; description: string; difficulty: string }[]>([]);
  const [streakMessage, setStreakMessage] = useState<string>('');


  const loadMotivation = useCallback(async () => {
    try {
      const motivation = await generateMotivation();
      setCurrentMotivation(`${motivation.emoji} ${motivation.message}`);
      // Removed excessive toast notifications for better UX
    } catch {
      // Silent error handling
    }
  }, [generateMotivation]);

  const loadTips = useCallback(async () => {
    try {
      const tips = await generatePersonalizedTips();
      setCurrentTips(tips);
      // Removed excessive toast notifications for better UX
    } catch {
      // Silent error handling
    }
  }, [generatePersonalizedTips]);

  const loadStreakMessage = useCallback(async () => {
    try {
      const message = await generateStreakEncouragement();
      setStreakMessage(message);
      // Removed excessive toast notifications for better UX
    } catch {
      // Silent error handling
    }
  }, [generateStreakEncouragement]);

  useEffect(() => {
    // Load initial content
    loadMotivation();
    loadTips();
    loadStreakMessage();
  }, [loadMotivation, loadTips, loadStreakMessage]);

  return (
    <Card className="bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 border-2 border-cyan-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Bot className="h-6 w-6" />
          </div>
          <span>AI Wellness Coach</span>
          <Sparkles className="h-5 w-5 animate-pulse" />
        </CardTitle>
        <p className="text-cyan-100 text-sm">
          Personalized guidance powered by Gemini AI 🤖✨
        </p>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Daily Motivation */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-purple-900 flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Daily Motivation
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={loadMotivation}
              disabled={loading}
              className="bg-white/80 hover:bg-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-purple-800 text-lg font-medium leading-relaxed">
            {currentMotivation || 'Loading your personalized motivation...'}
          </p>
        </div>

        {/* Personalized Tips */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Your Personalized Tips
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={loadTips}
              disabled={loading}
              className="bg-blue-50 hover:bg-blue-100"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          <div className="grid gap-3">
            {currentTips.map((tip, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 border border-blue-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getCategoryIcon(tip.category)}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{tip.title}</h4>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tip.difficulty)}`}>
                        {tip.difficulty}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Encouragement */}
        <div className="bg-gradient-to-r from-orange-100 to-red-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-orange-900 flex items-center gap-2">
              <span className="text-xl">🔥</span>
              Streak Power-Up
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={loadStreakMessage}
              disabled={loading}
              className="bg-white/80 hover:bg-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <p className="text-orange-800 text-base font-medium leading-relaxed">
            {streakMessage || 'Loading your streak encouragement...'}
          </p>
        </div>

        {/* AI Features Info */}
        <div className="bg-gradient-to-r from-green-100 to-teal-100 rounded-xl p-4 border border-green-200">
          <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI-Powered Features
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-600" />
              <span className="text-green-800">Personalized Motivation</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-green-800">Smart Wellness Tips</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <span className="text-green-800">Streak Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-green-600" />
              <span className="text-green-800">Adaptive Learning</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};