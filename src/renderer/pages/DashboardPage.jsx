const DashboardPage = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">대시보드</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 수익률 카드 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">수익률</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">+12.5%</p>
              <p className="mt-1 text-sm text-gray-500">지난 30일 기준</p>
            </div>

            {/* 투자 금액 카드 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">투자 금액</h3>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ₩50,000,000
              </p>
              <p className="mt-1 text-sm text-gray-500">총 투자 금액</p>
            </div>

            {/* 수익 금액 카드 */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900">수익 금액</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">
                ₩6,250,000
              </p>
              <p className="mt-1 text-sm text-gray-500">총 수익 금액</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
