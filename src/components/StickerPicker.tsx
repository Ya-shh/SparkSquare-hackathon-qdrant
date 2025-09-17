import { useState } from 'react';

interface StickerPickerProps {
  onSelect: (sticker: string) => void;
  className?: string;
}

const stickers = [
  { id: 'thumbs-up', emoji: '👍', label: 'Thumbs Up' },
  { id: 'heart', emoji: '❤️', label: 'Heart' },
  { id: 'laugh', emoji: '😂', label: 'Laugh' },
  { id: 'wow', emoji: '😮', label: 'Wow' },
  { id: 'sad', emoji: '😢', label: 'Sad' },
  { id: 'angry', emoji: '😠', label: 'Angry' },
  { id: 'clap', emoji: '👏', label: 'Clap' },
  { id: 'fire', emoji: '🔥', label: 'Fire' },
  { id: 'rocket', emoji: '🚀', label: 'Rocket' },
  { id: 'star', emoji: '⭐', label: 'Star' },
  { id: 'check', emoji: '✅', label: 'Check' },
  { id: 'lightbulb', emoji: '💡', label: 'Lightbulb' },
];

export default function StickerPicker({ onSelect, className = '' }: StickerPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStickerSelect = (sticker: string) => {
    onSelect(sticker);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
        aria-label="Open sticker picker"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl z-50">
          <div className="grid grid-cols-4 gap-2">
            {stickers.map((sticker) => (
              <button
                key={sticker.id}
                onClick={() => handleStickerSelect(sticker.id)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors group flex items-center justify-center"
                aria-label={sticker.label}
                title={sticker.label}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{sticker.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 