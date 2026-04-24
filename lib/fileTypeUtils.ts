import { DocumentType, DocumentCache } from './documentCache';

export interface FileTypeInfo {
  type: DocumentType;
  mimeType: string;
  extension: string;
  canPreview: boolean;
  canPrint: boolean;
  previewMethod: 'iframe' | 'image' | 'object' | 'embed' | 'download';
}

export class FileTypeUtils {
  /**
   * Get comprehensive file type information
   */
  static getFileTypeInfo(url: string, mimeType?: string): FileTypeInfo {
    const type = DocumentCache.detectDocumentType(url, mimeType);
    const extension = this.getExtension(url);
    const detectedMimeType = mimeType || this.getMimeTypeFromExtension(extension);

    const info: FileTypeInfo = {
      type,
      mimeType: detectedMimeType,
      extension,
      canPreview: this.canPreview(type),
      canPrint: this.canPrint(type),
      previewMethod: this.getPreviewMethod(type),
    };

    return info;
  }

  private static getExtension(url: string): string {
    const match = url.match(/\.([a-z0-9]+)(?:\?|$)/i);
    return match ? match[1].toLowerCase() : '';
  }

  private static getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      txt: 'text/plain',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      mp4: 'video/mp4',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
      wmv: 'video/x-ms-wmv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  private static canPreview(type: DocumentType): boolean {
    return ['pdf', 'image', 'text'].includes(type);
  }

  private static canPrint(type: DocumentType): boolean {
    // Most file types can be printed, but some need conversion
    return type !== 'unknown';
  }

  private static getPreviewMethod(type: DocumentType): FileTypeInfo['previewMethod'] {
    switch (type) {
      case 'pdf':
        return 'iframe';
      case 'image':
        return 'image';
      case 'text':
        return 'iframe';
      case 'word':
      case 'powerpoint':
      case 'excel':
        return 'object'; // Use Google Docs Viewer or Office Online
      case 'video':
        return 'embed';
      default:
        return 'download';
    }
  }

  /**
   * Get preview URL for different file types
   */
  static getPreviewUrl(url: string, type: DocumentType, page?: number, orientation: 'portrait' | 'landscape' = 'portrait'): string {
    switch (type) {
      case 'pdf':
        const viewParam = orientation === 'landscape' ? 'FitV' : 'FitH';
        const pageParam = page ? `page=${page}&` : '';
        return `${url}#${pageParam}toolbar=0&statusbar=0&navpanes=0&view=${viewParam}&scrollbar=1`;
      
      case 'image':
        return url;
      
      case 'text':
        return url;
      
      case 'word':
      case 'powerpoint':
      case 'excel':
        // Use Google Docs Viewer for Office files
        return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      
      default:
        return url;
    }
  }
}



