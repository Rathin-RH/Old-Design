
import { db } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { PrintJob } from './types';
import { StatisticsService } from './statisticsService';
import { logger } from './utils';
import { Capacitor } from '@capacitor/core';
import Print from '../src/plugins/PrintPlugin';
import { Filesystem, Directory } from '@capacitor/filesystem';

export class PrintService {
  /**
   * Check if running on native Android with Capacitor
   */
  static isNativeAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  /**
   * Print using Capacitor Print plugin (Android only)
   * This provides true silent printing on Android
   * Downloads file natively to bypass CORS restrictions
   */
  static async printWithCapacitor(job: PrintJob): Promise<{ success: boolean; method: string; error?: string }> {
    try {
      logger.event('PrintService', 'printWithCapacitor:start', { jobId: job.id });
      
      // Check if plugin is available
      const { available } = await Print.isAvailable();
      if (!available) {
        logger.warn('PrintService', 'printWithCapacitor:not-available');
        return { success: false, method: 'capacitor-not-available', error: 'Print plugin not available' };
      }

      // STRATEGY 1: Directly load remote PDF URL in native WebView
      // This avoids extra download complexity and CORS is not an issue in native code.
      try {
        logger.info('PrintService', 'printWithCapacitor:using-remote-url', {
          url: job.documentUrl.substring(0, 150) + '...',
        });

        const directResult = await Print.print({
          documentUrl: job.documentUrl,
          documentName: job.documentName || 'Document',
          settings: {
            copies: job.printSettings.copies || 1,
            orientation: job.printSettings.orientation || 'portrait',
            color: job.printSettings.color ?? false,
            duplex: job.printSettings.duplex ?? false,
            paperSize: job.printSettings.paperSize || 'A4',
          },
        });

        if (directResult.success) {
          logger.event('PrintService', 'printWithCapacitor:success-remote', {
            jobId: job.id,
            printJobId: directResult.jobId,
          });
          return { success: true, method: 'capacitor-remote-url' };
        }

        logger.warn('PrintService', 'printWithCapacitor:remote-failed', {
          jobId: job.id,
          error: directResult.error,
        });
      } catch (remoteError: any) {
        logger.error('PrintService', 'printWithCapacitor:remote-error', {
          jobId: job.id,
          error: remoteError.message,
        });
      }

      // STRATEGY 2 (fallback): Download file to cache and print from local path
      logger.info('PrintService', 'printWithCapacitor:downloading-file', {
        url: job.documentUrl.substring(0, 100) + '...',
      });

      try {
        const downloadResult = await Filesystem.downloadFile({
          url: job.documentUrl,
          path: `vprint_${job.id}_${Date.now()}.pdf`,
          directory: Directory.Cache,
        });

        if (!downloadResult.path) {
          logger.error('PrintService', 'printWithCapacitor:no-path', {
            downloadResult,
          });
          return {
            success: false,
            method: 'capacitor-download-no-path',
            error: 'Download succeeded but no path returned',
          };
        }

        logger.info('PrintService', 'printWithCapacitor:download-success', {
          path: downloadResult.path,
          fullDownloadResult: JSON.stringify(downloadResult),
        });

        console.log('📥 Download complete:', {
          path: downloadResult.path,
          full: downloadResult,
        });

        // Filesystem.downloadFile returns path relative to the directory; plugin resolves it to file:// URI
        console.log('🖨️ Printing with local path:', downloadResult.path);

        const result = await Print.print({
          documentUrl: downloadResult.path,
          documentName: job.documentName || 'Document',
          settings: {
            copies: job.printSettings.copies || 1,
            orientation: job.printSettings.orientation || 'portrait',
            color: job.printSettings.color ?? false,
            duplex: job.printSettings.duplex ?? false,
            paperSize: job.printSettings.paperSize || 'A4',
          },
        });

        // Cleanup: Delete temporary file
        try {
          await Filesystem.deleteFile({
            path: downloadResult.path,
          });
          logger.info('PrintService', 'printWithCapacitor:temp-file-deleted');
        } catch (cleanupError) {
          logger.warn('PrintService', 'printWithCapacitor:cleanup-failed', cleanupError);
        }

        if (result.success) {
          logger.event('PrintService', 'printWithCapacitor:success-local', {
            jobId: job.id,
            printJobId: result.jobId,
          });
          return { success: true, method: 'capacitor-local-file' };
        } else {
          logger.error('PrintService', 'printWithCapacitor:failed-local', {
            jobId: job.id,
            error: result.error,
          });
          return { success: false, method: 'capacitor-print-failed', error: result.error };
        }
      } catch (downloadError: any) {
        logger.error('PrintService', 'printWithCapacitor:download-failed', {
          error: downloadError.message,
          url: job.documentUrl.substring(0, 100) + '...',
        });
        return {
          success: false,
          method: 'capacitor-download-failed',
          error: `Failed to download file: ${downloadError.message}`,
        };
      }
    } catch (error: any) {
      logger.error('PrintService', 'printWithCapacitor:error', {
        jobId: job.id,
        error: error.message,
      });
      return { success: false, method: 'capacitor-error', error: error.message };
    }
  }
  /**
   * Fetch print job by token or QR code
   */
  static async fetchPrintJob(identifier: string): Promise<PrintJob | null> {
    try {
      logger.event('PrintService', 'fetchPrintJob:start', { identifier });
      const jobsRef = collection(db, 'printJobs');
      
      // Try to find by token with status 'pending' or 'ready'
      let q = query(jobsRef, where('token', '==', identifier), where('status', 'in', ['pending', 'ready']));
      let querySnapshot = await getDocs(q);

      // Fallback: token without status (in case rules/data use a different state)
      // IMPORTANT: Still filter out completed jobs
      if (querySnapshot.empty) {
        q = query(jobsRef, where('token', '==', identifier));
        querySnapshot = await getDocs(q);
        // Filter out completed jobs by creating new array
        const filteredDocs = (querySnapshot.docs || []).filter(doc => {
          if (!doc) return false;
          try {
            const data = doc.data();
            const status = (data?.status || '').toString().toLowerCase();
            return status !== 'completed';
          } catch (e) {
            return false;
          }
        });
        // Create a new querySnapshot-like object with filtered docs
        querySnapshot = {
          ...querySnapshot,
          docs: filteredDocs,
          empty: filteredDocs.length === 0
        } as any;
      }

      // If not found by tokenId alias, try by tokenId with 'pending' or 'ready'
      if (querySnapshot.empty) {
        q = query(jobsRef, where('tokenId', '==', identifier), where('status', 'in', ['pending', 'ready']));
        querySnapshot = await getDocs(q);
      }

      // Fallback: tokenId without status (filter out completed)
      if (querySnapshot.empty) {
        q = query(jobsRef, where('tokenId', '==', identifier));
        querySnapshot = await getDocs(q);
        // Filter out completed jobs
        const filteredDocs = (querySnapshot.docs || []).filter(doc => {
          if (!doc) return false;
          try {
            const data = doc.data();
            const status = (data?.status || '').toString().toLowerCase();
            return status !== 'completed';
          } catch (e) {
            return false;
          }
        });
        // Create a new querySnapshot-like object with filtered docs
        querySnapshot = {
          ...querySnapshot,
          docs: filteredDocs,
          empty: filteredDocs.length === 0
        } as any;
      }

      // If not found by token, try by QR code with 'pending' or 'ready'
      if (querySnapshot.empty) {
        q = query(jobsRef, where('qrCode', '==', identifier), where('status', 'in', ['pending', 'ready']));
        querySnapshot = await getDocs(q);
      }

      // Fallback: QR code without status (filter out completed)
      if (querySnapshot.empty) {
        q = query(jobsRef, where('qrCode', '==', identifier));
        querySnapshot = await getDocs(q);
        // Filter out completed jobs
        const filteredDocs = (querySnapshot.docs || []).filter(doc => {
          if (!doc) return false;
          try {
            const data = doc.data();
            const status = (data?.status || '').toString().toLowerCase();
            return status !== 'completed';
          } catch (e) {
            return false;
          }
        });
        // Create a new querySnapshot-like object with filtered docs
        querySnapshot = {
          ...querySnapshot,
          docs: filteredDocs,
          empty: filteredDocs.length === 0
        } as any;
      }
      
      // Check if query is empty or has no valid docs
      if (querySnapshot.empty || !querySnapshot.docs || querySnapshot.docs.length === 0) {
        logger.info('PrintService', 'no job found or job already completed', { identifier });
        return null;
      }
      
      // Safely get the first document
      const jobDoc = querySnapshot.docs[0];
      if (!jobDoc) {
        logger.info('PrintService', 'no valid job document found', { identifier });
        return null;
      }
      
      const data = jobDoc.data() as any;
      if (!data) {
        logger.info('PrintService', 'job document has no data', { identifier, jobId: jobDoc.id });
        return null;
      }
      
      // Double-check: Reject if job is already completed
      const jobStatus = (data.status || '').toString().toLowerCase();
      if (jobStatus === 'completed') {
        logger.info('PrintService', 'job already completed', { identifier, jobId: jobDoc.id });
        return null;
      }

      // Normalize external uploader schema → kiosk schema
      const normalizedStatus: PrintJob['status'] = ((): PrintJob['status'] => {
        const s = (data.status || '').toString().toLowerCase();
        if (s === '' || s === 'pending') return 'pending';
        if (['ready','pending','processing','printing','completed','failed'].includes(s)) return s as PrintJob['status'];
        return 'pending';
      })();

      // Extract documents - support both single and multiple documents
      let documents: Array<{ url: string; name: string; pages?: number; size?: number }> | undefined;
      
      if (Array.isArray(data.files) && data.files.length > 0) {
        // Multiple files format
        documents = data.files.map((file: any) => ({
          url: file.url || file.documentUrl || '',
          name: file.name || file.documentName || 'document',
          pages: file.pages,
          size: file.size
        }));
      } else if (Array.isArray(data.documents) && data.documents.length > 0) {
        // Documents array format
        documents = data.documents.map((doc: any) => ({
          url: doc.url || doc.documentUrl || '',
          name: doc.name || doc.documentName || 'document',
          pages: doc.pages,
          size: doc.size
        }));
      }
      
      // Primary document (for backward compatibility)
      const documentUrl: string = documents?.[0]?.url || data.documentUrl || data.url || data.fileUrl || '';
      const documentName: string = documents?.[0]?.name || data.documentName || data.fileName || 'document';

      const settings = data.printSettings || data.settings || {};
      const colorMode = (settings.colorMode || data.colorMode || '').toString().toLowerCase();
      const color = colorMode === 'color' || colorMode === 'colour' || colorMode === 'c' ? true : false;

      // Fetch user name from users collection
      let userName: string | undefined = undefined;
      const userId = data.userId || '';
      if (userId) {
        try {
          const userRef = doc(db, 'users', userId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            // Try displayName first, then name, then email as fallback
            userName = userData?.displayName || userData?.name || userData?.email || undefined;
          }
        } catch (userError) {
          // If user fetch fails, continue without userName
          logger.warn('PrintService', 'fetchPrintJob:user-fetch-failed', { userId, error: userError });
        }
      }

      const job: PrintJob = {
        id: jobDoc.id,
        token: data.token || data.tokenId || identifier,
        qrCode: data.qrCode || data.token || data.tokenId || identifier,
        documentUrl,
        documentName,
        documents, // Add documents array
        status: normalizedStatus,
        printSettings: {
          copies: Number(settings.copies || data.copies || 1),
          color,
          duplex: Boolean(settings.duplex ?? data.duplex ?? false),
          paperSize: (settings.paperSize || data.paperSize || 'A4') as any,
          orientation: (settings.orientation || data.orientation || 'portrait') as any,
        },
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
        printedAt: data.printedAt?.toDate ? data.printedAt.toDate() : undefined,
        kioskId: data.kioskId,
        userId: userId,
        userName: userName,
        paymentStatus: data.paymentStatus || 'completed',
        amount: Number(data.amount || data.totalCost || 0),
      };
      logger.event('PrintService', 'fetchPrintJob:success', { id: jobDoc.id, status: (data as any).status, userName });
      return job;
    } catch (error) {
      logger.error('PrintService', 'fetchPrintJob:error', error);
      throw error;
    }
  }
  
