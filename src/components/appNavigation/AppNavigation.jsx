import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import axios from '../../utils/axios'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import './appNavigation.css'
import { useUser } from '../../context/UserContext'

const CONCERTS_SEEN_KEY = 'concertsSeenPendingRequestIds'

const AppNavigation = ({ isHamMenuOpen, setIsHamMenuOpen }) => {
  const { user } = useUser()
  const navigate = useNavigate()
  const location = useLocation()

  const [searchTerm, setSearchTerm] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchReady, setSearchReady] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [allSongs, setAllSongs] = useState([])
  const [allArtists, setAllArtists] = useState([])
  const [allAlbums, setAllAlbums] = useState([])
  const [pendingConcertIds, setPendingConcertIds] = useState([])
  const [showConcertDot, setShowConcertDot] = useState(false)
  const searchRef = useRef(null)

  const ensureSearchData = useCallback(async () => {
    if (searchReady || searchLoading) return
    setSearchLoading(true)
    try {
      const [songsRes, artistsRes, albumsRes] = await Promise.all([
        axios.get('/api/songs', { withCredentials: true }),
        axios.get('/api/users/artists', { withCredentials: true }),
        axios.get('/api/albums', { withCredentials: true }),
      ])
      setAllSongs(songsRes.data.songs || [])
      setAllArtists(artistsRes.data.artists || [])
      setAllAlbums(albumsRes.data.albums || [])
      setSearchReady(true)
    } catch {
      setAllSongs([])
      setAllArtists([])
      setAllAlbums([])
      setSearchReady(true)
    } finally {
      setSearchLoading(false)
    }
  }, [searchLoading, searchReady])

  useEffect(() => {
    const onOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const q = searchTerm.trim().toLowerCase()

  const genrePool = useMemo(() => {
    const set = new Set()
    allSongs.forEach((s) => {
      const g = s.genre?.trim()
      if (g) set.add(g)
    })
    allAlbums.forEach((a) => {
      const g = a.genre?.trim()
      if (g) set.add(g)
    })
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [allSongs, allAlbums])

  const suggestions = useMemo(() => {
    if (!q) return []

    const songHits = allSongs
      .filter((s) => {
        const title = (s.title || '').toLowerCase()
        const artist = (s.artistName || s.artistId?.artistName || s.artistId?.name || '').toLowerCase()
        return title.includes(q) || artist.includes(q)
      })
      .slice(0, 6)
      .map((s) => ({
        key: `song-${s._id}`,
        type: 'song',
        id: s._id,
        title: s.title,
        subtitle: s.artistName || s.artistId?.artistName || s.artistId?.name || 'Unknown Artist',
        image: s.coverArtUrl || s.artistId?.profilePicture || '',
      }))

    const artistHits = allArtists
      .filter((a) => {
        const artistName = (a.artistName || '').toLowerCase()
        const name = (a.name || '').toLowerCase()
        return artistName.includes(q) || name.includes(q)
      })
      .slice(0, 4)
      .map((a) => ({
        key: `artist-${a._id}`,
        type: 'artist',
        id: a._id,
        title: a.artistName || a.name,
        subtitle: 'Artist',
        image: a.profilePicture || '',
      }))

    const albumHits = allAlbums
      .filter((a) => {
        const name = (a.name || '').toLowerCase()
        const genre = (a.genre || '').toLowerCase()
        return name.includes(q) || genre.includes(q)
      })
      .slice(0, 4)
      .map((a) => ({
        key: `album-${a._id}`,
        type: 'album',
        id: a._id,
        title: a.name,
        subtitle: a.genre || 'Album',
        image: a.coverImage || '',
      }))

    const genreHits = genrePool
      .filter((g) => g.toLowerCase().includes(q))
      .slice(0, 4)
      .map((g) => ({
        key: `genre-${g}`,
        type: 'genre',
        id: g,
        title: g,
        subtitle: 'Genre',
        image: '',
      }))

    return [...songHits, ...artistHits, ...albumHits, ...genreHits].slice(0, 10)
  }, [allAlbums, allArtists, allSongs, genrePool, q])

  const selectSuggestion = useCallback((item) => {
    setSearchOpen(false)
    setSearchTerm('')
    setActiveIndex(-1)
    if (item.type === 'song') navigate(`/songs/${item.id}`)
    else if (item.type === 'artist') navigate(`/artists/${item.id}`)
    else if (item.type === 'album') navigate(`/albums/${item.id}`)
    else navigate(`/discover?genre=${encodeURIComponent(item.id)}`)
  }, [navigate])

  const onSearchKeyDown = (e) => {
    if (!searchOpen || !suggestions.length) {
      if (e.key === 'Enter') e.preventDefault()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => (prev + 1) % suggestions.length)
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const idx = activeIndex >= 0 ? activeIndex : 0
      selectSuggestion(suggestions[idx])
      return
    }

    if (e.key === 'Escape') {
      setSearchOpen(false)
      setActiveIndex(-1)
    }
  }

  const readSeenPendingIds = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem(CONCERTS_SEEN_KEY) || '[]')
    } catch {
      return []
    }
  }, [])

  const saveSeenPendingIds = useCallback((ids) => {
    localStorage.setItem(CONCERTS_SEEN_KEY, JSON.stringify(ids))
  }, [])

  useEffect(() => {
    const fetchConcertRequests = async () => {
      try {
        const res = await axios.get('/api/concert-requests', { withCredentials: true })
        const pendingIds = (res.data?.asArtist || [])
          .filter((request) => request.status === 'pending')
          .map((request) => request._id)
        const seenIds = readSeenPendingIds()
        setPendingConcertIds(pendingIds)
        setShowConcertDot(pendingIds.some((id) => !seenIds.includes(id)))
      } catch {
        setPendingConcertIds([])
        setShowConcertDot(false)
      }
    }

    fetchConcertRequests()
  }, [location.pathname, readSeenPendingIds])

  const handleConcertNavClick = () => {
    if (!pendingConcertIds.length) return
    const seenIds = readSeenPendingIds()
    const merged = [...new Set([...seenIds, ...pendingConcertIds])]
    saveSeenPendingIds(merged)
    setShowConcertDot(false)
    if (window.innerWidth <= 768) setIsHamMenuOpen(false)
  }

  const handleNavLinkClick = () => {
    if (window.innerWidth <= 768) setIsHamMenuOpen(false)
  }

  return (
    <>
      {isHamMenuOpen && <div className='mobile-nav-backdrop' onClick={() => setIsHamMenuOpen(false)} />}
      <div id="app-navigation" className={`panel ${isHamMenuOpen ? 'mobile-nav-open' : ''}`}>
        <div className='nav-content'>
      <img src='/images/logo white.png' alt='logo' className='logo' />

      <div className='search-wrap' ref={searchRef}>
        <div className='search-bar'>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.263 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.263 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z"></path></svg>
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search songs, artists..."
            value={searchTerm}
            onFocus={() => {
              setSearchOpen(true)
              ensureSearchData()
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              setSearchOpen(true)
              setActiveIndex(-1)
              ensureSearchData()
            }}
            onKeyDown={onSearchKeyDown}
          />
        </div>

        {searchOpen && (q || searchLoading) && (
          <div className='search-suggestions'>
            {searchLoading && !searchReady && (
              <div className='search-empty'>Loading suggestions...</div>
            )}

            {!searchLoading && q && suggestions.length === 0 && (
              <div className='search-empty'>No results found</div>
            )}

            {!searchLoading && suggestions.map((item, i) => (
              <button
                key={item.key}
                type='button'
                className={`search-item${activeIndex === i ? ' active' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(item)}
              >
                {item.image
                  ? <img src={item.image} alt={item.title} className='search-item-thumb' />
                  : <span className='search-item-fallback'>{item.title?.[0]?.toUpperCase() || '?'}</span>
                }
                <span className='search-item-text'>
                  <span className='search-item-title'>{item.title}</span>
                  <span className='search-item-sub'>{item.subtitle}</span>
                </span>
                <span className='search-item-type'>{item.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className='menu'>
        <h2>Menu</h2>

        <div className='menu-links'>
          <div className='link-container'>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z" /></svg>

            <NavLink to="/" end onClick={handleNavLinkClick}>Home</NavLink>
          </div>

          <div className="link-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM16.5 7.5L10 10L7.5 16.5L14 14L16.5 7.5ZM12 13C11.4477 13 11 12.5523 11 12C11 11.4477 11.4477 11 12 11C12.5523 11 13 11.4477 13 12C13 12.5523 12.5523 13 12 13Z"></path></svg>
            <NavLink to="/discover" onClick={handleNavLinkClick}>Discover</NavLink>
          </div>

          <div className="link-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M64 64C28.7 64 0 92.7 0 128l0 64C0 200.8 7.4 207.7 15.7 210.6 34.5 217.1 48 235 48 256s-13.5 38.9-32.3 45.4C7.4 304.3 0 311.2 0 320l0 64c0 35.3 28.7 64 64 64l448 0c35.3 0 64-28.7 64-64l0-64c0-8.8-7.4-15.7-15.7-18.6-18.8-6.5-32.3-24.4-32.3-45.4s13.5-38.9 32.3-45.4c8.3-2.9 15.7-9.8 15.7-18.6l0-64c0-35.3-28.7-64-64-64L64 64zM416 336l0-160-256 0 0 160 256 0zM112 160c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32l0 192c0 17.7-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32l0-192z"/></svg>
            <NavLink to="/concerts" className='concerts-nav-link' onClick={handleConcertNavClick}>
              Concerts
              {showConcertDot && <span className='concerts-nav-dot' />}
            </NavLink>
          </div>
        </div>
      </div>

      <div className='menu'>
        <h2>Library</h2>

        <div className='menu-links'>
          <div className="link-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12.2439 4C12.778 4.00294 14.1143 4.01586 15.5341 4.07273L16.0375 4.09468C17.467 4.16236 18.8953 4.27798 19.6037 4.4755C20.5486 4.74095 21.2913 5.5155 21.5423 6.49732C21.942 8.05641 21.992 11.0994 21.9982 11.8358L21.9991 11.9884L21.9991 11.9991C21.9991 11.9991 21.9991 12.0028 21.9991 12.0099L21.9982 12.1625C21.992 12.8989 21.942 15.9419 21.5423 17.501C21.2878 18.4864 20.5451 19.261 19.6037 19.5228C18.8953 19.7203 17.467 19.8359 16.0375 19.9036L15.5341 19.9255C14.1143 19.9824 12.778 19.9953 12.2439 19.9983L12.0095 19.9991L11.9991 19.9991C11.9991 19.9991 11.9956 19.9991 11.9887 19.9991L11.7545 19.9983C10.6241 19.9921 5.89772 19.941 4.39451 19.5228C3.4496 19.2573 2.70692 18.4828 2.45587 17.501C2.0562 15.9419 2.00624 12.8989 2 12.1625V11.8358C2.00624 11.0994 2.0562 8.05641 2.45587 6.49732C2.7104 5.51186 3.45308 4.73732 4.39451 4.4755C5.89772 4.05723 10.6241 4.00622 11.7545 4H12.2439ZM9.99911 8.49914V15.4991L15.9991 11.9991L9.99911 8.49914Z"></path></svg>
            <NavLink to="/albums" onClick={handleNavLinkClick}>Albums</NavLink>
          </div>

          <div className="link-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M14.8 101.1C6.6 101.1 0 127.6 0 160.3s6.6 59.2 14.8 59.2 14.8-26.5 14.8-59.2-6.6-59.2-14.8-59.2zM448.7 40.9c-7.7 0-14.5 17.1-19.4 44.1-7.7-46.7-20.2-77-34.2-77-16.8 0-31.1 42.9-38 105.4-6.6-45.4-16.8-74.2-28.3-74.2-16.1 0-29.6 56.9-34.7 136.2-9.4-40.8-23.2-66.3-38.3-66.3s-28.8 25.5-38.3 66.3c-5.1-79.3-18.6-136.2-34.7-136.2-11.5 0-21.7 28.8-28.3 74.2-6.6-62.5-21.2-105.4-37.8-105.4-14 0-26.5 30.4-34.2 77-4.8-27-11.7-44.1-19.4-44.1-14.3 0-26 59.2-26 132.1S49 305.2 63.3 305.2c5.9 0 11.5-9.9 15.8-26.8 6.9 61.7 21.2 104.1 38 104.1 13 0 24.5-25.5 32.1-65.6 5.4 76.3 18.6 130.4 34.2 130.4 9.7 0 18.6-21.4 25.3-56.4 7.9 72.2 26.3 122.7 47.7 122.7s39.5-50.5 47.7-122.7c6.6 35 15.6 56.4 25.3 56.4 15.6 0 28.8-54.1 34.2-130.4 7.7 40.1 19.4 65.6 32.1 65.6 16.6 0 30.9-42.3 38-104.1 4.3 16.8 9.7 26.8 15.8 26.8 14.3 0 26-59.2 26-132.1S463 40.9 448.7 40.9zm48.5 60.2c-8.2 0-14.8 26.5-14.8 59.2s6.6 59.2 14.8 59.2 14.8-26.5 14.8-59.2-6.6-59.2-14.8-59.2z"/></svg>
            <NavLink to="/songs" onClick={handleNavLinkClick}>Songs</NavLink>
          </div>

          <div className="link-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M320 312C386.3 312 440 258.3 440 192C440 125.7 386.3 72 320 72C253.7 72 200 125.7 200 192C200 258.3 253.7 312 320 312zM290.3 368C191.8 368 112 447.8 112 546.3C112 562.7 125.3 576 141.7 576L498.3 576C514.7 576 528 562.7 528 546.3C528 447.8 448.2 368 349.7 368L290.3 368z" /></svg>
            <NavLink to="/artists" onClick={handleNavLinkClick}>Artists</NavLink>
          </div>

          <div className="link-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M64 64C28.7 64 0 92.7 0 128L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-256c0-35.3-28.7-64-64-64L64 64zm96 256a32 32 0 1 1 -64 0 32 32 0 1 1 64 0zm-32-96a32 32 0 1 1 0-64 32 32 0 1 1 0 64zm120-56l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24zm0 128l144 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-144 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z" /></svg>
            <NavLink to="/playlists" onClick={handleNavLinkClick}>Playlists</NavLink>
          </div>

          {user?.profileType === 'admin' && (
            <div className="link-container">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M384 128C384 92.7 355.3 64 320 64C284.7 64 256 92.7 256 128L256 160L176 160C149.5 160 128 181.5 128 208L128 512C128 538.5 149.5 560 176 560L464 560C490.5 560 512 538.5 512 512L512 208C512 181.5 490.5 160 464 160L384 160L384 128zM320 472C293.5 472 272 450.5 272 424C272 404.7 283.4 388.1 299.8 380.4L288.4 302C287.2 293.9 293.5 286.7 301.7 286.7L338.3 286.7C346.5 286.7 352.8 293.9 351.6 302L340.2 380.4C356.6 388.1 368 404.7 368 424C368 450.5 346.5 472 320 472z"/></svg>
              <NavLink to="/admin" onClick={handleNavLinkClick}>Admin</NavLink>
            </div>
          )}
        </div>
      </div>
      </div>

      <NavLink to='/profile' className='user-profile' onClick={handleNavLinkClick}>
        {user?.profilePicture
          ? <img src={user.profilePicture} alt="avatar" />
          : <span className='nav-avatar-letter'>
              {(user?.profileType === 'artist' ? user?.artistName : user?.name)?.[0]?.toUpperCase() || '?'}
            </span>
        }

        <div>
          <h3>{user?.profileType === "artist" ? user?.artistName : user?.name}</h3>
          <p>{user?.profileType}</p>
        </div>
      </NavLink>
    </div>
    </>
  )
}

export default AppNavigation
