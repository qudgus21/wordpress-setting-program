import React, { useState } from 'react';
import { useThemeStore, useAwsStore } from '@/store';

const SettingsPage = () => {
  const { credentials, setCredentials } = useAwsStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const [awsAccessKey, setAwsAccessKey] = useState(credentials?.accessKeyId || '');
  const [awsSecretKey, setAwsSecretKey] = useState(credentials?.secretAccessKey || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await window.electron.aws.credentials.save({
        accessKeyId: awsAccessKey,
        secretAccessKey: awsSecretKey,
      });

      if (result.success) {
        setSuccess(result.message);
        setCredentials({
          accessKeyId: awsAccessKey,
          secretAccessKey: awsSecretKey,
        });
        await loadInstances();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('자격 증명을 저장하는 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <div className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className={`text-2xl font-bold mb-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>설정</h1>

          <div className={`shadow rounded-lg divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
            {/* AWS 자격 증명 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>AWS 자격 증명</h3>
              <div className="mt-4 space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{error}</span>
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded relative" role="alert">
                    <span className="block sm:inline">{success}</span>
                  </div>
                )}
                <form onSubmit={handleSubmit}>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label
                      htmlFor="aws-access-key"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      AWS Access Key
                    </label>
                    <input
                      type="text"
                      id="aws-access-key"
                      value={awsAccessKey}
                      onChange={e => setAwsAccessKey(e.target.value)}
                      className={`block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        isDarkMode
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="AKIAXXXXXXXXXXXXXXXX"
                      disabled={isLoading}
                    />
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label
                      htmlFor="aws-secret-key"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      AWS Secret Key
                    </label>
                    <input
                      type="password"
                      id="aws-secret-key"
                      value={awsSecretKey}
                      onChange={e => setAwsSecretKey(e.target.value)}
                      className={`block w-full px-4 py-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                        isDarkMode
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="••••••••••••••••••••••••••••••••"
                      disabled={isLoading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`mt-4 w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                      isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                  >
                    {isLoading ? '저장 중...' : 'AWS 자격 증명 저장'}
                  </button>
                </form>
              </div>
            </div>

            {/* 테마 설정 */}
            <div className="px-4 py-5 sm:p-6">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>테마 설정</h3>
              <div className="mt-4">
                <button
                  onClick={toggleDarkMode}
                  className={`w-full px-4 py-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
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