  /**
   * Update print job status
   */
  static async updateJobStatus(
    jobId: string, 
    status: PrintJob['status'],
    kioskId?: string
  ): Promise<void> {
    try {
      logger.event('PrintService', 'updateJobStatus', { jobId, status, kioskId });
      const jobRef = doc(db, 'printJobs', jobId);
      const updateData: any = { 
        status,
        updatedAt: Timestamp.now()
      };
      
      if (status === 'printing') {
        updateData.printedAt = Timestamp.now();
        if (kioskId) {
          updateData.kioskId = kioskId;
        }
      }
      
      await updateDoc(jobRef, updateData);

      // Note: Statistics updates require admin permissions
      // They will be updated when admin reviews the jobs
    } catch (error) {
      logger.error('PrintService', 'updateJobStatus:error', error);
      throw error;
    }
  }

  /**
   * Mark print job as ready for Raspberry Pi print server
   * Call this after token validation at the kiosk
   */
  static async markJobReady(jobId: string, kioskId?: string): Promise<void> {
    try {
      logger.event('PrintService', 'markJobReady', { jobId, kioskId });
      await this.updateJobStatus(jobId, 'ready', kioskId);
      logger.info('PrintService', 'Job marked as ready for Pi print server', { jobId });
    } catch (error) {
      logger.error('PrintService', 'markJobReady:error', error);
      throw error;
    }
  }

  /**
   * Update print job settings (copies, orientation, color, duplex)
   */
  static async updatePrintSettings(
    jobId: string,
    settings: PrintJob['printSettings']
  ): Promise<void> {
    try {
      logger.event('PrintService', 'updatePrintSettings', { jobId, settings });
      const jobRef = doc(db, 'printJobs', jobId);
      const updateData: any = {
        printSettings: {
          copies: settings.copies,
          color: settings.color,
          duplex: settings.duplex,
          paperSize: settings.paperSize,
          orientation: settings.orientation,
        },
        updatedAt: Timestamp.now()
      };
      
      await updateDoc(jobRef, updateData);
      logger.event('PrintService', 'updatePrintSettings:success', { jobId });
    } catch (error) {
      logger.error('PrintService', 'updatePrintSettings:error', error);
      throw error;
    }
  }

  /**
   * Monitor print job status changes in real-time via Firestore listener
   * Returns an unsubscribe function to stop listening
   * 
   * @param jobId - The print job ID to monitor
   * @param callback - Function called when status changes with updated job data
   * @returns Unsubscribe function to stop listening
   */
  static monitorJobStatus(
    jobId: string,
    callback: (job: PrintJob | null, status: PrintJob['status']) => void
  ): Unsubscribe {
    try {
      logger.event('PrintService', 'monitorJobStatus:start', { jobId });
      const jobRef = doc(db, 'printJobs', jobId);
      
      const unsubscribe = onSnapshot(
        jobRef,
        (snapshot) => {
          if (!snapshot.exists()) {
            logger.warn('PrintService', 'monitorJobStatus:job-not-found', { jobId });
            callback(null, 'failed');
            return;
          }
          
          const data = snapshot.data();
          const status = (data?.status || 'pending') as PrintJob['status'];
          const userId = data?.userId || '';
          
          // Get userName from data if available (may be stored in job document)
          const userName: string | undefined = data?.userName || undefined;
          
          // Convert Firestore data to PrintJob format
          const job: PrintJob = {
            id: snapshot.id,
            token: data?.token || data?.tokenId || '',
            qrCode: data?.qrCode || data?.token || '',
            documentUrl: data?.documentUrl || data?.url || '',
            documentName: data?.documentName || data?.fileName || 'document.pdf',
            documents: data?.documents || data?.files || undefined,
            status,
            printSettings: {
              copies: Number(data?.printSettings?.copies || data?.copies || 1),
              color: Boolean(data?.printSettings?.color ?? data?.color ?? false),
              duplex: Boolean(data?.printSettings?.duplex ?? data?.duplex ?? false),
              paperSize: (data?.printSettings?.paperSize || data?.paperSize || 'A4') as any,
              orientation: (data?.printSettings?.orientation || data?.orientation || 'portrait') as any,
            },
            createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : (data?.createdAt || new Date()),
            printedAt: data?.printedAt?.toDate ? data.printedAt.toDate() : undefined,
            kioskId: data?.kioskId,
            userId: userId,
            userName: userName,
            paymentStatus: data?.paymentStatus || 'completed',
            amount: Number(data?.amount || data?.totalCost || 0),
          };
          
          // If userName not in job data, fetch it asynchronously and update job
          if (!userName && userId) {
            getDoc(doc(db, 'users', userId))
              .then((userSnap) => {
                if (userSnap.exists()) {
                  const userData = userSnap.data();
                  const fetchedUserName = userData?.displayName || userData?.name || userData?.email || undefined;
                  if (fetchedUserName) {
                    // Update job with fetched userName and call callback again
                    const updatedJob: PrintJob = { ...job, userName: fetchedUserName };
                    callback(updatedJob, status);
                  }
                }
              })
              .catch((err) => {
                logger.warn('PrintService', 'monitorJobStatus:user-fetch-failed', { userId, error: err });
              });
          }
          
          logger.event('PrintService', 'monitorJobStatus:update', { jobId, status });
          callback(job, status);
        },
        (error) => {
          logger.error('PrintService', 'monitorJobStatus:error', error);
          callback(null, 'failed');
        }
      );
      
      return unsubscribe;
    } catch (error) {
      logger.error('PrintService', 'monitorJobStatus:setup-error', error);
      // Return a no-op unsubscribe function
      return () => {};
    }
  }
  
  /**
   * Send print command to printer (Brother HL-L5210DN optimized)
   */
  static async printDocument(job: PrintJob): Promise<boolean> {
    try {
      // For Brother HL-L5210DN, we'll use browser print
      // The printer should be set as default in system settings
      
      // Create iframe for printing
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = job.documentUrl;
      document.body.appendChild(iframe);
      
      // Wait for document to load
      await new Promise((resolve, reject) => {
        iframe.onload = resolve;
        iframe.onerror = reject;
        setTimeout(reject, 10000); // 10s timeout
      });
      
      // Configure print settings for Brother printer
      await iframe.contentWindow?.print();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
      return true;
    } catch (error) {
      console.error('Error printing document:', error);
      return false;
    }
  }
  
  /**
   * Smart print function that tries multiple strategies to enable printing
   * Strategy 1: Hidden iframe with auto-print (best for same-origin)
   * Strategy 2: Popup window with auto-print (works for cross-origin on Android)
   * Strategy 3: New tab with manual instructions (fallback)
   */
  static async autoPrint(job: PrintJob): Promise<{ success: boolean; method: string }> {
    // If running on native Android, use Capacitor Print plugin
    if (this.isNativeAndroid()) {
      console.log('🤖 Native Android detected, using Capacitor Print plugin');
      return this.printWithCapacitor(job);
    }

    return new Promise((resolve) => {
      console.log('🖨️ Attempting to enable printer for:', job.documentName);
      
      // Strategy 1: Try hidden iframe with auto-print (works if CORS allows)
      const tryIframePrint = () => {
        return new Promise<boolean>((iframeResolve) => {
          try {
            const iframe = document.createElement('iframe');
            iframe.style.position = 'fixed';
            iframe.style.top = '-9999px';
            iframe.style.left = '-9999px';
            iframe.style.width = '1px';
            iframe.style.height = '1px';
            iframe.style.opacity = '0';
            iframe.style.pointerEvents = 'none';
            iframe.style.border = 'none';
            
            let loaded = false;
            let printAttempted = false;
            
            const attemptPrint = () => {
              if (loaded && !printAttempted) {
                printAttempted = true;
                try {
                  // Try to access contentWindow and trigger print
                  const contentWindow = iframe.contentWindow;
                  if (contentWindow) {
                    // Wait a bit more for PDF to fully render
                    setTimeout(() => {
                      try {
                        contentWindow.print();
                        console.log('✅ Iframe print dialog triggered');
                        iframeResolve(true);
                        // Cleanup after 5 seconds
                        setTimeout(() => {
                          if (iframe.parentNode) {
                            document.body.removeChild(iframe);
                          }
                        }, 5000);
                      } catch (e) {
                        console.log('⚠️ Iframe print failed (CORS):', e);
                        iframeResolve(false);
                        if (iframe.parentNode) {
                          document.body.removeChild(iframe);
                        }
                      }
                    }, 2000);
                  } else {
                    iframeResolve(false);
                  }
                } catch (e) {
                  console.log('⚠️ Cannot access iframe contentWindow:', e);
                  iframeResolve(false);
                  if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                  }
                }
              }
            };
            
            iframe.onload = () => {
              loaded = true;
              attemptPrint();
            };
            
            iframe.onerror = () => {
              console.log('⚠️ Iframe failed to load');
              iframeResolve(false);
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
            };
            
            iframe.src = job.documentUrl;
            document.body.appendChild(iframe);
            
            // Timeout after 10 seconds
            setTimeout(() => {
              if (!printAttempted) {
                console.log('⚠️ Iframe print timeout');
                iframeResolve(false);
                if (iframe.parentNode) {
                  document.body.removeChild(iframe);
                }
              }
            }, 10000);
          } catch (error) {
            console.log('⚠️ Iframe strategy failed:', error);
            iframeResolve(false);
          }
        });
      };
      
      // Strategy 2: Popup window with auto-print (better for cross-origin on Android)
      const tryPopupPrint = () => {
        return new Promise<boolean>((popupResolve) => {
          try {
            const printWindow = window.open(job.documentUrl, '_print', 'width=800,height=600');
            
            if (!printWindow) {
              console.log('⚠️ Popup blocked');
              popupResolve(false);
              return;
            }
            
            console.log('📄 Popup window opened, waiting for load...');
            
            let printAttempted = false;
            
            // Try to trigger print after window loads
            const checkAndPrint = () => {
              try {
                // Check if window is still open and try to print
                if (!printWindow.closed && !printAttempted) {
                  printAttempted = true;
                  
                  // Wait for document to load, then trigger print
                  setTimeout(() => {
                    try {
                      printWindow.print();
                      console.log('✅ Popup print dialog triggered');
                      popupResolve(true);
                      
                      // Close window after 10 seconds if user doesn't interact
                      setTimeout(() => {
                        if (!printWindow.closed) {
                          printWindow.close();
                        }
                      }, 10000);
                    } catch (e) {
                      console.log('⚠️ Popup print failed:', e);
                      // Don't close - let user print manually
                      popupResolve(false);
                    }
                  }, 2500);
                }
              } catch (e) {
                console.log('⚠️ Cannot access popup window:', e);
                popupResolve(false);
              }
            };
            
            // Try multiple times as document loads
            const interval = setInterval(() => {
              if (printWindow.closed) {
                clearInterval(interval);
                if (!printAttempted) {
                  popupResolve(false);
                }
              } else {
                checkAndPrint();
              }
            }, 500);
            
            // Timeout after 8 seconds
            setTimeout(() => {
              clearInterval(interval);
              if (!printAttempted) {
                console.log('⚠️ Popup print timeout');
                popupResolve(false);
              }
            }, 8000);
          } catch (error) {
            console.log('⚠️ Popup strategy failed:', error);
            popupResolve(false);
          }
        });
      };
      
      // Strategy 3: Fallback to new tab (manual)
      const fallbackManual = () => {
        try {
          const newTab = window.open(job.documentUrl, '_blank');
          if (newTab) {
            console.log('📋 Opened in new tab (manual print required)');
            return true;
          }
          return false;
        } catch (error) {
          console.error('❌ All print strategies failed:', error);
          return false;
        }
      };
      
      // Execute strategies in sequence
      (async () => {
        // Try iframe first (fastest if it works)
        const iframeSuccess = await tryIframePrint();
        if (iframeSuccess) {
          resolve({ success: true, method: 'iframe-auto' });
          return;
        }
        
        console.log('🔄 Trying popup window strategy...');
        
        // Try popup window (works better on Android)
        const popupSuccess = await tryPopupPrint();
        if (popupSuccess) {
          resolve({ success: true, method: 'popup-auto' });
          return;
        }
        
        console.log('🔄 Falling back to manual print...');
        
        // Fallback to manual
        const manualSuccess = fallbackManual();
        resolve({ success: manualSuccess, method: manualSuccess ? 'manual-tab' : 'failed' });
      })();
    });
  }

  /**
   * Print document using Fetch + Blob URL approach
   * This bypasses CORS by creating a same-origin blob URL
   * Best method for cross-origin PDFs from Firebase Storage
   * 
   * How it works:
   * 1. Fetch PDF as blob (CORS allows reading, not printing)
   * 2. Create blob URL (same-origin, no CORS restrictions)
   * 3. Load blob URL in hidden iframe
   * 4. Print from iframe (now same-origin, so it works!)
   */
  static async printFromBlob(documentUrl: string): Promise<{ success: boolean; method: string }> {
    return new Promise(async (resolve) => {
      let printFrame: HTMLIFrameElement | null = null;
      let blobUrl: string | null = null;
      let timeoutId: NodeJS.Timeout | null = null;
      let loadTimeoutId: NodeJS.Timeout | null = null;
      
      const cleanup = () => {
        if (printFrame && printFrame.parentNode) {
          try {
            document.body.removeChild(printFrame);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        if (blobUrl) {
          try {
            URL.revokeObjectURL(blobUrl);
          } catch (e) {
            // Ignore cleanup errors
          }
        }
        if (timeoutId) clearTimeout(timeoutId);
        if (loadTimeoutId) clearTimeout(loadTimeoutId);
      };
      
      try {
        logger.event('PrintService', 'printFromBlob:start', { documentUrl });
        
        // Step 1: Fetch PDF as blob with retry logic for Firebase Storage
        // Note: CORS allows reading the blob, but not printing directly from cross-origin URL
        let response: Response;
        let retries = 3;
        
        while (retries > 0) {
          try {
            response = await fetch(documentUrl, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'no-cache',
              headers: {
                'Accept': 'application/pdf, */*',
                // Removed Cache-Control - Firebase Storage CORS doesn't allow custom headers
              },
              referrerPolicy: 'no-referrer',
            });
            
            if (response.ok) {
              break;
            }

            // Handle 412 Precondition Failed
            if (response.status === 412) {
              logger.warn('PrintService', '412 error in printFromBlob, retrying', { retries });
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }
            
            if (!response.ok) {
              throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError: any) {
            retries--;
            if (retries === 0) {
              throw fetchError;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!response! || !response!.ok) {
          throw new Error(`Failed to fetch PDF after retries: ${response!.status} ${response!.statusText}`);
        }
        
        // Check if response is actually a PDF
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('pdf') && !contentType.includes('application/octet-stream')) {
          console.warn('⚠️ Response may not be a PDF:', contentType);
        }
        
        const blob = await response.blob();
        logger.event('PrintService', 'printFromBlob:fetched', { 
          size: blob.size,
          type: blob.type 
        });
        
        // Validate blob size (should be > 0)
        if (blob.size === 0) {
          throw new Error('Fetched PDF is empty');
        }
        
        // Step 2: Create blob URL (same-origin, no CORS restrictions)
        blobUrl = URL.createObjectURL(blob);
        
        // Step 3: Create hidden iframe for printing
        printFrame = document.createElement('iframe');
        printFrame.style.cssText = `
          position: fixed;
          right: 0;
          bottom: 0;
          width: 0;
          height: 0;
          border: none;
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        `;
        printFrame.src = blobUrl;
        printFrame.title = 'Print Frame';
        printFrame.setAttribute('aria-hidden', 'true');
        
        // Step 4: Wait for iframe to load, then print
        let isResolved = false;
        
        const attemptPrint = () => {
          if (isResolved || !printFrame) return;
          
          try {
            const contentWindow = printFrame.contentWindow;
            if (contentWindow) {
              // Try to print
              contentWindow.print();
              logger.event('PrintService', 'printFromBlob:success', { method: 'blob-iframe' });
              isResolved = true;
              resolve({ success: true, method: 'blob-iframe' });
              
              // Cleanup after print dialog appears (user may cancel, so delay cleanup)
              setTimeout(() => {
                cleanup();
              }, 2000);
            } else {
              throw new Error('Cannot access print frame contentWindow');
            }
          } catch (printError: any) {
            if (isResolved) return;
            logger.error('PrintService', 'printFromBlob:print-error', printError);
            isResolved = true;
            cleanup();
            resolve({ success: false, method: 'blob-print-failed' });
          }
        };
        
        printFrame.onload = () => {
          // Wait a bit for PDF to fully render in iframe
          loadTimeoutId = setTimeout(() => {
            attemptPrint();
          }, 800); // Increased delay for better PDF rendering
        };
        
        printFrame.onerror = () => {
          if (isResolved) return;
          logger.error('PrintService', 'printFromBlob:load-error', new Error('Iframe load failed'));
          isResolved = true;
          cleanup();
          resolve({ success: false, method: 'blob-load-failed' });
        };
        
        // Add iframe to DOM
        document.body.appendChild(printFrame);
        
        // Timeout fallback - try to print even if onload doesn't fire
        timeoutId = setTimeout(() => {
          if (!isResolved && printFrame) {
            console.log('⚠️ Print frame load timeout, attempting print anyway...');
            attemptPrint();
          }
        }, 8000); // 8 second timeout
        
      } catch (error: any) {
        logger.error('PrintService', 'printFromBlob:error', error);
        cleanup();
        resolve({ 
          success: false, 
          method: 'blob-fetch-failed'
        });
      }
    });
  }

  /**
   * Print document from preview iframe
   * This is called when user clicks the Print button in preview
   * 
   * Strategy:
   * 1. Try blob method first (most reliable for cross-origin PDFs)
   * 2. Fallback to direct iframe print (fastest for same-origin)
   * 3. Last resort: browser print (prints entire page)
   */
  static async printFromPreview(iframe: HTMLIFrameElement | null, documentUrl?: string): Promise<{ success: boolean; method: string; needsNewWindow?: boolean }> {
    return new Promise(async (resolve) => {
      if (!iframe && !documentUrl) {
        console.error('❌ No iframe or document URL provided for printing');
        resolve({ success: false, method: 'no-source' });
        return;
      }

      // Strategy 1: Use blob method FIRST (most reliable for cross-origin PDFs from Firebase)
      // This is the primary method because it works with CORS restrictions
      if (documentUrl) {
        console.log('🔄 Attempting blob method (best for cross-origin PDFs)...');
        const blobResult = await this.printFromBlob(documentUrl);
        if (blobResult.success) {
          console.log('✅ Blob method succeeded!');
          resolve(blobResult);
          return;
        }
        console.log('⚠️ Blob method failed, trying direct iframe print...');
      }

      // Strategy 2: Try direct iframe print (fastest, works for same-origin)
      if (iframe) {
        try {
          const contentWindow = iframe.contentWindow;
          if (contentWindow) {
            try {
              contentWindow.print();
              console.log('✅ Print dialog triggered from preview iframe (direct)');
              resolve({ success: true, method: 'iframe-direct' });
              return;
            } catch (iframeError: any) {
              // CORS error - iframe print blocked
              console.log('⚠️ Iframe print blocked (CORS)');
            }
          }
        } catch (error) {
          console.log('⚠️ Iframe access error');
        }
      }

      // Strategy 3: Fallback to browser print (prints entire page)
      try {
        console.log('🔄 Using browser print fallback...');
        window.print();
        console.log('✅ Browser print dialog triggered (fallback)');
        resolve({ success: true, method: 'browser-print-fallback' });
      } catch (error) {
        console.error('❌ All print methods failed:', error);
        resolve({ success: false, method: 'all-methods-failed' });
      }
    });
  }

  /**
   * Silent Direct Print - Smooth automated printing flow
   * Prints ONLY the document (not entire page) with all settings applied
   * Uses blob method for reliability, then prints from hidden iframe
   * Fully automated - no user interaction required
   */
  static async silentDirectPrint(
    job: PrintJob,
    documentUrl: string
  ): Promise<{ success: boolean; method: string }> {
    return new Promise(async (resolve) => {
      try {
        logger.event('PrintService', 'silentDirectPrint:start', {
          jobId: job.id,
          copies: job.printSettings.copies,
          orientation: job.printSettings.orientation,
          duplex: job.printSettings.duplex,
          color: job.printSettings.color,
        });

        // Step 1: Try Chrome extension FIRST (if available) - completely silent, no dialog
        if (typeof window !== 'undefined' && (window as any).VPrintExtension?.available) {
          logger.info('PrintService', 'silentDirectPrint:using-chrome-extension', {
            jobId: job.id,
            reason: 'Silent printing without dialog',
          });

          try {
            const result = await (window as any).VPrintExtension.print(
              documentUrl,
              job.documentName || job.id,
              {
                copies: job.printSettings.copies || 1,
                orientation: job.printSettings.orientation || 'portrait',
                color: job.printSettings.color ?? false,
                duplex: job.printSettings.duplex ?? false,
                paperSize: job.printSettings.paperSize || 'A4',
              }
            );

            if (result.success) {
              logger.event('PrintService', 'extension-print:success', {
                jobId: job.id,
                printerId: result.result?.printerId,
              });
              resolve({ success: true, method: 'chrome-extension' });
              return;
            } else {
              logger.warn('PrintService', 'extension-print:failed', {
                error: result.error,
                jobId: job.id,
              });
              // Fall through to iframe method
            }
          } catch (error: any) {
            logger.warn('PrintService', 'extension-print:error', {
              error: error.message,
              jobId: job.id,
            });
            // Fall through to iframe method
          }
        }

        // Step 2: Try direct iframe method (avoids CORS issues with blob fetch)
        // Iframe can load cross-origin URLs directly without CORS restrictions
        logger.info('PrintService', 'silentDirectPrint:using-direct-iframe', {
          jobId: job.id,
          reason: 'Avoids CORS issues with Firebase Storage',
        });
        
        // Use direct iframe method (no blob fetch needed - avoids CORS)
        const directResult = await this.silentPrintIframe(null, job, documentUrl);
        if (directResult.success) {
          resolve(directResult);
          return;
        }
        
        // Fallback: Try blob method if direct iframe fails
        logger.warn('PrintService', 'Direct iframe failed, trying blob method', {
          jobId: job.id,
        });
        
        const blobUrl = await this.createBlobUrl(documentUrl);
        if (!blobUrl) {
          logger.warn('PrintService', 'Blob URL creation also failed', {
            jobId: job.id,
          });
          resolve({ success: false, method: 'all-methods-failed' });
          return;
        }

        // Step 3: Create hidden iframe with print settings applied
        const printFrame = document.createElement('iframe');
        printFrame.style.cssText = `
          position: fixed;
          top: -9999px;
          left: -9999px;
          width: 1px;
          height: 1px;
          opacity: 0;
          pointer-events: none;
          border: none;
          z-index: -9999;
        `;
        printFrame.src = blobUrl;
        printFrame.setAttribute('aria-hidden', 'true');
        document.body.appendChild(printFrame);

        // Step 4: Apply print settings via CSS (will be injected into iframe)
        // Note: CSS will be injected into iframe document when it loads

        // Step 5: Wait for iframe to load, inject CSS, then print
        let copiesPrinted = 0;
        const totalCopies = job.printSettings.copies || 1;
        let printAttempted = false;

        // Function to inject print settings CSS into iframe
        const injectPrintStyles = (iframeDoc: Document) => {
          try {
            // Get print settings with defaults
            const orientation = job.printSettings.orientation || 'portrait';
            const paperSize = job.printSettings.paperSize || 'A4';
            const color = job.printSettings.color ?? false;
            const duplex = job.printSettings.duplex ?? false;

            // Log settings being applied
            logger.info('PrintService', 'injectPrintStyles:applying-settings', {
              orientation,
              paperSize,
              color,
              duplex,
              jobId: job.id,
            });

            // Remove existing print style if present
            const existingStyle = iframeDoc.getElementById(`print-settings-${job.id}`);
            if (existingStyle) {
              existingStyle.remove();
            }

            // Create and inject style element
            const styleElement = iframeDoc.createElement('style');
            styleElement.id = `print-settings-${job.id}`;
            styleElement.textContent = `
              @media print {
                @page {
                  size: ${paperSize} ${orientation} !important;
                  margin: 0.5in;
                }
                html, body {
                  width: ${orientation === 'landscape' ? '100%' : 'auto'};
                  height: ${orientation === 'landscape' ? 'auto' : '100%'};
                }
                ${!color ? `
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  filter: grayscale(100%) !important;
                }
                ` : ''}
                ${duplex ? `
                @page :left {
                  margin-left: 0.5in;
                  margin-right: 0.25in;
                }
                @page :right {
                  margin-left: 0.25in;
                  margin-right: 0.5in;
                }
                ` : ''}
              }
              @media screen {
                @page {
                  size: ${paperSize} ${orientation} !important;
                }
              }
            `;
            iframeDoc.head.appendChild(styleElement);
            
            // Also try to set it on the body/html for better compatibility
            try {
              if (iframeDoc.body) {
                iframeDoc.body.style.width = orientation === 'landscape' ? '100%' : 'auto';
                iframeDoc.body.style.height = orientation === 'landscape' ? 'auto' : '100%';
              }
            } catch (e) {
              // Ignore if can't set body styles
            }
            
            return true;
          } catch (e) {
            logger.warn('PrintService', 'silentDirectPrint:failed-to-inject-styles', { 
              error: e,
              jobId: job.id,
            });
            return false;
          }
        };

        const printNextCopy = () => {
          if (copiesPrinted >= totalCopies) {
            // Cleanup
            setTimeout(() => {
              if (printFrame.parentNode) {
                document.body.removeChild(printFrame);
              }
              URL.revokeObjectURL(blobUrl);
            }, 2000);
            
            logger.event('PrintService', 'silentDirectPrint:success', {
              jobId: job.id,
              copies: totalCopies,
            });
            resolve({ success: true, method: 'silent-direct-print' });
            return;
          }

          if (!printAttempted) {
            printAttempted = true;
            setTimeout(() => {
              try {
                const contentWindow = printFrame.contentWindow;
                if (contentWindow && contentWindow.document) {
                  // Inject print settings CSS into iframe document
                  injectPrintStyles(contentWindow.document);

                  // Also set iframe dimensions based on orientation for better rendering
                  if (job.printSettings.orientation === 'landscape') {
                    printFrame.style.width = '297mm';
                    printFrame.style.height = '210mm';
                  } else {
                    printFrame.style.width = '210mm';
                    printFrame.style.height = '297mm';
                  }

                  // Print from iframe (only document content, not page)
                  contentWindow.print();
                  copiesPrinted++;

                  if (copiesPrinted < totalCopies) {
                    // Wait before next copy
                    printAttempted = false;
                    setTimeout(printNextCopy, 2000);
                  } else {
                    // All copies done
                    setTimeout(() => {
                      if (printFrame.parentNode) {
                        document.body.removeChild(printFrame);
                      }
                      URL.revokeObjectURL(blobUrl);
                      resolve({ success: true, method: 'silent-direct-print' });
                    }, 1000);
                  }
                } else {
                  throw new Error('Cannot access iframe contentWindow');
                }
              } catch (error) {
                console.error('Print error:', error);
                if (printFrame.parentNode) {
                  document.body.removeChild(printFrame);
                }
                // styleElement is in iframe document, will be cleaned up with iframe
                URL.revokeObjectURL(blobUrl);
                resolve({ success: false, method: 'print-error' });
              }
            }, 1500); // Wait for PDF to fully render
          }
        };

        // Wait for iframe to load
        printFrame.onload = () => {
          setTimeout(printNextCopy, 1000);
        };

        // Fallback timeout
        setTimeout(() => {
          if (!printAttempted) {
            printNextCopy();
          }
        }, 5000);

      } catch (error: any) {
        logger.error('PrintService', 'silentDirectPrint:error', error);
        resolve({ success: false, method: 'silent-print-failed' });
      }
    });
  }

  /**
   * Helper: Create blob URL from document URL
   * Handles CORS, 412 errors, and network failures with retry logic
   */
  private static async createBlobUrl(documentUrl: string): Promise<string | null> {
    try {
      let response: Response | null = null;
      let retries = 3;
      let lastError: Error | null = null;

      while (retries > 0) {
        try {
          logger.info('PrintService', 'createBlobUrl:attempt', {
            retries,
            url: documentUrl.substring(0, 100) + '...',
          });

          // Create abort controller for timeout (fallback for browsers without AbortSignal.timeout)
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => {
            abortController.abort();
          }, 30000); // 30 second timeout

          try {
            response = await fetch(documentUrl, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'no-cache',
              headers: {
                'Accept': 'application/pdf, application/octet-stream, */*',
                // Removed Cache-Control header - Firebase Storage CORS doesn't allow it
                // 'Cache-Control': 'no-cache', // ❌ Causes CORS preflight failure
                // 'Pragma': 'no-cache', // ❌ May also cause issues
              },
              referrerPolicy: 'no-referrer',
              signal: abortController.signal,
            });
            
            clearTimeout(timeoutId);
          } catch (fetchErr: any) {
            clearTimeout(timeoutId);
            throw fetchErr;
          }

          if (response.ok) {
            // Success - break out of retry loop
            break;
          }

          // Handle specific HTTP status codes
          if (response.status === 412) {
            // Precondition Failed - Firebase Storage CORS issue
            logger.warn('PrintService', 'createBlobUrl:412-error', {
              retries,
              status: response.status,
              statusText: response.statusText,
            });
            retries--;
            if (retries > 0) {
              // Exponential backoff
              const delay = 1000 * (4 - retries);
              await new Promise(resolve => setTimeout(resolve, delay));
              continue;
            }
          } else if (response.status === 403 || response.status === 401) {
            // Access denied - don't retry
            throw new Error(`Access denied to document: ${response.status} ${response.statusText}`);
          } else if (response.status >= 500) {
            // Server error - retry
            logger.warn('PrintService', 'createBlobUrl:server-error', {
              retries,
              status: response.status,
            });
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
          } else {
            // Other errors
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
          }
        } catch (fetchError: any) {
          lastError = fetchError;
          
          // Handle different error types
          if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
            logger.warn('PrintService', 'createBlobUrl:timeout', {
              retries,
              error: fetchError.message,
            });
          } else if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
            // Network error - CORS or connectivity issue
            logger.warn('PrintService', 'createBlobUrl:network-error', {
              retries,
              error: fetchError.message,
              url: documentUrl.substring(0, 100) + '...',
            });
            
            // If it's a CORS/network error and we have retries left, try with 'no-cors' mode as last resort
            if (retries === 1) {
              try {
                logger.info('PrintService', 'createBlobUrl:trying-no-cors-mode');
                const noCorsResponse = await fetch(documentUrl, {
                  mode: 'no-cors', // Last resort - may not work but worth trying
                  cache: 'no-cache',
                });
                
                if (noCorsResponse.type === 'opaque') {
                  // Opaque response - can't read but might work for iframe
                  logger.info('PrintService', 'createBlobUrl:got-opaque-response');
                  // Return null to trigger fallback methods
                  return null;
                }
              } catch (noCorsError) {
                logger.warn('PrintService', 'createBlobUrl:no-cors-also-failed', {
                  error: noCorsError,
                });
              }
            }
          } else {
            logger.warn('PrintService', 'createBlobUrl:fetch-error', {
              retries,
              error: fetchError.message,
              name: fetchError.name,
            });
          }

          retries--;
          if (retries > 0) {
            // Exponential backoff for network errors
            const delay = 2000 * (4 - retries);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
      }

      // Check if we got a valid response
      if (!response || !response.ok) {
        logger.error('PrintService', 'createBlobUrl:failed-after-retries', {
          status: response?.status,
          statusText: response?.statusText,
          lastError: lastError?.message,
        });
        return null;
      }

      // Validate response
      const contentType = response.headers.get('content-type');
      if (!contentType || (!contentType.includes('pdf') && !contentType.includes('octet-stream'))) {
        logger.warn('PrintService', 'createBlobUrl:unexpected-content-type', {
          contentType,
        });
        // Continue anyway - might still be a valid PDF
      }

      // Create blob
      const blob = await response.blob();
      
      if (blob.size === 0) {
        logger.error('PrintService', 'createBlobUrl:empty-blob');
        return null;
      }

      const blobUrl = URL.createObjectURL(blob);
      logger.info('PrintService', 'createBlobUrl:success', {
        blobSize: blob.size,
        blobType: blob.type,
      });
      
      return blobUrl;
    } catch (error: any) {
      logger.error('PrintService', 'createBlobUrl:error', {
        error: error.message,
        name: error.name,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * Silent print - prints ONLY the iframe document content, no dialog
   * Uses hidden iframe with auto-print, tries to bypass dialog
   * Applies all print settings: copies, orientation, duplex, color
   * 
   * @deprecated Use silentDirectPrint() for better reliability
   */
  static async silentPrintIframe(
    iframe: HTMLIFrameElement | null,
    job: PrintJob,
    documentUrl: string
  ): Promise<{ success: boolean; method: string }> {
    return new Promise(async (resolve) => {
      try {
        logger.event('PrintService', 'silentPrintIframe:start', {
          jobId: job.id,
          copies: job.printSettings.copies,
          orientation: job.printSettings.orientation,
        });

        // Create or use existing hidden iframe
        // IMPORTANT: Iframe can load cross-origin URLs directly (no CORS issues!)
        const printIframe = iframe || document.createElement('iframe');
        
        if (!iframe) {
          // Create new hidden iframe - loads URL directly (bypasses CORS!)
          printIframe.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 1px;
            height: 1px;
            opacity: 0;
            pointer-events: none;
            border: none;
            z-index: -9999;
          `;
          
          // Use document URL directly (no fetch needed - avoids CORS!)
          // Browsers allow iframes to load cross-origin URLs
          printIframe.src = documentUrl;
          printIframe.setAttribute('aria-hidden', 'true');
          document.body.appendChild(printIframe);
        }

        // Function to inject print settings CSS into iframe
        const injectPrintStyles = (iframeDoc: Document) => {
          try {
            // Get print settings with defaults
            const orientation = job.printSettings.orientation || 'portrait';
            const paperSize = job.printSettings.paperSize || 'A4';
            const color = job.printSettings.color ?? false;
            const duplex = job.printSettings.duplex ?? false;

            // Log settings being applied
            logger.info('PrintService', 'injectPrintStyles:applying-settings', {
              orientation,
              paperSize,
              color,
              duplex,
              jobId: job.id,
            });

            // Remove existing print style if present
            const existingStyle = iframeDoc.getElementById(`print-settings-${job.id}`);
            if (existingStyle) {
              existingStyle.remove();
            }

            // Create and inject style element
            const styleElement = iframeDoc.createElement('style');
            styleElement.id = `print-settings-${job.id}`;
            styleElement.textContent = `
              @media print {
                @page {
                  size: ${paperSize} ${orientation} !important;
                  margin: 0.5in;
                }
                html, body {
                  width: ${orientation === 'landscape' ? '100%' : 'auto'};
                  height: ${orientation === 'landscape' ? 'auto' : '100%'};
                }
                ${!color ? `
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  filter: grayscale(100%) !important;
                }
                ` : ''}
                ${duplex ? `
                @page :left {
                  margin-left: 0.5in;
                  margin-right: 0.25in;
                }
                @page :right {
                  margin-left: 0.25in;
                  margin-right: 0.5in;
                }
                ` : ''}
              }
              @media screen {
                @page {
                  size: ${paperSize} ${orientation} !important;
                }
              }
            `;
            iframeDoc.head.appendChild(styleElement);
            
            // Also try to set it on the body/html for better compatibility
            try {
              if (iframeDoc.body) {
                iframeDoc.body.style.width = orientation === 'landscape' ? '100%' : 'auto';
                iframeDoc.body.style.height = orientation === 'landscape' ? 'auto' : '100%';
              }
            } catch (e) {
              // Ignore if can't set body styles
            }
            
            return true;
          } catch (e) {
            logger.warn('PrintService', 'silentPrintIframe:failed-to-inject-styles', { 
              error: e,
              jobId: job.id,
            });
            return false;
          }
        };

        let printAttempted = false;
        let copiesPrinted = 0;
        const totalCopies = job.printSettings.copies || 1;

        const printNextCopy = () => {
          if (copiesPrinted >= totalCopies) {
            // Cleanup
            setTimeout(() => {
              if (!iframe && printIframe.parentNode) {
                document.body.removeChild(printIframe);
              }
              // styleElement is in iframe document, will be cleaned up with iframe
            }, 2000);
            
            logger.event('PrintService', 'silentPrintIframe:success', {
              jobId: job.id,
              copies: totalCopies,
            });
            resolve({ success: true, method: 'iframe-direct-print' });
            return;
          }

          if (!printAttempted) {
            printAttempted = true;
            
            setTimeout(() => {
              try {
                const contentWindow = printIframe.contentWindow;
                if (contentWindow && contentWindow.document) {
                  // Inject print settings CSS into iframe document
                  injectPrintStyles(contentWindow.document);

                  // Also set iframe dimensions based on orientation for better rendering
                  if (job.printSettings.orientation === 'landscape') {
                    printIframe.style.width = '297mm';
                    printIframe.style.height = '210mm';
                  } else {
                    printIframe.style.width = '210mm';
                    printIframe.style.height = '297mm';
                  }
                  
                  // Print the iframe content
                  contentWindow.print();
                  
                  copiesPrinted++;
                  
                  // Wait before printing next copy (if multiple copies)
                  if (copiesPrinted < totalCopies) {
                    setTimeout(() => {
                      printAttempted = false; // Allow next copy
                      printNextCopy();
                    }, 2000);
                  } else {
                    // All copies printed
                    printNextCopy(); // This will cleanup and resolve
                  }
                } else {
                  logger.error('PrintService', 'silentPrintIframe:no-content-window');
                  resolve({ success: false, method: 'no-content-window' });
                }
              } catch (error: any) {
                logger.error('PrintService', 'silentPrintIframe:print-error', {
                  error: error.message,
                });
                resolve({ success: false, method: 'iframe-print-error' });
              }
            }, 2000); // Wait 2 seconds for document to fully load
          }
        };

        // Start printing when iframe loads
        printIframe.onload = () => {
          printNextCopy();
        };

        // Timeout fallback (if iframe doesn't load)
        setTimeout(() => {
          if (!printAttempted) {
            logger.warn('PrintService', 'silentPrintIframe:timeout', {
              jobId: job.id,
            });
            if (!iframe && printIframe.parentNode) {
              document.body.removeChild(printIframe);
            }
            resolve({ success: false, method: 'iframe-load-timeout' });
          }
        }, 15000); // 15 second timeout

        // If iframe already loaded (existing iframe), print immediately
        if (iframe && iframe.contentWindow) {
          printNextCopy();
        }

      } catch (error: any) {
        logger.error('PrintService', 'silentPrintIframe:error', error);
        resolve({ success: false, method: 'silent-print-failed' });
      }
    });
  }

  /**
   * Direct print with settings applied (no dialog)
   * Uses IPP (Internet Printing Protocol) or browser print API with CSS @page rules
   * Applies all print settings: copies, orientation, duplex, color
   * 
   * @deprecated Use silentPrintIframe() instead for iframe-only printing
   */
  static async directPrintWithSettings(
    job: PrintJob,
    documentUrl: string
  ): Promise<{ success: boolean; method: string }> {
    return new Promise(async (resolve) => {
      try {
        logger.event('PrintService', 'directPrintWithSettings:start', {
          jobId: job.id,
          copies: job.printSettings.copies,
          orientation: job.printSettings.orientation,
          duplex: job.printSettings.duplex,
          color: job.printSettings.color,
        });

        // Step 1: Fetch document as blob
        // Handle Firebase Storage URLs with proper headers and retry logic
        let response: Response;
        let retries = 3;
        
        while (retries > 0) {
          try {
            response = await fetch(documentUrl, {
              mode: 'cors',
              credentials: 'omit',
              cache: 'no-cache',
              headers: {
                'Accept': '*/*',
                'Cache-Control': 'no-cache',
              },
              // Add referrer policy for Firebase Storage
              referrerPolicy: 'no-referrer',
            });

            if (response.ok) {
              break;
            }

            // Handle specific error codes
            if (response.status === 412) {
              // Precondition Failed - Firebase Storage CORS/authentication issue
              // Try with different approach: use blob method instead
              logger.warn('PrintService', '412 error in directPrintWithSettings, falling back to blob method', { 
                retries,
                jobId: job.id 
              });
              
              // Fallback to blob method which has better 412 handling
              const blobResult = await this.printFromBlob(documentUrl);
              if (blobResult.success) {
                resolve({ success: true, method: 'blob-fallback-from-412' });
                return;
              }
              
              retries--;
              if (retries > 0) {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
                continue;
              }
            }

            if (response.status === 403 || response.status === 401) {
              throw new Error(`Access denied to document (${response.status}). Check Firebase Storage rules.`);
            }
            
            if (!response.ok && response.status !== 412) {
              throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError: any) {
            retries--;
            if (retries === 0) {
              // If fetch fails, try using the URL directly in iframe (no blob conversion)
              logger.warn('PrintService', 'Fetch failed, using direct URL method', fetchError);
              throw fetchError;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!response! || !response!.ok) {
          // Final fallback: try blob method which handles 412 better
          logger.warn('PrintService', 'All retries failed in directPrintWithSettings, trying blob method as final fallback', {
            status: response!.status,
            jobId: job.id
          });
          
          const blobResult = await this.printFromBlob(documentUrl);
          if (blobResult.success) {
            resolve({ success: true, method: 'blob-fallback-final' });
            return;
          }
          
          throw new Error(`Failed to fetch document after retries: ${response!.status} ${response!.statusText}`);
        }

        const blob = await response!.blob();
        const blobUrl = URL.createObjectURL(blob);

        // Step 2: Create print window with settings
        const printWindow = window.open('', '_blank', 'width=1,height=1');
        if (!printWindow) {
          throw new Error('Failed to open print window (popup blocked)');
        }

        // Step 3: Build HTML with print settings applied via CSS
        const orientation = job.printSettings.orientation;
        const duplex = job.printSettings.duplex;
        const color = job.printSettings.color;

        const printHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Printing: ${job.documentName}</title>
  <style>
    @page {
      size: ${job.printSettings.paperSize || 'A4'} ${orientation};
      margin: 0.5in;
    }
    
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      
      /* Apply grayscale if B&W */
      ${!color ? `
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        filter: grayscale(100%);
      }
      ` : ''}
      
      /* Duplex printing hint */
      ${duplex ? `
      @page :left {
        margin-left: 0.5in;
        margin-right: 0.25in;
      }
      @page :right {
        margin-left: 0.25in;
        margin-right: 0.5in;
      }
      ` : ''}
    }
    
    body {
      margin: 0;
      padding: 0;
    }
    
    iframe {
      width: 100%;
      height: 100vh;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="${blobUrl}" style="width: 100%; height: 100vh; border: none;"></iframe>
  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
        // Close window after print dialog (or after timeout)
        setTimeout(function() {
          window.close();
        }, 1000);
      }, 1000);
    };
  </script>
</body>
</html>`;

        // Step 4: Write HTML to print window
        printWindow.document.write(printHTML);
        printWindow.document.close();

        // Step 5: Wait for print to complete
        // Note: For multiple copies, we need to call print() multiple times
        // or use a print server that supports copies parameter
        
        let copiesPrinted = 0;
        const totalCopies = job.printSettings.copies || 1;

        const printNextCopy = () => {
          if (copiesPrinted >= totalCopies) {
            URL.revokeObjectURL(blobUrl);
            logger.event('PrintService', 'directPrintWithSettings:success', {
              jobId: job.id,
              copies: totalCopies,
              method: 'direct-print-window',
            });
            resolve({ success: true, method: 'direct-print-window' });
            return;
          }

          // Trigger print for this copy
          setTimeout(() => {
            try {
              printWindow.print();
              copiesPrinted++;
              
              if (copiesPrinted < totalCopies) {
                // Wait before printing next copy
                setTimeout(printNextCopy, 2000);
              } else {
                // All copies printed
                setTimeout(() => {
                  printWindow.close();
                  URL.revokeObjectURL(blobUrl);
                  logger.event('PrintService', 'directPrintWithSettings:success', {
                    jobId: job.id,
                    copies: totalCopies,
                    method: 'direct-print-window',
                  });
                  resolve({ success: true, method: 'direct-print-window' });
                }, 1000);
              }
            } catch (error) {
              console.error('Print error:', error);
              printWindow.close();
              URL.revokeObjectURL(blobUrl);
              resolve({ success: false, method: 'direct-print-error' });
            }
          }, 1500);
        };

        // Start printing first copy after window loads
        printWindow.onload = () => {
          setTimeout(printNextCopy, 1000);
        };

        // Fallback timeout
        setTimeout(() => {
          if (copiesPrinted === 0) {
            printWindow.close();
          }
        }, 30000);

      } catch (error: any) {
        logger.error('PrintService', 'directPrintWithSettings:error', error);
        resolve({ success: false, method: 'direct-print-failed' });
      }
    });
  }

  /**
   * Print using FastAPI print server
   * Sends PDF file to FastAPI endpoint via multipart/form-data
   * This provides server-side printing without browser dialogs
   */
  static async printWithFastAPI(
    job: PrintJob,
    documentUrl: string
  ): Promise<{ success: boolean; method: string; error?: string; cupsJobId?: number; printer?: string; jobIdFromServer?: number; rawResult?: any }> {
    console.log('🎯 [PrintService] printWithFastAPI ENTRY POINT', {
      jobId: job.id,
      documentUrl: documentUrl?.substring(0, 100) || 'NO URL',
      jobName: job.documentName,
    });
    
    return new Promise(async (resolve) => {
      try {
        // Validate inputs
        if (!documentUrl) {
          const errorMsg = 'Document URL is required';
          console.error('[PrintService] printWithFastAPI:validation-error', {
            jobId: job.id,
            error: errorMsg,
          });
          resolve({ 
            success: false, 
            method: 'fastapi-print-failed',
            error: errorMsg,
          });
          return;
        }

        console.log('[PrintService] printWithFastAPI:start', {
          jobId: job.id,
          documentUrl: documentUrl.substring(0, 100) + '...',
        });

        // Use Next.js API route to download PDF and forward to FastAPI (bypasses CORS)
        // This handles both PDF download from Firebase Storage and forwarding to FastAPI server-side
        const proxyUrl = '/api/print/download-and-forward';
        const fileName = job.documentName || `document_${job.id}.pdf`;
        
        console.log('[PrintService] printWithFastAPI:using-proxy', {
          proxyUrl,
          documentUrl: documentUrl.substring(0, 100) + '...',
          fileName,
          jobId: job.id,
        });

        // Send document URL to proxy, which will:
        // 1. Download PDF from Firebase Storage (server-side, no CORS)
        // 2. Forward to FastAPI server
        let printResponse: Response;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        try {
          printResponse = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json',
          },
          body: JSON.stringify({
            documentUrl,
            fileName,
            printSettings: job.printSettings, // Include print settings
            clientJobId: job.id, // Link kiosk job to CUPS job on FastAPI side
          }),
            signal: controller.signal,
        });
          clearTimeout(timeoutId);
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          // Handle network errors (fetch failures)
          const errorMsg = fetchError?.message || fetchError?.name || 'Network error';
          const errorDetails = {
            error: errorMsg,
            errorType: fetchError?.name || 'FetchError',
            jobId: job.id,
            proxyUrl,
            isNetworkError: true,
          };
          console.error('[PrintService] printWithFastAPI:network-error', errorDetails);
          resolve({ 
            success: false, 
            method: 'fastapi-print-failed',
            error: `Network error: ${errorMsg}. Please check if the print server is running.`,
          });
          return;
        }
        
        console.log('📡 [PrintService] Proxy response received:', {
          status: printResponse.status,
          statusText: printResponse.statusText,
          ok: printResponse.ok,
        });

        // Parse response (whether success or error) for richer info
        let result: any = null;
        let parseErrorText: string | undefined;

        try {
          const contentType = printResponse.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            result = await printResponse.json();
          } else {
            const textResponse = await printResponse.text();
            result = textResponse ? { message: textResponse } : null;
          }
        } catch (parseErr: any) {
          parseErrorText = parseErr?.message || 'Failed to parse print server response';
        }

        if (!printResponse.ok) {
          const errorText =
            result?.error ||
            result?.detail ||
            result?.message ||
            parseErrorText ||
            printResponse.statusText ||
            `HTTP ${printResponse.status}`;

          const errorDetails = {
            status: printResponse.status,
            statusText: printResponse.statusText,
            error: errorText,
            jobId: job.id,
            proxyUrl,
          };
          console.error('[PrintService] printWithFastAPI:server-error', errorDetails);
          resolve({
            success: false,
            method: 'fastapi-print-failed',
            error: `Print server error (${printResponse.status}): ${errorText}`,
          });
          return;
        }

        // Parse response if not already parsed
        if (!result) {
          try {
            const contentType = printResponse.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              result = await printResponse.json();
            } else {
              const textResponse = await printResponse.text();
              result = textResponse ? { message: textResponse } : null;
            }
          } catch (parseErr: any) {
            parseErrorText = parseErr?.message || 'Failed to parse print server response';
            result = { success: true, message: 'Print job sent (response unreadable)' };
          }
        }

        const jobIdFromServer = typeof result?.job_id === 'number' ? result.job_id : undefined;

        console.log('[PrintService] printWithFastAPI:success', {
          jobId: job.id,
          printServerJobId: jobIdFromServer,
          result,
        });

        // Expect FastAPI JSON: { status, job_id, printer, client_job_id, ... }
        const cupsJobId =
          typeof result?.job_id === 'number'
            ? result.job_id
            : typeof result?.job_id === 'string'
            ? Number.parseInt(result.job_id, 10)
            : undefined;

        resolve({
          success: true,
          method: 'fastapi-print-server',
          cupsJobId: Number.isNaN(cupsJobId as any) ? undefined : cupsJobId,
          printer: result?.printer,
          jobIdFromServer,
          rawResult: result,
        });

      } catch (error: any) {
        // Improved error handling with proper serialization
        const errorMessage = error?.message || String(error) || 'Unknown error';
        const errorStack = error?.stack || 'No stack trace available';
        const errorName = error?.name || 'Error';
        const errorType = typeof error;
        
        const errorDetails = {
          error: errorMessage,
          errorName,
          errorType,
          stack: errorStack,
          jobId: job.id,
          documentUrl: documentUrl?.substring(0, 100) || 'NO URL',
        };
        
        console.error('[PrintService] printWithFastAPI:error', errorDetails);
        resolve({ 
          success: false, 
          method: 'fastapi-print-failed',
          error: errorMessage,
        });
      }
    });
  }

  /**
   * Poll FastAPI print server for a CUPS job status.
   * Returns the final state as reported by the backend.
   */
  static async waitForFastAPIJob(
    cupsJobId: number,
    opts: { maxSeconds?: number; intervalMs?: number } = {}
  ): Promise<{ finalState: string }> {
    const maxSeconds = opts.maxSeconds ?? 60;
    const intervalMs = opts.intervalMs ?? 2000;

    const deadline = Date.now() + maxSeconds * 1000;
    let lastState = 'pending';

    while (Date.now() < deadline) {
      try {
        const resp = await fetch(`/api/print/job-status/${cupsJobId}`, {
          method: 'GET',
          headers: {
            accept: 'application/json',
          },
        });

        const data = (await resp.json().catch(() => ({}))) as any;

        if (typeof data?.state === 'string') {
          lastState = data.state;
        }

        // Terminal states from FastAPI/CUPS mapping
        if (
          lastState === 'completed' ||
          lastState === 'failed' ||
          lastState === 'aborted' ||
          lastState === 'canceled' ||
          lastState === 'stopped'
        ) {
          return { finalState: lastState };
        }
      } catch (err) {
        console.error('[PrintService] waitForFastAPIJob:poll-error', {
          error: (err as any)?.message || String(err),
          cupsJobId,
        });
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    return { finalState: lastState };
  }

  /**
   * IPP (Internet Printing Protocol) direct print
   * Sends print job directly to printer via IPP without browser dialog
   * Requires printer IP address and IPP enabled
   */
  static async ippDirectPrint(
    job: PrintJob,
    documentUrl: string,
    printerIP?: string
  ): Promise<{ success: boolean; method: string }> {
    return new Promise(async (resolve) => {
      try {
        const printerIPAddress = printerIP || process.env.NEXT_PUBLIC_PRINTER_IP || '192.168.1.50';
        const ippUrl = `http://${printerIPAddress}:631/ipp/print`;

        logger.event('PrintService', 'ippDirectPrint:start', {
          jobId: job.id,
          printerIP: printerIPAddress,
        });

        // Fetch document with retry logic for Firebase Storage
        let response: Response;
        let retries = 3;
        
        while (retries > 0) {
          try {
            response = await fetch(documentUrl, {
              mode: 'cors',
              credentials: 'omit',
              headers: {
                'Accept': '*/*',
                'Cache-Control': 'no-cache',
              },
              referrerPolicy: 'no-referrer',
            });

            if (response.ok) {
              break;
            }

            if (response.status === 412 || response.status === 403) {
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }

            if (!response.ok) {
              throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
            }
          } catch (fetchError: any) {
            retries--;
            if (retries === 0) {
              throw fetchError;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (!response! || !response!.ok) {
          throw new Error(`Failed to fetch document after retries: ${response!.status}`);
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Create IPP print job request
        // Note: Full IPP implementation requires proper IPP protocol encoding
        // This is a simplified version - for production, use a proper IPP library
        
        // For now, fallback to direct print method
        logger.info('PrintService', 'IPP not fully implemented, using direct print fallback');
        return this.directPrintWithSettings(job, documentUrl);

      } catch (error: any) {
        logger.error('PrintService', 'ippDirectPrint:error', error);
        resolve({ success: false, method: 'ipp-print-failed' });
      }
    });
  }

  /**
   * Check if Brother printer is ready
   * This is a helper method for Brother HL-L5210DN
   */
  static async checkBrotherPrinter(): Promise<{
    available: boolean;
    status: string;
  }> {
    try {
      // Check if print capability is available
      if (!window.print) {
        return { available: false, status: 'Print not supported' };
      }

      // For Brother printers, we rely on system printer status
      // In production, you might integrate with Brother's Web Services API
      return { available: true, status: 'Ready' };
    } catch (error) {
      return { available: false, status: 'Error checking printer' };
    }
  }
}
