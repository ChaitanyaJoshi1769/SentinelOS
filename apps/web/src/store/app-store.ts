'use client';

import { create } from 'zustand';

export interface AppState {
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];

  // User state
  userId: string | null;
  userRole: 'analyst' | 'admin' | 'viewer' | null;
  userName: string | null;

  // Filter state
  selectedInvestigationId: string | null;
  selectedNodeId: string | null;
  activeTab: string;
  dateRange: '7d' | '30d' | '90d';

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  setUser: (userId: string, userName: string, role: 'analyst' | 'admin' | 'viewer') => void;
  clearUser: () => void;

  setSelectedInvestigation: (id: string | null) => void;
  setSelectedNode: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  setDateRange: (range: '7d' | '30d' | '90d') => void;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  createdAt: number;
  duration?: number;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  sidebarOpen: true,
  theme: 'dark',
  notifications: [],
  userId: null,
  userRole: null,
  userName: null,
  selectedInvestigationId: null,
  selectedNodeId: null,
  activeTab: 'overview',
  dateRange: '30d',

  // UI actions
  toggleSidebar: () =>
    set((state) => ({
      sidebarOpen: !state.sidebarOpen,
    })),

  setTheme: (theme) => set({ theme }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...notification,
          id: `notif_${Date.now()}`,
          createdAt: Date.now(),
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),

  // User actions
  setUser: (userId, userName, role) =>
    set({
      userId,
      userName,
      userRole: role,
    }),

  clearUser: () =>
    set({
      userId: null,
      userName: null,
      userRole: null,
    }),

  // Filter actions
  setSelectedInvestigation: (id) => set({ selectedInvestigationId: id }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setDateRange: (range) => set({ dateRange: range }),
}));
