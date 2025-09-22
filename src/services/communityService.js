import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import verificationService from './verificationService';

class CommunityService {
  constructor() {
    this.communitiesCollection = 'communities';
    this.communityMembersCollection = 'communityMembers';
  }

  // Create a new community
  async createCommunity(communityData, userId) {
    try {
      // Check if user is verified
      const isVerified = await verificationService.getVerificationStatus(userId);
      if (!isVerified) {
        throw new Error('You need more than 10 followers and 10 posts to create communities');
      }
      
      const communityId = doc(collection(db, this.communitiesCollection)).id;
      
      const newCommunity = {
        id: communityId,
        name: communityData.name,
        description: communityData.description,
        fullDescription: communityData.fullDescription || communityData.description,
        category: communityData.category,
        privacy: communityData.privacy || 'Public',
        rules: communityData.rules || [],
        cover: communityData.cover || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
        avatar: communityData.avatar || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=100',
        createdBy: userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        members: [userId],
        memberCount: 1,
        postCount: 0,
        admins: [userId],
        moderators: [],
        pendingMembers: [],
        bannedUsers: []
      };

      await setDoc(doc(db, this.communitiesCollection, communityId), newCommunity);
      
      // Add creator as member in communityMembers collection
      await this.addCommunityMember(communityId, userId, 'owner');
      
      return { success: true, communityId, community: newCommunity };
    } catch (error) {
      console.error('Error creating community:', error);
      throw error;
    }
  }

