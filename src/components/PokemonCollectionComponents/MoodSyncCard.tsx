import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Heart } from 'lucide-react'
import { MOOD_OPTIONS } from '../../lib/constants'

interface MoodSyncCardProps {
  selectedMood: string
  onMoodSync: (mood: string) => void
}

export const MoodSyncCard: React.FC<MoodSyncCardProps> = ({ selectedMood, onMoodSync }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Mood Sync
        </h3>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((mood) => (
            <Button
              key={mood}
              variant={selectedMood === mood ? 'default' : 'outline'}
              size="sm"
              onClick={() => onMoodSync(mood)}
              className="capitalize"
            >
              {mood}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}