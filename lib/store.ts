import { create } from 'zustand';
import { PrinterStatus, KioskSettings, PrintJob } from './types';

interface KioskState {
  // Printer state
  printerStatus: PrinterStatus;
  setPrinterStatus: (status: PrinterStatus) => void;
  
  // Kiosk settings
  kioskSettings: KioskSettings | null;
  setKioskSettings: (settings: KioskSettings) => void;
  
  // Current print job
  currentJob: PrintJob | null;
  setCurrentJob: (job: PrintJob | null) => void;
  
  // Admin panel
  isAdminPanelOpen: boolean;
  setAdminPanelOpen: (open: boolean) => void;
  adminSecretTaps: number;
  incrementSecretTaps: () => void;
  resetSecretTaps: () => void;
  
  // UI state
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  
  // Error handling
  error: string | null;
  setError: (error: string | null) => void;
  
  // Idle state
  isIdle: boolean;
  setIsIdle: (idle: boolean) => void;
  lastActivity: number;
  updateLastActivity: () => void;
}

export const useKioskStore = create<KioskState>((set) => ({
  // Printer state
  printerStatus: 'disconnected',
  setPrinterStatus: (status) => set({ printerStatus: status }),
  
  // Kiosk settings
  kioskSettings: null,
  setKioskSettings: (settings) => set({ kioskSettings: settings }),
  
  // Current print job
  currentJob: null,
  setCurrentJob: (job) => set({ currentJob: job }),
  
  // Admin panel
  isAdminPanelOpen: false,
  setAdminPanelOpen: (open) => set({ isAdminPanelOpen: open, adminSecretTaps: 0 }),
  adminSecretTaps: 0,
  incrementSecretTaps: () => set((state) => ({ 
    adminSecretTaps: state.adminSecretTaps + 1 
  })),
  resetSecretTaps: () => set({ adminSecretTaps: 0 }),
  
  // UI state
  isScanning: false,
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  
  // Error handling
  error: null,
  setError: (error) => set({ error }),
  
  // Idle state
  isIdle: false,
  setIsIdle: (idle) => set({ isIdle: idle }),
  lastActivity: Date.now(),
  updateLastActivity: () => set({ lastActivity: Date.now(), isIdle: false }),
}));