  // Get all communities
  async getAllCommunities() {
    try {
      const communitiesQuery = query(
        collection(db, this.communitiesCollection),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(communitiesQuery);
      const communities = [];
      
      snapshot.forEach((doc) => {
        communities.push({ id: doc.id, ...doc.data() });
      });
      
      return communities;
    } catch (error) {
      console.error('Error getting communities:', error);
      throw error;
    }
  }

  // Get communities by category
  async getCommunitiesByCategory(category) {
    try {
      const communitiesQuery = query(
        collection(db, this.communitiesCollection),
        where('category', '==', category),
        orderBy('memberCount', 'desc')
      );
      
      const snapshot = await getDocs(communitiesQuery);
      const communities = [];
      
      snapshot.forEach((doc) => {
        communities.push({ id: doc.id, ...doc.data() });
      });
      
      return communities;
    } catch (error) {
      console.error('Error getting communities by category:', error);
      throw error;
    }
  }

  // Get communities user is member of
  async getUserCommunities(userId) {
    try {
      const communitiesQuery = query(
        collection(db, this.communitiesCollection),
        where('members', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const snapshot = await getDocs(communitiesQuery);
      const communities = [];
      
      snapshot.forEach((doc) => {
        communities.push({ id: doc.id, ...doc.data() });
      });
      
      return communities;
    } catch (error) {
      console.error('Error getting user communities:', error);
      throw error;
    }
  }

  // Get communities user owns
  async getUserOwnedCommunities(userId) {
    try {
      const communitiesQuery = query(
        collection(db, this.communitiesCollection),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(communitiesQuery);
      const communities = [];
      
      snapshot.forEach((doc) => {
        communities.push({ id: doc.id, ...doc.data() });
      });
      
      return communities;
    } catch (error) {
      console.error('Error getting user owned communities:', error);
      throw error;
    }
  }

  // Get single community by ID
  async getCommunityById(communityId) {
    try {
      const communityDoc = await getDoc(doc(db, this.communitiesCollection, communityId));
      
      if (!communityDoc.exists()) {
        throw new Error('Community not found');
      }
      
      return { id: communityDoc.id, ...communityDoc.data() };
    } catch (error) {
      console.error('Error getting community:', error);
      throw error;
    }
  }

  // Update community
  async updateCommunity(communityId, updates) {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      
      await updateDoc(communityRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating community:', error);
      throw error;
    }
  }

  // Join community
  async joinCommunity(communityId, userId) {
    try {
      // Check if user is verified
      const isVerified = await verificationService.getVerificationStatus(userId);
      if (!isVerified) {
        throw new Error('You need more than 10 followers and 10 posts to join communities');
      }
      
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (!communityDoc.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communityDoc.data();
      
      // Check if user is already a member
      if (communityData.members && communityData.members.includes(userId)) {
        return { success: false, message: 'Already a member' };
      }
      
      // Check if user is banned
      if (communityData.bannedUsers && communityData.bannedUsers.includes(userId)) {
        throw new Error('You are banned from this community');
      }
      
      // Handle private communities
      if (communityData.privacy === 'Private') {
        // Add to pending members for approval
        await updateDoc(communityRef, {
          pendingMembers: arrayUnion(userId),
          updatedAt: serverTimestamp()
        });
        
        return { success: true, pending: true };
      } else {
        // Public community - add directly
        await updateDoc(communityRef, {
          members: arrayUnion(userId),
          memberCount: (communityData.memberCount || 0) + 1,
          updatedAt: serverTimestamp()
        });
        
        // Add member record
        await this.addCommunityMember(communityId, userId, 'member');
        
        return { success: true, pending: false };
      }
    } catch (error) {
      console.error('Error joining community:', error);
      throw error;
    }
  }

  // Leave community
  async leaveCommunity(communityId, userId) {
    try {
      const communityRef = doc(db, this.communitiesCollection, communityId);
      const communityDoc = await getDoc(communityRef);
      
      if (!communityDoc.exists()) {
        throw new Error('Community not found');
      }
      
      const communityData = communityDoc.data();
      
      // Can't leave if you're the owner
      if (communityData.createdBy === userId) {
        throw new Error('Community owner cannot leave the community');
      }
      
      await updateDoc(communityRef, {
        members: arrayRemove(userId),
        memberCount: Math.max(0, (communityData.memberCount || 0) - 1),
        admins: arrayRemove(userId),
        moderators: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      
      // Remove member record
      await this.removeCommunityMember(communityId, userId);
      
      return { success: true };
    } catch (error) {
      console.error('Error leaving community:', error);
      throw error;
    }
  }

  // Add community member record
  async addCommunityMember(communityId, userId, role = 'member') {
    try {
      const memberDoc = {
        communityId,
        userId,
        role,
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp()
      };
      
      await setDoc(
        doc(db, this.communityMembersCollection, `${communityId}_${userId}`),
        memberDoc
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error adding community member:', error);
      throw error;
    }
  }

  // Remove community member record
  async removeCommunityMember(communityId, userId) {
    try {
      await deleteDoc(
        doc(db, this.communityMembersCollection, `${communityId}_${userId}`)
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error removing community member:', error);
      throw error;
    }
  }

  // Check if user is member of community
  async isUserMember(communityId, userId) {
    try {
      const communityDoc = await getDoc(doc(db, this.communitiesCollection, communityId));
      
      if (!communityDoc.exists()) {
        return false;
      }
      
      const communityData = communityDoc.data();
      return communityData.members && communityData.members.includes(userId);
    } catch (error) {
      console.error('Error checking membership:', error);
      return false;
    }
  }

  // Get community member role
  async getUserRole(communityId, userId) {
    try {
      const communityDoc = await getDoc(doc(db, this.communitiesCollection, communityId));
      
      if (!communityDoc.exists()) {
        return null;
      }
      
      const communityData = communityDoc.data();
      
      if (communityData.createdBy === userId) {
        return 'owner';
      } else if (communityData.admins && communityData.admins.includes(userId)) {
        return 'admin';
      } else if (communityData.moderators && communityData.moderators.includes(userId)) {
        return 'moderator';
      } else if (communityData.members && communityData.members.includes(userId)) {
        return 'member';
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  // Search communities
  async searchCommunities(searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation that searches by exact name match
      // For better search, consider using Algolia or Elasticsearch
      
      const communities = await this.getAllCommunities();
      
      const filteredCommunities = communities.filter(community => 
        community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        community.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      return filteredCommunities;
    } catch (error) {
      console.error('Error searching communities:', error);
      throw error;
    }
  }

  // Delete community (owner only)
  async deleteCommunity(communityId, userId) {
    try {
      const community = await this.getCommunityById(communityId);
      
      if (community.createdBy !== userId) {
        throw new Error('Only the community owner can delete this community');
      }
      
      // Delete the community
      await deleteDoc(doc(db, this.communitiesCollection, communityId));
      
      // TODO: Also delete all related data (posts, member records, etc.)
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting community:', error);
      throw error;
    }
  }
}

const communityService = new CommunityService();
export default communityService;