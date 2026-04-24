import { registerPlugin } from '@capacitor/core';

export interface PrintSettings {
  copies?: number;
  orientation?: 'portrait' | 'landscape';
  color?: boolean;
  duplex?: boolean;
  paperSize?: 'A4' | 'A3' | 'Letter';
}

export interface PrintOptions {
  documentUrl: string;
  documentName: string;
  settings?: PrintSettings;
}

export interface PrintResult {
  success: boolean;
  error?: string;
  jobId?: string;
}

export interface PrintPlugin {
  /**
   * Print a document silently without showing dialog
   */
  print(options: PrintOptions): Promise<PrintResult>;

  /**
   * Get list of available printers
   */
  getPrinters(): Promise<{ printers: string[] }>;

  /**
   * Check if printer service is available
   */
  isAvailable(): Promise<{ available: boolean }>;
}

const Print = registerPlugin<PrintPlugin>('Print', {
  web: () => import('./web').then(m => new m.PrintWeb()),
});

export default Print;

