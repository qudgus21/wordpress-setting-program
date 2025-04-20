import React from "react";
import { useThemeStore } from "@/store";

const HomePage = () => {
  const { isDarkMode } = useThemeStore();

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
            홈
          </h1>

          <div
            className={`shadow rounded-lg p-6 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-semibold mb-4 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              WordPress 설치 자동화 도구
            </h2>
            <p
              className={`mb-4 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              AWS EC2 인스턴스에 WordPress를 자동으로 설치하는 도구입니다.
            </p>
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <h3
                  className={`text-lg font-medium mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  시작하기
                </h3>
                <p
                  className={`${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  설정 페이지에서 AWS 자격 증명을 입력하고 시작하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
