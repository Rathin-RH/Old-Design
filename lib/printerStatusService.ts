import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { PrinterErrorType, PrinterErrorDetails, ActivityLog } from './types';
import { logger } from './utils';
import { KioskService } from './kioskService';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

export class PrinterStatusService {
  /**
   * Detect printer errors from print attempt results
   */
  static detectPrinterError(
    error: any,
    printResult?: { success: boolean; method?: string }
  ): PrinterErrorType | null {
    if (!error && printResult?.success) {
      return null; // No error
    }

    const errorMessage = error?.message?.toLowerCase() || '';
    const errorName = error?.name?.toLowerCase() || '';

    // Check for connection errors
    if (
      errorMessage.includes('failed to fetch') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('connection') ||
      errorName.includes('networkerror') ||
      errorName.includes('timeout')
    ) {
      return 'connection_timeout';
    }

    // Check for print dialog cancellation (user cancelled)
    if (errorMessage.includes('cancel') || errorMessage.includes('abort')) {
      return 'print_failed';
    }

    // Check for printer not available
    if (
      errorMessage.includes('printer not found') ||
      errorMessage.includes('no printer') ||
      errorMessage.includes('printer unavailable')
    ) {
      return 'not_connected';
    }

    // Check for paper-related errors
    if (
      errorMessage.includes('paper jam') ||
      errorMessage.includes('jam') ||
      errorMessage.includes('stuck')
    ) {
      return 'paper_jam';
    }

    if (
      errorMessage.includes('out of paper') ||
      errorMessage.includes('no paper') ||
      errorMessage.includes('paper empty')
    ) {
      return 'out_of_paper';
    }

    if (
      errorMessage.includes('low paper') ||
      errorMessage.includes('paper low') ||
      errorMessage.includes('paper running low')
    ) {
      return 'low_paper';
    }

    // Check for ink/toner errors
    if (
      errorMessage.includes('ink low') ||
      errorMessage.includes('toner low') ||
      errorMessage.includes('low ink')
    ) {
      return 'ink_low';
    }

    if (
      errorMessage.includes('ink empty') ||
      errorMessage.includes('toner empty') ||
      errorMessage.includes('out of ink')
    ) {
      return 'ink_empty';
    }

    // Check for hardware errors
    if (
      errorMessage.includes('cover open') ||
      errorMessage.includes('door open') ||
      errorMessage.includes('open cover')
    ) {
      return 'cover_open';
    }

    if (
      errorMessage.includes('tray missing') ||
      errorMessage.includes('no tray') ||
      errorMessage.includes('tray empty')
    ) {
      return 'tray_missing';
    }

    // Generic print failure
    if (!printResult?.success || error) {
      return 'print_failed';
    }

    return 'unknown_error';
  }

