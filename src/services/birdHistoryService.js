import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class BirdHistoryService {
  // Save bird to user's history
  async saveBirdToHistory(userId, birdData, searchType = 'search') {
    try {
      if (!userId || !birdData) {
        throw new Error('User ID and bird data are required');
      }

      // Extract essential bird information
      const birdInfo = {
        birdName: birdData.common_name || birdData.species || 'Unknown Bird',
        scientificName: birdData.scientific_name || '',
        family: birdData.family || '',
        order: birdData.order || '',
        imageUrl: birdData.image_url || birdData.photo_url || birdData.picture || '',
        conservationStatus: birdData.conservation_status || '',
        habitat: birdData.habitat || '',
        distribution: birdData.distribution || '',
        description: birdData.description || '',
        searchType: searchType, // 'image' or 'search'
        timestamp: serverTimestamp(),
        viewedAt: new Date().toISOString(),
        // Store confidence if it's from image detection
        confidence: birdData.confidence || null,
        // Store full bird data for reference
        fullData: birdData
      };

      // Create ID based on bird name only (no timestamp) to prevent duplicates
      const birdId = (birdInfo.birdName || 'unknown').toLowerCase().replace(/\s+/g, '-');
      
      // Check if bird already exists in history
      const historyRef = doc(db, 'users', userId, 'birdHistory', birdId);
      const existingBird = await getDoc(historyRef);
      
      if (existingBird.exists()) {
        // Update existing bird record with new timestamp and search type
        const existingData = existingBird.data();
        const updateData = {
          ...birdInfo,
          // Keep the first viewed date
          firstViewedAt: existingData.firstViewedAt || existingData.viewedAt || birdInfo.viewedAt,
          // Update last viewed date
          lastViewedAt: birdInfo.viewedAt,
          // Update search type if it was originally 'search' but now 'image' (image is more specific)
          searchType: (existingData.searchType === 'search' && searchType === 'image') ? 'image' : existingData.searchType,
          // Increment view count
          viewCount: (existingData.viewCount || 1) + 1
        };
        
        await setDoc(historyRef, updateData);
        
        return {
          success: true,
          birdId: birdId,
          data: updateData,
          updated: true
        };
      } else {
        // Save new bird to history
        birdInfo.firstViewedAt = birdInfo.viewedAt;
        birdInfo.lastViewedAt = birdInfo.viewedAt;
        birdInfo.viewCount = 1;
        
        await setDoc(historyRef, birdInfo);
        
        return {
          success: true,
          birdId: birdId,
          data: birdInfo,
          updated: false
        };
      }
    } catch (error) {
      console.error('Error saving bird to history:', error);
      throw error;
    }
  }

  // Get user's bird history
  async getUserBirdHistory(userId, limitCount = 50) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const historyRef = collection(db, 'users', userId, 'birdHistory');
      const q = query(historyRef, orderBy('timestamp', 'desc'), limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const birds = [];
      
      querySnapshot.forEach((doc) => {
        birds.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return birds;
    } catch (error) {
      console.error('Error fetching bird history:', error);
      throw error;
    }
  }

  // Get a specific bird from history
  async getBirdFromHistory(userId, birdId) {
    try {
      if (!userId || !birdId) {
        throw new Error('User ID and bird ID are required');
      }

      const birdRef = doc(db, 'users', userId, 'birdHistory', birdId);
      const birdDoc = await getDoc(birdRef);

      if (birdDoc.exists()) {
        return {
          id: birdDoc.id,
          ...birdDoc.data()
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching bird from history:', error);
      throw error;
    }
  }

  // Delete a bird from history
  async deleteBirdFromHistory(userId, birdId) {
    try {
      if (!userId || !birdId) {
        throw new Error('User ID and bird ID are required');
      }

      const birdRef = doc(db, 'users', userId, 'birdHistory', birdId);
      await deleteDoc(birdRef);

      return {
        success: true,
        message: 'Bird removed from history'
      };
    } catch (error) {
      console.error('Error deleting bird from history:', error);
      throw error;
    }
  }

  // Clear all bird history for a user
  async clearAllBirdHistory(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const historyRef = collection(db, 'users', userId, 'birdHistory');
      const querySnapshot = await getDocs(historyRef);

      // Delete each document
      const deletePromises = [];
      querySnapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);

      return {
        success: true,
        message: 'All bird history cleared',
        deletedCount: deletePromises.length
      };
    } catch (error) {
      console.error('Error clearing bird history:', error);
      throw error;
    }
  }

  // Check if a bird is already in history
  async isBirdInHistory(userId, birdName) {
    try {
      if (!userId || !birdName) {
        return false;
      }

      const historyRef = collection(db, 'users', userId, 'birdHistory');
      const querySnapshot = await getDocs(historyRef);
      
      let found = false;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.birdName && data.birdName.toLowerCase() === birdName.toLowerCase()) {
          found = true;
        }
      });

      return found;
    } catch (error) {
      console.error('Error checking bird in history:', error);
      return false;
    }
  }

  // Get bird history statistics
  async getBirdHistoryStats(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const historyRef = collection(db, 'users', userId, 'birdHistory');
      const querySnapshot = await getDocs(historyRef);
      
      const stats = {
        totalBirds: 0,
        searchCount: 0,
        imageUploadCount: 0,
        uniqueFamilies: new Set(),
        uniqueOrders: new Set(),
        conservationStatuses: {}
      };

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stats.totalBirds++;
        
        if (data.searchType === 'search') {
          stats.searchCount++;
        } else if (data.searchType === 'image') {
          stats.imageUploadCount++;
        }

        if (data.family) {
          stats.uniqueFamilies.add(data.family);
        }

        if (data.order) {
          stats.uniqueOrders.add(data.order);
        }

        if (data.conservationStatus) {
          stats.conservationStatuses[data.conservationStatus] = 
            (stats.conservationStatuses[data.conservationStatus] || 0) + 1;
        }
      });

      return {
        totalBirds: stats.totalBirds,
        searchCount: stats.searchCount,
        imageUploadCount: stats.imageUploadCount,
        uniqueFamiliesCount: stats.uniqueFamilies.size,
        uniqueOrdersCount: stats.uniqueOrders.size,
        conservationStatuses: stats.conservationStatuses
      };
    } catch (error) {
      console.error('Error fetching bird history stats:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const birdHistoryService = new BirdHistoryService();
export default birdHistoryService;