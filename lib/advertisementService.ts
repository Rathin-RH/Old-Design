import { db, storage } from './firebase';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Advertisement } from './types';
import { logger } from './utils';

export class AdvertisementService {
  /**
   * Add advertisement
   */
  static async addAdvertisement(
    kioskId: string,
    ad: Omit<Advertisement, 'id' | 'createdAt'>
  ): Promise<void> {
    try {
      const kioskRef = doc(db, 'kiosks', kioskId);
      logger.event('AdvertisementService', 'addAdvertisement', { kioskId, title: ad.title });
      const newAd: Advertisement = {
        ...ad,
        id: Date.now().toString(),
        createdAt: new Date(),
        displayCount: 0,
      };

      await updateDoc(kioskRef, {
        advertisements: arrayUnion(newAd),
      });
    } catch (error) {
      console.error('Error adding advertisement:', error);
      throw error;
    }
  }

  /**
   * Update advertisement
   */
  static async updateAdvertisement(
    kioskId: string,
    adId: string,
    updates: Partial<Advertisement>
  ): Promise<void> {
    try {
      const kioskRef = doc(db, 'kiosks', kioskId);
      logger.event('AdvertisementService', 'updateAdvertisement', { kioskId, adId });
      const kioskDoc = await getDoc(kioskRef);
      
      if (!kioskDoc.exists()) {
        throw new Error('Kiosk not found');
      }

      const data = kioskDoc.data();
      const ads = data.advertisements || [];
      const updatedAds = ads.map((ad: Advertisement) => {
        if (ad.id === adId) {
          return { ...ad, ...updates, updatedAt: new Date() };
        }
        return ad;
      });

      await updateDoc(kioskRef, {
        advertisements: updatedAds,
      });
    } catch (error) {
      console.error('Error updating advertisement:', error);
      throw error;
    }
  }

  /**
   * Delete advertisement
   */
  static async deleteAdvertisement(
    kioskId: string,
    ad: Advertisement
  ): Promise<void> {
    try {
      const kioskRef = doc(db, 'kiosks', kioskId);
      logger.event('AdvertisementService', 'deleteAdvertisement', { kioskId, adId: ad.id });
      await updateDoc(kioskRef, {
        advertisements: arrayRemove(ad),
      });

      // Delete file from storage if exists
      if (ad.imageUrl && ad.imageUrl.includes('firebase')) {
        try {
          // Extract storage path from a download URL: /o/{path}?...
          const url = new URL(ad.imageUrl);
          const pathEncoded = (url.pathname.split('/o/')[1] || '').split('?')[0];
          const storagePath = decodeURIComponent(pathEncoded);
          const fileRef = ref(storage, storagePath);
          await deleteObject(fileRef);
        } catch (error) {
          console.log('File already deleted or not found');
        }
      }
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      throw error;
    }
  }

  /**
   * Upload advertisement media
   */
  static async uploadMedia(
    kioskId: string,
    file: File,
    type: 'image' | 'video'
  ): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${kioskId}/${type}s/${timestamp}_${file.name}`;
      const storageRef = ref(storage, `advertisements/${fileName}`);
      logger.event('AdvertisementService', 'uploadMedia:start', { kioskId, type, fileName, size: file.size });
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      logger.event('AdvertisementService', 'uploadMedia:success', { url: downloadURL });
      return downloadURL;
    } catch (error) {
      logger.error('AdvertisementService', 'uploadMedia:error', error);
      throw error;
    }
  }

  /**
   * Increment display count
   * NOTE: Disabled for anonymous kiosk users due to Firestore permission restrictions.
   * This is analytics-only and not critical for functionality.
   * To enable: Update Firestore rules to allow anonymous users to update displayCount field only.
   */
  static async incrementDisplayCount(
    kioskId: string,
    adId: string
  ): Promise<void> {
    // Disabled - requires admin authentication or updated Firestore rules
    // Uncomment below if you configure Firestore rules to allow anonymous displayCount updates
    /*
    try {
      const kioskRef = doc(db, 'kiosks', kioskId);
      const kioskDoc = await getDoc(kioskRef);
      
      if (!kioskDoc.exists()) return;

      const data = kioskDoc.data();
      const ads = data.advertisements || [];
      const updatedAds = ads.map((ad: Advertisement) => {
        if (ad.id === adId) {
          return { ...ad, displayCount: (ad.displayCount || 0) + 1 };
        }
        return ad;
      });

      await updateDoc(kioskRef, {
        advertisements: updatedAds,
      });
    } catch (error: any) {
      // Silently fail - this is analytics only
      if (error?.code !== 'permission-denied') {
        logger.error('AdvertisementService', 'incrementDisplayCount:error', error);
      }
    }
    */
  }

  /**
   * Track advertisement click
   * NOTE: Disabled for anonymous kiosk users due to Firestore permission restrictions.
   * This is analytics-only and not critical for functionality.
   */
  static async trackAdClick(kioskId: string, adId: string): Promise<void> {
    // Disabled - requires admin authentication or updated Firestore rules
    // Uncomment below if you configure Firestore rules to allow anonymous tracking
    /*
    try {
      logger.event('AdvertisementService', 'trackAdClick', { kioskId, adId });
      await this.incrementDisplayCount(kioskId, adId);
    } catch (error) {
      // Silently fail - analytics only
    }
    */
  }
}

