const SettingsPage = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">설정</h1>

          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {/* 계정 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">계정 설정</h3>
              <div className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    이메일
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    비밀번호
                  </label>
                  <input
                    type="password"
                    name="password"
                    id="password"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 알림 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">알림 설정</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <input
                    id="email-notifications"
                    name="email-notifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="email-notifications"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    이메일 알림 받기
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="yield-notifications"
                    name="yield-notifications"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="yield-notifications"
                    className="ml-3 block text-sm font-medium text-gray-700"
                  >
                    수익률 알림 받기
                  </label>
                </div>
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
