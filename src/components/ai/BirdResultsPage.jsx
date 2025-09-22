import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import birdHistoryService from "../../services/birdHistoryService";
import "./BirdResultsPage.css";

// Icon mapping for different sections
  const getSectionIcon = (title) => {
    const icons = {
      'Basic Information': '🏷️',
      'Physical Description': '🎨',
      'Description': '🎨',
      'Measurements': '📏',
      'Habitat': '🌍',
      'Distribution': '🌍',
      'Behavior': '🦅',
      'Diet': '🍽️',
      'Feeding': '🍽️',
      'Breeding': '🥚',
      'Nesting': '🏠',
      'Migration': '✈️',
      'Conservation': '🛡️',
      'Status': '🛡️',
      'Vocalization': '🎵',
      'Sounds': '🎵',
      'Taxonomy': '🔬',
      'Classification': '🔬',
      'Lifespan': '⏳',
      'Subspecies': '🧬',
      'Similar Species': '👥',
      'Fun Facts': '🎯',
      'Seasonal Behavior': '🗓️',
      'Geographic Breakdown': '🗺️',
      'Sightings & Locations': '📍',
      'Additional Information': '📚',
      'Research Notes': '📝',
      'Identification Tips': '🔍'
    };

    const key = Object.keys(icons).find(key => title.includes(key));
    return key ? icons[key] : '📋';
  };

const BirdResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [birdDetails, setBirdDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSriLankanEndemic, setIsSriLankanEndemic] = useState(false);
  const [enriched, setEnriched] = useState(false);
  const [geo, setGeo] = useState({ countries: [], regions: [], forests: [] });
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const contentRef = useRef(null);
  const sectionRefs = useRef([]);

  // Scroll animation effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1, rootMargin: '50px 0px' }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [birdDetails]);

  // Helper to add refs to sections
  const setSectionRef = (el) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };


  useEffect(() => {
    const run = async () => {
      if (!birdDetails) {
        setGeo({ countries: [], regions: [], forests: [] });
        return;
      }
      try {
        const speciesName = birdDetails.common_name || birdDetails.scientific_name || '';
        const occ = Array.isArray(birdDetails.occurrences) ? birdDetails.occurrences : [];
        const resp = await fetch('http://127.0.0.1:3001/api/geo-breakdown', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ speciesName, occurrences: occ })
        });
        const data = await resp.json();
        setGeo({
          countries: Array.isArray(data.countries) ? data.countries : [],
          regions: Array.isArray(data.regions) ? data.regions : [],
          forests: Array.isArray(data.forests) ? data.forests : []
        });
      } catch (e) {
        setGeo({ countries: [], regions: [], forests: [] });
      }
    };
    run();
  }, [birdDetails]);

  // Auto-enrich details using backend /search-bird if fields are missing
  useEffect(() => {
    const needsEnrichment = (d) => {
      if (!d) return false;
      const keys = [
        'scientific_name','family','order','habitat','description','conservation_status','distribution','diet','breeding','migration'
      ];
      return keys.some(k => !d[k] || (Array.isArray(d[k]) && d[k].length === 0));
    };
    const enrich = async () => {
      try {
        if (!birdDetails || enriched) return;
        const speciesName = birdDetails.common_name || birdDetails.scientific_name;
        if (!speciesName) return;
        if (!needsEnrichment(birdDetails)) { setEnriched(true); return; }
        const resp = await fetch(`http://127.0.0.1:5001/search-bird?name=${encodeURIComponent(speciesName)}`);
        if (!resp.ok) { setEnriched(true); return; }
        const data = await resp.json();
        const extra = data?.bird_details || {};
        // Merge, prefer existing predicted names, fill missing fields from enrichment
        setBirdDetails(prev => ({
          ...(prev || {}),
          scientific_name: prev?.scientific_name || extra.scientific_name,
          family: prev?.family || extra.family,
          order: prev?.order || extra.order,
          habitat: prev?.habitat || extra.habitat,
          description: prev?.description || extra.description,
          conservation_status: prev?.conservation_status || extra.conservation_status,
          distribution: prev?.distribution || extra.distribution,
          behavior: prev?.behavior || extra.behavior,
          diet: prev?.diet || extra.diet,
          breeding: prev?.breeding || extra.breeding,
          migration: prev?.migration || extra.migration,
          occurrences: Array.isArray(prev?.occurrences) && prev.occurrences.length ? prev.occurrences : (extra.occurrences || []),
          image_url: prev?.image_url || extra.image_url
        }));
      } finally {
        setEnriched(true);
      }
    };
    enrich();
  }, [birdDetails, enriched]);

  useEffect(() => {
    const fetchBirdDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        const birdData = location.state?.birdData;
        const searchQuery = location.state?.searchQuery;

        if (birdData) {
          let processedData = birdData;
          if (birdData.profile) {
            processedData = { ...birdData.profile };
          }
          if (birdData.bird_details) {
            processedData = { ...birdData.bird_details };
          }
          // Fallbacks from top-level response if profile is minimal
          if (!processedData.common_name && birdData.species) {
            processedData.common_name = birdData.species;
          }
          if (!processedData.scientific_name && birdData.scientific_name) {
            processedData.scientific_name = birdData.scientific_name;
          }
          if (!processedData.alternatives && Array.isArray(birdData.alternatives)) {
            processedData.alternatives = birdData.alternatives;
          }
          if (typeof birdData.confidence === 'number' && processedData.confidence == null) {
            processedData.confidence = birdData.confidence;
          }
          if (typeof birdData.low_confidence === 'boolean' && processedData.low_confidence == null) {
            processedData.low_confidence = birdData.low_confidence;
          }
          if (birdData.advice && !processedData.advice) {
            processedData.advice = birdData.advice;
          }
          setBirdDetails(processedData);
          
          // Save to user's bird history if authenticated and not already saved from BirdDetector
          if (user && user.uid && processedData && !location.state?.fromDetector) {
            try {
              const searchType = location.state?.searchType || 'search';
              await birdHistoryService.saveBirdToHistory(user.uid, processedData, searchType);
              console.log("Bird saved to history from results page");
            } catch (historyError) {
              console.error("Failed to save to history:", historyError);
            }
          }
        } else if (searchQuery) {
          const response = await fetch(
            `http://127.0.0.1:5001/search-bird?name=${encodeURIComponent(searchQuery)}`
          );
          if (!response.ok) {
            throw new Error("Failed to fetch bird details");
          }
          const data = await response.json();
          let processedData = data;
          if (data.bird_details) {
            processedData = { ...data.bird_details };
          }
          setBirdDetails(processedData);
          
          // Save to user's bird history if authenticated
          if (user && user.uid && processedData) {
            try {
              await birdHistoryService.saveBirdToHistory(user.uid, processedData, 'search');
              console.log("Bird saved to history from search query");
            } catch (historyError) {
              console.error("Failed to save to history:", historyError);
            }
          }
        } else {
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

  // Sri Lankan Endemic Bird Detection
  useEffect(() => {
    if (birdDetails) {
      const commonName = (birdDetails.common_name || '').toLowerCase();
      const scientificName = (birdDetails.scientific_name || '').toLowerCase();
      const habitat = (birdDetails.habitat || '').toLowerCase();
      const distribution = (birdDetails.distribution || '').toLowerCase();
      
      // Check for Sri Lankan endemic indicators
      const sriLankanKeywords = [
        'sri lanka', 'ceylon', 'sinharaja', 'endemic to sri lanka',
        'urocissa ornata', 'gallus lafayettii', 'phaenicophaeus pyrrhocephalus',
        'sri lanka blue magpie', 'sri lanka junglefowl', 'red-faced malkoha',
        'yellow-eared bulbul', 'ceylon frogmouth', 'sri lanka whistling thrush'
      ];
      
      const isEndemic = sriLankanKeywords.some(keyword => 
        commonName.includes(keyword) || 
        scientificName.includes(keyword) || 
        habitat.includes(keyword) ||
        distribution.includes(keyword)
      );
      
      setIsSriLankanEndemic(isEndemic);
    }
  }, [birdDetails]);

  const handleBackToAI = () => {
    navigate("/ai");
  };

  // Export helpers
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

  const handleDownloadDoc = () => {
    const fileName = `${getFileBaseName()}.doc`;
    
    // Create professional Word document content
    const createDocContent = () => {
      const header = `
        <div style="text-align: center; border-bottom: 3px solid #22c55e; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #0f766e; font-size: 28px; margin: 0;">${birdDetails.common_name || 'Bird Information'}</h1>
          ${birdDetails.scientific_name ? `<p style="color: #059669; font-style: italic; font-size: 18px; margin: 10px 0 0 0;">${birdDetails.scientific_name}</p>` : ''}
          <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">🌿 Generated by FeatherFrame AI - ${new Date().toLocaleDateString()}</p>
        </div>
      `;

      const sections = [
        { emoji: '🎨', title: 'Physical Description', content: birdDetails.physical_description },
        { emoji: '🌍', title: 'Habitat & Distribution', content: birdDetails.habitat },
        { emoji: '🦅', title: 'Behavior', content: birdDetails.behavior },
        { emoji: '🍽️', title: 'Diet', content: birdDetails.diet },
        { emoji: '🥚', title: 'Breeding', content: birdDetails.breeding },
        { emoji: '✈️', title: 'Migration', content: birdDetails.migration },
        { emoji: '🛡️', title: 'Conservation Status', content: birdDetails.conservation_status }
      ];

      let sectionsHtml = '';
      sections.forEach(section => {
        if (section.content && section.content !== 'Not available') {
          sectionsHtml += `
            <div style="margin-bottom: 25px; padding: 20px; background-color: #f9fafb; border-left: 4px solid #22c55e; border-radius: 8px;">
              <h3 style="color: #0f766e; font-size: 18px; margin: 0 0 12px 0;">${section.emoji} ${section.title}</h3>
              <p style="color: #1e293b; line-height: 1.6; margin: 0; font-size: 14px;">${section.content}</p>
            </div>
          `;
        }
      });

      // Geographic information
      let geoHtml = '';
      if (geo.countries?.length > 0) {
        const countriesText = geo.countries.map(c => `${c.name} (${c.count} sightings)`).join(', ');
        geoHtml += `
          <div style="margin-bottom: 25px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
            <h3 style="color: #0f766e; font-size: 18px; margin: 0 0 12px 0;">🗺️ Geographic Distribution</h3>
            <p style="color: #1e293b; line-height: 1.6; margin: 0; font-size: 14px;">${countriesText}</p>
          </div>
        `;
      }

      if (geo.regions?.length > 0) {
        const regionsText = geo.regions.slice(0, 10).map(r => r.name).join(', ');
        geoHtml += `
          <div style="margin-bottom: 25px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px;">
            <h3 style="color: #0f766e; font-size: 18px; margin: 0 0 12px 0;">📍 Key Regions</h3>
            <p style="color: #1e293b; line-height: 1.6; margin: 0; font-size: 14px;">${regionsText}</p>
          </div>
        `;
      }

      return header + sectionsHtml + geoHtml;
    };

    const pre = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${birdDetails.common_name || 'Bird'} Information</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; background-color: #ffffff; }
        </style>
      </head>
      <body>
    `;
    const post = "</body></html>";
    const html = pre + createDocContent() + post;
    
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setShowDownloadModal(false);
  };

  const handleDownloadPDF = () => {
    const win = window.open("", "_blank", "width=1024,height=768");
    if (!win) return;
    
    // Create professional PDF content
    const createPDFContent = () => {
      const header = `
        <div style="text-align: center; border-bottom: 3px solid #22c55e; padding-bottom: 30px; margin-bottom: 40px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 40px 20px; border-radius: 12px;">
          <h1 style="color: #0f766e; font-size: 36px; margin: 0; font-weight: bold;">${birdDetails.common_name || 'Bird Information'}</h1>
          ${birdDetails.scientific_name ? `<p style="color: #059669; font-style: italic; font-size: 20px; margin: 15px 0 0 0;">${birdDetails.scientific_name}</p>` : ''}
          <p style="color: #6b7280; font-size: 14px; margin: 20px 0 0 0;">🌿 Generated by FeatherFrame AI • ${new Date().toLocaleDateString()} 🦜</p>
        </div>
      `;

      const sections = [
        { emoji: '🎨', title: 'Physical Description', content: birdDetails.physical_description },
        { emoji: '🌍', title: 'Habitat & Distribution', content: birdDetails.habitat },
        { emoji: '🦅', title: 'Behavior', content: birdDetails.behavior },
        { emoji: '🍽️', title: 'Diet', content: birdDetails.diet },
        { emoji: '🥚', title: 'Breeding', content: birdDetails.breeding },
        { emoji: '✈️', title: 'Migration', content: birdDetails.migration },
        { emoji: '🛡️', title: 'Conservation Status', content: birdDetails.conservation_status }
      ];

      let sectionsHtml = '';
      sections.forEach(section => {
        if (section.content && section.content !== 'Not available') {
          sectionsHtml += `
            <div style="margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-left: 5px solid #22c55e; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
              <h2 style="color: #0f766e; font-size: 22px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">${section.emoji}</span> ${section.title}
              </h2>
              <p style="color: #1e293b; line-height: 1.8; margin: 0; font-size: 16px; text-align: justify;">${section.content}</p>
            </div>
          `;
        }
      });

      // Geographic information
      let geoHtml = '';
      if (geo.countries?.length > 0) {
        const countriesText = geo.countries.map(c => `${c.name} (${c.count} sightings)`).join(', ');
        geoHtml += `
          <div style="margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 5px solid #22c55e; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #0f766e; font-size: 22px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">🗺️</span> Geographic Distribution
            </h2>
            <p style="color: #1e293b; line-height: 1.8; margin: 0; font-size: 16px;">${countriesText}</p>
          </div>
        `;
      }

      if (geo.regions?.length > 0) {
        const regionsText = geo.regions.slice(0, 10).map(r => r.name).join(', ');
        geoHtml += `
          <div style="margin-bottom: 30px; padding: 25px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-left: 5px solid #22c55e; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <h2 style="color: #0f766e; font-size: 22px; margin: 0 0 15px 0; display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 24px;">📍</span> Key Regions
            </h2>
            <p style="color: #1e293b; line-height: 1.8; margin: 0; font-size: 16px;">${regionsText}</p>
          </div>
        `;
      }

      const footer = `
        <div style="margin-top: 50px; padding: 20px; text-align: center; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 2px solid #22c55e;">
          <p style="color: #059669; font-size: 14px; margin: 0; font-weight: 600;">🌿 Thank you for using FeatherFrame AI for bird identification! 🦅</p>
        </div>
      `;

      return header + sectionsHtml + geoHtml + footer;
    };
    
    const styles = `
      <style>
        @media print {
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important; 
            color: #111827 !important;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: white !important;
          }
          div { break-inside: avoid; }
        }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 40px 20px; 
          background-color: #ffffff; 
          color: #111827;
        }
      </style>
    `;
    
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${getFileBaseName()}</title>${styles}</head><body>${createPDFContent()}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      setTimeout(() => win.close(), 500);
    }, 400);
    setShowDownloadModal(false);
  };

  if (loading) {
    return (
      <div className="bird-results-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Searching for bird information...</h2>
          <p>Please wait while we gather the details</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bird-results-page">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBackToAI} className="back-button">
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  if (!birdDetails) {
    return (
      <div className="bird-results-page">
        <div className="no-data-container">
          <div className="no-data-icon">🦅</div>
          <h2>No Bird Data Found</h2>
          <p>We couldn't find information for this bird species.</p>
          <button onClick={handleBackToAI} className="back-button">
            ← Back to Search
          </button>
        </div>
      </div>
    );
  }

  const occurrences = Array.isArray(birdDetails.occurrences) ? birdDetails.occurrences : [];

  const normalizeOccurrence = (o) => ({
    country: o.country || o.countryCode || o.cntry || o.country_name || o.country_name_en || null,
    region: o.subnational2Name || o.subnational1Name || o.region || o.state || o.province || o.district || null,
    locName: o.locName || o.location || o.place || o.site || o.park || o.area || ""
  });

  const countryCounts = {};
  const cityCounts = {};
  const forestCounts = {};
  const forestRegex = /(national park|forest|reserve|sanctuary|woods|rainforest|jungle|wildlife|nature|biosphere|conservancy|protected area|game reserve|state park|park)/i;

  occurrences.forEach(raw => {
    const o = normalizeOccurrence(raw);
    if (o.country) countryCounts[o.country] = (countryCounts[o.country] || 0) + 1;
    if (o.region)  cityCounts[o.region]   = (cityCounts[o.region]   || 0) + 1;
    if (forestRegex.test(o.locName)) {
      const key = o.locName.trim();
      forestCounts[key] = (forestCounts[key] || 0) + 1;
    }
  });

  const topN = (obj, n = 8) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, n);
  const topCountries = topN(countryCounts);
  const topCities = topN(cityCounts);
  const topForests = topN(forestCounts);

  return (
    <div className="bird-results-page">
      <div className="results-container">
        {/* Header */}
        <div className="results-header">
          <button onClick={handleBackToAI} className="back-button">
            ← Back to Search
          </button>
          <h1>Bird Information</h1>
          <button onClick={() => setShowDownloadModal(true)} className="download-button">Download Info</button>
        </div>

        {/* Modal */}
        {showDownloadModal && (
          <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShowDownloadModal(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3 className="modal-title">Download bird info</h3>
                <button onClick={() => setShowDownloadModal(false)} className="modal-close">✕</button>
              </div>
              <p className="modal-desc">Choose a format to download the visible details.</p>
              <div className="format-row">
                <button onClick={handleDownloadPDF} className="format-button">PDF</button>
                <button onClick={handleDownloadDoc} className="format-button">Word (.doc)</button>
                <button onClick={handleDownloadJSON} className="format-button">JSON</button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="bird-card" ref={contentRef}>
          {/* Bird Information Form */}
          <div className={`bird-info-form ${isSriLankanEndemic ? 'sinharaja-theme' : ''}`}>
            {/* Title */}
            <div className="form-title">
              <h2>{birdDetails.common_name || 'Unknown Bird'}</h2>
              {birdDetails.scientific_name && (
                <p className="scientific-name">{birdDetails.scientific_name}</p>
              )}
              
              {/* Sinharaja Endemic Badge */}
              {isSriLankanEndemic && (
                <div className="sinharaja-badge">
                  🌿 Sri Lankan Endemic Species - Sinharaja Rainforest
                </div>
              )}
              {(birdDetails.confidence !== undefined || birdDetails.alternatives) && (
                <div className="identification-info">
                  {birdDetails.confidence !== undefined && (
                    <span className="confidence-badge">
                      🎯 {Math.round(birdDetails.confidence * 100)}% Confidence
                    </span>
                  )}
                  {birdDetails.low_confidence && (
                    <span className="warning-badge">⚠️ Low Confidence Detection</span>
                  )}
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="form-section" ref={setSectionRef}>
              <h3>
                <span className="section-icon">{getSectionIcon('Basic Information')}</span>
                Basic Information
              </h3>
              <div className="form-grid">
                {birdDetails.family && (
                  <div className="form-field">
                    <label>Family</label>
                    <span className="field-value">{birdDetails.family}</span>
                  </div>
                )}
                {birdDetails.order && (
                  <div className="form-field">
                    <label>Order</label>
                    <span className="field-value">{birdDetails.order}</span>
                  </div>
                )}
                {birdDetails.species_code && (
                  <div className="form-field">
                    <label>Species Code</label>
                    <span className="field-value">{birdDetails.species_code}</span>
                  </div>
                )}
                {birdDetails.conservation_status && (
                  <div className="form-field">
                    <label>Conservation Status</label>
                    <span className="field-value status-badge">{birdDetails.conservation_status}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {birdDetails.description && (
              <div className="form-section" ref={setSectionRef}>
                <h3>
                  <span className="section-icon">{getSectionIcon('Description')}</span>
                  Description
                </h3>
                <div className="form-field full-width">
                  <span className="field-value description-text">{birdDetails.description}</span>
                </div>
              </div>
            )}

            {/* Identification Summary */}
            {(birdDetails.common_name || birdDetails.scientific_name || typeof birdDetails.confidence === 'number') && (
              <div className="form-section" ref={setSectionRef}>
                <h3>
                  <span className="section-icon">{getSectionIcon('Identification')}</span>
                  Identification
                </h3>
                <div className="form-grid">
                  {birdDetails.common_name && (
                    <div className="form-field">
                      <label>Predicted Species</label>
                      <span className="field-value">{birdDetails.common_name}</span>
                    </div>
                  )}
                  {birdDetails.scientific_name && (
                    <div className="form-field">
                      <label>Scientific Name</label>
                      <span className="field-value">{birdDetails.scientific_name}</span>
                    </div>
                  )}
                  {typeof birdDetails.confidence === 'number' && (
                    <div className="form-field">
                      <label>Confidence</label>
                      <span className="field-value">{(birdDetails.confidence * 100).toFixed(1)}%</span>
                    </div>
                  )}
                </div>
                {Array.isArray(birdDetails.alternatives) && birdDetails.alternatives.length > 0 && (
                  <div className="form-field full-width" style={{ marginTop: '8px' }}>
                    <label>Top Alternatives</label>
                    <div className="alt-list">
                      {birdDetails.alternatives.slice(0,5).map((a, i) => (
                        <span key={i} className="alt-chip">{a.species} {(a.confidence!=null)?`(${(a.confidence*100).toFixed(1)}%)`:''}</span>
                      ))}
                    </div>
                  </div>
                )}
                {birdDetails.low_confidence && birdDetails.advice && (
                  <div className="form-field full-width">
                    <label>Advice</label>
                    <span className="field-value">{birdDetails.advice}</span>
                  </div>
                )}
              </div>
            )}

            {/* Habitat & Distribution */}
            <div className="form-section" ref={setSectionRef}>
              <h3>
                <span className="section-icon">{getSectionIcon('Habitat')}</span>
                Habitat & Distribution
              </h3>
              <div className="form-grid">
                {birdDetails.habitat && (
                  <div className="form-field">
                    <label>Habitat</label>
                    <span className="field-value">{birdDetails.habitat}</span>
                  </div>
                )}
                {birdDetails.distribution && (
                  <div className="form-field">
                    <label>Distribution</label>
                    <span className="field-value">{birdDetails.distribution}</span>
                  </div>
                )}
                {birdDetails.migration && (
                  <div className="form-field">
                    <label>Migration</label>
                    <span className="field-value">{birdDetails.migration}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Migration Patterns */}
            {(birdDetails.migration || birdDetails.migratory_status || birdDetails.migration_routes || birdDetails.migration_timing || birdDetails.migration_distance || birdDetails.migration_ranges) && (
              <div className="form-section" ref={setSectionRef}>
                <h3>
                  <span className="section-icon">{getSectionIcon('Migration')}</span>
                  Migration Patterns
                </h3>
                <div className="form-grid">
                  {birdDetails.migratory_status && (
                    <div className="form-field">
                      <label>Status</label>
                      <span className="field-value">{birdDetails.migratory_status}</span>
                    </div>
                  )}
                  {birdDetails.migration && (
                    <div className="form-field">
                      <label>Type</label>
                      <span className="field-value">{birdDetails.migration}</span>
                    </div>
                  )}
                  {birdDetails.migration_routes && (
                    <div className="form-field">
                      <label>Routes</label>
                      <span className="field-value">{birdDetails.migration_routes}</span>
                    </div>
                  )}
                  {birdDetails.migration_timing && (
                    <div className="form-field">
                      <label>Timing</label>
                      <span className="field-value">{birdDetails.migration_timing}</span>
                    </div>
                  )}
                  {birdDetails.migration_ranges && (
                    <div className="form-field">
                      <label>Ranges</label>
                      <span className="field-value">{birdDetails.migration_ranges}</span>
                    </div>
                  )}
                  {birdDetails.migration_distance && (
                    <div className="form-field">
                      <label>Distance</label>
                      <span className="field-value">{birdDetails.migration_distance}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sightings & Locations */}
            {(Array.isArray(birdDetails.occurrences) && birdDetails.occurrences.length > 0) && (
              <div className="form-section" ref={setSectionRef}>
                <h3>
                  <span className="section-icon">{getSectionIcon('Sightings & Locations')}</span>
                  Sightings & Locations
                </h3>
                <div className="location-list">
                  {(() => {
                    const counts = {};
                    occurrences.forEach(o => {
                      const name = o.locName || 'Unknown Location';
                      counts[name] = (counts[name] || 0) + 1;
                    });
                    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0,8);
                    return sorted.map(([name, count], idx) => (
                      <div key={idx} className="location-item">
                        <span className="location-name">{name}</span>
                        <span className="location-count">{count} sighting{count>1?'s':''}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Geographic Breakdown */}
            <div className="form-section" ref={setSectionRef}>
              <h3>
                <span className="section-icon">{getSectionIcon('Geographic Breakdown')}</span>
                Geographic Breakdown
              </h3>
              <div className="geo-grid">
                <div className="geo-card">
                  <h4>
                    <span className="section-icon">🌍</span>
                    Countries
                  </h4>
                  {geo.countries?.length ? (
                    <ul>
                      {geo.countries.slice(0,8).map((c, i) => (
                        <li key={i}>{c.name} — {c.count}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No data</p>
                  )}
                </div>
                <div className="geo-card">
                  <h4>
                    <span className="section-icon">🏙️</span>
                    Cities/Regions
                  </h4>
                  {geo.regions?.length ? (
                    <ul>
                      {geo.regions.slice(0,8).map((r, i) => (
                        <li key={i}>{r.name} — {r.count}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No data</p>
                  )}
                </div>
                <div className="geo-card">
                  <h4>
                    <span className="section-icon">🌲</span>
                    Forests/Protected Areas
                  </h4>
                  {geo.forests?.length ? (
                    <ul>
                      {geo.forests.slice(0,8).map((f, i) => (
                        <li key={i}>{f.name} — {f.count}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="muted">No data</p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information */}
            {(() => {
              const skipFields = new Set([
                'image_url','photo_url','picture','common_name','scientific_name','description','occurrences'
              ]);
              const entries = Object.entries(birdDetails || {}).filter(([k,v]) => !skipFields.has(k) && v && typeof v !== 'object');
              if (!entries.length) return null;
              return (
                <div className="form-section" ref={setSectionRef}>
                  <h3>
                    <span className="section-icon">{getSectionIcon('Additional Information')}</span>
                    Additional Information
                  </h3>
                  <div className="form-grid">
                    {entries.map(([key, value]) => (
                      <div className="form-field" key={key}>
                        <label>{key.replace(/_/g,' ')}</label>
                        <span className="field-value">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Sinharaja Rainforest Information for Sri Lankan Endemic Species */}
            {isSriLankanEndemic && (
              <div className="sinharaja-info">
                <h4>🌿 Sinharaja Rainforest Reserve - UNESCO World Heritage Site</h4>
                <p>
                  <strong>This endemic species is found in the Sinharaja Rainforest Reserve</strong>, Sri Lanka's last viable area of primary tropical rainforest. 
                  Located in southwest Sri Lanka, Sinharaja is a biodiversity hotspot and UNESCO World Heritage Site since 1988.
                </p>
                <p>
                  <strong>About Sinharaja:</strong> This 11,187-hectare reserve is home to over 50% of Sri Lanka's endemic mammals and butterflies, 
                  and many of its endemic trees, insects, amphibians, reptiles, and birds. The forest canopy reaches 35-40 meters with some emergent trees up to 50 meters.
                </p>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1rem'}}>
                  <div>
                    <h5>🦋 Biodiversity Stats:</h5>
                    <ul>
                      <li>95% of endemic birds found here</li>
                      <li>50+ endemic mammals and butterflies</li> 
                      <li>16 endemic bird species</li>
                      <li>217 woody plant species</li>
                    </ul>
                  </div>
                  <div>
                    <h5>🏛️ Conservation Status:</h5>
                    <ul>
                      <li>UNESCO World Heritage Site (1988)</li>
                      <li>National Heritage Wilderness Area</li>
                      <li>Biosphere Reserve</li>
                      <li>Primary tropical rainforest</li>
                    </ul>
                  </div>
                </div>
                <p style={{marginTop: '1rem', fontStyle: 'italic', color: '#047857'}}>
                  🌍 <strong>Conservation Note:</strong> Protecting Sinharaja Rainforest is crucial for the survival of Sri Lanka's endemic species. 
                  Habitat loss and human encroachment remain the primary threats to these unique birds.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BirdResultsPage; 