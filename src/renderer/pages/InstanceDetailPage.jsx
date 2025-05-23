import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useThemeStore, useInstanceStore } from '@/store';
import { toast } from 'react-hot-toast';

const InstanceDetailPage = () => {
  const { isDarkMode } = useThemeStore();
  const { instanceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { instances, updateInstance } = useInstanceStore();
  const storeInstance = instances.find(inst => inst.id === instanceId);

  const [instance, setInstance] = useState(storeInstance || null);
  const [loading, setLoading] = useState(!storeInstance);
  const [error, setError] = useState(null);
  const [showAddBlogModal, setShowAddBlogModal] = useState(false);
  const [domain, setDomain] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  useEffect(() => {
    if (!storeInstance) {
      setError('인스턴스를 찾을 수 없습니다.');
      setLoading(false);
    } else {
      setInstance(storeInstance);
      setLoading(false);
    }
  }, [instanceId, storeInstance]);

  const handleAddBlog = async () => {
    if (!domain) {
      setErrorMessage('도메인을 입력해주세요.');
      setShowErrorModal(true);
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const result = await window.aws.blog.create({ instance, domain });
      setShowAddBlogModal(false);
      setDomain('');

      // instanceStore 업데이트
      const updatedInstance = {
        ...instance,
        domains: [...(instance.domains || []), domain],
        domainCount: (instance.domainCount || 0) + 1,
      };
      updateInstance(instance.id, updatedInstance);
      setInstance(updatedInstance);

      toast.success('블로그가 성공적으로 생성되었습니다.');
    } catch (error) {
      const cleanErrorMessage = error.message.replace(/^Error invoking remote method 'createBlog': Error: /, '');
      setErrorMessage(cleanErrorMessage);
      setShowErrorModal(true);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDomain = async domain => {
    setDomainToDelete(domain);
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await window.aws.blog.delete({
        instance,
        domain: domainToDelete,
      });

      // instanceStore 업데이트
      const updatedInstance = {
        ...instance,
        domains: instance.domains.filter(d => d !== domainToDelete),
        domainCount: (instance.domainCount || 0) - 1,
      };
      updateInstance(instance.id, updatedInstance);
      setInstance(updatedInstance);

      setShowDeleteConfirmModal(false);
      setShowDeleteSuccessModal(true);
    } catch (error) {
      console.error('블로그 삭제 중 오류 발생:', error);
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setDomainToDelete(null);
    }
  };

  const getStateText = state => {
    switch (state) {
      case 'running':
        return '실행중';
      case 'initializing':
        return '초기화중';
      case 'stopped':
        return '중지됨';
      case 'stopping':
        return '중지중';
      case 'pending':
        return '대기중';
      case 'shutting-down':
        return '종료중';
      case 'terminated':
        return '종료됨';
      default:
        return state;
    }
  };

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
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
    );
  }

  if (error) {
    return (
      <div className={`flex h-screen items-center justify-center ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <p className={`text-xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{error}</p>
          <button onClick={() => navigate('/app/dashboard')} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/app/dashboard')}
                className={`p-2 rounded-full ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100'
                } transition-colors duration-200`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{instance.name}</h1>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{instance.id}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddBlogModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium"
            >
              블로그 추가하기
            </button>
          </div>

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <div className="grid grid-cols-1 gap-6">
                  <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>인스턴스 정보</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>상태</p>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            instance.state === 'running'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : instance.state === 'stopped'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {getStateText(instance.state)}
                        </span>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>인스턴스 타입</p>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{instance.type}</p>
                      </div>
                      <div>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>퍼블릭 IP</p>
                        <p className={isDarkMode ? 'text-white' : 'text-gray-900'}>{instance.publicIp}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>블로그 목록</h2>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {instance.domains?.length || 0}개
                      </span>
                    </div>
                    {instance.domains?.length > 0 ? (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                        {instance.domains.map(domain => (
                          <div
                            key={domain}
                            className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} flex justify-between items-center`}
                          >
                            <div>
                              <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{domain}</p>
                            </div>
                            <div className="flex space-x-2">
                              <a
                                href={`http://${domain}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`p-2 rounded-full ${
                                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                } transition-colors duration-200`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                              <button
                                onClick={() => handleDeleteDomain(domain)}
                                className={`p-2 rounded-full ${
                                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                                } transition-colors duration-200`}
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg
                          className="mx-auto h-12 w-12 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        <p className="text-sm">새로운 블로그를 시작해보세요!</p>
                        <p className="text-xs mt-1">당신의 이야기를 세상에 알려보세요</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 블로그 추가 모달 */}
      {showAddBlogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">블로그 추가</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">새로운 블로그를 생성하시겠습니까?</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">도메인</label>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddBlogModal(false);
                  setDomain('');
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                취소
              </button>
              <button
                onClick={handleAddBlog}
                disabled={isCreating}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">블로그 생성 중</h3>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">워드프레스 설치 → 데이터베이스 설정 → 도메인 설정</p>
            </div>
          </div>
        </div>
      )}

      {/* 에러 모달 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-[500px]">
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
            <p className="text-gray-600 dark:text-gray-300 mb-4">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage('');
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-[500px]">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">블로그 삭제</h2>
            </div>
            {isDeleting ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div
                    className="absolute inset-2 border-4 border-blue-300 border-t-transparent rounded-full animate-spin"
                    style={{ animationDirection: 'reverse' }}
                  ></div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">블로그 삭제 중</h3>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">블로그가 삭제되고 있습니다. 잠시만 기다려주세요...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  정말로 {domainToDelete} 블로그를 삭제하시겠습니까?
                  <br />이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteConfirmModal(false);
                      setDomainToDelete(null);
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    취소
                  </button>
                  <button onClick={handleConfirmDelete} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                    삭제
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 삭제 완료 모달 */}
      {showDeleteSuccessModal && (
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
              <h2 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">삭제 완료</h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">블로그가 성공적으로 삭제되었습니다.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteSuccessModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstanceDetailPage;
