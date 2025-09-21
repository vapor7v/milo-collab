import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Bell, Clock, Settings } from 'lucide-react';
import { useMeditationScheduler } from '@/hooks/useMeditationScheduler';
import { toast } from 'sonner';

export default function MeditationSettings() {
  const {
    schedule,
    notificationPermission,
    nextReminder,
    requestNotificationPermission,
    updateSchedule
  } = useMeditationScheduler();

  const [isUpdating, setIsUpdating] = useState(false);

  const handlePermissionRequest = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast.success('Notifications enabled! Meditation reminders will be scheduled.');
    } else {
      toast.error('Notification permission denied. Please enable notifications in your browser settings.');
    }
  };

  const handleScheduleUpdate = async (updates: any) => {
    setIsUpdating(true);
    try {
      await updateSchedule(updates);
      toast.success('Meditation settings updated!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsUpdating(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!schedule) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading meditation settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Meditation Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Notification Permission */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Meditation Reminders</Label>
              <p className="text-sm text-gray-600">
                Get notified during your free time to meditate
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notificationPermission === 'granted' ? (
                <div className="flex items-center gap-2 text-green-600">
                  <Bell className="w-4 h-4" />
                  <span className="text-sm">Enabled</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePermissionRequest}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable Notifications
                </Button>
              )}
            </div>
          </div>

          {notificationPermission === 'denied' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Notifications are blocked. Please enable them in your browser settings to receive meditation reminders.
              </p>
            </div>
          )}
        </div>

        {/* Enable/Disable Scheduling */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="enabled" className="text-base font-medium">Enable Scheduling</Label>
            <p className="text-sm text-gray-600">
              Automatically schedule meditation during your free time
            </p>
          </div>
          <Checkbox
            id="enabled"
            checked={schedule.enabled}
            onCheckedChange={(enabled: boolean) => handleScheduleUpdate({ enabled })}
            disabled={isUpdating}
          />
        </div>

        {/* Reminders Per Day */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Reminders Per Day</Label>
          <div className="flex gap-2">
            {[1, 2, 3].map((num) => (
              <Button
                key={num}
                variant={schedule.remindersPerDay === num ? "default" : "outline"}
                size="sm"
                onClick={() => handleScheduleUpdate({ remindersPerDay: num })}
                disabled={!schedule.enabled || isUpdating}
              >
                {num}
              </Button>
            ))}
          </div>
        </div>

        {/* Preferred Duration */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Preferred Duration</Label>
          <div className="flex gap-2">
            {[5, 10, 15, 20].map((duration) => (
              <Button
                key={duration}
                variant={schedule.preferredDuration === duration ? "default" : "outline"}
                size="sm"
                onClick={() => handleScheduleUpdate({ preferredDuration: duration })}
                disabled={!schedule.enabled || isUpdating}
              >
                {duration}min
              </Button>
            ))}
          </div>
        </div>

        {/* Work Hours Display */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Work Hours</Label>
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <Clock className="w-4 h-4" />
            <span>
              {schedule.workHours.start} - {schedule.workHours.end}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Meditation reminders are scheduled during your free time (before work, after work, and weekends).
          </p>
        </div>

        {/* Next Reminder */}
        {nextReminder && schedule.enabled && notificationPermission === 'granted' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-800">
              <Bell className="w-4 h-4" />
              <span className="font-medium">Next Reminder:</span>
              <span>{formatTime(nextReminder)}</span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {!schedule.enabled && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              Meditation scheduling is disabled. Enable it above to receive automatic reminders during your free time.
            </p>
          </div>
        )}

        {schedule.enabled && notificationPermission !== 'granted' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              Enable notifications above to receive meditation reminders.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}