import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const getUserNameFromUserId = async (userId: string): Promise<string> => {
  try {
    if (!userId) return 'User';

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return 'User';
    }

    const userData = userSnap.data();

    return userData.name || userData.username || userData.displayName || 'User';
  } catch (error) {
    console.error('Error fetching user name:', error);
    return 'User';
  }
};