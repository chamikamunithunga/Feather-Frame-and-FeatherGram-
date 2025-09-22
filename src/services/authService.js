import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  // Check if username is available
  async isUsernameAvailable(username) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (error) {
      console.error('Username check error:', error);
      throw error;
    }
  }

  // Register new user
  async register(userData) {
    try {
      const { email, password, firstName, lastName, username, contactNumber } = userData;
      
      // Check if username is available
      const isAvailable = await this.isUsernameAvailable(username);
      if (!isAvailable) {
        throw new Error('This username is already taken. Please choose another one.');
      }

      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email,
        username,
        displayName: `${firstName} ${lastName}`,
        contactNumber: contactNumber || '',
        createdAt: new Date().toISOString(),
        followers: [],
        following: [],
        bio: '',
        location: '',
        website: '',
        isVerified: false,
        // Initialize counts
        postsCount: 0,
        followersCount: 0,
        followingCount: 0
      };

      try {
        // Store user profile in Firestore
        await setDoc(doc(db, 'users', user.uid), userProfile);
        this.currentUser = userProfile;

        return {
          success: true,
          user: userProfile
        };
      } catch (firestoreError) {
        // If Firestore creation fails, delete the auth user to maintain consistency
        await user.delete();
        throw new Error('Failed to create user profile. Please try again.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('An account with this email already exists. Please try logging in instead.');
      }
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        this.currentUser = userDoc.data();
        return {
          success: true,
          user: this.currentUser
        };
      } else {
        throw new Error('User profile not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password');
      }
      throw error;
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(auth);
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Password reset email sent' };
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.currentUser;
  }

  // Listen to auth state changes
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          this.currentUser = userDoc.data();
        } else {
          this.currentUser = null;
        }
      } else {
        // User is signed out
        this.currentUser = null;
      }
      callback(this.currentUser);
    });
  }

  // Update user profile
  async updateProfile(userId, profileData) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // If there's a new profile image
      if (profileData.profileImage && profileData.profileImage instanceof File) {
        const formData = new FormData();
        formData.append('file', profileData.profileImage);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        try {
          const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Cloudinary error:', errorData);
            throw new Error(`Failed to upload image: ${errorData.error?.message || 'Unknown error'}`);
          }
          
          const data = await response.json();
          profileData.profileImageUrl = data.secure_url;
        } catch (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error('Failed to upload profile image. Please try again.');
        }
      }
      
      // Remove the File object before updating Firestore
      delete profileData.profileImage;
      
      // If username is being updated, check availability
      if (profileData.username && profileData.username !== this.currentUser.username) {
        const isAvailable = await this.isUsernameAvailable(profileData.username);
        if (!isAvailable) {
          throw new Error('This username is already taken. Please choose another one.');
        }
      }
      
      // Update Firestore document
      await updateDoc(userRef, profileData);
      
      // Update local user object
      this.currentUser = {
        ...this.currentUser,
        ...profileData
      };
      
      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Remove profile image
  async removeProfileImage(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      
      // Update Firestore document to remove profile image URL
      await updateDoc(userRef, {
        profileImageUrl: null
      });
      
      // Update local user object
      this.currentUser = {
        ...this.currentUser,
        profileImageUrl: null
      };
      
      return {
        success: true,
        user: this.currentUser
      };
    } catch (error) {
      console.error('Profile image removal error:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService; 