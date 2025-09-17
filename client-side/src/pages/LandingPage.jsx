import React from 'react'
import { Link } from 'react-router-dom'

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="container">
        <h1>Welcome to WHERE IS MY BUS</h1>
        <p>Landing page content will be added here...</p>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link 
            to="/auth" 
            style={{
              backgroundColor: '#FF9B00',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            Authentication Page
          </Link>
          <Link 
            to="/home" 
            style={{
              backgroundColor: '#FFC900',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              display: 'inline-block',
              transition: 'all 0.3s ease'
            }}
          >
            Home Page
          </Link>
        </div>
        {/* Future content goes here */}
      </div>
    </div>
  )
}

export default LandingPage