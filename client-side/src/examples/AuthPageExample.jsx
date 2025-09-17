// Example: How to render the AuthPage standalone in App.jsx
// Replace the content of App.jsx with this if you want to test AuthPage directly

import React from 'react'
import AuthPage from './pages/AuthPage'

function App() {
  return <AuthPage />
}

export default App

// ===== Alternative: Full routing setup (current implementation) =====
/*
import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
*/