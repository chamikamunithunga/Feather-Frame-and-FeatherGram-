import React, { useState, useRef } from 'react';
import { 
  FiX, 
  FiUpload, 
  FiPlus, 
  FiTrash2, 
  FiGlobe, 
  FiLock,
  FiImage,
  FiLoader
} from 'react-icons/fi';
import { uploadCommunityImage } from '../../../config/cloudinary';
import '../styles/CreateCommunityModal.css';

const CreateCommunityModal = ({ isOpen, onClose, onSubmit, editMode = false, communityData = null }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: communityData?.name || '',
    description: communityData?.description || '',
    fullDescription: communityData?.fullDescription || '',
    category: communityData?.category || '',
    privacy: communityData?.privacy || 'Public',
    rules: communityData?.rules || [''],
    coverImage: communityData?.cover || null,
    avatarImage: communityData?.avatar || null
  });

  const [coverPreview, setCoverPreview] = useState(communityData?.cover || null);
  const [avatarPreview, setAvatarPreview] = useState(communityData?.avatar || null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);

  // Categories for dropdown
  const categories = [
    'Technology',
    'Photography',
    'Art & Design',
    'Music',
    'Gaming',
    'Sports',
    'Education',
    'Business',
    'Health & Fitness',
    'Food & Cooking',
    'Travel',
    'Lifestyle',
    'Entertainment',
    'Science',
    
  ];

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle privacy toggle
  const handlePrivacyToggle = () => {
    setFormData(prev => ({
      ...prev,
      privacy: prev.privacy === 'Public' ? 'Private' : 'Public'
    }));
  };

  // Handle rule changes
  const handleRuleChange = (index, value) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData(prev => ({
      ...prev,
      rules: newRules
    }));
  };

  // Add new rule
  const addRule = () => {
    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, '']
    }));
  };

  // Remove rule
  const removeRule = (index) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      rules: newRules.length > 0 ? newRules : ['']
    }));
  };

  // Handle image upload
  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({
          ...prev,
          [type]: 'Image size should be less than 5MB'
        }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'cover') {
          setCoverPreview(reader.result);
          setFormData(prev => ({
            ...prev,
            coverImage: file
          }));
        } else {
          setAvatarPreview(reader.result);
          setFormData(prev => ({
            ...prev,
            avatarImage: file
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Community name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Short description is required';
    }
    if (!formData.fullDescription.trim()) {
      newErrors.fullDescription = 'Full description is required';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (formData.rules.filter(rule => rule.trim()).length === 0) {
      newErrors.rules = 'Add at least one community rule';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty rules
      const filteredRules = formData.rules.filter(rule => rule.trim());
      
      let coverUrl = communityData?.cover || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800';
      let avatarUrl = communityData?.avatar || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=100';
      
      // Upload cover image if a new one was selected
      if (formData.coverImage instanceof File) {
        try {
          setUploadingCover(true);
          const coverResult = await uploadCommunityImage(formData.coverImage, 'cover');
          coverUrl = coverResult.url;
        } catch (error) {
          console.error('Cover upload error:', error);
          setErrors({ submit: 'Failed to upload cover image. Please try again.' });
          return;
        } finally {
          setUploadingCover(false);
        }
      }
      
      // Upload avatar image if a new one was selected
      if (formData.avatarImage instanceof File) {
        try {
          setUploadingAvatar(true);
          const avatarResult = await uploadCommunityImage(formData.avatarImage, 'avatar');
          avatarUrl = avatarResult.url;
        } catch (error) {
          console.error('Avatar upload error:', error);
          setErrors({ submit: 'Failed to upload avatar image. Please try again.' });
          return;
        } finally {
          setUploadingAvatar(false);
        }
      }
      
      // Prepare data for submission
      const submitData = {
        name: formData.name,
        description: formData.description,
        fullDescription: formData.fullDescription,
        category: formData.category,
        privacy: formData.privacy,
        rules: filteredRules,
        cover: coverUrl,
        avatar: avatarUrl
      };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: error.message || 'Failed to create community. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ccm-modal-overlay" onClick={onClose}>
      <div className="ccm-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="ccm-modal-header">
          <h2>{editMode ? 'Edit Community' : 'Create New Community'}</h2>
          <button className="ccm-close-button" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="ccm-create-community-form">
          {/* Cover Image Upload */}
          <div className="ccm-image-upload-section">
            <div className="ccm-cover-upload">
              <label>Cover Image</label>
              <div 
                className={`ccm-cover-preview ${uploadingCover ? 'uploading' : ''}`}
                onClick={() => !uploadingCover && coverInputRef.current?.click()}
              >
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" />
                ) : (
                  <div className="ccm-upload-placeholder">
                    <FiImage />
                    <span>Click to upload cover image</span>
                  </div>
                )}
                {uploadingCover ? (
                  <div className="ccm-upload-loading">
                    <FiLoader className="ccm-spinner" />
                    <span>Uploading...</span>
                  </div>
                ) : (
                  <div className="ccm-upload-overlay">
                    <FiUpload />
                    <span>Change Cover</span>
                  </div>
                )}
              </div>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'cover')}
                hidden
              />
              {errors.cover && <span className="ccm-error-message">{errors.cover}</span>}
            </div>

            {/* Avatar Upload */}
            <div className="ccm-avatar-upload-wrapper">
              <label>Community Avatar</label>
              <div 
                className={`ccm-avatar-upload ${uploadingAvatar ? 'uploading' : ''}`}
                onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
              >
                {uploadingAvatar ? (
                  <div className="ccm-avatar-loading">
                    <FiLoader className="ccm-spinner" />
                  </div>
                ) : avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" />
                ) : (
                  <div className="ccm-avatar-placeholder">
                    <FiUpload />
                  </div>
                )}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, 'avatar')}
                hidden
              />
            </div>
          </div>

          {/* Community Name */}
          <div className="ccm-form-group">
            <label htmlFor="name">Community Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter community name"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="ccm-error-message">{errors.name}</span>}
          </div>

          {/* Short Description */}
          <div className="ccm-form-group">
            <label htmlFor="description">Short Description *</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description (shown in community cards)"
              maxLength={100}
              className={errors.description ? 'error' : ''}
            />
            <span className="ccm-char-count">{formData.description.length}/100</span>
            {errors.description && <span className="ccm-error-message">{errors.description}</span>}
          </div>

          {/* Full Description */}
          <div className="ccm-form-group">
            <label htmlFor="fullDescription">Full Description *</label>
            <textarea
              id="fullDescription"
              name="fullDescription"
              value={formData.fullDescription}
              onChange={handleInputChange}
              placeholder="Detailed description of your community"
              rows={4}
              className={errors.fullDescription ? 'error' : ''}
            />
            {errors.fullDescription && <span className="ccm-error-message">{errors.fullDescription}</span>}
          </div>

          {/* Category and Privacy */}
          <div className="ccm-form-row">
            <div className="ccm-form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={errors.category ? 'error' : ''}
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <span className="ccm-error-message">{errors.category}</span>}
            </div>

            <div className="ccm-form-group">
              <label>Privacy Setting</label>
              <div className="ccm-privacy-toggle">
                <button
                  type="button"
                  className={`ccm-privacy-option ${formData.privacy === 'Public' ? 'active' : ''}`}
                  onClick={() => formData.privacy !== 'Public' && handlePrivacyToggle()}
                >
                  <FiGlobe />
                  <span>Public</span>
                </button>
                <button
                  type="button"
                  className={`ccm-privacy-option ${formData.privacy === 'Private' ? 'active' : ''}`}
                  onClick={() => formData.privacy !== 'Private' && handlePrivacyToggle()}
                >
                  <FiLock />
                  <span>Private</span>
                </button>
              </div>
            </div>
          </div>

          {/* Community Rules */}
          <div className="ccm-form-group">
            <label>Community Rules *</label>
            <div className="ccm-rules-list">
              {formData.rules.map((rule, index) => (
                <div key={index} className="ccm-rule-item">
                  <span className="ccm-rule-number">{index + 1}.</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => handleRuleChange(index, e.target.value)}
                    placeholder="Enter a rule"
                  />
                  {formData.rules.length > 1 && (
                    <button
                      type="button"
                      className="ccm-remove-rule"
                      onClick={() => removeRule(index)}
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              className="ccm-add-rule-btn"
              onClick={addRule}
            >
              <FiPlus />
              <span>Add Rule</span>
            </button>
            {errors.rules && <span className="ccm-error-message">{errors.rules}</span>}
          </div>

          {/* Error message */}
          {errors.submit && (
            <div className="ccm-submit-error">
              {errors.submit}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="ccm-form-actions">
            <button
              type="button"
              className="ccm-cancel-button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="ccm-submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (uploadingCover || uploadingAvatar ? 'Uploading images...' : 'Creating...') : (editMode ? 'Save Changes' : 'Create Community')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCommunityModal;