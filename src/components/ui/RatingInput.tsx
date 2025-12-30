import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export default function RatingInput({ value, onChange, max = 5 }: RatingInputProps) {
  const stars = [];

  for (let i = 1; i <= max; i++) {
    const isFull = i <= value;
    const isHalf = !isFull && i - 0.5 === value;
    
    stars.push(
      <button
        key={i}
        type="button"
        onClick={() => onChange(i)}
        // Simple double click or specific area click for half star is tricky in pure button
        // For simplicity in this version, we toggle half/full on repeated click or just support full stars by click
        // To support half stars properly, we can detect mouse position or use two smaller buttons per star.
        // Let's implement a simpler approach: Left half click = x.5, Right half click = x.0
        className="focus:outline-none transition-transform hover:scale-110 p-1"
        onMouseMove={() => {
           // Optional: Hover effect logic could go here
        }}
      >
        <div className="relative">
           {/* Background Star (Empty) */}
           <Star className="w-6 h-6 text-gray-300" />
           
           {/* Foreground Star (Full or Half) */}
           <div className="absolute top-0 left-0 overflow-hidden" style={{ width: isFull ? '100%' : isHalf ? '50%' : '0%' }}>
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
           </div>
        </div>
      </button>
    );
  }

  // Improved interaction: We need a way to select half stars.
  // A common pattern is to just have 10 clickable areas (0.5, 1.0, 1.5, etc)
  // Let's rewrite to use a flex container of 5 stars, but detect click position relative to star.
  
  return (
    <div className="flex items-center gap-1">
      {[...Array(max)].map((_, index) => {
        const starValue = index + 1;
        return (
          <div
            key={index}
            className="relative cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const isLeftHalf = e.clientX - rect.left < rect.width / 2;
              onChange(isLeftHalf ? starValue - 0.5 : starValue);
            }}
          >
            {/* Base Empty Star */}
            <Star className="w-6 h-6 text-gray-300" />
            
            {/* Overlay Full/Half Star */}
            <div 
              className="absolute top-0 left-0 overflow-hidden pointer-events-none transition-all duration-200"
              style={{ 
                width: value >= starValue ? '100%' : (value === starValue - 0.5 ? '50%' : '0%') 
              }}
            >
               <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            </div>
          </div>
        );
      })}
      <span className="ml-2 text-sm text-gray-500 font-medium">{value}分</span>
    </div>
  );
}
