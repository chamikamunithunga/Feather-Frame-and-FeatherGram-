import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/TopicPage.css';

const TopicPage = () => {
  const { topicName } = useParams();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const topicConfigs = {
    photography: {
      title: "Photography News & Articles",
      icon: "camera",
      color: "#399918",
      keywords: "photography,camera,photographer"
    },
    travel: {
      title: "Travel Updates & Destinations",
      icon: "plane",
      color: "#90D1CA",
      keywords: "travel,tourism,destination"
    }
  };

  const currentTopic = topicConfigs[topicName] || topicConfigs.photography;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://newsapi.org/v2/everything?` +
          `q=${currentTopic.keywords}&` +
          `sortBy=publishedAt&` +
          `language=en&` +
          `apiKey=${process.env.REACT_APP_NEWS_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch news');
        }

        const data = await response.json();
        setNews(data.articles);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchNews();
  }, [topicName, currentTopic.keywords]);

  if (loading) {
    return (
      <div className="topic-page loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <span>Loading articles...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="topic-page error">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <span>Error loading articles: {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="topic-page">
      <div className="topic-header" style={{ backgroundColor: `${currentTopic.color}15` }}>
        <div className="topic-title">
          <i className={`fas fa-${currentTopic.icon}`} style={{ color: currentTopic.color }}></i>
          <h1>{currentTopic.title}</h1>
        </div>
        <div className="topic-filters">
          <button className="filter-btn active">Latest</button>
          <button className="filter-btn">Popular</button>
          <button className="filter-btn">Featured</button>
        </div>
      </div>

      <div className="news-grid">
        {news.map((article, index) => (
          <div key={index} className="news-card" onClick={() => window.open(article.url, '_blank')}>
            <div className="news-image">
              {article.urlToImage ? (
                <img src={article.urlToImage} alt={article.title} />
              ) : (
                <div className="placeholder-image">
                  <i className={`fas fa-${currentTopic.icon}`}></i>
                </div>
              )}
              <div className="news-source">
                <img 
                  src={`https://www.google.com/s2/favicons?domain=${new URL(article.url).hostname}`} 
                  alt={article.source.name}
                />
                <span>{article.source.name}</span>
              </div>
            </div>
            <div className="news-content">
              <h3>{article.title}</h3>
              <p>{article.description}</p>
              <div className="news-meta">
                <span className="news-date">
                  <i className="far fa-clock"></i>
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
                <button className="read-more">
                  Read More
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopicPage; 