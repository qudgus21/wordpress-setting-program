import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/common/Sidebar';
import { useAwsStore } from '@/store';

const MainLayout = () => {
  const { setCredentials } = useAwsStore();

  useEffect(() => {
    // AWS 자격 증명 확인
    window.aws.credentials
      .get()
      .then(result => {
        if (result.success && result.data) {
          setCredentials(result.data);
        }
      })
      .catch(err => {
        console.error('AWS 자격 증명 확인 중 오류:', err);
      });
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default MainLayout;
