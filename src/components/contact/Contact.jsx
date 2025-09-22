import React, { useState } from "react"
import img from "../images/contact.jpeg"
import Back from "../common/Back"
import "./contact.css"

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We\'ll get back to you within 24 hours.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Support',
      subtitle: 'Get help via email',
      contact: 'featherframe.research@gmail.com',
      description: 'For general inquiries and support',
      available: '24/7 Response within 2-4 hours'
    },
    {
      icon: '📞',
      title: 'Phone Support',
      subtitle: 'Talk to our experts',
      contact: '+94 76 764 9475',
      description: 'For urgent bird identification help',
      available: 'Mon-Fri: 8:00 AM - 6:00 PM'
    },
    
    {
      icon: '🎯',
      title: 'Bird ID Emergency',
      subtitle: 'Urgent identification',
      contact: '+94 76 764 9475',
      description: 'For rare bird sightings and emergencies',
      available: '24/7 Emergency Hotline'
    }
  ];

  const faqs = [
    {
      question: 'How accurate is the AI bird identification?',
      answer: 'Our AI has 95%+ accuracy for Sri Lankan bird species, trained on over 1000 images from local ornithologists and researchers.'
    },
    
    {
      question: 'How do I report a rare bird sighting?',
      answer: 'Use our emergency hotline or the "Rare Sighting" feature in the app. Include location, time, photos, and behavior observations.'
    },
    {
      question: 'Is there a cost for using FeatherFrame?',
      answer: 'Basic identification is free. Premium features include unlimited API calls, advanced analytics, and priority support for $9.99/month.'
    },
    {
      question: 'How can I contribute to the bird database?',
      answer: 'Join our citizen science program! Submit verified photos, recordings, and sighting data through our contributor portal.'
    }
  ];

  return (
    <>
      <section className='contact-page mb'>
        <Back name='Contact Us' title='Get Expert Help & Friendly Support' cover={img} />
        
        {/* Hero Section */}
        <div className='contact-hero'>
          <div className='container'>
            <div className='hero-content'>
              <div className='hero-text'>
                <h1>We're Here to Help You Discover Birds</h1>
                <p>Whether you need technical support, bird identification assistance, or want to collaborate with our research team, we're just a message away. Our expert ornithologists and tech support team are ready to help you make the most of your birding experience.</p>
                
                <div className='hero-stats'>
                  <div className='stat-item'>
                    <span className='stat-number'>20+</span>
                    <span className='stat-label'>Users Helped</span>
                  </div>
                  <div className='stat-item'>
                    <span className='stat-number'>24/7</span>
                    <span className='stat-label'>Support Available</span>
                  </div>
                  <div className='stat-item'>
                    <span className='stat-number'>2 hrs</span>
                    <span className='stat-label'>Avg Response Time</span>
                  </div>
                </div>
              </div>
              
              <div className='hero-image'>
                <div className='contact-card'>
                  <h3>Quick Contact</h3>
                  <div className='quick-item'>
                    <span className='icon'>📧</span>
                    <span>featherframe.research@gmail.com</span>
                  </div>
                  <div className='quick-item'>
                    <span className='icon'>📞</span>
                    <span>+94 76 764 9475</span>
                  </div>
                  <div className='quick-item'>
                    <span className='icon'>📍</span>
                    <span>Colombo, Sri Lanka</span>
                  </div>
                  
                  <div className='social-links'>
                    <a href='#' className='social-btn'>
                      <span>WhatsApp</span>
                      <span>💬</span>
                    </a>
                    <a href='#' className='social-btn'>
                      <span>Telegram</span>
                      <span>📱</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Methods */}
        <div className='contact-methods'>
          <div className='container'>
            <div className='section-header'>
              <h2>Choose Your Preferred Contact Method</h2>
              <p>Multiple ways to reach our expert team for all your birding needs</p>
            </div>
            
            <div className='methods-grid'>
              {contactMethods.map((method, index) => (
                <div key={index} className='method-card'>
                  <div className='method-icon'>{method.icon}</div>
                  <h3>{method.title}</h3>
                  <p className='method-subtitle'>{method.subtitle}</p>
                  <div className='method-contact'>{method.contact}</div>
                  <p className='method-description'>{method.description}</p>
                  <div className='method-availability'>{method.available}</div>
                  <button className='contact-btn'>Contact Now</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className='contact-form-section'>
          <div className='container'>
            <div className='form-wrapper'>
              <div className='form-header'>
                <h2>Send Us a Detailed Message</h2>
                <p>Fill out the form below and our team will get back to you within 24 hours</p>
              </div>
              
              <form onSubmit={handleSubmit} className='enhanced-form'>
                <div className='form-row'>
                  <div className='form-group'>
                    <label>Full Name *</label>
                    <input 
                      type='text' 
                      name='name'
                      value={formData.name}
                      onChange={handleChange}
                      placeholder='Enter your full name' 
                      required 
                    />
                  </div>
                  <div className='form-group'>
                    <label>Email Address *</label>
                    <input 
                      type='email' 
                      name='email'
                      value={formData.email}
                      onChange={handleChange}
                      placeholder='your.email@example.com' 
                      required 
                    />
                  </div>
                </div>
                
                <div className='form-group'>
                  <label>Phone Number</label>
                  <input 
                    type='tel' 
                    name='phone'
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder='+94 XXX XXX XXX' 
                  />
                </div>

                <div className='form-group'>
                  <label>Subject *</label>
                  <input 
                    type='text' 
                    name='subject'
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder='What can we help you with?' 
                    required 
                  />
                </div>

                <div className='form-group'>
                  <label>Message *</label>
                  <textarea 
                    name='message'
                    value={formData.message}
                    onChange={handleChange}
                    rows='6' 
                    placeholder='Please provide details about your inquiry, including any specific bird species, location, or technical issues you are experiencing...'
                    required
                  ></textarea>
                </div>

                <div className='form-actions'>
                  <button type='submit' className='submit-btn'>
                    <span>Send Message</span>
                    <span>📧</span>
                  </button>
                </div>
              </form>
              
              <div className='form-note'>
                <span className='note-icon'>🔒</span>
                <span>Your information is secure and will not be shared with third parties</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='faq-section'>
          <div className='container'>
            <div className='section-header'>
              <h2>Frequently Asked Questions</h2>
              <p>Quick answers to common questions about our services</p>
            </div>
            
            <div className='faq-grid'>
              {faqs.map((faq, index) => (
                <div key={index} className='faq-item'>
                  <div className='faq-question'>
                    <span className='faq-icon'>❓</span>
                    <h4>{faq.question}</h4>
                  </div>
                  <p className='faq-answer'>{faq.answer}</p>
                </div>
              ))}
            </div>
            
            <div className='faq-footer'>
              <p>Still have questions? Our support team is here to help!</p>
              <button className='faq-contact-btn'>Contact Support</button>
            </div>
          </div>
        </div>

        {/* Contact Footer */}
        <div className='contact-footer'>
          <div className='container'>
            <div className='footer-content'>
              <div className='footer-section'>
                <h3>Emergency Contact</h3>
                <div className='emergency-contact'>
                  <div className='emergency-number'>📞 +94 76 764 9475</div>
                  <div className='emergency-note'>24/7 Emergency Bird ID Hotline</div>
                </div>
                <p>For urgent bird identification and rare sightings, call our emergency hotline anytime.</p>
              </div>
              
              <div className='footer-section'>
                <h3>Connect With Us</h3>
                <div className='social-grid'>
                  <a href='#' className='social-link'>
                    <span className='social-icon'>📘</span>
                    <span>Facebook</span>
                  </a>
                  <a href='#' className='social-link'>
                    <span className='social-icon'>📷</span>
                    <span>Instagram</span>
                  </a>
                  <a href='#' className='social-link'>
                    <span className='social-icon'>🐦</span>
                    <span>Twitter</span>
                  </a>
                  <a href='#' className='social-link'>
                    <span className='social-icon'>💼</span>
                    <span>LinkedIn</span>
                  </a>
                </div>
                <p>Follow us for birding tips, rare sightings, and conservation updates.</p>
              </div>
              
              <div className='footer-section'>
                <h3>Newsletter</h3>
                <p>Stay updated with the latest birding news, rare sightings, and conservation efforts.</p>
                <div className='newsletter-signup'>
                  <input type='email' placeholder='Enter your email address' />
                  <button>Subscribe</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact
