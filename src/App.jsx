import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/Themecontext"; 
import Navbar from "./components/Navbar";
import Offlineplayer from "./components/Musicpanel";
import Onlineplayer from "./components/control";
import Playlist from "./components/Playlist";
import Search from "./components/Search";

const App = () => {
  return (
    <ThemeProvider> 
      <Router>
        <Navbar />
        <Routes>
          <Route path="/offlineplayer" element={<Offlineplayer />} />
          <Route path="/Onlineplayer" element={<Onlineplayer />} />
          <Route path="/Playlist" element={<Playlist />} />
          <Route path="/Search" element={<Search />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
