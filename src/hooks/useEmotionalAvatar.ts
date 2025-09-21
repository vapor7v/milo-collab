import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useMoodPrediction } from './useMoodPrediction';
import { db } from '@/integrations/firebase/client';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';

export interface AvatarAppearance {
  baseStyle: 'cartoon' | 'realistic' | 'anime' | 'minimal';
  hairColor: string;
  skinTone: string;
  eyeColor: string;
  outfit: string;
  accessories: string[];
}

export interface AvatarEmotion {
  mood: 'happy' | 'sad' | 'excited' | 'anxious' | 'calm' | 'angry' | 'neutral';
  intensity: number; // 1-10
  expression: string;
  bodyLanguage: string;
  colorScheme: string;
}

export interface AvatarMessage {
  id: string;
  message: string;
  emotion: AvatarEmotion;
  timestamp: Timestamp;
  userMessage?: string;
  isUserMessage: boolean;
}

export interface AvatarMemory {
  id: string;
  type: 'conversation' | 'mood_change' | 'achievement' | 'milestone';
  content: string;
  emotion: string;
  timestamp: Timestamp;
  importance: number; // 1-10
}

export const useEmotionalAvatar = () => {
  const { user } = useAuth();
  const { currentMood } = useMoodPrediction();
  const [avatarAppearance, setAvatarAppearance] = useState<AvatarAppearance | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<AvatarEmotion>({
    mood: 'neutral',
    intensity: 5,
    expression: 'calm',
    bodyLanguage: 'relaxed',
    colorScheme: 'blue'
  });
  const [conversation, setConversation] = useState<AvatarMessage[]>([]);
  const [memories, setMemories] = useState<AvatarMemory[]>([]);
  const [loading, setLoading] = useState(false);

  // Load avatar appearance
  const loadAvatarAppearance = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const avatarRef = doc(db, 'user_avatars', user.uid);
      const avatarSnap = await getDoc(avatarRef);

      if (avatarSnap.exists()) {
        setAvatarAppearance(avatarSnap.data() as AvatarAppearance);
      } else {
        // Create default appearance
        const defaultAppearance: AvatarAppearance = {
          baseStyle: 'cartoon',
          hairColor: '#8B4513',
          skinTone: '#FDBCB4',
          eyeColor: '#4169E1',
          outfit: 'casual',
          accessories: []
        };

        await setDoc(avatarRef, defaultAppearance);
        setAvatarAppearance(defaultAppearance);
      }
    } catch (error) {
      console.error('Error loading avatar appearance:', error);
    }
  }, [user?.uid]);

  // Update avatar emotion based on mood
  const updateEmotionFromMood = useCallback((moodPrediction: any) => {
    if (!moodPrediction) return;

    let emotion: AvatarEmotion;

    switch (moodPrediction.mood) {
      case 'happy':
        emotion = {
          mood: 'happy',
          intensity: Math.min(10, moodPrediction.confidence / 10),
          expression: 'smiling widely',
          bodyLanguage: 'open and energetic',
          colorScheme: 'yellow'
        };
        break;
      case 'excited':
        emotion = {
          mood: 'excited',
          intensity: Math.min(10, moodPrediction.confidence / 10),
          expression: 'eyes wide with joy',
          bodyLanguage: 'bouncing with energy',
          colorScheme: 'orange'
        };
        break;
      case 'sad':
        emotion = {
          mood: 'sad',
          intensity: Math.min(10, moodPrediction.confidence / 10),
          expression: 'downcast eyes',
          bodyLanguage: 'slightly hunched',
          colorScheme: 'blue'
        };
        break;
      case 'anxious':
        emotion = {
          mood: 'anxious',
          intensity: Math.min(10, moodPrediction.confidence / 10),
          expression: 'worried brow',
          bodyLanguage: 'fidgeting',
          colorScheme: 'purple'
        };
        break;
      case 'stressed':
        emotion = {
          mood: 'angry',
          intensity: Math.min(10, moodPrediction.confidence / 10),
          expression: 'tense jaw',
          bodyLanguage: 'stiff posture',
          colorScheme: 'red'
        };
        break;
      default:
        emotion = {
          mood: 'neutral',
          intensity: 5,
          expression: 'calm',
          bodyLanguage: 'relaxed',
          colorScheme: 'green'
        };
    }

    setCurrentEmotion(emotion);

    // Store emotion change in memory
    addMemory({
      type: 'mood_change',
      content: `User mood detected as ${moodPrediction.mood} with ${moodPrediction.confidence}% confidence`,
      emotion: moodPrediction.mood,
      importance: Math.floor(moodPrediction.confidence / 10)
    });
  }, []);

  // Generate AI response for avatar
  const generateAvatarResponse = useCallback(async (userMessage: string): Promise<string> => {
    if (!user?.uid) return "I'm here to support you!";

    try {
      setLoading(true);
      const ai = getGenerativeAIService();

      if (!ai) return "I'm listening... How are you feeling today?";

      // Get recent memories for context
      const recentMemories = memories.slice(-5);

      const prompt = `
        You are an emotional avatar companion in a wellness app. Respond empathetically and supportively.

        Current user mood: ${currentEmotion.mood} (intensity: ${currentEmotion.intensity}/10)
        Avatar expression: ${currentEmotion.expression}
        Avatar body language: ${currentEmotion.bodyLanguage}

        Recent context from memories:
        ${recentMemories.map(memory => `- ${memory.type}: ${memory.content} (${memory.emotion})`).join('\n')}

        User message: "${userMessage}"

        Respond as a caring friend who:
        1. Acknowledges their current emotional state
        2. Shows genuine empathy and understanding
        3. Offers gentle support or suggestions
        4. Keeps responses conversational and warm (under 150 characters)
        5. Uses appropriate emojis that match the avatar's current emotion

        Response should feel like a supportive companion, not a therapist.
      `;

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const message = response.text().trim();

      // Add to conversation
      const avatarMessage: AvatarMessage = {
        id: '',
        message,
        emotion: currentEmotion,
        timestamp: Timestamp.now(),
        userMessage,
        isUserMessage: false
      };

      setConversation(prev => [...prev.slice(-9), avatarMessage]); // Keep last 10 messages

      // Store in database
      const conversationRef = collection(db, 'avatar_conversations', user.uid, 'messages');
      const docRef = doc(conversationRef);
      await setDoc(docRef, { ...avatarMessage, id: docRef.id });

      return message;

    } catch (error) {
      console.error('Error generating avatar response:', error);
      return "I'm here for you. What's on your mind? 💙";
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentEmotion, memories]);

  // Add memory
  const addMemory = useCallback(async (memory: Omit<AvatarMemory, 'id' | 'timestamp'>) => {
    if (!user?.uid) return;

    try {
      const memoryData: AvatarMemory = {
        ...memory,
        id: '',
        timestamp: Timestamp.now()
      };

      const memoriesRef = collection(db, 'avatar_memories', user.uid, 'memories');
      const docRef = doc(memoriesRef);
      await setDoc(docRef, { ...memoryData, id: docRef.id });

      setMemories(prev => [...prev.slice(-19), memoryData]); // Keep last 20 memories
    } catch (error) {
      console.error('Error adding memory:', error);
    }
  }, [user?.uid]);

  // Load conversation history
  const loadConversation = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const conversationRef = collection(db, 'avatar_conversations', user.uid, 'messages');
      const q = query(conversationRef, orderBy('timestamp', 'desc'), limit(20));
      const snapshot = await getDocs(q);

      const messages: AvatarMessage[] = [];
      snapshot.forEach(doc => {
        messages.push({ ...doc.data() } as AvatarMessage);
      });

      setConversation(messages.reverse());
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  }, [user?.uid]);

  // Load memories
  const loadMemories = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const memoriesRef = collection(db, 'avatar_memories', user.uid, 'memories');
      const q = query(memoriesRef, orderBy('timestamp', 'desc'), limit(20));
      const snapshot = await getDocs(q);

      const loadedMemories: AvatarMemory[] = [];
      snapshot.forEach(doc => {
        loadedMemories.push({ ...doc.data() } as AvatarMemory);
      });

      setMemories(loadedMemories.reverse());
    } catch (error) {
      console.error('Error loading memories:', error);
    }
  }, [user?.uid]);

  // Update avatar appearance
  const updateAppearance = useCallback(async (updates: Partial<AvatarAppearance>) => {
    if (!user?.uid || !avatarAppearance) return;

    try {
      const newAppearance = { ...avatarAppearance, ...updates };
      const avatarRef = doc(db, 'user_avatars', user.uid);
      await updateDoc(avatarRef, updates);

      setAvatarAppearance(newAppearance);
    } catch (error) {
      console.error('Error updating avatar appearance:', error);
    }
  }, [user?.uid, avatarAppearance]);

  // Get avatar emoji representation
  const getAvatarEmoji = useCallback(() => {
    const emotion = currentEmotion.mood;
    const intensity = currentEmotion.intensity;

    switch (emotion) {
      case 'happy':
        return intensity > 7 ? '😊' : '🙂';
      case 'excited':
        return intensity > 7 ? '🤩' : '😃';
      case 'sad':
        return intensity > 7 ? '😢' : '😔';
      case 'anxious':
        return intensity > 7 ? '😰' : '😟';
      case 'angry':
        return intensity > 7 ? '😠' : '😤';
      case 'calm':
        return '😌';
      default:
        return '😐';
    }
  }, [currentEmotion]);

  // Initialize
  useEffect(() => {
    if (user?.uid) {
      loadAvatarAppearance();
      loadConversation();
      loadMemories();
    }
  }, [user?.uid, loadAvatarAppearance, loadConversation, loadMemories]);

  // Update emotion when mood changes
  useEffect(() => {
    if (currentMood) {
      updateEmotionFromMood(currentMood);
    }
  }, [currentMood, updateEmotionFromMood]);

  return {
    avatarAppearance,
    currentEmotion,
    conversation,
    memories,
    loading,
    getAvatarEmoji,
    generateAvatarResponse,
    updateAppearance,
    addMemory
  };
};