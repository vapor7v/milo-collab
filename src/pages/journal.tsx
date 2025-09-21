import React, { useState, useEffect, useCallback } from "react";
import { db, auth, getGenerativeAIService } from "../integrations/firebase/client";
import {
  doc,
  deleteDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Layout, Container } from "@/components/Layout";
import { WellnessButton } from "@/components/WellnessButton";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NotebookPen } from "lucide-react";

// Define the shape of a journal entry, equivalent to the old JournalRow
export interface JournalRow {
  id?: string;
  entry: string;
  mood?: string;
  createdAt: Timestamp;
  userId: string;
}

// Helper function to get emoji for mood
const getMoodEmoji = (mood: string): string => {
  const moodEmojis: Record<string, string> = {
    excellent: '😊',
    good: '🙂',
    neutral: '😐',
    anxious: '😰',
    sad: '😢',
    angry: '😠',
    stressed: '😫',
    calm: '😌',
    excited: '🤩',
    tired: '😴',
    happy: '😊'
  };
  return moodEmojis[mood] || '😐';
};

export default function JournalPage() {
  const [history, setHistory] = useState<JournalRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState("");
  const [analyzingMood, setAnalyzingMood] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Always show full journal view with entry form and all entries
  console.log('Journal page loaded with URL:', window.location.href);
  console.log('Showing full journal view with entry form and all entries');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchJournals = useCallback(async () => {
    if (!userId) return;
    try {
      const q = query(collection(db, "journal_entries"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      const rows = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalRow));

      console.log('Fetching journal entries...');
      console.log('Total entries fetched:', rows.length);

      // Show all entries (no filtering)
      console.log('Showing all journal entries:');
      rows.forEach(row => {
        const entryDate = row.createdAt.toDate();
        console.log('Entry date:', entryDate, 'Entry content:', row.entry.substring(0, 50) + '...');
      });

      // Sort by creation date, newest first
      rows.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
      setHistory(rows);
    } catch (error) {
      console.error("Error fetching journals: ", error);
      toast.error("Failed to fetch journal entries.");
    }
  }, [userId]);


  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  // AI-powered mood analysis function
  const analyzeMoodFromJournal = async (journalText: string): Promise<string> => {
    try {
      const genAI = getGenerativeAIService();
      if (!genAI) {
        console.warn('Generative AI service not available');
        return 'neutral';
      }
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

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

  async function handleDelete(id: string) {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, "journal_entries", id));
      fetchJournals(); // Refresh the list
      toast.success("Journal entry deleted.");
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast.error("Failed to delete journal entry.");
    }
  }

  function startEdit(journal: JournalRow) {
    setEditingId(journal.id!);
    setEditingEntry(journal.entry);
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !userId) return;

    try {
      setAnalyzingMood(true);
      toast.info("Re-analyzing mood...");

      // Re-analyze mood using AI for the edited entry
      const detectedMood = await analyzeMoodFromJournal(editingEntry);

      await updateDoc(doc(db, "journal_entries", editingId), {
        entry: editingEntry,
        mood: detectedMood
      });

      setEditingId(null);
      setEditingEntry("");
      fetchJournals(); // Refresh the list
      toast.success(`Journal entry updated! Detected mood: ${detectedMood}`);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Failed to update journal entry.");
    } finally {
      setAnalyzingMood(false);
    }
  }

  if (!userId) {
    return (
        <Layout>
            <Container>
                <div className="text-center py-10">
                    <h1 className="text-xl font-semibold">Please log in to see your journal.</h1>
                </div>
            </Container>
        </Layout>
    );
  }

  return (
    <Layout>
        <Container className="max-w-3xl py-8">
            <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold">
                    All Journal Entries
                  </h3>
                  <div className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    📝 Full Journal View
                  </div>
                </div>
                <div className="space-y-6">
                    {history.length === 0 ? (
                        <Card className="p-8 text-center">
                            <div className="space-y-4">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center">
                                    <NotebookPen className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200 mb-2">
                                        No Journal Entries Yet
                                    </h3>
                                    <p className="text-muted-foreground dark:text-slate-400 mb-4">
                                        Start your first journal entry to begin tracking your thoughts and emotions.
                                    </p>
                                    <WellnessButton
                                        onClick={() => document.querySelector('textarea')?.focus()}
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                    >
                                        Write Your First Entry
                                    </WellnessButton>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        history.map((h) => (
                        <Card key={h.id} className="p-4">
                            {editingId === h.id ? (
                            <form onSubmit={handleEditSave} className="space-y-4">
                                <Textarea value={editingEntry} onChange={e => setEditingEntry(e.target.value)} className="min-h-[100px]" />
                                <div className="text-sm text-muted-foreground">
                                  💭 AI will re-analyze your mood from the updated entry
                                </div>
                                <div className="flex gap-2">
                                    <WellnessButton type="submit" disabled={analyzingMood}>
                                      {analyzingMood ? "Analyzing Mood..." : "Save"}
                                    </WellnessButton>
                                    <WellnessButton type="button" variant="secondary" onClick={() => setEditingId(null)}>Cancel</WellnessButton>
                                </div>
                            </form>
                            ) : (
                            <div>
                                <p className="text-muted-foreground text-sm mb-2">{h.createdAt.toDate().toLocaleString()}</p>
                                <p className="mb-4">{h.entry}</p>
                                {h.mood && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-primary">AI Detected Mood:</span>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                                      {getMoodEmoji(h.mood)} {h.mood}
                                    </span>
                                  </div>
                                )}
                                <div className="flex gap-2 mt-4">
                                    <WellnessButton size="sm" variant="outline" onClick={() => startEdit(h)}>Edit</WellnessButton>
                                    <WellnessButton size="sm" variant="outline" onClick={() => handleDelete(h.id!)}>Delete</WellnessButton>
                                </div>
                            </div>
                            )}
                        </Card>
                        ))
                    )}
                </div>
            </div>
        </Container>
    </Layout>
  );
}
