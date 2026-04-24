import { documentCache, DocumentCache, DocumentType } from './documentCache';
import { FileTypeUtils, FileTypeInfo } from './fileTypeUtils';

export interface LoadedDocument {
  url: string;
  blob: Blob;
  blobUrl: string;
  type: DocumentType;
  info: FileTypeInfo;
  cached: boolean;
  loadTime: number;
}

export class DocumentLoader {
  /**
   * Load document with caching
   * Optimized to return cached documents instantly
   */
  static async load(
    url: string,
    options: {
      forceRefresh?: boolean;
      mimeType?: string;
      name?: string;
    } = {}
  ): Promise<LoadedDocument> {
    const startTime = performance.now();
    const { forceRefresh = false, mimeType, name } = options;

    // Check cache first (unless force refresh) - this is the fast path
    if (!forceRefresh) {
      const cached = await documentCache.get(url);
      if (cached) {
        const blobUrl = URL.createObjectURL(cached.blob);
        const info = FileTypeUtils.getFileTypeInfo(url, cached.mimeType);
        
        // Return immediately for cached documents (near-instant)
        return {
          url,
          blob: cached.blob,
          blobUrl,
          type: cached.type,
          info,
          cached: true,
          loadTime: performance.now() - startTime, // Should be < 10ms
        };
      }
    }

    // Download document
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': '*/*', // Accept all file types
      },
      cache: 'force-cache', // Use browser cache if available
    });

    if (!response.ok) {
      throw new Error(`Failed to load document: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    const detectedMimeType = mimeType || response.headers.get('content-type') || blob.type;
    const info = FileTypeUtils.getFileTypeInfo(url, detectedMimeType);

    // Cache the document
    await documentCache.set(url, blob, detectedMimeType, name).catch((error) => {
      // Don't fail if caching fails, just log it
      console.warn('Failed to cache document:', error);
    });

    const blobUrl = URL.createObjectURL(blob);
    const loadTime = performance.now() - startTime;

    return {
      url,
      blob,
      blobUrl,
      type: info.type,
      info,
      cached: false,
      loadTime,
    };
  }

  /**
   * Preload document in background
   */
  static async preload(url: string, name?: string): Promise<void> {
    try {
      // Check if already cached
      const cached = await documentCache.get(url);
      if (cached) return; // Already cached

      // Load in background
      const loaded = await this.load(url, { name });
      // Blob URL will be created but we don't need to keep it
      // It will be revoked when component unmounts or when we explicitly revoke it
    } catch (error) {
      // Silent fail - preload is optional
      console.warn('Failed to preload document:', url, error);
    }
  }

  /**
   * Preload multiple documents
   */
  static async preloadMultiple(urls: string[]): Promise<void> {
    // Load in parallel (but limit concurrency)
    const batchSize = 3;
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(url => this.preload(url))
      );
    }
  }

  /**
   * Revoke blob URL to free memory
   */
  static revokeBlobUrl(blobUrl: string): void {
    try {
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Ignore errors when revoking
      console.warn('Failed to revoke blob URL:', error);
    }
  }
}

