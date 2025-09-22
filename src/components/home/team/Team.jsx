import React from "react"
import Heading from "../../common/Heading"
import { team } from "../../data/Data"
import "./team.css"

const Team = () => {
  const openWhatsApp = (phoneNumber) => {
    const cleanNumber = phoneNumber.replace(/\+/g, '');
    const message = "Hi! I'm interested in birding tours. Can you help me?";
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <section className='team background'>
        <div className='container'>
          <Heading title='Our Birding Experts' subtitle='Connect directly with our expert birding guides through WhatsApp for personalized tours and local insights.' />

          <div className='content mtop grid3'>
            {team.map((val, index) => (
              <div className='box' key={index}>
                <div className='img'>
                  <img src={val.cover} alt={val.name} />
                </div>
                <div className='details'>
                  <h4>{val.name}</h4>
                  <div className='location-line'>Location: {val.location}</div>
                  <button 
                    className='whatsapp-btn'
                    onClick={() => openWhatsApp(val.whatsapp)}
                  >
                    <i className='fa-brands fa-whatsapp'></i>
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Team
