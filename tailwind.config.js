/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
        slideDown: 'slideDown 0.2s ease-out forwards',
      },
      // 添加iPhone 16相关的断点
      screens: {
        'iphone16': '393px', // iPhone 16 width in logical pixels
        'iphone16-pro-max': '430px', // iPhone 16 Pro Max width in logical pixels
      },
      // 添加安全区域相关的自定义工具类
      padding: {
        'safe': 'env(safe-area-inset-top)',
        'safe-r': 'env(safe-area-inset-right)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
      },
      // 添加安全区域相关的margin工具类
      margin: {
        'safe': 'env(safe-area-inset-top)',
        'safe-r': 'env(safe-area-inset-right)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
      },
      // 添加安全区域相关的top工具类
      top: {
        'safe': 'env(safe-area-inset-top)',
      },
      // 添加安全区域相关的bottom工具类
      bottom: {
        'safe': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
