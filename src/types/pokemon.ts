export interface Pokemon {
  id: string;
  name: string;
  emoji?: string;
  image?: string;
  description: string;
  type: PokemonType;
  secondaryType?: PokemonType;
  color: string;
  evolution?: string;
  evolutionStage?: number;
  evolutionChain?: string[];
  generation: number;
}

export type PokemonType =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

export interface UserPokemon {
  pokemonId: string;
  nickname?: string;
  level: number;
  experience: number;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'calm';
  unlockedAt: Date;
  lastInteraction: Date;
}

export interface PokemonMoodMapping {
  mood: string;
  pokemonTypes: PokemonType[];
  description: string;
}

export const POKEMON_MOOD_MAPPINGS: PokemonMoodMapping[] = [
  {
    mood: 'happy',
    pokemonTypes: ['Fire', 'Electric', 'Fairy'],
    description: 'Energetic and cheerful Pokemon for happy moments'
  },
  {
    mood: 'sad',
    pokemonTypes: ['Water', 'Ghost', 'Dark'],
    description: 'Comforting Pokemon for difficult times'
  },
  {
    mood: 'anxious',
    pokemonTypes: ['Grass', 'Bug', 'Flying'],
    description: 'Calming Pokemon to reduce anxiety'
  },
  {
    mood: 'excited',
    pokemonTypes: ['Dragon', 'Fighting', 'Fire'],
    description: 'Adventurous Pokemon for high energy moments'
  },
  {
    mood: 'calm',
    pokemonTypes: ['Water', 'Psychic', 'Ice'],
    description: 'Peaceful Pokemon for relaxation'
  }
];

export interface PokemonAchievement {
  id: string;
  name: string;
  description: string;
  pokemonReward: string;
  requirement: string;
  unlocked: boolean;
}