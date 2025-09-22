import { Cloudinary as CloudinaryCore } from '@cloudinary/url-gen';
import { CloudinaryImage } from '@cloudinary/url-gen/assets/CloudinaryImage';
import { fill } from '@cloudinary/url-gen/actions/resize';

// Initialize Cloudinary
const cloudinary = new CloudinaryCore({
  cloud: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  }
});

// Function to upload image to Cloudinary
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'social_posts'); // Organize uploads in a folder

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      publicId: data.public_id,
      type: 'image',
      aspectRatio: data.width / data.height,
      width: data.width,
      height: data.height
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

// Function to upload community images with specific transformations
export const uploadCommunityImage = async (file, imageType = 'avatar', communityId = null) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    
    // Organize in appropriate folders
    const folder = imageType === 'avatar' ? 'communities/avatars' : 'communities/covers';
    formData.append('folder', folder);
    
    // Add community ID to public_id if provided
    if (communityId) {
      formData.append('public_id', `${communityId}_${imageType}_${Date.now()}`);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to upload ${imageType}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();

    // Build the URL with transformations
    let transformedUrl = data.secure_url;
    
    if (imageType === 'avatar') {
      // Avatar: 200x200 square crop, auto quality
      // Replace /upload/ with /upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/
      transformedUrl = data.secure_url.replace(
        '/upload/',
        '/upload/w_200,h_200,c_fill,g_face,q_auto,f_auto/'
      );
    } else if (imageType === 'cover') {
      // Cover: 1200x400 with smart crop, auto quality
      // Replace /upload/ with /upload/w_1200,h_400,c_fill,g_auto,q_auto:good,f_auto/
      transformedUrl = data.secure_url.replace(
        '/upload/',
        '/upload/w_1200,h_400,c_fill,g_auto,q_auto:good,f_auto/'
      );
    }

    return {
      url: transformedUrl,
      publicId: data.public_id,
      type: imageType,
      width: data.width,
      height: data.height,
      format: data.format
    };
  } catch (error) {
    console.error(`Error uploading group ${imageType} to Cloudinary:`, error);
    throw error;
  }
};

// Function to delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const timestamp = new Date().getTime();
    const signature = await generateSignature(publicId, timestamp);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('signature', signature);
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/destroy`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete image');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

// Helper function to generate signature for delete operations
const generateSignature = async (publicId, timestamp) => {
  const str = `public_id=${publicId}&timestamp=${timestamp}${import.meta.env.VITE_CLOUDINARY_API_SECRET}`;
  
  // Using SubtleCrypto for SHA-1 hashing
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

// Function to get optimized image URL with transformations
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  const image = new CloudinaryImage(publicId, { cloudinary });
  
  if (width && height) {
    image.resize(fill().width(width).height(height));
  }
  
  return image
    .format(format)
    .quality(quality)
    .toURL();
};

export default cloudinary; 