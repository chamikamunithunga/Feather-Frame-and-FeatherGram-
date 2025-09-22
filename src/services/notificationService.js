import { collection, addDoc, query, where, orderBy, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

class NotificationService {
  /**
   * Create a follow notification
   * @param {string} fromUserId - ID of user who followed
   * @param {string} toUserId - ID of user being followed
   * @param {object} fromUserData - Data of the user who followed (name, username, etc.)
   * @returns {Promise<string>} - Notification ID
   */
  async createFollowNotification(fromUserId, toUserId, fromUserData) {
    try {
      const notificationData = {
        type: 'follow',
        fromUserId,
        toUserId,
        fromUserData: {
          displayName: fromUserData.displayName,
          username: fromUserData.username,
          profileImageUrl: fromUserData.profileImageUrl
        },
        message: `${fromUserData.displayName} started following you`,
        isRead: false,
        createdAt: new Date()
      };

      const docRef = await addDoc(collection(db, 'notifications'), notificationData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating follow notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID to get notifications for
   * @param {number} limit - Maximum number of notifications to fetch
   * @returns {Promise<Array>} - Array of notifications
   */
  async getNotifications(userId, limit = 50) {
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('toUserId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - ID of notification to mark as read
   * @returns {Promise<boolean>} - Success status
   */
  async markAsRead(notificationId) {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        isRead: true
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async markAllAsRead(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.isRead);

      const updatePromises = unreadNotifications.map(notification =>
        this.markAsRead(notification.id)
      );

      await Promise.all(updatePromises);
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of unread notifications
   */
  async getUnreadCount(userId) {
    try {
      const notifications = await this.getNotifications(userId);
      return notifications.filter(n => !n.isRead).length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - ID of notification to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteNotification(notificationId) {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }
}

// Export singleton instance
const notificationService = new NotificationService();
export default notificationService; 