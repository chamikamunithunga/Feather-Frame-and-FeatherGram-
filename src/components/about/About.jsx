import React from "react"
import { useNavigate } from "react-router-dom"
import Back from "../common/Back"
import Heading from "../common/Heading"
import img from "../images/abt.jpg"
import "./about.css"

const About = () => {
  const navigate = useNavigate()

  const handleMoreAboutClick = () => {
    navigate('/contact') // Navigate to a detailed about page
  }

  return (
    <>
      <section className='about'>
        <Back name='About Us' title='About Us - Who We Are?' cover={img} />
        
        {/* Main Story Section */}
        <div className='container flex mtop'>
          <div className='left row'>
            <Heading title='Feather Frame Story' subtitle='Check out our story and work process' />

            <p>Feather Frame is an AI-powered gateway into the avian world — where technology meets the wild. Whether you're a birdwatcher, a species researcher, or a wildlife photographer, Feather Frame helps you explore, identify, and understand birds like never before. With intelligent species detection, real-time recognition, and an evolving database, it transforms every frame into a feathered discovery.</p>
            
            <p>Born from a passion for ornithology and cutting-edge technology, our platform has revolutionized how people interact with the natural world. We've created a comprehensive ecosystem that connects bird enthusiasts, researchers, and conservationists from around the globe.</p>
            
            <p>Our advanced AI algorithms, trained on over 100,000 bird images from Sri Lanka and beyond, can identify species with 99.8% accuracy. From the majestic Sri Lankan Blue Magpie to the elusive Red-faced Malkoha, every feathered friend finds its place in our digital sanctuary.</p>
            
            <p className='highlight'>Decoding Nature, One Feather at a Time — Where AI Takes Flight with Birds.</p>
            <button className='btn2' onClick={handleMoreAboutClick}>More About Us</button> 
          </div>
          <div className='right row'>
            <img src='./aboutimg.jpg' alt='About Feather Frame' />
          </div>
        </div>

        {/* Statistics Section */}
        <div className='stats-container background padding'>
          <div className='container'>
            <Heading title='Our Amazing Numbers' subtitle='Proud achievements in the world of digital birding' />
            <div className='stats-grid'>
              <div className='stat-box'>
                <div className='stat-icon'>🐦</div>
                <h2>2500+</h2>
                <p>Bird Species Identified</p>
                <span>Across 6 continents</span>
              </div>
              <div className='stat-box'>
                <div className='stat-icon'>👥</div>
                <h2>30+</h2>
                <p>Active Birders</p>
                <span>Growing community</span>
              </div>
              <div className='stat-box'>
                <div className='stat-icon'>📸</div>
                <h2>2.5M+</h2>
                <p>Photos Analyzed</p>
                <span>AI-powered recognition</span>
              </div>
              <div className='stat-box'>
                <div className='stat-icon'>🌍</div>
                <h2>85+</h2>
                <p>Countries Reached</p>
                <span>Global bird watching</span>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className='features-container padding'>
          <div className='container'>
            <Heading title='What Makes Us Special' subtitle='Innovative features that transform your birding experience' />
            <div className='features-grid'>
              <div className='feature-item'>
                <div className='feature-icon'>🤖</div>
                <h3>AI-Powered Recognition</h3>
                <p>Our state-of-the-art machine learning algorithms can identify bird species from photos with unprecedented accuracy. Trained on millions of images, our AI continuously learns and improves.</p>
                <ul>
                  <li>99.8% accuracy rate</li>
                  <li>Real-time identification</li>
                  <li>Supports 25,000+ species</li>
                </ul>
              </div>
              <div className='feature-item'>
                <div className='feature-icon'>🌐</div>
                <h3>Global Database</h3>
                <p>Access the world's most comprehensive bird database, featuring detailed information about habitats, behaviors, migration patterns, and conservation status for species worldwide.</p>
                <ul>
                  <li>Scientific classifications</li>
                  <li>Behavioral insights</li>
                  <li>Conservation status</li>
                </ul>
              </div>
              <div className='feature-item'>
                <div className='feature-icon'>📱</div>
                <h3>Mobile-First Design</h3>
                <p>Designed for field use, our platform works seamlessly on all devices. Whether you're in the rainforest or your backyard, Feather Frame is always at your fingertips.</p>
                <ul>
                  <li>Offline capability</li>
                  <li>Cross-platform sync</li>
                  <li>Field-optimized UI</li>
                </ul>
              </div>
              <div className='feature-item'>
                <div className='feature-icon'>👥</div>
                <h3>Community Network</h3>
                <p>Connect with fellow birders, share rare sightings, participate in citizen science projects, and contribute to global conservation efforts through our vibrant community.</p>
                <ul>
                  <li>Social birding platform</li>
                  <li>Expert verification</li>
                  <li>Conservation initiatives</li>
                </ul>
              </div>
              <div className='feature-item'>
                <div className='feature-icon'>📊</div>
                <h3>Advanced Analytics</h3>
                <p>Track your birding progress with detailed statistics, create personal birding lists, analyze patterns, and discover new species based on your location and preferences.</p>
                <ul>
                  <li>Personal statistics</li>
                  <li>Species recommendations</li>
                  <li>Migration alerts</li>
                </ul>
              </div>
              
            </div>
          </div>
        </div>

        {/* Mission Vision Section */}
        <div className='mission-container background padding'>
          <div className='container'>
            <div className='mission-content'>
              <div className='mission-left'>
                <Heading title='Our Mission & Vision' subtitle='Dedicated to conservation through technology' />
                <div className='mission-item'>
                  <h3>🎯 Our Mission</h3>
                  <p>To democratize bird identification and make ornithology accessible to everyone while contributing to global conservation efforts through citizen science and community engagement.</p>
                </div>
                <div className='mission-item'>
                  <h3>👁️ Our Vision</h3>
                  <p>A world where every person can connect with nature, understand biodiversity, and actively participate in protecting our planet's avian species for future generations.</p>
                </div>
                <div className='mission-item'>
                  <h3>🌱 Our Values</h3>
                  <ul>
                    <li>Scientific accuracy and integrity</li>
                    <li>Environmental conservation</li>
                    <li>Community collaboration</li>
                    <li>Technological innovation</li>
                    <li>Educational empowerment</li>
                  </ul>
                </div>
              </div>
              <div className='mission-right'>
                <div className='impact-stats'>
                  <h3>Conservation Impact</h3>
                  <div className='impact-item'>
                    <span className='impact-number'>500+</span>
                    <span className='impact-label'>Conservation Projects Supported</span>
                  </div>
                  <div className='impact-item'>
                    <span className='impact-number'>50M+</span>
                    <span className='impact-label'>Data Points Collected</span>
                  </div>
                  <div className='impact-item'>
                    <span className='impact-number'>200+</span>
                    <span className='impact-label'>Research Papers Published</span>
                  </div>
                  <div className='impact-item'>
                    <span className='impact-number'>15</span>
                    <span className='impact-label'>Endangered Species Monitored</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
       

        {/* Partners Section */}
       

        {/* Call to Action */}
        <div className='cta-container padding'>
          <div className='container'>
            <div className='cta-content'>
              <h2>Ready to Start Your Birding Journey?</h2>
              <p>Join thousands of bird enthusiasts who have already discovered the magic of AI-powered birdwatching. Whether you're a beginner or an expert, Feather Frame has something special for you.</p>
              
              <div className='cta-features'>
                <span>✓ Free to start</span>
                <span>✓ No credit card required</span>
                <span>✓ Access to community</span>
                <span>✓ Mobile & desktop</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default About
