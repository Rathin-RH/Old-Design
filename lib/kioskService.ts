import { db } from './firebase';
import {
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  onSnapshot,
  addDoc,
  collection,
} from 'firebase/firestore';
import { KioskSettings, PrinterStatus } from './types';
import { logger } from './utils';

export class KioskService {
  /**
   * Fetch kiosk settings
   */
  static async getKioskSettings(kioskId: string): Promise<KioskSettings | null> {
    try {
      logger.event('KioskService', 'getKioskSettings:start', { kioskId });
      const kioskRef = doc(db, 'kiosks', kioskId);
      const kioskDoc = await getDoc(kioskRef);

      if (!kioskDoc.exists()) {
        logger.info('KioskService', 'kiosk not found', { kioskId });
        return null;
      }

      const data = kioskDoc.data();
      return {
        id: kioskDoc.id,
        ...data,
        lastMaintenance: data.lastMaintenance?.toDate() || new Date(),
      } as KioskSettings;
    } catch (error) {
      logger.error('KioskService', 'getKioskSettings:error', error);
      throw error;
    }
  }

  /**
   * Update printer status
   */
  static async updatePrinterStatus(
    kioskId: string,
    status: PrinterStatus
  ): Promise<void> {
    try {
      logger.event('KioskService', 'updatePrinterStatus', { kioskId, status });
      const kioskRef = doc(db, 'kiosks', kioskId);
      await updateDoc(kioskRef, {
        printerStatus: status,
        lastStatusUpdate: Timestamp.now(),
      });
    } catch (error) {
      logger.error('KioskService', 'updatePrinterStatus:error', error);
      throw error;
    }
  }

  /**
   * Subscribe to kiosk settings changes
   */
  static subscribeToKiosk(
    kioskId: string,
    callback: (settings: KioskSettings | null) => void
  ): () => void {
    const kioskRef = doc(db, 'kiosks', kioskId);

    return onSnapshot(kioskRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        logger.event('KioskService', 'subscribeToKiosk:update', { kioskId });
        callback({
          id: docSnap.id,
          ...data,
          lastMaintenance: data.lastMaintenance?.toDate() || new Date(),
        } as KioskSettings);
      } else {
        logger.info('KioskService', 'subscribeToKiosk:none', { kioskId });
        callback(null);
      }
    });
  }

  /**
   * Check printer connection
   */
  static async checkPrinterConnection(kioskId: string): Promise<PrinterStatus> {
    try {
      const settings = await this.getKioskSettings(kioskId);
      return settings?.printerStatus || 'disconnected';
    } catch (error) {
      console.error('Error checking printer connection:', error);
      return 'disconnected';
    }
  }

  /**
   * Log printer activity
   */
  static async logActivity(
    kioskId: string,
    activity: string,
    details?: any
  ): Promise<void> {
    // Serialize details to avoid Firestore issues with Error objects
    let serializedDetails = details;

    if (details && typeof details === 'object') {
      if (details instanceof Error) {
        serializedDetails = {
          message: details.message,
          name: details.name,
          stack: details.stack,
        };
      } else if (details.error instanceof Error) {
        serializedDetails = {
          ...details,
          error: {
            message: details.error.message,
            name: details.error.name,
            stack: details.error.stack,
          },
        };
      }
    }

    try {
      const kioskRef = doc(db, 'kiosks', kioskId);

      await updateDoc(kioskRef, {
        lastActivity: Timestamp.now(),
        lastActivityLog: {
          activity,
          details: serializedDetails,
          timestamp: Timestamp.now(),
        },
      });
    } catch (error) {
      console.warn('Primary kiosk activity logging failed:', error);

      // Optional fallback log collection
      try {
        await addDoc(collection(db, 'activityLogs'), {
          kioskId,
          activity,
          details: serializedDetails,
          timestamp: Timestamp.now(),
        });
      } catch (err) {
        console.warn('Fallback logging failed (ignored):', err);
      }
    }
  }
}