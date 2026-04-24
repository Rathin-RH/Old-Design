'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, Download, RefreshCw, AlertCircle, Info, CheckCircle, AlertTriangle, Printer, X } from 'lucide-react';
import { StatisticsService } from '@/lib/statisticsService';
import { PrinterStatusService } from '@/lib/printerStatusService';
import { ActivityLog, PrinterErrorType } from '@/lib/types';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

export default function AdminLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [printerLogs, setPrinterLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'success'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'printer' | 'print_job' | 'system' | 'user' | 'maintenance'>('all');
  const [showPrinterLogs, setShowPrinterLogs] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const recentLogs = await StatisticsService.getRecentLogs(KIOSK_ID, 100);
      setLogs(recentLogs);
      
      // Also load printer-specific logs
      const printerOnlyLogs = await PrinterStatusService.getPrinterLogs(KIOSK_ID, 50);
      setPrinterLogs(printerOnlyLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = (showPrinterLogs ? printerLogs : logs).filter(log => {
    const typeMatch = filter === 'all' || log.type === filter;
    const categoryMatch = categoryFilter === 'all' || log.category === categoryFilter;
    return typeMatch && categoryMatch;
  });

  const exportLogs = () => {
    const data = {
      kioskId: KIOSK_ID,
      exportDate: new Date().toISOString(),
      logs: filteredLogs,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kiosk-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getLogColor = (type: ActivityLog['type']) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'success':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showPrinterLogs ? (
            <Printer className="w-6 h-6 text-primary-600" />
          ) : (
            <FileText className="w-6 h-6 text-primary-600" />
          )}
          <h3 className="text-xl font-bold text-gray-800">
            {showPrinterLogs ? 'Printer Logs' : 'Activity Logs'}
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPrinterLogs(!showPrinterLogs)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showPrinterLogs
                ? 'bg-primary-600 hover:bg-primary-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Printer className="w-4 h-4" />
            {showPrinterLogs ? 'Show All Logs' : 'Show Printer Logs'}
          </button>
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportLogs}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 font-medium">Type:</span>
          {(['all', 'info', 'success', 'warning', 'error'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap capitalize ${
                filter === type
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type}
              {type !== 'all' && (
                <span className="ml-2 text-xs">
                  ({(showPrinterLogs ? printerLogs : logs).filter(l => l.type === type).length})
                </span>
              )}
            </button>
          ))}
        </div>
        
        {!showPrinterLogs && (
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-5 h-5 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600 font-medium">Category:</span>
            {(['all', 'printer', 'print_job', 'system', 'user', 'maintenance'] as const).map((category) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap capitalize ${
                  categoryFilter === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.replace('_', ' ')}
                {category !== 'all' && (
                  <span className="ml-2 text-xs">
                    ({logs.filter(l => l.category === category).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Logs List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading logs...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No activity logs found</p>
          <p className="text-sm text-gray-500">Logs will appear here as the kiosk operates</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id || index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`border rounded-xl p-4 ${getLogColor(log.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getLogIcon(log.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{log.activity}</p>
                        {log.printerError && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            log.printerError.severity === 'critical'
                              ? 'bg-red-200 text-red-800'
                              : log.printerError.severity === 'warning'
                              ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}>
                            {log.printerError.type.replace('_', ' ')}
                          </span>
                        )}
                        {log.printerError?.resolved && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-200 text-green-800">
                            Resolved
                          </span>
                        )}
                      </div>
                      
                      {/* Printer Error Details */}
                      {log.printerError && (
                        <div className="mt-2 p-3 bg-white/70 rounded border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {log.printerError.message}
                          </p>
                          {log.printerError.paperRemaining !== undefined && log.printerError.paperTotal !== undefined && (
                            <p className="text-xs text-gray-600 mt-1">
                              Paper: {log.printerError.paperRemaining} / {log.printerError.paperTotal} pages remaining
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Severity: {log.printerError.severity} • 
                            {log.printerError.resolved 
                              ? ` Resolved at ${new Date(log.printerError.resolvedAt!).toLocaleString()}`
                              : ' Unresolved'}
                          </p>
                        </div>
                      )}
                      
                      {log.details && !log.printerError && (
                        <pre className="text-xs mt-2 p-2 bg-white/50 rounded overflow-x-auto">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs opacity-75">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                      <p className="text-xs opacity-75">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </p>
                      {log.printerError && !log.printerError.resolved && (
                        <button
                          onClick={async () => {
                            try {
                              await PrinterStatusService.resolvePrinterError(log.id, KIOSK_ID);
                              await loadLogs();
                            } catch (error) {
                              console.error('Error resolving printer error:', error);
                            }
                          }}
                          className="mt-2 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                  {log.userId && (
                    <p className="text-xs mt-1 opacity-75">
                      User: {log.userId}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-sm text-blue-600 font-medium">Info</p>
          <p className="text-2xl font-bold text-blue-700">
            {logs.filter(l => l.type === 'info').length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-sm text-green-600 font-medium">Success</p>
          <p className="text-2xl font-bold text-green-700">
            {logs.filter(l => l.type === 'success').length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-sm text-yellow-600 font-medium">Warning</p>
          <p className="text-2xl font-bold text-yellow-700">
            {logs.filter(l => l.type === 'warning').length}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-sm text-red-600 font-medium">Error</p>
          <p className="text-2xl font-bold text-red-700">
            {logs.filter(l => l.type === 'error').length}
          </p>
        </div>
      </div>
    </div>
  );
}

