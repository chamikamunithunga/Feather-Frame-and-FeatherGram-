import React from "react"
import "./featuredcard.css"

const FeaturedCard = () => {
  const features = [
    {
      title: "Open Bird Data API Access",
      desc: "Empowering innovation with precision. Feather Frame offers a free, AI-enhanced API for developers, researchers, and students to access rich datasets of Sri Lankan native birds, migratory species, rare finds, and habitat-specific records.",
      icon: "https://cdn-icons-png.flaticon.com/512/2906/2906274.png", // Database icon
    },
    {
      title: "Curated Datasets & Species Intelligence",
      desc: "Dive deep into avian ecosystems with meticulously curated datasets—tailored for scientific research, machine learning, and educational exploration. From seasonal migration patterns to endangered species profiles, our resources provide detailed insights into the biodiversity of Sri Lanka’s skies and beyond.",
      icon: "https://cdn-icons-png.flaticon.com/512/3270/3270524.png", // Research/microscope icon
    },
    {
      title: "AI-Powered Bird Detection Toolkit",
      desc: "Utilize our computer vision AI models to identify bird species from images. Perfect for wildlife photographers, researchers, and conservationists aiming to automate detection and deepen observational accuracy with minimal effort.",
      icon: "https://cdn-icons-png.flaticon.com/512/4712/4712035.png", // AI brain icon
    },
  ]
  

  return (
    <div className='feature-section'>
      <div className='feature-grid'>
        {features.map((item, index) => (
          <div
            className={`feature-card ${index === 2 ? "center-card" : ""}`}
            key={index}
          >
            <img
  src={item.icon}
  alt={`${item.title} icon`}
  title={item.title}
  className='feature-icon'
/>

            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FeaturedCard
