import React, { useState, useCallback } from 'react';
import { usePokemon, usePokemonMood, usePokemonRewards } from '../hooks/usePokemon';
import { PokemonGrid } from './PokemonCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles } from 'lucide-react';
import { PokemonService } from '../services/pokemonService';
import {
  MoodSyncCard,
  QuickRewardsCard,
  CollectionStatsCard,
  SearchFiltersCard
} from './PokemonCollectionComponents';

const pokemonService = PokemonService.getInstance();

export const PokemonCollection: React.FC = () => {
  const {
    userPokemon,
    loading,
    unlockPokemon,
    getAllPokemon,
    searchPokemon,
    getStarterPokemon,
    getPokemonForMood
  } = usePokemon();

  const { syncWithUserMood } = usePokemonMood();
  const { rewardForActivity } = usePokemonRewards();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [showStarters, setShowStarters] = useState(false);

  const allPokemon = getAllPokemon();
  const starterPokemon = getStarterPokemon();

  const filteredPokemon = searchQuery
    ? searchPokemon(searchQuery)
    : showStarters
    ? starterPokemon
    : selectedMood
    ? getPokemonForMood(selectedMood)
    : allPokemon;

  const handleUnlockPokemon = async (pokemonId: string) => {
    await unlockPokemon(pokemonId);
  };

  const handleMoodSync = useCallback(async (mood: string) => {
    await syncWithUserMood(mood);
    setSelectedMood(mood);
  }, [syncWithUserMood]);

  const handleRewardActivity = useCallback(async (activity: string) => {
    if (userPokemon.length > 0) {
      const randomPokemon = userPokemon[Math.floor(Math.random() * userPokemon.length)];
      await rewardForActivity(activity, randomPokemon.pokemonId);
    }
  }, [userPokemon, rewardForActivity]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleToggleStarters = useCallback(() => {
    setShowStarters(!showStarters);
  }, [showStarters]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedMood('');
    setShowStarters(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            Pokemon Wellness Companions
          </CardTitle>
          <p className="text-sm text-gray-600">
            Your Pokemon grow stronger as you take care of your mental health!
          </p>
        </CardHeader>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MoodSyncCard
          selectedMood={selectedMood}
          onMoodSync={handleMoodSync}
        />
        <QuickRewardsCard onRewardActivity={handleRewardActivity} />
        <CollectionStatsCard userPokemon={userPokemon} />
      </div>

      {/* Search and Filters */}
      <SearchFiltersCard
        searchQuery={searchQuery}
        showStarters={showStarters}
        onSearchChange={handleSearchChange}
        onToggleStarters={handleToggleStarters}
        onClearFilters={handleClearFilters}
      />

      {/* User's Pokemon Collection */}
      {userPokemon.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Pokemon Team</CardTitle>
          </CardHeader>
          <CardContent>
            <PokemonGrid
              pokemon={userPokemon.map(up => pokemonService.getPokemonById(up.pokemonId)!).filter(Boolean)}
              userPokemon={userPokemon}
              onPokemonClick={(id) => console.log('Interact with', id)}
              size="medium"
            />
          </CardContent>
        </Card>
      )}

      {/* Available Pokemon */}
      <Card>
        <CardHeader>
          <CardTitle>
            {showStarters ? 'Starter Pokemon' : selectedMood ? `${selectedMood} Pokemon` : 'All Pokemon'}
            <Badge variant="outline" className="ml-2">
              {filteredPokemon.length} available
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PokemonGrid
            pokemon={filteredPokemon}
            userPokemon={userPokemon}
            onPokemonClick={handleUnlockPokemon}
            size="small"
          />
        </CardContent>
      </Card>
    </div>
  );
};