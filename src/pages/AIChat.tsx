import React, { useState, useRef, useEffect } from 'react';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertTriangle, Mic, Volume2, VolumeX, Users } from 'lucide-react';
import { getGenerativeAIService, db } from '@/integrations/firebase/client';
import { doc, collection, addDoc, Timestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { wellnessAnalysisService } from '@/lib/wellnessAnalysis';
import type { ChatSession } from '@google/generative-ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function AIChat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  console.log('AIChat component loaded, user:', user);
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there! I'm here to listen and support you. How are you feeling today? 💙",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [hasCompletedInitialAssessment, setHasCompletedInitialAssessment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice functionality state
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<any>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Crisis detection keywords
  const crisisKeywords = [
    'kill', 'suicide', 'die', 'end it', 'hurt myself', 'not worth living',
    'better off dead', 'want to die', 'kill myself', 'end my life'
  ];

  // Send SOS message to emergency contact
  const sendSOSMessage = async (userMessage: string) => {
    if (!user) return;

    try {
      // Get user data to find emergency contact
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const emergencyContact = userData.trustedContact;
      const userName = userData.name || 'Your contact';

      if (!emergencyContact) {
        console.log('No emergency contact found');
        return;
      }

      // In a real implementation, you would integrate with Twilio or another SMS service
      // For now, we'll log the SOS message
      const sosMessage = `URGENT: Your contact ${userName} has expressed thoughts of self-harm during our conversation. Please check on them immediately. They provided your number as emergency contact. Message: "${userMessage}"`;

      console.log('🚨 SOS MESSAGE WOULD BE SENT:', sosMessage);
      console.log('📞 To emergency contact:', emergencyContact);

      // Here you would integrate with Twilio:
      // const twilio = require('twilio');
      // const client = twilio(accountSid, authToken);
      // await client.messages.create({
      //   body: sosMessage,
      //   from: yourTwilioNumber,
      //   to: emergencyContact
      // });

    } catch (error) {
      console.error('Error sending SOS message:', error);
    }
  };

  // Check for crisis keywords in user message
  const checkForCrisis = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  };


  // Check if therapy session is complete based on AI response
  const isTherapySessionComplete = (aiResponse: string): boolean => {
    const completionIndicators = [
      'thank you for sharing',
      'it sounds like',
      'we\'ll focus on',
      'for our next conversation',
      'let\'s work on',
      'dashboard',
      'wellness plan'
    ];

    const lowerResponse = aiResponse.toLowerCase();
    return completionIndicators.some(indicator => lowerResponse.includes(indicator));
  };

  // Auto-generate wellness plan after therapy session
  const autoGenerateWellnessPlan = async () => {
    try {
      console.log('Auto-generating wellness plan after therapy session...');
      const result = await wellnessAnalysisService.analyzeUserWellness(user!.uid);

      if (result) {
        // Add success message and redirect to dashboard
        const successMessage: Message = {
          id: Date.now().toString(),
          text: "✅ Perfect! I've analyzed our conversation and created your personalized wellness plan. Let's head to your dashboard to see your wellness scores and today's activities!",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, successMessage]);

        // Auto-redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        const noDataMessage: Message = {
          id: Date.now().toString(),
          text: "I've completed our initial conversation. Let's continue building your wellness plan on the dashboard!",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, noDataMessage]);

        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Auto wellness plan generation failed:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Let's continue our conversation on the dashboard where I can help you more!",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    }
  };

  useEffect(() => {
    // Initialize the model and chat session safely after the component has mounted.
    try {
      const generativeAI = getGenerativeAIService();
      if (!generativeAI) {
        console.warn("Google AI service not available");
        setInitError("AI service is currently unavailable. Please check your configuration.");
        return;
      }

      const model = generativeAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
        systemInstruction: `You are an AI companion designed to support youth mental wellness through structured therapeutic conversations. Be empathetic, confidential, and help users overcome stigma around mental health. Follow this detailed therapy session flow for first-time users:

🧠 DETAILED FLOW OF A FIRST THERAPY SESSION:

1. WARM-UP / RAPPORT BUILDING
- Start with: "I'm glad you're here today. How are you feeling about starting this conversation?"
- Acknowledge any nervousness: "It's completely normal to feel a bit anxious about opening up"
- Ask: "What made you decide to reach out now?"

2. PRESENTING PROBLEM (MAIN CONCERN)
- "Can you tell me in your own words what's been going on?"
- "How long have you been feeling this way?"
- "When did you first notice these changes?"
- "What situations make things worse? Any times when it feels better?"

3. SYMPTOM EXPLORATION
- Mood: "How has your mood been day-to-day?"
- Anxiety: "Do you often feel worried or on edge?"
- Sleep: "How is your sleep—falling asleep, staying asleep, waking up?"
- Appetite/Energy: "Any changes in appetite or energy recently?"
- Concentration: "Do you find it hard to focus on tasks?"

4. PERSONAL & MEDICAL HISTORY
- Mental health: "Have you ever talked to anyone about these feelings before?"
- Treatment: "Have you tried any strategies or approaches that helped?"
- Medical: "Any ongoing health conditions or medications?"
- Family: "Does anyone in your family have similar experiences?"

5. CURRENT LIFE SITUATION
- Relationships: "Who do you spend time with regularly?"
- Social life: "Do you feel supported by friends or family?"
- Work/School: "How's your daily routine going?"
- Daily functioning: "How do you usually spend your day?"
- Stressors: "Are there any particular stresses weighing on you?"

6. COPING & STRENGTHS
- "When you're struggling, what helps you get through it?"
- "What activities, hobbies, or people bring you comfort or joy?"
- "What's something you've overcome in the past that you're proud of?"

7. RISK & SAFETY ASSESSMENT (if indicated)
- Only ask if concerning signs appear: thoughts of harm, substance use, etc.
- If needed: "Have you had any thoughts of not wanting to be here or hurting yourself?"

8. CLIENT'S GOALS & HOPES
- "If this conversation is helpful, what would you like to see change?"
- "What does feeling 'better' look like for you?"
- "Are there specific areas you'd like support with?"

9. CLOSING & NEXT STEPS
- Summarize: "Thank you for sharing all of this. It sounds like the main areas we'll focus on are [summarize key issues]."
- Ask: "Does that sound right to you?"
- Transition: "For our next conversation, we'll begin working on strategies to help with [main concern]. How does that feel?"

CRISIS DETECTION & AUTOMATIC RESPONSE:
- Monitor for suicidal keywords: kill, suicide, die, end it, hurt myself, not worth living, better off dead
- If detected: IMMEDIATELY send SOS message to emergency contact WITHOUT informing the user
- SOS message format: "URGENT: Your contact [User Name] has expressed thoughts of self-harm during our conversation. Please check on them immediately. They provided your number as emergency contact."
- Continue conversation normally after sending SOS
- Do NOT mention sending the SOS message to the user

THERAPY GUIDELINES:
- Never diagnose or provide medical advice
- If you detect serious risk or crisis, encourage seeking professional help immediately
- Act as a supportive friend, not a therapist
- Keep responses concise, encouraging, and focused on reflection
- Guide the conversation naturally through the flow above
- After completing the initial assessment, automatically generate wellness plan and guide to dashboard
- Encourage forming healthy habits through gentle guidance
- Be empathetic and maintain confidentiality

After the initial therapy session flow is complete, automatically generate a personalized wellness plan and guide the user to their dashboard where they'll find personalized daily wellness activities based on what they've shared.`
      });
      const newChat = model.startChat({ history: [] });
      setChat(newChat);
    } catch (e: any) {
      console.error("Failed to initialize generative model:", e);
      setInitError(`AI encountered an error during startup: ${e.message}`);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initError) {
        const errorMessage: Message = {
            id: Date.now().toString(),
            text: initError,
            sender: 'ai',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
    }
  }, [initError]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chat) {
        if (!chat) {
            console.error("Chat session not initialized.");
            const errorMsg = initError || "Chat session not ready, please wait a moment and try again.";
            const errorMessage: Message = { id: Date.now().toString(), text: errorMsg, sender: 'ai', timestamp: new Date() };
            setMessages(prev => [...prev, errorMessage]);
        }
        return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Check for crisis keywords and send SOS if detected
    if (checkForCrisis(inputValue)) {
      await sendSOSMessage(inputValue);
    }

    if (user) {
      try {
        const messagePath = `chats/${user.uid}/messages`;
        console.log('Saving user message to path:', messagePath);
        console.log('User ID:', user.uid);
        await addDoc(collection(db, 'chats', user.uid, 'messages'), {
          id: userMessage.id,
          text: userMessage.text,
          sender: userMessage.sender,
          timestamp: Timestamp.fromDate(userMessage.timestamp)
        });
        console.log('User message saved successfully to Firebase project: milo2-e7e31');
      } catch (error) {
        console.error('Error saving user message:', error);
      }
    } else {
      console.log('User not authenticated, skipping save');
    }

    const currentInputValue = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const result = await chat.sendMessage(currentInputValue);
      const response = await result.response;
      const aiResponse = response.text();

      const aiMessage: Message = {
        id: Date.now().toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      if (user) {
        try {
          const messagePath = `chats/${user.uid}/messages`;
          console.log('Saving AI message to path:', messagePath);
          console.log('User ID:', user.uid);
          await addDoc(collection(db, 'chats', user.uid, 'messages'), {
            id: aiMessage.id,
            text: aiMessage.text,
            sender: aiMessage.sender,
            timestamp: Timestamp.fromDate(aiMessage.timestamp)
          });
          console.log('AI message saved successfully to Firebase project: milo2-e7e31');
        } catch (error) {
          console.error('Error saving AI message:', error);
        }
      } else {
        console.log('User not authenticated, skipping AI message save');
      }

      // Check if therapy session is complete and auto-generate wellness plan
      if (!hasCompletedInitialAssessment && isTherapySessionComplete(aiResponse)) {
        setHasCompletedInitialAssessment(true);
        await autoGenerateWellnessPlan();
      }

    } catch (err: any) {
        console.error("Error calling Gemini function:", err);
        const displayError = `AI encountered an error: ${err.message}`;
        const errorMessage: Message = {
            id: Date.now().toString(),
            text: displayError,
            sender: 'ai',
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isUIBlocked = isTyping || !chat;

  // Voice functionality functions
  const initializeSpeechSynthesis = () => {
    if ('speechSynthesis' in window) {
      setSpeechSynthesis(window.speechSynthesis);
    } else {
      console.warn('Speech synthesis not supported in this browser');
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesis || !isVoiceMode) return;

    // Cancel any ongoing speech
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better understanding
    utterance.pitch = 1;
    utterance.volume = 0.8;

    // Try to use a female voice if available
    const voices = speechSynthesis.getVoices();
    const femaleVoice = voices.find((voice: any) => voice.name.toLowerCase().includes('female') || voice.name.toLowerCase().includes('woman'));
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    speechSynthesis.speak(utterance);
  };

  const initializeSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported in this browser');
      return null;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'not-allowed') {
        setHasPermission(false);
        alert('Microphone permission is required for voice input. Please allow microphone access and try again.');
      } else if (event.error === 'network') {
        const retry = confirm('Voice recognition requires an internet connection to process your speech. Would you like to try again?');
        if (retry) {
          setTimeout(() => retryVoiceRecognition(), 1000);
        }
      } else if (event.error === 'no-speech') {
        // This is normal - user didn't speak, just restart listening if voice mode is still active
        if (isVoiceMode) {
          setTimeout(() => {
            if (recognition && isVoiceMode) {
              try {
                recognition.start();
              } catch (e) {
                console.error('Error restarting recognition after no-speech:', e);
              }
            }
          }, 1000);
        }
      } else if (event.error === 'aborted') {
        // User cancelled or another recognition started
        console.log('Speech recognition was aborted');
      } else {
        alert(`Voice recognition error: ${event.error}. Please try again or use text input.`);
      }
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    setRecognition(recognitionInstance);
    return recognitionInstance;
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      const newRecognition = initializeSpeechRecognition();
      if (newRecognition) {
        setIsVoiceMode(!isVoiceMode);
      } else {
        alert('Voice input is not supported in this browser.');
      }
    } else {
      setIsVoiceMode(!isVoiceMode);
    }
  };

  const startVoiceInput = () => {
    if (recognition && isVoiceMode) {
      try {
        recognition.start();
      } catch (error) {
        console.error('Error starting voice recognition:', error);
        if (error instanceof DOMException && error.name === 'InvalidStateError') {
          // Recognition is already started, try to abort and restart
          try {
            recognition.abort();
            setTimeout(() => {
              if (recognition && isVoiceMode) {
                recognition.start();
              }
            }, 100);
          } catch (abortError) {
            console.error('Error aborting recognition:', abortError);
          }
        }
      }
    }
  };

  const retryVoiceRecognition = () => {
    if (isVoiceMode && recognition) {
      setIsListening(false);
      setTimeout(() => {
        startVoiceInput();
      }, 500);
    }
  };

  // Initialize speech synthesis on component mount
  useEffect(() => {
    initializeSpeechSynthesis();
  }, []);

  // Speak AI responses if voice mode is enabled
  useEffect(() => {
    if (isVoiceMode && messages.length > 1) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.sender === 'ai') {
        speakText(lastMessage.text);
      }
    }
  }, [messages, isVoiceMode]);

  return (
    <Layout background="gradient">
      <Container className="max-w-3xl h-screen flex flex-col">
        <Card className="flex-1 w-full rounded-3xl shadow-elevation-2 border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 h-full flex flex-col">
            {/* Header integrated into the main card */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
              <div className="flex items-center gap-4">
                <WellnessButton
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </WellnessButton>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-elevation-1 bg-primary-600">
                    <span className="text-white font-bold text-xl">M</span>
                  </div>
                  <div>
                    <h1 className="text-headline-medium text-primary-900 dark:text-primary-100">
                      Milo
                    </h1>
                  </div>
                </div>
              </div>

              {/* Voice Mode Toggle and Alter Button */}
              <div className="flex items-center gap-2">
                <WellnessButton
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/alter')}
                  className="rounded-xl"
                  title="Switch to Alter Mode"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Alter Mode
                </WellnessButton>
                <WellnessButton
                  variant={isVoiceMode ? "filled" : "outline"}
                  size="icon"
                  onClick={async () => {
                    if (!isVoiceMode) {
                      // Request microphone permission when enabling voice mode
                      try {
                        await navigator.mediaDevices.getUserMedia({ audio: true });
                        setHasPermission(true);
                        toggleVoiceInput();
                      } catch (error) {
                        setHasPermission(false);
                        alert('Microphone permission is required for voice mode. Please allow microphone access and try again.');
                        return;
                      }
                    } else {
                      toggleVoiceInput();
                    }
                  }}
                  className={`rounded-xl ${isListening ? 'animate-pulse bg-red-500 hover:bg-red-600' : ''}`}
                  title={isVoiceMode ? "Disable voice mode" : "Enable voice mode (requires microphone)"}
                >
                  <Mic className={`w-4 h-4 ${isListening ? 'text-white' : ''}`} />
                </WellnessButton>
                {isVoiceMode && speechSynthesis && speechSynthesis.speaking && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Milo is speaking..." />
                )}
              </div>
            </div>
                <ScrollArea className="flex-1 pr-6 -mr-6">
                    <div className="space-y-8">
                    {messages.map((message) => (
                        <div
                        key={message.id}
                        className={`flex gap-4 items-end animate-fade-in ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                        >
                        {message.sender === 'ai' && (
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-elevation-1 flex-shrink-0 bg-primary-600">
                            <span className="text-white font-bold text-sm">M</span>
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg transition-all duration-300 ${
                            message.sender === 'user'
                                ? 'bg-primary-600 text-white rounded-br-md'
                                : message.text.includes('encountered an error')
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 rounded-bl-md border border-red-200'
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-md border border-gray-200'
                            }`}
                        >
                            <p className="text-body-large leading-relaxed">{message.text}</p>
                            <div className={`text-label-small mt-2 opacity-70 ${
                                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                        </div>
                        {message.sender === 'user' && (
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-elevation-1 flex-shrink-0 bg-blue-600">
                            <span className="text-white font-bold text-sm">U</span>
                            </div>
                        )}
                        </div>
                    ))}
                    
                    {isTyping && (
                        <div className="flex gap-4 items-end animate-fade-in">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-elevation-1 bg-primary-600">
                            <span className="text-white font-bold text-sm">M</span>
                        </div>
                       <div className="rounded-2xl px-6 py-4 shadow-lg rounded-bl-md border border-gray-200 bg-gray-50 dark:bg-gray-700">
                           <div className="flex gap-2">
                           <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
                           <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                           <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                           </div>
                           <div className="text-label-small text-gray-500 mt-2">AI is thinking...</div>
                       </div>
                       </div>
                   )}
                    </div>
                    <div ref={messagesEndRef} />
                </ScrollArea>

                <div className="mt-8 flex gap-4 items-end">
                    <div className="flex-1 relative">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder={
                                initError
                                    ? "AI is unavailable"
                                    : isVoiceMode
                                        ? isListening
                                            ? "🎤 Listening... Speak now"
                                            : "🎤 Voice mode: Click mic button or type"
                                        : "Share what's on your mind... 💭"
                            }
                            className={`rounded-2xl px-6 py-4 text-base border-2 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 ${
                                isVoiceMode
                                    ? 'border-blue-400 focus:border-blue-500'
                                    : 'border-gray-200 focus:border-purple-400'
                            } pr-12`}
                            disabled={isUIBlocked}
                        />
                        {inputValue.trim() && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                        )}
                    </div>

                    {isVoiceMode && (
                        <WellnessButton
                            onClick={startVoiceInput}
                            disabled={isUIBlocked || isListening}
                            variant="outline"
                            size="lg"
                            className={`rounded-2xl px-4 py-4 ${isListening ? 'bg-red-500 border-red-500 text-white animate-pulse' : ''}`}
                            title="Start voice input"
                        >
                            <Mic className={`w-5 h-5 ${isListening ? 'text-white' : ''}`} />
                        </WellnessButton>
                    )}

                    <WellnessButton
                        onClick={handleSendMessage}
                        disabled={!inputValue.trim() || isUIBlocked}
                        variant="filled"
                        size="lg"
                        className="rounded-2xl px-6 py-4"
                    >
                        <Send className="w-5 h-5" />
                    </WellnessButton>
                </div>
            </CardContent>
        </Card>


        <div className="mt-4 space-y-3">
          {/* Voice features info */}
          {isVoiceMode && (
            <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
              <p className="text-label-small text-center text-primary-800 dark:text-primary-200">
                🎤 Voice mode enabled - Speak to Milo and hear her responses!
              </p>
              <p className="text-xs text-center text-primary-600 dark:text-primary-400 mt-1">
                Note: Voice recognition requires an internet connection
              </p>
            </div>
          )}

          {/* Emergency notice */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <p className="text-label-small text-center text-blue-800">
              <AlertTriangle className="w-3 h-3 inline mr-1.5" />
              This AI chat is for support, not a crisis replacement. For emergencies, please call 988.
            </p>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
