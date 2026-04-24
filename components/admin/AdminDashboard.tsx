'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Printer, 
  TrendingUp, 
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  LogOut
} from 'lucide-react';
import { useKioskStore } from '@/lib/store';
import { StatisticsService } from '@/lib/statisticsService';
import { KioskService } from '@/lib/kioskService';
import { getStatusColor } from '@/lib/utils';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

interface Props {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: Props) {
  const { kioskSettings, printerStatus } = useKioskStore();
  const [uptime, setUptime] = useState('');

  useEffect(() => {
    if (kioskSettings?.enabledAt) {
      const updateUptime = () => {
        const uptimeSeconds = StatisticsService.calculateUptime(kioskSettings.enabledAt!);
        setUptime(StatisticsService.formatUptime(uptimeSeconds));
      };

      updateUptime();
      const interval = setInterval(updateUptime, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [kioskSettings]);

  const stats = kioskSettings?.statistics || {
    totalPrintJobs: 0,
    successfulPrints: 0,
    failedPrints: 0,
    totalRevenue: 0,
    averagePrintTime: 0,
    uptime: 0,
    paperJams: 0,
    maintenanceCount: 0,
  };

  const successRate = stats.totalPrintJobs > 0
    ? ((stats.successfulPrints / stats.totalPrintJobs) * 100).toFixed(1)
    : '0';

  const statCards = [
    {
      icon: Activity,
      label: 'Total Jobs',
      value: stats.totalPrintJobs.toLocaleString(),
      color: 'bg-blue-500',
    },
    {
      icon: CheckCircle,
      label: 'Successful',
      value: stats.successfulPrints.toLocaleString(),
      color: 'bg-green-500',
    },
    {
      icon: XCircle,
      label: 'Failed',
      value: stats.failedPrints.toLocaleString(),
      color: 'bg-red-500',
    },
    {
      icon: DollarSign,
      label: 'Revenue',
      value: `₹${stats.totalRevenue.toFixed(2)}`,
      color: 'bg-purple-500',
    },
    {
      icon: TrendingUp,
      label: 'Success Rate',
      value: `${successRate}%`,
      color: 'bg-green-500',
    },
    {
      icon: Clock,
      label: 'Uptime',
      value: uptime || 'N/A',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Kiosk Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold mb-2">{kioskSettings?.name || 'Kiosk'}</h3>
            <p className="text-white/90 mb-1">📍 {kioskSettings?.location || 'Location not set'}</p>
            <p className="text-white/90">🖨️ {kioskSettings?.printerModel || 'Brother HL-L5210DN'}</p>
            {kioskSettings?.enabledAt && (
              <p className="text-sm text-white/75 mt-2">
                Enabled: {new Date(kioskSettings.enabledAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center gap-2 ${getStatusColor(printerStatus)} px-4 py-2 rounded-full`}>
              <Printer className="w-5 h-5 text-white" />
              <span className="font-semibold capitalize text-white">{printerStatus}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`${stat.color} p-2 rounded-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm text-gray-600 font-medium">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gray-50 rounded-2xl p-6"
      >
        <h4 className="font-bold text-gray-800 mb-4">Quick Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => KioskService.updatePrinterStatus(KIOSK_ID, 'ready')}
            className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
          >
            Set Ready
          </button>
          <button
            onClick={() => KioskService.updatePrinterStatus(KIOSK_ID, 'maintenance')}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
          >
            Maintenance
          </button>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium px-4 py-3 rounded-xl transition-colors"
          >
            Refresh Kiosk
          </button>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.div>

      {/* Last Print Job */}
      {stats.lastPrintJob && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-gray-50 rounded-2xl p-6"
        >
          <h4 className="font-bold text-gray-800 mb-2">Last Print Job</h4>
          <p className="text-sm text-gray-600">
            {new Date(stats.lastPrintJob).toLocaleString()}
          </p>
        </motion.div>
      )}
    </div>
  );
}

