'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, MapPin, Printer, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useKioskStore } from '@/lib/store';
import { KioskService } from '@/lib/kioskService';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PrinterStatus } from '@/lib/types';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

export default function AdminSettings() {
  const { kioskSettings, setPrinterStatus, setKioskSettings } = useKioskStore();
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [printerModel, setPrinterModel] = useState('');
  const [printerStatus, setPrinterStatusLocal] = useState<PrinterStatus>('disconnected');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (kioskSettings) {
      setName(kioskSettings.name || '');
      setLocation(kioskSettings.location || '');
      setPrinterModel(kioskSettings.printerModel || 'Brother HL-L5210DN');
      setPrinterStatusLocal(kioskSettings.printerStatus || 'disconnected');
      setIsActive(kioskSettings.isActive !== false);
    }
  }, [kioskSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const kioskRef = doc(db, 'kiosks', KIOSK_ID);
      const updateData: any = {
        name,
        location,
        printerModel,
        printerStatus,
        isActive,
        updatedAt: Timestamp.now(),
      };

      // If enabling for first time, set enabledAt
      if (isActive && !kioskSettings?.enabledAt) {
        updateData.enabledAt = Timestamp.now();
      }

      await updateDoc(kioskRef, updateData);
      
      // Update local state
      setPrinterStatus(printerStatus);
      setKioskSettings({
        ...kioskSettings!,
        ...updateData,
        enabledAt: updateData.enabledAt?.toDate() || kioskSettings?.enabledAt,
      });

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMaintenanceUpdate = async () => {
    try {
      const kioskRef = doc(db, 'kiosks', KIOSK_ID);
      await updateDoc(kioskRef, {
        lastMaintenance: Timestamp.now(),
        'statistics.maintenanceCount': (kioskSettings?.statistics?.maintenanceCount || 0) + 1,
      });
      toast.success('Maintenance timestamp updated');
    } catch (error) {
      console.error('Error updating maintenance:', error);
      toast.error('Failed to update maintenance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary-600" />
        <h3 className="text-xl font-bold text-gray-800">Kiosk Settings</h3>
      </div>

      {/* Kiosk Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary-500" />
          Kiosk Information
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kiosk ID (Read-only)
            </label>
            <input
              type="text"
              value={KIOSK_ID}
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kiosk Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Library Kiosk 1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main Library, 2nd Floor"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Kiosk is Active and Available
            </label>
          </div>
        </div>
      </motion.div>

      {/* Printer Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Printer className="w-5 h-5 text-primary-500" />
          Printer Configuration
        </h4>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Printer Model
            </label>
            <input
              type="text"
              value={printerModel}
              onChange={(e) => setPrinterModel(e.target.value)}
              placeholder="e.g., Brother HL-L5210DN"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Printer Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['ready', 'connected', 'disconnected', 'maintenance', 'printing', 'error'] as PrinterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setPrinterStatusLocal(status)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all capitalize ${
                    printerStatus === status
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium mb-2">
              Brother HL-L5210DN Setup Tips:
            </p>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Ensure printer is connected to network</li>
              <li>Set printer as default in system settings</li>
              <li>Enable "Print without dialog" in browser</li>
              <li>Configure duplex printing if needed</li>
              <li>Check paper tray and toner levels regularly</li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Maintenance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-gray-200 rounded-xl p-6"
      >
        <h4 className="font-bold text-gray-800 mb-4">Maintenance</h4>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Last Maintenance:</span>
            <span className="font-semibold text-gray-800">
              {kioskSettings?.lastMaintenance
                ? new Date(kioskSettings.lastMaintenance).toLocaleString()
                : 'Never'}
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Maintenance Count:</span>
            <span className="font-semibold text-gray-800">
              {kioskSettings?.statistics?.maintenanceCount || 0}
            </span>
          </div>

          <button
            onClick={handleMaintenanceUpdate}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-medium px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Update Maintenance Timestamp
          </button>
        </div>
      </motion.div>

      {/* Enabled Timestamp */}
      {kioskSettings?.enabledAt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 border border-gray-200 rounded-xl p-6"
        >
          <h4 className="font-bold text-gray-800 mb-4">System Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Kiosk Enabled At:</span>
              <span className="font-semibold text-gray-800">
                {new Date(kioskSettings.enabledAt).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created At:</span>
              <span className="font-semibold text-gray-800">
                {kioskSettings.createdAt
                  ? new Date(kioskSettings.createdAt).toLocaleString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold px-6 py-4 rounded-xl transition-colors flex items-center justify-center gap-3"
        >
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </motion.div>
    </div>
  );
}

