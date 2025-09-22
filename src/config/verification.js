/**
 * Verification System Configuration
 * 
 * This file contains all configuration settings for the user verification system.
 * Modify these values to adjust verification requirements.
 */

export const VERIFICATION_CONFIG = {
  /**
   * Minimum number of followers required for automatic verification
   * Users must have MORE THAN this number of followers (not equal to)
   * Default: 10
   */
  MIN_FOLLOWERS_FOR_VERIFICATION: 10,
  
  /**
   * Minimum number of posts required for automatic verification
   * Users must have MORE THAN this number of posts (not equal to)
   * Default: 10
   */
  MIN_POSTS_FOR_VERIFICATION: 10,
  
  /**
   * Enable/disable automatic verification
   * When false, only admins can verify users manually
   * Default: true
   */
  AUTO_VERIFY_ENABLED: true,
  
  /**
   * Once verified, keep verification even if followers/posts drop below threshold
   * Default: true
   */
  KEEP_VERIFICATION_ON_FOLLOWER_DROP: true,
  
  /**
   * Additional verification criteria (for future use)
   */
  ADDITIONAL_CRITERIA: {
    MIN_ACCOUNT_AGE_DAYS: 0, // Not implemented yet
    MIN_POSTS_COUNT: 0,      // Deprecated - use MIN_POSTS_FOR_VERIFICATION instead
    REQUIRE_PROFILE_IMAGE: false, // Not implemented yet
    REQUIRE_BIO: false       // Not implemented yet
  }
};

// Export individual constants for convenience
export const MIN_FOLLOWERS_FOR_VERIFICATION = VERIFICATION_CONFIG.MIN_FOLLOWERS_FOR_VERIFICATION;
export const MIN_POSTS_FOR_VERIFICATION = VERIFICATION_CONFIG.MIN_POSTS_FOR_VERIFICATION;