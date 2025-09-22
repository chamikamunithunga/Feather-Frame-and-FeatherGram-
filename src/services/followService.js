import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../config/firebase';
import notificationService from './notificationService';
import verificationService from './verificationService';

class FollowService {
  /**
   * Follow or unfollow a user
   * @param {string} currentUserId - ID of the user performing the action
   * @param {string} targetUserId - ID of the user being followed/unfollowed
   * @param {boolean} isFollowing - Current follow status (true if currently following)
   * @returns {Promise<{success: boolean, newStatus: boolean, followerCount: number}>}
   */
  async updateFollowStatus(currentUserId, targetUserId, isFollowing) {
    if (currentUserId === targetUserId) {
      throw new Error("You cannot follow yourself");
    }

    try {
      // Use a transaction to ensure data consistency
      const result = await runTransaction(db, async (transaction) => {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        // Get current user and target user documents
        const currentUserDoc = await transaction.get(currentUserRef);
        const targetUserDoc = await transaction.get(targetUserRef);

        if (!currentUserDoc.exists() || !targetUserDoc.exists()) {
          throw new Error("User not found");
        }

        const currentUserData = currentUserDoc.data();
        const targetUserData = targetUserDoc.data();

        // Get current arrays (initialize if they don't exist)
        const currentUserFollowing = currentUserData.following || [];
        const targetUserFollowers = targetUserData.followers || [];

        let newFollowerCount;

        if (isFollowing) {
          // Currently following, so unfollow
          transaction.update(currentUserRef, {
            following: arrayRemove(targetUserId)
          });
          transaction.update(targetUserRef, {
            followers: arrayRemove(currentUserId)
          });
          newFollowerCount = Math.max(0, targetUserFollowers.length - 1);
        } else {
          // Currently not following, so follow
          transaction.update(currentUserRef, {
            following: arrayUnion(targetUserId)
          });
          transaction.update(targetUserRef, {
            followers: arrayUnion(currentUserId)
          });
          newFollowerCount = targetUserFollowers.length + 1;
        }

        return {
          success: true,
          newStatus: !isFollowing,
          followerCount: newFollowerCount,
          currentUserData,
          targetUserData
        };
      });

      // Create notification if user started following (not unfollowing)
      if (result.success && result.newStatus) {
        try {
          await notificationService.createFollowNotification(
            currentUserId,
            targetUserId,
            result.currentUserData
          );
        } catch (notificationError) {
          console.error('Failed to create follow notification:', notificationError);
          // Don't fail the follow operation if notification creation fails
        }
      }

      // Check if target user should be auto-verified after follower count change
      if (result.success) {
        try {
          const verificationResult = await verificationService.checkAndAutoVerify(targetUserId);
          if (verificationResult.verified && !verificationResult.alreadyVerified) {
            console.log(`User ${targetUserId} has been auto-verified with ${result.followerCount} followers`);
          }
        } catch (verificationError) {
          console.error('Failed to check auto-verification:', verificationError);
          // Don't fail the follow operation if verification check fails
        }
      }

      return {
        success: result.success,
        newStatus: result.newStatus,
        followerCount: result.followerCount
      };
    } catch (error) {
      console.error('Error updating follow status:', error);
      throw error;
    }
  }

  /**
   * Get follow status between two users
   * @param {string} currentUserId - ID of the current user
   * @param {string} targetUserId - ID of the target user
   * @returns {Promise<boolean>} - True if current user follows target user
   */
  async getFollowStatus(currentUserId, targetUserId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUserId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const following = userData.following || [];
        return following.includes(targetUserId);
      }
      return false;
    } catch (error) {
      console.error('Error getting follow status:', error);
      return false;
    }
  }

  /**
   * Get user's followers list
   * @param {string} userId - ID of the user
   * @returns {Promise<Array>} - Array of follower user IDs
   */
  async getFollowers(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.followers || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting followers:', error);
      return [];
    }
  }

  /**
   * Get users that a user is following
   * @param {string} userId - ID of the user
   * @returns {Promise<Array>} - Array of following user IDs
   */
  async getFollowing(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.following || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting following:', error);
      return [];
    }
  }

  /**
   * Get follow statistics for a user
   * @param {string} userId - ID of the user
   * @returns {Promise<{followers: number, following: number}>}
   */
  async getFollowStats(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          followers: (userData.followers || []).length,
          following: (userData.following || []).length
        };
      }
      return { followers: 0, following: 0 };
    } catch (error) {
      console.error('Error getting follow stats:', error);
      return { followers: 0, following: 0 };
    }
  }
}

// Export singleton instance
const followService = new FollowService();
export default followService; 