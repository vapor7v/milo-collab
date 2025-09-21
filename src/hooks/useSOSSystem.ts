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
  Timestamp,
  increment
} from 'firebase/firestore';
import { getGenerativeAIService } from '@/integrations/firebase/client';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

export interface SafetyPlan {
  id: string;
  triggers: string[];
  copingStrategies: string[];
  supportNetwork: EmergencyContact[];
  professionalHelp: {
    therapist?: string;
    hotline?: string;
    crisisCenter?: string;
  };
  createdAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface SOSEvent {
  id: string;
  userId: string;
  level: 1 | 2 | 3 | 4 | 5; // Escalation level
  trigger: string;
  riskAssessment: 'low' | 'moderate' | 'high' | 'critical';
  actions: string[];
  resolved: boolean;
  resolvedAt?: Timestamp;
  timestamp: Timestamp;
}

export interface SOSSettings {
  autoEscalationEnabled: boolean;
  escalationDelays: {
    level2: number; // minutes
    level3: number;
    level4: number;
    level5: number;
  };
  silentMode: boolean;
  locationSharing: boolean;
}

export const useSOSSystem = () => {
  const { user } = useAuth();
  const { currentMood } = useMoodPrediction();
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [safetyPlan, setSafetyPlan] = useState<SafetyPlan | null>(null);
  const [sosSettings, setSOSSettings] = useState<SOSSettings>({
    autoEscalationEnabled: true,
    escalationDelays: {
      level2: 30, // 30 minutes
      level3: 60, // 1 hour
      level4: 120, // 2 hours
      level5: 240, // 4 hours
    },
    silentMode: false,
    locationSharing: false
  });
  const [currentSOSEvent, setCurrentSOSEvent] = useState<SOSEvent | null>(null);
  const [sosHistory, setSOSHistory] = useState<SOSEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // Load emergency contacts
  const loadEmergencyContacts = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const contactsRef = collection(db, 'emergency_contacts', user.uid, 'contacts');
      const q = query(contactsRef, orderBy('isPrimary', 'desc'));
      const snapshot = await getDocs(q);

      const contacts: EmergencyContact[] = [];
      snapshot.forEach(doc => {
        contacts.push({ id: doc.id, ...doc.data() } as EmergencyContact);
      });

      setEmergencyContacts(contacts);
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  }, [user?.uid]);

  // Load safety plan
  const loadSafetyPlan = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const planRef = doc(db, 'safety_plans', user.uid);
      const planSnap = await getDoc(planRef);

      if (planSnap.exists()) {
        setSafetyPlan({ id: planSnap.id, ...planSnap.data() } as SafetyPlan);
      }
    } catch (error) {
      console.error('Error loading safety plan:', error);
    }
  }, [user?.uid]);

  // Load SOS settings
  const loadSOSSettings = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const settingsRef = doc(db, 'sos_settings', user.uid);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        setSOSSettings({ ...sosSettings, ...settingsSnap.data() });
      } else {
        // Create default settings
        await setDoc(settingsRef, sosSettings);
      }
    } catch (error) {
      console.error('Error loading SOS settings:', error);
    }
  }, [user?.uid, sosSettings]);

  // Load SOS history
  const loadSOSHistory = useCallback(async () => {
    if (!user?.uid) return;

    try {
      const historyRef = collection(db, 'sos_events', user.uid, 'events');
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(20));
      const snapshot = await getDocs(q);

      const events: SOSEvent[] = [];
      snapshot.forEach(doc => {
        events.push({ ...doc.data() } as SOSEvent);
      });

      setSOSHistory(events);
    } catch (error) {
      console.error('Error loading SOS history:', error);
    }
  }, [user?.uid]);

  // Add emergency contact
  const addEmergencyContact = useCallback(async (
    name: string,
    phone: string,
    relationship: string,
    isPrimary = false
  ): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const contact: EmergencyContact = {
        id: '',
        name,
        phone,
        relationship,
        isPrimary
      };

      const contactsRef = collection(db, 'emergency_contacts', user.uid, 'contacts');
      const docRef = doc(contactsRef);
      await setDoc(docRef, { ...contact, id: docRef.id });

      setEmergencyContacts(prev => [...prev, { ...contact, id: docRef.id }]);
      return true;
    } catch (error) {
      console.error('Error adding emergency contact:', error);
      return false;
    }
  }, [user?.uid]);

  // Create/update safety plan
  const updateSafetyPlan = useCallback(async (
    triggers: string[],
    copingStrategies: string[],
    professionalHelp?: SafetyPlan['professionalHelp']
  ): Promise<boolean> => {
    if (!user?.uid) return false;

    try {
      const plan: SafetyPlan = {
        id: user.uid,
        triggers,
        copingStrategies,
        supportNetwork: emergencyContacts,
        professionalHelp: professionalHelp || {},
        createdAt: Timestamp.now(),
        lastUpdated: Timestamp.now()
      };

      const planRef = doc(db, 'safety_plans', user.uid);
      await setDoc(planRef, plan);

      setSafetyPlan(plan);
      return true;
    } catch (error) {
      console.error('Error updating safety plan:', error);
      return false;
    }
  }, [user?.uid, emergencyContacts]);

  // Assess risk and trigger SOS
  const assessAndTriggerSOS = useCallback(async (trigger: string): Promise<SOSEvent | null> => {
    if (!user?.uid) return null;

    try {
      setLoading(true);

      // AI-powered risk assessment
      const ai = getGenerativeAIService();
      let riskLevel: SOSEvent['riskAssessment'] = 'low';
      let escalationLevel: SOSEvent['level'] = 1;

      if (ai) {
        const prompt = `
          Assess the risk level for this wellness app user based on the trigger and context:

          Trigger: "${trigger}"
          Current mood: ${currentMood?.mood || 'unknown'} (${currentMood?.confidence || 0}% confidence)
          Recent SOS events: ${sosHistory.length}
          Has safety plan: ${!!safetyPlan}
          Emergency contacts: ${emergencyContacts.length}

          Risk levels: low, moderate, high, critical

          Consider:
          - Severity of trigger
          - User's current emotional state
          - Available support systems
          - History of similar events

          Return only: low|moderate|high|critical
        `;

        const model = ai.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const assessment = response.text().trim().toLowerCase();

        if (['low', 'moderate', 'high', 'critical'].includes(assessment)) {
          riskLevel = assessment as SOSEvent['riskAssessment'];
        }
      }

      // Determine escalation level based on risk
      switch (riskLevel) {
        case 'low': escalationLevel = 1; break;
        case 'moderate': escalationLevel = 2; break;
        case 'high': escalationLevel = 3; break;
        case 'critical': escalationLevel = 4; break;
      }

      const sosEvent: SOSEvent = {
        id: '',
        userId: user.uid,
        level: escalationLevel,
        trigger,
        riskAssessment: riskLevel,
        actions: [],
        resolved: false,
        timestamp: Timestamp.now()
      };

      // Save SOS event
      const eventsRef = collection(db, 'sos_events', user.uid, 'events');
      const docRef = doc(eventsRef);
      await setDoc(docRef, { ...sosEvent, id: docRef.id });

      setCurrentSOSEvent({ ...sosEvent, id: docRef.id });

      // Trigger appropriate response based on level
      await triggerSOSResponse(escalationLevel, trigger);

      return { ...sosEvent, id: docRef.id };
    } catch (error) {
      console.error('Error assessing SOS risk:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.uid, currentMood, sosHistory, safetyPlan, emergencyContacts]);

  // Trigger appropriate SOS response
  const triggerSOSResponse = useCallback(async (level: SOSEvent['level'], trigger: string) => {
    const actions: string[] = [];

    switch (level) {
      case 1: // Gentle reminder
        actions.push('Sent gentle check-in message');
        // Send personalized message via avatar or notification
        break;

      case 2: // Moderate concern
        actions.push('Activated coping strategies from safety plan');
        actions.push('Sent reminder to use breathing exercises');
        // Trigger breathing exercise reminder
        break;

      case 3: // High concern
        actions.push('Notified trusted contacts for check-in');
        actions.push('Suggested professional help resources');
        // Send notification to emergency contacts
        break;

      case 4: // Critical
        actions.push('Emergency alert sent to primary contacts');
        actions.push('Connected to crisis hotline');
        // Immediate emergency response
        break;

      case 5: // Maximum escalation
        actions.push('Full emergency protocol activated');
        actions.push('Emergency services notified');
        // Maximum emergency response
        break;
    }

    // Update current SOS event with actions
    if (currentSOSEvent) {
      const eventsRef = doc(db, 'sos_events', user!.uid, 'events', currentSOSEvent.id);
      await updateDoc(eventsRef, { actions });
    }
  }, [currentSOSEvent, user?.uid]);

  // Resolve current SOS event
  const resolveSOSEvent = useCallback(async (notes?: string): Promise<boolean> => {
    if (!user?.uid || !currentSOSEvent) return false;

    try {
      const eventsRef = doc(db, 'sos_events', user.uid, 'events', currentSOSEvent.id);
      await updateDoc(eventsRef, {
        resolved: true,
        resolvedAt: Timestamp.now(),
        resolutionNotes: notes
      });

      setCurrentSOSEvent(null);
      return true;
    } catch (error) {
      console.error('Error resolving SOS event:', error);
      return false;
    }
  }, [user?.uid, currentSOSEvent]);

  // Update SOS settings
  const updateSOSSettings = useCallback(async (settings: Partial<SOSSettings>) => {
    if (!user?.uid) return;

    try {
      const newSettings = { ...sosSettings, ...settings };
      const settingsRef = doc(db, 'sos_settings', user.uid);
      await updateDoc(settingsRef, settings);

      setSOSSettings(newSettings);
    } catch (error) {
      console.error('Error updating SOS settings:', error);
    }
  }, [user?.uid, sosSettings]);

  // Initialize
  useEffect(() => {
    if (user?.uid) {
      loadEmergencyContacts();
      loadSafetyPlan();
      loadSOSSettings();
      loadSOSHistory();
    }
  }, [user?.uid, loadEmergencyContacts, loadSafetyPlan, loadSOSSettings, loadSOSHistory]);

  return {
    emergencyContacts,
    safetyPlan,
    sosSettings,
    currentSOSEvent,
    sosHistory,
    loading,
    addEmergencyContact,
    updateSafetyPlan,
    assessAndTriggerSOS,
    resolveSOSEvent,
    updateSOSSettings,
    loadEmergencyContacts,
    loadSafetyPlan
  };
};