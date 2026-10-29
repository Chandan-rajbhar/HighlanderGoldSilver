/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Reference Exact Colors
        brand: {
          navy: '#0B2D52',        // Deep navy blue
          blue: '#155A96',        // Primary Highlander blue
          bright: '#1685D4',      // Bright blue accents
          ice: '#D8EBFA',         // Icy blue
          soft: '#F4F9FD',        // Soft blue-white
          gold: '#D6AD43',        // Restrained metallic gold
          silver: '#C9D2DB',      // Silver
        },
        // Highlander Admin Luxury Light Blue & Gold Identity Palette
        highlander: {
          navy: '#0B2D52',        // Primary Dark Navy Text
          deep: '#0B1E36',        // Deep Slate Navy
          gold: '#D6AD43',        // Premium Gold Accent
          'gold-hover': '#BF952E',// Gold Hover
          bg: '#F4F9FD',          // Soft blue-white Main Canvas
          card: '#FFFFFF',        // Pure White Card Background
          border: '#D8EBFA',      // Soft Blue-Gray Border
          muted: '#64748B',       // Muted Slate Blue Text
          success: '#10B981',     // Subtle Green
          error: '#EF4444',       // Muted Red
        },
        aubergine: {
          DEFAULT: '#111827',
          dark: '#0B1E36',
          deep: '#061324',
          light: '#1E293B',
          muted: '#64748B',
          surface: '#F5F8FC',
          border: '#DCE5F0',
        },
        gold: {
          DEFAULT: '#D6AD45',
          light: '#E5C46E',
          bright: '#FDE68A',
          dark: '#BF952E',
          deep: '#8A6815',
          surface: 'rgba(214, 173, 69, 0.1)',
          border: 'rgba(214, 173, 69, 0.35)',
        },
        sidebar: {
          from: '#5B82A6',        // Darker sky-blue top gradient (50% darker than pale sky-blue)
          via: '#497094',         // Smooth midpoint
          to: '#355C80',          // Deep sky-blue bottom gradient
          active: '#FFFFFF',      // Active white menu item
          activeBorder: '#D6AD45',// Gold active border
          activeText: '#111827',  // Dark navy active text
          text: '#F1F5F9',        // Inactive item text
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        silver: {
          DEFAULT: '#DCE5F0',
          light: '#F5F8FC',
          surface: '#F8FAFC',
          dark: '#94A3B8',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 2px 10px rgba(17, 24, 39, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02)',
        'elevated': '0 10px 25px -5px rgba(17, 24, 39, 0.06), 0 8px 10px -6px rgba(17, 24, 39, 0.03)',
        'gold-glow': '0 0 16px rgba(214, 173, 69, 0.35)',
        'glass': '0 4px 18px rgba(17, 24, 39, 0.04)',
      }
    },
  },
  plugins: [],
}
