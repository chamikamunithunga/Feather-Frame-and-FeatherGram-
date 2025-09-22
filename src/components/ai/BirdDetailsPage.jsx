import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BirdDetailsPage.css";

const BirdDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [birdDetails, setBirdDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchType, setSearchType] = useState(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchBirdDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get bird data from location state or URL params
        const birdData = location.state?.birdData;
        const searchQuery = location.state?.searchQuery;
        const searchTypeParam = location.state?.searchType;

        if (birdData) {
          // If we have bird data directly (from image upload)
          setBirdDetails(birdData);
          setSearchType("image");
        } else if (searchQuery) {
          // If we have a search query (from text search)
          setSearchType(searchTypeParam || "common");
          
          // Fetch bird details from API
          const response = await fetch(
            `http://127.0.0.1:5001/search-bird?name=${encodeURIComponent(searchQuery)}`
          );
          
          if (!response.ok) {
            throw new Error("Failed to fetch bird details");
          }
          
          const data = await response.json();
          setBirdDetails(data);
        } else {
          // No data provided, redirect back to AI page
          navigate("/ai");
          return;
        }
      } catch (err) {
        console.error("Error fetching bird details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBirdDetails();
  }, [location, navigate]);

  const handleBackToAI = () => {
    navigate("/ai");
  };

  // --- Export helpers ---
  const getFileBaseName = () => (birdDetails?.common_name || birdDetails?.scientific_name || "bird-details").replace(/[^a-z0-9\-\_\s]/gi, "").trim().replace(/\s+/g, "-");

  const handleDownloadJSON = () => {
    if (!birdDetails) return;
    const blob = new Blob([JSON.stringify(birdDetails, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getFileBaseName()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  // Word-compatible .doc (HTML) export without extra libs
  const handleDownloadDoc = () => {
    if (!contentRef.current) return;
    const pre = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${getFileBaseName()}</title></head><body>`;
    const post = "</body></html>";
    const html = pre + contentRef.current.outerHTML + post;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${getFileBaseName()}.doc`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  // Print-to-PDF fallback (users can Save as PDF in print dialog)
  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    const win = window.open("", "_blank", "width=1024,height=768");
    if (!win) return;
    const styles = `
      <style>
        body { font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; color:#111827; }
        .section { margin: 16px 0; }
        h1,h2,h3,h4 { margin: 0 0 8px 0; }
        .meta { color:#6b7280; font-size:12px; margin-bottom:12px; }
        img { max-width:100%; height:auto; }
        .featherframe-bird-details-container { padding: 16px; }
      </style>
    `;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${getFileBaseName()}</title>${styles}</head><body>${contentRef.current.outerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => win.close(), 500);
    }, 400);
    setShowDownloadModal(false);
  };

  const toggleDownloadModal = () => {
    setShowDownloadModal((open) => !open);
  };

  const renderBirdDetails = () => {
    if (!birdDetails) return null;

    return (
      <div className="featherframe-bird-details-card">
        <div className="featherframe-bird-details-header">
          <h3>📋 Bird Information</h3>
          {searchType && (
            <div className={`featherframe-search-type-badge ${searchType}`}>
              {searchType === "scientific" ? (
                <span>🔬 Scientific Search</span>
              ) : searchType === "image" ? (
                <span>📸 Image Detection</span>
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
                <span className="featherframe-scientific-name">{birdDetails.scientific_name}</span>
              </div>
            )}
            {birdDetails.common_name && (
              <div className="featherframe-info-item">
                <label>Common Name</label>
                <span className="featherframe-common-name">{birdDetails.common_name}</span>
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
            {birdDetails.genus && (
              <div className="featherframe-info-item">
                <label>Genus</label>
                <span>{birdDetails.genus}</span>
              </div>
            )}
            {birdDetails.species && (
              <div className="featherframe-info-item">
                <label>Species</label>
                <span>{birdDetails.species}</span>
              </div>
            )}
            {birdDetails.subspecies && (
              <div className="featherframe-info-item">
                <label>Subspecies</label>
                <span>{birdDetails.subspecies}</span>
              </div>
            )}
            {birdDetails.conservation_status && (
              <div className="featherframe-info-item">
                <label>Conservation Status</label>
                <span className="featherframe-status-badge">{birdDetails.conservation_status}</span>
              </div>
            )}
            {birdDetails.iucn_status && (
              <div className="featherframe-info-item">
                <label>IUCN Status</label>
                <span className="featherframe-status-badge">{birdDetails.iucn_status}</span>
              </div>
            )}
            {birdDetails.population_trend && (
              <div className="featherframe-info-item">
                <label>Population Trend</label>
                <span>{birdDetails.population_trend}</span>
              </div>
            )}
            {birdDetails.population_size && (
              <div className="featherframe-info-item">
                <label>Population Size</label>
                <span>{birdDetails.population_size}</span>
              </div>
            )}
            {birdDetails.taxonomic_authority && (
              <div className="featherframe-info-item">
                <label>Taxonomic Authority</label>
                <span>{birdDetails.taxonomic_authority}</span>
              </div>
            )}
            {birdDetails.year_described && (
              <div className="featherframe-info-item">
                <label>Year Described</label>
                <span>{birdDetails.year_described}</span>
              </div>
            )}
            {birdDetails.type_locality && (
              <div className="featherframe-info-item">
                <label>Type Locality</label>
                <span>{birdDetails.type_locality}</span>
              </div>
            )}
            {birdDetails.holotype && (
              <div className="featherframe-info-item">
                <label>Holotype</label>
                <span>{birdDetails.holotype}</span>
              </div>
            )}
            {birdDetails.paratype && (
              <div className="featherframe-info-item">
                <label>Paratype</label>
                <span>{birdDetails.paratype}</span>
              </div>
            )}
            {birdDetails.synonyms && (
              <div className="featherframe-info-item">
                <label>Synonyms</label>
                <span>{birdDetails.synonyms}</span>
              </div>
            )}
            {birdDetails.common_names_other && (
              <div className="featherframe-info-item">
                <label>Other Common Names</label>
                <span>{birdDetails.common_names_other}</span>
              </div>
            )}
            {birdDetails.english_names && (
              <div className="featherframe-info-item">
                <label>English Names</label>
                <span>{birdDetails.english_names}</span>
              </div>
            )}
            {birdDetails.local_names && (
              <div className="featherframe-info-item">
                <label>Local Names</label>
                <span>{birdDetails.local_names}</span>
              </div>
            )}
            {birdDetails.vernacular_names && (
              <div className="featherframe-info-item">
                <label>Vernacular Names</label>
                <span>{birdDetails.vernacular_names}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bird Image Display */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🖼️ Bird Image</h4>
          </div>
          <div className="featherframe-bird-image-container">
            <div className="featherframe-bird-image-wrapper">
              {(birdDetails.image_url || birdDetails.photo_url || birdDetails.picture || birdDetails.thumbnail || birdDetails.media_url) ? (
                <img 
                  src={birdDetails.image_url || birdDetails.photo_url || birdDetails.picture || birdDetails.thumbnail || birdDetails.media_url} 
                  alt={`${birdDetails.common_name || 'Bird'} - ${birdDetails.scientific_name || 'Scientific Name'}`}
                  className="featherframe-bird-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="featherframe-image-placeholder" style={{ 
                display: (birdDetails.image_url || birdDetails.photo_url || birdDetails.picture || birdDetails.thumbnail || birdDetails.media_url) ? 'none' : 'flex' 
              }}>
                <span className="featherframe-placeholder-icon">🦅</span>
                <p>Image not available</p>
                <p className="featherframe-placeholder-subtitle">No image provided for this species</p>
              </div>
            </div>
            <div className="featherframe-image-info">
              <h5>{birdDetails.common_name || 'Bird Species'}</h5>
              {birdDetails.scientific_name && (
                <p className="featherframe-image-scientific">{birdDetails.scientific_name}</p>
              )}
              {(birdDetails.image_credit || birdDetails.image_source) && (
                <div className="featherframe-image-credits">
                  {birdDetails.image_credit && (
                    <p className="featherframe-image-credit">📸 {birdDetails.image_credit}</p>
                  )}
                  {birdDetails.image_source && (
                    <p className="featherframe-image-source">Source: {birdDetails.image_source}</p>
                  )}
                </div>
              )}
            </div>
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

        {/* Physical Characteristics */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>📏 Physical Characteristics</h4>
          </div>
          <div className="featherframe-info-grid">
            {birdDetails.length && (
              <div className="featherframe-info-item">
                <label>Body Length</label>
                <span>{birdDetails.length}</span>
              </div>
            )}
            {birdDetails.wingspan && (
              <div className="featherframe-info-item">
                <label>Wingspan</label>
                <span>{birdDetails.wingspan}</span>
              </div>
            )}
            {birdDetails.weight && (
              <div className="featherframe-info-item">
                <label>Weight</label>
                <span>{birdDetails.weight}</span>
              </div>
            )}
            {birdDetails.height && (
              <div className="featherframe-info-item">
                <label>Height</label>
                <span>{birdDetails.height}</span>
              </div>
            )}
            {birdDetails.bill_length && (
              <div className="featherframe-info-item">
                <label>Bill Length</label>
                <span>{birdDetails.bill_length}</span>
              </div>
            )}
            {birdDetails.tail_length && (
              <div className="featherframe-info-item">
                <label>Tail Length</label>
                <span>{birdDetails.tail_length}</span>
              </div>
            )}
            {birdDetails.leg_length && (
              <div className="featherframe-info-item">
                <label>Leg Length</label>
                <span>{birdDetails.leg_length}</span>
              </div>
            )}
            {birdDetails.claw_length && (
              <div className="featherframe-info-item">
                <label>Claw Length</label>
                <span>{birdDetails.claw_length}</span>
              </div>
            )}
            {birdDetails.tarsus_length && (
              <div className="featherframe-info-item">
                <label>Tarsus Length</label>
                <span>{birdDetails.tarsus_length}</span>
              </div>
            )}
            {birdDetails.culmen_length && (
              <div className="featherframe-info-item">
                <label>Culmen Length</label>
                <span>{birdDetails.culmen_length}</span>
              </div>
            )}
            {birdDetails.gonys_length && (
              <div className="featherframe-info-item">
                <label>Gonys Length</label>
                <span>{birdDetails.gonys_length}</span>
              </div>
            )}
            {birdDetails.eye_diameter && (
              <div className="featherframe-info-item">
                <label>Eye Diameter</label>
                <span>{birdDetails.eye_diameter}</span>
              </div>
            )}
            {birdDetails.head_length && (
              <div className="featherframe-info-item">
                <label>Head Length</label>
                <span>{birdDetails.head_length}</span>
              </div>
            )}
            {birdDetails.neck_length && (
              <div className="featherframe-info-item">
                <label>Neck Length</label>
                <span>{birdDetails.neck_length}</span>
              </div>
            )}
            {birdDetails.body_width && (
              <div className="featherframe-info-item">
                <label>Body Width</label>
                <span>{birdDetails.body_width}</span>
              </div>
            )}
            {birdDetails.chest_circumference && (
              <div className="featherframe-info-item">
                <label>Chest Circumference</label>
                <span>{birdDetails.chest_circumference}</span>
              </div>
            )}
            {birdDetails.wing_area && (
              <div className="featherframe-info-item">
                <label>Wing Area</label>
                <span>{birdDetails.wing_area}</span>
              </div>
            )}
            {birdDetails.aspect_ratio && (
              <div className="featherframe-info-item">
                <label>Wing Aspect Ratio</label>
                <span>{birdDetails.aspect_ratio}</span>
              </div>
            )}
            {birdDetails.wing_loading && (
              <div className="featherframe-info-item">
                <label>Wing Loading</label>
                <span>{birdDetails.wing_loading}</span>
              </div>
            )}
            {birdDetails.body_mass_index && (
              <div className="featherframe-info-item">
                <label>Body Mass Index</label>
                <span>{birdDetails.body_mass_index}</span>
              </div>
            )}
          </div>
        </div>

        {/* Habitat & Diet */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🏞️ Habitat & Diet</h4>
          </div>
          <div className="featherframe-habitat-diet-grid">
            {birdDetails.habitat && (
              <div className="featherframe-habitat-card">
                <h5>🏞️ General Habitat</h5>
                <p>{birdDetails.habitat}</p>
              </div>
            )}
            {birdDetails.diet && (
              <div className="featherframe-diet-card">
                <h5>🍽️ General Diet</h5>
                <p>{birdDetails.diet}</p>
              </div>
            )}
            {birdDetails.diet_types && (
              <div className="featherframe-diet-card">
                <h5>🥗 Diet Types</h5>
                <p>{birdDetails.diet_types}</p>
              </div>
            )}
            {birdDetails.feeding_methods && (
              <div className="featherframe-diet-card">
                <h5>🍴 Feeding Methods</h5>
                <p>{birdDetails.feeding_methods}</p>
              </div>
            )}
            {birdDetails.food_sources && (
              <div className="featherframe-diet-card">
                <h5>🌱 Food Sources</h5>
                <p>{birdDetails.food_sources}</p>
              </div>
            )}
            {birdDetails.hunting_techniques && (
              <div className="featherframe-diet-card">
                <h5>🎯 Hunting Techniques</h5>
                <p>{birdDetails.hunting_techniques}</p>
              </div>
            )}
            {birdDetails.foraging_behavior && (
              <div className="featherframe-diet-card">
                <h5>🔍 Foraging Behavior</h5>
                <p>{birdDetails.foraging_behavior}</p>
              </div>
            )}
            {birdDetails.feeding_time && (
              <div className="featherframe-diet-card">
                <h5>⏰ Feeding Time</h5>
                <p>{birdDetails.feeding_time}</p>
              </div>
            )}
            {birdDetails.diet_seasonal && (
              <div className="featherframe-diet-card">
                <h5>🍂 Seasonal Diet Changes</h5>
                <p>{birdDetails.diet_seasonal}</p>
              </div>
            )}
            {birdDetails.water_requirements && (
              <div className="featherframe-diet-card">
                <h5>💧 Water Requirements</h5>
                <p>{birdDetails.water_requirements}</p>
              </div>
            )}
            {birdDetails.habitat_preferences && (
              <div className="featherframe-habitat-card">
                <h5>🏔️ Habitat Preferences</h5>
                <p>{birdDetails.habitat_preferences}</p>
              </div>
            )}
            {birdDetails.microhabitat && (
              <div className="featherframe-habitat-card">
                <h5>🌿 Microhabitat</h5>
                <p>{birdDetails.microhabitat}</p>
              </div>
            )}
            {birdDetails.habitat_selection && (
              <div className="featherframe-habitat-card">
                <h5>🎯 Habitat Selection</h5>
                <p>{birdDetails.habitat_selection}</p>
              </div>
            )}
            {birdDetails.habitat_requirements && (
              <div className="featherframe-habitat-card">
                <h5>📋 Habitat Requirements</h5>
                <p>{birdDetails.habitat_requirements}</p>
              </div>
            )}
            {birdDetails.habitat_adaptations && (
              <div className="featherframe-habitat-card">
                <h5>🔧 Habitat Adaptations</h5>
                <p>{birdDetails.habitat_adaptations}</p>
              </div>
            )}
          </div>
        </div>

        {/* Plumage & Appearance */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🎨 Plumage & Appearance</h4>
          </div>
          <div className="featherframe-plumage-grid">
            {birdDetails.plumage && (
              <div className="featherframe-plumage-card">
                <h5>🎨 General Plumage</h5>
                <p>{birdDetails.plumage}</p>
              </div>
            )}
            {birdDetails.colors && (
              <div className="featherframe-plumage-card">
                <h5>🌈 Color Description</h5>
                <p>{birdDetails.colors}</p>
              </div>
            )}
            {birdDetails.male_plumage && (
              <div className="featherframe-plumage-card">
                <h5>♂️ Male Plumage</h5>
                <p>{birdDetails.male_plumage}</p>
              </div>
            )}
            {birdDetails.female_plumage && (
              <div className="featherframe-plumage-card">
                <h5>♀️ Female Plumage</h5>
                <p>{birdDetails.female_plumage}</p>
              </div>
            )}
            {birdDetails.juvenile_plumage && (
              <div className="featherframe-plumage-card">
                <h5>🐤 Juvenile Plumage</h5>
                <p>{birdDetails.juvenile_plumage}</p>
              </div>
            )}
            {birdDetails.breeding_plumage && (
              <div className="featherframe-plumage-card">
                <h5>💕 Breeding Plumage</h5>
                <p>{birdDetails.breeding_plumage}</p>
              </div>
            )}
            {birdDetails.winter_plumage && (
              <div className="featherframe-plumage-card">
                <h5>❄️ Winter Plumage</h5>
                <p>{birdDetails.winter_plumage}</p>
              </div>
            )}
            {birdDetails.summer_plumage && (
              <div className="featherframe-plumage-card">
                <h5>☀️ Summer Plumage</h5>
                <p>{birdDetails.summer_plumage}</p>
              </div>
            )}
            {birdDetails.molt_pattern && (
              <div className="featherframe-plumage-card">
                <h5>🔄 Molt Pattern</h5>
                <p>{birdDetails.molt_pattern}</p>
              </div>
            )}
            {birdDetails.feather_structure && (
              <div className="featherframe-plumage-card">
                <h5>🪶 Feather Structure</h5>
                <p>{birdDetails.feather_structure}</p>
              </div>
            )}
            {birdDetails.iridescence && (
              <div className="featherframe-plumage-card">
                <h5>✨ Iridescence</h5>
                <p>{birdDetails.iridescence}</p>
              </div>
            )}
            {birdDetails.camouflage && (
              <div className="featherframe-plumage-card">
                <h5>🎭 Camouflage</h5>
                <p>{birdDetails.camouflage}</p>
              </div>
            )}
            {birdDetails.ornamental_features && (
              <div className="featherframe-plumage-card">
                <h5>💎 Ornamental Features</h5>
                <p>{birdDetails.ornamental_features}</p>
              </div>
            )}
            {birdDetails.bare_parts && (
              <div className="featherframe-plumage-card">
                <h5>👁️ Bare Parts</h5>
                <p>{birdDetails.bare_parts}</p>
              </div>
            )}
            {birdDetails.eye_color && (
              <div className="featherframe-plumage-card">
                <h5>👁️ Eye Color</h5>
                <p>{birdDetails.eye_color}</p>
              </div>
            )}
            {birdDetails.bill_color && (
              <div className="featherframe-plumage-card">
                <h5>🦜 Bill Color</h5>
                <p>{birdDetails.bill_color}</p>
              </div>
            )}
            {birdDetails.leg_color && (
              <div className="featherframe-plumage-card">
                <h5>🦵 Leg Color</h5>
                <p>{birdDetails.leg_color}</p>
              </div>
            )}
          </div>
        </div>

        {/* Behavior & Ecology */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🦅 Behavior & Ecology</h4>
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
                <label>General Behavior</label>
                <span>{birdDetails.behavior}</span>
              </div>
            )}
            {birdDetails.social_behavior && (
              <div className="featherframe-behavior-item">
                <label>Social Behavior</label>
                <span>{birdDetails.social_behavior}</span>
              </div>
            )}
            {birdDetails.territorial_behavior && (
              <div className="featherframe-behavior-item">
                <label>Territorial Behavior</label>
                <span>{birdDetails.territorial_behavior}</span>
              </div>
            )}
            {birdDetails.foraging_behavior && (
              <div className="featherframe-behavior-item">
                <label>Foraging Behavior</label>
                <span>{birdDetails.foraging_behavior}</span>
              </div>
            )}
            {birdDetails.flight_behavior && (
              <div className="featherframe-behavior-item">
                <label>Flight Behavior</label>
                <span>{birdDetails.flight_behavior}</span>
              </div>
            )}
            {birdDetails.vocalizations && (
              <div className="featherframe-behavior-item">
                <label>Vocalizations</label>
                <span>{birdDetails.vocalizations}</span>
              </div>
            )}
            {birdDetails.communication && (
              <div className="featherframe-behavior-item">
                <label>Communication</label>
                <span>{birdDetails.communication}</span>
              </div>
            )}
            {birdDetails.aggressive_behavior && (
              <div className="featherframe-behavior-item">
                <label>Aggressive Behavior</label>
                <span>{birdDetails.aggressive_behavior}</span>
              </div>
            )}
            {birdDetails.submissive_behavior && (
              <div className="featherframe-behavior-item">
                <label>Submissive Behavior</label>
                <span>{birdDetails.submissive_behavior}</span>
              </div>
            )}
            {birdDetails.play_behavior && (
              <div className="featherframe-behavior-item">
                <label>Play Behavior</label>
                <span>{birdDetails.play_behavior}</span>
              </div>
            )}
            {birdDetails.grooming_behavior && (
              <div className="featherframe-behavior-item">
                <label>Grooming Behavior</label>
                <span>{birdDetails.grooming_behavior}</span>
              </div>
            )}
            {birdDetails.sleep_behavior && (
              <div className="featherframe-behavior-item">
                <label>Sleep Behavior</label>
                <span>{birdDetails.sleep_behavior}</span>
              </div>
            )}
            {birdDetails.alert_behavior && (
              <div className="featherframe-behavior-item">
                <label>Alert Behavior</label>
                <span>{birdDetails.alert_behavior}</span>
              </div>
            )}
            {birdDetails.escape_behavior && (
              <div className="featherframe-behavior-item">
                <label>Escape Behavior</label>
                <span>{birdDetails.escape_behavior}</span>
              </div>
            )}
            {birdDetails.defense_behavior && (
              <div className="featherframe-behavior-item">
                <label>Defense Behavior</label>
                <span>{birdDetails.defense_behavior}</span>
              </div>
            )}
            {birdDetails.courtship_behavior && (
              <div className="featherframe-behavior-item">
                <label>Courtship Behavior</label>
                <span>{birdDetails.courtship_behavior}</span>
              </div>
            )}
            {birdDetails.parental_behavior && (
              <div className="featherframe-behavior-item">
                <label>Parental Behavior</label>
                <span>{birdDetails.parental_behavior}</span>
              </div>
            )}
            {birdDetails.group_behavior && (
              <div className="featherframe-behavior-item">
                <label>Group Behavior</label>
                <span>{birdDetails.group_behavior}</span>
              </div>
            )}
            {birdDetails.learning_behavior && (
              <div className="featherframe-behavior-item">
                <label>Learning Behavior</label>
                <span>{birdDetails.learning_behavior}</span>
              </div>
            )}
            {birdDetails.memory_capacity && (
              <div className="featherframe-behavior-item">
                <label>Memory Capacity</label>
                <span>{birdDetails.memory_capacity}</span>
              </div>
            )}
            {birdDetails.problem_solving && (
              <div className="featherframe-behavior-item">
                <label>Problem Solving</label>
                <span>{birdDetails.problem_solving}</span>
              </div>
            )}
            {birdDetails.tool_use && (
              <div className="featherframe-behavior-item">
                <label>Tool Use</label>
                <span>{birdDetails.tool_use}</span>
              </div>
            )}
            {birdDetails.innovative_behavior && (
              <div className="featherframe-behavior-item">
                <label>Innovative Behavior</label>
                <span>{birdDetails.innovative_behavior}</span>
              </div>
            )}
          </div>
        </div>

        {/* Breeding & Reproduction */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🥚 Breeding & Reproduction</h4>
          </div>
          <div className="featherframe-breeding-grid">
            {birdDetails.breeding && (
              <div className="featherframe-breeding-item">
                <label>Breeding Behavior</label>
                <span>{birdDetails.breeding}</span>
              </div>
            )}
            {birdDetails.breeding_season && (
              <div className="featherframe-breeding-item">
                <label>Breeding Season</label>
                <span>{birdDetails.breeding_season}</span>
              </div>
            )}
            {birdDetails.incubation_period && (
              <div className="featherframe-breeding-item">
                <label>Incubation Period</label>
                <span>{birdDetails.incubation_period}</span>
              </div>
            )}
            {birdDetails.fledging_period && (
              <div className="featherframe-breeding-item">
                <label>Fledging Period</label>
                <span>{birdDetails.fledging_period}</span>
              </div>
            )}
            {birdDetails.clutch_size && (
              <div className="featherframe-breeding-item">
                <label>Clutch Size</label>
                <span>{birdDetails.clutch_size}</span>
              </div>
            )}
            {birdDetails.egg_description && (
              <div className="featherframe-breeding-item">
                <label>Egg Description</label>
                <span>{birdDetails.egg_description}</span>
              </div>
            )}
            {birdDetails.nesting_habits && (
              <div className="featherframe-breeding-item">
                <label>Nesting Habits</label>
                <span>{birdDetails.nesting_habits}</span>
              </div>
            )}
            {birdDetails.parental_care && (
              <div className="featherframe-breeding-item">
                <label>Parental Care</label>
                <span>{birdDetails.parental_care}</span>
              </div>
            )}
            {birdDetails.mating_system && (
              <div className="featherframe-breeding-item">
                <label>Mating System</label>
                <span>{birdDetails.mating_system}</span>
              </div>
            )}
            {birdDetails.pair_bond && (
              <div className="featherframe-breeding-item">
                <label>Pair Bond</label>
                <span>{birdDetails.pair_bond}</span>
              </div>
            )}
            {birdDetails.courtship_display && (
              <div className="featherframe-breeding-item">
                <label>Courtship Display</label>
                <span>{birdDetails.courtship_display}</span>
              </div>
            )}
            {birdDetails.nest_type && (
              <div className="featherframe-breeding-item">
                <label>Nest Type</label>
                <span>{birdDetails.nest_type}</span>
              </div>
            )}
            {birdDetails.nest_location && (
              <div className="featherframe-breeding-item">
                <label>Nest Location</label>
                <span>{birdDetails.nest_location}</span>
              </div>
            )}
            {birdDetails.nest_materials && (
              <div className="featherframe-breeding-item">
                <label>Nest Materials</label>
                <span>{birdDetails.nest_materials}</span>
              </div>
            )}
            {birdDetails.nest_dimensions && (
              <div className="featherframe-breeding-item">
                <label>Nest Dimensions</label>
                <span>{birdDetails.nest_dimensions}</span>
              </div>
            )}
            {birdDetails.egg_color && (
              <div className="featherframe-breeding-item">
                <label>Egg Color</label>
                <span>{birdDetails.egg_color}</span>
              </div>
            )}
            {birdDetails.egg_size && (
              <div className="featherframe-breeding-item">
                <label>Egg Size</label>
                <span>{birdDetails.egg_size}</span>
              </div>
            )}
            {birdDetails.egg_shape && (
              <div className="featherframe-breeding-item">
                <label>Egg Shape</label>
                <span>{birdDetails.egg_shape}</span>
              </div>
            )}
            {birdDetails.egg_weight && (
              <div className="featherframe-breeding-item">
                <label>Egg Weight</label>
                <span>{birdDetails.egg_weight}</span>
              </div>
            )}
            {birdDetails.egg_volume && (
              <div className="featherframe-breeding-item">
                <label>Egg Volume</label>
                <span>{birdDetails.egg_volume}</span>
              </div>
            )}
            {birdDetails.egg_shell_thickness && (
              <div className="featherframe-breeding-item">
                <label>Egg Shell Thickness</label>
                <span>{birdDetails.egg_shell_thickness}</span>
              </div>
            )}
            {birdDetails.egg_incubation_temperature && (
              <div className="featherframe-breeding-item">
                <label>Incubation Temperature</label>
                <span>{birdDetails.egg_incubation_temperature}</span>
              </div>
            )}
            {birdDetails.egg_incubation_humidity && (
              <div className="featherframe-breeding-item">
                <label>Incubation Humidity</label>
                <span>{birdDetails.egg_incubation_humidity}</span>
              </div>
            )}
            {birdDetails.egg_turning_frequency && (
              <div className="featherframe-breeding-item">
                <label>Egg Turning Frequency</label>
                <span>{birdDetails.egg_turning_frequency}</span>
              </div>
            )}
            {birdDetails.hatching_success_rate && (
              <div className="featherframe-breeding-item">
                <label>Hatching Success Rate</label>
                <span>{birdDetails.hatching_success_rate}</span>
              </div>
            )}
            {birdDetails.fledging_success_rate && (
              <div className="featherframe-breeding-item">
                <label>Fledging Success Rate</label>
                <span>{birdDetails.fledging_success_rate}</span>
              </div>
            )}
            {birdDetails.brood_parasitism && (
              <div className="featherframe-breeding-item">
                <label>Brood Parasitism</label>
                <span>{birdDetails.brood_parasitism}</span>
              </div>
            )}
            {birdDetails.cooperative_breeding && (
              <div className="featherframe-breeding-item">
                <label>Cooperative Breeding</label>
                <span>{birdDetails.cooperative_breeding}</span>
              </div>
            )}
            {birdDetails.breeding_age && (
              <div className="featherframe-breeding-item">
                <label>Breeding Age</label>
                <span>{birdDetails.breeding_age}</span>
              </div>
            )}
            {birdDetails.breeding_frequency && (
              <div className="featherframe-breeding-item">
                <label>Breeding Frequency</label>
                <span>{birdDetails.breeding_frequency}</span>
              </div>
            )}
            {birdDetails.breeding_success && (
              <div className="featherframe-breeding-item">
                <label>Breeding Success</label>
                <span>{birdDetails.breeding_success}</span>
              </div>
            )}
          </div>
        </div>

        {/* Distribution & Habitat Details */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🗺️ Distribution & Habitat Details</h4>
          </div>
          <div className="featherframe-distribution-grid">
            {birdDetails.distribution && (
              <div className="featherframe-distribution-item">
                <label>Geographic Distribution</label>
                <span>{birdDetails.distribution}</span>
              </div>
            )}
            {birdDetails.range && (
              <div className="featherframe-distribution-item">
                <label>Range</label>
                <span>{birdDetails.range}</span>
              </div>
            )}
            {birdDetails.habitat_types && (
              <div className="featherframe-distribution-item">
                <label>Habitat Types</label>
                <span>{birdDetails.habitat_types}</span>
              </div>
            )}
            {birdDetails.elevation_range && (
              <div className="featherframe-distribution-item">
                <label>Elevation Range</label>
                <span>{birdDetails.elevation_range}</span>
              </div>
            )}
            {birdDetails.climate_preference && (
              <div className="featherframe-distribution-item">
                <label>Climate Preference</label>
                <span>{birdDetails.climate_preference}</span>
              </div>
            )}
            {birdDetails.biome && (
              <div className="featherframe-distribution-item">
                <label>Biome</label>
                <span>{birdDetails.biome}</span>
              </div>
            )}
            {birdDetails.ecosystem && (
              <div className="featherframe-distribution-item">
                <label>Ecosystem</label>
                <span>{birdDetails.ecosystem}</span>
              </div>
            )}
            {birdDetails.geographic_range && (
              <div className="featherframe-distribution-item">
                <label>Geographic Range</label>
                <span>{birdDetails.geographic_range}</span>
              </div>
            )}
            {birdDetails.altitudinal_range && (
              <div className="featherframe-distribution-item">
                <label>Altitudinal Range</label>
                <span>{birdDetails.altitudinal_range}</span>
              </div>
            )}
            {birdDetails.latitudinal_range && (
              <div className="featherframe-distribution-item">
                <label>Latitudinal Range</label>
                <span>{birdDetails.latitudinal_range}</span>
              </div>
            )}
            {birdDetails.longitudinal_range && (
              <div className="featherframe-distribution-item">
                <label>Longitudinal Range</label>
                <span>{birdDetails.longitudinal_range}</span>
              </div>
            )}
            {birdDetails.continental_distribution && (
              <div className="featherframe-distribution-item">
                <label>Continental Distribution</label>
                <span>{birdDetails.continental_distribution}</span>
              </div>
            )}
            {birdDetails.country_distribution && (
              <div className="featherframe-distribution-item">
                <label>Country Distribution</label>
                <span>{birdDetails.country_distribution}</span>
              </div>
            )}
            {birdDetails.state_distribution && (
              <div className="featherframe-distribution-item">
                <label>State/Province Distribution</label>
                <span>{birdDetails.state_distribution}</span>
              </div>
            )}
            {birdDetails.island_distribution && (
              <div className="featherframe-distribution-item">
                <label>Island Distribution</label>
                <span>{birdDetails.island_distribution}</span>
              </div>
            )}
            {birdDetails.marine_distribution && (
              <div className="featherframe-distribution-item">
                <label>Marine Distribution</label>
                <span>{birdDetails.marine_distribution}</span>
              </div>
            )}
            {birdDetails.freshwater_distribution && (
              <div className="featherframe-distribution-item">
                <label>Freshwater Distribution</label>
                <span>{birdDetails.freshwater_distribution}</span>
              </div>
            )}
            {birdDetails.terrestrial_distribution && (
              <div className="featherframe-distribution-item">
                <label>Terrestrial Distribution</label>
                <span>{birdDetails.terrestrial_distribution}</span>
              </div>
            )}
            {birdDetails.urban_distribution && (
              <div className="featherframe-distribution-item">
                <label>Urban Distribution</label>
                <span>{birdDetails.urban_distribution}</span>
              </div>
            )}
            {birdDetails.rural_distribution && (
              <div className="featherframe-distribution-item">
                <label>Rural Distribution</label>
                <span>{birdDetails.rural_distribution}</span>
              </div>
            )}
            {birdDetails.forest_distribution && (
              <div className="featherframe-distribution-item">
                <label>Forest Distribution</label>
                <span>{birdDetails.forest_distribution}</span>
              </div>
            )}
            {birdDetails.grassland_distribution && (
              <div className="featherframe-distribution-item">
                <label>Grassland Distribution</label>
                <span>{birdDetails.grassland_distribution}</span>
              </div>
            )}
            {birdDetails.desert_distribution && (
              <div className="featherframe-distribution-item">
                <label>Desert Distribution</label>
                <span>{birdDetails.desert_distribution}</span>
              </div>
            )}
            {birdDetails.wetland_distribution && (
              <div className="featherframe-distribution-item">
                <label>Wetland Distribution</label>
                <span>{birdDetails.wetland_distribution}</span>
              </div>
            )}
            {birdDetails.mountain_distribution && (
              <div className="featherframe-distribution-item">
                <label>Mountain Distribution</label>
                <span>{birdDetails.mountain_distribution}</span>
              </div>
            )}
            {birdDetails.coastal_distribution && (
              <div className="featherframe-distribution-item">
                <label>Coastal Distribution</label>
                <span>{birdDetails.coastal_distribution}</span>
              </div>
            )}
            {birdDetails.endemic_status && (
              <div className="featherframe-distribution-item">
                <label>Endemic Status</label>
                <span>{birdDetails.endemic_status}</span>
              </div>
            )}
            {birdDetails.introduced_status && (
              <div className="featherframe-distribution-item">
                <label>Introduced Status</label>
                <span>{birdDetails.introduced_status}</span>
              </div>
            )}
            {birdDetails.migratory_status && (
              <div className="featherframe-distribution-item">
                <label>Migratory Status</label>
                <span>{birdDetails.migratory_status}</span>
              </div>
            )}
            {birdDetails.resident_status && (
              <div className="featherframe-distribution-item">
                <label>Resident Status</label>
                <span>{birdDetails.resident_status}</span>
              </div>
            )}
            {birdDetails.vagrant_status && (
              <div className="featherframe-distribution-item">
                <label>Vagrant Status</label>
                <span>{birdDetails.vagrant_status}</span>
              </div>
            )}
            {birdDetails.accidental_status && (
              <div className="featherframe-distribution-item">
                <label>Accidental Status</label>
                <span>{birdDetails.accidental_status}</span>
              </div>
            )}
          </div>
        </div>

        {/* Threats & Conservation */}
        <div className="featherframe-info-section">
          <div className="featherframe-section-header">
            <h4>🛡️ Threats & Conservation</h4>
          </div>
          <div className="featherframe-conservation-grid">
            {birdDetails.threats && (
              <div className="featherframe-conservation-item">
                <label>Main Threats</label>
                <span>{birdDetails.threats}</span>
              </div>
            )}
            {birdDetails.conservation_efforts && (
              <div className="featherframe-conservation-item">
                <label>Conservation Efforts</label>
                <span>{birdDetails.conservation_efforts}</span>
              </div>
            )}
            {birdDetails.protected_areas && (
              <div className="featherframe-conservation-item">
                <label>Protected Areas</label>
                <span>{birdDetails.protected_areas}</span>
              </div>
            )}
            {birdDetails.legal_protection && (
              <div className="featherframe-conservation-item">
                <label>Legal Protection</label>
                <span>{birdDetails.legal_protection}</span>
              </div>
            )}
            {birdDetails.recovery_plans && (
              <div className="featherframe-conservation-item">
                <label>Recovery Plans</label>
                <span>{birdDetails.recovery_plans}</span>
              </div>
            )}
            {birdDetails.captive_breeding && (
              <div className="featherframe-conservation-item">
                <label>Captive Breeding</label>
                <span>{birdDetails.captive_breeding}</span>
              </div>
            )}
            {birdDetails.habitat_loss && (
              <div className="featherframe-conservation-item">
                <label>Habitat Loss</label>
                <span>{birdDetails.habitat_loss}</span>
              </div>
            )}
            {birdDetails.habitat_degradation && (
              <div className="featherframe-conservation-item">
                <label>Habitat Degradation</label>
                <span>{birdDetails.habitat_degradation}</span>
              </div>
            )}
            {birdDetails.habitat_fragmentation && (
              <div className="featherframe-conservation-item">
                <label>Habitat Fragmentation</label>
                <span>{birdDetails.habitat_fragmentation}</span>
              </div>
            )}
            {birdDetails.climate_change && (
              <div className="featherframe-conservation-item">
                <label>Climate Change Impact</label>
                <span>{birdDetails.climate_change}</span>
              </div>
            )}
            {birdDetails.pollution && (
              <div className="featherframe-conservation-item">
                <label>Pollution</label>
                <span>{birdDetails.pollution}</span>
              </div>
            )}
            {birdDetails.hunting_pressure && (
              <div className="featherframe-conservation-item">
                <label>Hunting Pressure</label>
                <span>{birdDetails.hunting_pressure}</span>
              </div>
            )}
            {birdDetails.trapping && (
              <div className="featherframe-conservation-item">
                <label>Trapping</label>
                <span>{birdDetails.trapping}</span>
              </div>
            )}
            {birdDetails.poaching && (
              <div className="featherframe-conservation-item">
                <label>Poaching</label>
                <span>{birdDetails.poaching}</span>
              </div>
            )}
            {birdDetails.predation && (
              <div className="featherframe-conservation-item">
                <label>Predation</label>
                <span>{birdDetails.predation}</span>
              </div>
            )}
            {birdDetails.disease && (
              <div className="featherframe-conservation-item">
                <label>Disease</label>
                <span>{birdDetails.disease}</span>
              </div>
            )}
            {birdDetails.parasites && (
              <div className="featherframe-conservation-item">
                <label>Parasites</label>
                <span>{birdDetails.parasites}</span>
              </div>
            )}
            {birdDetails.competition && (
              <div className="featherframe-conservation-item">
                <label>Competition</label>
                <span>{birdDetails.competition}</span>
              </div>
            )}
            {birdDetails.invasive_species && (
              <div className="featherframe-conservation-item">
                <label>Invasive Species</label>
                <span>{birdDetails.invasive_species}</span>
              </div>
            )}
            {birdDetails.agricultural_practices && (
              <div className="featherframe-conservation-item">
                <label>Agricultural Practices</label>
                <span>{birdDetails.agricultural_practices}</span>
              </div>
            )}
            {birdDetails.urbanization && (
              <div className="featherframe-conservation-item">
                <label>Urbanization</label>
                <span>{birdDetails.urbanization}</span>
              </div>
            )}
            {birdDetails.deforestation && (
              <div className="featherframe-conservation-item">
                <label>Deforestation</label>
                <span>{birdDetails.deforestation}</span>
              </div>
            )}
            {birdDetails.mining_activities && (
              <div className="featherframe-conservation-item">
                <label>Mining Activities</label>
                <span>{birdDetails.mining_activities}</span>
              </div>
            )}
            {birdDetails.oil_gas_development && (
              <div className="featherframe-conservation-item">
                <label>Oil & Gas Development</label>
                <span>{birdDetails.oil_gas_development}</span>
              </div>
            )}
            {birdDetails.renewable_energy && (
              <div className="featherframe-conservation-item">
                <label>Renewable Energy</label>
                <span>{birdDetails.renewable_energy}</span>
              </div>
            )}
            {birdDetails.transportation && (
              <div className="featherframe-conservation-item">
                <label>Transportation</label>
                <span>{birdDetails.transportation}</span>
              </div>
            )}
            {birdDetails.recreation && (
              <div className="featherframe-conservation-item">
                <label>Recreation</label>
                <span>{birdDetails.recreation}</span>
              </div>
            )}
            {birdDetails.tourism && (
              <div className="featherframe-conservation-item">
                <label>Tourism</label>
                <span>{birdDetails.tourism}</span>
              </div>
            )}
            {birdDetails.wildlife_trade && (
              <div className="featherframe-conservation-item">
                <label>Wildlife Trade</label>
                <span>{birdDetails.wildlife_trade}</span>
              </div>
            )}
            {birdDetails.pet_trade && (
              <div className="featherframe-conservation-item">
                <label>Pet Trade</label>
                <span>{birdDetails.pet_trade}</span>
              </div>
            )}
            {birdDetails.collection_trade && (
              <div className="featherframe-conservation-item">
                <label>Collection Trade</label>
                <span>{birdDetails.collection_trade}</span>
              </div>
            )}
            {birdDetails.conservation_status_trend && (
              <div className="featherframe-conservation-item">
                <label>Conservation Status Trend</label>
                <span>{birdDetails.conservation_status_trend}</span>
              </div>
            )}
            {birdDetails.population_decline_rate && (
              <div className="featherframe-conservation-item">
                <label>Population Decline Rate</label>
                <span>{birdDetails.population_decline_rate}</span>
              </div>
            )}
            {birdDetails.extinction_risk && (
              <div className="featherframe-conservation-item">
                <label>Extinction Risk</label>
                <span>{birdDetails.extinction_risk}</span>
              </div>
            )}
            {birdDetails.recovery_potential && (
              <div className="featherframe-conservation-item">
                <label>Recovery Potential</label>
                <span>{birdDetails.recovery_potential}</span>
              </div>
            )}
            {birdDetails.conservation_priority && (
              <div className="featherframe-conservation-item">
                <label>Conservation Priority</label>
                <span>{birdDetails.conservation_priority}</span>
              </div>
            )}
            {birdDetails.conservation_funding && (
              <div className="featherframe-conservation-item">
                <label>Conservation Funding</label>
                <span>{birdDetails.conservation_funding}</span>
              </div>
            )}
            {birdDetails.conservation_partners && (
              <div className="featherframe-conservation-item">
                <label>Conservation Partners</label>
                <span>{birdDetails.conservation_partners}</span>
              </div>
            )}
            {birdDetails.conservation_volunteers && (
              <div className="featherframe-conservation-item">
                <label>Conservation Volunteers</label>
                <span>{birdDetails.conservation_volunteers}</span>
              </div>
            )}
            {birdDetails.conservation_education && (
              <div className="featherframe-conservation-item">
                <label>Conservation Education</label>
                <span>{birdDetails.conservation_education}</span>
              </div>
            )}
            {birdDetails.conservation_research && (
              <div className="featherframe-conservation-item">
                <label>Conservation Research</label>
                <span>{birdDetails.conservation_research}</span>
              </div>
            )}
            {birdDetails.conservation_monitoring && (
              <div className="featherframe-conservation-item">
                <label>Conservation Monitoring</label>
                <span>{birdDetails.conservation_monitoring}</span>
              </div>
            )}
            {birdDetails.conservation_legislation && (
              <div className="featherframe-conservation-item">
                <label>Conservation Legislation</label>
                <span>{birdDetails.conservation_legislation}</span>
              </div>
            )}
            {birdDetails.conservation_enforcement && (
              <div className="featherframe-conservation-item">
                <label>Conservation Enforcement</label>
                <span>{birdDetails.conservation_enforcement}</span>
              </div>
            )}
            {birdDetails.conservation_success && (
              <div className="featherframe-conservation-item">
                <label>Conservation Success</label>
                <span>{birdDetails.conservation_success}</span>
              </div>
            )}
            {birdDetails.conservation_challenges && (
              <div className="featherframe-conservation-item">
                <label>Conservation Challenges</label>
                <span>{birdDetails.conservation_challenges}</span>
              </div>
            )}
            {birdDetails.conservation_future && (
              <div className="featherframe-conservation-item">
                <label>Conservation Future</label>
                <span>{birdDetails.conservation_future}</span>
              </div>
            )}
          </div>
        </div>

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

        {/* Confidence Score for Image Detection */}
        {searchType === "image" && birdDetails.confidence && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🎯 Detection Confidence</h4>
            </div>
            <div className="featherframe-confidence-display">
              <div className="featherframe-confidence-bar">
                <div 
                  className="featherframe-confidence-fill"
                  style={{ width: `${(birdDetails.confidence * 100)}%` }}
                ></div>
              </div>
              <span className="featherframe-confidence-text">
                {(birdDetails.confidence * 100).toFixed(1)}% confidence
              </span>
            </div>
          </div>
        )}

        {/* Research & Studies */}
        {(birdDetails.research_history || birdDetails.studies || birdDetails.discovery_date || birdDetails.discoverer || birdDetails.taxonomic_history || birdDetails.genetic_studies || birdDetails.behavioral_studies) && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🔬 Research & Studies</h4>
            </div>
            <div className="featherframe-research-grid">
              {birdDetails.research_history && (
                <div className="featherframe-research-item">
                  <label>Research History</label>
                  <span>{birdDetails.research_history}</span>
                </div>
              )}
              {birdDetails.studies && (
                <div className="featherframe-research-item">
                  <label>Key Studies</label>
                  <span>{birdDetails.studies}</span>
                </div>
              )}
              {birdDetails.discovery_date && (
                <div className="featherframe-research-item">
                  <label>Discovery Date</label>
                  <span>{birdDetails.discovery_date}</span>
                </div>
              )}
              {birdDetails.discoverer && (
                <div className="featherframe-research-item">
                  <label>Discoverer</label>
                  <span>{birdDetails.discoverer}</span>
                </div>
              )}
              {birdDetails.taxonomic_history && (
                <div className="featherframe-research-item">
                  <label>Taxonomic History</label>
                  <span>{birdDetails.taxonomic_history}</span>
                </div>
              )}
              {birdDetails.genetic_studies && (
                <div className="featherframe-research-item">
                  <label>Genetic Studies</label>
                  <span>{birdDetails.genetic_studies}</span>
                </div>
              )}
              {birdDetails.behavioral_studies && (
                <div className="featherframe-research-item">
                  <label>Behavioral Studies</label>
                  <span>{birdDetails.behavioral_studies}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Detected Objects for Image Detection */}
        {searchType === "image" && birdDetails.detected_objects && birdDetails.detected_objects.length > 0 && (
          <div className="featherframe-info-section">
            <div className="featherframe-section-header">
              <h4>🔍 Objects Detected</h4>
            </div>
            <div className="featherframe-objects-grid">
              {birdDetails.detected_objects.map((obj, index) => (
                <div key={index} className="featherframe-object-card">
                  <span className="featherframe-object-name">{obj.class}</span>
                  <span className="featherframe-object-confidence">{(obj.confidence * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="featherframe-bird-details-page">
        <div className="featherframe-loading-container">
          <div className="featherframe-loading-spinner"></div>
          <h2>🦅 Loading Bird Details...</h2>
          <p>Please wait while we fetch the information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="featherframe-bird-details-page">
        <div className="featherframe-error-container">
          <div className="featherframe-error-icon">❌</div>
          <h2>Error Loading Bird Details</h2>
          <p>{error}</p>
          <button onClick={handleBackToAI} className="featherframe-back-button">
            ← Back to AI Detection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="featherframe-bird-details-page">
      <div className="featherframe-bird-details-container">
        <div className="featherframe-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={handleBackToAI} className="featherframe-back-button">
              ← Back to AI Detection
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button onClick={toggleDownloadModal} className="featherframe-back-button">Download Info</button>
          </div>
        </div>

        {showDownloadModal && (
          <div role="dialog" aria-modal="true" onClick={() => setShowDownloadModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '10vh 16px', zIndex: 1000 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#ffffff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Download bird info</h3>
                <button onClick={() => setShowDownloadModal(false)} className="featherframe-back-button">✕</button>
              </div>
              <p style={{ marginTop: 0, marginBottom: 12, color: '#6b7280' }}>Choose a format to download the visible details.</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={handleDownloadPDF} className="featherframe-back-button">PDF</button>
                <button onClick={handleDownloadDoc} className="featherframe-back-button">Word (.doc)</button>
                <button onClick={handleDownloadJSON} className="featherframe-back-button">JSON</button>
              </div>
            </div>
          </div>
        )}
        
        <div ref={contentRef}>
          {renderBirdDetails()}
        </div>
      </div>
    </div>
  );
};

export default BirdDetailsPage; 