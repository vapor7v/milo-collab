import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Trophy } from 'lucide-react'
import { ACTIVITY_TYPES } from '../../lib/constants'

interface QuickRewardsCardProps {
  onRewardActivity: (activity: string) => void
}

export const QuickRewardsCard: React.FC<QuickRewardsCardProps> = ({ onRewardActivity }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Quick Rewards
        </h3>
        <div className="flex flex-wrap gap-2">
          {ACTIVITY_TYPES.map(({ activity, label }) => (
            <Button
              key={activity}
              variant="outline"
              size="sm"
              onClick={() => onRewardActivity(activity)}
            >
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}