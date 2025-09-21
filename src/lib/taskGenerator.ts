import { db } from '@/integrations/firebase/client';
import { collection, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Timestamp;
}

export interface JournalEntry {
  id: string;
  entry: string;
  mood?: string;
  createdAt: Timestamp;
  userId: string;
}

export interface GeneratedTask {
  id: string;
  title: string;
  description?: string;
  category: 'mindfulness' | 'social' | 'physical' | 'creative' | 'self_care';
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // in minutes
}

export class TaskGeneratorService {
  private generativeAI = getGenerativeAIService();

  async generateTasksForUser(userId: string): Promise<GeneratedTask[]> {
    try {
      // Fetch recent chat messages (last 7 days)
      const messages = await this.fetchRecentMessages(userId);

      // Fetch recent journal entries (last 7 days)
      const journalEntries = await this.fetchRecentJournalEntries(userId);

      if (messages.length === 0 && journalEntries.length === 0) {
        return this.getDefaultTasks();
      }

      // Generate personalized tasks using AI
      const tasks = await this.generatePersonalizedTasks(messages, journalEntries);

      return tasks;
    } catch (error) {
      console.error('Error generating tasks for user:', error);
      return this.getDefaultTasks();
    }
  }

  private async fetchRecentMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'chats', userId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const messages: ChatMessage[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const messageDate = data.timestamp.toDate();

        if (messageDate >= sevenDaysAgo) {
          messages.push({
            id: data.id,
            text: data.text,
            sender: data.sender,
            timestamp: data.timestamp
          });
        }
      });

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  private async fetchRecentJournalEntries(userId: string): Promise<JournalEntry[]> {
    try {
      const journalRef = collection(db, 'journal_entries');
      const q = query(journalRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const entries: JournalEntry[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entryDate = data.createdAt.toDate();

        if (entryDate >= sevenDaysAgo) {
          entries.push({
            id: doc.id,
            entry: data.entry,
            mood: data.mood,
            createdAt: data.createdAt,
            userId: data.userId
          });
        }
      });

      return entries.reverse(); // Return in chronological order
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }
  }

  private async generatePersonalizedTasks(messages: ChatMessage[], journalEntries: JournalEntry[]): Promise<GeneratedTask[]> {
    try {
      if (!this.generativeAI) {
        console.warn('Generative AI service not available');
        return this.getDefaultTasks();
      }

      const model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const conversationText = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .join('\n');

      const journalText = journalEntries
        .map(entry => `Entry: ${entry.entry}${entry.mood ? ` | Mood: ${entry.mood}` : ''}`)
        .join('\n');

      const prompt = `
        Based on this user's recent chat conversations and journal entries, generate 3-5 personalized wellness tasks for today.
        Focus on their current emotional state, mentioned challenges, and expressed needs.

        Recent Chat Conversations:
        ${conversationText}

        Recent Journal Entries:
        ${journalText}

        Generate tasks that are:
        - Specific and actionable
        - Based on what they've shared
        - Realistic for one day
        - Focused on mental wellness and emotional health
        - Varied in type (mindfulness, social, creative, physical, self-care)

        Response format (JSON):
        [
          {
            "id": "unique_id",
            "title": "Brief, actionable task title",
            "description": "Optional detailed description",
            "category": "mindfulness|social|physical|creative|self_care",
            "priority": "high|medium|low",
            "estimatedTime": number_in_minutes
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const tasks = JSON.parse(jsonMatch[0]);
        return tasks.map((task: any, index: number) => ({
          id: `ai_task_${Date.now()}_${index}`,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          estimatedTime: task.estimatedTime || 15
        }));
      }

      // Fallback to default tasks if parsing fails
      return this.getDefaultTasks();
    } catch (error) {
      console.error('Error generating personalized tasks:', error);
      return this.getDefaultTasks();
    }
  }

  private getDefaultTasks(): GeneratedTask[] {
    return [
      {
        id: 'default_mindfulness',
        title: 'Practice 5-minute mindfulness meditation',
        description: 'Take a few minutes to focus on your breath and be present in the moment',
        category: 'mindfulness',
        priority: 'medium',
        estimatedTime: 5
      },
      {
        id: 'default_social',
        title: 'Reach out to a friend or family member',
        description: 'Send a message or call someone you care about to strengthen your support network',
        category: 'social',
        priority: 'medium',
        estimatedTime: 10
      },
      {
        id: 'default_self_care',
        title: 'Do something kind for yourself today',
        description: 'Whether it\'s reading, walking, or enjoying your favorite activity',
        category: 'self_care',
        priority: 'low',
        estimatedTime: 30
      }
    ];
  }
}

export const taskGeneratorService = new TaskGeneratorService();