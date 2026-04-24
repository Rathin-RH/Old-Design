'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Palette, RotateCw, Copy, FileText, Minus, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { PrintJob, DocumentFile } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PrintSettingsProps {
  job: PrintJob;
  printSettings: PrintJob['printSettings'];
  onSettingsChange?: <K extends keyof PrintJob['printSettings']>(
    key: K,
    value: PrintJob['printSettings'][K]
  ) => Promise<void>;
  currentDocument: DocumentFile;
  isSavingSettings?: boolean;
  isCurrentDocumentPrinted?: boolean;
  readOnly?: boolean; // If true, settings are display-only (kiosk mode)
}

// Parse page range string (e.g., "1-3,5,7-9") into array of page numbers
function parsePageRange(range: string, totalPages: number): number[] {
  if (!range.trim()) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>();
  const parts = range.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      // Range: "1-3" → [1, 2, 3]
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (start && end && start <= end) {
        for (let i = start; i <= Math.min(end, totalPages); i++) {
          pages.add(i);
        }
      }
    } else {
      // Single: "5" → [5]
      const pageNum = parseInt(trimmed);
      if (pageNum && pageNum <= totalPages) {
        pages.add(pageNum);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export default function PrintSettings({
  job,
  printSettings,
  onSettingsChange,
  currentDocument,
  isSavingSettings = false,
  isCurrentDocumentPrinted = false,
  readOnly = true, // Default to read-only for kiosk mode
}: PrintSettingsProps) {
  const [pageRange, setPageRange] = useState<string>('');
  const [selectedPages, setSelectedPages] = useState<number[]>([]);

  // Calculate total pages for current document
  const totalPages = currentDocument.pages || 1;

  // Calculate cost (₹2 per page for B&W)
  const calculateTotalPages = useMemo(() => {
    const pagesToPrint = selectedPages.length > 0 
      ? selectedPages.length 
      : totalPages;
    return pagesToPrint * printSettings.copies;
  }, [selectedPages, totalPages, printSettings.copies]);

  const calculateCost = useMemo(() => {
    const basePrice = 2; // ₹2 per page (Black & White only)
    return calculateTotalPages * basePrice;
  }, [calculateTotalPages]);

  // Handle page range input
  const handlePageRangeChange = (value: string) => {
    setPageRange(value);
    if (value.trim()) {
      const pages = parsePageRange(value, totalPages);
      setSelectedPages(pages);
    } else {
      setSelectedPages([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Print Summary Card */}
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-bold text-white mb-1 drop-shadow-lg">Print Summary</h3>
            <p className="text-sm text-white/80">
              {calculateTotalPages} pages • Black & White • {printSettings.copies} {printSettings.copies === 1 ? 'copy' : 'copies'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white drop-shadow-lg">₹{calculateCost}</p>
            <p className="text-xs text-white/70">Total cost</p>
          </div>
        </div>
      </Card>

      {/* Color Mode (B&W Only - Disabled) */}
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <Palette className="h-5 w-5 text-white" />
          <Label className="text-base font-semibold text-white">Print Mode</Label>
        </div>
        <div className="flex items-center justify-between p-3 bg-white/10 backdrop-blur-sm rounded-lg border-2 border-white/20">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-white rounded-full shadow-lg"></div>
            <span className="text-sm font-medium text-white">Black & White Only</span>
          </div>
          <span className="text-sm text-white/90 font-semibold">₹2/page</span>
        </div>
      </Card>

      {/* Orientation Selector */}
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <RotateCw className="h-5 w-5 text-white" />
          <Label className="text-base font-semibold text-white">Orientation</Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={printSettings.orientation === 'portrait' ? 'default' : 'outline'}
            onClick={() => onSettingsChange?.('orientation', 'portrait')}
            disabled={readOnly || isCurrentDocumentPrinted || isSavingSettings || !onSettingsChange}
            className="h-12 font-semibold"
          >
            Portrait
          </Button>
          <Button
            variant={printSettings.orientation === 'landscape' ? 'default' : 'outline'}
            onClick={() => onSettingsChange?.('orientation', 'landscape')}
            disabled={readOnly || isCurrentDocumentPrinted || isSavingSettings || !onSettingsChange}
            className="h-12 font-semibold"
          >
            Landscape
          </Button>
        </div>
      </Card>

      {/* Copies Selector */}
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
        <div className="flex items-center space-x-2 mb-3">
          <Copy className="h-5 w-5 text-white" />
          <Label className="text-base font-semibold text-white">Number of Copies</Label>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSettingsChange?.('copies', Math.max(1, printSettings.copies - 1))}
            disabled={readOnly || printSettings.copies <= 1 || isCurrentDocumentPrinted || isSavingSettings || !onSettingsChange}
            className="h-10 w-10 p-0 font-bold text-lg"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Input
            type="number"
            value={printSettings.copies}
            onChange={(e) => {
              if (readOnly || !onSettingsChange) return;
              const value = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
              onSettingsChange('copies', value);
            }}
            disabled={readOnly || isCurrentDocumentPrinted || isSavingSettings || !onSettingsChange}
            className="w-20 text-center font-semibold text-lg"
            min="1"
            max="100"
            readOnly={readOnly}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSettingsChange?.('copies', Math.min(100, printSettings.copies + 1))}
            disabled={readOnly || printSettings.copies >= 100 || isCurrentDocumentPrinted || isSavingSettings || !onSettingsChange}
            className="h-10 w-10 p-0 font-bold text-lg"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Duplex Toggle */}
      <Card className="p-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label className="text-base font-semibold mb-1 block text-white">Double-sided printing</Label>
            <p className="text-sm text-white/70">Save paper and reduce cost</p>
          </div>
          <Switch
            checked={printSettings.duplex}
            onCheckedChange={(checked) => onSettingsChange?.('duplex', checked)}
            disabled={readOnly || isCurrentDocumentPrinted || isSavingSettings || !onSettingsChange}
            className="ml-4"
          />
        </div>
      </Card>

      {/* Page Range Selection (only show if document has multiple pages) */}
      {totalPages > 1 && (
        <Card className="p-4 bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-xl">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="h-5 w-5 text-white" />
            <Label className="text-base font-semibold text-white">Page Selection</Label>
          </div>
          <div className="space-y-2">
            <Label className="text-sm text-white/80">
              Page range (e.g., 1-3,5,7-9) or leave empty for all pages
            </Label>
            <Input
              type="text"
              placeholder={`1-${totalPages} (all pages)`}
              value={pageRange}
              onChange={(e) => !readOnly && handlePageRangeChange(e.target.value)}
              disabled={readOnly || isCurrentDocumentPrinted || isSavingSettings}
              className="font-mono"
              readOnly={readOnly}
            />
            {selectedPages.length > 0 && (
              <p className="text-xs text-white/70">
                Selected: {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''} ({selectedPages.join(', ')})
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Saving Indicator */}
      {isSavingSettings && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-sm text-white/80 p-2"
        >
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Saving settings...</span>
        </motion.div>
      )}
    </div>
  );
}

