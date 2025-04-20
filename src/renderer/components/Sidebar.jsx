import React from "react";
import { Link } from "react-router-dom";
import { useThemeStore } from "@/store";

const Sidebar = () => {
  const { isDarkMode } = useThemeStore();

  const menuItems = [
    { path: "/", label: "홈", icon: "🏠" },
    { path: "/settings", label: "설정", icon: "⚙️" },
  ];

  return (
    <div
      className={`w-64 h-screen ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } shadow-lg`}
    >
      <div className="p-4">
        <h1
          className={`text-xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          WordPress 설치 자동화
        </h1>
      </div>
      <nav className="mt-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-2 ${
              isDarkMode
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="mr-2">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
