import { WebPlugin } from '@capacitor/core';
import type { PrintPlugin, PrintOptions, PrintResult } from './PrintPlugin';

export class PrintWeb extends WebPlugin implements PrintPlugin {
  async print(options: PrintOptions): Promise<PrintResult> {
    console.log('Web print fallback:', options);
    
    // Fallback to window.print()
    try {
      window.print();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getPrinters(): Promise<{ printers: string[] }> {
    return { printers: [] };
  }

  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false };
  }
}





