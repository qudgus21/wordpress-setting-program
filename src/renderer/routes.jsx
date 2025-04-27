import { createHashRouter, redirect } from 'react-router-dom';
import LicenseInputPage from '@/pages/LicenseInputPage';
import DashboardPage from '@/pages/DashboardPage';
import SettingsPage from '@/pages/SettingsPage';
import HelpPage from '@/pages/HelpPage';
import MainLayout from '@/components/layout/MainLayout';

const router = createHashRouter([
  {
    path: '/',
    loader: async () => {
      try {
        const result = await window.license.check();
        if (result.success) {
          return redirect('/app/dashboard');
        }
        return null;
      } catch (error) {
        console.error('라이센스 확인 중 오류:', error);
        return null;
      }
    },
    element: <LicenseInputPage />,
  },
  {
    path: '/app',
    element: <MainLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'help',
        element: <HelpPage />,
      },
    ],
  },
]);

export default router;
