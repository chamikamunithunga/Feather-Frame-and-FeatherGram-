import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaGlobe, FaUserPlus, FaEnvelope, FaUserCheck, 
  FaHeart, FaRegHeart, FaShare, FaBookmark, FaRegBookmark, FaArrowLeft } from 'react-icons/fa';
import { MdEmail, MdLocationOn, MdVerified } from 'react-icons/md';
import { IoLocationOutline } from 'react-icons/io5';
import { BsThreeDotsVertical, BsGrid, BsList } from 'react-icons/bs';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import '../styles/customprofile.css';
import { AiFillHeart, AiOutlineHeart } from 'react-icons/ai';
import { IoShareSocialOutline } from 'react-icons/io5';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import followService from '../../../services/followService';
import { useToast } from '../../../contexts/ToastContext';
import FollowersModal from '../components/FollowersModal';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2358f193'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

// Helper function to format timestamps
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';

  // Convert Firestore Timestamp to JavaScript Date
  const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
};

const CustomProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showSuccess, showError, showInfo } = useToast();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [userPosts, setUserPosts] = useState([]);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0
  });
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('followers');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', username));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError('User not found');
          setIsLoading(false);
          return;
        }

        const userData = querySnapshot.docs[0].data();
        setProfileUser(userData);

        // Fetch user's posts
        const postsRef = collection(db, 'posts');
        const postsQuery = query(postsRef, where('userId', '==', userData.uid));
        const postsSnapshot = await getDocs(postsQuery);
        
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          user: {
            displayName: userData.displayName,
            username: userData.username,
            profileImageUrl: userData.profileImageUrl || DEFAULT_PROFILE_IMAGE,
            isVerified: userData.isVerified
          }
        }));

        setUserPosts(posts);
        setStats({
          posts: posts.length,
          followers: userData.followers?.length || 0,
          following: userData.following?.length || 0
        });

        if (currentUser) {
          // Check if current user is following this profile using the follow service
          const isCurrentlyFollowing = await followService.getFollowStatus(currentUser.uid, userData.uid);
          setIsFollowing(isCurrentlyFollowing);
        }

      } catch (err) {
        console.error('Error fetching user profile:', err);
        setError('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (username) {
      fetchUserProfile();
    }
  }, [username, currentUser]);

  const handleLike = async (postId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const post = userPosts.find(p => p.id === postId);
    if (!post) return;

    const updatedPosts = userPosts.map(p => {
      if (p.id === postId) {
        const newLikeCount = p.isLiked ? (p.metrics?.likes || 0) - 1 : (p.metrics?.likes || 0) + 1;
        return {
          ...p,
          isLiked: !p.isLiked,
          metrics: {
            ...p.metrics,
            likes: newLikeCount
          }
        };
      }
      return p;
    });
    setUserPosts(updatedPosts);

    try {
      // Update like in Firestore
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentLikes = postDoc.data().metrics?.likes || 0;
        await updateDoc(postRef, {
          'metrics.likes': !post.isLiked ? currentLikes + 1 : currentLikes - 1
        });
      }
    } catch (err) {
      console.error('Error updating like:', err);
      // Revert the optimistic update on error
      setUserPosts(userPosts);
    }
  };

  const handleShare = async (postId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      const post = userPosts.find(p => p.id === postId);
      if (!post) return;

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post!',
          text: post.content.text || 'I found this interesting post',
          url: `${window.location.origin}/post/${postId}`,
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
        // You could show a toast notification here
      }

      // Update share count
      const updatedPosts = userPosts.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            metrics: {
              ...p.metrics,
              shares: (p.metrics?.shares || 0) + 1
            }
          };
        }
        return p;
      });
      setUserPosts(updatedPosts);

      // Update share count in Firestore
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentShares = postDoc.data().metrics?.shares || 0;
        await updateDoc(postRef, {
          'metrics.shares': currentShares + 1
        });
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  const handleSave = async (postId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const post = userPosts.find(p => p.id === postId);
    if (!post) return;

    const updatedPosts = userPosts.map(p => {
      if (p.id === postId) {
        const newSaveCount = p.isSaved ? (p.metrics?.saves || 0) - 1 : (p.metrics?.saves || 0) + 1;
        return {
          ...p,
          isSaved: !p.isSaved,
          metrics: {
            ...p.metrics,
            saves: newSaveCount
          }
        };
      }
      return p;
    });
    setUserPosts(updatedPosts);

    try {
      // Update save in Firestore
      const postRef = doc(db, 'posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const currentSaves = postDoc.data().metrics?.saves || 0;
        await updateDoc(postRef, {
          'metrics.saves': !post.isSaved ? currentSaves + 1 : currentSaves - 1
        });
      }
    } catch (err) {
      console.error('Error updating save:', err);
      // Revert the optimistic update on error
      setUserPosts(userPosts);
    }
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (isFollowLoading) return;

    try {
      setIsFollowLoading(true);
      
      // Call the follow service
      const result = await followService.updateFollowStatus(
        currentUser.uid, 
        profileUser.uid, 
        isFollowing
      );

      if (result.success) {
        setIsFollowing(result.newStatus);
        setStats(prev => ({
          ...prev,
          followers: result.followerCount
        }));
        
        // Show success message
        if (result.newStatus) {
          showSuccess(`You are now following @${profileUser.username}!`);
        } else {
          showInfo(`You unfollowed @${profileUser.username}`);
        }
      }
      
    } catch (err) {
      console.error('Error updating follow status:', err);
      showError(err.message || 'Failed to update follow status. Please try again.');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleMessage = () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    // Navigate to messages with the target user's username
    navigate(`/social/messages/${profileUser.username}`, { 
      state: { 
        targetUser: {
          uid: profileUser.uid,
          username: profileUser.username,
          displayName: profileUser.displayName,
          profileImageUrl: profileUser.profileImageUrl,
          isVerified: profileUser.isVerified
        }
      }
    });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleOpenFollowersModal = (tab) => {
    setModalInitialTab(tab);
    setIsFollowersModalOpen(true);
  };

  const handleCloseFollowersModal = () => {
    setIsFollowersModalOpen(false);
  };

  const PostCard = ({ post }) => {
    if (viewMode === 'grid') {
      return (
        <div className="P-RSbar-post-grid-card">
          <div className="P-RSbar-grid-media">
            {post.content?.media && post.content.media.length > 0 ? (
              <img 
                src={post.content.media[0].url} 
                alt="Post media"
                className="P-RSbar-grid-image"
                style={{
                  aspectRatio: post.content.media[0].aspectRatio || '1',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div className="P-RSbar-grid-no-media">
                <p>{post.content?.text?.slice(0, 100)}{post.content?.text?.length > 100 ? '...' : ''}</p>
              </div>
            )}
            <div className="P-RSbar-grid-overlay">
              <div className="P-RSbar-grid-user-info">
                <img 
                  src={post.user?.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
                  alt={post.user?.displayName}
                  className="P-RSbar-grid-avatar"
                />
                <div className="P-RSbar-grid-user-details">
                  <h3>{post.user?.displayName}</h3>
                  <span>{formatTimestamp(post.createdAt)}</span>
                </div>
              </div>
              <div className="P-RSbar-grid-stats">
                <span><AiFillHeart /> {post.metrics?.likes || 0}</span>
                <span><IoShareSocialOutline /> {post.metrics?.shares || 0}</span>
                <span><BsBookmarkFill /> {post.metrics?.saves || 0}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="P-RSbar-post-card">
        {/* Post Header */}
        <div className="P-RSbar-post-header">
          <div className="P-RSbar-post-user">
            <img 
              src={post.user?.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
              alt={post.user?.displayName || 'User'} 
              className="P-RSbar-user-avatar"
              onError={(e) => {
                e.target.src = DEFAULT_PROFILE_IMAGE;
                e.target.onerror = null;
              }}
            />
            <div className="P-RSbar-user-details">
              <h3 className="P-RSbar-display-name">
                {post.user?.displayName || 'Anonymous User'}
                {post.user?.isVerified && (
                  <MdVerified className="verified-badge" title="Verified Account" />
                )}
              </h3>
              <span className="P-RSbar-username-time">
                @{post.user?.username || 'anonymous'} • {formatTimestamp(post.createdAt)}
              </span>
              {post.location && (
                <span className="P-RSbar-location">
                  <IoLocationOutline />
                  {post.location.name}
                </span>
              )}
            </div>
          </div>
          <button className="P-RSbar-menu-button">
            <BsThreeDotsVertical />
          </button>
        </div>

        {/* Post Content */}
        <div className="P-RSbar-post-content">
          <p className="P-RSbar-post-text">{post.content?.text}</p>
          {post.content?.media && post.content.media.length > 0 && (
            <div className="P-RSbar-media-container">
              {post.content.media.map((media, index) => (
                <div key={index} className="P-RSbar-media-wrapper">
                  <img
                    src={media.url}
                    alt="Post media"
                    className="P-RSbar-post-image"
                    style={{
                      aspectRatio: media.aspectRatio || '1',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="P-RSbar-hashtags-container">
              {post.hashtags.map(tag => (
                <span key={tag} className="P-RSbar-hashtag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="P-RSbar-post-actions">
          <button
            className={`P-RSbar-action-button ${post.isLiked ? 'liked' : ''}`}
            onClick={() => handleLike(post.id)}
          >
            {post.isLiked ? (
              <AiFillHeart className="action-icon filled" />
            ) : (
              <AiOutlineHeart className="action-icon" />
            )}
            <span className="count">{post.metrics?.likes || 0}</span>
          </button>
          <button
            className="P-RSbar-action-button share"
            onClick={() => handleShare(post.id)}
          >
            <IoShareSocialOutline className="action-icon" />
            <span className="count">{post.metrics?.shares || 0}</span>
          </button>
          <button
            className={`P-RSbar-action-button ${post.isSaved ? 'saved' : ''}`}
            onClick={() => handleSave(post.id)}
          >
            {post.isSaved ? (
              <BsBookmarkFill className="action-icon filled" />
            ) : (
              <BsBookmark className="action-icon" />
            )}
            <span className="count">{post.metrics?.saves || 0}</span>
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="custom-profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="custom-profile-error">
        <button onClick={handleGoBack} className="back-button">
          <FaArrowLeft />
          Go Back
        </button>
        <h2>Profile Not Found</h2>
        <p>{error}</p>
        <p>The user you're looking for doesn't exist or has been removed.</p>
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="custom-profile-container">
      <div className="profile-card">
        <div className="profile-main-info">
          <img 
            src={profileUser.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
            alt={profileUser.displayName} 
            className="profile-main-avatar"
            onError={(e) => {
              e.target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
          <div className="profile-main-details">
            <h1 className="profile-main-name">
              {profileUser.displayName}
              {profileUser.isVerified && (
                <MdVerified className="verified-badge" title="Verified Account" />
              )}
            </h1>
            <div className="profile-main-username">
              @{profileUser.username}
            </div>
            <p className="profile-main-bio">
              {profileUser.bio || "Welcome to my profile! 🌟"}
            </p>
            <div className="profile-main-meta">
              {profileUser.location && (
                <div className="profile-meta-item">
                  <MdLocationOn />
                  <span>{profileUser.location}</span>
                </div>
              )}
              {profileUser.website && (
                <div className="profile-meta-item">
                  <FaGlobe />
                  <a 
                    href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {profileUser.website.replace(/(^\w+:|^)\/\//, '')}
                  </a>
                </div>
              )}
              {profileUser.email && (
                <div className="profile-meta-item">
                  <MdEmail />
                  <span>{profileUser.email}</span>
                </div>
              )}
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">{stats.posts}</span>
                <span className="stat-label">Posts</span>
              </div>
              <div 
                className="stat-item clickable" 
                onClick={() => handleOpenFollowersModal('followers')}
              >
                <span className="stat-value">{stats.followers}</span>
                <span className="stat-label">Followers</span>
              </div>
              <div 
                className="stat-item clickable" 
                onClick={() => handleOpenFollowersModal('following')}
              >
                <span className="stat-value">{stats.following}</span>
                <span className="stat-label">Following</span>
              </div>
            </div>

            {currentUser && currentUser.uid !== profileUser.uid && (
              <div className="profile-actions">
                <button 
                  className={`follow-button ${isFollowing ? 'following' : ''}`}
                  onClick={handleFollow}
                  disabled={isFollowLoading}
                >
                  {isFollowLoading ? (
                    <>
                      <div className="button-spinner"></div>
                      {isFollowing ? 'Unfollowing...' : 'Following...'}
                    </>
                  ) : isFollowing ? (
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
                <button 
                  className="message-button"
                  onClick={handleMessage}
                >
                  <FaEnvelope />
                  Message
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="P-RSbar-posts-header">
          <h2>Posts {userPosts.length > 0 && `(${userPosts.length})`}</h2>
          <div className="P-RSbar-view-toggles">
            <button 
              className={`P-RSbar-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <BsGrid />
            </button>
            <button 
              className={`P-RSbar-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <BsList />
            </button>
          </div>
        </div>
        
        <div className={`P-RSbar-posts-feed ${viewMode}`}>
          {userPosts.length === 0 ? (
            <div className="P-RSbar-no-posts">
              <p>No posts to show yet</p>
              {currentUser?.uid === profileUser.uid && (
                <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
                  Start sharing your thoughts with the world!
                </p>
              )}
            </div>
          ) : (
            <div className="P-RSbar-posts-grid">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={handleCloseFollowersModal}
        targetUser={profileUser}
        initialTab={modalInitialTab}
      />
    </div>
  );
};

export default CustomProfile;
