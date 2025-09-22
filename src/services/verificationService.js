import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { MIN_FOLLOWERS_FOR_VERIFICATION, MIN_POSTS_FOR_VERIFICATION } from '../config/verification';

class VerificationService {
  /**
   * Get user's posts count
   * @param {string} userId - ID of the user
   * @returns {Promise<number>} - Number of posts
   */
  async getUserPostsCount(userId) {
    try {
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(postsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting user posts count:', error);
      return 0;
    }
  }

  /**
   * Check if a user should be verified based on follower count AND posts count
   * @param {string} userId - ID of the user to check
   * @returns {Promise<boolean>} - True if user should be verified
   */
  async shouldBeVerified(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const followerCount = (userData.followers || []).length;
        
        // Check followers requirement
        if (followerCount <= MIN_FOLLOWERS_FOR_VERIFICATION) {
          return false;
        }
        
        // Check posts requirement
        const postsCount = await this.getUserPostsCount(userId);
        return postsCount > MIN_POSTS_FOR_VERIFICATION;
      }
      return false;
    } catch (error) {
      console.error('Error checking verification eligibility:', error);
      return false;
    }
  }

  /**
   * Update user's verification status
   * @param {string} userId - ID of the user to verify/unverify
   * @param {boolean} isVerified - New verification status
   * @returns {Promise<{success: boolean}>}
   */
  async updateVerificationStatus(userId, isVerified) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        isVerified: isVerified
      });
      return { success: true };
    } catch (error) {
      console.error('Error updating verification status:', error);
      throw error;
    }
  }

  /**
   * Check and auto-verify user if they meet the criteria
   * @param {string} userId - ID of the user to check
   * @returns {Promise<{verified: boolean, alreadyVerified: boolean}>}
   */
  async checkAndAutoVerify(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const followerCount = (userData.followers || []).length;
      const currentlyVerified = userData.isVerified || false;

      // If already verified, don't change status even if followers/posts drop
      if (currentlyVerified) {
        return { verified: true, alreadyVerified: true };
      }

      // Check followers requirement first
      if (followerCount <= MIN_FOLLOWERS_FOR_VERIFICATION) {
        return { verified: false, alreadyVerified: false };
      }

      // Check posts requirement
      const postsCount = await this.getUserPostsCount(userId);
      if (postsCount > MIN_POSTS_FOR_VERIFICATION) {
        await this.updateVerificationStatus(userId, true);
        return { verified: true, alreadyVerified: false };
      }

      return { verified: false, alreadyVerified: false };
    } catch (error) {
      console.error('Error in auto-verification check:', error);
      throw error;
    }
  }

  /**
   * Get verification status for a user
   * @param {string} userId - ID of the user
   * @returns {Promise<boolean>} - Verification status
   */
  async getVerificationStatus(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.isVerified || false;
      }
      return false;
    } catch (error) {
      console.error('Error getting verification status:', error);
      return false;
    }
  }

  /**
   * Get user's verification eligibility details
   * @param {string} userId - ID of the user
   * @returns {Promise<{isVerified: boolean, followers: number, posts: number, meetsRequirements: boolean}>}
   */
  async getVerificationDetails(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (!userDoc.exists()) {
        return {
          isVerified: false,
          followers: 0,
          posts: 0,
          meetsRequirements: false
        };
      }

      const userData = userDoc.data();
      const followerCount = (userData.followers || []).length;
      const postsCount = await this.getUserPostsCount(userId);
      const meetsRequirements = followerCount > MIN_FOLLOWERS_FOR_VERIFICATION && 
                               postsCount > MIN_POSTS_FOR_VERIFICATION;

      return {
        isVerified: userData.isVerified || false,
        followers: followerCount,
        posts: postsCount,
        meetsRequirements
      };
    } catch (error) {
      console.error('Error getting verification details:', error);
      return {
        isVerified: false,
        followers: 0,
        posts: 0,
        meetsRequirements: false
      };
    }
  }

  /**
   * Admin function to manually verify/unverify a user
   * @param {string} adminId - ID of the admin performing the action
   * @param {string} targetUserId - ID of the user to verify/unverify
   * @param {boolean} verify - True to verify, false to unverify
   * @returns {Promise<{success: boolean}>}
   */
  async adminVerifyUser(adminId, targetUserId, verify) {
    try {
      // In a real app, you would check if adminId has admin privileges
      // For now, we'll just update the verification status
      
      await this.updateVerificationStatus(targetUserId, verify);
      
      // Log the admin action (optional)
      console.log(`Admin ${adminId} ${verify ? 'verified' : 'unverified'} user ${targetUserId}`);
      
      return { success: true };
    } catch (error) {
      console.error('Error in admin verification:', error);
      throw error;
    }
  }
}

// Export singleton instance
const verificationService = new VerificationService();
export default verificationService;