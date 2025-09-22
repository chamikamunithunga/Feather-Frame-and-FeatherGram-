import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Migration script to update existing users with count fields
 * This should be run once to initialize counts for existing users
 */
export const migrateUserCounts = async () => {
  try {
    console.log('Starting user counts migration...');
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    console.log(`Found ${users.length} users to migrate`);
    
    // Process each user
    for (const user of users) {
      try {
        // Count posts for this user
        const postsQuery = query(
          collection(db, 'posts'), 
          where('userId', '==', user.uid)
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsCount = postsSnapshot.size;
        
        // Count followers (users who have this user in their following array)
        const followersQuery = query(
          collection(db, 'follows'),
          where('followingId', '==', user.uid)
        );
        const followersSnapshot = await getDocs(followersQuery);
        const followersCount = followersSnapshot.size;
        
        // Count following (users this user is following)
        const followingQuery = query(
          collection(db, 'follows'),
          where('followerId', '==', user.uid)
        );
        const followingSnapshot = await getDocs(followingQuery);
        const followingCount = followingSnapshot.size;
        
        // Update user document with counts
        const updates = {};
        
        if (user.postsCount === undefined) {
          updates.postsCount = postsCount;
        }
        
        if (user.followersCount === undefined) {
          updates.followersCount = followersCount;
        }
        
        if (user.followingCount === undefined) {
          updates.followingCount = followingCount;
        }
        
        // Only update if there are fields to update
        if (Object.keys(updates).length > 0) {
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, updates);
          console.log(`Updated user ${user.username || user.uid} with counts:`, updates);
        } else {
          console.log(`User ${user.username || user.uid} already has all counts`);
        }
        
      } catch (error) {
        console.error(`Error updating user ${user.username || user.uid}:`, error);
      }
    }
    
    console.log('User counts migration completed!');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  }
};

// Run migration (can be called from console or a button in settings)
// migrateUserCounts();