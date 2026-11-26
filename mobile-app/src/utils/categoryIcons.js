// Categories store an emoji (shared with the web client). The app draws it as an Ionicons line icon.
const ICONS = {
  '💰': 'wallet-outline', '🍽️': 'restaurant-outline', '🏠': 'home-outline', '✈️': 'airplane-outline',
  '💳': 'card-outline', '🛍️': 'bag-handle-outline', '🚗': 'car-outline', '🏥': 'medkit-outline',
  '🎬': 'film-outline', '📚': 'book-outline', '⚡': 'flash-outline', '🍕': 'pizza-outline',
  '☕': 'cafe-outline', '🎮': 'game-controller-outline', '🏋️': 'barbell-outline', '💄': 'brush-outline',
  '👕': 'shirt-outline', '📱': 'phone-portrait-outline', '💻': 'laptop-outline', '🎵': 'musical-notes-outline',
  '🎨': 'color-palette-outline', '🌱': 'leaf-outline', '📝': 'pricetag-outline',
};

// Ignore emoji variation selectors so stored values always match
const strip = (e) => (e || '').replace(/️/g, '');
const BY_KEY = Object.fromEntries(Object.entries(ICONS).map(([k, v]) => [strip(k), v]));

export const iconForCategory = (emoji) => BY_KEY[strip(emoji)] || 'pricetag-outline';
export const CATEGORY_EMOJI = Object.keys(ICONS).filter((e) => e !== '📝');
