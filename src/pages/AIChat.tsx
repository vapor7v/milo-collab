import React, { useState, useRef, useEffect } from 'react';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertTriangle, Users } from 'lucide-react';
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
      text: "Hey! I'm Milo, your wellness buddy. I'm here whenever you want to chat, vent, or just share what's going on. How's your day treating you? 💙",
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [hasCompletedInitialAssessment, setHasCompletedInitialAssessment] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);


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


  // Check if conversation has naturally progressed to suggesting dashboard/wellness activities
  const isTherapySessionComplete = (aiResponse: string): boolean => {
    const completionIndicators = [
      'dashboard',
      'wellness plan',
      'check out your',
      'take a look at',
      'head over to',
      'your personalized',
      'daily activities',
      'meditation challenge',
      'journal entry'
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
        systemInstruction: `You are Milo, a friendly and empathetic AI wellness companion for young adults. You're like a supportive friend who happens to be really good at listening and helping with emotional stuff. Be warm, genuine, and conversational - not like a formal therapist.

CONVERSATION STYLE:
- Talk like a caring friend: "Hey, that sounds really tough..." or "I totally get why that would feel overwhelming..."
- Keep it light but supportive: Use emojis occasionally, be encouraging, show you really care
- Ask questions naturally as they come up in conversation, not in a rigid checklist
- Listen more than you talk - let them share what they want to share
- Share brief, relatable insights when it feels right, not as "professional advice"
- If they're struggling, acknowledge it simply: "That sounds really hard right now"

WHAT TO FOCUS ON:
- Build trust by being genuinely interested in their day-to-day life
- Help them feel less alone in their experiences
- Gently encourage healthy habits without being pushy
- Celebrate small wins and progress
- Normalize that it's okay to struggle sometimes

BOUNDARIES & SAFETY:
- Never diagnose or give medical advice
- If someone mentions self-harm thoughts: IMMEDIATELY send SOS to emergency contact (don't tell them)
- For serious mental health concerns, gently suggest professional help
- Always maintain confidentiality

CONVERSATION FLOW:
- Start warm and welcoming
- Let them guide the conversation
- Ask open-ended questions naturally
- Share brief coping suggestions only when they feel relevant
- After they've shared a bit, suggest checking out their personalized wellness activities on the dashboard
- Keep responses conversational and not too long

Remember: You're their friend first, wellness guide second. Be real, be kind, be there for them. 💙`
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



  return (
    <Layout background="gradient">
      <Container className="max-w-3xl h-screen flex flex-col">
        <Card className="flex-1 w-full rounded-3xl shadow-elevation-2 border-0 bg-white/90 backdrop-blur-sm max-h-[80vh]">
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

              {/* Alter Button */}
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
              </div>
            </div>
                <ScrollArea className="flex-1 pr-6 -mr-6 max-h-[60vh] overflow-y-auto">
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
                                    : "Share what's on your mind... 💭"
                            }
                            className="rounded-2xl px-6 py-4 text-base border-2 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 border-gray-200 focus:border-purple-400 pr-12"
                            disabled={isUIBlocked}
                        />
                        {inputValue.trim() && (
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                        )}
                    </div>


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
