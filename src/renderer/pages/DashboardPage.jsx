import { useEffect, useState } from 'react';
import { useThemeStore, useAwsStore } from '@/store';
import { Link } from 'react';

const DashboardPage = () => {
  const { isDarkMode, toggleDarkMode } = useThemeStore();

  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadInstances();
  }, []);

  const loadInstances = async () => {
    try {
      setLoading(true);
      const result = await window.aws.ec2.get();
      if (result.success) {
        setInstances(result.data);
      } else {
        setError(result.message || '인스턴스 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('인스턴스 목록 조회 중 오류:', error);
      if (error.message.includes('Access Key') || error.message.includes('Secret Key')) {
        setError('AWS 자격 증명이 설정되지 않았거나 잘못되었습니다. 설정 페이지에서 자격 증명을 확인해주세요.');
      } else {
        setError('인스턴스 목록을 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInstance = async () => {
    try {
      setShowCreateModal(false);
      setIsCreating(true);
      const result = await window.aws.ec2.create();
      if (result.success) {
        await loadInstances();
        setIsCreating(false);
      } else {
        setIsCreating(false);
        setError(result.message || '인스턴스 생성 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('인스턴스 생성 중 오류:', error);
      setIsCreating(false);
      setError(error.message || '인스턴스 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>대시보드</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isCreating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isCreating ? '인스턴스 생성 중...' : '인스턴스 추가'}
            </button>
          </div>

          {isCreating && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping rounded-full h-8 w-8 bg-blue-500 opacity-75"></div>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-4 text-center">
                  인스턴스 생성이 진행 중입니다.
                  <br />
                  완료까지 약 1-2분 정도 소요될 수 있습니다.
                </p>
                <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 w-full">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        ⚠️ 인스턴스 생성이 완료될 때까지 프로그램을 닫지 마세요!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h2 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">오류가 발생했습니다</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setError(null);
                      setIsCreating(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}

          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">인스턴스 생성</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-4">새로운 EC2 인스턴스를 생성하시겠습니까?</p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    취소
                  </button>
                  <button onClick={handleCreateInstance} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    생성
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading && !isCreating ? (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-ping rounded-full h-8 w-8 bg-blue-500 opacity-75"></div>
                  </div>
                </div>
                <p className={`text-xl mt-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>로딩 중...</p>
              </div>
            </div>
          ) : instances.length > 0 ? (
            <div className="px-4 py-5 sm:p-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EC2 인스턴스 목록</h3>
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <tr>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          인스턴스 ID
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          이름
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          타입
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          상태
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          퍼블릭 IP
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                      {instances.map(instance => (
                        <tr key={instance.id}>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{instance.id}</td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {instance.name}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {instance.type}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {instance.status}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                            {instance.publicIp}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-center mb-4">
                <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>인스턴스가 없습니다.</p>
              </div>
              <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                인스턴스 추가
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
