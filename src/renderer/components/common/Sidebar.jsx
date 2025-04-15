import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-800 text-white h-screen">
      <div className="p-4">
        <h1 className="text-2xl font-bold">Passive Income</h1>
      </div>
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          <Link
            to="/app/dashboard"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            대시보드
          </Link>
          <Link
            to="/app/settings"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            설정
          </Link>
          <Link
            to="/app/help"
            className="block py-2 px-4 rounded hover:bg-gray-700"
          >
            도움말
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
