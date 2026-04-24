export type PrinterStatus =
  | 'connected'
  | 'ready'
  | 'disconnected'
  | 'maintenance'
  | 'printing'
  | 'error';

export type PrinterErrorType =
  | 'not_connected'
  | 'print_failed'
  | 'paper_jam'
  | 'out_of_paper'
  | 'low_paper'
  | 'ink_low'
  | 'ink_empty'
  | 'cover_open'
  | 'tray_missing'
  | 'connection_timeout'
  | 'unknown_error';

export interface PrinterErrorDetails {
  type: PrinterErrorType;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  paperRemaining?: number;
  paperTotal?: number;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface DocumentFile {
  url: string;
  name: string;
  pages?: number;
  size?: number;
  printed?: boolean;
  printedAt?: Date;
}

export interface PrintJob {
  id: string;
  token: string;
  qrCode: string;
  documentUrl: string;
  documentName: string;
  documents?: DocumentFile[];

  status: 'pending' | 'ready' | 'processing' | 'printing' | 'completed' | 'failed';

  printSettings: {
    copies: number;
    color: boolean;
    duplex: boolean;
    paperSize: 'A4' | 'A3' | 'Letter';
    orientation: 'portrait' | 'landscape';
  };

  createdAt: Date;
  printedAt?: Date;
  kioskId?: string;
  userId: string;
  userName?: string;
  paymentStatus: 'pending' | 'completed' | 'failed';
  amount: number;
  error?: string;

  // added for realtime print tracking
  progress?: number;
  cupsJobId?: number;
  printerName?: string;
  completedPages?: number;
  totalPages?: number;
  startedAt?: Date;
  updatedAt?: Date;
}
export interface KioskSettings {
  id: string;
  name: string;
  location: string;
  printerStatus: PrinterStatus;
  printerModel: string;
  lastMaintenance: Date;
  isActive: boolean;
  enabledAt?: Date;
  createdAt: Date;
  advertisements: Advertisement[];
  statistics: KioskStatistics;
}

export interface KioskStatistics {
  totalPrintJobs: number;
  successfulPrints: number;
  failedPrints: number;
  totalRevenue: number;
  averagePrintTime: number;
  lastPrintJob?: Date;
  uptime: number;
  paperJams: number;
  maintenanceCount: number;
}

export interface Advertisement {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  type: 'image' | 'video';
  title: string;
  duration: number;
  link?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  displayCount?: number;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin' | 'super-admin';
  lastLogin?: Date;
}

export interface ActivityLog {
  id: string;
  kioskId: string;
  timestamp: Date;
  activity: string;
  type: 'info' | 'warning' | 'error' | 'success';
  details?: any;
  userId?: string;
  category?: 'printer' | 'print_job' | 'system' | 'user' | 'maintenance';
  printerError?: PrinterErrorDetails;
}