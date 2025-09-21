import { useGamification } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

export const Leaderboard = () => {
  const { stats } = useGamification();

  if (!stats) return null;

  // Mock leaderboard data - in a real app, this would come from a backend
  const mockLeaderboard = [
    { rank: 1, name: 'WellnessWarrior', xp: 2500, level: 15, avatar: '👑' },
    { rank: 2, name: 'MindfulMaster', xp: 2200, level: 13, avatar: '🧘' },
    { rank: 3, name: 'ZenSeeker', xp: 2100, level: 12, avatar: '🌸' },
    { rank: 4, name: 'CalmChampion', xp: 1900, level: 11, avatar: '🏆' },
    { rank: 5, name: 'You', xp: stats.xp, level: stats.level, avatar: '⭐', isCurrentUser: true },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Trophy className="h-6 w-6 text-yellow-600" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-200 ${
                entry.isCurrentUser
                  ? 'bg-blue-100 border-2 border-blue-300 shadow-md'
                  : 'bg-white border border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(entry.rank)}
              </div>

              <div className="text-2xl">{entry.avatar}</div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${entry.isCurrentUser ? 'text-blue-700' : 'text-gray-900'}`}>
                    {entry.name}
                  </span>
                  {entry.isCurrentUser && (
                    <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                      You
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  Level {entry.level} • {entry.xp} XP
                </div>
              </div>

              {entry.rank <= 3 && (
                <div className="text-yellow-500">
                  {entry.rank === 1 && '🥇'}
                  {entry.rank === 2 && '🥈'}
                  {entry.rank === 3 && '🥉'}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border border-purple-200">
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="font-semibold text-purple-900 mb-1">
              Keep Climbing!
            </h3>
            <p className="text-sm text-purple-700">
              Complete more tasks to climb the leaderboard and unlock exclusive rewards!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};