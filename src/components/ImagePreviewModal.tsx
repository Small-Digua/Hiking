import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function ImagePreviewModal({ isOpen, onClose, images, initialIndex = 0 }: ImagePreviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white hover:text-gray-300 transition-colors"
        aria-label="关闭"
      >
        <X className="w-8 h-8" />
      </button>

      {/* 图片计数器 */}
      {images.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 px-4 py-2 bg-black bg-opacity-50 text-white rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      )}

      {/* 左箭头 */}
      {images.length > 1 && (
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white hover:text-gray-300 transition-colors hover:bg-black hover:bg-opacity-30 rounded-full"
          aria-label="上一张"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* 右箭头 */}
      {images.length > 1 && (
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 text-white hover:text-gray-300 transition-colors hover:bg-black hover:bg-opacity-30 rounded-full"
          aria-label="下一张"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* 主图片 */}
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        <img
          src={images[currentIndex]}
          alt={`预览图片 ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          style={{ maxHeight: 'calc(100vh - 8rem)' }}
        />
      </div>

      {/* 缩略图导航 */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 max-w-full overflow-x-auto px-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-white shadow-lg' 
                  : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <img
                src={image}
                alt={`缩略图 ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}