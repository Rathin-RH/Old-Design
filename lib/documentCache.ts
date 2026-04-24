export type DocumentType = 
  | 'pdf' 
  | 'image' 
  | 'word' 
  | 'text' 
  | 'powerpoint' 
  | 'excel'
  | 'video'
  | 'unknown';

export interface CachedDocument {
  url: string;
  blob: Blob;
  type: DocumentType;
  mimeType: string;
  timestamp: number;
  size: number;
  name?: string;
}

export class DocumentCache {
  private dbName = 'vprint-document-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private maxCacheSize = 500 * 1024 * 1024; // 500MB max cache
  private maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const store = db.createObjectStore('documents', { keyPath: 'url' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('type', 'type', { unique: false });
        }

        // Metadata store (for cache management)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Detect document type from URL or MIME type
   */
  static detectDocumentType(url: string, mimeType?: string): DocumentType {
    const lowerUrl = url.toLowerCase();
    
    // Check MIME type first (more reliable)
    if (mimeType) {
      if (mimeType.includes('pdf')) return 'pdf';
      if (mimeType.includes('image')) return 'image';
      if (mimeType.includes('msword') || mimeType.includes('wordprocessingml')) return 'word';
      if (mimeType.includes('text')) return 'text';
      if (mimeType.includes('presentationml') || mimeType.includes('powerpoint')) return 'powerpoint';
      if (mimeType.includes('spreadsheetml') || mimeType.includes('excel')) return 'excel';
      if (mimeType.includes('video')) return 'video';
    }

    // Fallback to file extension
    if (lowerUrl.endsWith('.pdf')) return 'pdf';
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return 'image';
    if (lowerUrl.match(/\.(doc|docx)$/)) return 'word';
    if (lowerUrl.match(/\.(txt|text)$/)) return 'text';
    if (lowerUrl.match(/\.(ppt|pptx)$/)) return 'powerpoint';
    if (lowerUrl.match(/\.(xls|xlsx)$/)) return 'excel';
    if (lowerUrl.match(/\.(mp4|avi|mov|wmv)$/)) return 'video';

    return 'unknown';
  }

  /**
   * Get cached document
   */
  async get(url: string): Promise<CachedDocument | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.get(url);

      request.onsuccess = () => {
        const result = request.result as CachedDocument | undefined;
        
        if (!result) {
          resolve(null);
          return;
        }

        // Check if cache is still valid
        const age = Date.now() - result.timestamp;
        if (age > this.maxAge) {
          // Cache expired, delete it
          this.delete(url).catch(console.error);
          resolve(null);
          return;
        }

        resolve(result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache a document
   */
  async set(
    url: string, 
    blob: Blob, 
    mimeType?: string,
    name?: string
  ): Promise<void> {
    if (!this.db) await this.init();

    const type = DocumentCache.detectDocumentType(url, mimeType);
    
    // Check cache size and clean up if needed
    await this.cleanupIfNeeded(blob.size);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      
      const cached: CachedDocument = {
        url,
        blob,
        type,
        mimeType: mimeType || blob.type || 'application/octet-stream',
        timestamp: Date.now(),
        size: blob.size,
        name,
      };

      const request = store.put(cached);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a cached document
   */
  async delete(url: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.delete(url);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache size and clean up if needed
   */
  private async cleanupIfNeeded(newItemSize: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CachedDocument[];
        let totalSize = items.reduce((sum, item) => sum + item.size, 0);
        
        // If adding new item would exceed limit, clean up oldest items
        if (totalSize + newItemSize > this.maxCacheSize) {
          // Sort by timestamp (oldest first)
          items.sort((a, b) => a.timestamp - b.timestamp);
          
          // Delete oldest items until we have space
          const deletePromises: Promise<void>[] = [];
          for (const item of items) {
            if (totalSize + newItemSize <= this.maxCacheSize) break;
            totalSize -= item.size;
            deletePromises.push(this.delete(item.url));
          }
          
          Promise.all(deletePromises).then(() => resolve()).catch(reject);
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readwrite');
      const store = transaction.objectStore('documents');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalItems: number;
    totalSize: number;
    byType: Record<DocumentType, number>;
  }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['documents'], 'readonly');
      const store = transaction.objectStore('documents');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as CachedDocument[];
        const stats = {
          totalItems: items.length,
          totalSize: items.reduce((sum, item) => sum + item.size, 0),
          byType: items.reduce((acc, item) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {} as Record<DocumentType, number>),
        };

        resolve(stats);
      };

      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const documentCache = new DocumentCache();



