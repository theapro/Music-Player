/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-50%)", opacity: "1" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideIn2: {
          "0%": { transform: "translateY(-30%)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(30%)", opacity: "1" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideInBottom: {
          "0%": { transform: "translateY(100%)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        bounceUpDown: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        bounceUpDownn: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        },
        rotate: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        scaleUpDown: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.2)" },
        },
      },
      animation: {
        slideIn: "slideIn 0.5 ease-out",
        slideIn2: "slideIn2 0.5s ease-out",
        slideInRight: "slideInRight 0.5s ease-out",
        slideInBottom: "slideInBottom 0.5s ease-out",
        scaleIn: "scaleIn 0.5s ease-out",
        bounceUpDown: "bounceUpDown 1s infinite",
        bounceUpDownn: "bounceUpDownn 1s infinite",
        rotate: "rotate 2s linear infinite",
        scaleUpDown: "scaleUpDown 1s ease-in-out infinite",
      },
      backgroundImage: {
        myimage: "url('./src/assets/aynback1.jpg')"
      },
      boxShadow: {
        custom: '5px 5px 10px #c1c1c',
        light: '0 2px 8px rgba(255, 255, 255, 0.1)',
        dark: '0 4px 8px rgba(0, 0, 0, 0.3)',
        insetLight: 'inset 0 0 8px rgba(255, 255, 255, 0.2)',
        insetDark: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
        customOuter: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px', 
        customInner: 'rgba(0, 0, 0, 0.15) 0px 5px 15px 0px',
      },
      colors: {
        primary: "#000000",
        navi: "#05060a",
        secondary: "ffa448",
        dark: "#1e1e1e",
        light: "f5f5f5",
        codee: "#39fc03",
        glass: "#a8ccd7",
      },
      borderRadius: {
        custom: '22px',
      },
      backgroundColor: {
        customBackground: '#e0e0e0',
      },
    },
    fontFamily: {
      poppins: ["Poppins", "sans-serif"],
      anton: ["Anton", "sans-serif"],
      orbitron: ["Orbitron", "serif"],
      aoboshi: ["Aoboshi One", "serif"],
      zen: ["Zen Antique", "serif"],
      kagaku: ["Kagaku", "serif"],
      verbatim: ["Verbatim", "serif"],
    },
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "2rem",
        lg: "4rem",
        xl: "5rem",
        "2xl": "6rem",
      },
    },
  },
  plugins: [],
};
