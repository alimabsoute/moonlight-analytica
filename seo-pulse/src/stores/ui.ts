import { create } from 'zustand';

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('seo-pulse-theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function applyThemeToDOM(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return;
  if (theme === 'light') {
    document.documentElement.classList.add('light');
  } else {
    document.documentElement.classList.remove('light');
  }
}

interface UIState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  commandPaletteOpen: boolean;
  activeModal: string | null;

  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  toggleCommandPalette: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
}

const initialTheme = getInitialTheme();
applyThemeToDOM(initialTheme);

export const useUIStore = create<UIState>()((set) => ({
  theme: initialTheme,
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  commandPaletteOpen: false,
  activeModal: null,

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('seo-pulse-theme', next);
      applyThemeToDOM(next);
      return { theme: next };
    }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  toggleMobileSidebar: () =>
    set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  openModal: (id: string) => set({ activeModal: id }),

  closeModal: () => set({ activeModal: null }),
}));
