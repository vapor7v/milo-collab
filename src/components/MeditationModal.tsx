import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Play, Pause, Square, CheckCircle } from 'lucide-react';

interface MeditationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MeditationModal({ isOpen, onClose }: MeditationModalProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathingCount, setBreathingCount] = useState(0);

  const totalTime = 300; // 5 minutes
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          const newTime = time - 1;

          // Breathing guide: 4 seconds inhale, 4 seconds hold, 4 seconds exhale
          const cyclePosition = (totalTime - newTime) % 12;
          if (cyclePosition < 4) {
            setBreathingPhase('inhale');
          } else if (cyclePosition < 8) {
            setBreathingPhase('hold');
          } else {
            setBreathingPhase('exhale');
          }

          if (cyclePosition === 0) {
            setBreathingCount(prev => prev + 1);
          }

          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      setIsCompleted(true);
      toast.success('🎉 Meditation completed! Great job!');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, totalTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    setIsActive(true);
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleStop = () => {
    setIsActive(false);
    setTimeLeft(300);
    setIsCompleted(false);
    setBreathingPhase('inhale');
    setBreathingCount(0);
  };

  const handleComplete = () => {
    onClose();
    setIsActive(false);
    setTimeLeft(300);
    setIsCompleted(false);
    setBreathingPhase('inhale');
    setBreathingCount(0);
  };

  const handleClose = () => {
    if (isActive) {
      toast.warning('Meditation in progress. Complete it to get the full benefit!');
      return;
    }
    handleComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🧘 5-Minute Meditation Challenge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer Display */}
          <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <CardContent className="p-6 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatTime(timeLeft)}
              </div>
              <Progress value={progress} className="h-3 mb-4" />
              <div className="text-sm text-blue-700">
                {isCompleted ? 'Completed!' : `${Math.round(progress)}% Complete`}
              </div>
            </CardContent>
          </Card>

          {/* Breathing Guide */}
          {!isCompleted && (
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-lg font-semibold text-green-800 mb-2">
                  Breathing Guide
                </div>
                <div className="text-2xl mb-2">
                  {breathingPhase === 'inhale' && '🌬️ Inhale'}
                  {breathingPhase === 'hold' && '⏸️ Hold'}
                  {breathingPhase === 'exhale' && '💨 Exhale'}
                </div>
                <div className="text-sm text-green-700">
                  Cycles completed: {breathingCount}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <div className="text-lg font-semibold text-yellow-800 mb-2">
                  🎉 Well Done!
                </div>
                <div className="text-sm text-yellow-700">
                  You've completed your 5-minute meditation challenge.
                  This helps reduce stress and improves focus!
                </div>
              </CardContent>
            </Card>
          )}

          {/* Control Buttons */}
          <div className="flex gap-3 justify-center">
            {!isCompleted ? (
              <>
                {!isActive ? (
                  <Button
                    onClick={handleStart}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  onClick={handleStop}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Stop
                </Button>
              </>
            ) : (
              <Button
                onClick={handleComplete}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Challenge
              </Button>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-600 text-center">
            💡 Focus on your breath. If your mind wanders, gently bring it back to your breathing.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}