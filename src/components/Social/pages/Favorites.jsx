import React, { useState, useEffect } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { IoShareSocialOutline } from 'react-icons/io5';
import { BsBookmark, BsBookmarkFill, BsGrid, BsList, BsBookmarkStar, BsBookmarkStarFill } from 'react-icons/bs';
import { FiSearch, FiFilter, FiClock, FiUser, FiMapPin } from 'react-icons/fi';
import { MdOutlineFavorite, MdFavorite } from 'react-icons/md';
import { formatDistanceToNow } from 'date-fns';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import postService from '../../../services/postService';
import '../styles/Favorites.css';

const Favorites = () => {
  const { user, loading: authLoading } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState({});
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Fetch user data for posts
  const fetchUsers = async (userIds) => {
    try {
      const userIdChunks = [];
      for (let i = 0; i < userIds.length; i += 10) {
        userIdChunks.push(userIds.slice(i, i + 10));
      }

      const newUsers = {};
      
      for (const chunk of userIdChunks) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('uid', 'in', chunk));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(doc => {
          const userData = doc.data();
          newUsers[userData.uid] = userData;
        });
      }
      
      setUsers(prevUsers => ({
        ...prevUsers,
        ...newUsers
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  // Initialize saved posts and real-time updates
  useEffect(() => {
    if (authLoading) return; // Wait for auth to be checked
    
    if (!user) {
      setSavedPosts([]);
      setLoading(false);
      return;
    }

    let unsubscribeSaves = null;
    let unsubscribePosts = null;

    const initializeSavedPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Listen for user's saved posts
        const savesQuery = query(
          collection(db, 'postSaves'),
          where('userId', '==', user.uid)
        );

        unsubscribeSaves = onSnapshot(savesQuery, async (snapshot) => {
          const savedPostIds = snapshot.docs.map(doc => doc.data().postId);
          
          if (savedPostIds.length === 0) {
            setSavedPosts([]);
            setLoading(false);
            return;
          }

          // Fetch the actual posts
          const postsRef = collection(db, 'posts');
          const chunks = [];
          for (let i = 0; i < savedPostIds.length; i += 10) {
            chunks.push(savedPostIds.slice(i, i + 10));
          }

          const allPosts = [];
          for (const chunk of chunks) {
            const q = query(postsRef, where('__name__', 'in', chunk));
            const postsSnapshot = await getDocs(q);
            postsSnapshot.forEach(doc => {
              allPosts.push({
                id: doc.id,
                ...doc.data()
              });
            });
          }

          // Sort posts by save time (most recent first)
          allPosts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
          setSavedPosts(allPosts);

          // Fetch user data for posts
          const userIds = allPosts.map(post => post.userId);
          if (userIds.length > 0) {
            await fetchUsers(userIds);
          }
        });

      } catch (err) {
        console.error('Error fetching saved posts:', err);
        setError('Failed to load saved posts');
      } finally {
        setLoading(false);
      }
    };

    initializeSavedPosts();

    return () => {
      if (unsubscribeSaves) unsubscribeSaves();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, [user, authLoading]);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleUnsave = async (postId) => {
    try {
      await postService.unsavePost(postId, user.uid);
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites');
    }
  };

  const handleShare = async (postId) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post!',
          text: 'I found this interesting post on our platform',
          url: `${window.location.origin}/post/${postId}`,
        });
      } else {
        await postService.sharePost(postId, user.uid);
      }
    } catch (err) {
      console.error('Error sharing post:', err);
    }
  };

  // Filter and sort posts
  const getFilteredAndSortedPosts = () => {
    let filtered = savedPosts.filter(post => {
      const matchesSearch = 
        post.content?.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        users[post.userId]?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        users[post.userId]?.username?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Apply type filter
      if (filterType === 'text' && (!post.content.media || post.content.media.length === 0)) return true;
      if (filterType === 'media' && post.content.media && post.content.media.length > 0) return true;
      if (filterType === 'all') return true;

      return false;
    });

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.seconds - b.createdAt.seconds);
        break;
      case 'likes':
        filtered.sort((a, b) => (b.metrics?.likes || 0) - (a.metrics?.likes || 0));
        break;
      case 'comments':
        filtered.sort((a, b) => (b.metrics?.comments || 0) - (a.metrics?.comments || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredPosts = getFilteredAndSortedPosts();

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="favorites-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="favorites-container">
        <div className="not-logged-in">
          <BsBookmarkStar size={64} />
          <h2>Please log in to view your favorites</h2>
          <p>Sign in to access your saved posts and content.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="favorites-container">
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <div className="header-main">
          <div className="header-left">
            <h1>Saved Posts</h1>
            <p className="header-subtitle">Your favorite content in one place</p>
          </div>
          <div className="header-controls">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search saved posts..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
              />
              <FiSearch className="search-icon" />
            </div>
            <div className="filter-controls">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Posts</option>
                <option value="text">Text Only</option>
                <option value="media">With Media</option>
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="recent">Most Recent</option>
                <option value="oldest">Oldest First</option>
                <option value="likes">Most Liked</option>
                <option value="comments">Most Commented</option>
              </select>
            </div>
            <div className="view-toggles">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <BsGrid />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <BsList />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={`favorites-grid ${viewMode}`}>
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span>Loading saved posts...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts">
            <BsBookmarkStar size={64} />
            <p>No saved posts yet</p>
            <p>Posts you save will appear here</p>
          </div>
        ) : (
          filteredPosts.map(post => {
            const user = users[post.userId];
            if (!user) return null;

            return (
              <div key={post.id} className="favorite-card">
                <div className="card-media">
                  {post.content.media && post.content.media.length > 0 && (
                    <img 
                      src={post.content.media[0].url} 
                      alt="Post media"
                      style={{
                        aspectRatio: post.content.media[0].aspectRatio || '16/9',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <button 
                    className="remove-btn" 
                    title="Remove from favorites"
                    onClick={() => handleUnsave(post.id)}
                  >
                    <BsBookmarkFill />
                  </button>
                  {post.content.media && post.content.media.length > 0 && (
                    <div className="media-badge">
                      {post.content.media[0].type === 'video' ? '🎥' : '📷'}
                    </div>
                  )}
                </div>

                <div className="card-content">
                  <div className="user-info">
                    <div className="author">
                      <div className="user-avatar">
                        <img 
                          src={user.profileImageUrl || '/default-avatar.png'} 
                          alt={user.displayName}
                          className="avatar"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                            e.target.onerror = null;
                          }}
                        />
                        <div className={`status-indicator ${user.isActive ? 'active' : ''}`} />
                      </div>
                      <div className="user-details">
                        <div className="name-container">
                          <h3 className="display-name">{user.displayName}</h3>
                          {user.isVerified && (
                            <span className="verified-badge" title="Verified Account">✓</span>
                          )}
                        </div>
                        <span className="username">@{user.username}</span>
                        <div className="post-meta">
                          <span className="post-time">
                            <FiClock size={12} />
                            {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
                          </span>
                          {post.location && (
                            <span className="location">
                              <FiMapPin size={12} />
                              {post.location.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="post-text">{post.content.text}</p>
                  
                  <div className="card-meta">
                    <div className="stats">
                      <span className="stat">
                        <MdOutlineFavorite />
                        {post.metrics?.likes || 0}
                      </span>
                      <span className="stat">
                        <i className="fas fa-comment"></i>
                        {post.metrics?.comments || 0}
                      </span>
                      <span className="stat">
                        <IoShareSocialOutline />
                        {post.metrics?.shares || 0}
                      </span>
                    </div>
                  </div>

                  <div className="card-footer">
                    <div className="card-actions">
                      <button 
                        className="action-btn" 
                        title="Share"
                        onClick={() => handleShare(post.id)}
                      >
                        <IoShareSocialOutline />
                      </button>
                      <button 
                        className="action-btn" 
                        title="Remove from favorites"
                        onClick={() => handleUnsave(post.id)}
                      >
                        <BsBookmarkFill />
                      </button>
                      <button className="action-btn" title="More options">
                        <i className="fas fa-ellipsis-h"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Favorites; 