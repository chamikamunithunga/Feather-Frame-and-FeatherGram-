import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiPlus, 
  FiSearch, 
  FiGlobe, 
  FiUsers, 
  FiCompass, 
  FiEye, 
  FiLock, 
  FiFileText, 
  FiTag, 
  FiCheck,
  FiEdit,
  FiSettings,
  FiInfo,
  FiUserCheck
} from 'react-icons/fi';
import CreateCommunityModal from '../components/CreateCommunityModal';
import { useAuth } from '../../../contexts/AuthContext';
import communityService from '../../../services/communityService';
import verificationService from '../../../services/verificationService';
import '../styles/Communities.css';

const Communities = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCommunity, setEditingCommunity] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  // Fetch communities and verification status on component mount
  useEffect(() => {
    fetchCommunities();
    if (user) {
      checkVerificationStatus();
    }
  }, [user]);

  const checkVerificationStatus = async () => {
    if (!user) return;
    
    try {
      setCheckingVerification(true);
      const details = await verificationService.getVerificationDetails(user.uid);
      setVerificationDetails(details);
    } catch (error) {
      console.error('Error checking verification:', error);
    } finally {
      setCheckingVerification(false);
    }
  };

  const fetchCommunities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all communities
      const allCommunities = await communityService.getAllCommunities();
      
      // Process communities to add user-specific flags
      const processedCommunities = allCommunities.map(community => ({
        ...community,
        members: community.memberCount || 0,
        posts: community.postCount || 0,
        isJoined: user ? community.members.includes(user.uid) : false,
        isOwner: user ? community.createdBy === user.uid : false
      }));
      
      setCommunities(processedCommunities);
    } catch (err) {
      console.error('Error fetching communities:', err);
      setError('Failed to load communities. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCommunities = communities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === 'my') {
      return matchesSearch && community.isJoined;
    }
    if (activeTab === 'discover') {
      return matchesSearch && !community.isJoined;
    }
    if (activeTab === 'manage') {
      return matchesSearch && community.isOwner;
    }
    return matchesSearch;
  });

  const handleJoinCommunity = async (communityId) => {
    if (!user) {
      // Redirect to login or show message
      alert('Please login to join communities');
      return;
    }

    try {
      const community = communities.find(g => g.id === communityId);
      
      if (community.isJoined) {
        // Leave community
        await communityService.leaveCommunity(communityId, user.uid);
        setCommunities(communities.map(g => 
          g.id === communityId 
            ? { ...g, isJoined: false, members: g.members - 1 }
            : g
        ));
      } else {
        // Join community
        const result = await communityService.joinCommunity(communityId, user.uid);
        
        if (result.pending) {
          alert('Your request to join this private community has been sent for approval.');
        } else {
          setCommunities(communities.map(g => 
            g.id === communityId 
              ? { ...g, isJoined: true, members: g.members + 1 }
              : g
          ));
        }
      }
    } catch (error) {
      console.error('Error joining/leaving community:', error);
      alert(error.message || 'Failed to update community membership');
    }
  };

  const handleCreateCommunity = async (communityData) => {
    if (!user) {
      alert('Please login to create communities');
      return;
    }

    try {
      const result = await communityService.createCommunity(communityData, user.uid);
      
      if (result.success) {
        // Refresh communities list
        await fetchCommunities();
        setIsCreateModalOpen(false);
        
        // Navigate to the new community
        navigate(`/social/communities/${result.communityId}`);
      }
    } catch (error) {
      console.error('Error creating community:', error);
      alert('Failed to create community. Please try again.');
    }
  };

  const handleEditCommunity = async (communityData) => {
    if (!user || !editingCommunity) {
      return;
    }

    try {
      await communityService.updateCommunity(editingCommunity.id, {
        name: communityData.name,
        description: communityData.description,
        fullDescription: communityData.fullDescription,
        category: communityData.category,
        privacy: communityData.privacy,
        rules: communityData.rules,
        cover: communityData.cover,
        avatar: communityData.avatar
      });
      
      // Refresh communities list
      await fetchCommunities();
      setEditingCommunity(null);
    } catch (error) {
      console.error('Error updating community:', error);
      alert('Failed to update community. Please try again.');
    }
  };

  const openEditModal = (community) => {
    setEditingCommunity(community);
  };

  const handleCreateCommunityClick = () => {
    if (!user) {
      alert('Please login to create communities');
      return;
    }
    
    if (verificationDetails && verificationDetails.isVerified) {
      setIsCreateModalOpen(true);
    } else {
      setShowVerificationModal(true);
    }
  };

  return (
    <div className="communities-container">
      <div className="communities-main">
        <div className="communities-header">
          <div className="header-content">
            <h1>Communities</h1>
            <p>Discover communities that match your interests</p>
          </div>
          {user && verificationDetails && !verificationDetails.isVerified ? (
            <button 
              className="create-community-btn disabled" 
              onClick={handleCreateCommunityClick} 
              title={`You need more than 10 followers (currently: ${verificationDetails.followers}) and 10 posts (currently: ${verificationDetails.posts}) to create communities`}
            >
              <div className="btn-backdrop"></div>
              <div className="btn-content">
                <FiLock />
                <span>Create Community</span>
              </div>
            </button>
          ) : (
            <button className="create-community-btn" onClick={handleCreateCommunityClick}>
              <div className="btn-backdrop"></div>
              <div className="btn-content">
                <FiPlus />
                <span>Create Community</span>
              </div>
            </button>
          )}
        </div>

        <div className="communities-controls">
          <div className="search-wrapper">
            <FiSearch />
            <input
              type="text"
              placeholder="Search communities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="communities-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <FiGlobe />
              <span>All Communities</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
              onClick={() => setActiveTab('my')}
            >
              <FiUsers />
              <span>My Communities</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
              onClick={() => setActiveTab('discover')}
            >
              <FiCompass />
              <span>Discover</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
              onClick={() => setActiveTab('manage')}
            >
              <FiSettings />
              <span>Manage My Communities</span>
            </button>
          </div>
        </div>

        <div className="communities-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <FiUsers />
            </div>
            <div className="stat-info">
              <span className="stat-value">{communities.filter(g => g.isJoined).length}</span>
              <span className="stat-label">Joined Communities</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <FiEye />
            </div>
            <div className="stat-info">
              <span className="stat-value">{filteredCommunities.length}</span>
              <span className="stat-label">Available Communities</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading communities...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchCommunities}>Try Again</button>
          </div>
        ) : (
          <div className="communities-grid">
            {filteredCommunities.map(community => (
            <div key={community.id} className="community-card">
              <div className="community-cover" onClick={() => navigate(`/social/communities/${community.id}`)} style={{ cursor: 'pointer' }}>
                <img src={community.cover} alt={community.name} />
                <div className="community-overlay">
                  <div className="community-privacy">
                    {community.privacy.toLowerCase() === 'private' ? <FiLock /> : <FiGlobe />}
                    <span>{community.privacy}</span>
                  </div>
                </div>
              </div>
              
              <div className="community-content">
                <div className="community-avatar-wrapper">
                  <img src={community.avatar} alt={community.name} className="community-avatar" />
                  {community.isJoined && (
                    <div className="joined-indicator">
                      <FiCheck />
                    </div>
                  )}
                </div>
                
                <div className="community-info">
                  <div className="community-name-wrapper">
                    <h3 className="community-name" onClick={() => navigate(`/social/communities/${community.id}`)} style={{ cursor: 'pointer' }}>{community.name}</h3>
                    {community.isOwner && <span className="owner-badge">Owner</span>}
                  </div>
                  <p className="community-description">{community.description}</p>
                  
                  <div className="community-stats">
                    <div className="stat">
                      <FiUsers />
                      <span>{community.members.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <FiFileText />
                      <span>{community.posts}</span>
                    </div>
                  </div>
                  
                  <div className="community-category">
                    <FiTag />
                    <span>{community.category}</span>
                  </div>
                </div>
                
                <div className="community-actions">
                  {community.isOwner ? (
                    <>
                      <button 
                        className="edit-btn"
                        onClick={() => openEditModal(community)}
                      >
                        <div className="btn-backdrop"></div>
                        <div className="btn-content">
                          <FiEdit />
                          <span>Edit Community</span>
                        </div>
                      </button>
                      
                      <button className="view-btn" onClick={() => navigate(`/social/communities/${community.id}`)}>
                        <FiEye />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        className={`join-btn ${community.isJoined ? 'joined' : ''}`}
                        onClick={() => handleJoinCommunity(community.id)}
                      >
                        <div className="btn-backdrop"></div>
                        <div className="btn-content">
                          {community.isJoined ? (
                            <>
                              <FiCheck />
                              <span>Joined</span>
                            </>
                          ) : (
                            <>
                              <FiPlus />
                              <span>Join Community</span>
                            </>
                          )}
                        </div>
                      </button>
                      
                      <button className="view-btn" onClick={() => navigate(`/social/communities/${community.id}`)}>
                        <FiEye />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {!loading && !error && filteredCommunities.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">
              <FiSearch />
            </div>
            <h3>No communities found</h3>
            <p>Try adjusting your search or explore different categories</p>
          </div>
        )}
      </div>

      {/* Create Community Modal */}
      <CreateCommunityModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateCommunity}
      />

      {/* Edit Community Modal */}
      {editingCommunity && (
        <CreateCommunityModal
          isOpen={true}
          onClose={() => setEditingCommunity(null)}
          onSubmit={handleEditCommunity}
          editMode={true}
          communityData={editingCommunity}
        />
      )}

      {/* Verification Required Modal */}
      {showVerificationModal && (
        <div className="modal-overlay" onClick={() => setShowVerificationModal(false)}>
          <div className="verification-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <FiUserCheck className="verification-icon" />
              <h2>Verification Required</h2>
            </div>
            <div className="modal-body">
              <p>Only verified users can create or join communities. To get verified, you need:</p>
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

export default Communities;