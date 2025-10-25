/**
 * Curated emoji data for chat feature
 * Optimized for performance with categorized emojis
 * Production-ready, lightweight (no external dependencies)
 */

export interface EmojiData {
  emoji: string;
  name: string;
  category: EmojiCategory;
  keywords: string[];
}

export type EmojiCategory = 
  | "smileys"
  | "gestures"
  | "people"
  | "animals"
  | "food"
  | "activities"
  | "travel"
  | "objects"
  | "symbols"
  | "flags";

/**
 * Curated list of 100 most commonly used emojis
 * Organized by category for quick access
 */
export const EMOJI_DATA: EmojiData[] = [
  // Smileys & Emotion (20)
  { emoji: "😀", name: "grinning face", category: "smileys", keywords: ["smile", "happy"] },
  { emoji: "😃", name: "grinning face with big eyes", category: "smileys", keywords: ["smile", "happy"] },
  { emoji: "😄", name: "grinning face with smiling eyes", category: "smileys", keywords: ["smile", "happy"] },
  { emoji: "😁", name: "beaming face with smiling eyes", category: "smileys", keywords: ["smile", "happy"] },
  { emoji: "😆", name: "grinning squinting face", category: "smileys", keywords: ["laugh", "lol"] },
  { emoji: "😅", name: "grinning face with sweat", category: "smileys", keywords: ["laugh", "sweat"] },
  { emoji: "🤣", name: "rolling on the floor laughing", category: "smileys", keywords: ["rofl", "lol"] },
  { emoji: "😂", name: "face with tears of joy", category: "smileys", keywords: ["laugh", "cry"] },
  { emoji: "🙂", name: "slightly smiling face", category: "smileys", keywords: ["smile"] },
  { emoji: "😉", name: "winking face", category: "smileys", keywords: ["wink", "flirt"] },
  { emoji: "😊", name: "smiling face with smiling eyes", category: "smileys", keywords: ["smile", "blush"] },
  { emoji: "😍", name: "smiling face with heart-eyes", category: "smileys", keywords: ["love", "heart"] },
  { emoji: "🥰", name: "smiling face with hearts", category: "smileys", keywords: ["love", "hearts"] },
  { emoji: "😘", name: "face blowing a kiss", category: "smileys", keywords: ["kiss", "love"] },
  { emoji: "😎", name: "smiling face with sunglasses", category: "smileys", keywords: ["cool", "sunglasses"] },
  { emoji: "🤔", name: "thinking face", category: "smileys", keywords: ["think", "hmm"] },
  { emoji: "😮", name: "face with open mouth", category: "smileys", keywords: ["wow", "surprised"] },
  { emoji: "😢", name: "crying face", category: "smileys", keywords: ["sad", "cry"] },
  { emoji: "😭", name: "loudly crying face", category: "smileys", keywords: ["cry", "sob"] },
  { emoji: "🔥", name: "fire", category: "smileys", keywords: ["fire", "hot", "lit"] },

  // Gestures & Body Parts (15)
  { emoji: "👍", name: "thumbs up", category: "gestures", keywords: ["like", "yes", "approve"] },
  { emoji: "👎", name: "thumbs down", category: "gestures", keywords: ["dislike", "no"] },
  { emoji: "👏", name: "clapping hands", category: "gestures", keywords: ["clap", "applause"] },
  { emoji: "🙌", name: "raising hands", category: "gestures", keywords: ["celebrate", "yay"] },
  { emoji: "🤝", name: "handshake", category: "gestures", keywords: ["deal", "agreement"] },
  { emoji: "🙏", name: "folded hands", category: "gestures", keywords: ["pray", "thanks"] },
  { emoji: "💪", name: "flexed biceps", category: "gestures", keywords: ["strong", "muscle"] },
  { emoji: "✌️", name: "victory hand", category: "gestures", keywords: ["peace", "victory"] },
  { emoji: "🤞", name: "crossed fingers", category: "gestures", keywords: ["luck", "hope"] },
  { emoji: "👌", name: "OK hand", category: "gestures", keywords: ["ok", "perfect"] },
  { emoji: "✋", name: "raised hand", category: "gestures", keywords: ["stop", "hi"] },
  { emoji: "👋", name: "waving hand", category: "gestures", keywords: ["wave", "bye", "hello"] },
  { emoji: "🤚", name: "raised back of hand", category: "gestures", keywords: ["stop"] },
  { emoji: "👊", name: "oncoming fist", category: "gestures", keywords: ["fist", "bump"] },
  { emoji: "✊", name: "raised fist", category: "gestures", keywords: ["fist", "power"] },

  // People & Faces (10)
  { emoji: "🎉", name: "party popper", category: "people", keywords: ["party", "celebrate"] },
  { emoji: "🎊", name: "confetti ball", category: "people", keywords: ["party", "celebrate"] },
  { emoji: "🎈", name: "balloon", category: "people", keywords: ["party", "birthday"] },
  { emoji: "🎁", name: "wrapped gift", category: "people", keywords: ["gift", "present"] },
  { emoji: "🎂", name: "birthday cake", category: "people", keywords: ["birthday", "cake"] },
  { emoji: "💯", name: "hundred points", category: "people", keywords: ["100", "perfect"] },
  { emoji: "⭐", name: "star", category: "people", keywords: ["star", "favorite"] },
  { emoji: "✨", name: "sparkles", category: "people", keywords: ["sparkle", "shine"] },
  { emoji: "💫", name: "dizzy", category: "people", keywords: ["dizzy", "star"] },
  { emoji: "🌟", name: "glowing star", category: "people", keywords: ["star", "glow"] },

  // Animals & Nature (10)
  { emoji: "🐶", name: "dog face", category: "animals", keywords: ["dog", "puppy"] },
  { emoji: "🐱", name: "cat face", category: "animals", keywords: ["cat", "kitty"] },
  { emoji: "🦁", name: "lion", category: "animals", keywords: ["lion", "king"] },
  { emoji: "🐯", name: "tiger face", category: "animals", keywords: ["tiger"] },
  { emoji: "🦊", name: "fox", category: "animals", keywords: ["fox"] },
  { emoji: "🐻", name: "bear", category: "animals", keywords: ["bear"] },
  { emoji: "🐼", name: "panda", category: "animals", keywords: ["panda"] },
  { emoji: "🐨", name: "koala", category: "animals", keywords: ["koala"] },
  { emoji: "🦄", name: "unicorn", category: "animals", keywords: ["unicorn", "magic"] },
  { emoji: "🌈", name: "rainbow", category: "animals", keywords: ["rainbow", "color"] },

  // Food & Drink (10)
  { emoji: "🍕", name: "pizza", category: "food", keywords: ["pizza", "food"] },
  { emoji: "🍔", name: "hamburger", category: "food", keywords: ["burger", "food"] },
  { emoji: "🍟", name: "french fries", category: "food", keywords: ["fries", "food"] },
  { emoji: "🌮", name: "taco", category: "food", keywords: ["taco", "food"] },
  { emoji: "🍿", name: "popcorn", category: "food", keywords: ["popcorn", "movie"] },
  { emoji: "☕", name: "hot beverage", category: "food", keywords: ["coffee", "tea"] },
  { emoji: "🍺", name: "beer mug", category: "food", keywords: ["beer", "drink"] },
  { emoji: "🍰", name: "shortcake", category: "food", keywords: ["cake", "dessert"] },
  { emoji: "🍪", name: "cookie", category: "food", keywords: ["cookie", "snack"] },
  { emoji: "🍩", name: "doughnut", category: "food", keywords: ["donut", "sweet"] },

  // Activities & Sports (10)
  { emoji: "⚽", name: "soccer ball", category: "activities", keywords: ["soccer", "football"] },
  { emoji: "🏀", name: "basketball", category: "activities", keywords: ["basketball", "sport"] },
  { emoji: "🎮", name: "video game", category: "activities", keywords: ["game", "gaming"] },
  { emoji: "🎯", name: "direct hit", category: "activities", keywords: ["target", "goal"] },
  { emoji: "🎲", name: "game die", category: "activities", keywords: ["dice", "game"] },
  { emoji: "🎸", name: "guitar", category: "activities", keywords: ["guitar", "music"] },
  { emoji: "🎵", name: "musical note", category: "activities", keywords: ["music", "note"] },
  { emoji: "🎬", name: "clapper board", category: "activities", keywords: ["movie", "film"] },
  { emoji: "📺", name: "television", category: "activities", keywords: ["tv", "screen"] },
  { emoji: "🎥", name: "movie camera", category: "activities", keywords: ["camera", "film"] },

  // Travel & Places (10)
  { emoji: "🚀", name: "rocket", category: "travel", keywords: ["rocket", "space"] },
  { emoji: "✈️", name: "airplane", category: "travel", keywords: ["plane", "travel"] },
  { emoji: "🚗", name: "automobile", category: "travel", keywords: ["car", "drive"] },
  { emoji: "🏠", name: "house", category: "travel", keywords: ["home", "house"] },
  { emoji: "🏆", name: "trophy", category: "travel", keywords: ["trophy", "win"] },
  { emoji: "🎓", name: "graduation cap", category: "travel", keywords: ["graduate", "education"] },
  { emoji: "💼", name: "briefcase", category: "travel", keywords: ["work", "business"] },
  { emoji: "📱", name: "mobile phone", category: "travel", keywords: ["phone", "mobile"] },
  { emoji: "💻", name: "laptop", category: "travel", keywords: ["computer", "laptop"] },
  { emoji: "⌚", name: "watch", category: "travel", keywords: ["watch", "time"] },

  // Symbols & Objects (10)
  { emoji: "❤️", name: "red heart", category: "symbols", keywords: ["love", "heart"] },
  { emoji: "💙", name: "blue heart", category: "symbols", keywords: ["love", "heart"] },
  { emoji: "💚", name: "green heart", category: "symbols", keywords: ["love", "heart"] },
  { emoji: "💛", name: "yellow heart", category: "symbols", keywords: ["love", "heart"] },
  { emoji: "💜", name: "purple heart", category: "symbols", keywords: ["love", "heart"] },
  { emoji: "💔", name: "broken heart", category: "symbols", keywords: ["heartbreak", "sad"] },
  { emoji: "💖", name: "sparkling heart", category: "symbols", keywords: ["love", "sparkle"] },
  { emoji: "⚡", name: "high voltage", category: "symbols", keywords: ["lightning", "power"] },
  { emoji: "💥", name: "collision", category: "symbols", keywords: ["boom", "explosion"] },
  { emoji: "💬", name: "speech balloon", category: "symbols", keywords: ["chat", "message"] },

  // Flags (5)
  { emoji: "🏁", name: "chequered flag", category: "flags", keywords: ["flag", "finish"] },
  { emoji: "🚩", name: "triangular flag", category: "flags", keywords: ["flag", "warning"] },
  { emoji: "🎌", name: "crossed flags", category: "flags", keywords: ["flag", "celebrate"] },
  { emoji: "🏴", name: "black flag", category: "flags", keywords: ["flag"] },
  { emoji: "🏳️", name: "white flag", category: "flags", keywords: ["flag", "peace"] },
];

