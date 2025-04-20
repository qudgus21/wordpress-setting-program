import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import SettingsPage from "./pages/SettingsPage";
import useThemeStore from "./store/themeStore";

const App = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <Router>
      <div
        className={`flex h-screen ${
          isDarkMode ? "dark bg-gray-900" : "bg-gray-100"
        }`}
      >
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
