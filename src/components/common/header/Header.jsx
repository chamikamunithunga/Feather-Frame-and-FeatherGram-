import React, { useState, useEffect } from "react";
import "./header.css";
import { nav } from "../../data/Data";
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../../../contexts/AuthContext";
import { FaRegUserCircle } from "react-icons/fa";
import birdHistoryService from "../../../services/birdHistoryService";
import logo from "../../../assets/logo.png";
import profileIcon from "../../../assets/profileicon.png";

const Header = () => {
  const [navList, setNavList] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [birdCount, setBirdCount] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  // Handle scroll for sticky navbar enhancement
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch bird count when user is authenticated
  useEffect(() => {
    const fetchBirdCount = async () => {
      if (isAuthenticated && user && user.uid) {
        try {
          const history = await birdHistoryService.getUserBirdHistory(user.uid);
          setBirdCount(history.length);
        } catch (error) {
          console.error('Error fetching bird count:', error);
          setBirdCount(0);
        }
      } else {
        setBirdCount(0);
      }
    };

    fetchBirdCount();
  }, [isAuthenticated, user]);

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      try {
        await logout();
        navigate("/");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    } else {
      navigate("/login");
    }
  };

  const handleDropdownClick = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <>
      <header className={isScrolled ? 'sticky' : ''}>
        <div className="container">
          <div className="logo">
            <img src={logo} alt="FeatherFrame Logo" />
          </div>
          <div className="nav">
            <ul className={navList ? "small active" : "flex"}>
              {nav.map((list, index) => (
                <li key={index}>
                  <Link to={list.path} className="nav-link-animate">{list.text}</Link>
                </li>
              ))}
              {/* Show profile button in mobile menu */}
              {navList && (
                <li>
                  {!isAuthenticated ? (
                    <button className="sign-in-btn" onClick={handleAuthAction}>
                      <i className="fa fa-sign-in"></i> Sign In
                    </button>
                  ) : (
                    <div className="profile-container has-notifications">
                      <button className="profile-button" onClick={handleDropdownClick}>
                        <img src={profileIcon} alt="Profile" className="profile-icon-img" />
                      </button>
                      {showDropdown && (
                        <div className="profile-dropdown">
                          <Link to="/social" className="dropdown-item"> 
                            <i className="fa fa-users"></i> Social 
                          </Link>
                          <Link to="/my-list" className="dropdown-item"> 
                            <i className="fa fa-list"></i> My List {birdCount > 0 && <span>{birdCount}</span>} 
                          </Link>
                          <button className="dropdown-item" onClick={handleAuthAction}> 
                            <i className="fa fa-sign-out"></i> Sign Out 
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              )}
            </ul>
          </div>
          {/* Desktop profile button */}
          {!navList && (
            <div className="button">
              {!isAuthenticated ? (
                <button className="sign-in-btn" onClick={handleAuthAction}>
                  <i className="fa fa-sign-in"></i> Sign In
                </button>
              ) : (
                <div className="profile-container has-notifications">
                  <button className="profile-button" onClick={handleDropdownClick}>
                    <img src={profileIcon} alt="Profile" className="profile-icon-img" />
                  </button>
                  {showDropdown && (
                    <div className="profile-dropdown">
                      <Link to="/social" className="dropdown-item"> 
                        <i className="fa fa-users"></i> Social 
                      </Link>
                      <Link to="/my-list" className="dropdown-item"> 
                        <i className="fa fa-list"></i> My List {birdCount > 0 && <span>{birdCount}</span>} 
                      </Link>
                      <button className="dropdown-item" onClick={handleAuthAction}> 
                        <i className="fa fa-sign-out"></i> Sign Out 
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className={`toggle ${navList ? "open" : ""}`}>
            <button onClick={() => setNavList(!navList)}>
              {navList ? (
                <i className="fa fa-times"></i>
              ) : (
                <i className="fa fa-bars"></i>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
