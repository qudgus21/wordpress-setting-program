import { createBrowserRouter } from "react-router-dom";
import LicenseInputPage from "./pages/LicenseInputPage";
import MainLayout from "./components/layout/MainLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";

const router = createBrowserRouter([
  {
    path: "/",
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
