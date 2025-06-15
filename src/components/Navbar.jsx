import React, { useState } from "react";
import Logo from "../../src/assets/aproTEXTblack.png";
import { FaTimes } from "react-icons/fa";
import { useTheme } from "./Themecontext"; 

const NavbarMenu = [
  {
    id: 4,
    title: "Online Player",
    link: "/onlineplayer",
    delay: "0.8",
  },
  {
    id: 1,
    title: "Offline Player",
    link: "/offlineplayer",
    delay: "0.2",
  },
  {
    id: 2,
    title: "Playlist",
    link: "/playlist",
    delay: "0.4",
  },
  {
    id: 5,
    title: "Identifier",
    link: "/Search",
    delay: "0.6",
  },
  {
    id: 3,
    title: "Shortcuts",
    link: "#shortcuts",
    delay: "0.6",
  },
];

const Navbar = () => {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { theme, toggleTheme, colors } = useTheme();

  const toggleShortcuts = () => {
    setShowShortcuts(!showShortcuts);
  };

  return (
    <nav
      className="font-poppins fixed top-[15px] left-[15px] h-[calc(100vh-30px)] w-[270px] backdrop-blur-md flex flex-col justify-between py-6 px-4"
      style={{
        borderRadius: "14px",
        background: colors.background,
        color: colors.text,
        boxShadow: colors.cardShadow,
        animation: "slideIn 0.5s ease-out",
      }}
    >
      {/* Logo and Menu container */}
      <div className="flex flex-col gap-6">
        <div>
          <img
            src={Logo}
            alt="Logo"
            className="w-[70px] ml-[12px] cursor-pointer"
          />
        </div>
        <ul className="flex flex-col gap-4 mt-[30px]">
          {NavbarMenu.map((item) => (
            <li key={item.id} style={{ transitionDelay: `${item.delay}s` }}>
              <a
                href={item.link}
                className="block py-2 px-4 border-b-[1px] duration-300 cursor-pointer"
                style={{
                  color: colors.text,
                  borderBottomColor: colors.text,
                }}
                onClick={item.title === "Shortcuts" ? toggleShortcuts : null}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="mt-4 px-4 py-2 rounded-lg"
        style={{
          backgroundColor: colors.buttonBg,
          color: colors.buttonText,
          border: `1px solid ${colors.text}`,
        }}
      >
        {theme === "light" ? "Dark Mode" : "Light Mode"}
      </button>

      {/* Footer */}
      <div className="mt-auto text-sm text-center" style={{ color: colors.text }}>
        <p> Designed by &copy; 2025 The Ayn Pro</p>
      </div>

      {/* Shortcuts window */}
      {showShortcuts && (
        <div
          className="fixed top-3 left-2.5 w-[250px] h-[400px] bg-opacity-30 backdrop-blur-[5px] shadow-lg rounded-lg p-6"
          style={{
            background: colors.cardBg,
            color: colors.text,
            boxShadow: colors.cardShadow,
            borderRadius: "14px",
          }}
        >
          <button onClick={toggleShortcuts} className="self-end text-2xl mb-4">
            <FaTimes />
          </button>
          <h3 className="text-xl mb-4 font-bold">Shortcuts</h3>
          <ul>
            <li className="mb-2">Play/Pause - Space</li>
            <li className="mb-2">Next music - Arrow right</li>
            <li className="mb-2">Prev music - Arrow left</li>
            <li className="mb-2">+10s next - Shift + N</li>
            <li className="mb-2">-10s prev - Shift + P</li>
            <li className="mb-2">Mute - Shift + M</li>
            <li className="mb-2">Shuffle - Shift + S</li>
            <li className="mb-2">Repeat - Shift + R</li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