  /**
   * Log printer error to Firestore
   */
  static async logPrinterError(
    kioskId: string,
    errorType: PrinterErrorType,
    errorMessage: string,
    details?: {
      paperRemaining?: number;
      paperTotal?: number;
      printJobId?: string;
      userId?: string;
      error?: any;
    }
  ): Promise<string> {
    try {
      const printerError: PrinterErrorDetails = {
        type: errorType,
        message: errorMessage,
        severity: this.getErrorSeverity(errorType),
        paperRemaining: details?.paperRemaining,
        paperTotal: details?.paperTotal,
        timestamp: new Date(),
        resolved: false,
      };

      // Create activity log with printer error
      const activityLog: Omit<ActivityLog, 'id'> = {
        kioskId,
        timestamp: new Date(),
        activity: this.getErrorActivityMessage(errorType, details),
        type: printerError.severity === 'critical' ? 'error' : 'warning',
        category: 'printer',
        details: {
          error: details?.error,
          printJobId: details?.printJobId,
          printMethod: details?.error?.method,
        },
        userId: details?.userId,
        printerError,
      };

      // Add to activity logs collection
      const logsRef = collection(db, 'activityLogs');
      const docRef = await addDoc(logsRef, {
        ...activityLog,
        timestamp: Timestamp.now(),
        printerError: {
          ...printerError,
          timestamp: Timestamp.now(),
        },
      });

      // Also log via KioskService for backward compatibility
      await KioskService.logActivity(kioskId, activityLog.activity, {
        printerError,
        ...activityLog.details,
      });

      // Update kiosk printer status
      const statusMap: Record<PrinterErrorType, string> = {
        not_connected: 'disconnected',
        connection_timeout: 'disconnected',
        print_failed: 'error',
        paper_jam: 'error',
        out_of_paper: 'error',
        low_paper: 'warning',
        ink_low: 'warning',
        ink_empty: 'error',
        cover_open: 'error',
        tray_missing: 'error',
        unknown_error: 'error',
      };

      await KioskService.updatePrinterStatus(
        kioskId,
        statusMap[errorType] as any
      );

      logger.event('PrinterStatusService', 'logPrinterError', {
        kioskId,
        errorType,
        logId: docRef.id,
      });

      return docRef.id;
    } catch (error) {
      logger.error('PrinterStatusService', 'logPrinterError:error', error);
      throw error;
    }
  }

  /**
   * Log successful printer connection
   */
  static async logPrinterConnected(
    kioskId: string,
    details?: { printerModel?: string; printerName?: string }
  ): Promise<void> {
    try {
      const activityLog: Omit<ActivityLog, 'id'> = {
        kioskId,
        timestamp: new Date(),
        activity: 'Printer connected successfully',
        type: 'success',
        category: 'printer',
        details,
      };

      const logsRef = collection(db, 'activityLogs');
      await addDoc(logsRef, {
        ...activityLog,
        timestamp: Timestamp.now(),
      });

      await KioskService.logActivity(kioskId, activityLog.activity, details);
      await KioskService.updatePrinterStatus(kioskId, 'connected');

      logger.event('PrinterStatusService', 'logPrinterConnected', { kioskId });
    } catch (error) {
      logger.error('PrinterStatusService', 'logPrinterConnected:error', error);
    }
  }

  /**
   * Log successful print completion
   */
  static async logPrintSuccess(
    kioskId: string,
    printJobId: string,
    details?: { copies?: number; pages?: number; duration?: number }
  ): Promise<void> {
    try {
      const activityLog: Omit<ActivityLog, 'id'> = {
        kioskId,
        timestamp: new Date(),
        activity: `Print job completed successfully (${details?.copies || 1} copies)`,
        type: 'success',
        category: 'print_job',
        details: {
          printJobId,
          ...details,
        },
      };

      const logsRef = collection(db, 'activityLogs');
      await addDoc(logsRef, {
        ...activityLog,
        timestamp: Timestamp.now(),
      });

      await KioskService.logActivity(kioskId, activityLog.activity, {
        printJobId,
        ...details,
      });

      logger.event('PrinterStatusService', 'logPrintSuccess', {
        kioskId,
        printJobId,
      });
    } catch (error) {
      logger.error('PrinterStatusService', 'logPrintSuccess:error', error);
    }
  }

  /**
   * Mark printer error as resolved
   */
  static async resolvePrinterError(
    logId: string,
    kioskId: string
  ): Promise<void> {
    try {
      const logRef = doc(db, 'activityLogs', logId);
      await updateDoc(logRef, {
        'printerError.resolved': true,
        'printerError.resolvedAt': Timestamp.now(),
      });

      // Update kiosk status back to ready
      await KioskService.updatePrinterStatus(kioskId, 'ready');

      logger.event('PrinterStatusService', 'resolvePrinterError', {
        logId,
        kioskId,
      });
    } catch (error) {
      logger.error('PrinterStatusService', 'resolvePrinterError:error', error);
      throw error;
    }
  }

