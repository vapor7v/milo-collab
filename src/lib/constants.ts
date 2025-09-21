// Constants for the MiloPhone application

export const MOOD_OPTIONS = ['happy', 'sad', 'anxious', 'excited', 'calm'] as const;

export const ACTIVITY_TYPES = [
  { activity: 'journal_entry', label: 'Journal' },
  { activity: 'meditation', label: 'Meditate' },
  { activity: 'exercise', label: 'Exercise' }
] as const;

export const CATEGORY_ICONS = {
  meditation: '🧘‍♀️',
  exercise: '🏃‍♀️',
  nutrition: '🥗',
  sleep: '😴',
  social: '👥',
  mindfulness: '🧘‍♀️',
  physical: '🏃‍♀️',
  cognitive: '🧠',
  emotional: '❤️'
} as const;

export const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
} as const;

export const POKEMON_TYPE_COLORS = {
  Fire: 'bg-red-500',
  Water: 'bg-blue-500',
  Grass: 'bg-green-500',
  Electric: 'bg-yellow-500',
  Psychic: 'bg-purple-500',
  Ice: 'bg-cyan-500',
  Fighting: 'bg-red-600',
  Poison: 'bg-purple-600',
  Ground: 'bg-yellow-600',
  Flying: 'bg-indigo-500',
  Bug: 'bg-green-600',
  Rock: 'bg-gray-600',
  Ghost: 'bg-indigo-600',
  Dragon: 'bg-indigo-700',
  Dark: 'bg-gray-700',
  Steel: 'bg-gray-500',
  Fairy: 'bg-pink-500',
  Normal: 'bg-gray-400'
} as const;

export const MOOD_COLORS = {
  happy: 'text-yellow-500',
  sad: 'text-blue-500',
  excited: 'text-red-500',
  calm: 'text-green-500'
} as const;