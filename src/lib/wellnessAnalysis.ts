import { db } from '@/integrations/firebase/client';
import { collection, query, orderBy, getDocs, doc, setDoc, Timestamp, where } from 'firebase/firestore';
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

export interface WellnessScores {
  moodScore: number; // 1-10 scale
  anxietyScore: number; // 1-10 scale
  socialEngagementScore: number; // 1-10 scale
  stressScore: number; // 1-10 scale
  overallWellnessScore: number; // 1-10 scale
}

export interface WellnessPlan {
  id: string;
  userId: string;
  generatedAt: Timestamp;
  scores: WellnessScores;
  analysis: string;
  weeklyPlan: {
    monday: string[];
    tuesday: string[];
    wednesday: string[];
    thursday: string[];
    friday: string[];
    saturday: string[];
    sunday: string[];
  };
  recommendations: string[];
}

export class WellnessAnalysisService {
  private generativeAI = getGenerativeAIService();

  async analyzeUserWellness(userId: string): Promise<WellnessPlan | null> {
    try {
      // Fetch recent chat messages (last 30 days)
      const messages = await this.fetchRecentMessages(userId);
      const journalEntries = await this.fetchRecentJournalEntries(userId);

      if (messages.length === 0 && journalEntries.length === 0) {
        console.log('No messages or journal entries found for analysis');
        return null;
      }

      // Analyze messages and journal entries using AI
      const analysis = await this.analyzeContentWithAI(messages, journalEntries);

      // Generate wellness plan
      const wellnessPlan = await this.generateWellnessPlan(userId, analysis);

      // Store the wellness plan
      await this.storeWellnessPlan(userId, wellnessPlan);

      return wellnessPlan;
    } catch (error) {
      console.error('Error analyzing user wellness:', error);
      return null;
    }
  }

