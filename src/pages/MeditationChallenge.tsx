import React, { useState, useEffect } from 'react';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';

export default function MeditationChallenge() {
  const navigate = useNavigate();
  const { markMeditationCompleted } = useDailyChallenges();
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const totalTime = 300;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            setIsCompleted(true);
            setIsActive(false);
            setShowResults(true);
            // Mark meditation challenge as completed
            markMeditationCompleted();
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  // Handle page visibility change (user switching tabs/windows)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        // User switched away - fail the challenge
        setIsActive(false);
        setIsFailed(true);
        setShowResults(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  const startSession = () => {
    setSessionStarted(true);
    setIsActive(true);
  };

  const resetSession = () => {
    setIsActive(false);
    setTimeLeft(300);
    setIsCompleted(false);
    setIsFailed(false);
    setSessionStarted(false);
    setShowResults(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <Layout background="gradient">
      <Container className="max-w-md mx-auto">
        <Card className="p-8 mt-10 mb-8 shadow-md border-0 rounded-2xl bg-white flex flex-col items-center text-center">
          <h2 className="text-2xl font-bold mb-2 text-primary">Meditation Challenge</h2>
          <p className="text-muted-foreground mb-6">Take 5 minutes to relax, breathe, and focus on your well-being.</p>

          {!showResults ? (
            <>
              <div className="w-full flex flex-col items-center mb-6">
                <Progress value={progress} className="mb-4 h-3" />
                <div className="text-4xl font-mono text-primary mb-2">{formatTime(timeLeft)}</div>
                {isActive && (
                  <div className="text-sm text-blue-600 font-medium mb-2">
                    Stay focused - don't switch tabs or apps!
                  </div>
                )}
              </div>

              <div className="flex gap-4 mb-4">
                {!sessionStarted ? (
                  <WellnessButton onClick={startSession} size="lg">
                    <Play className="w-5 h-5 mr-2" /> Start Challenge
                  </WellnessButton>
                ) : isActive ? (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 mb-2">Challenge in progress...</div>
                    <div className="text-xs text-red-600">⚠️ Don't leave this page or the challenge will fail!</div>
                  </div>
                ) : (
                  <WellnessButton onClick={resetSession} variant="secondary">
                    Try Again
                  </WellnessButton>
                )}
              </div>
            </>
          ) : (
            <div className="w-full flex flex-col items-center mb-6">
              {isCompleted ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600 mb-2">Challenge Completed! 🎉</h3>
                  <p className="text-gray-600 mb-4">Great job! You successfully completed the 5-minute meditation challenge.</p>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-green-800">✅ Task marked as successful</p>
                    <p className="text-sm text-green-800">🏆 Pokemon experience points earned</p>
                  </div>
                </>
              ) : isFailed ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-red-600 mb-2">Challenge Failed</h3>
                  <p className="text-gray-600 mb-4">The meditation challenge was interrupted. Try again when you can focus completely.</p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-red-800 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>What happened:</span>
                    </div>
                    <p className="text-sm text-red-700">You switched tabs or left the page during the challenge.</p>
                  </div>
                </>
              ) : null}

              <div className="flex gap-3">
                <WellnessButton onClick={resetSession} variant="outline">
                  Try Again
                </WellnessButton>
                <WellnessButton onClick={handleBackToDashboard}>
                  Back to Dashboard
                </WellnessButton>
              </div>
            </div>
          )}

          {!showResults && (
            <WellnessButton onClick={handleBackToDashboard} variant="ghost" className="w-full mt-4">
              Cancel Challenge
            </WellnessButton>
          )}
        </Card>
      </Container>
    </Layout>
  );
}
