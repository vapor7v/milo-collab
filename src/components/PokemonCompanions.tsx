import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { usePokemon } from '../hooks/usePokemon';
import { PokemonService } from '../services/pokemonService';
import { Star } from 'lucide-react';

const pokemonService = PokemonService.getInstance();

interface PokemonCompanionsProps {
  onSelectCompanion?: (slot: number) => void;
}

export const PokemonCompanions: React.FC<PokemonCompanionsProps> = ({
  onSelectCompanion
}) => {
  const { userPokemon, saveUserPokemon } = usePokemon();

  console.log('🎯 PokemonCompanions: userPokemon array:', userPokemon);
  console.log('🎯 PokemonCompanions: userPokemon length:', userPokemon.length);

  // Debug: Show what Pokemon are in each slot
  userPokemon.forEach((pokemon, index) => {
    console.log(`🎯 Slot ${index + 1}:`, pokemon?.pokemonId || 'empty');
  });

  const renderCompanionSlot = (slot: number) => {
    const companion = userPokemon[slot - 1];

    if (companion) {
      // Companion is unlocked
      const pokemonData = pokemonService.getPokemonById(companion.pokemonId);

      return (
        <Card key={slot} className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Companion {slot}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                {pokemonData ? (
                  <img
                    src={pokemonData.image}
                    alt={pokemonData.name}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : null}
                <div className="text-2xl hidden">
                  {pokemonData?.emoji || '🎮'}
                </div>
              </div>
              <div className="text-xs text-green-700 font-medium">Active</div>
              <div className="text-xs text-gray-600 mt-1">
                {pokemonData?.name || 'Unknown'}
              </div>
              <div className="text-xs text-gray-500">
                Level {companion.level}
              </div>
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => onSelectCompanion?.(slot)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    } else {
      // Companion slot is empty
      return (
        <Card key={slot} className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-gray-400" />
              Companion {slot}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-center">
              <div className="text-2xl mb-2">🎮</div>
              <div className="text-xs text-gray-600">Not unlocked</div>
              <div className="text-xs text-gray-500 mt-1">
                Complete wellness activities to unlock
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Your Pokemon Companions</h3>
        <p className="text-sm text-gray-600">
          Your Pokemon grow stronger as you take care of your mental health!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(slot => renderCompanionSlot(slot))}
      </div>

      <div className="text-center">
        <div className="text-xs text-gray-500">
          {Math.min(userPokemon.length, 3)}/3 Companions unlocked
        </div>
        {userPokemon.length > 3 && (
          <div className="text-xs text-red-500 mt-1">
            ⚠️ Extra Pokemon detected: {userPokemon.length - 3} additional
          </div>
        )}
      </div>
    </div>
  );
};