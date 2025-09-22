import React, { useState, useRef, useEffect } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { uploadImage } from '../../../config/cloudinary';
import { useNavigate } from 'react-router-dom';
import '../styles/CreatePostModal.css';

const CreatePostModal = ({ isOpen, onClose }) => {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated && isOpen) {
      onClose();
      navigate('/login'); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, authLoading, isOpen, onClose, navigate]);

  // Don't render if not authenticated or still loading
  if (authLoading || !isAuthenticated) {
    return null;
  }

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Image size should be less than 10MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is still authenticated
    if (!isAuthenticated || !user) {
      setError('You must be logged in to create a post');
      return;
    }

    if (!description && !selectedImage) {
      setError('Please add a description or image');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let mediaData = [];
      if (selectedImage) {
        const uploadedImage = await uploadImage(selectedImage);
        mediaData.push({
          url: uploadedImage.url,
          type: uploadedImage.type,
          aspectRatio: uploadedImage.aspectRatio.toString()
        });
      }

      const postData = {
        userId: user.uid,
        content: {
          text: description,
          media: mediaData
        },
        location: location ? {
          name: location,
          coordinates: coordinates || null
        } : null,
        hashtags: extractHashtags(description),
        mentions: extractMentions(description),
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

      await addDoc(collection(db, 'posts'), postData);
      handleClose();
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setLocation('');
    setCoordinates(null);
    setSelectedImage(null);
    setImagePreview(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cpm-modal-overlay">
      <div className="cpm-modal-content">
        <div className="cpm-modal-header">
          <h2>Create New Post</h2>
          <button className="cpm-close-button" onClick={handleClose} disabled={isLoading}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {error && <div className="cpm-error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="cpm-create-post-form">
          <div className="cpm-form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's on your mind? Use # for hashtags and @ for mentions"
              rows="4"
              disabled={isLoading}
            />
          </div>

          <div className="cpm-form-group">
            <label>Location</label>
            <div className="cpm-location-input">
              <i className="fas fa-map-marker-alt"></i>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="cpm-form-group">
            <label>Photo/Video</label>
            <div 
              className="cpm-image-upload-area"
              onClick={() => !isLoading && fileInputRef.current.click()}
            >
              {imagePreview ? (
                <div className="cpm-image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button 
                    type="button"
                    className="cpm-remove-image"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(null);
                      setImagePreview(null);
                    }}
                    disabled={isLoading}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ) : (
                <div className="cpm-upload-placeholder">
                  <i className="fas fa-image"></i>
                  <span>Click to upload image</span>
                  <span className="cpm-upload-hint">or drag and drop (max 10MB)</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                style={{ display: 'none' }}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="cpm-form-actions">
            <button 
              type="button" 
              className="cpm-cancel-btn" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="cpm-post-btn"
              disabled={isLoading || (!description && !selectedImage)}
            >
              {isLoading ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal; 