import { useGamification } from '@/hooks/useGamification';
import { usePokemon } from '@/hooks/usePokemon';
import { PokemonService } from '@/services/pokemonService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Trophy, Target } from 'lucide-react';

const pokemonService = PokemonService.getInstance();

export const UserStats = () => {
  const { stats, loading } = useGamification();
  const { userPokemon } = usePokemon();

  if (loading || !stats) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const xpForNextLevel = (stats.level * 100);
  const xpProgress = (stats.xp % 100);

  return (
    <Card className="card-game">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Your Gaming Stats
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pokemon Companions */}
        {userPokemon.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800 text-center">Your Pokemon Companions</h4>
            <div className="grid grid-cols-3 gap-2">
              {userPokemon.slice(0, 3).map((companion) => {
                const pokemon = pokemonService.getPokemonById(companion.pokemonId);
                if (!pokemon) return null;

                return (
                  <div key={companion.pokemonId} className="text-center p-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                    <div className="mb-1 flex justify-center">
                      <img
                        src={pokemon.image}
                        alt={pokemon.name}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'block';
                        }}
                      />
                      <div className="text-2xl hidden">{pokemon.emoji || '🎮'}</div>
                    </div>
                    <h5 className="text-xs font-semibold text-gray-900 truncate">
                      {pokemon.name}
                    </h5>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Badge variant="secondary" className="text-xs px-1 py-0">
                        Lv.{companion.level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center text-xs text-gray-500">
              🏆 Your Pokemon evolve as your mental health improves!
            </div>
          </div>
        )}

        {/* Level and XP */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="font-semibold">Level {stats.level}</span>
            </div>
            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium">
              {stats.xp} XP
            </span>
          </div>
          <Progress value={xpProgress} className="h-3" />
          <p className="text-sm text-gray-600">
            {xpForNextLevel - (stats.xp % 100)} XP to next level
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current Streak */}
          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            <Flame className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Streak</p>
              <p className="text-lg font-bold text-orange-900">{stats.currentStreak} days</p>
            </div>
          </div>

          {/* Tasks Completed */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
            <Target className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Tasks</p>
              <p className="text-lg font-bold text-green-900">{stats.totalTasksCompleted}</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {stats.achievements.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">Recent Achievements</h4>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.slice(-3).map((achievement) => (
                <span
                  key={achievement.id}
                  className="inline-flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
                >
                  <span className="text-lg">{achievement.icon}</span>
                  <span className="text-xs">{achievement.title}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Longest Streak */}
        {stats.longestStreak > 0 && (
          <div className="text-center p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700">🏆 Longest Streak</p>
            <p className="text-2xl font-bold text-purple-900">{stats.longestStreak} days</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};