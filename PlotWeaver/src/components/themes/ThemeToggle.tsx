import { useState, useEffect } from 'react';
import { themeService } from '../../utils/theme';
import type { ThemeMode } from '../../utils/theme';

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(themeService.getTheme());

  useEffect(() => {
    themeService.setTheme(theme);
    if (theme === 'sunrise') {
      document.documentElement.classList.add('sunrise-mode');
    } else {
      document.documentElement.classList.remove('sunrise-mode');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'sunset' ? 'sunrise' : 'sunset'));
  };

  return (
    <button
      onClick={toggleTheme}
      className="text-xs px-3.5 py-2 rounded-xl border font-medium transition cursor-pointer flex items-center gap-2 shadow-xs bg-neutral-900 text-amber-200 border-amber-900/30 hover:bg-neutral-800"
      title="Changer l'ambiance (Lever ou Coucher de soleil)"
    >
      <span>{theme === 'sunset' ? '🌅' : '🌄'}</span>
      <span className="hidden sm:inline">{theme === 'sunset' ? 'Lever de soleil' : 'Coucher de soleil'}</span>
    </button>
  );
}