import { useState } from 'react';
import { useEmotionalAvatar } from '@/hooks/useEmotionalAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Heart,
  MessageCircle,
  Palette,
  Sparkles,
  Send,
  Smile
} from 'lucide-react';
import { toast } from 'sonner';

export const EmotionalAvatar = () => {
  const {
    avatarAppearance,
    currentEmotion,
    conversation,
    loading,
    getAvatarEmoji,
    generateAvatarResponse,
    updateAppearance
  } = useEmotionalAvatar();

  const [message, setMessage] = useState('');
  const [showCustomize, setShowCustomize] = useState(false);
  const [selectedHairColor, setSelectedHairColor] = useState('#8B4513');
  const [selectedSkinTone, setSelectedSkinTone] = useState('#FDBCB4');
  const [selectedEyeColor, setSelectedEyeColor] = useState('#4169E1');

  const hairColors = ['#8B4513', '#000000', '#FFD700', '#FF6347', '#9370DB'];
  const skinTones = ['#FDBCB4', '#E0AC69', '#C68642', '#8D5524', '#654321'];
  const eyeColors = ['#4169E1', '#228B22', '#8B4513', '#DC143C', '#9370DB'];

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage('');

    // Add user message to conversation immediately
    const tempUserMessage = {
      id: 'temp',
      message: userMessage,
      emotion: currentEmotion,
      timestamp: new Date(),
      isUserMessage: true
    };

    // Generate avatar response
    const response = await generateAvatarResponse(userMessage);
    toast.success('Avatar responded!');
  };

  const handleCustomizeAvatar = () => {
    updateAppearance({
      hairColor: selectedHairColor,
      skinTone: selectedSkinTone,
      eyeColor: selectedEyeColor
    });
    setShowCustomize(false);
    toast.success('Avatar customized!');
  };

  const getEmotionColor = (mood: string) => {
    switch (mood) {
      case 'happy': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'excited': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'sad': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'anxious': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'angry': return 'text-red-600 bg-red-50 border-red-200';
      case 'calm': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 border-2 border-pink-200 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-white/20 rounded-full">
            <Heart className="h-6 w-6" />
          </div>
          <span>Emotional Avatar</span>
          <Smile className={`h-5 w-5 animate-pulse`} />
        </CardTitle>
        <p className="text-pink-100 text-sm">
          Your emotional companion that feels with you 🤗✨
        </p>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Avatar Display */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="text-8xl mb-4 animate-bounce">
              {getAvatarEmoji()}
            </div>

            {/* Emotion Indicator */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 ${getEmotionColor(currentEmotion.mood)}`}>
              <div className={`w-3 h-3 rounded-full animate-pulse`} style={{ backgroundColor: currentEmotion.colorScheme }}></div>
              <span className="font-medium capitalize">{currentEmotion.mood}</span>
              <Badge variant="secondary" className="text-xs">
                {currentEmotion.intensity}/10
              </Badge>
            </div>
          </div>

          <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
            <p className="text-gray-700 italic">
              "{currentEmotion.expression} • {currentEmotion.bodyLanguage}"
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog open={showCustomize} onOpenChange={setShowCustomize}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white/80 hover:bg-white">
                <Palette className="h-4 w-4 mr-2" />
                Customize
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Customize Your Avatar</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Hair Color</label>
                  <div className="flex gap-2">
                    {hairColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedHairColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedHairColor === color ? 'border-purple-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Skin Tone</label>
                  <div className="flex gap-2">
                    {skinTones.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedSkinTone(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedSkinTone === color ? 'border-purple-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Eye Color</label>
                  <div className="flex gap-2">
                    {eyeColors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedEyeColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          selectedEyeColor === color ? 'border-purple-500' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <Button onClick={handleCustomizeAvatar} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            onClick={() => generateAvatarResponse("How are you feeling today?")}
            disabled={loading}
            className="bg-white/80 hover:bg-white"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat
          </Button>
        </div>

        {/* Message Input */}
        <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share how you're feeling..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !message.trim()}
              className="bg-pink-600 hover:bg-pink-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Recent Conversation */}
        {conversation.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-pink-600" />
              Recent Conversation
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conversation.slice(-5).map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    msg.isUserMessage
                      ? 'bg-purple-100 ml-8'
                      : 'bg-pink-100 mr-8'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {msg.isUserMessage ? '👤' : getAvatarEmoji()}
                    </span>
                    <span className="text-xs text-gray-600">
                      {msg.timestamp.toDate().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-900">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Avatar Stats */}
        <div className="bg-white/70 rounded-lg p-4 backdrop-blur-sm">
          <h4 className="font-semibold text-gray-900 mb-3">Avatar Insights</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500"></div>
              <span>Conversations: {conversation.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span>Current Mood: {currentEmotion.mood}</span>
            </div>
          </div>
        </div>

        {/* Mood History Indicator */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Your avatar evolves with your emotional journey 💝
          </p>
        </div>
      </CardContent>
    </Card>
  );
};