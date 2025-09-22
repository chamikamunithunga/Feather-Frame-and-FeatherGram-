import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import birdHistoryService from "../../services/birdHistoryService";
import "./BirdDetector.css";

export default function BirdDetector() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [isMobile, setIsMobile] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [showDetailedHelp, setShowDetailedHelp] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState(null);

  // Small helper to avoid infinite waiting when backend is down
  const fetchWithTimeout = async (url, options = {}, timeoutMs = 60000) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } catch (err) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out. Backend may be offline.");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  // Check if device is mobile/tablet
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // --- Image upload handlers ---
  // Pre-analyze image for bird-likelihood
  const analyzeImageForBirds = async (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Basic analysis of image characteristics that might indicate birds
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let skyPixels = 0;
        let greenPixels = 0;
        let totalPixels = data.length / 4;
        
        // Analyze color patterns typical in bird photos
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Sky-like colors (blue tones)
          if (b > r && b > g && b > 100) {
            skyPixels++;
          }
          
          // Nature-like colors (green tones)
          if (g > r && g > b && g > 50) {
            greenPixels++;
          }
        }
        
        const skyRatio = skyPixels / totalPixels;
        const greenRatio = greenPixels / totalPixels;
        const aspectRatio = canvas.width / canvas.height;
        
        // Calculate likelihood score
        let birdLikelihood = 0;
        
        // Landscape orientation favors bird photos
        if (aspectRatio >= 1.2) birdLikelihood += 0.2;
        
        // Sky presence suggests outdoor bird photography
        if (skyRatio > 0.1) birdLikelihood += 0.3;
        
        // Nature colors suggest bird habitat
        if (greenRatio > 0.05) birdLikelihood += 0.2;
        
        // Image dimensions suggest bird photography
        if (canvas.width > 800 && canvas.height > 600) birdLikelihood += 0.3;
        
        resolve({
          skyRatio,
          greenRatio,
          aspectRatio,
          birdLikelihood,
          dimensions: { width: canvas.width, height: canvas.height }
        });
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null); // Clear previous results
      
      // Analyze image for bird characteristics
      try {
        const analysis = await analyzeImageForBirds(file);
        setImageAnalysis(analysis);
        
        // Show warning if image seems unlikely to contain birds
        if (analysis.birdLikelihood < 0.3) {
          setDetectionResult({
            type: 'warning',
            detectionType: 'low-bird-likelihood',
            message: `This image might not be optimal for bird detection.`,
            suggestions: [
              `Bird likelihood score: ${Math.round(analysis.birdLikelihood * 100)}%`,
              "Best results with outdoor nature photos",
              "Photos with sky, trees, or natural backgrounds work well",
              "Make sure birds are clearly visible in good lighting"
            ],
            analysis: analysis
          });
        }
      } catch (error) {
        console.log("Image analysis failed:", error);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setDetectionResult(null); // Clear previous results
      
      // Analyze dropped image
      try {
        const analysis = await analyzeImageForBirds(file);
        setImageAnalysis(analysis);
        
        if (analysis.birdLikelihood < 0.3) {
          setDetectionResult({
            type: 'warning',
            detectionType: 'low-bird-likelihood',
            message: `This image might not be optimal for bird detection.`,
            suggestions: [
              `Bird likelihood score: ${Math.round(analysis.birdLikelihood * 100)}%`,
              "Best results with outdoor nature photos",
              "Photos with sky, trees, or natural backgrounds work well", 
              "Make sure birds are clearly visible in good lighting"
            ],
            analysis: analysis
          });
        }
      } catch (error) {
        console.log("Image analysis failed:", error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an image file first.");
      return;
    }

    // Additional validation for bird-focused detection
    if (!selectedFile.type.startsWith('image/')) {
      setDetectionResult({
        type: 'error',
        detectionType: 'invalid-file',
        message: "Please upload a valid image file.",
        suggestions: [
          "Supported formats: JPG, PNG, WEBP",
          "Make sure the file is a photo, not a document",
          "Bird photos work best in standard image formats"
        ]
      });
      return;
    }

    // Check file size (max 10MB for better processing)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setDetectionResult({
        type: 'error',
        detectionType: 'file-too-large',
        message: "Image file is too large for processing.",
        suggestions: [
          "Please use images smaller than 10MB",
          "Compress your image or use a smaller resolution",
          "High-resolution bird photos (2-5MB) work great"
        ]
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting bird detection...");
      const formData = new FormData();
      formData.append("image", selectedFile);
      
      // Add analysis data to help backend focus on bird detection
      if (imageAnalysis) {
        formData.append("analysis", JSON.stringify({
          birdLikelihood: imageAnalysis.birdLikelihood,
          imageType: imageAnalysis.birdLikelihood > 0.5 ? 'nature' : 'general'
        }));
      }

      console.log("Sending request to backend...");
      const response = await fetchWithTimeout(
        "http://127.0.0.1:5001/detect-bird",
        {
          method: "POST",
          body: formData,
        },
        60000
      );

      console.log("Response received:", response.status);

      if (!response.ok) {
        let message = response.statusText;
        try { const errorData = await response.json(); message = errorData.message || message; } catch {}
        throw new Error(message);
      }

      const data = await response.json();
      console.log("Detection result:", data);
      
      if (Array.isArray(data.detections) && data.detections.length > 0) {
        setDetectionResult({
          type: 'success',
          message: 'Bird detected successfully! Redirecting to detailed information...',
          data: data
        });
        
        // Save to user's bird history if authenticated
        if (user && user.uid) {
          try {
            await birdHistoryService.saveBirdToHistory(user.uid, data?.profile || data, 'image');
            console.log("Bird saved to history");
          } catch (historyError) {
            console.error("Failed to save to history:", historyError);
          }
        }
        
        // Navigate to results page after a short delay to show success message
        setTimeout(() => {
          navigate("/bird-results", {
            state: {
              birdData: data?.profile || data,
              searchType: "image",
              fromDetector: true
            }
          });
        }, 2000);
      } else {
        // Determine the type of image that was uploaded
        const message = data?.message || "No bird detected in the uploaded image.";
        let detectionType = 'no-bird';
        let helpfulMessage = "No birds were detected in your image.";
        let suggestions = [
          "Make sure the bird is clearly visible and not too small",
          "Ensure good lighting and focus in the image", 
          "Try images with birds as the main subject",
          "Avoid images with multiple small objects or busy backgrounds"
        ];

        // Handle enhanced backend detection types
        if (data?.detection_type) {
          detectionType = data.detection_type;
          helpfulMessage = message;
          
          // Use backend suggestion or provide defaults
          if (data.suggestion) {
            suggestions = [data.suggestion];
          }
          
          // Add specific suggestions based on detection type
          if (detectionType === 'human') {
            if (!data.suggestion) {
              suggestions = [
                "This app is designed specifically for bird identification",
                "Please upload an image containing birds as the main subject",
                "If there's a bird in the photo, try cropping closer to the bird",
                "For best results, avoid photos with people in the frame"
              ];
            }
          } else if (detectionType === 'other-animal') {
            if (!data.suggestion) {
              suggestions = [
                "This app specializes in bird identification only",
                "Please upload an image of a bird (sparrow, eagle, robin, etc.)",
                "Birds have feathers, beaks, and wings - not fur or scales",
                "Try searching our database by bird name instead"
              ];
            }
          } else if (detectionType === 'object') {
            if (!data.suggestion) {
              suggestions = [
                "Make sure to upload an image containing a bird",
                "Birds should be clearly visible and well-lit in the photo",
                "Avoid indoor photos - outdoor nature photos work best",
                "Try using the search feature if you know the bird's name"
              ];
            }
          }
        } else {
          // Fallback for older backend responses or connection issues
          if (message.toLowerCase().includes('human') || message.toLowerCase().includes('person') || message.toLowerCase().includes('people')) {
            detectionType = 'human';
            helpfulMessage = "We detected a human in the image, but no birds.";
            suggestions = [
              "This app is designed specifically for bird identification",
              "Please upload an image containing birds",
              "If there's a bird in the photo, try cropping closer to the bird",
              "Make sure the bird is the main focus of the image"
            ];
          } else if (message.toLowerCase().includes('animal') || message.toLowerCase().includes('mammal')) {
            detectionType = 'other-animal';
            helpfulMessage = "We detected an animal, but it's not a bird.";
            suggestions = [
              "This app specializes in bird identification only",
              "Please upload an image of a bird (sparrow, eagle, robin, etc.)",
              "Birds have feathers, beaks, and wings",
              "Try searching our database by bird name instead"
            ];
          } else if (message.toLowerCase().includes('object') || message.toLowerCase().includes('item')) {
            detectionType = 'object';
            helpfulMessage = "We detected objects in the image, but no birds.";
            suggestions = [
              "Make sure to upload an image containing a bird",
              "Birds should be clearly visible in the photo",
              "Avoid images of buildings, vehicles, or other objects",
              "Try using the search feature if you know the bird's name"
            ];
          }
        }

        setDetectionResult({
          type: 'error',
          detectionType: detectionType,
          message: helpfulMessage,
          originalMessage: message,
          suggestions: suggestions,
          data: data
        });
        return;
      }
    } catch (error) {
      console.error("Detection error:", error);
      setDetectionResult({
        type: 'error',
        detectionType: 'connection-error',
        message: "Failed to connect to the bird detection service.",
        originalMessage: error.message,
        suggestions: [
          "Check your internet connection",
          "The backend service may be temporarily unavailable",
          "Try again in a few moments",
          "Contact support if the problem persists"
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Connection test handler ---
  const testBackendConnection = async () => {
    try {
      console.log("Testing backend connection...");
      const response = await fetchWithTimeout("http://127.0.0.1:5001/test", {}, 5000);
      const data = await response.json();
      console.log("Connection test result:", data);
      setConnectionTest({ status: 'success', data });
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionTest({ status: 'error', message: error.message });
    }
  };

  // --- Bird name search handlers ---
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert("Please enter a bird name to search.");
      return;
    }
    setSearchLoading(true);
    try {
      console.log("Starting bird search for:", searchQuery.trim());
      const response = await fetchWithTimeout(
        `http://127.0.0.1:5001/search-bird?name=${encodeURIComponent(searchQuery.trim())}`,
        {},
        20000
      );
      console.log("Search response:", response.status);
      
      if (!response.ok) {
        let message = response.statusText;
        try { const errorData = await response.json(); message = errorData.message || message; } catch {}
        throw new Error(message);
      }
      const data = await response.json();
      console.log("Search result:", data);
      
      // Save to user's bird history if authenticated
      if (user && user.uid && data) {
        try {
          const birdDataToSave = data.bird_details || data;
          await birdHistoryService.saveBirdToHistory(user.uid, birdDataToSave, 'search');
          console.log("Bird saved to history");
        } catch (historyError) {
          console.error("Failed to save to history:", historyError);
        }
      }
      
      // Navigate to simple results page
      navigate("/bird-results", {
        state: {
          birdData: data,
          searchType: "common"
        }
      });
    } catch (error) {
      console.error("Search error:", error);
      alert("Error: " + error.message + "\nMake sure the backend at 127.0.0.1:5001 is running.");
    } finally {
      setSearchLoading(false);
    }
  };

  const renderBirdDetails = (birdDetails, searchType = null) => {
    if (!birdDetails) return null;

    return (
      <div className="featherframe-bird-details-card">
        <div className="featherframe-bird-details-header">
          <h3>📋 Bird Information</h3>
          {searchType && (
            <div className={`featherframe-search-type-badge ${searchType}`}>
              {searchType === "scientific" ? (
                <span>🔬 Scientific Search</span>
              ) : (
                <span>🦅 Common Name Search</span>
              )}
            </div>
          )}
        </div>
        
        {/* Basic Information */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🦅 Basic Information</h4>
          </div>
          <div className="featherframe-info-grid">
            {birdDetails.scientific_name && (
              <div className="featherframe-info-item">
                <label>Scientific Name</label>
                <span>{birdDetails.scientific_name}</span>
              </div>
            )}
            {birdDetails.common_name && (
              <div className="featherframe-info-item">
                <label>Common Name</label>
                <span>{birdDetails.common_name}</span>
              </div>
            )}
            {birdDetails.family && (
              <div className="featherframe-info-item">
                <label>Family</label>
                <span>{birdDetails.family}</span>
              </div>
            )}
            {birdDetails.order && (
              <div className="featherframe-info-item">
                <label>Order</label>
                <span>{birdDetails.order}</span>
              </div>
            )}
            {birdDetails.conservation_status && (
              <div className="featherframe-info-item">
                <label>Conservation Status</label>
                <span className="featherframe-status-badge">{birdDetails.conservation_status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {birdDetails.description && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>📝 Description</h4>
            </div>
            <p className="featherframe-description-text">{birdDetails.description}</p>
          </div>
        )}

        {/* Habitat & Diet */}
        {(birdDetails.habitat || birdDetails.diet) && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🏞️ Habitat & Diet</h4>
            </div>
            <div className="featherframe-habitat-diet-grid">
              {birdDetails.habitat && (
                <div className="featherframe-habitat-card">
                  <h5>🏞️ Habitat</h5>
                  <p>{birdDetails.habitat}</p>
                </div>
              )}
              {birdDetails.diet && (
                <div className="featherframe-diet-card">
                  <h5>🍽️ Diet</h5>
                  <p>{birdDetails.diet}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Behavior & Migration */}
        {(birdDetails.migration || birdDetails.behavior) && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🦅 Behavior & Migration</h4>
            </div>
            <div className="featherframe-behavior-grid">
              {birdDetails.migration && (
                <div className="featherframe-behavior-item">
                  <label>Migration Pattern</label>
                  <span>{birdDetails.migration}</span>
                </div>
              )}
              {birdDetails.behavior && (
                <div className="featherframe-behavior-item">
                  <label>Behavior</label>
                  <span>{birdDetails.behavior}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Breeding */}
        {birdDetails.breeding && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🥚 Breeding</h4>
            </div>
            <p className="featherframe-breeding-text">{birdDetails.breeding}</p>
          </div>
        )}

        {/* Distribution */}
        {birdDetails.distribution && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🗺️ Distribution</h4>
            </div>
            <p className="featherframe-distribution-text">{birdDetails.distribution}</p>
          </div>
        )}

        {/* Recent Occurrences */}
        {birdDetails.occurrences && birdDetails.occurrences.length > 0 && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>📍 Recent Sightings</h4>
            </div>
            <div className="featherframe-occurrences-grid">
              {birdDetails.occurrences.map((occurrence, index) => (
                <div key={index} className="featherframe-occurrence-card">
                  <div className="featherframe-occurrence-header">
                    <span className="featherframe-location-icon">📍</span>
                    <span className="featherframe-location-name">{occurrence.locName || 'Unknown Location'}</span>
                  </div>
                  <div className="featherframe-occurrence-details">
                    <span className="featherframe-date">📅 {occurrence.obsDt || 'Unknown Date'}</span>
                    <span className="featherframe-count">🦅 {occurrence.howMany || 'Unknown'} birds</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Search Section Component
  const SearchSection = () => (
    <div className="featherframe-search-section">
      <div className="featherframe-search-container">
        <div className="featherframe-search-header">
          <h2>Search Bird Database</h2>
          <p>Search by common name or scientific name to get detailed information</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="featherframe-search-form">
          <div className="featherframe-search-input-group">
            <input
              type="text"
              placeholder="Enter bird name (e.g., 'American Robin' or 'Turdus migratorius')"
              value={searchQuery}
              onChange={handleSearchChange}
              className="featherframe-search-input"
            />
            <button type="submit" disabled={searchLoading} className="featherframe-search-button">
              {searchLoading ? (
                <span className="featherframe-loading-spinner">⏳</span>
              ) : (
                "🔍 Search"
              )}
            </button>
          </div>
        </form>


      </div>
    </div>
  );

  // Upload Section Component
  const UploadSection = () => (
    <div className="featherframe-upload-section">
      <div className="featherframe-upload-container">
        <div className="featherframe-upload-header">
          <h2>Upload Bird Image</h2>
          <p>🦅 Upload a clear bird photo for AI-powered species identification</p>
          <div className="featherframe-upload-tips">
            <span className="featherframe-tip">✅ Outdoor nature photos</span>
            <span className="featherframe-tip">✅ Birds as main subject</span>
            <span className="featherframe-tip">✅ Good lighting & focus</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="featherframe-upload-form">
          <div className="featherframe-upload-area">
            <label
              className={`featherframe-upload-zone ${dragActive ? "featherframe-dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="featherframe-upload-content">
                <div className="featherframe-upload-icon">📸</div>
                <h3>Drop your image here</h3>
                <p>or click to browse files</p>
                <span className="featherframe-upload-hint">Supports: JPG, PNG, WEBP</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          {previewUrl && (
            <div className="featherframe-preview-container">
              <h4>Image Preview</h4>
              <div className="featherframe-image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            </div>
          )}

          {/* Detection Result Display */}
          {detectionResult && (
            <div className={`featherframe-detection-result ${detectionResult.type}`}>
              {detectionResult.type === 'success' ? (
                <div className="featherframe-success-result">
                  <div className="featherframe-success-icon">✅</div>
                  <h4>Bird Detected!</h4>
                  <p>{detectionResult.message}</p>
                  <div className="featherframe-loading-spinner">🔄 Loading details...</div>
                </div>
              ) : detectionResult.type === 'warning' ? (
                <div className="featherframe-warning-result">
                  <div className="featherframe-warning-header">
                    <div className="featherframe-warning-icon">⚠️</div>
                    <h4>Image Analysis</h4>
                  </div>
                  
                  <p className="featherframe-warning-message">{detectionResult.message}</p>
                  
                  {detectionResult.analysis && (
                    <div className="featherframe-analysis-details">
                      <h5>📊 Image Analysis:</h5>
                      <div className="featherframe-analysis-grid">
                        <div className="featherframe-analysis-item">
                          <span>Sky content:</span>
                          <span>{Math.round(detectionResult.analysis.skyRatio * 100)}%</span>
                        </div>
                        <div className="featherframe-analysis-item">
                          <span>Nature colors:</span>
                          <span>{Math.round(detectionResult.analysis.greenRatio * 100)}%</span>
                        </div>
                        <div className="featherframe-analysis-item">
                          <span>Dimensions:</span>
                          <span>{detectionResult.analysis.dimensions.width}x{detectionResult.analysis.dimensions.height}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="featherframe-suggestions">
                    <h5>💡 Suggestions for Better Results:</h5>
                    <ul>
                      {detectionResult.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="featherframe-help-actions">
                    <button 
                      className="featherframe-continue-button"
                      onClick={() => setDetectionResult(null)}
                    >
                      🦅 Continue with Detection
                    </button>
                    <button 
                      className="featherframe-clear-button"
                      onClick={() => {
                        setDetectionResult(null);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setImageAnalysis(null);
                      }}
                    >
                      🔄 Choose Different Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="featherframe-error-result">
                  <div className="featherframe-error-header">
                    {detectionResult.detectionType === 'human' && <div className="featherframe-error-icon">👤</div>}
                    {detectionResult.detectionType === 'other-animal' && <div className="featherframe-error-icon">🐾</div>}
                    {detectionResult.detectionType === 'object' && <div className="featherframe-error-icon">📦</div>}
                    {detectionResult.detectionType === 'no-bird' && <div className="featherframe-error-icon">🚫</div>}
                    {detectionResult.detectionType === 'connection-error' && <div className="featherframe-error-icon">⚠️</div>}
                    <h4>
                      {detectionResult.detectionType === 'human' && 'Human Detected'}
                      {detectionResult.detectionType === 'other-animal' && 'Other Animal Detected'}
                      {detectionResult.detectionType === 'object' && 'Objects Detected'}
                      {detectionResult.detectionType === 'no-bird' && 'No Birds Found'}
                      {detectionResult.detectionType === 'connection-error' && 'Connection Error'}
                    </h4>
                  </div>
                  
                  <p className="featherframe-error-message">{detectionResult.message}</p>
                  
                  <div className="featherframe-suggestions">
                    <h5>💡 Helpful Tips:</h5>
                    <ul>
                      {detectionResult.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="featherframe-help-actions">
                    <button 
                      className="featherframe-help-button"
                      onClick={() => setShowDetailedHelp(true)}
                    >
                      📚 What makes a good bird photo?
                    </button>
                    <button 
                      className="featherframe-clear-button"
                      onClick={() => {
                        setDetectionResult(null);
                        setSelectedFile(null);
                        setPreviewUrl(null);
                        setImageAnalysis(null);
                      }}
                    >
                      🔄 Try Another Image
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Help Modal */}
          {showDetailedHelp && (
            <div className="featherframe-modal-overlay" onClick={() => setShowDetailedHelp(false)}>
              <div className="featherframe-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="featherframe-modal-header">
                  <h3>📸 Tips for Best Bird Detection</h3>
                  <button className="featherframe-modal-close" onClick={() => setShowDetailedHelp(false)}>×</button>
                </div>
                
                <div className="featherframe-modal-body">
                  <div className="featherframe-tip-section">
                    <h4>✅ Good Bird Photos:</h4>
                    <ul>
                      <li>🦅 Bird is the main subject of the photo</li>
                      <li>☀️ Good lighting (natural light works best)</li>
                      <li>🎯 Bird is clearly visible and in focus</li>
                      <li>📏 Bird takes up a reasonable portion of the image</li>
                      <li>🎨 Clear background that doesn't compete with the bird</li>
                      <li>👁️ Bird's features (beak, eyes, feathers) are visible</li>
                    </ul>
                  </div>
                  
                  <div className="featherframe-tip-section">
                    <h4>❌ Avoid These Types of Photos:</h4>
                    <ul>
                      <li>👤 Photos of people (even with birds in background)</li>
                      <li>🏠 Buildings, vehicles, or other objects as main subject</li>
                      <li>🌫️ Very blurry or out-of-focus images</li>
                      <li>🔍 Birds that are too small or far away</li>
                      <li>🌃 Very dark or poorly lit photos</li>
                      <li>🎪 Busy backgrounds with many distracting elements</li>
                    </ul>
                  </div>

                  <div className="featherframe-tip-section">
                    <h4>🎯 Best Results With:</h4>
                    <ul>
                      <li>🦜 Close-up shots of single birds</li>
                      <li>🪶 Clear view of bird's distinctive features</li>
                      <li>🌅 Photos taken during golden hour (sunrise/sunset)</li>
                      <li>🌿 Natural outdoor settings</li>
                      <li>📱 High-resolution images (but file size under 10MB)</li>
                    </ul>
                  </div>
                </div>
                
                <div className="featherframe-modal-footer">
                  <button className="featherframe-modal-button" onClick={() => setShowDetailedHelp(false)}>
                    Got it! 👍
                  </button>
                </div>
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !selectedFile} className="featherframe-detect-button">
            {loading ? (
              <span className="featherframe-loading-spinner">🔍 Analyzing...</span>
            ) : (
              "🦅 Detect Bird"
            )}
          </button>
        </form>


      </div>
    </div>
  );

  return (
    <div className="featherframe-bird-app-container">
      {/* Connection Test */}
      <div style={{position: 'fixed', top: '10px', right: '10px', zIndex: 1000}}>
        <button 
          onClick={testBackendConnection}
          style={{
            padding: '0.5rem 1rem',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.8rem'
          }}
        >
          Test Backend
        </button>
        {connectionTest && (
          <div style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: connectionTest.status === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.7rem',
            maxWidth: '200px'
          }}>
            {connectionTest.status === 'success' ? '✅ Connected' : `❌ ${connectionTest.message}`}
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="featherframe-main-content">
        {/* Mobile/Tablet Tab Navigation - Only show on mobile/tablet */}
        {isMobile && (
          <div className="featherframe-tab-navigation">
            <button 
              className={`featherframe-tab-button ${activeTab === 'search' ? 'featherframe-active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              🔍 Search Birds
            </button>
            <button 
              className={`featherframe-tab-button ${activeTab === 'upload' ? 'featherframe-active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📸 Upload Image
            </button>
          </div>
        )}

        {/* Desktop Layout - Side by side (larger screens) */}
        {!isMobile && (
          <div className="featherframe-content-grid">
            <SearchSection />
            <UploadSection />
          </div>
        )}

        {/* Mobile/Tablet Layout - Tab based */}
        {isMobile && (
          <div className="featherframe-mobile-content">
            {activeTab === 'search' && <SearchSection />}
            {activeTab === 'upload' && <UploadSection />}
          </div>
        )}
      </main>
    </div>
  );
} 