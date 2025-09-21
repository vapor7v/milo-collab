import React, { useState, useEffect } from 'react';
import { usePokemon, usePokemonMood } from '../hooks/usePokemon';
import { PokemonService } from '../services/pokemonService';
import { PokemonCard } from './PokemonCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, RotateCcw } from 'lucide-react';

const pokemonService = PokemonService.getInstance();

interface PokemonCompanionProps {
  currentMood?: string;
  onCompanionInteract?: (message: string) => void;
}

export const PokemonCompanion: React.FC<PokemonCompanionProps> = ({
  currentMood = 'neutral',
  onCompanionInteract
}) => {
  const { userPokemon, updatePokemonMood } = usePokemon();
  const { syncWithUserMood } = usePokemonMood();

  const [activeCompanion, setActiveCompanion] = useState<string | null>(null);
  const [companionMessage, setCompanionMessage] = useState('');

  // Select the most appropriate companion based on mood
  useEffect(() => {
    if (userPokemon.length === 0) return;

    const moodPokemon = pokemonService.getPokemonForMood(currentMood);
    const userMoodPokemon = userPokemon.filter(up =>
      moodPokemon.some(mp => mp.id === up.pokemonId)
    );

    if (userMoodPokemon.length > 0) {
      // Pick the highest level Pokemon for this mood
      const bestCompanion = userMoodPokemon.reduce((best, current) =>
        current.level > best.level ? current : best
      );
      setActiveCompanion(bestCompanion.pokemonId);
    } else if (userPokemon.length > 0) {
      // Fallback to any Pokemon
      setActiveCompanion(userPokemon[0].pokemonId);
    }
  }, [currentMood, userPokemon]);

  // Generate companion messages based on mood
  useEffect(() => {
    if (!activeCompanion) return;

    const messages = {
      happy: [
        "I'm so glad you're feeling good! 🌟",
        "Your positive energy is contagious! ✨",
        "Keep that smile going! 😊",
        "I'm here celebrating with you! 🎉"
      ],
      sad: [
        "I'm here for you, friend. 🤗",
        "It's okay to feel this way. I'm listening. 💙",
        "You're not alone in this. 🌱",
        "Take your time, I'm right here. 🌸"
      ],
      anxious: [
        "Let's take some deep breaths together. 🌊",
        "You're stronger than you know. 💪",
        "One step at a time, we've got this! 🌟",
        "I'm here to help you through this. 🤝"
      ],
      excited: [
        "Wow! Your energy is amazing! ⚡",
        "This excitement is contagious! 🎈",
        "Let's channel this energy positively! 🚀",
        "I'm excited right along with you! 🎊"
      ],
      calm: [
        "Peace and tranquility surround us. 🧘",
        "This moment of calm is precious. 🌸",
        "Let's enjoy this peaceful feeling. 🌙",
        "Your calm energy is beautiful. ✨"
      ],
      neutral: [
        "I'm here whenever you need me. 👋",
        "How are you feeling today? 💭",
        "I'm your wellness companion! 🌟",
        "Let's work on feeling our best together! 💪"
      ]
    };

    const moodMessages = messages[currentMood as keyof typeof messages] || messages.neutral;
    const randomMessage = moodMessages[Math.floor(Math.random() * moodMessages.length)];
    setCompanionMessage(randomMessage);
  }, [activeCompanion, currentMood]);

  const handleInteract = async () => {
    if (!activeCompanion) return;

    await updatePokemonMood(activeCompanion, currentMood);
    onCompanionInteract?.(companionMessage);
  };

  const handleRefreshCompanion = () => {
    if (userPokemon.length === 0) return;

    const randomPokemon = userPokemon[Math.floor(Math.random() * userPokemon.length)];
    setActiveCompanion(randomPokemon.pokemonId);
  };

  if (userPokemon.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <div className="text-6xl mb-4">🤔</div>
          <h3 className="font-semibold mb-2">No Pokemon Companions Yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Unlock your first Pokemon companion to start your wellness journey!
          </p>
          <Button variant="outline" size="sm">
            Visit Pokemon Collection
          </Button>
        </CardContent>
      </Card>
    );
  }

  const companion = activeCompanion ? pokemonService.getPokemonById(activeCompanion) : null;
  const userCompanion = activeCompanion ? userPokemon.find(up => up.pokemonId === activeCompanion) : null;

  if (!companion || !userCompanion) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Companion</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshCompanion}
            className="p-1"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-center">
          <PokemonCard
            pokemon={companion}
            userPokemon={userCompanion}
            size="large"
            showStats={false}
          />
        </div>

        <div className="text-center">
          <h3 className="font-semibold text-lg mb-1">{companion.name}</h3>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge variant="secondary">Level {userCompanion.level}</Badge>
            <Badge
              variant="outline"
              className={`capitalize ${
                userCompanion.mood === 'happy' ? 'border-yellow-500 text-yellow-700' :
                userCompanion.mood === 'sad' ? 'border-blue-500 text-blue-700' :
                userCompanion.mood === 'excited' ? 'border-red-500 text-red-700' :
                userCompanion.mood === 'calm' ? 'border-green-500 text-green-700' :
                'border-gray-500 text-gray-700'
              }`}
            >
              {userCompanion.mood}
            </Badge>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-center italic">
            "{companionMessage}"
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleInteract}
            className="flex-1"
            variant="default"
          >
            <Heart className="w-4 h-4 mr-2" />
            Connect
          </Button>
          <Button
            onClick={() => onCompanionInteract?.(companionMessage)}
            variant="outline"
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};