import React, { useState } from "react";
import useThemeStore from "../store/themeStore";

const SettingsPage = () => {
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: AWS 자격 증명 저장 로직 추가
    console.log("AWS 자격 증명 저장:", { awsAccessKey, awsSecretKey });
  };

  return (
    <div
      className={`flex h-screen ${
        isDarkMode ? "dark bg-gray-900" : "bg-gray-100"
      }`}
    >
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1
            className={`text-2xl font-bold mb-8 ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            설정
          </h1>

          <div
            className={`shadow rounded-lg divide-y ${
              isDarkMode
                ? "bg-gray-800 divide-gray-700"
                : "bg-white divide-gray-200"
            }`}
          >
            {/* AWS 자격 증명 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                AWS 자격 증명
              </h3>
              <div className="mt-4 space-y-4">
                <form onSubmit={handleSubmit}>
                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <label
                      htmlFor="aws-access-key"
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      AWS Access Key
                    </label>
                    <input
                      type="text"
                      id="aws-access-key"
                      value={awsAccessKey}
                      onChange={(e) => setAwsAccessKey(e.target.value)}
                      className={`block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        isDarkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="AKIAXXXXXXXXXXXXXXXX"
                    />
                  </div>
                  <div
                    className={`p-4 rounded-lg ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <label
                      htmlFor="aws-secret-key"
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      AWS Secret Key
                    </label>
                    <input
                      type="password"
                      id="aws-secret-key"
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      className={`block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        isDarkMode
                          ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="••••••••••••••••••••••••••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    AWS 자격 증명 저장
                  </button>
                </form>
              </div>
            </div>

            {/* 테마 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                테마 설정
              </h3>
              <div className="mt-4">
                <button
                  onClick={toggleDarkMode}
                  className={`w-full px-4 py-2 rounded-md ${
                    isDarkMode
                      ? "bg-gray-700 text-white hover:bg-gray-600"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {isDarkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
