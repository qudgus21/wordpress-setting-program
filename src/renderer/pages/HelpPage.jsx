const HelpPage = () => {
  return (
    <div className="flex h-screen">
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">도움말</h1>

          <div className="bg-white shadow rounded-lg divide-y divide-gray-200">
            {/* 자주 묻는 질문 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                자주 묻는 질문
              </h3>
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-700">
                    라이센스 키는 어떻게 구매하나요?
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    라이센스 키는 공식 웹사이트에서 구매할 수 있습니다. 구매 후
                    이메일로 라이센스 키가 발송됩니다.
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-700">
                    수익률은 어떻게 계산되나요?
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    수익률은 투자 금액 대비 수익을 백분율로 계산합니다. 일일,
                    주간, 월간 수익률을 확인할 수 있습니다.
                  </p>
                </div>
                <div>
                  <h4 className="text-md font-medium text-gray-700">
                    알림 설정은 어떻게 하나요?
                  </h4>
                  <p className="mt-2 text-sm text-gray-500">
                    설정 페이지에서 이메일 알림과 수익률 알림을 설정할 수
                    있습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 문의하기 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">문의하기</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  추가적인 문의사항이 있으시면 아래 이메일로 연락주세요.
                </p>
                <p className="mt-2 text-sm font-medium text-indigo-600">
                  support@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
