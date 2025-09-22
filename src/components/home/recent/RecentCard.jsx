import React, { useEffect, useState } from "react";
import axios from "axios";
import "./recent.css"; // Make sure CSS file exists

const BirdNewsCard = () => {
  const [news, setNews] = useState([]);

  useEffect(() => {
    const fetchBirdNews = async () => {
      try {
        const res = await axios.get(
          `https://newsdata.io/api/1/news?apikey=pub_24e31019459f4ece9472821018319b60&q=bird&language=en`
        );
        setNews(res.data.results);
      } catch (error) {
        console.error("Error fetching bird news", error);
      }
    };

    fetchBirdNews();
  }, []);

  return (
    <div className="bird-news-grid">
      {news && news.length > 0 ? (
        news.map((item, index) => (
          <div className="news-card" key={index}>
            <div className="img">
              <img
                src={item.image_url || "https://via.placeholder.com/400x200?text=No+Image"}
                alt={item.title}
              />
            </div>
            <div className="text">
              <div className="category">
                <span className="news-tag">Bird News</span>
              </div>
              <h4>{item.title}</h4>
              <p className="source">
                <i className="fa fa-location-dot"></i> {item.source_id}
              </p>
            </div>
            <div className="button">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
              >
                Read More
              </a>
              <span className="date">{new Date(item.pubDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      ) : (
        <p className="no-news">No bird news found.</p>
      )}
    </div>
  );
};

export default BirdNewsCard;
