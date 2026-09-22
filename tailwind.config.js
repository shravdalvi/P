/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Georgia', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        data: ['"JetBrains Mono"', 'monospace']
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
          DEFAULT: '#0D9488', // Teal 600
          hover: '#0F766E',   // Teal 700
          subtle: '#CCFBF1'   // Teal 100
        },
        base: {
          DEFAULT: '#F8FAFC',
          raised: '#F1F5F9',
          panel: '#FFFFFF',
          hair: '#E2E8F0'
        },
        ink: {
          DEFAULT: '#0F172A',
          dim: '#475569',
          faint: '#94A3B8'
        },
        brand: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E'
        },
        status: {
          safe: '#10B981',      // Emerald 500 (Green = normal)
          moderate: '#F59E0B',  // Amber 500 (Amber = attention)
          high: '#F97316',      // Orange 500 (Orange = warning/high)
          critical: '#EF4444',  // Red 500 (Red = critical/OFF-LIMIT)
          info: '#3B82F6',      // Blue 500
          resolved: '#0D9488'   // Teal 600 (Teal = active/approved/monitoring)
        }
      },
      boxShadow: {
        panel: '0 1px 2px 0 rgba(0, 0, 0, 0.4)'
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 20% 0%, rgba(88, 166, 166, 0.08), transparent 45%)'
      }
    }
  },
  plugins: []
}
