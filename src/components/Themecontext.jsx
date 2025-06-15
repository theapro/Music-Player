import { createContext, useState, useContext } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const colors = {
    light: {
      cardcolor:"#000",
      mainback:"#e0e0e0",
      background: "white",
      text: "black",
      buttonBg: "black",
      buttonText: "white",
      cardBg: "white",
      cardShadow: "5px 5px 4px #cecece, -5px -5px 4px #f2f2f2",
      cardshadowl:"5px 5px 4px #cecece, -5px -5px 4px #f2f2f2",
      cardshadowsml:"1px 1px 2px #cecece, -1px -1px 50px #f2f2f2",
    },
    dark: {
      mainback: "#2a2e2b",
      background: "#333",
      text: "white",
      buttonBg: "white",
      buttonText: "black",
      cardBg: "#444",
      cardShadow: "5px 5px 4px #111, -5px -5px 4px #444",
      cardshadowl:"5px 5px 10px #1c1f1d,-5px -5px 10px #383d39",
      cardshadowsml:"5px 5px 10px #1c1f1d,-5px -5px 10px #383d39",

    },
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, colors: colors[theme] }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
