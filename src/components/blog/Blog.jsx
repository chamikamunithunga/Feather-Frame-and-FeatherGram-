import React, { useState } from "react"
import Back from "../common/Back"
import RecentCard from "../home/recent/RecentCard"
import "../home/recent/recent.css"
import "./blog.css"
import img from "../images/blog.jpg"

// Enhanced Sri Lanka Birds with Migration Patterns
const sriLankaBirds = [
  {
    id: 1,
    image: "../images/blog1.jpg",
    title: "Sri Lanka Blue Magpie",
    scientificName: "Urocissa ornata",
    status: "Endemic",
    conservationStatus: "Near Threatened",
    habitat: "Wet Zone Rainforests",
    migrationPattern: "Resident - No migration",
    description: "A stunning, noisy forest dweller with vibrant blue and rust-red feathers. Found only in Sri Lanka's rainforests like Sinharaja. Known for its distinctive calls and social behavior.",
    population: "2,500-10,000 individuals",
    threats: "Habitat loss, forest fragmentation",
    bestTimeToSee: "Year-round, especially during breeding season (March-July)",
    locations: ["Sinharaja Forest Reserve", "Kanneliya Forest", "Kithulgala"]
  },
  {
    id: 2,
    image: "../images/blog2.jpg",
    title: "Red-faced Malkoha",
    scientificName: "Phaenicophaeus pyrrhocephalus",
    status: "Endemic",
    conservationStatus: "Vulnerable",
    habitat: "Dense Wet Zone Forests",
    migrationPattern: "Resident - No migration",
    description: "A shy, tree-dwelling bird with striking red skin around its eyes. This secretive species is rarely seen but often heard in dense forest undergrowth.",
    population: "1,000-2,500 individuals",
    threats: "Deforestation, illegal logging",
    bestTimeToSee: "Early morning and late afternoon",
    locations: ["Sinharaja", "Kanneliya", "Bodhinagala"]
  },
  {
    id: 3,
    image: "../images/blog6.jpeg",
    title: "Sri Lanka Junglefowl",
    scientificName: "Gallus lafayettii",
    status: "Endemic",
    conservationStatus: "Least Concern",
    habitat: "Forests and Scrublands",
    migrationPattern: "Resident - No migration",
    description: "Sri Lanka's national bird. The male's spectacular plumage and loud crowing make it a forest icon. Found throughout the island in various habitats.",
    population: "Common throughout range",
    threats: "Habitat destruction, hunting",
    bestTimeToSee: "Dawn and dusk, year-round",
    locations: ["All forest areas", "National Parks", "Rural areas"]
  },
  {
    id: 4,
    image: "../images/blog3.jpeg",
    title: "Sri Lanka Whistling Thrush",
    scientificName: "Myophonus blighi",
    status: "Endemic",
    conservationStatus: "Endangered",
    habitat: "Montane Forests",
    migrationPattern: "Altitudinal migration",
    description: "One of the rarest birds in Sri Lanka. This beautiful thrush with deep blue plumage is found near streams in high-altitude forests.",
    population: "250-1,000 individuals",
    threats: "Climate change, habitat loss",
    bestTimeToSee: "Early morning near streams",
    locations: ["Horton Plains", "Hakgala", "Knuckles Range"]
  },
  {
    id: 5,
    image: "../images/blog4.jpeg",
    title: "Green-billed Coucal",
    scientificName: "Centropus chlororhynchos",
    status: "Endemic",
    conservationStatus: "Vulnerable",
    habitat: "Rainforest Canopy",
    migrationPattern: "Resident - No migration",
    description: "This secretive bird with a distinctive green beak is rarely seen. It inhabits the rainforest canopy of the southwestern wet zone.",
    population: "500-1,500 individuals",
    threats: "Deforestation, climate change",
    bestTimeToSee: "Early morning in canopy",
    locations: ["Sinharaja", "Kanneliya", "Bodhinagala"]
  },
  {
    id: 6,
    image: "../images/blog5.jpg",
    title: "Ceylon Frogmouth",
    scientificName: "Batrachostomus moniliger",
    status: "Endemic",
    conservationStatus: "Near Threatened",
    habitat: "Lowland Forests",
    migrationPattern: "Resident - No migration",
    description: "A master of camouflage, this nocturnal bird is incredibly difficult to spot during the day. Its distinctive call is often heard at night.",
    population: "1,000-2,500 individuals",
    threats: "Habitat loss, light pollution",
    bestTimeToSee: "Night time, especially breeding season",
    locations: ["Sinharaja", "Kanneliya", "Bundala"]
  }
];

// Migration Patterns Data
const migrationPatterns = [
  {
    season: "Winter (December - February)",
    description: "Northern migrants arrive from Siberia and Central Asia",
    birds: ["Common Sandpiper", "Green Sandpiper", "Wood Sandpiper", "Common Redshank"],
    locations: ["Bundala National Park", "Kumana", "Mannar Island"]
  },
  {
    season: "Spring (March - May)",
    description: "Breeding season for resident birds, courtship displays peak",
    birds: ["Sri Lanka Blue Magpie", "Red-faced Malkoha", "Sri Lanka Junglefowl"],
    locations: ["Sinharaja Forest", "All forest reserves", "National Parks"]
  },
  {
    season: "Summer (June - August)",
    description: "Monsoon season, best time for endemic bird watching",
    birds: ["Sri Lanka Whistling Thrush", "Yellow-eared Bulbul", "Ceylon Frogmouth"],
    locations: ["Horton Plains", "Knuckles Range", "Wet Zone Forests"]
  },
  {
    season: "Autumn (September - November)",
    description: "Departure of summer migrants, arrival of winter visitors",
    birds: ["Blue-tailed Bee-eater", "Indian Pitta", "Asian Paradise Flycatcher"],
    locations: ["Coastal areas", "Forest edges", "Urban parks"]
  }
];

