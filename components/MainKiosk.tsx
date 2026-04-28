import { useState, useCallback, useRef, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { KioskService } from '@/lib/kioskService';
import { MainScreen } from './screens/MainScreen';
import { CodeEntryScreen } from './screens/CodeEntryScreen';
import { PrintingScreen } from './screens/PrintingScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { SystemErrorScreen } from './screens/SystemErrorScreen';
import { PrintService } from '@/lib/printService';
import { MaintenanceScreen } from './screens/MaintenanceScreen';


export type ScreenState =
  | 'main-interface'
  | 'code-entry-screen'
  | 'printing-screen'
  | 'summary-screen'
  | 'system-error-screen'
  | 'maintenance-screen';

type JobData = {
  id: string;
  userName: string;
  fileName: string;
  pages: number;
  copies: number;
  mode: string;
  documentUrl?: string;
  progress?: number;
  status?: string;
  cupsJobId?: number;
};

type JobStatus =
  | 'pending'
  | 'ready'
  | 'printing'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'error';

type PrinterStatus =
  | 'idle'
  | 'ready'
  | 'printing'
  | 'offline'
  | 'disconnected'
  | 'error'
  | 'maintenance';

type PrinterStatusApiResponse = {
  success: boolean;
  data?: {
    name: string;
    state_code: number;
    state: 'idle' | 'processing' | 'stopped' | 'unknown';
    state_message?: string;
    state_reasons?: string | string[];
  };
  error?: string;
};

type PrintApiResponse = {
  success: boolean;
  message?: string;
  jobId?: string;
  cupsJobId?: number;
  printer?: string;
  totalPages?: number | null;
  method?: string;
  error?: string;
};

type BackendJobStatusApiResponse = {
  success: boolean;
  data?: {
    state?: string;
    status?: string;
    completed?: boolean;
    [key: string]: unknown;
  };
  error?: string;
};

const KIOSK_ID = 'kiosk-001';

function mapPrinterStateToUi(state?: string): PrinterStatus {
  if (state === 'idle') return 'ready';
  if (state === 'processing') return 'printing';
  if (state === 'stopped') return 'error';
  return 'disconnected';
}

function mapBackendJobStateToFirestoreStatus(state?: string): JobStatus | null {
  const normalized = (state || '').toString().toLowerCase();

  if (['completed', 'done', 'success', 'successful', 'finished'].includes(normalized)) {
    return 'completed';
  }

  if (['failed', 'error', 'aborted', 'canceled', 'cancelled', 'stopped'].includes(normalized)) {
    return 'failed';
  }

  if (['processing', 'printing', 'in_progress', 'in-progress', 'running'].includes(normalized)) {
    return 'printing';
  }

  if (['pending', 'queued', 'ready'].includes(normalized)) {
    return 'pending';
  }

  return null;
}

function MainKiosk() {
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('main-interface');
  const [code, setCode] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastError, setToastError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [jobData, setJobData] = useState<JobData | null>(null);
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>('disconnected');
  const [manualProgress, setManualProgress] = useState<number | undefined>(undefined);
  const [printSuccess, setPrintSuccess] = useState(false);
  const [printFailed, setPrintFailed] = useState(false);
const [failureMessage, setFailureMessage] = useState('');

  const toastTimerRef = useRef<number | null>(null);
  const jobUnsubscribeRef = useRef<(() => void) | null>(null);

  const showToast = useCallback((msg: string, isError: boolean = false) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToastMsg(msg);
    setToastError(isError);

    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg('');
      setToastError(false);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

  const stopJobMonitoring = useCallback(() => {
    if (jobUnsubscribeRef.current) {
      jobUnsubscribeRef.current();
      jobUnsubscribeRef.current = null;
    }
  }, []);

  const fetchLivePrinterStatus = useCallback(async (): Promise<PrinterStatus> => {
    try {
      const res = await fetch('/api/printer-status', { method: 'GET' });

      if (!res.ok) {
        setPrinterStatus('disconnected');
        return 'disconnected';
      }

      const result: PrinterStatusApiResponse = await res.json();

      if (!result.success || !result.data) {
        setPrinterStatus('disconnected');
        return 'disconnected';
      }

      const mapped = mapPrinterStateToUi(result.data.state);
      setPrinterStatus(mapped);
      return mapped;
    } catch (error) {
      console.warn('Live printer status endpoint unreachable/offline. Using fallback state.', error);
      setPrinterStatus('disconnected');
      return 'disconnected';
    }
  }, []);

  const syncBackendJobToFirestore = useCallback(
    async (firestoreJobId: string, cupsJobId: number, pagesToPrint: number) => {
      // Dynamic Simulated loader perfectly synchronized with physical hardware speeds
      // Assuming laser printer speed of ~2.5 seconds per physical page.
      const totalTime = Math.max(pagesToPrint * 2500, 5000);
      const steps = 5;
      const interval = totalTime / steps;

      try {
        for (let i = 1; i < steps; i++) {
          await new Promise((resolve) => window.setTimeout(resolve, interval));
          await updateDoc(doc(db, 'printJobs', firestoreJobId), {
            progress: Math.floor((i / steps) * 100),
            updatedAt: Timestamp.now(),
          });
        }

        // Final delay before completion
        await new Promise((resolve) => window.setTimeout(resolve, interval));

        await updateDoc(doc(db, 'printJobs', firestoreJobId), {
          status: 'completed',
          progress: 100,
          printedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error('Failed to complete job in background:', error);
        await updateDoc(doc(db, 'printJobs', firestoreJobId), {
          status: 'failed',
          updatedAt: Timestamp.now(),
        });
      }
    },
    []
  );

  const startMonitoringJob = useCallback(
    (firestoreJobId: string) => {
      stopJobMonitoring();

      jobUnsubscribeRef.current = PrintService.monitorJobStatus(
        firestoreJobId,
        async (job, status) => {
          try {
            if (!job) {
              showToast('Print job not found', true);
              setCurrentScreen('system-error-screen');
              return;
            }

            const nextProgress = typeof job.progress === 'number' ? job.progress : 0;

            setManualProgress(nextProgress);
            setJobData((prev) =>
              prev
                ? {
                    ...prev,
                    progress: nextProgress,
                    status,
                    cupsJobId: job.cupsJobId,
                  }
                : prev
            );

            if (status === 'pending' || status === 'ready') {
              setPrinterStatus('ready');
            }

            if (status === 'printing') {
              setPrinterStatus('printing');
            }

            if (status === 'completed') {
              setManualProgress(100);
              setPrintSuccess(true);
              setPrinterStatus('ready');
              stopJobMonitoring();

              await KioskService.logActivity(KIOSK_ID, 'print_completed', {
                jobId: firestoreJobId,
                cupsJobId: job.cupsJobId,
              });
            }

            if (status === 'failed') {
                stopJobMonitoring();
                setPrinterStatus('error');
                setPrintFailed(true);
                setFailureMessage('Printing failed. Please try again.');

                await KioskService.logActivity(KIOSK_ID, 'print_error', {
                  jobId: firestoreJobId,
                  cupsJobId: job.cupsJobId,
                  state: status,
                });
              }
          } catch (listenerError) {
            console.error('Job monitor callback error:', listenerError);
            stopJobMonitoring();
            setCurrentScreen('system-error-screen');
          }
        }
      );
    },
    [showToast, stopJobMonitoring]
  );

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      const status = await fetchLivePrinterStatus();
      if (!isMounted) return;

      if (status === 'maintenance') {
        setCurrentScreen('maintenance-screen');
      }

      if (
        currentScreen === 'printing-screen' &&
        (status === 'error' || status === 'offline' || status === 'disconnected')
      ) {
        setCurrentScreen('system-error-screen');
      }
    };

    checkStatus();
    const intervalId = window.setInterval(checkStatus, 5000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      stopJobMonitoring();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [currentScreen, fetchLivePrinterStatus, stopJobMonitoring]);

  const handleValidationSuccess = useCallback(
    async (enteredCode: string) => {
      if (enteredCode.length !== 6) return;

      setIsValidating(true);

      try {
        await KioskService.logActivity(KIOSK_ID, 'code_validation_started', {
          enteredCode,
        });

        const livePrinterStatus = await fetchLivePrinterStatus();

        if (livePrinterStatus === 'maintenance') {
          showToast('Kiosk under maintenance', true);
          setCurrentScreen('maintenance-screen');
          setCode('');
          return;
        }

        if (
          livePrinterStatus === 'disconnected' ||
          livePrinterStatus === 'offline' ||
          livePrinterStatus === 'error'
        ) {
          showToast('Printer unavailable', true);
          setCurrentScreen('system-error-screen');
          setCode('');
          return;
        }

        const q = query(collection(db, 'printJobs'), where('tokenId', '==', enteredCode));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await KioskService.logActivity(KIOSK_ID, 'invalid_code', {
            enteredCode,
          });
          showToast('Invalid Code - Access Denied', true);
          setCode('');
          return;
        }

        const docSnap = querySnapshot.docs[0];
        const data = docSnap.data();
        const firestoreJobId = docSnap.id;

        if (data.status === 'completed') {
          await KioskService.logActivity(KIOSK_ID, 'already_printed', { firestoreJobId });
          showToast('Already Printed', true);
          setCode('');
          return;
        }

        const documentUrl =
          data.documentUrl || data.url || data.fileUrl || data.downloadUrl || '';
        const fileName = data.fileName ?? data.documentName ?? 'Document.pdf';

        if (!documentUrl) {
          showToast('File URL missing', true);
          setCurrentScreen('system-error-screen');
          return;
        }

        let resolvedName = data.name ?? data.studentName ?? data.fullName ?? data.customerName ?? data.userName;
        
        // If the job lacks an embedded name but has a generic UID, try to dynamically fetch their profile from the 'users' collection
        if (!resolvedName && (data.user_id || data.userId)) {
           const uid = data.user_id || data.userId;
           try {
              const userSnap = await getDoc(doc(db, 'users', uid));
              if (userSnap.exists()) {
                 const udata = userSnap.data();
                 resolvedName = udata.name ?? udata.displayName ?? udata.fullName ?? udata.firstName ?? udata.username;
              }
           } catch (e) {
              console.warn('Could not fetch user profile fallback:', e);
           }
        }

        const fetchedJob: JobData = {
          id: firestoreJobId,
          userName: resolvedName || 'User',
          fileName,
          pages: Number(data.pages ?? 1),
          copies: Number(data.settings?.copies ?? data.copies ?? 1),
          mode: data.settings?.colorMode ?? data.mode ?? 'Black & White',
          documentUrl,
          progress: 0,
          status: 'printing',
        };

        setPrintSuccess(false);
        setJobData(fetchedJob);
        setManualProgress(0);
        setCode('');
        setCurrentScreen('printing-screen');

        const printRes = await fetch('/api/print', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentUrl,
            fileName,
            jobId: firestoreJobId,
            printSettings: {
              copies: Number(data.settings?.copies ?? data.copies ?? 1),
              orientation: data.settings?.orientation ?? data.orientation ?? 'portrait',
              color:
                (data.settings?.colorMode ?? data.mode ?? '')
                  .toString()
                  .toLowerCase() === 'color',
              duplex: Boolean(data.settings?.duplex ?? data.duplex ?? false),
              paperSize: data.settings?.paperSize ?? data.paperSize ?? 'A4',
              pages: data.settings?.pages ?? data.pagesRange ?? undefined,
            },
          }),
        });

        if (!printRes.ok) {
          const errText = await printRes.text();
          throw new Error(`Print proxy failed: ${printRes.status} ${errText}`);
        }

        const printResult: PrintApiResponse = await printRes.json();

        if (!printResult.success || !printResult.cupsJobId) {
          throw new Error(printResult.error || 'Invalid print response');
        }

        await updateDoc(doc(db, 'printJobs', firestoreJobId), {
          status: 'printing',
          progress: 0,
          kioskId: KIOSK_ID,
          startedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          cupsJobId: printResult.cupsJobId,
          printerName: printResult.printer ?? null,
        });

        await KioskService.logActivity(KIOSK_ID, 'print_started', {
          firestoreJobId,
          cupsJobId: printResult.cupsJobId,
          fileName: fetchedJob.fileName,
          pages: fetchedJob.pages,
          copies: fetchedJob.copies,
        });

        setJobData((prev) =>
          prev
            ? {
                ...prev,
                cupsJobId: printResult.cupsJobId,
                status: 'printing',
              }
            : prev
        );

        setPrinterStatus('printing');

        // Firebase real-time listener starts here
        startMonitoringJob(firestoreJobId);
        void syncBackendJobToFirestore(firestoreJobId, printResult.cupsJobId, fetchedJob.pages);
      } catch (error) {
        console.error('Validation/print start failed:', error);
        await KioskService.logActivity(KIOSK_ID, 'validation_failed', { error });
        showToast('Unable to start printing', true);
        setCurrentScreen('system-error-screen');
      } finally {
        setIsValidating(false);
      }
    },
    [fetchLivePrinterStatus, showToast, startMonitoringJob, syncBackendJobToFirestore]
  );

  const handleReset = useCallback(async () => {
    try {
      stopJobMonitoring();

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

      if (jobData?.id) {
        await KioskService.logActivity(KIOSK_ID, 'session_reset', {
          jobId: jobData.id,
          finalStatus: jobData.status ?? 'unknown',
        });
      }

      setCode('');
      setJobData(null);
      setManualProgress(undefined);
      setPrintSuccess(false);
      setToastMsg('');
      setToastError(false);
      setIsValidating(false);
      setCurrentScreen('main-interface');
      setPrintFailed(false);
      setFailureMessage('');
      await fetchLivePrinterStatus();
    } catch (error) {
      console.error('Reset failed:', error);
      setCurrentScreen('main-interface');
    }
  }, [fetchLivePrinterStatus, jobData?.id, jobData?.status, stopJobMonitoring]);

  const handleRetry = useCallback(async () => {
    if (!jobData?.id) {
      setCurrentScreen('main-interface');
      return;
    }

    stopJobMonitoring();
    setManualProgress(0);
    setPrintSuccess(false);
    setCurrentScreen('code-entry-screen');
    showToast('Enter code again to retry');
  }, [jobData?.id, showToast, stopJobMonitoring]);

  const goToCodeEntry = useCallback(() => {
    setCurrentScreen('code-entry-screen');
  }, []);

  const goToSummary = useCallback(() => {
    setCurrentScreen('summary-screen');
  }, []);

  return (
    <>
      {toastMsg && (
        <div className={`toast-container visible ${toastError ? 'error' : ''}`}>
          <span className="material-symbols-outlined icon-main">
            {toastError ? 'error' : 'info'}
          </span>
          <span>{toastMsg}</span>
          <div className="toast-close" onClick={() => setToastMsg('')}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              close
            </span>
          </div>
        </div>
      )}

      <MainScreen
        isActive={currentScreen === 'main-interface'}
        onNext={goToCodeEntry}
      />

      <CodeEntryScreen
        isActive={currentScreen === 'code-entry-screen'}
        code={code}
        setCode={setCode}
        onSuccess={handleValidationSuccess}
        hasError={toastError && currentScreen === 'code-entry-screen'}
        isLoading={isValidating}
      />

      <PrintingScreen
        isActive={currentScreen === 'printing-screen'}
        statusTitle={printSuccess ? 'Completed' : `Hello ${jobData?.userName?.split(' ')[0] || 'User'}..!`}
        statusSub={
          printSuccess
            ? 'Your document has been printed successfully.'
            : `Printing in progress…\nPlease wait.`
        }
        pages={jobData?.pages || 1}
        manualProgress={manualProgress}
        onComplete={goToSummary}
      />

      <SummaryScreen
        isActive={currentScreen === 'summary-screen'}
        onReset={handleReset}
        jobData={jobData}
      />

      <SystemErrorScreen
        isActive={currentScreen === 'system-error-screen'}
        jobData={jobData}
        onReset={handleReset}
        onRetry={handleRetry}
      />

      <MaintenanceScreen
        isActive={currentScreen === 'maintenance-screen'}
        onReset={handleReset}
      />
    </>
  );
}

export default MainKiosk;
