import React from 'react'
import { MdVerified } from 'react-icons/md'
import '../styles/RightSidebar.css'

const RightSidebar = () => {
  const trendingTopics = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=500',
      category: 'PHOTOGRAPHY',
      title: 'Street Photography Tips',
      views: '12.5K views'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1510598969022-c4c6c5d05769?w=500',
      category: 'TUTORIAL',
      title: 'Sunset Photography Guide',
      views: '8.2K views'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=500',
      category: 'ADVENTURE',
      title: 'Urban Exploration',
      views: '6.7K views'
    }
  ];

  const suggestedUsers = [
    {
      id: 1,
      name: 'Sarah Johnson',
      username: '@sarahj',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      bio: 'Travel photographer | Adventure seeker',
      tags: ['Photography', 'Travel'],
      isVerified: true,
      followers: 2500
    },
    {
      id: 2,
      name: 'David Chen',
      username: '@davidchen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
      bio: 'Wildlife photographer | Nature lover',
      tags: ['Wildlife', 'Nature'],
      isVerified: true,
      followers: 1800
    },
    {
      id: 3,
      name: 'Emma Wilson',
      username: '@emmaw',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
      bio: 'Portrait photographer | Art enthusiast',
      tags: ['Portraits', 'Art'],
      isVerified: false,
      followers: 15
    }
  ];

  return (
    <div className="right-sidebar">
      <div className="trending-section">
        <h2>Trending</h2>
        <div className="trending-topics">
          {trendingTopics.map(topic => (
            <div key={topic.id} className="trending-card">
              <img src={topic.image} alt={topic.title} className="topic-image" />
              <div className="topic-content">
                <span className="topic-category">{topic.category}</span>
                <h3 className="topic-title">{topic.title}</h3>
                <span className="topic-views">{topic.views}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="suggested-section">
        <div className="suggested-header">
          <h2>Suggested for You</h2>
          <span className="new-badge">12 new</span>
          <button className="see-all-btn">See All</button>
        </div>
        <div className="suggested-users">
          {suggestedUsers.map(user => (
            <div key={user.id} className="user-card">
              <div className="user-info">
                <div className="user-avatar-wrapper">
                  <img src={user.avatar} alt={user.name} className="user-avatar" />
                  <span className="online-indicator"></span>
                </div>
                <div className="user-details">
                  <div className="user-name-wrapper">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {user.name}
                      {user.isVerified && (
                        <MdVerified 
                          style={{ color: '#1da1f2', fontSize: '14px' }} 
                          title="Verified Account" 
                        />
                      )}
                    </h3>
                    <span className="username">{user.username}</span>
                  </div>
                  <p className="user-bio">{user.bio}</p>
                  <div className="user-tags">
                    {user.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="follow-btn">Follow</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default RightSidebar 