/**
 * Get emojis by category
 */
export const getEmojisByCategory = (category: EmojiCategory): EmojiData[] => {
  return EMOJI_DATA.filter((emoji) => emoji.category === category);
};

/**
 * Search emojis by keyword
 * Case-insensitive fuzzy search
 */
export const searchEmojis = (query: string): EmojiData[] => {
  if (!query.trim()) return EMOJI_DATA;
  
  const lowerQuery = query.toLowerCase();
  return EMOJI_DATA.filter((emoji) => 
    emoji.name.toLowerCase().includes(lowerQuery) ||
    emoji.keywords.some((keyword) => keyword.toLowerCase().includes(lowerQuery))
  );
};

/**
 * Get frequently used emojis (top 20 for quick access)
 */
export const FREQUENT_EMOJIS = EMOJI_DATA.slice(0, 20);

/**
 * All available categories
 */
export const EMOJI_CATEGORIES: { id: EmojiCategory; label: string; icon: string }[] = [
  { id: "smileys", label: "Smileys", icon: "😀" },
  { id: "gestures", label: "Gestures", icon: "👍" },
  { id: "people", label: "People", icon: "🎉" },
  { id: "animals", label: "Animals", icon: "🐶" },
  { id: "food", label: "Food", icon: "🍕" },
  { id: "activities", label: "Activities", icon: "⚽" },
  { id: "travel", label: "Travel", icon: "🚀" },
  { id: "objects", label: "Objects", icon: "💻" },
  { id: "symbols", label: "Symbols", icon: "❤️" },
  { id: "flags", label: "Flags", icon: "🏁" },
];

