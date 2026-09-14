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
        'surface-base': '#0F1419',
        'surface-raised': '#161B22',
        'surface-panel': '#1C2128',
        'surface-overlay': '#21262D',
        'border-default': '#30363D',
        'border-muted': '#21262D',
        surface: {
          base: '#0F1419',
          raised: '#161B22',
          panel: '#1C2128',
          overlay: '#21262D'
        },
        border: {
          default: '#30363D',
          muted: '#21262D'
        },
        accent: {
          DEFAULT: '#58A6A6',
          hover: '#4C9191',
          subtle: 'rgba(88, 166, 166, 0.12)'
        },
        base: {
          DEFAULT: '#0F1419',
          raised: '#161B22',
          panel: '#1C2128',
          hair: '#30363D'
        },
        ink: {
          DEFAULT: '#E6EDF3',
          dim: '#8B949E',
          faint: '#6E7681'
        },
        brand: {
          50: '#EAF7F3',
          100: '#D8F0E9',
          200: '#A9DCC7',
          300: '#76C7A7',
          400: '#58A6A6',
          500: '#1E6D5B',
          600: '#114E42',
          700: '#0C3D34'
        },
        status: {
          safe: '#3FB97C',
          moderate: '#E4A93B',
          high: '#F0864B',
          critical: '#E15945',
          info: '#3D7BCE',
          resolved: '#58A6A6'
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
