import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft,
  FiUsers, 
  FiFileText, 
  FiGlobe, 
  FiLock, 
  FiCheck,
  FiPlus,
  FiImage,
  FiVideo,
  FiSmile,
  FiMoreHorizontal,
  FiShare2,
  FiMessageCircle,
  FiHeart,
  FiBookmark
} from 'react-icons/fi';
import { AiOutlineHeart, AiFillHeart } from 'react-icons/ai';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../../contexts/AuthContext';
import communityService from '../../../services/communityService';
import verificationService from '../../../services/verificationService';
import '../styles/CommunityDetail.css';

const CommunityDetail = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    fetchCommunityData();
    if (user) {
      checkVerificationStatus();
    }
  }, [communityId, user]);

  const checkVerificationStatus = async () => {
    if (!user) return;
    
    try {
      const details = await verificationService.getVerificationDetails(user.uid);
      setVerificationDetails(details);
    } catch (error) {
      console.error('Error checking verification:', error);
    }
  };

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch community data
      const communityData = await communityService.getCommunityById(communityId);
      
      // Process community data
      const processedCommunity = {
        ...communityData,
        members: communityData.memberCount || 0,
        posts: communityData.postCount || 0,
        isJoined: user ? communityData.members.includes(user.uid) : false,
        isOwner: user ? communityData.createdBy === user.uid : false,
        admins: communityData.admins || [],
        createdAt: communityData.createdAt?.toDate ? communityData.createdAt.toDate() : new Date()
      };
      
      setCommunity(processedCommunity);
      setIsJoined(processedCommunity.isJoined);
      
      // TODO: Fetch posts for this community
      setPosts([]);
      
    } catch (err) {
      console.error('Error fetching community:', err);
      setError(err.message || 'Failed to load community');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCommunity = async () => {
    if (!user) {
      alert('Please login to join communities');
      return;
    }

    // Check verification for joining (not required for leaving)
    if (!isJoined && verificationDetails && !verificationDetails.isVerified) {
      setShowVerificationModal(true);
      return;
    }

    try {
      if (isJoined) {
        // Leave community
        await communityService.leaveCommunity(communityId, user.uid);
        setIsJoined(false);
        setCommunity(prev => ({
          ...prev,
          members: prev.members - 1
        }));
      } else {
        // Join community
        const result = await communityService.joinCommunity(communityId, user.uid);
        
        if (result.pending) {
          alert('Your request to join this private community has been sent for approval.');
        } else {
          setIsJoined(true);
          setCommunity(prev => ({
            ...prev,
            members: prev.members + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      alert(error.message || 'Failed to update community membership');
    }
  };

  const handleLikePost = (postId) => {
    const newLikedPosts = new Set(likedPosts);
    if (newLikedPosts.has(postId)) {
      newLikedPosts.delete(postId);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: post.likes - 1 } : post
      ));
    } else {
      newLikedPosts.add(postId);
      setPosts(posts.map(post => 
        post.id === postId ? { ...post, likes: post.likes + 1 } : post
      ));
    }
    setLikedPosts(newLikedPosts);
  };

  const handleSavePost = (postId) => {
    const newSavedPosts = new Set(savedPosts);
    if (newSavedPosts.has(postId)) {
      newSavedPosts.delete(postId);
    } else {
      newSavedPosts.add(postId);
    }
    setSavedPosts(newSavedPosts);
  };

  const handleCreatePost = () => {
    if (postContent.trim()) {
      const newPost = {
        id: posts.length + 1,
        userId: 'currentUser',
        user: {
          name: user?.displayName || 'Current User',
          username: user?.username || 'currentuser',
          avatar: user?.profileImageUrl || 'https://randomuser.me/api/portraits/men/20.jpg'
        },
        content: postContent,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date(),
        communityId: communityId
      };
      setPosts([newPost, ...posts]);
      setPostContent('');
      setCommunity(prev => ({ ...prev, posts: prev.posts + 1 }));
    }
  };

  if (loading) {
    return (
      <div className="community-detail-loading">
        <div className="spinner"></div>
        <p>Loading community...</p>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="community-not-found">
        <h2>{error || 'Community not found'}</h2>
        <button onClick={() => navigate('/social/communities')}>Back to Communities</button>
      </div>
    );
  }

  return (
    <div className="community-detail-container">
      {/* Header with back button */}
      <div className="community-detail-header">
        <button className="back-button" onClick={() => navigate('/social/communities')}>
          <FiArrowLeft />
          <span>Back to Communities</span>
        </button>
      </div>

      {/* Community Cover and Info */}
      <div className="community-hero">
        <div className="community-cover-image">
          <img src={community.cover} alt={community.name} />
          <div className="cover-overlay"></div>
        </div>
        
        <div className="community-main-info">
          <div className="community-avatar-large">
            <img src={community.avatar} alt={community.name} />
          </div>
          
          <div className="community-details">
            <div className="community-title-section">
              <h1 className="community-name">{community.name}</h1>
              <div className="community-meta">
                <span className="community-privacy">
                  {community.privacy === 'Private' ? <FiLock /> : <FiGlobe />}
                  {community.privacy} Community
                </span>
                <span className="community-category">{community.category}</span>
              </div>
            </div>
            
            <p className="community-full-description">{community.fullDescription || community.description}</p>
            
            <div className="community-stats-row">
              <div className="stat-item">
                <FiUsers />
                <span className="stat-number">{community.members.toLocaleString()}</span>
                <span className="stat-label">members</span>
              </div>
              <div className="stat-item">
                <FiFileText />
                <span className="stat-number">{community.posts}</span>
                <span className="stat-label">posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Created {formatDistanceToNow(community.createdAt)} ago</span>
              </div>
            </div>
            
            <div className="community-actions">
              <button 
                className={`join-community-btn ${isJoined ? 'joined' : ''} ${!isJoined && verificationDetails && !verificationDetails.isVerified ? 'disabled' : ''}`}
                onClick={handleJoinCommunity}
                title={!isJoined && verificationDetails && !verificationDetails.isVerified ? 
                  `You need more than 10 followers (currently: ${verificationDetails.followers}) and 10 posts (currently: ${verificationDetails.posts}) to join communities` : 
                  ''}
              >
                {isJoined ? (
                  <>
                    <FiCheck />
                    <span>Joined</span>
                  </>
                ) : verificationDetails && !verificationDetails.isVerified ? (
                  <>
                    <FiLock />
                    <span>Join Community</span>
                  </>
                ) : (
                  <>
                    <FiPlus />
                    <span>Join Community</span>
                  </>
                )}
              </button>
              
              <button className="share-community-btn">
                <FiShare2 />
                <span>Share</span>
              </button>
              
              <button className="more-options-btn">
                <FiMoreHorizontal />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Community Content Area */}
      <div className="community-content">
        <div className="content-grid">
          {/* Left Sidebar - Community Info */}
          <div className="community-sidebar">
            <div className="info-card">
              <h3>About</h3>
              <p>{community.description}</p>
            </div>
            
            <div className="info-card">
              <h3>Community Rules</h3>
              <ol className="rules-list">
                {community.rules && community.rules.length > 0 ? (
                  community.rules.map((rule, index) => (
                    <li key={index}>{rule}</li>
                  ))
                ) : (
                  <li>Be respectful to all members</li>
                )}
              </ol>
            </div>
            
            <div className="info-card">
              <h3>Admins</h3>
              <div className="admins-list">
                {community.admins && community.admins.length > 0 ? (
                  community.admins.map((adminId, index) => (
                    <div key={adminId} className="admin-item">
                      <img src={`https://randomuser.me/api/portraits/men/${index + 1}.jpg`} alt="Admin" />
                      <span>Admin</span>
                    </div>
                  ))
                ) : (
                  <div className="admin-item">
                    <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="Owner" />
                    <span>Community Owner</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Posts */}
          <div className="community-posts">
            {/* Create Post (only if joined) */}
            {isJoined && (
              <div className="create-post-card">
                <div className="create-post-header">
                  <img 
                    src={user?.profileImageUrl || "https://randomuser.me/api/portraits/men/20.jpg"} 
                    alt="Your avatar" 
                    className="user-avatar" 
                  />
                  <input
                    type="text"
                    placeholder={`Share something with ${community.name}...`}
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCreatePost()}
                  />
                </div>
                <div className="create-post-actions">
                  <button className="media-button">
                    <FiImage />
                    <span>Photo</span>
                  </button>
                  <button className="media-button">
                    <FiVideo />
                    <span>Video</span>
                  </button>
                  <button className="media-button">
                    <FiSmile />
                    <span>Feeling</span>
                  </button>
                  <button 
                    className="post-button"
                    onClick={handleCreatePost}
                    disabled={!postContent.trim()}
                  >
                    Post
                  </button>
                </div>
              </div>
            )}

            {/* Posts Feed */}
            <div className="posts-list">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="post-header">
                      <div className="post-user-info">
                        <img src={post.user.avatar} alt={post.user.name} className="post-avatar" />
                        <div className="post-meta">
                          <h4>{post.user.name}</h4>
                          <span className="post-username">@{post.user.username}</span>
                          <span className="post-time">· {formatDistanceToNow(post.createdAt)} ago</span>
                        </div>
                      </div>
                      <button className="post-options">
                        <FiMoreHorizontal />
                      </button>
                    </div>
                    
                    <div className="post-content">
                      <p>{post.content}</p>
                      {post.image && (
                        <div className="post-image">
                          <img src={post.image} alt="Post content" />
                        </div>
                      )}
                    </div>
                    
                    <div className="post-actions">
                      <button 
                        className={`action-btn ${likedPosts.has(post.id) ? 'liked' : ''}`}
                        onClick={() => handleLikePost(post.id)}
                      >
                        {likedPosts.has(post.id) ? <AiFillHeart /> : <AiOutlineHeart />}
                        <span>{post.likes}</span>
                      </button>
                      <button className="action-btn">
                        <FiMessageCircle />
                        <span>{post.comments}</span>
                      </button>
                      <button className="action-btn">
                        <FiShare2 />
                        <span>{post.shares}</span>
                      </button>
                      <button 
                        className={`action-btn ${savedPosts.has(post.id) ? 'saved' : ''}`}
                        onClick={() => handleSavePost(post.id)}
                      >
                        {savedPosts.has(post.id) ? <BsBookmarkFill /> : <BsBookmark />}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-posts">
                  <p>{isJoined ? "No posts yet. Be the first to share something!" : "Join this community to see posts"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Required Modal */}
      {showVerificationModal && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="verification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FiUsers className="verification-icon" />
              <h2>Verification Required</h2>
            </div>
            <div className="modal-body">
              <p>Only verified users can join communities. To get verified, you need:</p>
              <ul>
                <li>More than 10 followers</li>
                <li>More than 10 posts</li>
              </ul>
              {verificationDetails && (
                <div className="verification-progress">
                  <p>Your current status:</p>
                  <div className="progress-item">
                    <FiUsers />
                    <span>{verificationDetails.followers} / 10 followers {verificationDetails.followers > 10 ? '✓' : ''}</span>
                  </div>
                  <div className="progress-item">
                    <FiFileText />
                    <span>{verificationDetails.posts} / 10 posts {verificationDetails.posts > 10 ? '✓' : ''}</span>
                  </div>
                  {verificationDetails.meetsRequirements && !verificationDetails.isVerified && (
                    <p className="verification-pending">You meet the requirements! Verification will be processed soon.</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowVerificationModal(false)}>
                Close
              </button>
              <button className="profile-btn" onClick={() => navigate('/social/profile')}>
                Go to Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunityDetail;