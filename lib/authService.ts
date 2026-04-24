import { auth } from './firebase';
import { 
  signInAnonymously, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { logger } from './utils';

export type AuthLevel = 'anonymous' | 'admin' | 'none';

export class AuthService {
  /**
   * Sign in anonymously for kiosk operations
   * This allows read/write access based on Firebase rules
   */
  static async signInAnonymous(): Promise<User | null> {
    try {
      logger.event('AuthService', 'anonymous:signin:start');
      const result = await signInAnonymously(auth);
      logger.event('AuthService', 'anonymous:signin:success', { uid: result.user.uid });
      return result.user;
    } catch (error) {
      logger.error('AuthService', 'anonymous:signin:error', error);
      return null;
    }
  }

  /**
   * Sign in as admin with email/password
   */
  static async signInAdmin(email: string, password: string): Promise<User | null> {
    try {
      logger.event('AuthService', 'admin:signin:start', { email });
      const result = await signInWithEmailAndPassword(auth, email, password);
      logger.event('AuthService', 'admin:signin:success', { uid: result.user.uid });
      return result.user;
    } catch (error) {
      logger.error('AuthService', 'admin:signin:error', error);
      throw error;
    }
  }

  /**
   * Sign out (works for both anonymous and admin)
   */
  static async signOut(): Promise<void> {
    try {
      logger.event('AuthService', 'signout');
      await firebaseSignOut(auth);
    } catch (error) {
      logger.error('AuthService', 'signout:error', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  static getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Check if user is anonymous
   */
  static isAnonymous(): boolean {
    return auth.currentUser?.isAnonymous || false;
  }

  /**
   * Check if user is authenticated (admin)
   */
  static isAdmin(): boolean {
    const user = auth.currentUser;
    return user !== null && !user.isAnonymous;
  }

  /**
   * Get current auth level
   */
  static getAuthLevel(): AuthLevel {
    const user = auth.currentUser;
    if (!user) return 'none';
    if (user.isAnonymous) return 'anonymous';
    return 'admin';
  }

  /**
   * Subscribe to auth state changes
   */
  static onAuthChange(callback: (user: User | null, level: AuthLevel) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      let level: AuthLevel = 'none';
      if (user) {
        level = user.isAnonymous ? 'anonymous' : 'admin';
      }
      logger.event('AuthService', 'auth:state:change', { level, uid: user?.uid });
      callback(user, level);
    });
  }

  /**
   * Ensure anonymous auth for kiosk operations
   * Call this on app initialization
   */
  static async ensureKioskAuth(): Promise<void> {
  if (auth.currentUser) {
    return;
  }

  await signInAnonymously(auth);

  // ✅ WAIT until Firebase confirms user
  await new Promise<void>((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve();
        }
      },
      (error) => {
        unsubscribe();
        reject(error);
      }
    );
  });
}
}
