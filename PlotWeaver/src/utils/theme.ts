export type ThemeMode = 'sunrise' | 'sunset';

export const themeService = {
  getTheme(): ThemeMode {
    const saved = localStorage.getItem('plotweaver_theme');
    return (saved === 'sunrise' || saved === 'sunset') ? saved : 'sunset';
  },

  setTheme(theme: ThemeMode) {
    localStorage.setItem('plotweaver_theme', theme);
  }
};