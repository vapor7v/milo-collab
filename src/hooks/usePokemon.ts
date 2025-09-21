import { useState, useEffect, useCallback } from 'react';
import { Pokemon, UserPokemon } from '../types/pokemon';
import { PokemonService } from '../services/pokemonService';
import { useAuth } from './useAuth';
import { db } from '../integrations/firebase/client';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

const pokemonService = PokemonService.getInstance();

export const usePokemon = () => {
  const [userPokemon, setUserPokemon] = useState<UserPokemon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Load user's Pokemon collection from Firestore
  const loadUserPokemon = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const docRef = doc(db, 'userPokemon', user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.pokemon && Array.isArray(data.pokemon)) {
          // Convert Firestore Timestamps back to Date objects
          const pokemon = data.pokemon.map((p: any) => ({
            pokemonId: p.pokemonId,
            nickname: p.nickname,
            level: p.level,
            experience: p.experience,
            mood: p.mood,
            unlockedAt: p.unlockedAt?.toDate ? p.unlockedAt.toDate() : new Date(p.unlockedAt),
            lastInteraction: p.lastInteraction?.toDate ? p.lastInteraction.toDate() : new Date(p.lastInteraction)
          }));
          setUserPokemon(pokemon);
        }
      }
    } catch (err) {
      console.error('Failed to load Pokemon:', err);
      setError('Failed to load Pokemon collection');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save user's Pokemon collection to Firestore
  const saveUserPokemon = useCallback(async (pokemon: UserPokemon[]) => {
    if (!user) return;

    try {
      // Convert Date objects to Firestore Timestamps and ensure no undefined values
      const firestoreData = pokemon.map(p => ({
        pokemonId: p.pokemonId || '',
        nickname: p.nickname || null, // Use null instead of undefined
        level: p.level || 1,
        experience: p.experience || 0,
        mood: p.mood || 'neutral',
        unlockedAt: Timestamp.fromDate(p.unlockedAt || new Date()),
        lastInteraction: Timestamp.fromDate(p.lastInteraction || new Date())
      }));

      console.log('💾 Saving to Firestore:', firestoreData);

      const docRef = doc(db, 'userPokemon', user.uid);
      await setDoc(docRef, {
        pokemon: firestoreData,
        lastUpdated: new Date()
      });

      setUserPokemon(pokemon);
      console.log('✅ Successfully saved Pokemon to Firestore');
    } catch (err) {
      console.error('❌ Failed to save Pokemon:', err);
      setError('Failed to save Pokemon collection');
    }
  }, [user]);

  // Unlock a new Pokemon (deprecated - use saveUserPokemon directly)
  const unlockPokemon = useCallback(async (pokemonId: string, nickname?: string) => {
    if (!user) return;

    const newPokemon = pokemonService.createUserPokemon(pokemonId, nickname);
    const updated = [...userPokemon, newPokemon];
    await saveUserPokemon(updated);
  }, [user, userPokemon, saveUserPokemon]);

  // Get Pokemon by ID from user's collection
  const getUserPokemonById = useCallback((pokemonId: string) => {
    return userPokemon.find(p => p.pokemonId === pokemonId);
  }, [userPokemon]);

  // Get all available Pokemon
  const getAllPokemon = useCallback(() => {
    return pokemonService.getAllPokemon();
  }, []);

  // Get stage 1 Pokemon for selection
  const getStage1Pokemon = useCallback(() => {
    return pokemonService.getStage1Pokemon();
  }, []);

  // Get starter Pokemon (for backward compatibility)
  const getStarterPokemon = useCallback(() => {
    return pokemonService.getStage1Pokemon();
  }, []);

  // Get popular stage 1 Pokemon for initial selection
  const getPopularStage1Pokemon = useCallback(() => {
    return pokemonService.getPopularStage1Pokemon();
  }, []);

  // Search Pokemon
  const searchPokemon = useCallback((query: string) => {
    return pokemonService.searchPokemon(query);
  }, []);

  // Get Pokemon for mood
  const getPokemonForMood = useCallback((mood: string) => {
    return pokemonService.getPokemonForMood(mood);
  }, []);

  // Update Pokemon mood
  const updatePokemonMood = useCallback(async (pokemonId: string, mood: string) => {
    const index = userPokemon.findIndex(p => p.pokemonId === pokemonId);
    if (index === -1) return;

    const updated = [...userPokemon];
    updated[index] = {
      ...updated[index],
      mood: mood as 'happy' | 'neutral' | 'sad' | 'excited' | 'calm',
      lastInteraction: new Date()
    };
    await saveUserPokemon(updated);
  }, [userPokemon, saveUserPokemon]);

  // Award experience to Pokemon
  const awardExperience = useCallback(async (pokemonId: string, points: number) => {
    const index = userPokemon.findIndex(p => p.pokemonId === pokemonId);
    if (index === -1) return;

    const updated = [...userPokemon];
    const pokemon = updated[index];
    pokemon.experience += points;

    // Level up if needed (simple calculation)
    const newLevel = Math.floor(pokemon.experience / 100) + 1;
    if (newLevel > pokemon.level) {
      pokemon.level = newLevel;
    }

    pokemon.lastInteraction = new Date();
    await saveUserPokemon(updated);
  }, [userPokemon, saveUserPokemon]);

  useEffect(() => {
    loadUserPokemon();
  }, [loadUserPokemon]);

  return {
    userPokemon,
    loading,
    error,
    unlockPokemon,
    saveUserPokemon,
    getUserPokemonById,
    getAllPokemon,
    getStage1Pokemon,
    getPopularStage1Pokemon,
    getStarterPokemon,
    searchPokemon,
    getPokemonForMood,
    updatePokemonMood,
    awardExperience,
    loadUserPokemon
  };
};

// Additional hooks for backward compatibility
export const usePokemonMood = () => {
  const { updatePokemonMood } = usePokemon();

  const syncWithUserMood = useCallback(async (mood: string) => {
    // Update all user's Pokemon based on their current mood
    // This is a simplified version - in a real app you'd get all user Pokemon
    console.log('Syncing mood:', mood);
  }, []);

  return {
    syncWithUserMood
  };
};

export const usePokemonRewards = () => {
  const { awardExperience } = usePokemon();

  const rewardForActivity = useCallback(async (activity: string, pokemonId?: string) => {
    if (pokemonId) {
      await awardExperience(pokemonId, 25); // Default reward points
    }
  }, [awardExperience]);

  return {
    rewardForActivity
  };
};