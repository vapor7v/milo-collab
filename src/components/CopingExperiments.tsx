import { useState } from 'react';
import { useCopingExperiments, CopingExperiment } from '@/hooks/useCopingExperiments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  TestTube,
  Plus,
  CheckCircle,
  Clock,
  Star,
  TrendingUp,
  Lightbulb,
  Target,
  Play,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

export const CopingExperiments = () => {
  const {
    activeExperiments,
    completedExperiments,
    experimentInsights,
    loading,
    generateExperiment,
    completeExperiment,
    getExperimentStats
  } = useCopingExperiments();

  const [selectedExperiment, setSelectedExperiment] = useState<CopingExperiment | null>(null);
  const [completionDialog, setCompletionDialog] = useState(false);
  const [experimentRating, setExperimentRating] = useState(3);
  const [effectiveness, setEffectiveness] = useState<'very_helpful' | 'somewhat_helpful' | 'neutral' | 'not_helpful' | 'made_worse'>('somewhat_helpful');
  const [moodBefore, setMoodBefore] = useState(5);
  const [moodAfter, setMoodAfter] = useState(5);
  const [stressBefore, setStressBefore] = useState(5);
  const [stressAfter, setStressAfter] = useState(5);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const stats = getExperimentStats();

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'mindfulness': return '🧘‍♀️';
      case 'social': return '👥';
      case 'physical': return '🏃‍♀️';
      case 'cognitive': return '🧠';
      case 'emotional': return '❤️';
      default: return '🧪';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateExperiment = async () => {
    const experiment = await generateExperiment();
    if (experiment) {
      toast.success('New coping experiment generated!');
    } else {
      toast.error('Failed to generate experiment');
    }
  };

  const handleStartCompletion = (experiment: CopingExperiment) => {
    setSelectedExperiment(experiment);
    setCompletionDialog(true);
  };

  const handleCompleteExperiment = async () => {
    if (!selectedExperiment) return;

    const success = await completeExperiment(
      selectedExperiment.id,
      experimentRating,
      effectiveness,
      moodBefore,
      moodAfter,
      stressBefore,
      stressAfter,
      outcomeNotes
    );

    if (success) {
      toast.success('Experiment completed! Check your insights for personalized recommendations.');
      setCompletionDialog(false);
      setSelectedExperiment(null);
      setOutcomeNotes('');
    } else {
      toast.error('Failed to complete experiment');
    }
  };

  return (
    <Card className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-full">
            <TestTube className="h-6 w-6" />
          </div>
          <span>Coping Experiments</span>
          <Lightbulb className="h-5 w-5 animate-pulse" />
        </CardTitle>
        <p className="text-emerald-100 text-sm">
          AI-powered behavioral experiments to discover what works for you 🧪✨
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.totalCompleted}</div>
            <div className="text-sm text-emerald-700">Experiments Completed</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600">{stats.averageRating}</div>
            <div className="text-sm text-emerald-700">Average Rating</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-600 capitalize">{stats.mostEffectiveCategory}</div>
            <div className="text-sm text-emerald-700">Top Category</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm text-center">
            <Button
              onClick={handleGenerateExperiment}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Active Experiments */}
        {activeExperiments.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-600" />
              Active Experiments
            </h3>
            <div className="space-y-3">
              {activeExperiments.map((experiment) => (
                <div key={experiment.id} className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getCategoryIcon(experiment.category)}</span>
                        <h4 className="font-semibold text-gray-900">{experiment.title}</h4>
                        <Badge className={getDifficultyColor(experiment.difficulty)}>
                          {experiment.difficulty}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{experiment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {experiment.duration} min
                        </span>
                        <span className="flex items-center gap-1">
                          <Target className="h-4 w-4" />
                          {experiment.expectedOutcome}
                        </span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleStartCompletion(experiment)}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Complete
                    </Button>
                  </div>

                  <div className="bg-emerald-50 rounded-lg p-3">
                    <h5 className="font-medium text-emerald-900 mb-2">Instructions:</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-800">
                      {experiment.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Experiment Insights */}
        {experimentInsights.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              Your Experiment Insights
            </h3>
            <div className="space-y-3">
              {experimentInsights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900 mb-2">{insight.insight}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {insight.category}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed Experiments */}
        {completedExperiments.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              Recent Experiments
            </h3>
            <div className="space-y-3">
              {completedExperiments.slice(0, 3).map((experiment) => (
                <div key={experiment.id} className="bg-white rounded-lg p-4 border border-emerald-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(experiment.category)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{experiment.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < (experiment.userRating || 0)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {experiment.completedAt?.toDate().toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {experiment.outcomeNotes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">"{experiment.outcomeNotes}"</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {activeExperiments.length === 0 && completedExperiments.length === 0 && (
          <div className="text-center py-12">
            <TestTube className="h-16 w-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your First Experiment</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Discover personalized coping strategies through AI-powered behavioral experiments.
              Each experiment helps you learn what works best for your mental wellness.
            </p>
            <Button
              onClick={handleGenerateExperiment}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Generate First Experiment
            </Button>
          </div>
        )}

        {/* Completion Dialog */}
        <Dialog open={completionDialog} onOpenChange={setCompletionDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Complete Experiment: {selectedExperiment?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mood Before (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodBefore}
                    onChange={(e) => setMoodBefore(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{moodBefore}/10</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Mood After (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={moodAfter}
                    onChange={(e) => setMoodAfter(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{moodAfter}/10</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stress Before (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressBefore}
                    onChange={(e) => setStressBefore(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{stressBefore}/10</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Stress After (1-10)</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={stressAfter}
                    onChange={(e) => setStressAfter(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-sm text-gray-600">{stressAfter}/10</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setExperimentRating(star)}
                      className="text-2xl"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= experimentRating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">How effective was this experiment?</label>
                <select
                  value={effectiveness}
                  onChange={(e) => setEffectiveness(e.target.value as typeof effectiveness)}
                  className="w-full p-2 border rounded"
                >
                  <option value="very_helpful">Very Helpful</option>
                  <option value="somewhat_helpful">Somewhat Helpful</option>
                  <option value="neutral">Neutral</option>
                  <option value="not_helpful">Not Helpful</option>
                  <option value="made_worse">Made Things Worse</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <Textarea
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="What did you learn? How did you feel?"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleCompleteExperiment} className="flex-1">
                  Complete Experiment
                </Button>
                <Button variant="outline" onClick={() => setCompletionDialog(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};