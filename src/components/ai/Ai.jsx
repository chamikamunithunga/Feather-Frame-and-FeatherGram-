import React from "react";
import BirdDetector from "./BirdDetector";
import "./Ai.css";

const Ai = () => {
  return (
    <>
      <div className="featherframe-ai-section">
        <div className="featherframe-ai-container">
          <div className="featherframe-ai-header">
            <h2 className="featherframe-ai-title">AI Bird Detection</h2>
            <p className="featherframe-ai-subtitle">
              Upload bird images for AI-powered identification and search our comprehensive bird database
            </p>
          </div>
          <BirdDetector />
        </div>
      </div>
      
      {/* Animated Logo Tape */}
      <div className="featherframe-logo-tape-section">
        <div className="featherframe-logo-tape-container">
          <div className="featherframe-logo-text">FeatherFrame</div>
          <div className="featherframe-logo-text gram">FeatherGram</div>
          <div className="featherframe-logo-text">FeatherFrame</div>
          <div className="featherframe-logo-text gram">FeatherGram</div>
          <div className="featherframe-logo-text">FeatherFrame</div>
          <div className="featherframe-logo-text gram">FeatherGram</div>
        </div>
      </div>
    </>
  );
};

export default Ai; 