const Blog = () => {
  const [selectedBird, setSelectedBird] = useState(null);
  const [activeTab, setActiveTab] = useState('birds');

  return (
    <>
      <section className='blog-out mb'>
        <Back name='Sri Lanka Bird Blog' title='Discover the Amazing Birds of Sri Lanka' cover={img} />
        
        {/* Enhanced Navigation Tabs */}
        <div className='blog-navigation'>
          <div className='container'>
            <div className='nav-tabs'>
              <button 
                className={`nav-tab ${activeTab === 'birds' ? 'active' : ''}`}
                onClick={() => setActiveTab('birds')}
              >
                🦅 Endemic Birds
              </button>
              <button 
                className={`nav-tab ${activeTab === 'migration' ? 'active' : ''}`}
                onClick={() => setActiveTab('migration')}
              >
                🌍 Migration Patterns
              </button>
              <button 
                className={`nav-tab ${activeTab === 'recent' ? 'active' : ''}`}
                onClick={() => setActiveTab('recent')}
              >
                📰 Recent Posts
              </button>
            </div>
          </div>
        </div>

        {/* Birds Section */}
        {activeTab === 'birds' && (
          <div className='birds-section'>
            <div className='container'>
              <div className='section-header'>
                <h2 className='main-title'>Rare & Endemic Birds of Sri Lanka</h2>
                <p className='subtitle'>Discover the unique avian treasures that call this island paradise home</p>
              </div>
              
              <div className='birds-grid'>
                {sriLankaBirds.map((bird, index) => (
                  <div className='bird-card' key={bird.id} onClick={() => setSelectedBird(bird)}>
                    <div className='bird-image'>
                      <img src={bird.image} alt={bird.title} />
                      <div className='bird-overlay'>
                        <span className='status-badge'>{bird.status}</span>
                        <span className='conservation-badge'>{bird.conservationStatus}</span>
                      </div>
                    </div>
                    <div className='bird-content'>
                      <h3 className='bird-title'>{bird.title}</h3>
                      <p className='scientific-name'>{bird.scientificName}</p>
                      <p className='bird-description'>{bird.description}</p>
                      <div className='bird-details'>
                        <div className='detail-item'>
                          <span className='icon'>🌿</span>
                          <span>{bird.habitat}</span>
                        </div>
                        <div className='detail-item'>
                          <span className='icon'>🕊️</span>
                          <span>{bird.migrationPattern}</span>
                        </div>
                        <div className='detail-item'>
                          <span className='icon'>👥</span>
                          <span>{bird.population}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Migration Patterns Section */}
        {activeTab === 'migration' && (
          <div className='migration-section'>
            <div className='container'>
              <div className='section-header'>
                <h2 className='main-title'>Bird Migration Patterns in Sri Lanka</h2>
                <p className='subtitle'>Understanding the seasonal movements of birds across the island</p>
              </div>
              
              <div className='migration-timeline'>
                {migrationPatterns.map((pattern, index) => (
                  <div className='timeline-item' key={index}>
                    <div className='timeline-marker'>
                      <div className='marker-dot'></div>
                      <div className='marker-line'></div>
                    </div>
                    <div className='timeline-content'>
                      <h3 className='season-title'>{pattern.season}</h3>
                      <p className='season-description'>{pattern.description}</p>
                      <div className='birds-list'>
                        <h4>Key Birds:</h4>
                        <ul>
                          {pattern.birds.map((bird, birdIndex) => (
                            <li key={birdIndex}>{bird}</li>
                          ))}
                        </ul>
                      </div>
                      <div className='locations-list'>
                        <h4>Best Locations:</h4>
                        <ul>
                          {pattern.locations.map((location, locIndex) => (
                            <li key={locIndex}>{location}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Posts Section */}
        {activeTab === 'recent' && (
          <div className='recent-section'>
            <div className='container recent'>
              <RecentCard />
            </div>
          </div>
        )}

        {/* Bird Detail Modal */}
        {selectedBird && (
          <div className='bird-modal-overlay' onClick={() => setSelectedBird(null)}>
            <div className='bird-modal' onClick={(e) => e.stopPropagation()}>
              <button className='modal-close' onClick={() => setSelectedBird(null)}>×</button>
              <div className='modal-content'>
                <div className='modal-image'>
                  <img src={selectedBird.image} alt={selectedBird.title} />
                </div>
                <div className='modal-info'>
                  <h2>{selectedBird.title}</h2>
                  <p className='scientific-name'>{selectedBird.scientificName}</p>
                  <div className='status-info'>
                    <span className='status'>{selectedBird.status}</span>
                    <span className='conservation'>{selectedBird.conservationStatus}</span>
                  </div>
                  <p className='description'>{selectedBird.description}</p>
                  
                  <div className='info-grid'>
                    <div className='info-item'>
                      <h4>🌿 Habitat</h4>
                      <p>{selectedBird.habitat}</p>
                    </div>
                    <div className='info-item'>
                      <h4>🕊️ Migration</h4>
                      <p>{selectedBird.migrationPattern}</p>
                    </div>
                    <div className='info-item'>
                      <h4>👥 Population</h4>
                      <p>{selectedBird.population}</p>
                    </div>
                    <div className='info-item'>
                      <h4>⚠️ Threats</h4>
                      <p>{selectedBird.threats}</p>
                    </div>
                    <div className='info-item'>
                      <h4>🕐 Best Time to See</h4>
                      <p>{selectedBird.bestTimeToSee}</p>
                    </div>
                    <div className='info-item'>
                      <h4>📍 Locations</h4>
                      <p>{selectedBird.locations.join(', ')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

export default Blog
