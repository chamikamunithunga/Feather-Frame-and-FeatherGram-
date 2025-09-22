import { doc, updateDoc, increment, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Update user's post count
 * @param {string} userId - The user ID
 * @param {number} value - The increment value (1 for add, -1 for delete)
 */
export const updatePostCount = async (userId, value = 1) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      postsCount: increment(value)
    });
  } catch (error) {
    console.error('Error updating post count:', error);
  }
};

/**
 * Update follower and following counts when follow/unfollow occurs
 * @param {string} followerId - The user who is following
 * @param {string} followingId - The user being followed
 * @param {boolean} isFollowing - true for follow, false for unfollow
 */
export const updateFollowCounts = async (followerId, followingId, isFollowing) => {
  try {
    const incrementValue = isFollowing ? 1 : -1;
    
    // Update follower's following count
    const followerRef = doc(db, 'users', followerId);
    await updateDoc(followerRef, {
      followingCount: increment(incrementValue)
    });
    
    // Update following user's followers count
    const followingRef = doc(db, 'users', followingId);
    await updateDoc(followingRef, {
      followersCount: increment(incrementValue)
    });
  } catch (error) {
    console.error('Error updating follow counts:', error);
  }
};

/**
 * Get current counts for a user
 * @param {string} userId - The user ID
 * @returns {Object} User counts
 */
export const getUserCounts = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        postsCount: data.postsCount || 0,
        followersCount: data.followersCount || 0,
        followingCount: data.followingCount || 0
      };
    }
    
    return {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0
    };
  } catch (error) {
    console.error('Error getting user counts:', error);
    return {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0
    };
  }
};

/**
 * Initialize user counts if they don't exist
 * @param {string} userId - The user ID
 */
export const initializeUserCounts = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      const updates = {};
      
      // Initialize counts if they don't exist
      if (data.postsCount === undefined) updates.postsCount = 0;
      if (data.followersCount === undefined) updates.followersCount = 0;
      if (data.followingCount === undefined) updates.followingCount = 0;
      
      if (Object.keys(updates).length > 0) {
        await updateDoc(userRef, updates);
      }
    }
  } catch (error) {
    console.error('Error initializing user counts:', error);
  }
};