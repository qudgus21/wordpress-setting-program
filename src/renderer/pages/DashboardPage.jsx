import { useEffect, useState } from 'react';
import { useThemeStore, useAwsStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import DeleteInstanceModal from '../components/DeleteInstanceModal';

const DashboardPage = () => {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const navigate = useNavigate();

  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingInstanceId, setDeletingInstanceId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // 알림 권한 요청
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

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
    setShowCreateModal(false);
    setIsCreating(true);
    setError(null);
    try {
      const result = await window.aws.ec2.create();
      console.log('인스턴스 생성 결과:', result);

      if (!result.success || !result.data) {
        throw new Error(result.message || '인스턴스 생성에 실패했습니다.');
      }

      setIsCreating(false);
      setSuccessMessage(result.message);
      setShowSuccessModal(true);

      // 새로 생성된 인스턴스를 기존 리스트에 추가
      const newInstance = {
        id: result.data.instanceId,
        name: result.data.name,
        state: 'pending',
        publicIp: result.data.publicIp,
        type: 't2.micro',
        domainCount: 0,
      };
      console.log('새로 생성된 인스턴스 데이터:', newInstance);
      setInstances(prevInstances => [...prevInstances, newInstance]);
    } catch (error) {
      console.error('인스턴스 생성 중 오류:', error);
      setIsCreating(false);
      if (error.message.includes('AddressLimitExceeded')) {
        setError(
          'AWS 기본 탄력적 IP 할당 한도(5개)에 도달했습니다. 더 많은 인스턴스를 생성하려면 AWS 지원팀에 할당량 증가를 요청해야 합니다.'
        );
      } else {
        setError(error.message);
      }
    }
  };

  const handleDeleteInstance = async instanceId => {
    setInstanceToDelete(instanceId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    setDeletingInstanceId(instanceToDelete);
    try {
      await window.aws.ec2.delete(instanceToDelete);
      await loadInstances();
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsDeleting(false);
      setDeletingInstanceId(null);
      setShowDeleteModal(false);
      setInstanceToDelete(null);
    }
  };

  const handleInstanceClick = instanceId => {
    navigate(`/app/instance/${instanceId}`);
  };

  // 페이지네이션 관련 계산
  const filteredInstances = instances.filter(instance => instance.state !== 'terminated' && instance.state !== 'shutting-down');
  const totalPages = Math.ceil(filteredInstances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInstances = filteredInstances.slice(startIndex, endIndex);

  // 페이지 변경 핸들러
  const handlePageChange = page => {
    setCurrentPage(page);
  };

  const LoadingSpinner = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <div
              className="absolute inset-2 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"
              style={{ animationDirection: 'reverse' }}
            ></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EC2 인스턴스 생성 중</h3>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            보안 그룹 생성 → EC2 인스턴스 생성 → Elastic IP 할당 → IP 연결
          </p>
        </div>
      </div>
    </div>
  );

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
          ) : filteredInstances.length > 0 ? (
            <div className="px-4 py-5 sm:p-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>EC2 인스턴스 목록</h3>
              <div className="mt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={`${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                      <tr>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          인스턴스 ID
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          이름
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          상태
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          퍼블릭 IP
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          도메인
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                            isDarkMode ? 'text-gray-200' : 'text-gray-500'
                          }`}
                        >
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
                      {currentInstances.map(instance => (
                        <tr
                          key={instance.id}
                          className={`${
                            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          } cursor-pointer transition-colors duration-200`}
                          onClick={() => navigate(`/app/instance/${instance.id}`, { state: { instance } })}
                        >
                          <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {instance.id}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {instance.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                instance.state === 'running'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : instance.state === 'stopped'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : instance.state === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}
                            >
                              {instance.state === 'running'
                                ? '실행중'
                                : instance.state === 'stopped'
                                ? '중지됨'
                                : instance.state === 'pending'
                                ? '대기중'
                                : instance.state === 'shutting-down'
                                ? '종료중'
                                : instance.state === 'terminated'
                                ? '종료됨'
                                : instance.state === 'stopping'
                                ? '중지중'
                                : instance.state === 'rebooting'
                                ? '재시작중'
                                : instance.state === 'initializing'
                                ? '초기화중'
                                : instance.state}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {instance.publicIp}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {instance.domainCount > 0 ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {instance.domainCount}개
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => handleDeleteInstance(instance.id)}
                              disabled={isDeleting && deletingInstanceId === instance.id}
                              className={`${
                                isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-900'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isDeleting && deletingInstanceId === instance.id ? '삭제 중...' : '삭제'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        isDarkMode
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      이전
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                        isDarkMode
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      다음
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        총 <span className="font-medium">{filteredInstances.length}</span>개의 인스턴스
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                            isDarkMode
                              ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className="sr-only">이전</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? `z-10 ${
                                    isDarkMode ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-500 text-blue-600'
                                  }`
                                : `${
                                    isDarkMode
                                      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                                      : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                                  }`
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                            isDarkMode
                              ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600'
                              : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <span className="sr-only">다음</span>
                          <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-center mb-4">
                <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>인스턴스가 없습니다.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <DeleteInstanceModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setInstanceToDelete(null);
        }}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* 인스턴스 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
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

      {isCreating && <LoadingSpinner />}

      {error && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414-1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
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

      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">생성 완료</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{successMessage}</p>
            <div className="flex justify-end">
              <button onClick={() => setShowSuccessModal(false)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
