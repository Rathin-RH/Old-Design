'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Download, TrendingUp } from 'lucide-react';
import { useKioskStore } from '@/lib/store';
import { StatisticsService } from '@/lib/statisticsService';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

export default function AdminStatistics() {
  const { kioskSettings } = useKioskStore();
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [customStats, setCustomStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStatistics = useCallback(async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          startDate = new Date(0); // All time
      }

      const stats = await StatisticsService.getStatisticsByDateRange(
        KIOSK_ID,
        startDate,
        new Date()
      );
      setCustomStats(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const stats = kioskSettings?.statistics || {
    totalPrintJobs: 0,
    successfulPrints: 0,
    failedPrints: 0,
    totalRevenue: 0,
    paperJams: 0,
    maintenanceCount: 0,
    averagePrintTime: 0,
  };

  const exportData = () => {
    const data = {
      kioskId: KIOSK_ID,
      exportDate: new Date().toISOString(),
      dateRange,
      statistics: customStats || stats,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiosk-stats-${dateRange}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-primary-600" />
          <h3 className="text-xl font-bold text-gray-800">Detailed Statistics</h3>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="flex gap-2 overflow-x-auto">
        {(['today', 'week', 'month', 'all'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              dateRange === range
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading statistics...</p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Jobs"
              value={customStats?.total || stats.totalPrintJobs}
              color="blue"
            />
            <StatCard
              label="Successful"
              value={customStats?.successful || stats.successfulPrints}
              color="green"
            />
            <StatCard
              label="Failed"
              value={customStats?.failed || stats.failedPrints}
              color="red"
            />
            <StatCard
              label="Revenue"
              value={`₹${(customStats?.revenue || stats.totalRevenue).toFixed(2)}`}
              color="purple"
            />
          </div>

          {/* Detailed Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Print Performance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Print Performance
              </h4>
              <div className="space-y-3">
                <StatRow
                  label="Success Rate"
                  value={`${stats.totalPrintJobs > 0 ? ((stats.successfulPrints / stats.totalPrintJobs) * 100).toFixed(1) : 0}%`}
                />
                <StatRow
                  label="Failure Rate"
                  value={`${stats.totalPrintJobs > 0 ? ((stats.failedPrints / stats.totalPrintJobs) * 100).toFixed(1) : 0}%`}
                />
                <StatRow label="Avg Print Time" value={`${(stats as any).averagePrintTime || 0}s`} />
              </div>
            </motion.div>

            {/* Maintenance */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <h4 className="font-bold text-gray-800 mb-4">Maintenance Stats</h4>
              <div className="space-y-3">
                <StatRow label="Paper Jams" value={stats.paperJams || 0} />
                <StatRow label="Maintenance Count" value={stats.maintenanceCount || 0} />
                <StatRow
                  label="Last Maintenance"
                  value={kioskSettings?.lastMaintenance
                    ? new Date(kioskSettings.lastMaintenance).toLocaleDateString()
                    : 'Never'}
                />
              </div>
            </motion.div>
          </div>

          {/* Revenue Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white border border-gray-200 rounded-xl p-6"
          >
            <h4 className="font-bold text-gray-800 mb-4">Revenue Analysis</h4>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-700">
                  ₹{stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium mb-1">Avg per Job</p>
                <p className="text-2xl font-bold text-blue-700">
                  ₹{stats.totalPrintJobs > 0 ? (stats.totalRevenue / stats.totalPrintJobs).toFixed(2) : '0.00'}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium mb-1">Successful Jobs</p>
                <p className="text-2xl font-bold text-green-700">
                  ₹{stats.successfulPrints > 0 ? (stats.totalRevenue / stats.successfulPrints * stats.successfulPrints).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className={`${colorClasses[color as keyof typeof colorClasses]} w-2 h-10 rounded mb-2`} />
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

