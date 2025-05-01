import { create } from 'zustand';

const useThemeStore = create(set => ({
  isDarkMode: false,
  toggleDarkMode: () => {
    set(state => {
      const newMode = !state.isDarkMode;
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', JSON.stringify({ isDarkMode: newMode }));
      return { isDarkMode: newMode };
    });
  },
}));

// 초기 상태 설정
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  try {
    const { isDarkMode } = JSON.parse(savedTheme);
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      useThemeStore.setState({ isDarkMode: true });
    }
  } catch (e) {
    console.error('테마 설정 로드 중 오류:', e);
  }
}

export default useThemeStore;
