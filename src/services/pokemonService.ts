import { Pokemon, UserPokemon } from '../types/pokemon';
import pokemonData from '../data/pokemon_trimmed.json';

export class PokemonService {
  private static instance: PokemonService;
  private pokemonDatabase: Pokemon[] = [];

  private constructor() {
    this.pokemonDatabase = pokemonData as Pokemon[];
  }

  static getInstance(): PokemonService {
    if (!PokemonService.instance) {
      PokemonService.instance = new PokemonService();
    }
    return PokemonService.instance;
  }

  // Get all Pokemon
  getAllPokemon(): Pokemon[] {
    return this.pokemonDatabase;
  }

  // Get Pokemon by ID
  getPokemonById(id: string): Pokemon | undefined {
    return this.pokemonDatabase.find(pokemon => pokemon.id === id);
  }

  // Get only stage 1 (basic) Pokemon for selection
  getStage1Pokemon(): Pokemon[] {
    return this.pokemonDatabase.filter(pokemon => pokemon.evolutionStage === 1);
  }

  // Get popular stage 1 Pokemon for initial selection
  getPopularStage1Pokemon(): Pokemon[] {
    const popularIds = [
      'bulbasaur', 'charmander', 'squirtle', 'pikachu', 'eevee',
      'chikorita', 'cyndaquil', 'totodile', 'treecko', 'torchic',
      'mudkip', 'turtwig', 'chimchar', 'piplup', 'snivy',
      'tepig', 'oshawott', 'chespin', 'fennekin', 'froakie',
      'rowlet', 'litten', 'popplio', 'grookey', 'scorbunny'
    ];

    return popularIds
      .map(id => this.getPokemonById(id))
      .filter(pokemon => pokemon && pokemon.evolutionStage === 1) as Pokemon[];
  }

  // Create a new UserPokemon
  createUserPokemon(pokemonId: string, nickname?: string): UserPokemon {
    return {
      pokemonId,
      nickname: nickname || undefined,
      level: 1,
      experience: 0,
      mood: 'neutral',
      unlockedAt: new Date(),
      lastInteraction: new Date()
    };
  }

  // Search Pokemon by name
  searchPokemon(query: string): Pokemon[] {
    const lowercaseQuery = query.toLowerCase();
    return this.pokemonDatabase.filter(pokemon =>
      pokemon.name.toLowerCase().includes(lowercaseQuery) ||
      pokemon.id.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Get Pokemon suitable for a specific mood (simplified)
  getPokemonForMood(mood: string): Pokemon[] {
    // Return a subset of Pokemon based on mood
    // This is a simplified implementation
    const moodMap: { [key: string]: string[] } = {
      happy: ['pikachu', 'eevee', 'togepi'],
      sad: ['slowpoke', 'jigglypuff', 'chansey'],
      calm: ['mew', 'celebi', 'azurill'],
      excited: ['charizard', 'blaziken', 'sceptile'],
      neutral: ['bulbasaur', 'squirtle', 'charmander']
    };

    const moodPokemon = moodMap[mood.toLowerCase()] || [];
    return moodPokemon.map(id => this.getPokemonById(id)).filter(Boolean) as Pokemon[];
  }
}