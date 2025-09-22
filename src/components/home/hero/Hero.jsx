import React from "react"
import Heading from "../../common/Heading"
import "./hero.css"

const Hero = () => {
  return (
    <>
      <section className='hero'>
        <div className='container'>
          <Heading title='Search Your Feather' subtitle='Find new & featured birds located in your local city.' />
          
          <div className='ai-description'>
            <h3>AI-Powered Bird Discovery</h3>
            <p>
              Upload a photo or search by name - our smart AI instantly identifies bird species 
              and provides detailed insights. Discover everything from rare birds to backyard visitors!
            </p>
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
