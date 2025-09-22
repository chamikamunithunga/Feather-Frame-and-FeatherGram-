import React, { useState, useEffect } from "react"
import Heading from "../../common/Heading"
import { FaUser, FaUsers, FaStore, FaFeatherAlt } from 'react-icons/fa'
import dataService from "../../../services/dataService"
import "./awards.css"

const Awards = () => {
  const [counts, setCounts] = useState({
    users: 0,
    communities: 0,
    shops: 0,
    posts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true)
        const data = await dataService.getCounts()
        setCounts(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching counts:', err)
        setError('Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchCounts()
  }, [])

  const awardsData = [
    {
      icon: <FaUser />,
      num: dataService.formatCount(counts.users),
      name: "Active Users"
    },
    {
      icon: <FaUsers />,
      num: dataService.formatCount(counts.communities),
      name: "Communities"
    },
    {
      icon: <FaStore />,
      num: dataService.formatCount(counts.shops),
      name: "Marketplace Shops"
    },
    {
      icon: <FaFeatherAlt />,
      num: dataService.formatCount(counts.posts),
      name: "Bird Posts"
    }
  ]

  return (
    <>
      <section className='awards padding'>
        <div className='container'>
          <Heading title="Where rare birds meet rare moments—join Sri Lanka's first birding social hub." subtitle="Feather Frame is not just a platform. It is a sanctuary for those who see the world through wings and wonder." />

          <div className='content grid4 mtop'>
            {loading ? (
              // Loading state
              <>
                {[1, 2, 3, 4].map((index) => (
                  <div className='box' key={index}>
                    <div className='icon'>
                      <span style={{ opacity: 0.3 }}>⏳</span>
                    </div>
                    <h1 style={{ opacity: 0.3 }}>...</h1>
                    <p style={{ opacity: 0.3 }}>Loading</p>
                  </div>
                ))}
              </>
            ) : error ? (
              // Error state
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666' }}>
                <p>{error}</p>
              </div>
            ) : (
              // Data display
              awardsData.map((val, index) => (
                <div className='box' key={index}>
                  <div className='icon'>
                    <span>{val.icon}</span>
                  </div>
                  <h1>{val.num}</h1>
                  <p>{val.name}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Awards
