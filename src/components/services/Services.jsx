import React, { useState } from "react"
import img from "../images/services.jpg"
import Back from "../common/Back"
import Heading from "../common/Heading"
import "./services.css"

const Services = () => {
  const [apiForm, setApiForm] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    requestType: 'personal'
  })

  const handleInputChange = (e) => {
    setApiForm({
      ...apiForm,
      [e.target.name]: e.target.value
    })
  }

  const handleApiRequest = async (e) => {
    e.preventDefault()
    
    try {
      // Create the request data
      const requestData = {
        name: apiForm.name,
        email: apiForm.email,
        company: apiForm.company,
        requestType: apiForm.requestType,
        useCase: apiForm.useCase
      };

      // Store in localStorage for admin panel access
      const existingRequests = JSON.parse(localStorage.getItem('featherframe_api_requests') || '[]');
      const newRequest = {
        id: Date.now(),
        ...requestData,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewedBy: null,
        aiAnalysis: null,
        adminNotes: '',
        priority: 'medium'
      };
      
      existingRequests.unshift(newRequest);
      localStorage.setItem('featherframe_api_requests', JSON.stringify(existingRequests));
      
      // Also try to submit to admin API if available
      try {
        const response = await fetch('http://localhost:5175/api/submit-request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
        
        if (response.ok) {
          console.log('✅ Request also submitted to admin API');
        }
      } catch (apiError) {
        console.log('⚠️ Admin API not available, using localStorage only');
      }
      
      // Success message
      alert('Thank you! Your API request has been submitted. We\'ll review it and contact you within 24 hours.')
      
      // Reset form
      setApiForm({
        name: '',
        email: '',
        company: '',
        useCase: '',
        requestType: 'personal'
      })
      
      console.log('✅ Request submitted successfully:', newRequest);
      console.log('📊 Total requests in localStorage:', existingRequests.length);
      
    } catch (error) {
      console.error('Error submitting request:', error)
      alert('There was an error submitting your request. Please try again.')
    }
  }

  return (
    <>
      <section className='services'>
        <Back name='Services' title='Our Professional Services' cover={img} />
        
        {/* Services Overview */}
        <div className='services-overview padding'>
          <div className='container'>
            <Heading title='Comprehensive Bird Recognition Solutions' subtitle='Empowering researchers, developers, and bird enthusiasts with cutting-edge AI technology' />
            
            <div className='services-intro'>
              <p className='intro-main'>
                Feather Frame offers a complete suite of professional services designed to bring the power of AI-driven bird recognition to your projects, research, and applications. From individual developers to large-scale conservation initiatives, our services scale to meet your unique requirements.
              </p>
              
              <div className='services-highlights'>
                <div className='highlight-grid'>
                  <div className='highlight-item'>
                    <div className='highlight-icon'>🔬</div>
                    <h4>Research Excellence</h4>
                    <p>Collaborate with leading ornithologists and conservation scientists. Our platform powers research initiatives across 85+ countries, contributing to biodiversity studies and species conservation efforts worldwide.</p>
                  </div>
                  
                  <div className='highlight-item'>
                    <div className='highlight-icon'>⚡</div>
                    <h4>Developer-First</h4>
                    <p>Built by developers, for developers. Our APIs are designed with simplicity and performance in mind, offering comprehensive SDKs, detailed documentation, and world-class developer support.</p>
                  </div>
                  
                  <div className='highlight-item'>
                    <div className='highlight-icon'>🌍</div>
                    <h4>Global Impact</h4>
                    <p>Join a community of 150,000+ active users making a difference in wildlife conservation. Every identification contributes to our understanding of global bird populations and migration patterns.</p>
                  </div>
                </div>
              </div>

              <div className='services-features'>
                <div className='features-showcase'>
                  <div className='feature-column'>
                    <h4>🎯 Precision Technology</h4>
                    <ul>
                      <li><strong>99.8% accuracy</strong> across 25,000+ species</li>
                      <li><strong>Real-time processing</strong> in under 200ms</li>
                      <li><strong>Advanced AI models</strong> trained on millions of images</li>
                      <li><strong>Continuous learning</strong> with monthly updates</li>
                    </ul>
                  </div>
                  
                  <div className='feature-column'>
                    <h4>🚀 Enterprise Ready</h4>
                    <ul>
                      <li><strong>99.9% uptime</strong> with global CDN</li>
                      <li><strong>Auto-scaling</strong> to handle millions of requests</li>
                      <li><strong>GDPR compliant</strong> with SOC 2 certification</li>
                      <li><strong>24/7 support</strong> with dedicated account managers</li>
                    </ul>
                  </div>
                  
                  <div className='feature-column'>
                    <h4>🌟 Innovation Focus</h4>
                    <ul>
                      <li><strong>Cutting-edge research</strong> in computer vision</li>
                      <li><strong>Open science</strong> with 200+ published papers</li>
                      <li><strong>Community-driven</strong> with citizen science integration</li>
                      <li><strong>Future-proof</strong> with emerging technology adoption</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='services-stats'>
                <div className='stats-showcase'>
                  <div className='stat-showcase'>
                    <span className='stat-big'>2.5M+</span>
                    <span className='stat-desc'>Images Analyzed Daily</span>
                  </div>
                  <div className='stat-showcase'>
                    <span className='stat-big'>150K+</span>
                    <span className='stat-desc'>Active Developers</span>
                  </div>
                  <div className='stat-showcase'>
                    <span className='stat-big'>85+</span>
                    <span className='stat-desc'>Countries Served</span>
                  </div>
                  <div className='stat-showcase'>
                    <span className='stat-big'>25K+</span>
                    <span className='stat-desc'>Species Database</span>
                  </div>
                </div>
              </div>

              <div className='services-mission'>
                <div className='mission-content'>
                  <div className='mission-text'>
                    <h4>Our Mission</h4>
                    <p>To democratize access to advanced bird identification technology while fostering global collaboration in wildlife conservation. We believe that by making cutting-edge AI accessible to everyone—from curious nature enthusiasts to world-renowned researchers—we can create a more informed and connected community dedicated to protecting our planet's incredible avian diversity.</p>
                  </div>
                  <div className='mission-visual'>
                    <div className='mission-circle'>
                      <span>🌱</span>
                      <p>Conservation Through Technology</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>

        {/* Free API Request Section */}
        <div className='api-request-section background padding'>
          <div className='container'>
            <div className='api-request-content'>
              <div className='api-request-left'>
                <Heading title='Get Your Free API Access' subtitle='Start building with our powerful bird recognition API today' />
                <div className='api-benefits'>
                  <div className='benefit-item'>
                    <div className='benefit-icon'>⚡</div>
                    <div className='benefit-text'>
                      <h4>Instant Access</h4>
                      <p>Get your API keys within minutes and start building immediately</p>
                    </div>
                  </div>
                  <div className='benefit-item'>
                    <div className='benefit-icon'>🔒</div>
                    <div className='benefit-text'>
                      <h4>Secure & Reliable</h4>
                      <p>Enterprise-grade security with 99.9% uptime guarantee</p>
                    </div>
                  </div>
                  <div className='benefit-item'>
                    <div className='benefit-icon'>📚</div>
                    <div className='benefit-text'>
                      <h4>Complete Documentation</h4>
                      <p>Comprehensive guides, examples, and support materials</p>
                    </div>
                  </div>
                  <div className='benefit-item'>
                    <div className='benefit-icon'>🤝</div>
                    <div className='benefit-text'>
                      <h4>Developer Support</h4>
                      <p>Direct access to our technical team for any questions</p>
                    </div>
                  </div>
                </div>

                <div className='api-stats'>
                  <div className='stat-item'>
                    <span className='stat-number'>25K+</span>
                    <span className='stat-label'>Species Covered</span>
                  </div>
                  <div className='stat-item'>
                    <span className='stat-number'>99.8%</span>
                    <span className='stat-label'>Accuracy Rate</span>
                  </div>
                  <div className='stat-item'>
                    <span className='stat-number'>&lt;200ms</span>
                    <span className='stat-label'>Response Time</span>
                  </div>
                  <div className='stat-item'>
                    <span className='stat-number'>5K+</span>
                    <span className='stat-label'>Active Developers</span>
                  </div>
                </div>
              </div>

              <div className='api-request-right'>
                <div className='api-form-container'>
                  <form onSubmit={handleApiRequest} className='api-form'>
                    <h3>Request Free API Access</h3>
                    <p>Fill out the form below and we'll set up your free account with 1,000 monthly requests.</p>
                    
                    <div className='form-group'>
                      <label htmlFor='name'>Full Name *</label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        value={apiForm.name}
                        onChange={handleInputChange}
                        required
                        placeholder='Enter your full name'
                      />
                    </div>

                    <div className='form-group'>
                      <label htmlFor='email'>Email Address *</label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        value={apiForm.email}
                        onChange={handleInputChange}
                        required
                        placeholder='your.email@example.com'
                      />
                    </div>

                    <div className='form-group'>
                      <label htmlFor='company'>Company/Organization</label>
                      <input
                        type='text'
                        id='company'
                        name='company'
                        value={apiForm.company}
                        onChange={handleInputChange}
                        placeholder='Your company or organization'
                      />
                    </div>

                    <div className='form-group'>
                      <label htmlFor='requestType'>Request Type *</label>
                      <select
                        id='requestType'
                        name='requestType'
                        value={apiForm.requestType}
                        onChange={handleInputChange}
                        required
                      >
                        <option value='personal'>Personal Project</option>
                        <option value='commercial'>Commercial Use</option>
                        <option value='research'>Research/Academic</option>
                        <option value='nonprofit'>Non-profit Organization</option>
                        <option value='education'>Educational Institution</option>
                      </select>
                    </div>

                    <div className='form-group'>
                      <label htmlFor='useCase'>Use Case Description *</label>
                      <textarea
                        id='useCase'
                        name='useCase'
                        value={apiForm.useCase}
                        onChange={handleInputChange}
                        required
                        placeholder='Briefly describe how you plan to use our API...'
                        rows={4}
                      />
                    </div>

                    <button type='submit' className='api-submit-btn'>
                      Request Free API Access
                      <span className='btn-icon'>🚀</span>
                    </button>

                    <p className='form-note'>
                      By submitting this form, you agree to our <a href='#'>Terms of Service</a> and <a href='#'>Privacy Policy</a>.
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications */}
        <div className='tech-specs padding'>
          <div className='container'>
            <Heading title='Technical Specifications' subtitle='Detailed information about our API capabilities and performance' />
            
            <div className='specs-grid'>
              <div className='spec-category'>
                <h3>🔧 API Features</h3>
                <ul>
                  <li><strong>REST API:</strong> Simple HTTP requests</li>
                  <li><strong>Authentication:</strong> API key-based</li>
                  <li><strong>Rate Limiting:</strong> Configurable limits</li>
                  <li><strong>Webhooks:</strong> Real-time notifications</li>
                  <li><strong>Batch Processing:</strong> Multiple images at once</li>
                  <li><strong>Image Formats:</strong> JPEG, PNG, WebP, HEIC</li>
                </ul>
              </div>

              <div className='spec-category'>
                <h3>⚡ Performance</h3>
                <ul>
                  <li><strong>Response Time:</strong> &lt; 200ms average</li>
                  <li><strong>Uptime:</strong> 99.9% SLA guarantee</li>
                  <li><strong>Throughput:</strong> 10,000 requests/second</li>
                  <li><strong>Global CDN:</strong> 50+ edge locations</li>
                  <li><strong>Auto-scaling:</strong> Handle traffic spikes</li>
                  <li><strong>Load Balancing:</strong> Optimal distribution</li>
                </ul>
              </div>

              <div className='spec-category'>
                <h3>🛡️ Security & Compliance</h3>
                <ul>
                  <li><strong>Encryption:</strong> TLS 1.3 in transit</li>
                  <li><strong>Data Privacy:</strong> GDPR compliant</li>
                  <li><strong>API Security:</strong> Rate limiting & monitoring</li>
                  <li><strong>SOC 2:</strong> Type II certified</li>
                  <li><strong>Data Retention:</strong> Configurable policies</li>
                  <li><strong>Audit Logs:</strong> Complete request tracking</li>
                </ul>
              </div>

              <div className='spec-category'>
                <h3>🌍 Coverage & Accuracy</h3>
                <ul>
                  <li><strong>Species Count:</strong> 25,000+ birds worldwide</li>
                  <li><strong>Accuracy:</strong> 99.8% identification rate</li>
                  <li><strong>Regions:</strong> Global coverage</li>
                  <li><strong>Updates:</strong> Monthly model improvements</li>
                  <li><strong>Confidence Scores:</strong> Detailed reliability metrics</li>
                  <li><strong>Metadata:</strong> Rich species information</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Support & Resources */}
        <div className='support-section padding'>
          <div className='container'>
            <Heading title='Support & Resources' subtitle='Everything you need to succeed with our API' />
            
            <div className='support-grid'>
              <div className='support-item'>
                <div className='support-icon'>📖</div>
                <h3>Comprehensive Documentation</h3>
                <p>Step-by-step guides, code examples, and best practices to get you started quickly.</p>
                <a href='#' className='support-link'>View Documentation →</a>
              </div>

              <div className='support-item'>
                <div className='support-icon'>💬</div>
                <h3>Developer Community</h3>
                <p>Join our active community of developers, share experiences, and get help from peers.</p>
                <a href='#' className='support-link'>Join Community →</a>
              </div>

              <div className='support-item'>
                <div className='support-icon'>🎯</div>
                <h3>Code Examples</h3>
                <p>Ready-to-use code samples in multiple programming languages including Python, JavaScript, and more.</p>
                <a href='#' className='support-link'>Browse Examples →</a>
              </div>

              <div className='support-item'>
                <div className='support-icon'>🚀</div>
                <h3>Quick Start Guide</h3>
                <p>Get up and running in under 5 minutes with our streamlined quick start tutorial.</p>
                <a href='#' className='support-link'>Start Building →</a>
              </div>

              <div className='support-item'>
                <div className='support-icon'>🔧</div>
                <h3>Developer Tools</h3>
                <p>SDKs, testing tools, and debugging utilities to streamline your development process.</p>
                <a href='#' className='support-link'>Download Tools →</a>
              </div>

              <div className='support-item'>
                <div className='support-icon'>💡</div>
                <h3>Use Case Examples</h3>
                <p>Discover innovative ways others are using our API across different industries and applications.</p>
                <a href='#' className='support-link'>See Use Cases →</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Services
