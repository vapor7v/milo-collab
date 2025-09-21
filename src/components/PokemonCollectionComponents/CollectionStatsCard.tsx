import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { calculateAverageLevel } from '../../lib/utils'

interface UserPokemon {
  level: number
}

interface CollectionStatsCardProps {
  userPokemon: UserPokemon[]
}

export const CollectionStatsCard: React.FC<CollectionStatsCardProps> = ({ userPokemon }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Collection Stats</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Total Pokemon:</span>
            <Badge variant="secondary">{userPokemon.length}</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Avg Level:</span>
            <Badge variant="secondary">
              {calculateAverageLevel(userPokemon)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}