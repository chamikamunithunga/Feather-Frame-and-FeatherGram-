import { 
  collection, 
  addDoc, 
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../config/firebase';

const POSTS_PER_PAGE = 10;

export const postService = {
  // Create a new post
  createPost: async (postData) => {
    try {
      // Ensure metrics are properly initialized
      const postWithMetrics = {
        ...postData,
        metrics: {
          likes: 0,
          shares: 0,
          saves: 0,
          ...(postData.metrics || {})
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'posts'), postWithMetrics);
      
      // TODO: In production, you should also increment the user's postsCount field
      // await updateDoc(doc(db, 'users', postData.userId), {
      //   postsCount: increment(1)
      // });
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  // Get a single post by ID
  getPost: async (postId) => {
    try {
      const docRef = doc(db, 'posts', postId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  },

  // Get posts with pagination
  getPosts: async (lastPost = null, filters = {}) => {
    try {
      let q = collection(db, 'posts');
      
      // Build query based on filters
      const conditions = [];
      
      if (filters.userId) {
        conditions.push(where('userId', '==', filters.userId));
      }
      
      if (filters.hashtag) {
        conditions.push(where('hashtags', 'array-contains', filters.hashtag));
      }

      // Always order by creation date
      conditions.push(orderBy('createdAt', 'desc'));
      
      // Add pagination
      conditions.push(limit(POSTS_PER_PAGE));
      
      if (lastPost) {
        conditions.push(startAfter(lastPost));
      }

      q = query(q, ...conditions);
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting posts:', error);
      throw error;
    }
  },

  // Update a post
  updatePost: async (postId, updateData) => {
    try {
      const docRef = doc(db, 'posts', postId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
        isEdited: true
      });
      return true;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  // Delete a post
  deletePost: async (postId) => {
    try {
      // TODO: In production, you should also decrement the user's postsCount field
      // const postDoc = await getDoc(doc(db, 'posts', postId));
      // if (postDoc.exists()) {
      //   const userId = postDoc.data().userId;
      //   await updateDoc(doc(db, 'users', userId), {
      //     postsCount: increment(-1)
      //   });
      // }
      
      await deleteDoc(doc(db, 'posts', postId));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  // Like a post
  likePost: async (postId, userId) => {
    try {
      if (!userId || userId === 'anonymous') {
        throw new Error('Authentication required to like posts');
      }

      // Check if user has already liked the post
      const q = query(
        collection(db, 'postLikes'),
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Post already liked');
      }

      const likeData = {
        postId,
        userId,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'postLikes'), likeData);

      // Update post metrics
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'metrics.likes': increment(1)
      });

      return true;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  // Unlike a post
  unlikePost: async (postId, userId) => {
    try {
      if (!userId || userId === 'anonymous') {
        throw new Error('Authentication required to unlike posts');
      }

      // Find and delete the like document
      const q = query(
        collection(db, 'postLikes'),
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Post not liked');
      }

      await deleteDoc(doc(db, 'postLikes', querySnapshot.docs[0].id));
      
      // Update post metrics
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'metrics.likes': increment(-1)
      });

      return true;
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  // Save a post
  savePost: async (postId, userId) => {
    try {
      if (!userId || userId === 'anonymous') {
        throw new Error('Authentication required to save posts');
      }

      // Check if user has already saved the post
      const q = query(
        collection(db, 'postSaves'),
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw new Error('Post already saved');
      }

      const saveData = {
        postId,
        userId,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'postSaves'), saveData);

      // Update post metrics
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'metrics.saves': increment(1)
      });

      return true;
    } catch (error) {
      console.error('Error saving post:', error);
      throw error;
    }
  },

  // Unsave a post
  unsavePost: async (postId, userId) => {
    try {
      if (!userId || userId === 'anonymous') {
        throw new Error('Authentication required to unsave posts');
      }

      const q = query(
        collection(db, 'postSaves'),
        where('postId', '==', postId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Post not saved');
      }

      await deleteDoc(doc(db, 'postSaves', querySnapshot.docs[0].id));
      
      // Update post metrics
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'metrics.saves': increment(-1)
      });

      return true;
    } catch (error) {
      console.error('Error unsaving post:', error);
      throw error;
    }
  },

  // Share a post
  sharePost: async (postId, userId, shareType = 'repost') => {
    try {
      await addDoc(collection(db, 'postShares'), {
        postId,
        userId,
        shareType,
        createdAt: serverTimestamp()
      });

      // Update post metrics
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        'metrics.shares': increment(1)
      });

      return true;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  }
};

export default postService; 