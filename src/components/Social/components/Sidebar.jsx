import React, { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import CreatePostModal from './CreatePostModal';
import '../styles/Sidebar.css';
import { 
  HiHome,
  HiOutlinePlus,
  HiCog
} from 'react-icons/hi';
import { MdVerified } from 'react-icons/md';
import {
  MdExplore,
  MdPhotoLibrary,
  MdGroups,
  MdStore,
  MdChevronLeft,
  MdChevronRight
} from 'react-icons/md';
import {
  BsChat,
  BsHeart,
  BsFeather
} from 'react-icons/bs';
import { useAuth } from '../../../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(() => {
    // Initialize based on screen size - default to expanded on desktop
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768;
    }
    return false;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  // Close sidebar when clicking on a nav item (mobile only)
  const handleNavClick = (e) => {
    console.log('Nav item clicked', e.currentTarget.href);
    if (window.innerWidth <= 768) {
      setIsExpanded(false);
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        // On mobile, always collapse
        setIsExpanded(false);
      }
      // On desktop, keep the current state (don't auto-expand)
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toggle sidebar (works on all screen sizes)
  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const menuItems = [
    { path: '/', icon: <HiHome size={20} />, label: 'Back to Home', notifications: 0, isMain: true },
    { path: '/social', icon: <MdExplore size={20} />, label: 'Explore', notifications: 0, isMain: true },
    { path: '/social/profile', icon: <MdPhotoLibrary size={20} />, label: 'Profile', notifications: 0, isMain: true },
    { path: '/social/messages', icon: <BsChat size={20} />, label: 'Messages', notifications: 0, isMain: true },
    { path: '/social/marketplace', icon: <MdStore size={20} />, label: 'Market', notifications: 0, isMain: false },
    { path: '/social/communities', icon: <MdGroups size={20} />, label: 'Communities', notifications: 0, isMain: false },
    { path: '/social/favorites', icon: <BsHeart size={20} />, label: 'Saved', notifications: 0, isMain: false },
    { path: '/social/settings', icon: <HiCog size={20} />, label: 'Settings', notifications: 0, isMain: false }
  ];

  const mainMenuItems = menuItems.filter(item => item.isMain);
  const secondaryMenuItems = menuItems.filter(item => !item.isMain);

  return (
    <>
      <div className={`modern-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        {/* Mobile Overlay */}
        <div 
          className={`sidebar-overlay ${isExpanded ? 'active' : ''}`}
          onClick={() => setIsExpanded(false)}
        ></div>

        <div className="sidebar-container">
          {/* Header */}
          <div className="sidebar-header">
            <div className="logo-section">
              <div className="logo-icon">
                <BsFeather size={24} />
              </div>
              <span className="logo-text">FeatherGram</span>
            </div>
            <button 
              className="sidebar-toggle"
              onClick={toggleSidebar}
              title={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isExpanded ? <MdChevronLeft size={20} /> : <MdChevronRight size={20} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-navigation">
            {/* Main Menu Items */}
            <div className="nav-section">
              {mainMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={handleNavClick}
                  title={!isExpanded ? item.label : ""}
                >
                  <div className="nav-icon-wrapper">
                    <div className="nav-icon">
                      {item.icon}
                    </div>
                    {item.notifications > 0 && (
                      <span className="notification-dot">
                        {item.notifications > 9 ? '9+' : item.notifications}
                      </span>
                    )}
                  </div>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Separator */}
            <div className="nav-separator"></div>

            {/* Secondary Menu Items */}
            <div className="nav-section">
              {secondaryMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                  onClick={handleNavClick}
                  title={!isExpanded ? item.label : ""}
                >
                  <div className="nav-icon-wrapper">
                    <div className="nav-icon">
                      {item.icon}
                    </div>
                    {item.notifications > 0 && (
                      <span className="notification-dot">
                        {item.notifications > 9 ? '9+' : item.notifications}
                      </span>
                    )}
                  </div>
                  <span className="nav-label">{item.label}</span>
                </Link>
              ))}
            </div>
          </nav>

          {/* Create Post Button */}
          <div className="sidebar-actions">
            <button 
              className="create-post-button"
              onClick={() => setIsModalOpen(true)}
              title={!isExpanded ? "Create Post" : ""}
            >
              <HiOutlinePlus size={20} />
              <span>Create Post</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="sidebar-profile">
            <div className="profile-info">
              <div className="profile-avatar">
                <img 
                  src={user?.profileImageUrl || "https://via.placeholder.com/40x40"} 
                  alt={user?.displayName || "Profile"} 
                />
                <div className="status-indicator"></div>
              </div>
              <div className="profile-details">
                <div className="profile-name">
                  {user?.displayName || "Guest User"}
                  {user?.isVerified && (
                    <MdVerified className="verified-badge" />
                  )}
                </div>
                <div className="profile-username">@{user?.username || "guest"}</div>
              </div>
            </div>
            <button className="profile-menu-button" title={!isExpanded ? "Profile menu" : ""}>
              <div className="menu-dots">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toggle Button */}
      <button 
        className={`mobile-sidebar-toggle ${isExpanded ? 'active' : ''}`}
        onClick={() => {
          console.log('Mobile toggle clicked, current state:', isExpanded);
          setIsExpanded(!isExpanded);
        }}
      >
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
        <div className="hamburger-line"></div>
      </button>

      <CreatePostModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
};

export default Sidebar; 