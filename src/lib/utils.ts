import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CATEGORY_ICONS, DIFFICULTY_COLORS, POKEMON_TYPE_COLORS, MOOD_COLORS } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || '💡'
}

export function getDifficultyColor(difficulty: string): string {
  return DIFFICULTY_COLORS[difficulty as keyof typeof DIFFICULTY_COLORS] || 'bg-gray-100 text-gray-800'
}

export function getPokemonTypeColor(type: string): string {
  return POKEMON_TYPE_COLORS[type as keyof typeof POKEMON_TYPE_COLORS] || 'bg-gray-400'
}

export function getMoodColor(mood: string): string {
  return MOOD_COLORS[mood as keyof typeof MOOD_COLORS] || 'text-gray-500'
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function calculateAverageLevel(pokemon: Array<{ level: number }>): number {
  if (pokemon.length === 0) return 0
  return Math.round(pokemon.reduce((sum, p) => sum + p.level, 0) / pokemon.length)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
