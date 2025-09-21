import React from 'react';
import { Pokemon, UserPokemon } from '../types/pokemon';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Heart, Star } from 'lucide-react';
import { getPokemonTypeColor, getMoodColor } from '../lib/utils';

interface PokemonCardProps {
  pokemon: Pokemon;
  userPokemon?: UserPokemon;
  onInteract?: (pokemonId: string) => void;
  onEvolve?: (pokemonId: string) => void;
  showStats?: boolean;
  size?: 'small' | 'medium' | 'large';
  evolutionProgress?: number;
  canEvolve?: boolean;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  userPokemon,
  onInteract,
  onEvolve,
  showStats = true,
  size = 'medium',
  evolutionProgress = 0,
  canEvolve = false
}) => {
  const sizeClasses = {
    small: 'w-32 h-40',
    medium: 'w-48 h-56',
    large: 'w-64 h-72'
  };

  const emojiSize = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl'
  };


  return (
    <Card
      className={`${sizeClasses[size]} cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${pokemon.color} border-2`}
      onClick={() => onInteract?.(pokemon.id)}
    >
      <CardHeader className="p-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-white">
            {pokemon.name}
          </CardTitle>
          {userPokemon && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-300" />
              <span className="text-xs text-white font-bold">
                {userPokemon.level}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-2 flex flex-col items-center">
        <div className={`${emojiSize[size]} mb-2 flex items-center justify-center relative`}>
          {pokemon.image ? (
            <>
              <img
                src={pokemon.image}
                alt={pokemon.name}
                className="w-full h-full object-contain pokemon-image"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.parentElement?.querySelector('.fallback-emoji');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'flex';
                  }
                }}
                onLoad={(e) => {
                  // Show image if it loads successfully
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'block';
                  const fallback = target.parentElement?.querySelector('.fallback-emoji');
                  if (fallback) {
                    (fallback as HTMLElement).style.display = 'none';
                  }
                }}
              />
              <div className="fallback-emoji absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                <span className={`${emojiSize[size]}`}>
                  {pokemon.emoji || '🎮'}
                </span>
              </div>
            </>
          ) : (
            <span className={`${emojiSize[size]}`}>
              {pokemon.emoji || '🎮'}
            </span>
          )}
        </div>

        <div className="flex gap-1 mb-2">
          <Badge className={`text-xs text-white ${getPokemonTypeColor(pokemon.type)}`}>
            {pokemon.type}
          </Badge>
          {pokemon.secondaryType && (
            <Badge className={`text-xs text-white ${getPokemonTypeColor(pokemon.secondaryType)}`}>
              {pokemon.secondaryType}
            </Badge>
          )}
        </div>

        {userPokemon && showStats && (
          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-xs text-white">
              <span>EXP</span>
              <span>{userPokemon.experience}/100</span>
            </div>
            <Progress
              value={(userPokemon.experience / 100) * 100}
              className="h-1"
            />

            {/* Evolution Progress */}
            {pokemon.evolution && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-white">
                  <span>Evolution</span>
                  <span>{Math.round(evolutionProgress)}%</span>
                </div>
                <Progress
                  value={evolutionProgress}
                  className="h-1"
                />
                {canEvolve && (
                  <Button
                    size="sm"
                    className="w-full mt-1 text-xs bg-yellow-500 hover:bg-yellow-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEvolve?.(pokemon.id);
                    }}
                  >
                    ✨ Evolve!
                  </Button>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-1 mt-2">
              <Heart className={`w-3 h-3 ${getMoodColor(userPokemon.mood)}`} />
              <span className="text-xs text-white capitalize">
                {userPokemon.mood}
              </span>
            </div>
          </div>
        )}

        {!userPokemon && (
          <div className="text-xs text-white/80 text-center mt-2">
            {pokemon.description.split(' ').slice(0, 6).join(' ')}...
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface PokemonGridProps {
  pokemon: Pokemon[];
  userPokemon?: UserPokemon[];
  onPokemonClick?: (pokemonId: string) => void;
  size?: 'small' | 'medium' | 'large';
}

export const PokemonGrid: React.FC<PokemonGridProps> = ({
  pokemon,
  userPokemon = [],
  onPokemonClick,
  size = 'medium'
}) => {
  const gridCols = {
    small: 'grid-cols-4',
    medium: 'grid-cols-3',
    large: 'grid-cols-2'
  };

  return (
    <div className={`grid ${gridCols[size]} gap-4 p-4`}>
      {pokemon.map((p) => {
        const userP = userPokemon.find(up => up.pokemonId === p.id);
        return (
          <PokemonCard
            key={p.id}
            pokemon={p}
            userPokemon={userP}
            onInteract={onPokemonClick}
            size={size}
          />
        );
      })}
    </div>
  );
};