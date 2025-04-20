import React, { useState } from "react";

const SettingsPage = () => {
  const [awsAccessKey, setAwsAccessKey] = useState("");
  const [awsSecretKey, setAwsSecretKey] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: AWS 자격 증명 저장 로직 추가
    console.log("AWS 자격 증명 저장:", { awsAccessKey, awsSecretKey });
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">설정</h1>

          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {/* AWS 자격 증명 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                AWS 자격 증명
              </h3>
              <div className="mt-4 space-y-4">
                <form onSubmit={handleSubmit}>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label
                      htmlFor="aws-access-key"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      AWS Access Key
                    </label>
                    <input
                      type="text"
                      id="aws-access-key"
                      value={awsAccessKey}
                      onChange={(e) => setAwsAccessKey(e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                      placeholder="AKIAXXXXXXXXXXXXXXXX"
                    />
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label
                      htmlFor="aws-secret-key"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      AWS Secret Key
                    </label>
                    <input
                      type="password"
                      id="aws-secret-key"
                      value={awsSecretKey}
                      onChange={(e) => setAwsSecretKey(e.target.value)}
                      className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
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
              <h3 className="text-lg font-medium text-gray-900">테마 설정</h3>
              <div className="mt-4">
                <select
                  id="theme"
                  name="theme"
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                >
                  <option>라이트 모드</option>
                  <option>다크 모드</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
