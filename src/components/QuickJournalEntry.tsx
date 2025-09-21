import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';
import { toast } from 'sonner';
import { BookOpen, Save, History } from 'lucide-react';

interface QuickJournalEntryProps {
  onClose?: () => void;
  onHistoryClick?: () => void;
}

export default function QuickJournalEntry({ onClose, onHistoryClick }: QuickJournalEntryProps) {
  const { user } = useAuth();
  const [entry, setEntry] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [analyzingMood, setAnalyzingMood] = useState(false);

  const analyzeMoodFromJournal = async (journalText: string): Promise<string> => {
    try {
      const genAI = getGenerativeAIService();
      if (!genAI) {
        console.warn('Generative AI service not available');
        return 'neutral';
      }
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
        Analyze the following journal entry and determine the person's mood/emotional state.
        Look for keywords and context that indicate emotions like happy, sad, excited, anxious, calm, stressed, angry, tired, etc.

        Journal entry: "${journalText}"

        Respond with ONLY one word that best describes the mood. Choose from: happy, sad, excited, anxious, calm, stressed, angry, tired, neutral, excellent, good.

        If you cannot determine a clear mood, respond with "neutral".
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const mood = response.text().trim().toLowerCase();

      // Validate that the response is one of our expected moods
      const validMoods = ['happy', 'sad', 'excited', 'anxious', 'calm', 'stressed', 'angry', 'tired', 'neutral', 'excellent', 'good'];
      return validMoods.includes(mood) ? mood : 'neutral';

    } catch (error) {
      console.error('Error analyzing mood:', error);
      return 'neutral'; // Fallback mood
    }
  };

  const handleSave = async () => {
    if (!entry.trim() || !user) return;

    try {
      setIsSaving(true);
      setAnalyzingMood(true);

      toast.info("Analyzing your mood...");

      // Analyze mood using AI
      const detectedMood = await analyzeMoodFromJournal(entry);

      // Save journal entry
      await addDoc(collection(db, 'journal_entries'), {
        entry: entry.trim(),
        mood: detectedMood,
        userId: user.uid,
        createdAt: Timestamp.now()
      });

      toast.success(`Journal entry saved! Detected mood: ${detectedMood}`);
      setEntry('');

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setIsSaving(false);
      setAnalyzingMood(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Quick Journal Entry
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How are you feeling today? What's on your mind?
          </label>
          <Textarea
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            placeholder="Write about your thoughts, feelings, or experiences today..."
            className="min-h-[120px] resize-none"
            disabled={isSaving}
          />
          <div className="text-xs text-gray-500 mt-1">
            💭 AI will analyze your mood from this entry
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          {onHistoryClick && (
            <Button
              onClick={onHistoryClick}
              variant="outline"
              disabled={isSaving}
            >
              <History className="h-4 w-4 mr-2" />
              View History
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={!entry.trim() || isSaving}
            className="bg-green-500 hover:bg-green-600"
          >
            <Save className="h-4 w-4 mr-2" />
            {analyzingMood ? 'Analyzing...' : isSaving ? 'Saving...' : 'Save Entry'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}