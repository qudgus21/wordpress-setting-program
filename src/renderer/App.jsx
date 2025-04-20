import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { useThemeStore } from '@/store';
import router from './routes';

const App = () => {
  const { isDarkMode } = useThemeStore();

  return (
    <div className={`h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <RouterProvider router={router} />
    </div>
  );
};

export default App;
