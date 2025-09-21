import { useGamification } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Check, Lock, Sparkles, Crown, Star } from 'lucide-react';
import { toast } from 'sonner';

export const RewardsShop = () => {
  const { stats, getRewards, purchaseReward } = useGamification();

  if (!stats) return null;

  const rewards = getRewards();

  const handlePurchase = async (rewardId: string) => {
    const success = await purchaseReward(rewardId);
    if (success) {
      toast.success('Reward purchased successfully! 🎉');
    } else {
      toast.error('Failed to purchase reward. Check your coin balance.');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Sparkles className="h-6 w-6" />
          </div>
          <span>Magical Rewards Shop</span>
        </CardTitle>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Coins className="h-5 w-5 text-yellow-300" />
            <span className="font-bold text-yellow-100">{stats.coins} coins</span>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
            <Star className="h-4 w-4 text-yellow-300" />
            <span className="text-sm text-yellow-100">Level {stats.level}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div
              key={reward.id}
              className={`relative group p-5 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                reward.unlocked
                  ? 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-400 shadow-lg'
                  : stats.coins >= reward.cost
                  ? 'bg-gradient-to-br from-white to-blue-50 border-indigo-300 hover:border-indigo-400 cursor-pointer shadow-md hover:shadow-lg'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300 opacity-75'
              }`}
              onClick={() => !reward.unlocked && stats.coins >= reward.cost && handlePurchase(reward.id)}
            >
              {reward.unlocked && (
                <div className="absolute -top-2 -right-2 z-10">
                  <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              )}

              <div className="text-center space-y-3">
                <div className="text-5xl mb-2">{reward.icon}</div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{reward.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{reward.description}</p>
                </div>

                <div className="flex items-center justify-center gap-2 py-2">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    reward.unlocked
                      ? 'bg-green-200 text-green-800'
                      : stats.coins >= reward.cost
                      ? 'bg-yellow-200 text-yellow-800'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    <Coins className="h-4 w-4" />
                    <span>{reward.cost}</span>
                  </div>
                </div>

                {!reward.unlocked && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePurchase(reward.id);
                    }}
                    disabled={stats.coins < reward.cost}
                    className={`w-full font-semibold transition-all duration-200 ${
                      stats.coins >= reward.cost
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    }`}
                  >
                    {stats.coins < reward.cost ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Need {reward.cost - stats.coins} more coins
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Purchase
                      </>
                    )}
                  </Button>
                )}

                {reward.unlocked && (
                  <div className="text-center py-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-200 text-green-800 rounded-full text-sm font-medium">
                      <Check className="w-3 h-3" />
                      Unlocked!
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {rewards.every(r => r.unlocked) && (
          <div className="text-center py-8 mt-6">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Master Collector! 🎉
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              You've unlocked every magical reward! Keep completing tasks to earn more coins for future treasures.
            </p>
            <div className="mt-4">
              <Crown className="inline-block w-8 h-8 text-yellow-500 animate-pulse" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};