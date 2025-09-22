import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/UsersList.css';
import { 
  FaSearch, 
  FaUserPlus, 
  FaCheckCircle, 
  FaUsers,
  FaArrowLeft 
} from 'react-icons/fa';
import { MdVerified } from 'react-icons/md';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2358f193'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const UsersList = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    fetchUsers();
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all users except current user
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '!=', user.uid),
        orderBy('uid')
      );
      
      const snapshot = await getDocs(usersQuery);
      const allUsers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get current user's following list
      const currentUserDoc = await getDoc(doc(db, 'users', user.uid));
      if (currentUserDoc.exists()) {
        const currentUserData = currentUserDoc.data();
        const following = currentUserData.following || [];
        setFollowingUsers(following);
      }
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.displayName?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  };

  const handleFollowUser = async (userId) => {
    if (!isAuthenticated || !user) return;

    try {
      const isFollowing = followingUsers.includes(userId);
      const currentUserRef = doc(db, 'users', user.uid);
      const targetUserRef = doc(db, 'users', userId);
      
      if (isFollowing) {
        // Unfollow
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayRemove(user.uid)
        });
        
        setFollowingUsers(followingUsers.filter(id => id !== userId));
        
        // Update local user data
        setUsers(users.map(u => 
          u.uid === userId 
            ? { ...u, followers: u.followers?.filter(id => id !== user.uid) || [] }
            : u
        ));
        setFilteredUsers(filteredUsers.map(u => 
          u.uid === userId 
            ? { ...u, followers: u.followers?.filter(id => id !== user.uid) || [] }
            : u
        ));
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        
        setFollowingUsers([...followingUsers, userId]);
        
        // Update local user data
        setUsers(users.map(u => 
          u.uid === userId 
            ? { ...u, followers: [...(u.followers || []), user.uid] }
            : u
        ));
        setFilteredUsers(filteredUsers.map(u => 
          u.uid === userId 
            ? { ...u, followers: [...(u.followers || []), user.uid] }
            : u
        ));
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  return (
    <div className="users-list-container">
      <div className="users-list-header">
        <div className="header-top">
          <button 
            className="back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
          </button>
          <h1>Discover People</h1>
        </div>
        
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name, username, or bio..."
            value={searchQuery}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        <div className="users-stats">
          <p>{filteredUsers.length} users found</p>
        </div>
      </div>

      <div className="users-grid">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>{error}</p>
            <button onClick={fetchUsers} className="retry-button">
              Try Again
            </button>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map(userProfile => (
            <div key={userProfile.uid} className="user-card">
              <div className="user-card-header">
                <img 
                  src={userProfile.profileImageUrl || DEFAULT_PROFILE_IMAGE}
                  alt={userProfile.displayName}
                  className="user-avatar"
                  onClick={() => navigate(`/social/profile/${userProfile.username || userProfile.uid}`)}
                />
                {userProfile.isVerified && (
                  <MdVerified className="verified-badge" />
                )}
              </div>

              <div className="user-card-body">
                <h3 
                  className="user-name"
                  onClick={() => navigate(`/social/profile/${userProfile.username || userProfile.uid}`)}
                >
                  {userProfile.displayName || 'Anonymous User'}
                </h3>
                <p className="user-username">@{userProfile.username || 'anonymous'}</p>
                <p className="user-bio">{userProfile.bio || 'No bio available'}</p>

                <div className="user-stats">
                  <div className="stat">
                    <span className="stat-value">{userProfile.posts?.length || 0}</span>
                    <span className="stat-label">Posts</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{userProfile.followers?.length || 0}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{userProfile.following?.length || 0}</span>
                    <span className="stat-label">Following</span>
                  </div>
                </div>

                <button 
                  className={`follow-button ${followingUsers.includes(userProfile.uid) ? 'following' : ''}`}
                  onClick={() => handleFollowUser(userProfile.uid)}
                >
                  {followingUsers.includes(userProfile.uid) ? (
                    <>
                      <FaCheckCircle />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <FaUserPlus />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-users">
            <FaUsers className="no-users-icon" />
            <p>No users found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersList;