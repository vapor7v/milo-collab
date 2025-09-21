import { useEffect, useState } from 'react';
import { Achievement } from '@/hooks/useGamification';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export const AchievementNotification = ({ achievement, onClose }: AchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement || !isVisible) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <Card className="bg-gradient-to-r from-yellow-400 to-orange-500 border-2 border-yellow-300 shadow-2xl max-w-sm">
        <div className="p-4 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Achievement Unlocked!</h3>
              <p className="text-yellow-100 text-sm">{achievement.title}</p>
            </div>
          </div>
          <p className="text-sm text-yellow-50 mb-3">{achievement.description}</p>
          <div className="flex items-center gap-2 text-xs text-yellow-200">
            <span className="text-lg">{achievement.icon}</span>
            <span>{achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)} Achievement</span>
          </div>
        </div>
      </Card>
    </div>
  );
};