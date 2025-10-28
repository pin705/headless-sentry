export default {
  darkMode: 'class', // 👈 Kích hoạt dark mode bằng class
  theme: {
    extend: {
      keyframes: {
        softPulse: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.05)', opacity: '1' }
        }
      },
      animation: {
        softPulse: 'softPulse 2s ease-in-out infinite'
      },
      colors: {
        background: {
          light: '#f8f8f8',
          dark: '#0f0f0f'
        }
      }
    }
  },
  plugins: []
}
