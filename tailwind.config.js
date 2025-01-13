/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4BA3FF',
          DEFAULT: '#0066D6',
          hover: '#0B84FF'
        },
        text: {
          DEFAULT: '#1B2B42',
          muted: '#5E6C84'
        },
        success: {
          DEFAULT: '#00875a',
          light: '#e3fcef'
        },
        danger: {
          DEFAULT: '#de350b',
          light: '#ffebe6'
        },
        warning: {
          DEFAULT: '#ff991f',
          light: '#fff4e5'
        },
        info: {
          DEFAULT: '#0B84FF',
          light: '#E6F4FF'
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#F4F5F7',
          border: '#DFE1E6'
        }
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.1)'
      },
      borderRadius: {
        DEFAULT: '4px',
        card: '8px',
        badge: '12px',
        full: '9999px'
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '24px'
      },
      spacing: {
        '2': '4px',
        '3': '8px',
        '4': '12px',
        '6': '16px',
        '8': '24px',
        '12': '32px'
      },
      opacity: {
        '10': '0.1'
      }
    }
  },
  plugins: []
} 