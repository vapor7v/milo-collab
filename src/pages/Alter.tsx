import React, { useState, useRef, useEffect } from 'react';
import { Layout, Container } from '@/components/Layout';
import { WellnessButton } from '@/components/WellnessButton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Trash2, MessageCircle } from 'lucide-react';
import { getGenerativeAIService, db } from '@/integrations/firebase/client';
import { doc, collection, addDoc, Timestamp, getDoc, setDoc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import type { ChatSession } from '@google/generative-ai';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface Alter {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

export default function Alter() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alters, setAlters] = useState<Alter[]>([]);
  const [selectedAlter, setSelectedAlter] = useState<Alter | null>(null);
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAddAlter, setShowAddAlter] = useState(false);
  const [newAlterName, setNewAlterName] = useState('');
  const [isGeneratingPersonality, setIsGeneratingPersonality] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user's alters from Firebase
  useEffect(() => {
    if (user) {
      loadAlters();
    }
  }, [user]);

  const loadAlters = async () => {
    if (!user) return;

    try {
      const altersRef = collection(db, 'users', user.uid, 'alters');
      const altersSnapshot = await getDocs(altersRef);
      const altersData = altersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Alter[];

      setAlters(altersData);
    } catch (error) {
      console.error('Error loading alters:', error);
    }
  };

  const generateCharacterPersonality = async (characterName: string): Promise<string> => {
    try {
      const generativeAI = getGenerativeAIService();
      if (!generativeAI) {
        throw new Error("AI service not available");
      }

      const model = generativeAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
      const prompt = `Create a detailed personality description for the fictional character "${characterName}". Include their:
- Core personality traits
- Speech patterns and mannerisms
- Background and motivations
- Typical behavior and reactions
- Any distinctive characteristics

Keep it concise but comprehensive. Focus on well-known characters if it's a famous one, or create a plausible personality if it's original.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Error generating personality:', error);
      return `A mysterious character named ${characterName} with unique personality traits and interesting background.`;
    }
  };

  const addAlter = async () => {
    if (!user || !newAlterName.trim() || alters.length >= 3) return;

    setIsGeneratingPersonality(true);

    try {
      // Generate personality using AI
      const generatedDescription = await generateCharacterPersonality(newAlterName.trim());

      const alterData = {
        name: newAlterName.trim(),
        description: generatedDescription,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'alters'), alterData);

      const newAlter: Alter = {
        id: docRef.id,
        ...alterData,
        createdAt: new Date()
      };

      setAlters(prev => [...prev, newAlter]);
      setNewAlterName('');
      setShowAddAlter(false);
    } catch (error) {
      console.error('Error adding alter:', error);
    } finally {
      setIsGeneratingPersonality(false);
    }
  };

  const removeAlter = async (alterId: string) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'alters', alterId));

      // Also delete chat history for this alter
      const chatHistoryRef = collection(db, 'users', user.uid, 'alterChats', alterId, 'messages');
      const chatSnapshot = await getDocs(chatHistoryRef);
      chatSnapshot.docs.forEach(async (doc) => {
        await deleteDoc(doc.ref);
      });

      setAlters(prev => prev.filter(alter => alter.id !== alterId));

      if (selectedAlter?.id === alterId) {
        setSelectedAlter(null);
        setMessages([]);
        setChat(null);
      }
    } catch (error) {
      console.error('Error removing alter:', error);
    }
  };

  const selectAlter = async (alter: Alter) => {
    setSelectedAlter(alter);
    setMessages([]);

    // Initialize chat session for this alter
    try {
      const generativeAI = getGenerativeAIService();
      if (!generativeAI) {
        console.warn("Google AI service not available");
        return;
      }

      const model = generativeAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
        systemInstruction: `You are role-playing as ${alter.name}. ${alter.description}

You are an AI companion that stays in character as ${alter.name} throughout the entire conversation. Respond in character, using their personality, speech patterns, and mannerisms described in the character description.

Key guidelines:
- Stay completely in character as ${alter.name}
- Use appropriate language, references, and mannerisms for this character
- Be engaging and interactive
- Maintain the character's personality consistently
- If the character has specific traits, abilities, or background, incorporate them naturally

Remember: You are ${alter.name}, not an AI. Never break character or mention being an AI.`
      });

      const newChat = model.startChat({ history: [] });
      setChat(newChat);

    } catch (error) {
      console.error("Failed to initialize alter chat:", error);
    }
  };


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chat || !selectedAlter || !user) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Save user message
    try {
      await addDoc(collection(db, 'users', user.uid, 'alterChats', selectedAlter.id, 'messages'), {
        id: userMessage.id,
        text: userMessage.text,
        sender: userMessage.sender,
        timestamp: Timestamp.fromDate(userMessage.timestamp)
      });
    } catch (error) {
      console.error('Error saving user message:', error);
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

      // Save AI message
      try {
        await addDoc(collection(db, 'users', user.uid, 'alterChats', selectedAlter.id, 'messages'), {
          id: aiMessage.id,
          text: aiMessage.text,
          sender: aiMessage.sender,
          timestamp: Timestamp.fromDate(aiMessage.timestamp)
        });
      } catch (error) {
        console.error('Error saving AI message:', error);
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

  return (
    <Layout background="gradient">
      <Container className="max-w-6xl min-h-screen max-h-screen flex flex-col">
        <Card className="flex-1 w-full rounded-3xl shadow-elevation-2 border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
              <div className="flex items-center gap-4">
                <WellnessButton
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/aichat')}
                  className="hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  <ArrowLeft className="w-5 h-5" />
                </WellnessButton>
                <div>
                  <h1 className="text-headline-medium text-primary-900 dark:text-primary-100">
                    Alter Mode
                  </h1>
                  <p className="text-body-small text-gray-600">
                    Chat with your fictional character alters
                  </p>
                </div>
              </div>

            </div>

            {/* Alter Selector and Chat */}
            <div className="flex flex-col h-full">
              {/* Alter Selector Bar */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200/50">
                <div className="flex items-center gap-4">
                  <h2 className="text-title-large">Alter Chat</h2>
                  {alters.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Switch to:</span>
                      <select
                        value={selectedAlter?.id || ''}
                        onChange={(e) => {
                          const alter = alters.find(a => a.id === e.target.value);
                          if (alter) selectAlter(alter);
                        }}
                        className="px-3 py-1 border rounded-lg text-sm bg-white"
                      >
                        <option value="">Select Alter</option>
                        {alters.map((alter) => (
                          <option key={alter.id} value={alter.id}>
                            {alter.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {selectedAlter && (
                    <WellnessButton
                      variant="outline"
                      size="sm"
                      onClick={() => removeAlter(selectedAlter.id)}
                      className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove
                    </WellnessButton>
                  )}
                </div>
              </div>

              {/* Chat Area */}
              {selectedAlter ? (
                <>
                  <ScrollArea className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 350px)' }}>
                    <div className="space-y-8 p-4 pb-8">
                      {messages.length === 0 && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-elevation-1 bg-purple-600 mx-auto mb-6">
                            <span className="text-white font-bold text-2xl">
                              {selectedAlter.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-headline-small mb-2">Start chatting with {selectedAlter.name}</h3>
                          <p className="text-body-large text-gray-600">Say hello and begin your conversation!</p>
                        </div>
                      )}

                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-4 items-end animate-fade-in ${
                            message.sender === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {message.sender === 'ai' && (
                            <div className="w-12 h-12 rounded-3xl flex items-center justify-center shadow-elevation-1 bg-purple-600 flex-shrink-0">
                              <span className="text-white font-bold text-lg">
                                {selectedAlter.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-3xl px-6 py-4 shadow-lg transition-all duration-300 ${
                              message.sender === 'user'
                                ? 'bg-primary-600 text-white rounded-br-md'
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
                            <div className="w-12 h-12 rounded-3xl flex items-center justify-center shadow-elevation-1 bg-blue-600 flex-shrink-0">
                              <span className="text-white font-bold text-lg">U</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {isTyping && (
                        <div className="flex gap-4 items-end animate-fade-in">
                          <div className="w-12 h-12 rounded-3xl flex items-center justify-center shadow-elevation-1 bg-purple-600">
                            <span className="text-white font-bold text-lg">
                              {selectedAlter.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="rounded-3xl px-6 py-4 shadow-lg rounded-bl-md border border-gray-200 bg-gray-50 dark:bg-gray-700">
                            <div className="flex gap-2">
                              <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" />
                              <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                              <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            </div>
                            <div className="text-label-small text-gray-500 mt-2">{selectedAlter.name} is thinking...</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>

                  <div className="flex-shrink-0 mt-6 flex gap-4 items-end pb-6">
                    <div className="flex-1 relative">
                      <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Chat with ${selectedAlter.name}...`}
                        className="rounded-3xl px-6 py-4 text-base border-2 bg-white/90 backdrop-blur-sm shadow-lg transition-all duration-300 border-gray-200 focus:border-purple-400 pr-12"
                        disabled={isTyping}
                      />
                      {inputValue.trim() && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        </div>
                      )}
                    </div>

                    <WellnessButton
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      variant="filled"
                      size="lg"
                      className="rounded-3xl px-6 py-4 flex-shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </WellnessButton>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="w-20 h-20 mx-auto mb-6 text-gray-400" />
                    <h3 className="text-headline-medium mb-4">No Alter Selected</h3>
                    <p className="text-body-large text-gray-600 mb-6">
                      {alters.length === 0
                        ? "Create your first alter to start chatting with fictional characters!"
                        : "Select an alter from the dropdown above to begin chatting."
                      }
                    </p>
                    {alters.length < 3 && (
                      <WellnessButton
                        variant="filled"
                        onClick={() => setShowAddAlter(true)}
                        className="rounded-2xl px-6 py-3"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        {alters.length === 0 ? 'Add Your First Alter' : 'Add Another Alter'}
                      </WellnessButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Alter Modal */}
        {showAddAlter && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-96 mx-4">
              <CardContent className="p-6">
                <h3 className="text-title-large mb-4">Add New Alter</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Character Name</label>
                    <Input
                      value={newAlterName}
                      onChange={(e) => setNewAlterName(e.target.value)}
                      placeholder="e.g., Sherlock Holmes, Yoda, Batman"
                      className="w-full"
                      disabled={isGeneratingPersonality}
                    />
                  </div>

                  {isGeneratingPersonality && (
                    <div className="text-center py-4">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                        Generating character personality...
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <WellnessButton
                    variant="outline"
                    onClick={() => {
                      if (!isGeneratingPersonality) {
                        setShowAddAlter(false);
                        setNewAlterName('');
                      }
                    }}
                    disabled={isGeneratingPersonality}
                    className="flex-1"
                  >
                    Cancel
                  </WellnessButton>
                  <WellnessButton
                    variant="filled"
                    onClick={addAlter}
                    disabled={!newAlterName.trim() || isGeneratingPersonality}
                    className="flex-1"
                  >
                    {isGeneratingPersonality ? 'Generating...' : 'Add Alter'}
                  </WellnessButton>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </Container>
    </Layout>
  );
}