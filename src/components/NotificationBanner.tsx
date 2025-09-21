import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WellnessButton } from '@/components/WellnessButton';
import { X, Play, Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationBanner: React.FC = () => {
  const { notification, dismissNotification, startMeditationChallenge } = useNotifications();

  if (!notification?.isActive) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-96 shadow-lg border-primary/20 bg-primary-50 dark:bg-primary-900/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-primary mb-1">
              {notification.type === 'meditation' ? '🧘 Meditation Challenge' : '💡 Wellness Reminder'}
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {notification.message}
            </p>

            <div className="flex gap-2 mt-3">
              <WellnessButton
                onClick={startMeditationChallenge}
                size="sm"
                className="flex items-center gap-2"
              >
                <Play className="w-3 h-3" />
                Start Now
              </WellnessButton>

              <Button
                onClick={dismissNotification}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Maybe Later
              </Button>
            </div>
          </div>

          <Button
            onClick={dismissNotification}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};