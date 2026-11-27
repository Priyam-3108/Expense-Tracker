import {
  Wallet, UtensilsCrossed, Home, Plane, CreditCard, ShoppingBag, Car, HeartPulse,
  Clapperboard, BookOpen, Zap, Pizza, Coffee, Gamepad2, Dumbbell, Brush, Shirt,
  Smartphone, Laptop, Music, Palette, Sprout, Tag,
} from 'lucide-react'

// Categories store an emoji (shared with the mobile app). The web draws it as a line icon.
const ICONS = {
  '💰': Wallet, '🍽️': UtensilsCrossed, '🏠': Home, '✈️': Plane, '💳': CreditCard,
  '🛍️': ShoppingBag, '🚗': Car, '🏥': HeartPulse, '🎬': Clapperboard, '📚': BookOpen,
  '⚡': Zap, '🍕': Pizza, '☕': Coffee, '🎮': Gamepad2, '🏋️': Dumbbell, '💄': Brush,
  '👕': Shirt, '📱': Smartphone, '💻': Laptop, '🎵': Music, '🎨': Palette, '🌱': Sprout,
  '📝': Tag,
}

// Ignore emoji variation selectors so stored values always match
const strip = (e) => (e || '').replace(/️/g, '')
const BY_KEY = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [strip(k), v]))
export const iconFor = (emoji) => BY_KEY[strip(emoji)] || Tag

export default function CategoryIcon({ icon, size = 16, className = '' }) {
  const Icon = iconFor(icon)
  return <Icon size={size} strokeWidth={1.5} className={className} aria-hidden="true" />
}

// Neutral tile holding the icon, used in lists
export function CategoryTile({ icon, size = 'md' }) {
  const box = size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-[10px]'
  return (
    <span className={`${box} shrink-0 flex items-center justify-center bg-gray-100 dark:bg-[#232325] text-gray-600 dark:text-[#a1a1a6]`}>
      <CategoryIcon icon={icon} size={size === 'sm' ? 16 : 18} />
    </span>
  )
}