  private async fetchRecentMessages(userId: string): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'chats', userId, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);

      const messages: ChatMessage[] = [];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const messageDate = data.timestamp.toDate();

        if (messageDate >= thirtyDaysAgo) {
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const entryDate = data.createdAt.toDate();

        if (entryDate >= thirtyDaysAgo) {
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

  private async analyzeContentWithAI(messages: ChatMessage[], journalEntries: JournalEntry[]): Promise<any> {
    try {
      const model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const conversationText = messages
        .filter(msg => msg.sender === 'user')
        .map(msg => msg.text)
        .join('\n');

      const journalText = journalEntries
        .map(entry => `Entry: ${entry.entry}${entry.mood ? ` | Mood: ${entry.mood}` : ''}`)
        .join('\n');

      const prompt = `
        Analyze this user's mental wellness data from both chat conversations and journal entries.
        Focus on mood patterns, anxiety levels, social engagement, stress indicators, and behavioral trends.

        Chat Conversations:
        ${conversationText}

        Journal Entries:
        ${journalText}

        Please provide a JSON response with the following structure:
        {
          "moodScore": number (1-10, where 10 is very positive mood),
          "anxietyScore": number (1-10, where 10 is high anxiety),
          "socialEngagementScore": number (1-10, where 10 is highly engaged socially),
          "stressScore": number (1-10, where 10 is high stress),
          "overallWellnessScore": number (1-10, where 10 is excellent wellness),
          "keyInsights": string[],
          "riskFactors": string[],
          "positiveIndicators": string[],
          "moodTrends": string[],
          "recommendations": string[]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback analysis if JSON parsing fails
      return {
        moodScore: 5,
        anxietyScore: 5,
        socialEngagementScore: 5,
        stressScore: 5,
        overallWellnessScore: 5,
        keyInsights: ['Analysis completed'],
        riskFactors: [],
        positiveIndicators: [],
        moodTrends: [],
        recommendations: []
      };
    } catch (error) {
      console.error('Error analyzing content with AI:', error);
      return {
        moodScore: 5,
        anxietyScore: 5,
        socialEngagementScore: 5,
        stressScore: 5,
        overallWellnessScore: 5,
        keyInsights: ['Analysis failed'],
        riskFactors: [],
        positiveIndicators: [],
        moodTrends: [],
        recommendations: []
      };
    }
  }

  private async generateWellnessPlan(userId: string, analysis: any): Promise<WellnessPlan> {
    try {
      const model = this.generativeAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const prompt = `
        Based on this wellness analysis, create a personalized 1-week wellness plan.

        Analysis Data:
        - Mood Score: ${analysis.moodScore}/10
        - Anxiety Score: ${analysis.anxietyScore}/10
        - Social Engagement: ${analysis.socialEngagementScore}/10
        - Stress Score: ${analysis.stressScore}/10
        - Overall Wellness: ${analysis.overallWellnessScore}/10

        Key Insights: ${analysis.keyInsights?.join(', ') || 'None'}
        Risk Factors: ${analysis.riskFactors?.join(', ') || 'None'}
        Positive Indicators: ${analysis.positiveIndicators?.join(', ') || 'None'}

        Create a JSON response with a 7-day wellness plan including:
        - Daily activities focused on mental wellness
        - Coping strategies
        - Social engagement activities
        - Self-care routines
        - Mindfulness exercises

        Response format:
        {
          "weeklyPlan": {
            "monday": ["Activity 1", "Activity 2", "Activity 3"],
            "tuesday": ["Activity 1", "Activity 2", "Activity 3"],
            "wednesday": ["Activity 1", "Activity 2", "Activity 3"],
            "thursday": ["Activity 1", "Activity 2", "Activity 3"],
            "friday": ["Activity 1", "Activity 2", "Activity 3"],
            "saturday": ["Activity 1", "Activity 2", "Activity 3"],
            "sunday": ["Activity 1", "Activity 2", "Activity 3"]
          },
          "recommendations": ["General recommendation 1", "General recommendation 2", "General recommendation 3"]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let planData;
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback plan
        planData = {
          weeklyPlan: {
            monday: ["Morning meditation (10 min)", "Gratitude journaling", "Evening walk"],
            tuesday: ["Deep breathing exercises", "Connect with a friend", "Read before bed"],
            wednesday: ["Mindful eating practice", "Light exercise", "Digital detox hour"],
            thursday: ["Positive affirmations", "Creative hobby time", "Relaxing bath"],
            friday: ["Social activity", "Express gratitude", "Wind-down routine"],
            saturday: ["Nature time", "Healthy meal prep", "Quality family time"],
            sunday: ["Rest and recharge", "Plan for the week", "Self-reflection"]
          },
          recommendations: [
            "Practice daily mindfulness",
            "Maintain social connections",
            "Prioritize sleep and nutrition",
            "Seek professional help if needed"
          ]
        };
      }

      const wellnessPlan: WellnessPlan = {
        id: `plan_${Date.now()}`,
        userId,
        generatedAt: Timestamp.now(),
        scores: {
          moodScore: analysis.moodScore || 5,
          anxietyScore: analysis.anxietyScore || 5,
          socialEngagementScore: analysis.socialEngagementScore || 5,
          stressScore: analysis.stressScore || 5,
          overallWellnessScore: analysis.overallWellnessScore || 5
        },
        analysis: `Based on your recent conversations, your wellness scores indicate: Mood (${analysis.moodScore}/10), Anxiety (${analysis.anxietyScore}/10), Social Engagement (${analysis.socialEngagementScore}/10), Stress (${analysis.stressScore}/10). ${analysis.keyInsights?.join('. ') || ''}`,
        weeklyPlan: planData.weeklyPlan,
        recommendations: planData.recommendations || []
      };

      return wellnessPlan;
    } catch (error) {
      console.error('Error generating wellness plan:', error);
      // Return a basic fallback plan
      return {
        id: `plan_${Date.now()}`,
        userId,
        generatedAt: Timestamp.now(),
        scores: {
          moodScore: 5,
          anxietyScore: 5,
          socialEngagementScore: 5,
          stressScore: 5,
          overallWellnessScore: 5
        },
        analysis: "Wellness analysis completed with basic recommendations.",
        weeklyPlan: {
          monday: ["Morning meditation", "Gratitude practice", "Evening walk"],
          tuesday: ["Deep breathing", "Connect with others", "Healthy meal"],
          wednesday: ["Mindful activity", "Light exercise", "Relaxation"],
          thursday: ["Positive thinking", "Creative time", "Self-care"],
          friday: ["Social engagement", "Express gratitude", "Wind down"],
          saturday: ["Nature time", "Meal planning", "Family time"],
          sunday: ["Rest day", "Weekly planning", "Reflection"]
        },
        recommendations: [
          "Practice daily mindfulness",
          "Stay connected with loved ones",
          "Maintain healthy routines",
          "Seek support when needed"
        ]
      };
    }
  }

  private async storeWellnessPlan(userId: string, plan: WellnessPlan): Promise<void> {
    try {
      const planRef = doc(db, 'wellness_profiles', userId);
      await setDoc(planRef, {
        ...plan,
        lastUpdated: Timestamp.now()
      });
      console.log('Wellness plan stored successfully for user:', userId);
    } catch (error) {
      console.error('Error storing wellness plan:', error);
      throw error;
    }
  }

  async getWellnessPlan(userId: string): Promise<WellnessPlan | null> {
    try {
      // Note: This is a simplified version. In production, you'd query the specific document
      return null; // Implement proper retrieval
    } catch (error) {
      console.error('Error retrieving wellness plan:', error);
      return null;
    }
  }
}

export const wellnessAnalysisService = new WellnessAnalysisService();