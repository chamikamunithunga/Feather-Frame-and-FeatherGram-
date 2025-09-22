import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  where 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SHOPS_COLLECTION = 'shops';

export const shopService = {
  // Get all shops for marketplace
  async getAllShops() {
    try {
      const q = query(collection(db, SHOPS_COLLECTION), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching shops:', error);
      throw error;
    }
  },

  // Get only featured shops
  async getFeaturedShops() {
    try {
      const q = query(
        collection(db, SHOPS_COLLECTION), 
        where('featured', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching featured shops:', error);
      throw error;
    }
  },

  // Get shops by category
  async getShopsByCategory(category) {
    try {
      const q = query(
        collection(db, SHOPS_COLLECTION), 
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching shops by category:', error);
      throw error;
    }
  }
}; 