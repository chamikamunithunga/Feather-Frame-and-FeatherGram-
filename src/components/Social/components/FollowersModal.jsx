import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaUserPlus, FaUserCheck, FaTimes } from 'react-icons/fa';
import { MdLocationOn } from 'react-icons/md';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import followService from '../../../services/followService';
import './FollowersModal.css';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2358f193'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const FollowersModal = ({ isOpen, onClose, targetUser, initialTab = 'followers' }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followStates, setFollowStates] = useState({});

  useEffect(() => {
    if (isOpen && targetUser) {
      fetchUsers();
    }
  }, [isOpen, targetUser, activeTab]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the list of user IDs (followers or following)
      const userIds = activeTab === 'followers' 
        ? targetUser.followers || []
        : targetUser.following || [];

      if (userIds.length === 0) {
        setUsers([]);
        setIsLoading(false);
        return;
      }

      // Fetch user details for the IDs
      const usersRef = collection(db, 'users');
      const fetchUsersInBatches = async (ids) => {
        const batchSize = 10;
        const batches = [];
        
        for (let i = 0; i < ids.length; i += batchSize) {
          const batch = ids.slice(i, i + batchSize);
          const batchQuery = query(usersRef, where(documentId(), 'in', batch));
          batches.push(getDocs(batchQuery));
        }

        const results = await Promise.all(batches);
        const allUsers = [];
        
        results.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
          });
        });

        return allUsers;
      };

      const fetchedUsers = await fetchUsersInBatches(userIds);
      setUsers(fetchedUsers);

      // If current user is logged in, get their follow status for each user
      if (currentUser) {
        const followStatusPromises = fetchedUsers.map(async (user) => {
          if (user.uid === currentUser.uid) return { [user.uid]: false };
          const isFollowing = await followService.getFollowStatus(currentUser.uid, user.uid);
          return { [user.uid]: isFollowing };
        });

        const followStatusResults = await Promise.all(followStatusPromises);
        const followStatusMap = followStatusResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
        setFollowStates(followStatusMap);
      }

    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async (targetUserId, currentlyFollowing) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const result = await followService.updateFollowStatus(
        currentUser.uid,
        targetUserId,
        currentlyFollowing
      );

      if (result.success) {
        setFollowStates(prev => ({
          ...prev,
          [targetUserId]: result.newStatus
        }));

        const targetUserObj = users.find(u => u.uid === targetUserId);
        if (result.newStatus) {
          showSuccess(`You are now following @${targetUserObj?.username}!`);
        } else {
          showInfo(`You unfollowed @${targetUserObj?.username}`);
        }
      }
    } catch (err) {
      console.error('Error updating follow status:', err);
      showError(err.message || 'Failed to update follow status');
    }
  };

  const handleUserClick = (clickedUsername) => {
    onClose();
    navigate(`/profile/${clickedUsername}`);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const followersCount = targetUser?.followers?.length || 0;
  const followingCount = targetUser?.following?.length || 0;

  return (
    <div className="followers-modal-overlay" onClick={handleOverlayClick}>
      <div className="followers-modal-content">
        <div className="followers-modal-header">
          <div className="followers-modal-tabs">
            <button 
              className={`followers-tab ${activeTab === 'followers' ? 'active' : ''}`}
              onClick={() => setActiveTab('followers')}
            >
              Followers ({followersCount})
            </button>
            <button 
              className={`followers-tab ${activeTab === 'following' ? 'active' : ''}`}
              onClick={() => setActiveTab('following')}
            >
              Following ({followingCount})
            </button>
          </div>
          <button className="followers-modal-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="followers-modal-body">
          {isLoading ? (
            <div className="followers-modal-loading">
              <div className="loading-spinner"></div>
              <p>Loading...</p>
            </div>
          ) : error ? (
            <div className="followers-modal-error">
              <p>{error}</p>
            </div>
          ) : users.length === 0 ? (
            <div className="followers-modal-empty">
              <p>
                {activeTab === 'followers' 
                  ? `@${targetUser.username} doesn't have any followers yet.`
                  : `@${targetUser.username} isn't following anyone yet.`
                }
              </p>
            </div>
          ) : (
            <div className="followers-list">
              {users.map(user => (
                <div key={user.uid} className="follower-card">
                  <div className="follower-info" onClick={() => handleUserClick(user.username)}>
                    <img 
                      src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                      alt={user.displayName}
                      className="follower-avatar"
                    />
                    <div className="follower-details">
                      <h3 className="follower-name">
                        {user.displayName}
                        {user.isVerified && (
                          <FaCheckCircle className="verified-badge" />
                        )}
                      </h3>
                      <p className="follower-username">@{user.username}</p>
                      {user.bio && (
                        <p className="follower-bio">{user.bio}</p>
                      )}
                      {user.location && (
                        <p className="follower-location">
                          <MdLocationOn />
                          {user.location}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {currentUser && currentUser.uid !== user.uid && (
                    <button 
                      className={`follow-btn ${followStates[user.uid] ? 'following' : ''}`}
                      onClick={() => handleFollow(user.uid, followStates[user.uid])}
                    >
                      {followStates[user.uid] ? (
                        <>
                          <FaUserCheck />
                          Following
                        </>
                      ) : (
                        <>
                          <FaUserPlus />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersModal; 