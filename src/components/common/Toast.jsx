import React, { useState, useEffect } from 'react';
import './toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`toast toast-${type} ${isVisible ? 'toast-show' : 'toast-hide'}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={() => {
        setIsVisible(false);
        setTimeout(onClose, 300);
      }}>
        ×
      </button>
    </div>
  );
};

export default Toast; 