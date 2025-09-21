import React, { useState, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Save, History } from 'lucide-react';
import { toast } from 'sonner';
import { Layout, Container } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UserStats } from '@/components/UserStats';
import { WellnessGroups as SquadSupport } from '@/components/WellnessGroups';
import { AchievementNotification } from '@/components/AchievementNotification';
import JournalEntryModal from '@/components/JournalEntryModal';
import MeditationModal from '@/components/MeditationModal';
import CrisisSupport from '@/components/CrisisSupport';
import { useTasks } from '@/hooks/useTasks';
import { useDailyChallenges } from '@/hooks/useDailyChallenges';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Circle, Calendar, MessageCircle, Target, Sparkles, LogOut } from 'lucide-react';
import { db, auth } from '@/integrations/firebase/client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';
import { signOut } from 'firebase/auth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: userData } = useUserData();
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isMeditationModalOpen, setIsMeditationModalOpen] = useState(false);
  const [journalEntry, setJournalEntry] = useState('');
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const {
    tasks,
    loading: tasksLoading,
    toggleTaskCompletion,
    regenerateAITasks,
    getCompletedCount: getTasksCompletedCount,
    getTotalCount: getTasksTotalCount,
    getCompletionPercentage: getTasksCompletionPercentage,
    lastAchievement,
    clearAchievement
  } = useTasks();

  const {
    challenges,
    loading: challengesLoading,
    markJournalCompleted,
    getCompletedCount: getChallengesCompletedCount,
    getTotalCount: getChallengesTotalCount,
    getCompletionPercentage: getChallengesCompletionPercentage
  } = useDailyChallenges();

  // Combined progress calculations including both AI tasks and daily challenges
  const completedCount = useMemo(() => {
    return getTasksCompletedCount() + getChallengesCompletedCount();
  }, [tasks, challenges]);

  const totalCount = useMemo(() => {
    return getTasksTotalCount() + getChallengesTotalCount();
  }, [tasks, challenges]);

  const completionPercentage = useMemo(() => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }, [completedCount, totalCount]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleSaveJournal = async () => {
    if (!journalEntry.trim() || !user) return;

    try {
      setIsSavingJournal(true);
      toast.info("Analyzing your mood...");

      let detectedMood = 'neutral';

      // Analyze mood using AI with fallback
      const genAI = getGenerativeAIService();
      if (genAI) {
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
          const prompt = `
            Analyze the following journal entry and determine the person's mood/emotional state.
            Look for keywords and context that indicate emotions like happy, sad, excited, anxious, calm, stressed, angry, tired, etc.

            Journal entry: "${journalEntry}"

            Respond with ONLY one word that best describes the mood. Choose from: happy, sad, excited, anxious, calm, stressed, angry, tired, neutral, excellent, good.

            If you cannot determine a clear mood, respond with "neutral".
          `;

          const result = await model.generateContent(prompt);
          const response = await result.response;
          const aiMood = response.text().trim().toLowerCase();

          // Validate that the response is one of our expected moods
          const validMoods = ['happy', 'sad', 'excited', 'anxious', 'calm', 'stressed', 'angry', 'tired', 'neutral', 'excellent', 'good'];
          detectedMood = validMoods.includes(aiMood) ? aiMood : 'neutral';
        } catch (aiError) {
          console.warn('AI mood analysis failed, using fallback:', aiError);
          // Simple fallback mood detection based on keywords
          detectedMood = detectMoodFromText(journalEntry);
        }
      } else {
        console.warn('AI service not available, using fallback mood detection');
        detectedMood = detectMoodFromText(journalEntry);
      }

      // Save journal entry
      await addDoc(collection(db, 'journal_entries'), {
        entry: journalEntry.trim(),
        mood: detectedMood,
        userId: user.uid,
        createdAt: Timestamp.now()
      });

      toast.success(`Journal entry saved! Detected mood: ${detectedMood}`);
      setJournalEntry('');

      // Mark journal challenge as completed
      await markJournalCompleted();

    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setIsSavingJournal(false);
    }
  };

  // Simple mood detection fallback function
  const detectMoodFromText = (text: string): string => {
    const lowerText = text.toLowerCase();

    // Positive keywords
    const positiveWords = ['happy', 'great', 'excellent', 'good', 'amazing', 'wonderful', 'excited', 'joy', 'love', 'awesome', 'fantastic', 'brilliant', 'perfect', 'thrilled', 'delighted', 'pleased', 'content', 'satisfied', 'grateful', 'blessed', 'proud', 'accomplished', 'successful', 'victorious', 'triumphant', 'cheerful', 'optimistic', 'hopeful', 'confident', 'motivated', 'inspired', 'energized', 'refreshed', 'relaxed', 'peaceful', 'calm', 'serene', 'tranquil'];

    // Negative keywords
    const negativeWords = ['sad', 'depressed', 'angry', 'frustrated', 'annoyed', 'irritated', 'upset', 'disappointed', 'worried', 'anxious', 'stressed', 'overwhelmed', 'exhausted', 'tired', 'fatigued', 'drained', 'burnt out', 'hopeless', 'helpless', 'worthless', 'guilty', 'ashamed', 'regretful', 'lonely', 'isolated', 'rejected', 'abandoned', 'betrayed', 'hurt', 'pain', 'suffering', 'struggling', 'difficult', 'hard', 'challenging', 'terrible', 'awful', 'horrible', 'bad', 'worst'];

    // Anxious/stressed keywords
    const anxiousWords = ['anxious', 'worried', 'nervous', 'scared', 'fear', 'panic', 'overwhelmed', 'stressed', 'pressure', 'deadline', 'rushed', 'hectic', 'chaotic', 'unsettled', 'restless', 'uneasy', 'apprehensive', 'dread', 'foreboding'];

    // Count occurrences
    let positiveCount = 0;
    let negativeCount = 0;
    let anxiousCount = 0;

    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) positiveCount += matches.length;
    });

    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) negativeCount += matches.length;
    });

    anxiousWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) anxiousCount += matches.length;
    });

    // Determine mood based on counts
    if (positiveCount > negativeCount && positiveCount > anxiousCount) {
      return positiveCount > 2 ? 'excellent' : 'good';
    } else if (negativeCount > positiveCount && negativeCount > anxiousCount) {
      return negativeCount > 2 ? 'sad' : 'neutral';
    } else if (anxiousCount > positiveCount && anxiousCount > negativeCount) {
      return anxiousCount > 2 ? 'anxious' : 'stressed';
    } else if (lowerText.includes('tired') || lowerText.includes('exhausted') || lowerText.includes('sleep')) {
      return 'tired';
    } else if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('annoyed')) {
      return 'angry';
    } else if (lowerText.includes('excited') || lowerText.includes('thrilled') || lowerText.includes('proud')) {
      return 'excited';
    }

    return 'neutral';
  };

  return (
    <Layout background="gradient">
      <Container className="py-8 space-y-8">
        {/* Welcome Header */}
        <div className="text-center space-y-6">
          {/* Prominent Greeting */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-2xl relative">
            <Button
              onClick={handleLogout}
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            <h1 className="text-5xl font-bold mb-2">
              {greeting()}, {userData?.name || user?.displayName}! 🌟
            </h1>
            <p className="text-xl opacity-90 flex items-center justify-center gap-2">
              <Calendar className="h-6 w-6" />
              {today}
            </p>
            <div className="mt-4 text-lg opacity-80">
              Ready to continue your wellness journey today?
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{completedCount}</div>
                <div className="text-sm text-blue-700">Tasks Completed</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{completionPercentage}%</div>
                <div className="text-sm text-green-700">Daily Progress</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalCount}</div>
                <div className="text-sm text-purple-700">Total Tasks</div>
              </CardContent>
            </Card>
          </div>
        </div>

          {/* Main Feature Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={() => navigate('/aichat')}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              💬 Chat with Milo
            </Button>
            <Button
              onClick={() => navigate('/mood-calendar')}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              📅 Mood Calendar
            </Button>
            <Button
              onClick={() => navigate('/pokemon')}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              🏆 Pokemon Collection
            </Button>
          </div>
  
          {/* Crisis Support - Only shows for high-risk users */}
          <CrisisSupport />
  
          {/* Mandatory Challenge Section */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-600" />
                Daily Wellness Challenges
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Sparkles className="h-4 w-4" />
                Mandatory Tasks
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Meditation Challenge */}
              <Card className="bg-white/70 border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      🧘
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">5-Min Meditation</h3>
                      <p className="text-sm text-blue-700">Focus and relax</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/meditation-challenge')}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Start Challenge
                  </Button>
                </CardContent>
              </Card>


              {/* Journal Entry */}
              <Card className="bg-white/70 border border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      📝
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900">Daily Journal</h3>
                      <p className="text-sm text-blue-700">Reflect and process</p>
                    </div>
                  </div>

                  {/* Inline Journal Entry */}
                  <div className="space-y-3">
                    <Textarea
                      value={journalEntry}
                      onChange={(e) => setJournalEntry(e.target.value)}
                      placeholder="How are you feeling today? What's on your mind?"
                      className="min-h-[80px] resize-none text-sm"
                      disabled={isSavingJournal}
                    />
                    <div className="text-xs text-gray-500">
                      💭 AI will analyze your mood from this entry
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveJournal}
                        disabled={!journalEntry.trim() || isSavingJournal}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        {isSavingJournal ? 'Saving...' : 'Save Entry'}
                      </Button>
                      <Button
                        onClick={() => navigate('/journal')}
                        variant="outline"
                        className="border-green-300 text-green-700 hover:bg-green-50 text-sm"
                      >
                        <History className="h-3 w-3 mr-1" />
                        History
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI-Generated Tasks Section */}
            <div className="mt-6 pt-6 border-t border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-900">Today's AI Wellness Tasks</h3>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={regenerateAITasks}
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    disabled={tasksLoading}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {tasksLoading ? 'Generating...' : 'Regenerate'}
                  </Button>
                  <div className="text-sm text-blue-700">
                    <Sparkles className="h-4 w-4 inline mr-1" />
                    Based on your chat & journal
                  </div>
                </div>
              </div>

              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center gap-3 p-3">
                      <div className="w-5 h-5 bg-blue-200 rounded"></div>
                      <div className="h-4 bg-blue-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-8 text-blue-700">
                  <Target className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <p className="mb-4">No AI tasks yet. Chat with Milo or write in your journal to generate personalized tasks!</p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/aichat')}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Milo
                    </Button>
                    <Button
                      onClick={() => navigate('/journal')}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      📝 Write Journal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-blue-700 mb-4">
                    <span>Task Progress</span>
                    <span className="font-semibold">{completedCount}/{totalCount} completed</span>
                  </div>
                  <Progress value={completionPercentage} className="h-3 bg-blue-100" />
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-4 rounded-lg bg-white/70 border border-blue-200 hover:bg-white/90 transition-colors shadow-sm"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTaskCompletion(task.id)}
                        className="p-0 h-6 w-6 hover:bg-blue-100"
                      >
                        {task.completed ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <Circle className="h-6 w-6 text-blue-400" />
                        )}
                      </Button>
                      <span className={`flex-1 text-blue-900 ${task.completed ? 'line-through text-blue-600' : ''}`}>
                        {task.title}
                      </span>
                      {task.completed && (
                        <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>


        {/* User Stats Section */}
        <UserStats />

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Squad Support - Takes full width on large screens */}
          <div className="lg:col-span-2">
            <SquadSupport />
          </div>


        </div>

        {/* Achievement Notification */}
        <AchievementNotification
          achievement={lastAchievement}
          onClose={clearAchievement}
        />

        {/* Meditation Modal */}
        <MeditationModal
          isOpen={isMeditationModalOpen}
          onClose={() => setIsMeditationModalOpen(false)}
        />

        {/* Journal Entry Modal */}
        <JournalEntryModal
          isOpen={isJournalModalOpen}
          onClose={() => setIsJournalModalOpen(false)}
        />
      </Container>
    </Layout>
  );
}
