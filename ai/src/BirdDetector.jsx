import React, { useState, useEffect } from "react";
import "./BirdDetector.css";

export default function BirdDetector() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  const [isMobile, setIsMobile] = useState(false);
  const [connectionTest, setConnectionTest] = useState(null);

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
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert("Please select an image file first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      console.log("Starting bird detection...");
      const formData = new FormData();
      formData.append("image", selectedFile);

      console.log("Sending request to backend...");
      const response = await fetch("http://127.0.0.1:5001/detect-bird", {
        method: "POST",
        body: formData,
      });

      console.log("Response received:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.message || response.statusText);
      }

      const data = await response.json();
      console.log("Detection result:", data);
      
      if (Array.isArray(data.detections) && data.detections.length > 0) {
        alert("Detection successful: The uploaded image contains a bird.");
      } else {
        alert((data && data.message) || "No bird detected in the uploaded image. Please try another image.");
      }
      setResult(data);
    } catch (error) {
      console.error("Detection error:", error);
      setResult({ message: "Error: " + error.message });
    } finally {
      setLoading(false);
    }
  };

  // --- Connection test handler ---
  const testBackendConnection = async () => {
    try {
      console.log("Testing backend connection...");
      const response = await fetch("http://127.0.0.1:5001/test");
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
    setSearchResult(null);
    try {
      console.log("Starting bird search for:", searchQuery.trim());
      const response = await fetch(
        `http://127.0.0.1:5001/search-bird?name=${encodeURIComponent(searchQuery.trim())}`
      );
      console.log("Search response:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Search error:", errorData);
        throw new Error(errorData.message || response.statusText);
      }
      const data = await response.json();
      console.log("Search result:", data);
      setSearchResult(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResult({ message: "Error: " + error.message });
    } finally {
      setSearchLoading(false);
    }
  };

  const renderBirdDetails = (birdDetails, searchType = null) => {
    if (!birdDetails) return null;

    return (
      <div className="bird-details-card">
        <div className="bird-details-header">
          <h3>📋 Bird Information</h3>
          {searchType && (
            <div className={`search-type-badge ${searchType}`}>
              {searchType === "scientific" ? (
                <span>🔬 Scientific Search</span>
              ) : (
                <span>🦅 Common Name Search</span>
              )}
            </div>
          )}
        </div>
        
        {/* Basic Information */}
        <div className="info-section">
          <div className="section-header">
            <h4>🦅 Basic Information</h4>
          </div>
          <div className="info-grid">
            {birdDetails.scientific_name && (
              <div className="info-item">
                <label>Scientific Name</label>
                <span>{birdDetails.scientific_name}</span>
              </div>
            )}
            {birdDetails.common_name && (
              <div className="info-item">
                <label>Common Name</label>
                <span>{birdDetails.common_name}</span>
              </div>
            )}
            {birdDetails.family && (
              <div className="info-item">
                <label>Family</label>
                <span>{birdDetails.family}</span>
              </div>
            )}
            {birdDetails.order && (
              <div className="info-item">
                <label>Order</label>
                <span>{birdDetails.order}</span>
              </div>
            )}
            {birdDetails.conservation_status && (
              <div className="info-item">
                <label>Conservation Status</label>
                <span className="status-badge">{birdDetails.conservation_status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {birdDetails.description && (
          <div className="info-section">
            <div className="section-header">
              <h4>📝 Description</h4>
            </div>
            <p className="description-text">{birdDetails.description}</p>
          </div>
        )}

        {/* Habitat & Diet */}
        {(birdDetails.habitat || birdDetails.diet) && (
          <div className="info-section">
            <div className="section-header">
              <h4>🏞️ Habitat & Diet</h4>
            </div>
            <div className="habitat-diet-grid">
              {birdDetails.habitat && (
                <div className="habitat-card">
                  <h5>🏞️ Habitat</h5>
                  <p>{birdDetails.habitat}</p>
                </div>
              )}
              {birdDetails.diet && (
                <div className="diet-card">
                  <h5>🍽️ Diet</h5>
                  <p>{birdDetails.diet}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Behavior & Migration */}
        {(birdDetails.migration || birdDetails.behavior) && (
          <div className="info-section">
            <div className="section-header">
              <h4>🦅 Behavior & Migration</h4>
            </div>
            <div className="behavior-grid">
              {birdDetails.migration && (
                <div className="behavior-item">
                  <label>Migration Pattern</label>
                  <span>{birdDetails.migration}</span>
                </div>
              )}
              {birdDetails.behavior && (
                <div className="behavior-item">
                  <label>Behavior</label>
                  <span>{birdDetails.behavior}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Breeding */}
        {birdDetails.breeding && (
          <div className="info-section">
            <div className="section-header">
              <h4>🥚 Breeding</h4>
            </div>
            <p className="breeding-text">{birdDetails.breeding}</p>
          </div>
        )}

        {/* Distribution */}
        {birdDetails.distribution && (
          <div className="info-section">
            <div className="section-header">
              <h4>🗺️ Distribution</h4>
            </div>
            <p className="distribution-text">{birdDetails.distribution}</p>
          </div>
        )}

        {/* Recent Occurrences */}
        {birdDetails.occurrences && birdDetails.occurrences.length > 0 && (
          <div className="info-section">
            <div className="section-header">
              <h4>📍 Recent Sightings</h4>
            </div>
            <div className="occurrences-grid">
              {birdDetails.occurrences.map((occurrence, index) => (
                <div key={index} className="occurrence-card">
                  <div className="occurrence-header">
                    <span className="location-icon">📍</span>
                    <span className="location-name">{occurrence.locName || 'Unknown Location'}</span>
                  </div>
                  <div className="occurrence-details">
                    <span className="date">📅 {occurrence.obsDt || 'Unknown Date'}</span>
                    <span className="count">🦅 {occurrence.howMany || 'Unknown'} birds</span>
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
    <div className="search-section">
      <div className="search-container">
        <div className="search-header">
          <h2>Search Bird Database</h2>
          <p>Search by common name or scientific name to get detailed information</p>
        </div>
        
        <form onSubmit={handleSearchSubmit} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              placeholder="Enter bird name (e.g., 'American Robin' or 'Turdus migratorius')"
              value={searchQuery}
              onChange={handleSearchChange}
              className="search-input"
            />
            <button type="submit" disabled={searchLoading} className="search-button">
              {searchLoading ? (
                <span className="loading-spinner">⏳</span>
              ) : (
                "🔍 Search"
              )}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {searchResult && (
          <div className="results-container">
            <div className={`result-card ${searchResult.message && searchResult.message.toLowerCase().includes("error") ? "error" : "success"}`}>
              <div className="result-header">
                <h3>{searchResult.message}</h3>
              </div>
              {searchResult.bird_details && renderBirdDetails(searchResult.bird_details, searchResult.bird_details.search_type)}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Upload Section Component
  const UploadSection = () => (
    <div className="upload-section">
      <div className="upload-container">
        <div className="upload-header">
          <h2>Upload Bird Image</h2>
          <p>Upload a bird image for AI-powered detection and identification</p>
        </div>

        <form onSubmit={handleSubmit} className="upload-form">
          <div className="upload-area">
            <label
              className={`upload-zone ${dragActive ? "dragover" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-content">
                <div className="upload-icon">📸</div>
                <h3>Drop your image here</h3>
                <p>or click to browse files</p>
                <span className="upload-hint">Supports: JPG, PNG, WEBP</span>
              </div>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          {previewUrl && (
            <div className="preview-container">
              <h4>Image Preview</h4>
              <div className="image-preview">
                <img src={previewUrl} alt="Preview" />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading || !selectedFile} className="detect-button">
            {loading ? (
              <span className="loading-spinner">🔍 Analyzing...</span>
            ) : (
              "🦅 Detect Bird"
            )}
          </button>
        </form>

        {/* Detection Results */}
        {result && (
          <div className="results-container">
            <div className={`result-card ${result.message && result.message.toLowerCase().includes("error") ? "error" : "success"}`}>
              <div className="result-header">
                <h3>{result.message}</h3>
                {result.confidence && (
                  <div className="confidence-badge">
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                )}
              </div>
              
              {result.bird_details && renderBirdDetails(result.bird_details)}

              {/* Detected Objects */}
              {result.detected_objects && result.detected_objects.length > 0 && (
                <div className="detected-objects-section">
                  <h4>🔍 Objects Detected</h4>
                  <div className="objects-grid">
                    {result.detected_objects.map((obj, index) => (
                      <div key={index} className="object-card">
                        <span className="object-name">{obj.class}</span>
                        <span className="object-confidence">{(obj.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="bird-app-container">
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
      <main className="main-content">
        {/* Mobile/Tablet Tab Navigation - Only show on mobile/tablet */}
        {isMobile && (
          <div className="tab-navigation">
            <button 
              className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              🔍 Search Birds
            </button>
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              📸 Upload Image
            </button>
          </div>
        )}

        {/* Desktop Layout - Side by side (larger screens) */}
        {!isMobile && (
          <div className="content-grid">
            <SearchSection />
            <UploadSection />
          </div>
        )}

        {/* Mobile/Tablet Layout - Tab based */}
        {isMobile && (
          <div className="mobile-content">
            {activeTab === 'search' && <SearchSection />}
            {activeTab === 'upload' && <UploadSection />}
          </div>
        )}
      </main>
    </div>
  );
}
