import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Posts.css';
import { 
  MdPhoto, 
  MdVideocam,
  MdLocationOn, 
  MdMood, 
  MdMoreHoriz, 
  MdTrendingUp,
  MdRemoveRedEye,
  MdLink,
  MdEmail,
  MdGroup
} from 'react-icons/md';
import { 
  FaHeart, 
  FaRegHeart, 
  FaShare, 
  FaBookmark, 
  FaRegBookmark,
  FaCheckCircle,
  FaUserFriends,
  FaUserPlus,
  FaFire,
  FaChevronRight,
  FaMapMarkerAlt,
  FaGlobe,
  FaTimes,
  FaEdit,
  FaTrash,
  FaUsers
} from 'react-icons/fa';
import { IoLocationOutline } from 'react-icons/io5';
import { BsThreeDotsVertical, BsGrid, BsList } from 'react-icons/bs';
import authService from '../../../services/authService';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot,
  getDocs,
  where,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { uploadImage } from '../../../config/cloudinary';
import { useAuth } from '../../../contexts/AuthContext';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2358f193'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Posts = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState({
    description: '',
    location: '',
    media: null,
    type: 'image'
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', location: '' });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest('.P-RSbar-menu-container')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  // Fetch posts and listen for real-time updates
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    setIsLoadingPosts(true);
    setPostsError(null);

    try {
      // Create a query to fetch only the current user's posts
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      // Set up real-time listener
      const unsubscribe = onSnapshot(postsQuery, async (snapshot) => {
        try {
          const postsData = [];
          
          // Get current user's data
          const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
          const userData = userDoc.docs[0]?.data() || {};

          // Process each post
          for (const doc of snapshot.docs) {
            const postData = doc.data();

            postsData.push({
              id: doc.id,
      user: {
                name: userData.displayName || 'Anonymous User',
                username: userData.username || 'anonymous',
                avatar: userData.profileImageUrl || DEFAULT_PROFILE_IMAGE,
                verified: userData.isVerified || false
      },
      content: {
                text: postData.content.text,
                media: postData.content.media || [],
                location: postData.location?.name,
                hashtags: postData.hashtags || []
      },
      stats: {
                likes: postData.metrics?.likes || 0,
                shares: postData.metrics?.shares || 0,
                views: String(postData.metrics?.views || "0")
      },
      isFavorite: false,
      isLiked: false,
              timestamp: formatTimestamp(postData.createdAt?.toDate())
            });
          }

          setPosts(postsData);
          setIsLoadingPosts(false);
        } catch (error) {
          console.error('Error processing posts:', error);
          setPostsError('Error loading your posts. Please try again later.');
          setIsLoadingPosts(false);
        }
      }, (error) => {
        console.error('Error fetching posts:', error);
        setPostsError('Error loading your posts. Please try again later.');
        setIsLoadingPosts(false);
      });

      // Cleanup subscription
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up posts listener:', error);
      setPostsError('Error loading your posts. Please try again later.');
      setIsLoadingPosts(false);
    }
  }, [isAuthenticated, user]);

  // Fetch suggested users
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchSuggestedUsers = async () => {
      setLoadingSuggestions(true);
      try {
        // Fetch all users except current user
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '!=', user.uid)
        );
        
        const snapshot = await getDocs(usersQuery);
        const allUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Get current user's following list
        const currentUserDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
        let following = [];
        if (!currentUserDoc.empty) {
          const currentUserData = currentUserDoc.docs[0].data();
          following = currentUserData.following || [];
          setFollowingUsers(following);
        }

        // Filter out already followed users and randomly select up to 3
        const unfollowedUsers = allUsers.filter(u => !following.includes(u.uid));
        const shuffled = unfollowedUsers.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);

        setSuggestedUsers(selected);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestedUsers();
  }, [isAuthenticated, user]);

  // Helper function to format timestamps
  const formatTimestamp = (date) => {
    if (!date) return '';

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

  // Extract hashtags from description
  const extractHashtags = (text) => {
    const hashtagRegex = /#[\w]+/g;
    return (text.match(hashtagRegex) || []).map(tag => tag.slice(1));
  };

  // Extract mentions from description
  const extractMentions = (text) => {
    const mentionRegex = /@[\w]+/g;
    return (text.match(mentionRegex) || []).map(mention => mention.slice(1));
  };

  const handleFileUpload = async (event, type) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size should be less than 10MB');
        return;
      }

      setNewPost({ ...newPost, media: file, type });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated || !user) {
      setError('You must be logged in to create a post');
      return;
    }

    if (!newPost.description && !newPost.media) {
      setError('Please add a description or media');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let mediaData = [];
      if (newPost.media) {
        const uploadedImage = await uploadImage(newPost.media);
        mediaData.push({
          url: uploadedImage.url,
          type: uploadedImage.type,
          aspectRatio: uploadedImage.aspectRatio.toString()
        });
      }

      const postData = {
        userId: user.uid,
        content: {
          text: newPost.description,
          media: mediaData
        },
        location: newPost.location ? {
          name: newPost.location,
          coordinates: null
        } : null,
        hashtags: extractHashtags(newPost.description),
        mentions: extractMentions(newPost.description),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isEdited: false,
        isActive: true,
        metrics: {
          likes: 0,
          shares: 0,
          saves: 0
        },
        visibility: 'public',
        allowComments: true
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);
      
      // Add the new post to the local state
      const newPostWithId = {
        id: docRef.id,
        user: {
          name: user.displayName,
          username: user.username,
          avatar: user.profileImageUrl || DEFAULT_PROFILE_IMAGE,
          verified: user.isVerified
        },
        content: {
          text: newPost.description,
          media: mediaData,
          location: newPost.location
        },
        stats: {
          likes: 0,
          shares: 0,
          views: "0"
        },
        isFavorite: false,
        isLiked: false,
        timestamp: "Just now"
      };

      setPosts([newPostWithId, ...posts]);

      // Reset form
      setNewPost({
        description: '',
        location: '',
        media: null,
        type: 'image'
      });
      setImagePreview(null);
      setError(null);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            stats: {
              ...post.stats,
              likes: post.isLiked ? post.stats.likes - 1 : post.stats.likes + 1
            },
            isLiked: !post.isLiked 
          } 
        : post
    ));
  };

  const handleShare = (postId) => {
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, stats: { ...p.stats, shares: p.stats.shares + 1 } } : p
    ));
  };

  const handleFavorite = (postId) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, isFavorite: !post.isFavorite } : post
    ));
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      
      setPosts(posts.filter(post => post.id !== postId));
      setDeleteConfirm(null);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error deleting post:', error);
      setError('Failed to delete post');
    }
  };

  // Handle post edit
  const handleEditPost = async (postId) => {
    try {
      const postToEdit = posts.find(p => p.id === postId);
      const updatedData = {
        content: {
          text: editForm.description,
          media: postToEdit.content.media
        },
        location: editForm.location ? {
          name: editForm.location,
          coordinates: null
        } : null,
        hashtags: extractHashtags(editForm.description),
        mentions: extractMentions(editForm.description),
        updatedAt: serverTimestamp(),
        isEdited: true
      };

      await updateDoc(doc(db, 'posts', postId), updatedData);
      
      setPosts(posts.map(post => 
        post.id === postId 
          ? {
              ...post,
              content: {
                ...post.content,
                text: editForm.description,
                location: editForm.location
              },
              isEdited: true
            }
          : post
      ));
      
      setEditingPost(null);
      setActiveDropdown(null);
    } catch (error) {
      console.error('Error updating post:', error);
      setError('Failed to update post');
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = (postId) => {
    setActiveDropdown(activeDropdown === postId ? null : postId);
  };

  // Start editing a post
  const startEditPost = (post) => {
    setEditingPost(post.id);
    setEditForm({
      description: post.content.text,
      location: post.content.location || ''
    });
    setActiveDropdown(null);
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditingPost(null);
    setEditForm({ description: '', location: '' });
  };

  // Handle follow/unfollow
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
      } else {
        // Follow
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(targetUserRef, {
          followers: arrayUnion(user.uid)
        });
        
        setFollowingUsers([...followingUsers, userId]);
      }
    } catch (error) {
      console.error('Error following/unfollowing user:', error);
    }
  };

  // Post Creation Component
  const CreatePost = () => {
    return (
      <div className="P-RSbar-create-post-section">
        <div className="P-RSbar-create-post-header">
          <img 
            src={user?.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
            alt={user?.displayName || 'User'} 
            className="P-RSbar-user-avatar"
          />
          <div className="P-RSbar-post-input-container">
            <textarea
              className="P-RSbar-post-input"
              placeholder="What's on your mind? Use # for hashtags and @ for mentions"
              value={newPost.description}
              onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
              disabled={isLoading}
            />
            {error && <div className="P-RSbar-error-message">{error}</div>}
            <div className="P-RSbar-post-actions">
              <div className="P-RSbar-post-attachments">
                <input
                  type="file"
                  ref={imageInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFileUpload(e, 'image')}
                  disabled={isLoading}
                />
                <button 
                  className="P-RSbar-attachment-btn" 
                  title="Add Photo"
                  onClick={() => imageInputRef.current.click()}
                  disabled={isLoading}
                >
                  <MdPhoto className="icon" />
                </button>
                <button 
                  className="P-RSbar-attachment-btn" 
                  title="Add Location"
                  onClick={() => {}}
                  disabled={isLoading}
                >
                  <MdLocationOn className="icon" />
                </button>
                <input
                  type="text"
                  className="P-RSbar-location-input"
                  placeholder="Add location"
                  value={newPost.location}
                  onChange={(e) => setNewPost({ ...newPost, location: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <button 
                className="P-RSbar-share-post-btn"
                onClick={handlePostSubmit}
                disabled={isLoading || (!newPost.description && !newPost.media)}
              >
                {isLoading ? 'Posting...' : 'Share Post'}
              </button>
            </div>
          </div>
        </div>
        {imagePreview && (
          <div className="P-RSbar-media-preview">
            <img src={imagePreview} alt="Upload preview" />
            <button 
              className="P-RSbar-remove-media"
              onClick={() => {
                setNewPost({ ...newPost, media: null, type: 'image' });
                setImagePreview(null);
              }}
              disabled={isLoading}
            >
              <FaTimes />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Modified PostCard Component for Grid View
  const PostCard = ({ post }) => {
    if (viewMode === 'grid') {
      return (
        <div className="P-RSbar-post-grid-card">
          <div className="P-RSbar-grid-media">
            {post.content.media && post.content.media.length > 0 ? (
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
                <p>{post.content.text.slice(0, 100)}{post.content.text.length > 100 ? '...' : ''}</p>
              </div>
            )}
            <div className="P-RSbar-grid-overlay">
              <div className="P-RSbar-grid-user-info">
                <img 
                  src={post.user.avatar} 
                  alt={post.user.name}
                  className="P-RSbar-grid-avatar"
                />
                <div className="P-RSbar-grid-user-details">
                  <h3>{post.user.name}</h3>
                  <span>{post.timestamp}</span>
                </div>
              </div>
              <div className="P-RSbar-grid-stats">
                <span><FaHeart /> {post.stats.likes}</span>
                <span><FaShare /> {post.stats.shares}</span>
                <span><FaBookmark /> {post.stats.views}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Original list view PostCard
    return (
    <div className="P-RSbar-post-card">
      {/* Post Header */}
      <div className="P-RSbar-post-header">
        <div className="P-RSbar-post-user">
          <img src={post.user.avatar} alt={post.user.name} className="P-RSbar-user-avatar" />
          <div className="P-RSbar-user-details">
            <h3 className="P-RSbar-display-name">{post.user.name}</h3>
            <span className="P-RSbar-username-time">
              {post.user.username} • {post.timestamp}
            </span>
            {post.content.location && (
              <span className="P-RSbar-location">
                <IoLocationOutline />
                {post.content.location}
              </span>
            )}
          </div>
        </div>
        <div className="P-RSbar-menu-container">
          <button 
            className="P-RSbar-menu-button"
            onClick={() => toggleDropdown(post.id)}
          >
            <BsThreeDotsVertical />
          </button>
          {activeDropdown === post.id && (
            <div className="P-RSbar-dropdown-menu">
              <button 
                className="P-RSbar-dropdown-item"
                onClick={() => startEditPost(post)}
              >
                <FaEdit /> Edit Post
              </button>
              <button 
                className="P-RSbar-dropdown-item delete"
                onClick={() => setDeleteConfirm(post.id)}
              >
                <FaTrash /> Delete Post
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="P-RSbar-post-content">
        <p className="P-RSbar-post-text">{post.content.text}</p>
        {post.content.media && post.content.media.length > 0 && (
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
        <div className="P-RSbar-hashtags-container">
          {post.content.hashtags.map(tag => (
            <span key={tag} className="P-RSbar-hashtag">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Post Actions */}
      <div className="P-RSbar-post-actions">
        <button
          className={`P-RSbar-action-button ${post.isLiked ? 'liked' : ''}`}
          onClick={() => handleLike(post.id)}
          data-liked={post.isLiked}
        >
          {post.isLiked ? (
            <FaHeart size={22} />
          ) : (
            <FaRegHeart size={22} />
          )}
          <span className="count">{post.stats.likes}</span>
        </button>
        <button
          className="P-RSbar-action-button share"
          onClick={() => handleShare(post.id)}
        >
          <FaShare size={22} />
          <span className="count">{post.stats.shares}</span>
        </button>
        <button
          className={`P-RSbar-action-button ${post.isFavorite ? 'saved' : ''}`}
          onClick={() => handleFavorite(post.id)}
          data-saved={post.isFavorite}
        >
          {post.isFavorite ? (
            <FaBookmark size={20} />
          ) : (
            <FaRegBookmark size={20} />
          )}
          <span className="count">{post.stats.views}</span>
        </button>
      </div>
    </div>
  );
  };

  // Trending Section Component
  const TrendingSection = () => (
    <div className="P-RSbar-sidebar-section P-RSbar-trending-section">
      <div className="P-RSbar-section-header">
        <h3>
          <FaFire />
          Trending Communities
        </h3>
        <button 
          className="P-RSbar-see-all-btn"
          onClick={() => navigate('/social/communities')}
        >
          See All
          <FaChevronRight />
        </button>
      </div>
      <div className="P-RSbar-trending-posts">
        {[
          {
            id: 1,
            image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=150",
            name: "Photography Masters",
            memberCount: "12.5K",
            category: "Photography",
            isVerified: true
          },
          {
            id: 2,
            image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=150",
            name: "Tech Innovators",
            memberCount: "8.2K",
            category: "Technology",
            isVerified: false
          },
          {
            id: 3,
            image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=150",
            name: "Creative Minds",
            memberCount: "6.7K",
            category: "Art & Design",
            isVerified: true
          }
        ].map(community => (
          <div 
            key={community.id} 
            className="P-RSbar-trending-item"
            onClick={() => navigate(`/social/communities/${community.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <img src={community.image} alt={community.name} loading="lazy" />
            <div className="P-RSbar-trending-info">
              <span className="P-RSbar-trending-category">{community.category}</span>
              <div className="P-RSbar-community-name">
                <h4>{community.name}</h4>
                {community.isVerified && (
                  <FaCheckCircle className="P-RSbar-verified-badge" style={{ color: 'var(--primary-color)', fontSize: '14px' }} />
                )}
              </div>
              <div className="P-RSbar-trending-stats">
                <FaUsers />
                <span>{community.memberCount} members</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Suggested Profiles Component
  const SuggestedProfiles = () => (
    <div className="P-RSbar-sidebar-section P-RSbar-profiles-section">
      <div className="P-RSbar-section-header">
        <h3>
          <FaUserPlus />
          <span>Suggested for You</span>
          {suggestedUsers.length > 0 && (
            <span className="P-RSbar-profile-count">{suggestedUsers.length} new</span>
          )}
        </h3>
        <button 
          className="P-RSbar-see-all-btn"
          onClick={() => navigate('/social/users')}
        >
          See All
          <FaChevronRight />
        </button>
      </div>
      <div className="P-RSbar-profiles-list">
        {loadingSuggestions ? (
          <div className="P-RSbar-loading-suggestions">
            <div className="P-RSbar-loading-spinner"></div>
            <p>Loading suggestions...</p>
          </div>
        ) : suggestedUsers.length > 0 ? (
          suggestedUsers.map(profile => (
            <div key={profile.uid} className="P-RSbar-profile-card">
              <div className="P-RSbar-profile-header">
                <div className="P-RSbar-profile-avatar-wrapper">
                  <img 
                    src={profile.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
                    alt={profile.displayName} 
                    className="P-RSbar-profile-avatar" 
                    loading="lazy" 
                  />
                  <div className="P-RSbar-profile-status online"></div>
                </div>
                <div className="P-RSbar-profile-info">
                  <div 
                    className="P-RSbar-profile-name"
                    onClick={() => navigate(`/social/profile/${profile.username || profile.uid}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <h4>{profile.displayName || 'Anonymous User'}</h4>
                    {profile.isVerified && (
                      <FaCheckCircle className="P-RSbar-verified-badge" title="Verified Account" />
                    )}
                  </div>
                  <span 
                    className="P-RSbar-profile-username"
                    onClick={() => navigate(`/social/profile/${profile.username || profile.uid}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    @{profile.username || 'anonymous'}
                  </span>
                </div>
              </div>

              <p className="P-RSbar-profile-bio">{profile.bio || 'No bio available'}</p>

              {profile.interests && profile.interests.length > 0 && (
                <div className="P-RSbar-profile-tags">
                  {profile.interests.slice(0, 2).map((interest, index) => (
                    <span key={index} className="P-RSbar-profile-tag">
                      <MdTrendingUp />
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              <div className="P-RSbar-profile-stats">
                <div className="P-RSbar-stat-item">
                  <span className="P-RSbar-stat-value">{profile.posts?.length || 0}</span>
                  <span className="P-RSbar-stat-label">Posts</span>
                </div>
                <div className="P-RSbar-stat-divider"></div>
                <div className="P-RSbar-stat-item">
                  <span className="P-RSbar-stat-value">{profile.followers?.length || 0}</span>
                  <span className="P-RSbar-stat-label">Followers</span>
                </div>
              </div>

              <div className="P-RSbar-profile-footer">
                <div className="P-RSbar-mutual-friends" title="Mutual connections">
                  <FaUserFriends />
                  <span>{profile.mutualCount || 0} mutual</span>
                </div>
                <button 
                  className={`P-RSbar-follow-button ${followingUsers.includes(profile.uid) ? 'following' : ''}`}
                  onClick={() => handleFollowUser(profile.uid)}
                >
                  {followingUsers.includes(profile.uid) ? (
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
          <div className="P-RSbar-no-suggestions">
            <p>No suggestions available</p>
          </div>
        )}
      </div>
    </div>
  );

  // Profile Card Component
  const ProfileCard = ({ user }) => {
    if (!user) return null;

    return (
      <div className="P-RSbar-profile-main-card">
        <div className="P-RSbar-profile-main-info">
          <img 
            src={user.profileImageUrl || DEFAULT_PROFILE_IMAGE} 
            alt={user.displayName || 'User'} 
            className="P-RSbar-profile-main-avatar"
            onError={(e) => {
              e.target.src = DEFAULT_PROFILE_IMAGE;
            }}
          />
          <div className="P-RSbar-profile-main-details">
            <h1 className="P-RSbar-profile-main-name">
              {user.displayName || 'Anonymous User'}
              {user.isVerified && (
                <FaCheckCircle style={{ color: 'var(--primary-color)' }} />
              )}
            </h1>
            <div className="P-RSbar-profile-main-username">
              @{user.username || 'anonymous'}
            </div>
            <p className="P-RSbar-profile-main-bio">
              {user.bio || "No bio available"}
            </p>
            <div className="P-RSbar-profile-main-meta">
              {user.location && (
                <div className="P-RSbar-profile-meta-item">
                  <FaMapMarkerAlt />
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="P-RSbar-profile-meta-item">
                  <FaGlobe />
                  <a 
                    href={user.website.startsWith('http') ? user.website : `https://${user.website}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {user.website.replace(/(^\w+:|^)\/\//, '')}
                  </a>
                </div>
              )}
              {user.email && (
                <div className="P-RSbar-profile-meta-item">
                  <MdEmail />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
            {/* Stats Section */}
            <div className="P-RSbar-profile-stats-section">
              <div className="P-RSbar-profile-stat">
                <span className="P-RSbar-stat-value">{posts.length || 0}</span>
                <span className="P-RSbar-stat-label">Posts</span>
              </div>
              <div className="P-RSbar-profile-stat">
                <span className="P-RSbar-stat-value">{user.followers?.length || 0}</span>
                <span className="P-RSbar-stat-label">Followers</span>
              </div>
              <div className="P-RSbar-profile-stat">
                <span className="P-RSbar-stat-value">{user.following?.length || 0}</span>
                <span className="P-RSbar-stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="P-RSbar-posts-page-layout">
      <div className="P-RSbar-posts-container">
        <ProfileCard user={currentUser} />
        <CreatePost />
        
        <div className="P-RSbar-posts-header">
          <h2>Your Posts ({posts.length})</h2>
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
          {postsError && (
            <div className="P-RSbar-error-message">{postsError}</div>
          )}
          {isLoadingPosts ? (
            <div className="P-RSbar-loading-posts">
              <div className="P-RSbar-loading-spinner"></div>
              <p>Loading your posts...</p>
            </div>
          ) : posts.length > 0 ? (
            <div className="P-RSbar-posts-grid">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
            </div>
          ) : (
            <div className="P-RSbar-no-posts">
              <p>You haven't created any posts yet. Share something!</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="P-RSbar-right-sidebar">
        <TrendingSection />
        <SuggestedProfiles />
      </div>

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="P-RSbar-modal-overlay" onClick={closeEditModal}>
          <div className="P-RSbar-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="P-RSbar-modal-header">
              <h2>Edit Post</h2>
              <button className="P-RSbar-modal-close" onClick={closeEditModal}>
                <FaTimes />
              </button>
            </div>
            <div className="P-RSbar-modal-body">
              <textarea
                className="P-RSbar-edit-textarea"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="What's on your mind?"
              />
              <input
                type="text"
                className="P-RSbar-edit-location"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Location"
              />
            </div>
            <div className="P-RSbar-modal-footer">
              <button className="P-RSbar-cancel-btn" onClick={closeEditModal}>
                Cancel
              </button>
              <button 
                className="P-RSbar-save-btn" 
                onClick={() => handleEditPost(editingPost)}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="P-RSbar-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="P-RSbar-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Post?</h3>
            <p>This action cannot be undone.</p>
            <div className="P-RSbar-confirm-actions">
              <button 
                className="P-RSbar-cancel-btn" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="P-RSbar-delete-btn" 
                onClick={() => handleDeletePost(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Posts; 