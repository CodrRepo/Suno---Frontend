import { Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './pages/login/Login'
import Register from './pages/register/Register'
import Home from './pages/home/Home'
import HomeView from './pages/home/HomeView'
import Discover from './pages/discover/Discover'
import Concerts from './pages/concerts/Concerts'
import ConcertRequestForm from './pages/concerts/ConcertRequestForm'
import Albums from './pages/albums/Albums'
import AddAlbum from './pages/albums/AddAlbum'
import AlbumDetail from './pages/albums/AlbumDetail'
import Songs from './pages/songs/Songs'
import AddSong from './pages/songs/AddSong'
import SongDetail from './pages/songs/SongDetail'
import Artists from './pages/artists/Artists'
import ArtistDetail from './pages/artists/ArtistDetail'
import Playlists from './pages/playlists/Playlists'
import AddPlaylist from './pages/playlists/AddPlaylist'
import PlaylistDetail from './pages/playlists/PlaylistDetail'
import User from './pages/user/User'
import Admin from './pages/admin/Admin'
import ProtectedRoute from './components/protectedRoute/ProtectedRoute'

const App = () => {
  return (
    <div className="app">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeView />} />
          <Route path='discover' element={<Discover />} />
          <Route path='concerts' element={<Concerts />} />
          <Route path='concert-request/:artistId' element={<ConcertRequestForm />} />
          <Route path='albums' element={<Albums />} />
          <Route path='albums/new' element={<AddAlbum />} />
          <Route path='albums/:albumId' element={<AlbumDetail />} />
          <Route path='songs' element={<Songs />} />
          <Route path='songs/new' element={<AddSong />} />
          <Route path='songs/:songId' element={<SongDetail />} />
          <Route path='artists' element={<Artists />} />
          <Route path='artists/:artistId' element={<ArtistDetail />} />
          <Route path='playlists' element={<Playlists />} />
          <Route path='playlists/new' element={<AddPlaylist />} />
          <Route path='playlists/:playlistId' element={<PlaylistDetail />} />
          <Route path='profile' element={<User />} />
          <Route path='admin' element={<Admin />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
