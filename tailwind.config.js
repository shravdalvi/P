/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        data: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"Plus Jakarta Sans"', 'sans-serif']
      },
      colors: {
        'surface-base': '#F8FAFC',
        'surface-raised': '#F1F5F9',
        'surface-panel': '#FFFFFF',
        'surface-overlay': '#F1F5F9',
        'border-default': '#E2E8F0',
        'border-muted': '#CBD5E1',
        surface: {
          base: '#F8FAFC',
          raised: '#F1F5F9',
          panel: '#FFFFFF',
          overlay: '#F1F5F9'
        },
        border: {
          default: '#E2E8F0',
          muted: '#CBD5E1'
        },
        accent: {
          DEFAULT: '#FACC15', // Yellow 400
          hover: '#EAB308',   // Yellow 500
          subtle: '#FEF08A'   // Yellow 200
        },
        base: {
          DEFAULT: '#F8FAFC',
          raised: '#F1F5F9',
          panel: '#FFFFFF',
          hair: '#E2E8F0'
        },
        ink: {
          DEFAULT: '#000000',
          dim: '#333333',
          faint: '#666666'
        },
        brand: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207'
        },
        status: {
          safe: '#10B981',      // Emerald 500
          moderate: '#F59E0B',  // Amber 500
          high: '#F97316',      // Orange 500
          critical: '#EF4444',  // Red 500
          info: '#3B82F6',      // Blue 500
          resolved: '#10B981'   // Emerald 500
        }
      },
      boxShadow: {
        panel: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
      },
      backgroundImage: {
        'grid-fade': 'none'
      }
    }
  },
  plugins: []
}