  /**
   * Get recent printer logs
   */
  static async getPrinterLogs(
    kioskId: string,
    limitCount: number = 50
  ): Promise<ActivityLog[]> {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(
        logsRef,
        where('kioskId', '==', kioskId),
        where('category', '==', 'printer'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          printerError: data.printerError
            ? {
                ...data.printerError,
                timestamp: data.printerError.timestamp?.toDate() || new Date(),
                resolvedAt: data.printerError.resolvedAt?.toDate(),
              }
            : undefined,
        } as ActivityLog;
      });
    } catch (error) {
      logger.error('PrinterStatusService', 'getPrinterLogs:error', error);
      return [];
    }
  }

  /**
   * Get unresolved printer errors
   */
  static async getUnresolvedErrors(
    kioskId: string
  ): Promise<ActivityLog[]> {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(
        logsRef,
        where('kioskId', '==', kioskId),
        where('category', '==', 'printer'),
        where('printerError.resolved', '==', false),
        orderBy('timestamp', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          printerError: data.printerError
            ? {
                ...data.printerError,
                timestamp: data.printerError.timestamp?.toDate() || new Date(),
              }
            : undefined,
        } as ActivityLog;
      });
    } catch (error) {
      logger.error('PrinterStatusService', 'getUnresolvedErrors:error', error);
      return [];
    }
  }

  /**
   * Check printer connection status (simulated - in production, ping actual printer)
   */
  static async checkPrinterConnection(kioskId: string): Promise<{
    connected: boolean;
    status: string;
    error?: PrinterErrorType;
  }> {
    try {
      // In production, this would ping the actual printer via IPP or USB
      // For now, we'll check the last known status
      const settings = await KioskService.getKioskSettings(kioskId);
      
      if (!settings) {
        return {
          connected: false,
          status: 'Kiosk not found',
          error: 'not_connected',
        };
      }

      const isConnected = settings.printerStatus === 'connected' || 
                          settings.printerStatus === 'ready' ||
                          settings.printerStatus === 'printing';

      return {
        connected: isConnected,
        status: settings.printerStatus,
        error: !isConnected ? 'not_connected' : undefined,
      };
    } catch (error) {
      logger.error('PrinterStatusService', 'checkPrinterConnection:error', error);
      return {
        connected: false,
        status: 'Error checking connection',
        error: 'connection_timeout',
      };
    }
  }

  // Helper methods
  private static getErrorSeverity(
    errorType: PrinterErrorType
  ): 'critical' | 'warning' | 'info' {
    const severityMap: Record<PrinterErrorType, 'critical' | 'warning' | 'info'> = {
      not_connected: 'critical',
      connection_timeout: 'critical',
      print_failed: 'warning',
      paper_jam: 'critical',
      out_of_paper: 'critical',
      low_paper: 'warning',
      ink_low: 'warning',
      ink_empty: 'critical',
      cover_open: 'critical',
      tray_missing: 'critical',
      unknown_error: 'warning',
    };

    return severityMap[errorType] || 'warning';
  }

  private static getErrorActivityMessage(
    errorType: PrinterErrorType,
    details?: { paperRemaining?: number; paperTotal?: number }
  ): string {
    const messages: Record<PrinterErrorType, string> = {
      not_connected: 'Printer not connected',
      connection_timeout: 'Printer connection timeout',
      print_failed: 'Print job failed',
      paper_jam: 'Paper jam detected',
      out_of_paper: 'Printer out of paper',
      low_paper: details?.paperRemaining && details?.paperTotal
        ? `Low paper: ${details.paperRemaining} remaining out of ${details.paperTotal} pages`
        : 'Low paper warning',
      ink_low: 'Ink/Toner running low',
      ink_empty: 'Ink/Toner empty',
      cover_open: 'Printer cover is open',
      tray_missing: 'Paper tray missing',
      unknown_error: 'Unknown printer error',
    };

    return messages[errorType] || 'Printer error';
  }
}






