/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'sans-serif'],
        data: ['"JetBrains Mono"', 'monospace']
      },
      colors: {
        base: {
          DEFAULT: '#FAF9F6',
          raised: '#F5F5F2',
          panel: '#FFFFFF',
          hair: '#E7E6E1'
        },
        ink: {
          DEFAULT: '#123047',
          dim: '#536779',
          faint: '#798B99'
        },
        brand: {
          50: '#EAF7F3',
          100: '#D8F0E9',
          200: '#A9DCC7',
          300: '#76C7A7',
          400: '#4AAE8B',
          500: '#1E6D5B',
          600: '#114E42',
          700: '#0C3D34'
        },
        status: {
          safe: '#22A66F',
          moderate: '#E4A93B',
          high: '#F0864B',
          critical: '#E15945',
          info: '#3D7BCE'
        }
      },
      boxShadow: {
        panel: '0 10px 25px -18px rgba(12, 61, 52, 0.22)'
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 20% 0%, rgba(30, 109, 91, 0.08), transparent 45%)'
      }
    }
  },
  plugins: []
}
