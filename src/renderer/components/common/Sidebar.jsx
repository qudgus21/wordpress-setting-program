import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '@/store';

const Sidebar = () => {
  const location = useLocation();
  const { isDarkMode } = useThemeStore();

  const menuItems = [
    { path: '/app/dashboard', label: '대시보드', icon: '📊' },
    { path: '/app/settings', label: '설정', icon: '⚙️' },
    { path: '/app/help', label: '도움말', icon: '❓' },
  ];

  return (
    <div
      className={`w-64 h-full p-4 ${
        isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
      }`}
    >
      <div className="mb-8">
        <h1 className="text-xl font-bold">WordPress 설정 프로그램</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          {menuItems.map(item => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-2 rounded-lg ${
                  location.pathname === item.path
                    ? isDarkMode
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                    : ''
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
