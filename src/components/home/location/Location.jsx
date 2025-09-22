import React from "react"
import Heading from "../../common/Heading"
import { location } from "../../data/Data"
import "./style.css"

const Location = () => {
  return (
    <>
      <section className='location padding'>
        <div className='container'>
          <Heading title='Explore By Location : Discover Birds by  Sri Lankan Forests' subtitle='Step into Sri Lanka’s wild heart with Feather Frame. Discover and identify bird species based on iconic forests like Sinharaja, Knuckles, Yala, and Horton Plains. Navigate the island’s rich biodiversity—forest by forest, feather by feather.' />

          <div className='content grid3 mtop'>
            {location.map((item, index) => (
              <div className='box' key={index}>
                <img src={item.cover} alt='' />
                <div className='overlay'>
                  <h5>{item.name}</h5>
                  <p>
                    <label>{item.totbird}</label>
                    <label>{item.rarebird}</label>
                    <label>{item.Migratory}</label>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Location
