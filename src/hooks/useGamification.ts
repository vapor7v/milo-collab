import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/integrations/firebase/client';
import { doc, setDoc, getDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import pokemonData from '@/data/pokemon_trimmed.json';

export interface UserStats {
  userId: string;
  xp: number;
  coins: number;
  health: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastTaskCompleted?: Timestamp;
  avatar: string;
  unlockedRewards: string[];
  badges: string[];
  achievements: Achievement[];
  totalTasksCompleted: number;
  weeklyTasksCompleted: number;
  monthlyTasksCompleted: number;
  lastWeeklyReset: Timestamp;
  lastMonthlyReset: Timestamp;
  chosenPokemon?: string; // The Pokemon the user chose at start
  pokemonEvolution?: number; // Evolution stage (0 = base, 1 = first evolution, 2 = final)
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Timestamp;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'avatar' | 'feature' | 'item';
  cost: number;
  icon: string;
  unlocked: boolean;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatar: string;
  xp: number;
  level: number;
  currentStreak: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  leaderId: string;
  totalXP: number;
  createdAt: Timestamp;
}

export interface TeamMember {
  userId: string;
  displayName: string;
  avatar: string;
  joinedAt: Timestamp;
  contributionXP: number;
}

const XP_PER_TASK = 10;
const COINS_PER_TASK = 5;
const HEALTH_LOSS_PER_MISS = 10;
const MAX_HEALTH = 100;
const XP_PER_LEVEL = 100;

const ACHIEVEMENTS = [
  {
    id: 'first_task',
    title: 'Getting Started',
    description: 'Complete your first task',
    icon: '🎯',
    rarity: 'common' as const,
  },
  {
    id: 'streak_3',
    title: 'Consistency Beginner',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    rarity: 'common' as const,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    rarity: 'rare' as const,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    rarity: 'epic' as const,
  },
  {
    id: 'level_10',
    title: 'Rising Star',
    description: 'Reach level 10',
    icon: '⭐',
    rarity: 'rare' as const,
  },
  {
    id: 'tasks_100',
    title: 'Century Club',
    description: 'Complete 100 tasks',
    icon: '💯',
    rarity: 'epic' as const,
  },
];

export const useGamification = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUserStats = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);
      const statsRef = doc(db, 'user_stats', user.uid);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        const data = statsSnap.data() as UserStats;
        setStats(data);
      } else {
        // Initialize new user stats
        const initialStats: UserStats = {
          userId: user.uid,
          xp: 0,
          coins: 50, // Starting bonus
          health: MAX_HEALTH,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          avatar: 'default',
          unlockedRewards: [],
          badges: [],
          achievements: [],
          totalTasksCompleted: 0,
          weeklyTasksCompleted: 0,
          monthlyTasksCompleted: 0,
          lastWeeklyReset: Timestamp.now(),
          lastMonthlyReset: Timestamp.now(),
          pokemonEvolution: 0,
        };
        await setDoc(statsRef, initialStats);
        setStats(initialStats);
      }
    } catch (err) {
      console.error('Error loading user stats:', err);
      setError('Failed to load user stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserStats();
    } else {
      setStats(null);
    }
  }, [user]);

  const awardTaskCompletion = async () => {
    if (!user?.uid || !stats) return;

    try {
      const statsRef = doc(db, 'user_stats', user.uid);
      const newXP = stats.xp + XP_PER_TASK;
      const newCoins = stats.coins + COINS_PER_TASK;
      const newLevel = Math.floor(newXP / XP_PER_LEVEL) + 1;
      const leveledUp = newLevel > stats.level;

      const now = Timestamp.now();
      const lastCompleted = stats.lastTaskCompleted;
      let newStreak = stats.currentStreak;
      let newLongestStreak = stats.longestStreak;

      // Calculate streak
      if (lastCompleted) {
        const lastDate = lastCompleted.toDate();
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate.toDateString() === yesterday.toDateString()) {
          newStreak = stats.currentStreak + 1;
          if (newStreak > newLongestStreak) {
            newLongestStreak = newStreak;
          }
        } else if (lastDate.toDateString() !== today.toDateString()) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }

      // Handle Pokemon evolution
      let newPokemonEvolution = stats.pokemonEvolution || 0;
      if (stats.chosenPokemon && newLevel > stats.level) {
        // Check if Pokemon should evolve based on new level
        if ((newLevel >= 5 && newPokemonEvolution < 1) ||
            (newLevel >= 10 && newPokemonEvolution < 2)) {
          newPokemonEvolution = newLevel >= 10 ? 2 : 1;
        }
      }

      const newAchievements = checkForAchievements(stats, newXP, newLevel, newStreak, stats.totalTasksCompleted + 1);

      const updatedStats: Partial<UserStats> = {
        xp: newXP,
        coins: newCoins,
        level: newLevel,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastTaskCompleted: now,
        achievements: [...stats.achievements, ...newAchievements],
        pokemonEvolution: newPokemonEvolution,
      };

      await updateDoc(statsRef, {
        ...updatedStats,
        totalTasksCompleted: increment(1),
        weeklyTasksCompleted: increment(1),
        monthlyTasksCompleted: increment(1),
      });

      // Update local state
      setStats(prev => prev ? {
        ...prev,
        ...updatedStats,
        totalTasksCompleted: prev.totalTasksCompleted + 1,
        weeklyTasksCompleted: prev.weeklyTasksCompleted + 1,
        monthlyTasksCompleted: prev.monthlyTasksCompleted + 1,
        achievements: [...prev.achievements, ...newAchievements],
      } : null);

      return {
        xpGained: XP_PER_TASK,
        coinsGained: COINS_PER_TASK,
        leveledUp,
        newAchievements,
      };
    } catch (err) {
      console.error('Error awarding task completion:', err);
      setError('Failed to award task completion');
    }
  };

  const penalizeTaskMiss = async () => {
    if (!user?.uid || !stats) return;

    try {
      const statsRef = doc(db, 'user_stats', user.uid);
      const newHealth = Math.max(0, stats.health - HEALTH_LOSS_PER_MISS);
      const newStreak = 0; // Reset streak on miss

      await updateDoc(statsRef, {
        health: newHealth,
        currentStreak: newStreak,
      });

      setStats(prev => prev ? {
        ...prev,
        health: newHealth,
        currentStreak: newStreak,
      } : null);

      return {
        healthLost: HEALTH_LOSS_PER_MISS,
        streakReset: true,
      };
    } catch (err) {
      console.error('Error penalizing task miss:', err);
      setError('Failed to penalize task miss');
    }
  };

  const checkForAchievements = (
    currentStats: UserStats,
    newXP: number,
    newLevel: number,
    newStreak: number,
    totalTasks: number
  ): Achievement[] => {
    const newAchievements: Achievement[] = [];

    ACHIEVEMENTS.forEach(achievement => {
      const alreadyUnlocked = currentStats.achievements.some(a => a.id === achievement.id);

      if (!alreadyUnlocked) {
        let shouldUnlock = false;

        switch (achievement.id) {
          case 'first_task':
            shouldUnlock = totalTasks >= 1;
            break;
          case 'streak_3':
            shouldUnlock = newStreak >= 3;
            break;
          case 'streak_7':
            shouldUnlock = newStreak >= 7;
            break;
          case 'streak_30':
            shouldUnlock = newStreak >= 30;
            break;
          case 'level_10':
            shouldUnlock = newLevel >= 10;
            break;
          case 'tasks_100':
            shouldUnlock = totalTasks >= 100;
            break;
        }

        if (shouldUnlock) {
          newAchievements.push({
            ...achievement,
            unlockedAt: Timestamp.now(),
          });
        }
      }
    });

    return newAchievements;
  };

  const getLeaderboard = async (_limit = 50): Promise<LeaderboardEntry[]> => {
    // This would require a cloud function or aggregation query
    // For now, return empty array
    return [];
  };

  const getRewards = (): Reward[] => {
    const currentLevel = stats?.level || 1;

    return [
      // Pokemon-like avatars that evolve with level
      {
        id: 'charmander',
        name: 'Charmander',
        description: currentLevel >= 5 ? 'Evolves to Charmeleon at level 5!' : 'A fire-type starter Pokemon',
        type: 'avatar',
        cost: 50,
        icon: currentLevel >= 5 ? '🦎' : '🐉',
        unlocked: stats?.unlockedRewards.includes('charmander') || false,
      },
      {
        id: 'squirtle',
        name: 'Squirtle',
        description: currentLevel >= 5 ? 'Evolves to Wartortle at level 5!' : 'A water-type starter Pokemon',
        type: 'avatar',
        cost: 50,
        icon: currentLevel >= 5 ? '🐢' : '🐢',
        unlocked: stats?.unlockedRewards.includes('squirtle') || false,
      },
      {
        id: 'bulbasaur',
        name: 'Bulbasaur',
        description: currentLevel >= 5 ? 'Evolves to Ivysaur at level 5!' : 'A grass-type starter Pokemon',
        type: 'avatar',
        cost: 50,
        icon: currentLevel >= 5 ? '🦎' : '🦎',
        unlocked: stats?.unlockedRewards.includes('bulbasaur') || false,
      },
      {
        id: 'pikachu',
        name: 'Pikachu',
        description: 'The electric mouse Pokemon - always energetic!',
        type: 'avatar',
        cost: 75,
        icon: '⚡',
        unlocked: stats?.unlockedRewards.includes('pikachu') || false,
      },
      {
        id: 'eevee',
        name: 'Eevee',
        description: currentLevel >= 10 ? 'Can evolve into 8 different forms!' : 'The evolution Pokemon',
        type: 'avatar',
        cost: 100,
        icon: '🦊',
        unlocked: stats?.unlockedRewards.includes('eevee') || false,
      },
      {
        id: 'mewtwo',
        name: 'Mewtwo',
        description: 'The legendary psychic Pokemon - only for masters!',
        type: 'avatar',
        cost: 500,
        icon: '👾',
        unlocked: stats?.unlockedRewards.includes('mewtwo') || false,
      },

      // Wellness-themed rewards
      {
        id: 'meditation_boost',
        name: 'Meditation Power-Up',
        description: 'Doubles XP from meditation sessions for 24 hours',
        type: 'feature',
        cost: 150,
        icon: '🧘‍♀️',
        unlocked: stats?.unlockedRewards.includes('meditation_boost') || false,
      },
      {
        id: 'extra_coins',
        name: 'Coin Boost',
        description: 'Earn 50 bonus coins instantly',
        type: 'feature',
        cost: 100,
        icon: '💰',
        unlocked: stats?.unlockedRewards.includes('extra_coins') || false,
      },
      {
        id: 'health_boost',
        name: 'Health Recovery',
        description: 'Restore 25 health points instantly',
        type: 'feature',
        cost: 150,
        icon: '❤️',
        unlocked: stats?.unlockedRewards.includes('health_boost') || false,
      },
      {
        id: 'motivation_pack',
        name: 'Motivation Pack',
        description: 'Unlock custom motivational quotes and wallpapers',
        type: 'feature',
        cost: 120,
        icon: '💪',
        unlocked: stats?.unlockedRewards.includes('motivation_pack') || false,
      },
      {
        id: 'zen_garden',
        name: 'Digital Zen Garden',
        description: 'Access to virtual zen garden for stress relief',
        type: 'feature',
        cost: 180,
        icon: '🌸',
        unlocked: stats?.unlockedRewards.includes('zen_garden') || false,
      },
      {
        id: 'achievement_showcase',
        name: 'Achievement Showcase',
        description: 'Display your achievements on your profile',
        type: 'feature',
        cost: 250,
        icon: '🏆',
        unlocked: stats?.unlockedRewards.includes('achievement_showcase') || false,
      },
    ];
  };

  const choosePokemon = async (pokemonId: string) => {
    if (!user?.uid || !stats) return false;

    try {
      const statsRef = doc(db, 'user_stats', user.uid);
      await updateDoc(statsRef, {
        chosenPokemon: pokemonId,
        pokemonEvolution: 0, // Start at base form
      });

      setStats(prev => prev ? {
        ...prev,
        chosenPokemon: pokemonId,
        pokemonEvolution: 0,
      } : null);

      return true;
    } catch (err) {
      console.error('Error choosing Pokemon:', err);
      return false;
    }
  };

  const getPokemonDisplay = () => {
    if (!stats?.chosenPokemon) return 'default';

    const pokemon = stats.chosenPokemon;
    const _evolution = stats.pokemonEvolution || 0; // Prefix with underscore to indicate intentionally unused

    // Evolution logic based on level
    const level = stats.level;

    switch (pokemon) {
      case 'charmander':
        if (level >= 10) return 'charizard'; // Final evolution
        if (level >= 5) return 'charmeleon'; // First evolution
        return 'charmander'; // Base
      case 'squirtle':
        if (level >= 10) return 'blastoise'; // Final evolution
        if (level >= 5) return 'wartortle'; // First evolution
        return 'squirtle'; // Base
      case 'bulbasaur':
        if (level >= 10) return 'venusaur'; // Final evolution
        if (level >= 5) return 'ivysaur'; // First evolution
        return 'bulbasaur'; // Base
      case 'pikachu':
        if (level >= 15) return 'raichu'; // Evolution
        return 'pikachu'; // Base
      case 'eevee':
        if (level >= 15) return 'vaporeon'; // Can evolve into different forms
        return 'eevee'; // Base
      default:
        return pokemon;
    }
  };

  const getPokemonEmoji = () => {
    if (!stats?.chosenPokemon) return '🎮';

    // Use the imported Pokemon data
    const pokemon = pokemonData.find((p) => p.id === stats.chosenPokemon);
    if (pokemon) {
      return pokemon.emoji;
    }

    // Fallback to old system if data loading fails
    const display = getPokemonDisplay();
    switch (display) {
      case 'charmander': return '🐉';
      case 'charmeleon': return '🦎';
      case 'charizard': return '🐲';
      case 'squirtle': return '🐢';
      case 'wartortle': return '🐢';
      case 'blastoise': return '🐢';
      case 'bulbasaur': return '🦎';
      case 'ivysaur': return '🦎';
      case 'venusaur': return '🦎';
      case 'pikachu': return '⚡';
      case 'raichu': return '⚡';
      case 'eevee': return '🦊';
      case 'vaporeon': return '🦊';
      default: return '🐾';
    }
  };

  const purchaseReward = async (rewardId: string) => {
    if (!user?.uid || !stats) return false;

    const rewards = getRewards();
    const reward = rewards.find(r => r.id === rewardId);

    if (!reward || stats.coins < reward.cost) return false;

    try {
      const statsRef = doc(db, 'user_stats', user.uid);
      await updateDoc(statsRef, {
        coins: increment(-reward.cost),
        unlockedRewards: [...stats.unlockedRewards, rewardId],
      });

      setStats(prev => prev ? {
        ...prev,
        coins: prev.coins - reward.cost,
        unlockedRewards: [...prev.unlockedRewards, rewardId],
      } : null);

      return true;
    } catch (err) {
      console.error('Error purchasing reward:', err);
      return false;
    }
  };

  return {
    stats,
    loading,
    error,
    awardTaskCompletion,
    penalizeTaskMiss,
    getLeaderboard,
    getRewards,
    purchaseReward,
    choosePokemon,
    getPokemonDisplay,
    getPokemonEmoji,
    refreshStats: loadUserStats,
  };
};