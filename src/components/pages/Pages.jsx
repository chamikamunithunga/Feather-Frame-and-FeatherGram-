import React from "react"
import Header from "../common/header/Header"
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom"
import ScrollToTopOnRouteChange from "../common/ScrollToTopOnRouteChange"
import Home from "../home/Home"
import Footer from "../common/footer/Footer"
import About from "../about/About"
import Pricing from "../pricing/Pricing"
import Blog from "../blog/Blog"
import Services from "../services/Services"
import Contact from "../contact/Contact"
import AuthForm from "../auth/AuthForm"
import SocialApp from "../Social/App"
import BirdDetailsPage from "../ai/BirdDetailsPage"
import BirdResultsPage from "../ai/BirdResultsPage"
import Ai from "../ai/Ai"
import MyBirdsList from "../birds/MyBirdsList"
import { useAuth } from "../../contexts/AuthContext"

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show nothing while authentication is being checked
  if (loading) {
    return null; // Or return a loading spinner component if you have one
  }

  if (!isAuthenticated) {
    // Redirect to login page with the return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

const MainLayout = ({ children }) => {
  const location = useLocation();
  const isSocialRoute = location.pathname.startsWith('/social');

  if (isSocialRoute) {
    return children;
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

const Pages = () => {
  console.log('Pages component is rendering!');
  console.log('Current location:', window.location.pathname);
  
  return (
    <>
      <Router>
        <ScrollToTopOnRouteChange />
        <Routes>

          
          {/* All other routes wrapped in MainLayout */}
          <Route path='/' element={
            <MainLayout>
              <Home />
            </MainLayout>
          } />
          <Route path='/about' element={
            <MainLayout>
              <About />
            </MainLayout>
          } />
          <Route path='/services' element={
            <MainLayout>
              <Services />
            </MainLayout>
          } />
          <Route path='/blog' element={
            <MainLayout>
              <Blog />
            </MainLayout>
          } />
          <Route path='/pricing' element={
            <MainLayout>
              <Pricing />
            </MainLayout>
          } />
          <Route path='/contact' element={
            <MainLayout>
              <Contact />
            </MainLayout>
          } />
          <Route path='/ai' element={
            <MainLayout>
              <Ai />
            </MainLayout>
          } />
                                <Route path='/bird-details' element={
                        <MainLayout>
                          <BirdDetailsPage />
                        </MainLayout>
                      } />
                      <Route path='/bird-results' element={
                        <MainLayout>
                          <BirdResultsPage />
                        </MainLayout>
                      } />
          <Route path='/my-list' element={
            <ProtectedRoute>
              <MainLayout>
                <MyBirdsList />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path='/login' element={
            <MainLayout>
              <AuthForm />
            </MainLayout>
          } />
          <Route
            path='/social/*'
            element={
              <ProtectedRoute>
                <SocialApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </>
  )
}

export default Pages
