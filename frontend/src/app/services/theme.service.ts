import { Injectable, effect, signal } from '@angular/core';

const STORAGE_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(false);

  constructor() {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ? saved === 'dark' : prefersDark;
    this.isDark.set(initial);
    this.apply(initial);
    effect(() => {
      const dark = this.isDark();
      this.apply(dark);
      try { localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light'); } catch {}
    });
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  private apply(dark: boolean) {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', dark);
  }
}
