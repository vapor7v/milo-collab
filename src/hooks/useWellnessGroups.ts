import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { db } from '@/integrations/firebase/client';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';

export interface SquadSupport {
  id: string;
  name: string;
  description: string;
  members: SquadMember[];
  createdAt: Timestamp;
  maxMembers: number;
  isActive: boolean;
  dailyPrompt: DailyPrompt;
}

export interface SquadMember {
  userId: string;
  joinedAt: Timestamp;
  lastActivity: Timestamp;
  isAnonymous: boolean;
}

export interface DailyPrompt {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'yes_no';
  createdAt: Timestamp;
  responses: PromptResponse[];
}

export interface PromptResponse {
  id: string;
  userId: string;
  response: string;
  timestamp: Timestamp;
  isSafe: boolean; // AI safety check result
  isAnonymous: boolean;
}

export interface SquadActivity {
  id: string;
  type: 'member_joined' | 'response_submitted' | 'daily_prompt_created';
  description: string;
  timestamp: Timestamp;
  isAnonymous: boolean;
}

export const useSquadSupport = () => {
  const { user } = useAuth();
  const [currentSquad, setCurrentSquad] = useState<SquadSupport | null>(null);
  const [availableSquads, setAvailableSquads] = useState<SquadSupport[]>([]);
  const [squadActivities, setSquadActivities] = useState<SquadActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<DailyPrompt | null>(null);
  const [unsubscribers, setUnsubscribers] = useState<(() => void)[]>([]);
  const [promptUnsubscriber, setPromptUnsubscriber] = useState<(() => void) | null>(null);


  // AI Safety Check for messages - very strict filtering for any meeting/location planning
  const checkResponseSafety = useCallback(async (response: string): Promise<boolean> => {
    try {
      const ai = getGenerativeAIService();
      if (!ai) return true; // If AI not available, assume safe

      const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const prompt = `
        Analyze this message for content that should be BLOCKED in an anonymous mental health support group.
        This is a STRICT safety filter - BLOCK if the message contains ANY of the following:

        CONTACT & PERSONAL INFO:
        - Phone numbers, email addresses, any contact information
        - Social media handles, usernames, platform references
        - Website URLs, links, or online meeting references
        - Personal identifiable information (full names, addresses)

        LOCATION & MEETING PLANNING:
        - City names, neighborhood names, landmarks (Bangalore, Indiranagar, etc.)
        - Location references (cafe, park, home, office, etc.)
        - Time references for meetings (4 pm, tomorrow, next week, etc.)
        - Meeting/meetup planning language ("let's meet", "see you at", "come to", etc.)
        - Transportation references (bus, metro, car, walk, etc.)
        - Any suggestion of physical in-person meetings

        HARMFUL CONTENT:
        - Direct threats of violence against others
        - Instructions for self-harm or suicide
        - Child exploitation or abuse
        - Illegal activities
        - Spam or commercial content

        ALLOW only:
        - Pure emotional support discussions
        - Mental health experiences and feelings
        - General wellness advice (no specific locations/times)
        - Anonymous sharing of struggles
        - Supportive responses to others' feelings

        Message: "${response}"

        Return only "SAFE" or "BLOCK".
        Return "BLOCK" for ANY location, time, meeting, or contact references.
        Return "SAFE" only for pure emotional/mental health discussions with no actionable details.
      `;

      const result = await model.generateContent(prompt);
      const aiResponse = await result.response;
      const text = aiResponse.text().trim().toUpperCase();

      return text === 'SAFE';
    } catch (error) {
      console.error('Error checking message safety:', error);
      return true; // Default to safe if check fails
    }
  }, []);

  // Set up real-time listener for current prompt responses
  const setupPromptListener = useCallback((squad: SquadSupport) => {
    if (promptUnsubscriber) {
      promptUnsubscriber();
    }

    if (squad.dailyPrompt?.id) {
      const promptRef = doc(db, 'squad_prompts', squad.dailyPrompt.id);
      const unsubscribe = onSnapshot(promptRef, (promptSnap) => {
        if (promptSnap.exists()) {
          const promptData = { id: promptSnap.id, ...promptSnap.data() } as DailyPrompt;
          setCurrentSquad(prev => prev ? {
            ...prev,
            dailyPrompt: promptData
          } : null);
        }
      });
      setPromptUnsubscriber(() => unsubscribe);
    }
  }, [promptUnsubscriber]);

  // Load user's current squad with real-time listener
  const loadCurrentSquad = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const userSquadRef = doc(db, 'user_squads', user.uid);
      const userSquadSnap = await getDoc(userSquadRef);

      if (userSquadSnap.exists()) {
        const squadId = userSquadSnap.data().squadId;
        const squadRef = doc(db, 'squad_support', squadId);

        // Set up real-time listener for squad changes
        const unsubscribe = onSnapshot(squadRef, (squadSnap) => {
          if (squadSnap.exists()) {
            const squad = { id: squadSnap.id, ...squadSnap.data() } as SquadSupport;
            setCurrentSquad(squad);
            // Set up prompt listener when squad loads
            setupPromptListener(squad);
          } else {
            setCurrentSquad(null);
            if (promptUnsubscriber) {
              promptUnsubscriber();
              setPromptUnsubscriber(null);
            }
          }
        });

        // Store unsubscribe function for cleanup
        return unsubscribe;
      } else {
        setCurrentSquad(null);
        if (promptUnsubscriber) {
          promptUnsubscriber();
          setPromptUnsubscriber(null);
        }
      }
    } catch (error) {
      console.error('Error loading current squad:', error);
      setCurrentSquad(null);
      if (promptUnsubscriber) {
        promptUnsubscriber();
        setPromptUnsubscriber(null);
      }
    }
  }, [user?.uid, setupPromptListener, promptUnsubscriber]);

  // Load available squads to join with real-time listener
  const loadAvailableSquads = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const squadsRef = collection(db, 'squad_support');
      const q = query(
        squadsRef,
        where('isActive', '==', true),
        limit(20)
      );

      // Set up real-time listener for available squads
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const squads: SquadSupport[] = [];

        snapshot.forEach(doc => {
          const squadData = { id: doc.id, ...doc.data() } as SquadSupport;
          const isMember = squadData.members?.some(member => member.userId === user.uid) || false;
          const hasSpace = (squadData.members?.length || 0) < (squadData.maxMembers || 5);
          if (!isMember && hasSpace) {
            squads.push(squadData);
          }
        });

        const sortedSquads = squads
          .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis())
          .slice(0, 10);

        setAvailableSquads(sortedSquads);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading available squads:', error);
      setAvailableSquads([]);
      setLoading(false);
    }
  }, [user?.uid]);

  // Create a new squad
  const createSquad = useCallback(async (name: string, description: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setLoading(true);

      const newSquad: SquadSupport = {
        id: '',
        name,
        description,
        members: [{
          userId: user.uid,
          joinedAt: Timestamp.now(),
          lastActivity: Timestamp.now(),
          isAnonymous: true
        }],
        createdAt: Timestamp.now(),
        maxMembers: 5,
        isActive: true,
        dailyPrompt: {
          id: '',
          question: 'Welcome to the squad chat! Share your thoughts and support each other.',
          type: 'text',
          createdAt: Timestamp.now(),
          responses: []
        }
      };

      // Create the chat thread document
      const chatRef = doc(collection(db, 'squad_prompts'));
      const chatData = {
        ...newSquad.dailyPrompt,
        id: chatRef.id
      };
      await setDoc(chatRef, chatData);

      // Create squad with chat thread
      const squadRef = doc(collection(db, 'squad_support'));
      const squadData = {
        ...newSquad,
        id: squadRef.id,
        dailyPrompt: chatData
      };
      await setDoc(squadRef, squadData);

      // Add user to squad
      await setDoc(doc(db, 'user_squads', user.uid), {
        squadId: squadRef.id,
        joinedAt: Timestamp.now()
      });

      setCurrentSquad(squadData);

      // Remove this squad from available squads since creator is now a member
      setAvailableSquads(prev => prev.filter(s => s.id !== squadRef.id));

      return true;
    } catch (error) {
      console.error('Error creating squad:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Join an existing squad
  const joinSquad = useCallback(async (squadId: string): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      setLoading(true);
      const squadRef = doc(db, 'squad_support', squadId);
      const squadSnap = await getDoc(squadRef);

      if (!squadSnap.exists()) return false;

      const squad = { id: squadSnap.id, ...squadSnap.data() } as SquadSupport;

      if (squad.members.length >= squad.maxMembers) return false;

      const newMember: SquadMember = {
        userId: user.uid,
        joinedAt: Timestamp.now(),
        lastActivity: Timestamp.now(),
        isAnonymous: true
      };

      await updateDoc(squadRef, {
        members: arrayUnion(newMember)
      });

      // Add user to squad
      await setDoc(doc(db, 'user_squads', user.uid), {
        squadId,
        joinedAt: Timestamp.now()
      });

      // Update local state immediately for better UX
      setCurrentSquad({
        ...squad,
        members: [...squad.members, newMember]
      });

      // Remove this squad from available squads immediately
      setAvailableSquads(prev => prev.filter(s => s.id !== squadId));

      return true;
    } catch (error) {
      console.error('Error joining squad:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  // Leave current squad
  const leaveSquad = useCallback(async (): Promise<boolean> => {
    if (!user?.uid || !currentSquad) return false;

    try {
      setLoading(true);
      const squadRef = doc(db, 'squad_support', currentSquad.id);
      const memberToRemove = currentSquad.members.find(m => m.userId === user.uid);

      if (memberToRemove) {
        await updateDoc(squadRef, {
          members: arrayRemove(memberToRemove)
        });
      }

      // Remove user from squad
      const userSquadRef = doc(db, 'user_squads', user.uid);
      await updateDoc(userSquadRef, {
        leftAt: Timestamp.now()
      });

      // If the squad now has space, add it back to available squads
      const updatedMembers = currentSquad.members.filter(m => m.userId !== user.uid);
      if (updatedMembers.length < currentSquad.maxMembers) {
        const availableSquad = {
          ...currentSquad,
          members: updatedMembers
        };
        setAvailableSquads(prev => {
          // Only add if not already in the list
          if (!prev.some(s => s.id === currentSquad.id)) {
            return [...prev, availableSquad].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).slice(0, 10);
          }
          return prev;
        });
      }

      setCurrentSquad(null);

      return true;
    } catch (error) {
      console.error('Error leaving squad:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentSquad]);

  // Submit response to daily prompt
  const submitPromptResponse = useCallback(async (response: string): Promise<boolean> => {
    if (!user?.uid || !currentSquad?.dailyPrompt?.id) return false;

    try {
      // Check response safety
      const isSafe = await checkResponseSafety(response);
      if (!isSafe) {
        console.warn('Response flagged as potentially unsafe');
        return false;
      }

      const newResponse: PromptResponse = {
        id: '',
        userId: user.uid,
        response,
        timestamp: Timestamp.now(),
        isSafe: true,
        isAnonymous: true
      };

      const promptRef = doc(db, 'squad_prompts', currentSquad.dailyPrompt.id);
      await updateDoc(promptRef, {
        responses: arrayUnion(newResponse)
      });

      // Real-time listener will update the UI automatically
      return true;
    } catch (error) {
      console.error('Error submitting prompt response:', error);
      return false;
    }
  }, [user?.uid, currentSquad?.dailyPrompt?.id, checkResponseSafety]);


  // Load squad activities
  const loadSquadActivities = useCallback(async () => {
    if (!currentSquad) return;

    try {
      const activitiesRef = collection(db, 'squad_activities', currentSquad.id, 'activities');
      const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(20));

      const snapshot = await getDocs(q);
      const activities: SquadActivity[] = [];

      snapshot.forEach(doc => {
        activities.push({ id: doc.id, ...doc.data() } as SquadActivity);
      });

      setSquadActivities(activities);
    } catch (error) {
      console.error('Error loading squad activities:', error);
    }
  }, [currentSquad]);

  // Initialize with real-time listeners
  useEffect(() => {
    if (user?.uid) {
      // Clean up previous listeners
      unsubscribers.forEach(unsubscribe => unsubscribe());
      setUnsubscribers([]);

      // Set up new listeners
      loadCurrentSquad().then(unsubscribe => {
        if (unsubscribe) {
          setUnsubscribers(prev => [...prev, unsubscribe]);
        }
      });

      loadAvailableSquads().then(unsubscribe => {
        if (unsubscribe) {
          setUnsubscribers(prev => [...prev, unsubscribe]);
        }
      });
    }

    // Cleanup function
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
      if (promptUnsubscriber) {
        promptUnsubscriber();
      }
    };
  }, [user?.uid]);

  // Load activities when squad changes
  useEffect(() => {
    if (currentSquad) {
      loadSquadActivities();
    }
  }, [currentSquad, loadSquadActivities]);

  return {
    currentSquad,
    availableSquads,
    squadActivities,
    currentPrompt,
    loading,
    createSquad,
    joinSquad,
    leaveSquad,
    submitPromptResponse,
    loadAvailableSquads,
    loadSquadActivities
  };
};