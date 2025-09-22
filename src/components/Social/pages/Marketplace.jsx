import React, { useState, useEffect } from 'react';
import { 
  FiSearch, 
  FiStar, 
  FiArrowRight, 
  FiMapPin, 
  FiGlobe, 
  FiShoppingBag,
  FiFilter,
  FiExternalLink,
  FiPhone,
  FiMail,
  FiClock,
  FiHeart,
  FiShare2,
  FiTrendingUp,
  FiAward,
  FiCheckCircle
} from 'react-icons/fi';
import '../styles/Marketplace.css';
import { shopService } from '../../../services/shopService';

const Marketplace = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('featured'); // 'featured', 'rating', 'name'

  // Load shops from Firebase on component mount
  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const shopsData = await shopService.getAllShops();
      setShops(shopsData);
    } catch (error) {
      setError('Failed to load shops. Please try again.');
      console.error('Error loading shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'all', label: 'All Categories', icon: '📷' },
    { value: 'Camera Store', label: 'Camera Stores', icon: '📸' },
    { value: 'Official Brand Store', label: 'Brand Stores', icon: '🏢' },
    { value: 'Pro Equipment', label: 'Pro Equipment', icon: '🎥' },
    { value: 'Electronics', label: 'Electronics', icon: '💻' },
    { value: 'Premium Store', label: 'Premium', icon: '⭐' },
    { value: 'Full Service', label: 'Full Service', icon: '🔧' }
  ];

  const filteredShops = shops.filter(shop => {
    const matchesSearch = shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shop.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || shop.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Sort shops based on selected criteria
  const sortedShops = [...filteredShops].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'featured':
      default:
        return b.featured - a.featured;
    }
  });

  const featuredShops = sortedShops.filter(shop => shop.featured);
  const regularShops = sortedShops.filter(shop => !shop.featured);

  const handleShopClick = (website) => {
    window.open(website, '_blank');
  };

  const handleContact = (type, contact) => {
    switch (type) {
      case 'phone':
        window.open(`tel:${contact}`, '_self');
        break;
      case 'email':
        window.open(`mailto:${contact}`, '_self');
        break;
      case 'website':
        window.open(contact, '_blank');
        break;
      default:
        break;
    }
  };

  return (
    <div className="marketplace-container">
      <div className="marketplace-main">
        {/* Hero Section */}
        <div className="marketplace-hero">
          <div className="hero-content">
            <div className="hero-badge">
              <FiTrendingUp />
              <span>Trending Now</span>
            </div>
            <h1 className="hero-title">
              Camera Shops 
              <span className="gradient-text">Marketplace</span>
            </h1>
            <p className="hero-subtitle">
              Discover the best camera shops and photography equipment stores across Sri Lanka. 
              Find verified stores with premium gear and expert service.
            </p>
            <div className="hero-stats">
              <div className="stat-card">
                <FiShoppingBag />
                <div className="stat-info">
                  <span className="stat-number">{shops.length}</span>
                  <span className="stat-label">Shops</span>
                </div>
              </div>
              <div className="stat-card">
                <FiMapPin />
                <div className="stat-info">
                  <span className="stat-number">25+</span>
                  <span className="stat-label">Cities</span>
                </div>
              </div>
              <div className="stat-card">
                <FiAward />
                <div className="stat-info">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Verified</span>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <FiShoppingBag />
              <span>Premium Gear</span>
            </div>
            <div className="floating-card">
              <FiStar />
              <span>Top Rated</span>
            </div>
            <div className="floating-card">
              <FiCheckCircle />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="loading-state">
            <div className="loading-spinner">
              <FiShoppingBag />
            </div>
            <h3>Loading Marketplace</h3>
            <p>Discovering the best camera shops for you...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <div className="error-icon">
              <FiShoppingBag />
            </div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button onClick={loadShops} className="retry-button">
              <FiArrowRight />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Enhanced Controls Section */}
            <div className="marketplace-controls">
              <div className="controls-left">
                <div className="search-wrapper">
                  <FiSearch />
                  <input
                    type="text"
                    placeholder="Search shops, brands, or locations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>

                <div className="filter-wrapper">
                  <FiFilter />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="category-filter"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="controls-right">
                <div className="view-toggle">
                  <button 
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Grid View"
                  >
                    <div className="grid-icon"></div>
                  </button>
                  <button 
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="List View"
                  >
                    <div className="list-icon"></div>
                  </button>
                </div>

                <div className="sort-wrapper">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="sort-filter"
                  >
                    <option value="featured">Featured First</option>
                    <option value="rating">Highest Rated</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Featured Shops Section */}
            {featuredShops.length > 0 && (
              <section className="featured-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <FiStar />
                    Featured Shops
                    <span className="section-badge">{featuredShops.length}</span>
                  </h2>
                  <p className="section-description">
                    Top-rated camera shops with premium equipment and excellent service
                  </p>
                </div>
                <div className={`shops-grid ${viewMode} featured-grid`}>
                  {featuredShops.map(shop => (
                    <ShopCard 
                      key={shop.id} 
                      shop={shop} 
                      onShopClick={handleShopClick}
                      onContact={handleContact}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All Shops Section */}
            {regularShops.length > 0 && (
              <section className="regular-section">
                <div className="section-header">
                  <h2 className="section-title">
                    <FiShoppingBag />
                    All Shops
                    <span className="section-badge">{regularShops.length}</span>
                  </h2>
                  <p className="section-description">
                    Complete directory of camera shops and photography equipment stores
                  </p>
                </div>
                <div className={`shops-grid ${viewMode}`}>
                  {regularShops.map(shop => (
                    <ShopCard 
                      key={shop.id} 
                      shop={shop} 
                      onShopClick={handleShopClick}
                      onContact={handleContact}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Empty States */}
            {filteredShops.length === 0 && shops.length > 0 && (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiSearch />
                </div>
                <h3>No shops found</h3>
                <p>Try adjusting your search terms or category filter to find what you're looking for</p>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="clear-filters-btn"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {shops.length === 0 && !loading && !error && (
              <div className="empty-state">
                <div className="empty-icon">
                  <FiShoppingBag />
                </div>
                <h3>No shops available</h3>
                <p>Check back later for camera shops in your area. We're constantly adding new verified stores.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const ShopCard = ({ shop, onShopClick, onContact, viewMode }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: shop.name,
        text: shop.description,
        url: shop.website
      });
    } else {
      navigator.clipboard.writeText(shop.website);
    }
  };

  return (
    <div 
      className={`shop-card ${shop.featured ? 'featured' : ''} ${viewMode}`}
      onClick={() => onShopClick(shop.website)}
    >
      <div className="shop-image">
        <img src={shop.image} alt={shop.name} />
        <div className="shop-overlay">
          <div className="shop-badges">
            {shop.verified && (
              <div className="verified-badge">
                <FiCheckCircle />
                <span>Verified</span>
              </div>
            )}
            <div className="category-badge">
              {shop.category}
            </div>
          </div>
          <div className="shop-actions-overlay">
            <button 
              className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
              title={isLiked ? 'Remove from favorites' : 'Add to favorites'}
            >
              <FiHeart />
            </button>
            <button 
              className="action-btn share-btn"
              onClick={handleShare}
              title="Share shop"
            >
              <FiShare2 />
            </button>
          </div>
        </div>
        {shop.featured && (
          <div className="featured-indicator">
            <FiStar />
            <span>Featured</span>
          </div>
        )}
      </div>
      
      <div className="shop-content">
        <div className="shop-header">
          <h3 className="shop-name">{shop.name}</h3>
          <div className="shop-rating">
            <FiStar />
            <span>{shop.rating}</span>
          </div>
        </div>
        
        <p className="shop-description">{shop.description}</p>
        
        <div className="shop-details">
          <div className="detail-item">
            <FiMapPin />
            <span>{shop.location}</span>
          </div>
          <div className="detail-item">
            <FiClock />
            <span>{shop.hours}</span>
          </div>
        </div>
        
        <div className="shop-actions">
          <button className="visit-shop-btn primary">
            <div className="btn-backdrop"></div>
            <div className="btn-content">
              <span>Visit Shop</span>
              <FiExternalLink />
            </div>
          </button>
          
          <div className="contact-actions">
            <button 
              className="contact-btn" 
              title="Call"
              onClick={(e) => {
                e.stopPropagation();
                onContact('phone', shop.phone);
              }}
            >
              <FiPhone />
            </button>
            <button 
              className="contact-btn" 
              title="Email"
              onClick={(e) => {
                e.stopPropagation();
                onContact('email', shop.email);
              }}
            >
              <FiMail />
            </button>
            <button 
              className="contact-btn" 
              title="Website"
              onClick={(e) => {
                e.stopPropagation();
                onContact('website', shop.website);
              }}
            >
              <FiGlobe />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketplace; 