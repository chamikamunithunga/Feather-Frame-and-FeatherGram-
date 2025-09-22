import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { IoShareSocialOutline } from 'react-icons/io5';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { FiSearch } from 'react-icons/fi';
import { HiHome } from 'react-icons/hi';
import { MdExplore, MdTrendingUp, MdPeople } from 'react-icons/md';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { IoLocationOutline } from 'react-icons/io5';
import { collection, query, where, onSnapshot, orderBy, limit, getDocs, getDoc, doc, startAfter } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import postService from '../../../services/postService';
import CreatePostModal from '../components/CreatePostModal';
import ErrorBoundary from '../components/ErrorBoundary';
import '../styles/Explore.css';
import { formatDistanceToNow, format, isAfter, subHours } from 'date-fns';
import { useNavigate, useLocation } from 'react-router-dom';
import communityService from '../../../services/communityService';
import { shopService } from '../../../services/shopService';

const Explore = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('foryou');
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [loadingActions, setLoadingActions] = useState(new Set()); // Track loading actions
  const [sidebarCommunities, setSidebarCommunities] = useState([]);
  const [sidebarShops, setSidebarShops] = useState([]);
  const lastPostRef = useRef(null);
  const observer = useRef(null);
  
  // Keep track of loaded post IDs to prevent duplicates
  const loadedPostIds = useRef(new Set());
  
  // Real-time listeners refs
  const likesUnsubscribe = useRef(null);
  const savesUnsubscribe = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Fetch user data for posts
  const fetchUsers = async (userIds) => {
    if (!userIds || userIds.length === 0) {
      console.log('No user IDs to fetch');
      return;
    }
    
    try {
      // Split userIds into chunks of 10 (Firestore limit for 'in' queries)
      const userIdChunks = [];
      for (let i = 0; i < userIds.length; i += 10) {
        userIdChunks.push(userIds.slice(i, i + 10));
      }

      const newUsers = {};
      
      // Fetch users for each chunk
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

  // Set up real-time listeners for likes and saves
  const setupRealtimeListeners = useCallback(() => {
    if (!user) return;

    // Clean up existing listeners
    if (likesUnsubscribe.current) likesUnsubscribe.current();
    if (savesUnsubscribe.current) savesUnsubscribe.current();

    // Listen to user's likes in real-time
    const likesQuery = query(
      collection(db, 'postLikes'),
      where('userId', '==', user.uid)
    );
    
    likesUnsubscribe.current = onSnapshot(likesQuery, (snapshot) => {
      const likedPostIds = new Set(snapshot.docs.map(doc => doc.data().postId));
      setLikedPosts(likedPostIds);
    }, (error) => {
      console.error('Error listening to likes:', error);
    });

    // Listen to user's saves in real-time
    const savesQuery = query(
      collection(db, 'postSaves'),
      where('userId', '==', user.uid)
    );
    
    savesUnsubscribe.current = onSnapshot(savesQuery, (snapshot) => {
      const savedPostIds = new Set(snapshot.docs.map(doc => doc.data().postId));
      setSavedPosts(savedPostIds);
    }, (error) => {
      console.error('Error listening to saves:', error);
    });
  }, [user]);

  // Set up infinite scrolling
  const lastPostCallback = useCallback((node) => {
    if (loading) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMorePosts();
      }
    });

    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Initialize posts and real-time updates
  useEffect(() => {
    let unsubscribePosts = null;

    const initializePosts = async () => {
      try {
        setLoading(true);
        setError(null);
        setPosts([]);
        setHasMore(true);
        loadedPostIds.current.clear();

        const postsRef = collection(db, 'posts');
        let q;

        if (activeTab === 'following' && user) {
          // Get user's following list
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const following = userDoc.data()?.following || [];
          
          if (following.length === 0) {
            setPosts([]);
            setHasMore(false);
            setLoading(false);
            return;
          }
          
          // Split following into chunks
          const followingChunks = [];
          for (let i = 0; i < following.length; i += 10) {
            followingChunks.push(following.slice(i, i + 10));
          }
          
          // Create queries for each chunk
          const queries = followingChunks.map(chunk => 
            query(
              postsRef,
              where('userId', 'in', chunk),
              orderBy('createdAt', 'desc'),
              limit(10)
            )
          );
          
          // Execute all queries
          const snapshots = await Promise.all(queries.map(q => getDocs(q)));
          
          // Combine and sort results
          const allPosts = [];
          snapshots.forEach(snapshot => {
            snapshot.docs.forEach(doc => {
              allPosts.push({
                id: doc.id,
                ...doc.data()
              });
            });
          });
          
          // Sort by createdAt desc
          allPosts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
          
          // Take only the first 10 posts
          const newPosts = allPosts.slice(0, 10);
          setPosts(newPosts);
          
          // Fetch user data for posts
          const userIds = newPosts.map(post => post.userId);
          if (userIds.length > 0) {
            await fetchUsers(userIds);
          }
        } else if (activeTab === 'trending') {
          q = query(
            postsRef,
            where('metrics.likes', '>=', 10),
            orderBy('metrics.likes', 'desc'),
            orderBy('createdAt', 'desc'),
            limit(10)
          );
          
          const snapshot = await getDocs(q);
          const newPosts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setPosts(newPosts);
          
          // Fetch user data for posts
          const userIds = newPosts.map(post => post.userId);
          if (userIds.length > 0) {
            await fetchUsers(userIds);
          }
        } else {
          // For You tab (all posts)
          q = query(postsRef, orderBy('createdAt', 'desc'), limit(10));
          
          unsubscribePosts = onSnapshot(q, (snapshot) => {
            const newPosts = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            
            setPosts(newPosts);
            
            // Fetch user data for posts
            const userIds = newPosts.map(post => post.userId);
            if (userIds.length > 0) {
              fetchUsers(userIds);
            }
          });
        }
      } catch (err) {
        setError('Failed to load posts');
        console.error('Error initializing posts:', err);
      } finally {
        setLoading(false);
      }
    };

    initializePosts();

    return () => {
      if (unsubscribePosts) unsubscribePosts();
    };
  }, [activeTab, user]);

  // Initialize real-time listeners for likes and saves
  useEffect(() => {
    if (!user) {
      setLikedPosts(new Set());
      setSavedPosts(new Set());
      // Clean up listeners
      if (likesUnsubscribe.current) likesUnsubscribe.current();
      if (savesUnsubscribe.current) savesUnsubscribe.current();
      return;
    }

    setupRealtimeListeners();

    // Cleanup function
    return () => {
      if (likesUnsubscribe.current) likesUnsubscribe.current();
      if (savesUnsubscribe.current) savesUnsubscribe.current();
    };
  }, [user, setupRealtimeListeners]);

  useEffect(() => {
    // Prefetch compact data for right rail (communities and markets)
    const fetchSidebarData = async () => {
      try {
        const [communities, shops] = await Promise.all([
          communityService.getAllCommunities(),
          shopService.getFeaturedShops().catch(() => shopService.getAllShops())
        ]);
        setSidebarCommunities(communities.slice(0, 6));
        setSidebarShops(shops.slice(0, 6));
      } catch (e) {
        console.warn('Sidebar data load failed:', e?.message || e);
      }
    };
    fetchSidebarData();
  }, []);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    // Reset posts when search query changes
    setPosts([]);
    setHasMore(true);
  };

  // Improved handleLike with optimistic updates and debouncing
  const handleLike = async (postId) => {
    if (!user) {
      setError('Please sign in to like posts');
      return;
    }

    // Create action key for loading state
    const actionKey = `like-${postId}`;
    
    // Prevent multiple rapid clicks
    if (loadingActions.has(actionKey)) {
      return;
    }
    
    try {
      // Add loading state
      setLoadingActions(prev => new Set([...prev, actionKey]));
      
      // Optimistic update
      const wasLiked = likedPosts.has(postId);
      const newLikedPosts = new Set(likedPosts);
      
      if (wasLiked) {
        newLikedPosts.delete(postId);
      } else {
        newLikedPosts.add(postId);
      }
      
      setLikedPosts(newLikedPosts);
      
      // Update post metrics optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                metrics: {
                  ...post.metrics,
                  likes: wasLiked ? post.metrics.likes - 1 : post.metrics.likes + 1
                }
              }
            : post
        )
      );

      // Perform the actual server operation
      if (wasLiked) {
        await postService.unlikePost(postId, user.uid);
      } else {
        await postService.likePost(postId, user.uid);
      }
      
      // Clear any previous errors on success
      if (error) setError(null);
    } catch (err) {
      console.error('Error handling like:', err);
      
      // Revert optimistic update on error - use original state
      const revertLikedPosts = new Set(likedPosts);
      if (wasLiked) {
        revertLikedPosts.add(postId);
      } else {
        revertLikedPosts.delete(postId);
      }
      setLikedPosts(revertLikedPosts);
      
      // Revert post metrics - use original state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                metrics: {
                  ...post.metrics,
                  likes: wasLiked ? post.metrics.likes + 1 : post.metrics.likes - 1
                }
              }
            : post
        )
      );
      
      setError('Failed to update like. Please try again.');
    } finally {
      // Remove loading state
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  // Improved handleSave with optimistic updates and debouncing
  const handleSave = async (postId) => {
    if (!user) {
      setError('Please sign in to save posts');
      return;
    }

    // Create action key for loading state
    const actionKey = `save-${postId}`;
    
    // Prevent multiple rapid clicks
    if (loadingActions.has(actionKey)) {
      return;
    }
    
    try {
      // Add loading state
      setLoadingActions(prev => new Set([...prev, actionKey]));
      
      // Optimistic update
      const wasSaved = savedPosts.has(postId);
      const newSavedPosts = new Set(savedPosts);
      
      if (wasSaved) {
        newSavedPosts.delete(postId);
      } else {
        newSavedPosts.add(postId);
      }
      
      setSavedPosts(newSavedPosts);
      
      // Update post metrics optimistically
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                metrics: {
                  ...post.metrics,
                  saves: wasSaved ? post.metrics.saves - 1 : post.metrics.saves + 1
                }
              }
            : post
        )
      );

      // Perform the actual server operation
      if (wasSaved) {
        await postService.unsavePost(postId, user.uid);
      } else {
        await postService.savePost(postId, user.uid);
      }
      
      // Clear any previous errors on success
      if (error) setError(null);
    } catch (err) {
      console.error('Error handling save:', err);
      
      // Revert optimistic update on error - use original state
      const revertSavedPosts = new Set(savedPosts);
      if (wasSaved) {
        revertSavedPosts.add(postId);
      } else {
        revertSavedPosts.delete(postId);
      }
      setSavedPosts(revertSavedPosts);
      
      // Revert post metrics - use original state
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                metrics: {
                  ...post.metrics,
                  saves: wasSaved ? post.metrics.saves + 1 : post.metrics.saves - 1
                }
              }
            : post
        )
      );
      
      setError('Failed to update save. Please try again.');
    } finally {
      // Remove loading state
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleShare = async (postId) => {
    if (!user) return;

    // Create action key for loading state
    const actionKey = `share-${postId}`;

    // Prevent multiple rapid clicks
    if (loadingActions.has(actionKey)) {
      return;
    }

    try {
      // Add loading state
      setLoadingActions(prev => new Set([...prev, actionKey]));

      if (navigator.share) {
        await navigator.share({
          title: 'Check out this post!',
          text: 'I found this interesting post on our platform',
          url: `${window.location.origin}/post/${postId}`,
        });
      } else {
        // Update share count optimistically
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? {
                  ...post,
                  metrics: {
                    ...post.metrics,
                    shares: post.metrics.shares + 1
                  }
                }
              : post
          )
        );

        await postService.sharePost(postId, user.uid);
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      
      // Revert share count if it was updated optimistically
      if (!navigator.share) {
        setPosts(prevPosts => 
          prevPosts.map(post => 
            post.id === postId 
              ? {
                  ...post,
                  metrics: {
                    ...post.metrics,
                    shares: post.metrics.shares - 1
                  }
                }
              : post
          )
        );
      }
      
      setError('Failed to share post. Please try again.');
    } finally {
      // Remove loading state
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const postDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const twentyFourHoursAgo = subHours(now, 24);

      if (isAfter(postDate, twentyFourHoursAgo)) {
        return formatDistanceToNow(postDate, { addSuffix: true });
      } else {
        return format(postDate, 'MMM d, yyyy \'at\' h:mm a');
      }
    } catch (err) {
      console.error('Error formatting timestamp:', err);
      return '';
    }
  };

  // Load more posts for infinite scrolling
  const loadMorePosts = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const lastVisiblePost = posts[posts.length - 1];
      
      if (!lastVisiblePost) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const postsRef = collection(db, 'posts');
      let q;

      if (activeTab === 'following' && user) {
        // Get user's following list
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const following = userDoc.data()?.following || [];
        
        if (following.length === 0) {
          setHasMore(false);
          setLoading(false);
          return;
        }
        
        // Split following into chunks
        const followingChunks = [];
        for (let i = 0; i < following.length; i += 10) {
          followingChunks.push(following.slice(i, i + 10));
        }
        
        // Create queries for each chunk
        const queries = followingChunks.map(chunk => 
          query(
            postsRef,
            where('userId', 'in', chunk),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisiblePost.createdAt),
            limit(10)
          )
        );
        
        // Execute all queries
        const snapshots = await Promise.all(queries.map(q => getDocs(q)));
        
        // Combine and sort results
        const allPosts = [];
        snapshots.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            if (!loadedPostIds.current.has(doc.id)) {
              allPosts.push({
                id: doc.id,
                ...doc.data()
              });
              loadedPostIds.current.add(doc.id);
            }
          });
        });
        
        // Sort by createdAt desc
        allPosts.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);
        
        // Take only the first 10 posts
        const newPosts = allPosts.slice(0, 10);
        
        if (newPosts.length < 10) {
          setHasMore(false);
        }
        
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        
        // Fetch user data for new posts
        const userIds = newPosts.map(post => post.userId);
        if (userIds.length > 0) {
          await fetchUsers(userIds);
        }
      } else {
        // Handle other tabs (foryou and trending)
        q = query(
          postsRef,
          orderBy('createdAt', 'desc'),
          startAfter(lastVisiblePost.createdAt),
          limit(10)
        );
        
        if (activeTab === 'trending') {
          q = query(
            postsRef,
            where('metrics.likes', '>=', 10),
            orderBy('metrics.likes', 'desc'),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisiblePost.metrics.likes, lastVisiblePost.createdAt),
            limit(10)
          );
        }
        
        const snapshot = await getDocs(q);
        const newPosts = [];
        
        snapshot.forEach(doc => {
          if (!loadedPostIds.current.has(doc.id)) {
            newPosts.push({
              id: doc.id,
              ...doc.data()
            });
            loadedPostIds.current.add(doc.id);
          }
        });
        
        if (newPosts.length < 10) {
          setHasMore(false);
        }
        
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
        
        // Fetch user data for new posts
        const userIds = newPosts.map(post => post.userId);
        if (userIds.length > 0) {
          await fetchUsers(userIds);
        }
      }
    } catch (err) {
      setError('Failed to load more posts');
      console.error('Error loading more posts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="explore-container">
        <div className="explore-layout">
          <div className="explore-main">
            {/* Header */}
            <div className="header">
              <h1>Social Feed</h1>
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search posts, hashtags..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="search-input"
                />
                <FiSearch className="search-icon" />
              </div>

            </div>

            {/* Navigation Tabs */}
            <div className="tabs-container">
              <button
                className={`tab ${activeTab === 'foryou' ? 'active' : ''}`}
                onClick={() => setActiveTab('foryou')}
              >
                <HiHome />
                For You
              </button>
              <button
                className={`tab ${activeTab === 'following' ? 'active' : ''}`}
                onClick={() => setActiveTab('following')}
              >
                <MdPeople />
                Following
              </button>
              <button
                className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
                onClick={() => setActiveTab('trending')}
              >
                <MdTrendingUp />
                Trending
              </button>
            </div>

            {/* Posts Feed */}
            <div className="posts-container">
              {posts.map((post, index) => {
                const user = users[post.userId];
                const isLastPost = index === posts.length - 1;
                
                return (
                  <div 
                    key={post.id} 
                    className="post-card"
                    ref={isLastPost ? lastPostCallback : null}
                  >
                    {/* Post Header */}
                    <div className="post-header">
                      <div className="user-info">
                        {user && (
                          <>
                            <div 
                              className="user-avatar"
                              onClick={() => navigate(`profile/${user.username}`)}
                              style={{ cursor: 'pointer' }}
                            >
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
                              <div 
                                className="name-container"
                                onClick={() => navigate(`profile/${user.username}`)}
                                style={{ cursor: 'pointer' }}
                              >
                                <h3 className="display-name">{user.displayName}</h3>
                                {user.isVerified && (
                                  <span className="verified-badge" title="Verified Account">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <span 
                                className="username"
                                onClick={() => navigate(`/profile/${user.username}`)}
                                style={{ cursor: 'pointer' }}
                              >@{user.username}</span>
                              <span className="post-time" title={post.createdAt ? format(post.createdAt.toDate(), 'PPpp') : ''}>
                                {formatTimestamp(post.createdAt)}
                              </span>
                              {post.location && (
                                <span className="location">
                                  <IoLocationOutline />
                                  {post.location.name}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="post-options">
                        {user && user.uid === user?.uid && (
                          <button 
                            className="edit-button"
                            onClick={() => handleEditPost(post)}
                            title="Edit Post"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                        )}
                        <button 
                          className="menu-button"
                          onClick={() => handlePostMenu(post)}
                          title="More Options"
                        >
                          <BsThreeDotsVertical />
                        </button>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="post-content">
                      <p className="post-text">{post.content.text}</p>
                      {post.content.media && post.content.media.length > 0 && (
                        <div className="media-container">
                          {post.content.media.map((media, index) => (
                            <div key={index} className="media-wrapper">
                              <img
                                src={media.url}
                                alt="Post media"
                                className="post-image"
                                style={{
                                  aspectRatio: media.aspectRatio || '1',
                                  objectFit: 'cover'
                                }}
                                onClick={() => handleMediaClick(media)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Hashtags */}
                      {post.hashtags && post.hashtags.length > 0 && (
                        <div className="hashtags-container">
                          {post.hashtags.map(tag => (
                            <span 
                              key={tag} 
                              className="hashtag"
                              onClick={() => handleHashtagClick(tag)}
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                      {/* Post Stats */}
                      <div className="post-stats">
                        <span className="stat-item">
                          {post.metrics.likes} {post.metrics.likes === 1 ? 'like' : 'likes'}
                        </span>
                        <span className="stat-item">
                          {post.metrics.shares} {post.metrics.shares === 1 ? 'share' : 'shares'}
                        </span>
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="post-actions">
                      {user ? (
                        <>
                          <button
                            className={`action-button ${likedPosts.has(post.id) ? 'liked' : ''}`}
                            onClick={() => handleLike(post.id)}
                            title={likedPosts.has(post.id) ? 'Unlike' : 'Like'}
                            disabled={loadingActions.has(`like-${post.id}`)}
                          >
                            {likedPosts.has(post.id) ? (
                              <AiFillHeart className="action-icon filled" />
                            ) : (
                              <AiOutlineHeart className="action-icon" />
                            )}
                            <span className="count">{post.metrics.likes}</span>
                          </button>
                          <button
                            className="action-button share"
                            onClick={() => handleShare(post.id)}
                            title="Share"
                            disabled={loadingActions.has(`share-${post.id}`)}
                          >
                            <IoShareSocialOutline className="action-icon" />
                            <span className="count">{post.metrics.shares}</span>
                          </button>
                          <button
                            className={`action-button ${savedPosts.has(post.id) ? 'saved' : ''}`}
                            onClick={() => handleSave(post.id)}
                            title={savedPosts.has(post.id) ? 'Unsave' : 'Save'}
                            disabled={loadingActions.has(`save-${post.id}`)}
                          >
                            {savedPosts.has(post.id) ? (
                              <BsBookmarkFill className="action-icon filled" />
                            ) : (
                              <BsBookmark className="action-icon" />
                            )}
                            <span className="count">{post.metrics.saves}</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-button"
                            onClick={() => navigate('/login', { state: { from: location } })}
                            title="Sign in to like"
                          >
                            <AiOutlineHeart className="action-icon" />
                            <span className="count">{post.metrics.likes}</span>
                          </button>
                          <button
                            className="action-button share"
                            onClick={() => navigate('/login', { state: { from: location } })}
                            title="Sign in to share"
                          >
                            <IoShareSocialOutline className="action-icon" />
                            <span className="count">{post.metrics.shares}</span>
                          </button>
                          <button
                            className="action-button"
                            onClick={() => navigate('/login', { state: { from: location } })}
                            title="Sign in to save"
                          >
                            <BsBookmark className="action-icon" />
                            <span className="count">{post.metrics.saves}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  <span>Loading posts...</span>
                </div>
              )}

              {!loading && !hasMore && posts.length > 0 && (
                <div className="no-more-posts">
                  You've reached the end
                </div>
              )}

              {!loading && posts.length === 0 && (
                <div className="no-posts">
                  <i className="fas fa-inbox"></i>
                  <p>No posts to show</p>
                </div>
              )}
            </div>

            {/* Create Post Modal */}
            <CreatePostModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
            />
          </div>

          {/* Right Rail */}
          <aside className="explore-right-rail">
            <div className="rail-card">
              <h3 className="rail-title">Current Communities</h3>
              <ul className="rail-list">
                {sidebarCommunities.map((c) => (
                  <li key={c.id} className="rail-item" onClick={() => navigate(`/social/communities/${c.id}`)}>
                    <img className="rail-avatar" src={c.avatar} alt={c.name} />
                    <div className="rail-meta">
                      <span className="rail-name">{c.name}</span>
                      <span className="rail-sub">{c.memberCount || (c.members?.length || 0)} members</span>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="rail-link" onClick={() => navigate('/social/communities')}>View all</button>
            </div>

            <div className="rail-card">
              <h3 className="rail-title">Current Markets</h3>
              <ul className="rail-list">
                {sidebarShops.map((s) => (
                  <li key={s.id} className="rail-item" onClick={() => navigate('/social/marketplace')}>
                    <img className="rail-avatar" src={s.logoUrl || s.imageUrl || '/default-avatar.png'} alt={s.name} />
                    <div className="rail-meta">
                      <span className="rail-name">{s.name}</span>
                      <span className="rail-sub">{s.category || 'Marketplace'}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <button className="rail-link" onClick={() => navigate('/social/marketplace')}>Explore market</button>
            </div>
          </aside>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Explore;