import React, { useState, useContext } from 'react';
import { 
  FiUser, FiLock, FiBell, FiEye, FiShield, FiCamera, FiEdit3, 
  FiSave, FiX, FiCheck, FiGlobe, FiMoon, FiSun, FiSmartphone,
  FiMail, FiMapPin, FiCalendar, FiHeart, FiStar, FiSettings,
  FiChevronRight, FiPlus, FiTrash2, FiDownload, FiUpload
} from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import '../styles/Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const { user, updateProfile } = useAuth();
  const { theme, changeTheme, isDark } = useTheme();
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    email: user?.email || '',
    phone: user?.phone || '',
    website: user?.website || '',
    birthDate: user?.birthDate || '',
    language: user?.language || 'English',
    timezone: user?.timezone || 'UTC',
    notifications: {
      posts: true,
      comments: true,
      likes: true,
      follows: true,
      messages: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      allowMessages: true,
      allowComments: true,
      showOnlineStatus: true
    },
    appearance: {
      theme: theme,
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true,
      autoPlayVideos: true
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      deviceManagement: true,
      sessionTimeout: 30
    }
  });

  const tabs = [
    { id: 'account', label: 'Account', icon: FiUser, color: '#00ff88' },
    { id: 'privacy', label: 'Privacy', icon: FiLock, color: '#ff6b6b' },
    { id: 'notifications', label: 'Notifications', icon: FiBell, color: '#4ecdc4' },
    { id: 'appearance', label: 'Appearance', icon: FiEye, color: '#45b7d1' },
    { id: 'security', label: 'Security', icon: FiShield, color: '#96ceb4' }
  ];

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = async () => {
    try {
      let updatedFormData = { ...formData };
      
      // If there's a new profile photo, include it in the update
      if (profilePhoto) {
        updatedFormData.profilePhoto = profilePhoto;
        updatedFormData.photoURL = profilePhotoPreview;
      }
      
      await updateProfile(updatedFormData);
      setIsEditing(false);
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
      setPhotoError('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setPhotoError('Failed to update profile. Please try again.');
    }
  };

  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setPhotoError('Please select a valid image file.');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Image file size should be less than 5MB.');
        return;
      }

      setPhotoUploading(true);
      setPhotoError('');

      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setProfilePhoto(file);
          setProfilePhotoPreview(reader.result);
          setPhotoUploading(false);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error reading file:', error);
        setPhotoError('Failed to process image. Please try again.');
        setPhotoUploading(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setPhotoError('');
    // Reset to default avatar
    setFormData(prev => ({
      ...prev,
      photoURL: '/default-avatar.png'
    }));
  };

  const handleAvatarClick = () => {
    document.getElementById('profile-photo-input').click();
  };

  const renderAccountTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">
            <FiUser />
          </div>
          <div className="section-info">
            <h3>Profile Information</h3>
            <p>Manage your personal information and profile details</p>
          </div>
        </div>
        
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar-section">
              <div className="profile-avatar" onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
                {photoUploading ? (
                  <div className="avatar-loading">
                    <div className="loading-spinner"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <img 
                    src={profilePhotoPreview || user?.photoURL || '/default-avatar.png'} 
                    alt="Profile" 
                  />
                )}
                <div className="avatar-overlay">
                  <FiCamera />
                </div>
              </div>
              <div className="avatar-actions">
                <input
                  id="profile-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoUpload}
                  style={{ display: 'none' }}
                  disabled={photoUploading}
                />
                <button 
                  className="action-btn primary"
                  onClick={handleAvatarClick}
                  disabled={photoUploading}
                >
                  <FiUpload />
                  {photoUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={handleRemovePhoto}
                  disabled={photoUploading}
                >
                  <FiTrash2 />
                  Remove
                </button>
              </div>
              
              {/* Photo Upload Guidelines */}
              <div className="photo-guidelines">
                <h5>📸 Photo Guidelines:</h5>
                <ul>
                  <li>✅ Use a clear, high-quality image</li>
                  <li>✅ Square images work best (1:1 ratio)</li>
                  <li>✅ JPG, PNG, or WEBP format</li>
                  <li>✅ Maximum file size: 5MB</li>
                </ul>
              </div>
              
              {/* Error Message */}
              {photoError && (
                <div className="photo-error">
                  <span className="error-icon">⚠️</span>
                  {photoError}
                </div>
              )}
              
              {/* Success Message */}
              {profilePhotoPreview && (
                <div className="photo-success">
                  <span className="success-icon">✅</span>
                  Photo ready to save! Click "Save Changes" to update your profile.
                </div>
              )}
            </div>
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-value">1,234</span>
                <span className="stat-label">Posts</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">5.6K</span>
                <span className="stat-label">Followers</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">892</span>
                <span className="stat-label">Following</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="form-grid">
          <div className="form-group">
            <label>
              <FiUser />
              Display Name
            </label>
            <input 
              type="text" 
              value={formData.displayName}
              onChange={(e) => handleInputChange(null, 'displayName', e.target.value)}
              placeholder="Enter your display name"
            />
          </div>
          
          <div className="form-group">
            <label>
              <FiUser />
              Username
            </label>
            <input 
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange(null, 'username', e.target.value)}
              placeholder="Enter your username"
            />
          </div>
          
          <div className="form-group full-width">
            <label>
              <FiEdit3 />
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange(null, 'bio', e.target.value)}
              placeholder="Tell us about yourself..."
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label>
              <FiMail />
              Email
            </label>
            <input 
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange(null, 'email', e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-group">
            <label>
              <FiSmartphone />
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange(null, 'phone', e.target.value)}
              placeholder="Enter your phone number"
            />
          </div>
          
          <div className="form-group">
            <label>
              <FiMapPin />
              Location
            </label>
            <input 
              type="text" 
              value={formData.location}
              onChange={(e) => handleInputChange(null, 'location', e.target.value)}
              placeholder="Enter your location"
            />
          </div>
          
          <div className="form-group">
            <label>
              <FiGlobe />
              Website
            </label>
            <input 
              type="url" 
              value={formData.website}
              onChange={(e) => handleInputChange(null, 'website', e.target.value)}
              placeholder="Enter your website URL"
            />
          </div>
          
          <div className="form-group">
            <label>
              <FiCalendar />
              Birth Date
            </label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => handleInputChange(null, 'birthDate', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">
            <FiLock />
          </div>
          <div className="section-info">
            <h3>Privacy Settings</h3>
            <p>Control who can see your information and interact with you</p>
          </div>
        </div>
        
        <div className="privacy-grid">
          <div className="privacy-card">
            <div className="privacy-header">
              <FiEye />
              <h4>Profile Visibility</h4>
            </div>
            <div className="privacy-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="profileVisibility"
                  value="public"
                  checked={formData.privacy.profileVisibility === 'public'}
                  onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="option-content">
                  <span className="option-title">Public</span>
                  <span className="option-description">Anyone can see your profile</span>
                </div>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="profileVisibility"
                  value="friends"
                  checked={formData.privacy.profileVisibility === 'friends'}
                  onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="option-content">
                  <span className="option-title">Friends Only</span>
                  <span className="option-description">Only your friends can see your profile</span>
                </div>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="profileVisibility"
                  value="private"
                  checked={formData.privacy.profileVisibility === 'private'}
                  onChange={(e) => handleInputChange('privacy', 'profileVisibility', e.target.value)}
                />
                <span className="radio-custom"></span>
                <div className="option-content">
                  <span className="option-title">Private</span>
                  <span className="option-description">Only you can see your profile</span>
                </div>
              </label>
            </div>
          </div>
          
          <div className="privacy-card">
            <div className="privacy-header">
              <FiMail />
              <h4>Contact Information</h4>
            </div>
            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Show Email</span>
                  <span className="toggle-description">Allow others to see your email address</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.privacy.showEmail}
                    onChange={(e) => handleInputChange('privacy', 'showEmail', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Show Phone</span>
                  <span className="toggle-description">Allow others to see your phone number</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.privacy.showPhone}
                    onChange={(e) => handleInputChange('privacy', 'showPhone', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="privacy-card">
            <div className="privacy-header">
              <FiHeart />
              <h4>Interaction Settings</h4>
            </div>
            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Allow Messages</span>
                  <span className="toggle-description">Let others send you direct messages</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.privacy.allowMessages}
                    onChange={(e) => handleInputChange('privacy', 'allowMessages', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Allow Comments</span>
                  <span className="toggle-description">Let others comment on your posts</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.privacy.allowComments}
                    onChange={(e) => handleInputChange('privacy', 'allowComments', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Show Online Status</span>
                  <span className="toggle-description">Display when you're online</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.privacy.showOnlineStatus}
                    onChange={(e) => handleInputChange('privacy', 'showOnlineStatus', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">
            <FiBell />
          </div>
          <div className="section-info">
            <h3>Notification Preferences</h3>
            <p>Choose what notifications you want to receive</p>
          </div>
        </div>
        
        <div className="notifications-grid">
          <div className="notification-card">
            <div className="notification-icon">
              <FiHeart />
            </div>
            <div className="notification-content">
              <h4>Likes & Reactions</h4>
              <p>Get notified when someone likes your posts</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.notifications.likes}
                onChange={(e) => handleInputChange('notifications', 'likes', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-card">
            <div className="notification-icon">
              <FiEdit3 />
            </div>
            <div className="notification-content">
              <h4>Comments</h4>
              <p>Get notified when someone comments on your posts</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.notifications.comments}
                onChange={(e) => handleInputChange('notifications', 'comments', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-card">
            <div className="notification-icon">
              <FiUser />
            </div>
            <div className="notification-content">
              <h4>New Followers</h4>
              <p>Get notified when someone follows you</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.notifications.follows}
                onChange={(e) => handleInputChange('notifications', 'follows', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-card">
            <div className="notification-icon">
              <FiMail />
            </div>
            <div className="notification-content">
              <h4>Direct Messages</h4>
              <p>Get notified when you receive new messages</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.notifications.messages}
                onChange={(e) => handleInputChange('notifications', 'messages', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-card">
            <div className="notification-icon">
              <FiStar />
            </div>
            <div className="notification-content">
              <h4>New Posts</h4>
              <p>Get notified about new posts from people you follow</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.notifications.posts}
                onChange={(e) => handleInputChange('notifications', 'posts', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          
          <div className="notification-card">
            <div className="notification-icon">
              <FiSettings />
            </div>
            <div className="notification-content">
              <h4>Marketing & Updates</h4>
              <p>Receive updates about new features and promotions</p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={formData.notifications.marketing}
                onChange={(e) => handleInputChange('notifications', 'marketing', e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">
            <FiEye />
          </div>
          <div className="section-info">
            <h3>Appearance Settings</h3>
            <p>Customize how FeatherGram looks and feels</p>
          </div>
        </div>
        
        <div className="appearance-grid">
          <div className="appearance-card">
            <div className="appearance-header">
              <FiMoon />
              <h4>Theme Selection</h4>
            </div>
            <div className="theme-options">
              <div className="theme-option" onClick={() => changeTheme('light')}>
                <div className={`theme-preview light ${theme === 'light' ? 'active' : ''}`}>
                  <div className="theme-header"></div>
                  <div className="theme-content"></div>
                  <div className="theme-sidebar"></div>
                </div>
                <span>Light Theme</span>
                <div className="theme-description">Clean and bright interface</div>
              </div>
              
              <div className="theme-option" onClick={() => changeTheme('dark')}>
                <div className={`theme-preview dark ${theme === 'dark' ? 'active' : ''}`}>
                  <div className="theme-header"></div>
                  <div className="theme-content"></div>
                  <div className="theme-sidebar"></div>
                </div>
                <span>Dark Theme</span>
                <div className="theme-description">Easy on the eyes</div>
              </div>
              
              <div className="theme-option" onClick={() => changeTheme('system')}>
                <div className={`theme-preview auto ${theme === 'system' ? 'active' : ''}`}>
                  <div className="theme-header"></div>
                  <div className="theme-content"></div>
                  <div className="theme-sidebar"></div>
                </div>
                <span>System Theme</span>
                <div className="theme-description">Follows your device</div>
              </div>
            </div>
            
            <div className="current-theme-info">
              <div className="theme-status-badge">
                <span className="status-label">Current Theme:</span>
                <span className="status-value">{theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}</span>
                {theme === 'system' && (
                  <span className="resolved-theme">({isDark ? 'Dark' : 'Light'} mode)</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="appearance-card">
            <div className="appearance-header">
              <FiSettings />
              <h4>Display Options</h4>
            </div>
            <div className="toggle-group">
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Compact Mode</span>
                  <span className="toggle-description">Reduce spacing for more content</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.appearance.compactMode}
                    onChange={(e) => handleInputChange('appearance', 'compactMode', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Show Animations</span>
                  <span className="toggle-description">Enable smooth animations and transitions</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.appearance.showAnimations}
                    onChange={(e) => handleInputChange('appearance', 'showAnimations', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              
              <div className="toggle-item">
                <div className="toggle-info">
                  <span className="toggle-title">Auto-play Videos</span>
                  <span className="toggle-description">Automatically play videos in feed</span>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.appearance.autoPlayVideos}
                    onChange={(e) => handleInputChange('appearance', 'autoPlayVideos', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="appearance-card">
            <div className="appearance-header">
              <FiSettings />
              <h4>Font Size</h4>
            </div>
            <div className="font-size-options">
              <label className="radio-option">
                <input
                  type="radio"
                  name="fontSize"
                  value="small"
                  checked={formData.appearance.fontSize === 'small'}
                  onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                />
                <span className="radio-custom"></span>
                <span className="option-title">Small</span>
                <span className="option-description">Compact text for more content</span>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="fontSize"
                  value="medium"
                  checked={formData.appearance.fontSize === 'medium'}
                  onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                />
                <span className="radio-custom"></span>
                <span className="option-title">Medium</span>
                <span className="option-description">Balanced readability</span>
              </label>
              
              <label className="radio-option">
                <input
                  type="radio"
                  name="fontSize"
                  value="large"
                  checked={formData.appearance.fontSize === 'large'}
                  onChange={(e) => handleInputChange('appearance', 'fontSize', e.target.value)}
                />
                <span className="radio-custom"></span>
                <span className="option-title">Large</span>
                <span className="option-description">Easy to read text</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="settings-tab-content">
      <div className="settings-section">
        <div className="section-header">
          <div className="section-icon">
            <FiShield />
          </div>
          <div className="section-info">
            <h3>Security Settings</h3>
            <p>Protect your account and manage security preferences</p>
          </div>
        </div>
        
        <div className="security-grid">
          <div className="security-card">
            <div className="security-header">
              <FiShield />
              <h4>Two-Factor Authentication</h4>
            </div>
            <div className="security-content">
              <p>Add an extra layer of security to your account</p>
              <div className="security-status">
                <span className={`status-badge ${formData.security.twoFactorAuth ? 'enabled' : 'disabled'}`}>
                  {formData.security.twoFactorAuth ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <button className="security-btn">
                {formData.security.twoFactorAuth ? 'Manage 2FA' : 'Enable 2FA'}
              </button>
            </div>
          </div>
          
          <div className="security-card">
            <div className="security-header">
              <FiBell />
              <h4>Login Alerts</h4>
            </div>
            <div className="security-content">
              <p>Get notified of suspicious login attempts</p>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={formData.security.loginAlerts}
                  onChange={(e) => handleInputChange('security', 'loginAlerts', e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div className="security-card">
            <div className="security-header">
              <FiSmartphone />
              <h4>Device Management</h4>
            </div>
            <div className="security-content">
              <p>Manage devices connected to your account</p>
              <button className="security-btn secondary">
                View Devices
              </button>
            </div>
          </div>
          
          <div className="security-card">
            <div className="security-header">
              <FiSettings />
              <h4>Session Timeout</h4>
            </div>
            <div className="security-content">
              <p>Set how long before you're automatically logged out</p>
              <select
                value={formData.security.sessionTimeout}
                onChange={(e) => handleInputChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="session-select"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={0}>Never</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return renderAccountTab();
      case 'privacy':
        return renderPrivacyTab();
      case 'notifications':
        return renderNotificationsTab();
      case 'appearance':
        return renderAppearanceTab();
      case 'security':
        return renderSecurityTab();
      default:
        return renderAccountTab();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <div className="header-content">
            <div className="header-title">
              <FiSettings className="header-icon" />
              <h1>Settings</h1>
              <span className="theme-status">
                Theme: {theme} {isDark ? '(Dark)' : '(Light)'}
              </span>
            </div>
            <div className="header-actions">
              <button 
                className="theme-toggle-btn" 
                onClick={() => changeTheme(isDark ? 'light' : 'dark')}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              >
                {isDark ? <FiSun size={20} /> : <FiMoon size={20} />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              {isEditing ? (
                <>
                  <button className="action-btn secondary" onClick={() => setIsEditing(false)}>
                    <FiX />
                    Cancel
                  </button>
                  <button className="action-btn primary" onClick={handleSave}>
                    <FiSave />
                    Save Changes
                  </button>
                </>
              ) : (
                <button className="action-btn primary" onClick={() => setIsEditing(true)}>
                  <FiEdit3 />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="settings-content">
          <div className="settings-sidebar">
            <div className="sidebar-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`sidebar-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="tab-icon" style={{ color: tab.color }}>
                    <tab.icon />
                  </div>
                  <span className="tab-label">{tab.label}</span>
                  <FiChevronRight className="tab-arrow" />
                </button>
              ))}
            </div>
          </div>

          <div className="settings-main">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 