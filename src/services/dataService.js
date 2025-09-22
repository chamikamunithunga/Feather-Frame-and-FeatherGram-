import { 
  collection, 
  getDocs,
  getCountFromServer
} from 'firebase/firestore';
import { db } from '../config/firebase';

class DataService {
  async getCounts() {
    try {
      // Get counts for each collection
      const [usersCount, communitiesCount, shopsCount, postsCount] = await Promise.all([
        this.getCollectionCount('users'),
        this.getCollectionCount('communities'),
        this.getCollectionCount('shops'),
        this.getCollectionCount('posts')
      ]);

      return {
        users: usersCount,
        communities: communitiesCount,
        shops: shopsCount,
        posts: postsCount
      };
    } catch (error) {
      console.error('Error fetching counts:', error);
      throw error;
    }
  }

  async getCollectionCount(collectionName) {
    try {
      // Using getCountFromServer for better performance on large collections
      const coll = collection(db, collectionName);
      const snapshot = await getCountFromServer(coll);
      return snapshot.data().count;
    } catch (error) {
      console.error(`Error counting ${collectionName}:`, error);
      // Fallback to getDocs if getCountFromServer fails
      try {
        const snapshot = await getDocs(collection(db, collectionName));
        return snapshot.size;
      } catch (fallbackError) {
        console.error(`Fallback error for ${collectionName}:`, fallbackError);
        return 0;
      }
    }
  }

  // Format number for display (e.g., 1000 -> 1K)
  formatCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }
}

const dataService = new DataService();
export default dataService;