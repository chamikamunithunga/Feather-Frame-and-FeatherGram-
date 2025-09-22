import './App.css'
import Sidebar from './components/Sidebar'
import { ThemeProvider } from './contexts/ThemeContext'
import Feed from './pages/Feed'
import Explore from './pages/Explore'
import Posts from './pages/Posts'
import CustomProfile from './pages/customprofile'
import UsersList from './pages/UsersList'
import Messages from './pages/Messages'
import Marketplace from './pages/Marketplace'
import Communities from './pages/Communities'
import CommunityDetail from './pages/CommunityDetail'
import Favorites from './pages/Favorites'
import Settings from './pages/Settings'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <ThemeProvider>
      <div className="social-app no-right-sidebar">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/profile" element={<Posts />} />
            <Route path="/profile/:username" element={<CustomProfile />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/:username" element={<Messages />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/communities" element={<Communities />} />
            <Route path="/communities/:communityId" element={<CommunityDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App 