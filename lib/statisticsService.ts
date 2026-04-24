import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  increment,
  Timestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { KioskStatistics, ActivityLog } from './types';

export class StatisticsService {
  /**
   * Update kiosk statistics
   */
  static async updateStatistics(
    kioskId: string,
    update: Partial<KioskStatistics>
  ): Promise<void> {
    try {
      const kioskRef = doc(db, 'kiosks', kioskId);
      const updateData: any = {};

      Object.keys(update).forEach(key => {
        updateData[`statistics.${key}`] = update[key as keyof KioskStatistics];
      });

      await updateDoc(kioskRef, updateData);
    } catch (error) {
      console.error('Error updating statistics:', error);
      throw error;
    }
  }

  /**
   * Increment print job count
   */
  static async incrementPrintJob(
    kioskId: string,
    success: boolean,
    amount: number = 0
  ): Promise<void> {
    try {
      const kioskRef = doc(db, 'kiosks', kioskId);
      const updateData: any = {
        'statistics.totalPrintJobs': increment(1),
        'statistics.lastPrintJob': Timestamp.now(),
      };

      if (success) {
        updateData['statistics.successfulPrints'] = increment(1);
        updateData['statistics.totalRevenue'] = increment(amount);
      } else {
        updateData['statistics.failedPrints'] = increment(1);
      }

      await updateDoc(kioskRef, updateData);
    } catch (error) {
      console.error('Error incrementing print job:', error);
      throw error;
    }
  }

  /**
   * Get statistics for date range
   */
  static async getStatisticsByDateRange(
    kioskId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    try {
      const jobsRef = collection(db, 'printJobs');
      const q = query(
        jobsRef,
        where('kioskId', '==', kioskId),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );

      const querySnapshot = await getDocs(q);
      
      let total = 0;
      let successful = 0;
      let failed = 0;
      let revenue = 0;

      querySnapshot.forEach(doc => {
        const data = doc.data();
        total++;
        if (data.status === 'completed') {
          successful++;
          revenue += data.amount || 0;
        } else if (data.status === 'failed') {
          failed++;
        }
      });

      return { total, successful, failed, revenue };
    } catch (error) {
      console.error('Error getting statistics by date range:', error);
      throw error;
    }
  }

  /**
   * Log activity
   */
  static async logActivity(
    kioskId: string,
    activity: string,
    type: 'info' | 'warning' | 'error' | 'success',
    details?: any,
    userId?: string
  ): Promise<void> {
    try {
      const logsRef = collection(db, 'activityLogs');
      const logData: Omit<ActivityLog, 'id'> = {
        kioskId,
        activity,
        type,
        timestamp: new Date(),
        details,
        userId,
      };

      await updateDoc(doc(db, 'kiosks', kioskId), {
        lastActivity: Timestamp.now(),
        lastActivityLog: {
          ...logData,
          timestamp: Timestamp.now(),
        },
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  }

  /**
   * Get recent activity logs
   */
  static async getRecentLogs(kioskId: string, limitCount: number = 50): Promise<ActivityLog[]> {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(
        logsRef,
        where('kioskId', '==', kioskId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const logs: ActivityLog[] = [];

      querySnapshot.forEach(doc => {
        const data = doc.data();
        logs.push({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as ActivityLog);
      });

      return logs;
    } catch (error) {
      console.error('Error getting recent logs:', error);
      return [];
    }
  }

  /**
   * Calculate uptime
   */
  static calculateUptime(enabledAt: Date | any): number {
    const now = new Date();
    // Handle Firestore Timestamp objects
    const enabledDate = enabledAt?.toDate ? enabledAt.toDate() : (enabledAt instanceof Date ? enabledAt : new Date(enabledAt));
    const diff = now.getTime() - enabledDate.getTime();
    return Math.floor(diff / 1000); // return in seconds
  }

  /**
   * Format uptime
   */
  static formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}

