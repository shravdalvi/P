/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        data: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        base: {
          DEFAULT: '#070F0D',
          raised: '#0C1815',
          panel: '#0F1E1A',
          hair: '#1C2E29'
        },
        ink: {
          DEFAULT: '#EAF4F0',
          dim: '#9FB6AE',
          faint: '#5D746D'
        },
        brand: {
          50: '#E7FBF3',
          200: '#9BEED2',
          400: '#3FDBA6',
          500: '#22C48C',
          600: '#149A6E',
          700: '#0C7657'
        },
        status: {
          safe: '#49D17A',
          moderate: '#E8B93F',
          high: '#F0873F',
          critical: '#EF4A55',
          info: '#4C9FE8'
        }
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 20px 40px -24px rgba(0,0,0,0.6)'
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 20% 0%, rgba(34,196,140,0.10), transparent 45%)'
      }
    }
  },
  plugins: []
}
