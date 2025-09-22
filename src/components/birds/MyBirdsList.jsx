import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import birdHistoryService from '../../services/birdHistoryService';
import './MyBirdsList.css';

const MyBirdsList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [birds, setBirds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterType, setFilterType] = useState('all'); // all, search, image

  const fetchBirdHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await birdHistoryService.getUserBirdHistory(user.uid);
      setBirds(history);
    } catch (err) {
      console.error('Error fetching bird history:', err);
      setError('Failed to load your bird history');
    } finally {
      setLoading(false);
    }
  };

  const fetchBirdStats = async () => {
    try {
      const statistics = await birdHistoryService.getBirdHistoryStats(user.uid);
      setStats(statistics);
    } catch (err) {
      console.error('Error fetching bird stats:', err);
    }
  };

  useEffect(() => {
    if (user && user.uid) {
      fetchBirdHistory();
      fetchBirdStats();
    }
  }, [user]);

  const handleDeleteBird = async (birdId) => {
    try {
      await birdHistoryService.deleteBirdFromHistory(user.uid, birdId);
      setBirds(birds.filter(bird => bird.id !== birdId));
      setDeleteConfirm(null);
      fetchBirdStats(); // Update stats after deletion
    } catch (err) {
      console.error('Error deleting bird:', err);
      alert('Failed to remove bird from your list');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all your bird history? This action cannot be undone.')) {
      try {
        await birdHistoryService.clearAllBirdHistory(user.uid);
        setBirds([]);
        setStats(null);
        alert('Your bird history has been cleared');
      } catch (err) {
        console.error('Error clearing bird history:', err);
        alert('Failed to clear bird history');
      }
    }
  };

  const handleViewBird = (bird) => {
    // Navigate to bird results page with the stored bird data
    navigate('/bird-results', {
      state: {
        birdData: bird.fullData || {
          common_name: bird.birdName,
          scientific_name: bird.scientificName,
          family: bird.family,
          order: bird.order,
          conservation_status: bird.conservationStatus,
          habitat: bird.habitat,
          distribution: bird.distribution,
          description: bird.description,
          image_url: bird.imageUrl
        },
        searchType: bird.searchType
      }
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    
    // Handle Firestore timestamp
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Unknown date';
    }

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes <= 1 ? 'Just now' : `${diffMinutes} minutes ago`;
      }
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFilteredBirds = () => {
    if (filterType === 'all') return birds;
    return birds.filter(bird => bird.searchType === filterType);
  };

  if (loading) {
    return (
      <div className="my-birds-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading your bird collection...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-birds-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchBirdHistory} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredBirds = getFilteredBirds();

  return (
    <div className="my-birds-page">
      <div className="my-birds-container">
        {/* Header */}
        <div className="my-birds-header">
          <button onClick={() => navigate('/ai')} className="back-button">
            ← Back to Search
          </button>
          <h1>My Bird Collection</h1>
          {birds.length > 0 && (
            <button onClick={handleClearAll} className="clear-all-button">
              Clear All
            </button>
          )}
        </div>

        {/* Stats Section */}
        {stats && (
          <div className="birds-stats-section">
            <div className="stats-card">
              <div className="stat-value">{stats.totalBirds}</div>
              <div className="stat-label">Total Birds</div>
            </div>
            <div className="stats-card">
              <div className="stat-value">{stats.searchCount}</div>
              <div className="stat-label">Searched</div>
            </div>
            <div className="stats-card">
              <div className="stat-value">{stats.imageUploadCount}</div>
              <div className="stat-label">Identified</div>
            </div>
            <div className="stats-card">
              <div className="stat-value">{stats.uniqueFamiliesCount}</div>
              <div className="stat-label">Families</div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        {birds.length > 0 && (
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All ({birds.length})
            </button>
            <button 
              className={`filter-tab ${filterType === 'search' ? 'active' : ''}`}
              onClick={() => setFilterType('search')}
            >
              Searched ({stats?.searchCount || 0})
            </button>
            <button 
              className={`filter-tab ${filterType === 'image' ? 'active' : ''}`}
              onClick={() => setFilterType('image')}
            >
              Identified ({stats?.imageUploadCount || 0})
            </button>
          </div>
        )}

        {/* Birds Grid */}
        {filteredBirds.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🦅</div>
            <h2>No birds in your collection yet</h2>
            <p>
              {filterType === 'all' 
                ? 'Start searching for birds or upload images to build your collection!'
                : `No birds found for ${filterType === 'search' ? 'searches' : 'image identifications'}`}
            </p>
            <button onClick={() => navigate('/ai')} className="start-button">
              Start Exploring
            </button>
          </div>
        ) : (
          <div className="birds-grid">
            {filteredBirds.map((bird) => (
              <div key={bird.id} className="bird-card">
                {/* Delete Confirmation Modal */}
                {deleteConfirm === bird.id && (
                  <div className="delete-confirm-overlay">
                    <div className="delete-confirm-content">
                      <p>Remove this bird from your collection?</p>
                      <div className="confirm-buttons">
                        <button onClick={() => handleDeleteBird(bird.id)} className="confirm-yes">
                          Yes
                        </button>
                        <button onClick={() => setDeleteConfirm(null)} className="confirm-no">
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bird Image */}
                <div className="bird-image-container" onClick={() => handleViewBird(bird)}>
                  {bird.imageUrl ? (
                    <img src={bird.imageUrl} alt={bird.birdName} className="bird-image" />
                  ) : (
                    <div className="bird-placeholder">
                      <span className="placeholder-icon">🦅</span>
                    </div>
                  )}
                  <div className="search-type-badge">
                    {bird.searchType === 'image' ? '📸' : '🔍'}
                  </div>
                </div>

                {/* Bird Info */}
                <div className="bird-info">
                  <h3 className="bird-name">{bird.birdName}</h3>
                  {bird.scientificName && (
                    <p className="bird-scientific-name">{bird.scientificName}</p>
                  )}
                  {bird.conservationStatus && (
                    <span className="conservation-badge">{bird.conservationStatus}</span>
                  )}
                  <p className="bird-date">
                    {bird.lastViewedAt ? `Last viewed: ${formatDate(bird.timestamp)}` : formatDate(bird.timestamp)}
                  </p>
                  {bird.viewCount && bird.viewCount > 1 && (
                    <p className="view-count">Viewed {bird.viewCount} times</p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="card-actions">
                  <button onClick={() => handleViewBird(bird)} className="view-button">
                    View Details
                  </button>
                  <button onClick={() => setDeleteConfirm(bird.id)} className="delete-button">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBirdsList;