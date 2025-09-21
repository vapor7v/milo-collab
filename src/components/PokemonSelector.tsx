import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { usePokemon } from '../hooks/usePokemon';
import { useAuth } from '../hooks/useAuth';
import { PokemonService } from '../services/pokemonService';
import { CheckCircle, Star } from 'lucide-react';

const pokemonService = PokemonService.getInstance();

interface PokemonSelectorProps {
  onSelectionComplete?: (selectedPokemon: string[]) => void;
  maxSelection?: number;
}

export const PokemonSelector: React.FC<PokemonSelectorProps> = ({
  onSelectionComplete,
  maxSelection = 3
}) => {
  const { user } = useAuth();
  const { getPopularStage1Pokemon, unlockPokemon, saveUserPokemon, userPokemon } = usePokemon();
  const [popularPokemon, setPopularPokemon] = useState<any[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pokemon = getPopularStage1Pokemon();
    setPopularPokemon(pokemon);
  }, [getPopularStage1Pokemon]);

  const handlePokemonSelect = (pokemonId: string) => {
    if (selectedPokemon.includes(pokemonId)) {
      // Deselect
      setSelectedPokemon(prev => prev.filter(id => id !== pokemonId));
    } else if (selectedPokemon.length < maxSelection) {
      // Select
      setSelectedPokemon(prev => [...prev, pokemonId]);
    }
  };

  const handleConfirmSelection = async () => {
    if (selectedPokemon.length !== maxSelection) return;

    console.log('🎯 Starting Pokemon selection process:', selectedPokemon);
    setLoading(true);
    try {
      // Create all UserPokemon objects at once
      const newUserPokemon = selectedPokemon.map(pokemonId =>
        pokemonService.createUserPokemon(pokemonId)
      );

      console.log('📦 Created UserPokemon objects:', newUserPokemon);

      // Save all Pokemon at once
      await saveUserPokemon(newUserPokemon);

      console.log('✅ Successfully saved all Pokemon');
      onSelectionComplete?.(selectedPokemon);
    } catch (error) {
      console.error('❌ Failed to save Pokemon selection:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (pokemonId: string) => selectedPokemon.includes(pokemonId);
  const canSelectMore = selectedPokemon.length < maxSelection;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Choose Your Pokemon Companions</h2>
            <p className="text-gray-600 mt-2">
              Select {maxSelection} Pokemon that will grow with your mental health journey
            </p>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {selectedPokemon.length}/{maxSelection} Selected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {popularPokemon.map((pokemon) => (
            <Card
              key={pokemon.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isSelected(pokemon.id)
                  ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                  : 'hover:border-gray-300'
              } ${
                !canSelectMore && !isSelected(pokemon.id)
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              onClick={() => {
                if (canSelectMore || isSelected(pokemon.id)) {
                  handlePokemonSelect(pokemon.id);
                }
              }}
            >
              <CardContent className="p-4 text-center">
                <div className="relative">
                  {isSelected(pokemon.id) && (
                    <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="mb-2 flex justify-center">
                    <img
                      src={pokemon.image}
                      alt={pokemon.name}
                      className="w-16 h-16 object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                    <div className="text-4xl hidden">{pokemon.emoji || '🎮'}</div>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{pokemon.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {pokemon.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleConfirmSelection}
            disabled={selectedPokemon.length !== maxSelection || loading}
            className="px-8 py-3 text-lg"
          >
            {loading ? 'Unlocking Pokemon...' : `Confirm ${maxSelection} Companions`}
            <Star className="ml-2 h-5 w-5" />
          </Button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">How It Works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your Pokemon will evolve as your mental health improves</li>
            <li>• Complete wellness activities to help them grow stronger</li>
            <li>• Maintain positive moods to unlock their full potential</li>
            <li>• Each Pokemon has unique evolution requirements based on your journey</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PokemonSelector;