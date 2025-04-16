import { createHashRouter, redirect } from "react-router-dom";
import LicenseInputPage from "./pages/LicenseInputPage";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";

const router = createHashRouter([
  {
    path: "/",
    loader: async () => {
      try {
        const result = await window.license.check();
        if (result.success) {
          return redirect("/app/dashboard");
        }
        return null;
      } catch (error) {
        return null;
      }
    },
    element: <LicenseInputPage />,
  },
  {
    path: "/app",
    element: <MainLayout />,
    children: [
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "help",
        element: <HelpPage />,
      },
    ],
  },
]);

export default router;
