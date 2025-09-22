import React from "react"
import { Link } from "react-router-dom"
import { footer } from "../../data/Data"
import "./footer.css" 
import logo from "../../../assets/logo.png";

const Footer = () => {
  return (
    <>
      <footer>
        <div className='container'>
          <div className='box1'>
            <div className='footer-logo'>
              <Link to="/" className="footer-logo-link">
                <img src={logo} alt='FeatherFrame Logo' />
              </Link>
              <br />
              <Link to="/" className="footer-brand-link">
                <h2>FeatherFrame</h2>
              </Link>
              <p>Connect with nature through AI-powered bird recognition and join our community of wildlife enthusiasts.</p>

              
            </div>
          </div>

          {footer.map((val, index) => (
            <div className='box' key={index}>
              <h3>{val.title}</h3>
              <ul>
                {val.text.map((items, textIndex) => (
                  <li key={`${index}-${textIndex}`}>
                    <Link to={items.path} className="footer-link">
                      {items.list}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </footer>
      <div className='legal'>
        <span>© 2025 FeatherFrame. Designd By ChamikaM.</span>
      </div>
    </>
  )
}

export default Footer
