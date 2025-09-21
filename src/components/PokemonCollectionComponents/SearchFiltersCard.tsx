import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Search } from 'lucide-react'

interface SearchFiltersCardProps {
  searchQuery: string
  showStarters: boolean
  onSearchChange: (query: string) => void
  onToggleStarters: () => void
  onClearFilters: () => void
}

export const SearchFiltersCard: React.FC<SearchFiltersCardProps> = ({
  searchQuery,
  showStarters,
  onSearchChange,
  onToggleStarters,
  onClearFilters
}) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search Pokemon..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={showStarters ? 'default' : 'outline'}
              size="sm"
              onClick={onToggleStarters}
            >
              Starter Pokemon
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}