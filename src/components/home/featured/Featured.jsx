import React, { useEffect, useRef } from "react"
import Heading from "../../common/Heading"
import "./Featured.css"
import FeaturedCard from "./FeaturedCard"

const Featured = () => {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            
            // Trigger heading animation
            if (entry.target === sectionRef.current) {
              setTimeout(() => {
                if (headingRef.current) {
                  headingRef.current.classList.add('animate-in');
                }
              }, 200);
              
              // Trigger card animation
              setTimeout(() => {
                if (cardRef.current) {
                  cardRef.current.classList.add('animate-in');
                }
              }, 400);
            }
          }
        });
      },
      { 
        threshold: 0.1,
        rootMargin: '50px 0px -50px 0px'
      }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) {
        observer.unobserve(currentSection);
      }
    };
  }, []);

  return (
    <>
      <section className='featured background' ref={sectionRef}>
        <div className='container'>
          <div ref={headingRef} className="heading-wrapper">
            <Heading title="Discover Sri Lanka's Birds - AI-Powered & Free" subtitle="Access a comprehensive free API offering detailed datasets on Sri Lanka's rare, endemic, and migratory birds. Integrated with an AI bird detection system, it enables effortless identification and enriches your wildlife projects with accurate, up-to-date data." />
          </div>
          <div ref={cardRef} className="cards-wrapper">
            <FeaturedCard />
          </div>
        </div>
      </section>
    </>
  )
}

export default Featured
