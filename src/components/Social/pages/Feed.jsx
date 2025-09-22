import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import followService from '../../../services/followService';
import '../styles/Feed.css';

const DEFAULT_PROFILE_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2358f193'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const Feed = () => {
  const [activeTab, setActiveTab] = useState('foryou');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState([]);
  const { user: currentUser } = useAuth();
  const { showError } = useToast();

  // Helper function to format timestamps
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
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

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setIsLoading(true);

        // Get posts from Firebase
        const postsRef = collection(db, 'posts');
        const postsQuery = query(postsRef, orderBy('createdAt', 'desc'));
        const postsSnapshot = await getDocs(postsQuery);

        // Get all user data for posts
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const usersMap = {};
        usersSnapshot.docs.forEach(doc => {
          usersMap[doc.data().uid] = doc.data();
        });

        // Map posts with user data
        const postsData = postsSnapshot.docs.map(doc => {
          const postData = doc.data();
          const userData = usersMap[postData.userId];
          
          return {
            id: doc.id,
            ...postData,
            user: {
              name: userData?.displayName || 'Unknown User',
              username: userData?.username || 'unknown',
              avatar: userData?.profileImageUrl || DEFAULT_PROFILE_IMAGE,
              isVerified: userData?.isVerified || false
            }
          };
        });

        setPosts(postsData);

        // Get following list for current user
        if (currentUser) {
          const following = await followService.getFollowing(currentUser.uid);
          setFollowingUsers(following);
        }

      } catch (err) {
        console.error('Error fetching posts:', err);
        showError('Failed to load posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser, showError]);

  // Filter posts based on active tab
  const filteredPosts = activeTab === 'following' && currentUser
    ? posts.filter(post => 
        followingUsers.includes(post.userId) || post.userId === currentUser.uid
      )
    : posts;

  const stories = [
    {
      id: 1,
      user: {
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop'
      },
      image: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop'
    },
    {
      id: 2,
      user: {
        name: 'Lisa Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop'
      },
      image: 'https://images.unsplash.com/photo-1682961941145-e73293f71c9f?w=600&h=600&fit=crop'
    },
    {
      id: 3,
      user: {
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop'
      },
      image: 'https://images.unsplash.com/photo-1682686580003-82051c1c9529?w=600&h=600&fit=crop'
    }
  ];

  return (
    <div className="feed">
      <div className="feed-header">
        <div className="feed-tabs">
          <button
            className={`tab-button ${activeTab === 'foryou' ? 'active' : ''}`}
            onClick={() => setActiveTab('foryou')}
          >
            For You
          </button>
          <button
            className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            Following
          </button>
        </div>
      </div>


      <div className="create-post-container">
        <div className="post-input-wrapper">
          <input 
            type="text" 
            placeholder="What's on your mind?" 
            className="post-input"
          />
          <button className="photo-video-btn">
            Photo/Video
          </button>
        </div>
        <button className="share-post-btn">
          Share Post
        </button>
      </div>

      <div className="posts-container">
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="no-posts">
            {activeTab === 'following' ? (
              <>
                <h3>No posts from people you follow</h3>
                <p>Follow some users to see their posts here, or switch to "For You" to see all posts.</p>
              </>
            ) : (
              <>
                <h3>No posts yet</h3>
                <p>Be the first to share something!</p>
              </>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-header">
                <div className="post-user">
                  <img 
                    src={post.user.avatar} 
                    alt={post.user.name}
                    onError={(e) => {
                      e.target.src = DEFAULT_PROFILE_IMAGE;
                    }}
                  />
                  <div className="user-info">
                    <h3>
                      {post.user.name}
                      {post.user.isVerified && (
                        <i className="fas fa-check-circle verified" title="Verified Account"></i>
                      )}
                    </h3>
                    <span>@{post.user.username} • {formatTimestamp(post.createdAt)}</span>
                  </div>
                </div>
                <button className="post-menu">
                  <i className="fas fa-ellipsis-h"></i>
                </button>
              </div>

              <div className="post-content">
                {post.content?.text && (
                  <p className="post-description">{post.content.text}</p>
                )}
                {post.content?.media && post.content.media.length > 0 && (
                  <div className="post-image">
                    <img 
                      src={post.content.media[0].url} 
                      alt="Post content"
                      style={{
                        aspectRatio: post.content.media[0].aspectRatio || '1',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                )}
                {post.hashtags && post.hashtags.length > 0 && (
                  <div className="post-hashtags">
                    {post.hashtags.map(tag => (
                      <span key={tag} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="post-actions">
                <button className="action-button">
                  <i className="far fa-heart"></i>
                  <span>{(post.metrics?.likes || 0).toLocaleString()}</span>
                </button>
                <button className="action-button">
                  <i className="far fa-comment"></i>
                  <span>{(post.metrics?.comments || 0).toLocaleString()}</span>
                </button>
                <button className="action-button">
                  <i className="far fa-share-square"></i>
                  <span>{(post.metrics?.shares || 0).toLocaleString()}</span>
                </button>
                <button className="action-button bookmark">
                  <i className="far fa-bookmark"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Feed; 