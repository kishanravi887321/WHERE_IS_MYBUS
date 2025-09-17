import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import ProtectedRoute from './components/ProtectedRoute'
import AuthGuard from './components/AuthGuard'
import './App.css'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <AuthGuard redirectIfAuthenticated={true}>
                <LandingPage />
              </AuthGuard>
            } 
          />
          <Route 
            path="/auth" 
            element={
              <AuthGuard redirectIfAuthenticated={true}>
                <AuthPage />
              </AuthGuard>
            } 
          />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          {/* Add more routes here as needed */}
        </Routes>
      </div>
    </Router>
  )
}

export default App
