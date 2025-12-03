
import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage.ts';
import type { Theme } from '../types.ts';

export const useTheme = () => {
    const [theme, setTheme] = useLocalStorage<Theme>('theme', 'system');

    useEffect(() => {
        const root = window.document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        root.classList.remove('light', 'dark');
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }
    }, [theme]);

    return { theme, setTheme };
};
