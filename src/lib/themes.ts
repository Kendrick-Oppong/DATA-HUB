import { AppTheme } from '../types';

export interface ThemeOption {
  id: AppTheme;
  name: string;
  dot: string;
}

export const themeOptions: ThemeOption[] = [
  { id: 'light', name: 'Daylight Clean', dot: 'bg-blue-600' },
  { id: 'dark', name: 'Midnight Obsidian', dot: 'bg-slate-900 border border-slate-700' },
  { id: 'sunset-amber', name: 'Sunset Amber', dot: 'bg-amber-400' },
  { id: 'emerald-matrix', name: 'Emerald Matrix', dot: 'bg-emerald-500' },
  { id: 'royal-indigo', name: 'Royal Indigo', dot: 'bg-indigo-600' },
  { id: 'ruby-red', name: 'Ruby Red', dot: 'bg-red-600' },
];

export const getThemeOption = (themeId: AppTheme): ThemeOption => {
  return themeOptions.find((t) => t.id === themeId) || themeOptions[0];
};
