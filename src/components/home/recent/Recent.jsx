import React, { useEffect, useRef } from "react";
import Heading from "../../common/Heading";
import "./recent.css";
import RecentCard from "./RecentCard";

const Recent = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate');
          }
        });
      },
      { threshold: 0.1 }
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
    <section className="recent padding" ref={sectionRef}>
      {/* Animated Bird Icons */}
      <div className="bird-icon bird-1">🦅</div>
      <div className="bird-icon bird-2">🦜</div>
      <div className="bird-icon bird-3">🕊️</div>
      <div className="bird-icon bird-4">🦆</div>
      <div className="bird-icon bird-5">🐦</div>
      <div className="bird-icon bird-6">🦉</div>
      <div className="bird-icon bird-7">🐧</div>
      <div className="bird-icon bird-8">🦢</div>
      
      <div className="container">
        <Heading 
          title="Wings around the world. Stay informed, stay inspired." 
          subtitle="Discover the latest bird news, wildlife updates, and conservation stories from around the globe." 
        />
        <RecentCard />
      </div>
    </section>
  );
};

export default Recent;
