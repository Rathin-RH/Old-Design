'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useKioskStore } from '@/lib/store';
import { auth, db } from '@/lib/firebase';
import { logger } from '@/lib/utils';
import { AuthService } from '@/lib/authService';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import AdminDashboard from './admin/AdminDashboard';
import AdminStatistics from './admin/AdminStatistics';
import AdminSettings from './admin/AdminSettings';
import AdminAdvertisements from './admin/AdminAdvertisements';
import AdminLogs from './admin/AdminLogs';

const KIOSK_ID = process.env.NEXT_PUBLIC_KIOSK_ID || 'KIOSK_001';

type TabType = 'dashboard' | 'statistics' | 'settings' | 'advertisements' | 'logs';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  
  const { setAdminPanelOpen } = useKioskStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      logger.event('AdminPanel', 'login:attempt', { email });
      
      // Sign out anonymous session first
      if (AuthService.isAnonymous()) {
        await AuthService.signOut();
      }

      // Sign in as admin
      const user = await AuthService.signInAdmin(email, password);
      if (!user) {
        toast.error('Authentication failed');
        return;
      }

      // Prefer admins collection: admins/{uid} with fields { role: 'admin'|'superadmin', enabled: true }
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);
      const adminRole = adminSnap.exists() ? (adminSnap.data() as any).role : undefined;
      const adminEnabled = adminSnap.exists() ? (adminSnap.data() as any).enabled !== false : false;

      if (adminSnap.exists() && adminEnabled && (adminRole === 'admin' || adminRole === 'superadmin')) {
        setIsAuthenticated(true);
        logger.event('AdminPanel', 'login:success', { uid: user.uid });
        toast.success('Admin authenticated');
      } else {
        // Fallback: check users collection role === 'admin' for backward compatibility
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        const role = userSnap.exists() ? (userSnap.data() as any).role : undefined;
        if (role === 'admin') {
          setIsAuthenticated(true);
          logger.event('AdminPanel', 'login:success:users-role', { uid: user.uid });
          toast.success('Admin authenticated');
          return;
        }
        // Not admin - sign out and restore anonymous
        await AuthService.signOut();
        await AuthService.signInAnonymous();
        setIsAuthenticated(false);
        logger.warn('AdminPanel', 'login:denied:not-admin', { email });
        toast.error('Access denied: admin role required');
        return;
      }
    } catch (error: any) {
      logger.error('AdminPanel', 'login:error', error);
      toast.error('Authentication failed');
      // Restore anonymous auth on error
      await AuthService.signInAnonymous();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      logger.event('AdminPanel', 'logout');
      await AuthService.signOut();
      // Restore anonymous auth for kiosk operations
      await AuthService.signInAnonymous();
      setIsAuthenticated(false);
      setEmail('');
      setPassword('');
      toast.success('Logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleClose = () => {
    setAdminPanelOpen(false);
    if (isAuthenticated) {
      handleLogout();
    }
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'statistics', label: 'Statistics' },
    { id: 'settings', label: 'Settings' },
    { id: 'advertisements', label: 'Ads' },
    { id: 'logs', label: 'Logs' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full h-[95vh] overflow-hidden flex flex-col"
          style={{ maxWidth: '95vw', maxHeight: '95vh' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Admin Control Panel</h2>
                  <p className="text-sm text-gray-300">Kiosk ID: {KIOSK_ID}</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Tabs */}
            {isAuthenticated && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 kiosk-admin-scrollable p-6">
            {!isAuthenticated ? (
              // Login Form
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleLogin}
                className="max-w-md mx-auto space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  {isLoading ? 'Authenticating...' : 'Login'}
                </button>
              </motion.form>
            ) : (
              // Admin Content
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'dashboard' && <AdminDashboard onLogout={handleLogout} />}
                  {activeTab === 'statistics' && <AdminStatistics />}
                  {activeTab === 'settings' && <AdminSettings />}
                  {activeTab === 'advertisements' && <AdminAdvertisements />}
                  {activeTab === 'logs' && <AdminLogs />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
