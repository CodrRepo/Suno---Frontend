import React, { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { usePlayer } from '../../context/PlayerContext'
import { useUser } from '../../context/UserContext'
import './player.css'

const fmt = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
}

const Player = () => {
    const { currentSong, playing, seek, duration, volume, repeat, shuffle, togglePlay, toggleRepeat, toggleShuffle, playNext, playPrev, seekTo, changeVolume } = usePlayer()
    const { user } = useUser()

    const [isFavorited, setIsFavorited] = useState(false)
    const [showPicker, setShowPicker] = useState(false)
    const [myPlaylists, setMyPlaylists] = useState([])
    const [addedTo, setAddedTo] = useState(null)
    const pickerRef = useRef(null)
    const playTimeRef = useRef(0)
    const historyLoggedRef = useRef(null)

    const progress = duration > 0 ? (seek / duration) * 100 : 0

    // Check if current song is in Favorites when song changes
    useEffect(() => {
        if (!currentSong || !user) { setIsFavorited(false); return }
        axios.get('/api/playlists/favorites', { withCredentials: true })
            .then(res => {
                const ids = new Set(res.data.playlist.songs.map(s => s._id?.toString() || s.toString()))
                setIsFavorited(ids.has(currentSong._id))
            })
            .catch(() => setIsFavorited(false))
    }, [currentSong?._id, user?._id])

    // Close picker on outside click
    useEffect(() => {
        if (!showPicker) return
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [showPicker])

    // Reset accumulated play time when song changes
    useEffect(() => {
        playTimeRef.current = 0
    }, [currentSong?._id])

    // Accumulate play time; log to history after 10s of actual playback
    useEffect(() => {
        if (!playing || !currentSong || !user) return
        const interval = setInterval(() => {
            playTimeRef.current += 0.5
            if (playTimeRef.current >= 10 && historyLoggedRef.current !== currentSong._id) {
                historyLoggedRef.current = currentSong._id
                axios.post('/api/history', { songId: currentSong._id }, { withCredentials: true })
                    .then(() => window.dispatchEvent(new CustomEvent('history:added')))
                    .catch(() => {})
            }
        }, 500)
        return () => clearInterval(interval)
    }, [playing, currentSong?._id, user])

    const handleToggleFavorite = async () => {
        if (!currentSong || !user) return
        const next = !isFavorited
        setIsFavorited(next)
        try {
            await axios.post('/api/playlists/favorites/toggle', { songId: currentSong._id }, { withCredentials: true })
            window.dispatchEvent(new CustomEvent('favorites:updated'))
        } catch {
            setIsFavorited(!next)
        }
    }

    const openPicker = async () => {
        if (!currentSong || !user) return
        try {
            const res = await axios.get('/api/playlists/my', { withCredentials: true })
            setMyPlaylists(res.data.playlists.filter(p => !p.isFavorites))
            setShowPicker(true)
        } catch { /* silent */ }
    }

    const handleAddToPlaylist = async (pl) => {
        setShowPicker(false)
        try {
            await axios.post(`/api/playlists/${pl._id}/songs`, { songId: currentSong._id }, { withCredentials: true })
            setAddedTo(pl.name)
            setTimeout(() => setAddedTo(null), 2500)
        } catch { /* silent */ }
    }

    return (
        <div className='player'>
            <div className="player-controls">

                {/* ── Song info ── */}
                <div className='player-features'>
                    {currentSong ? (
                        <>
                            {currentSong.coverArtUrl && (
                                <img className='player-thumb' src={currentSong.coverArtUrl} alt={currentSong.title} />
                            )}
                            <div className='player-song-info'>
                                <span className='player-song-title'>{currentSong.title}</span>
                                <span className='player-song-artist'>
                                    {currentSong.artistName || currentSong.artistId?.artistName || currentSong.artistId?.name || 'Unknown Artist'}
                                </span>
                            </div>
                        </>
                    ) : (
                        <span className='player-idle'>No song playing</span>
                    )}
                </div>

                {/* ── Playback controls ── */}
                <div className='player-main'>
                    {/* Heart / Favorite */}
                    <svg
                        className={`player-heart-icon${isFavorited ? ' player-heart-active' : ''}`}
                        onClick={handleToggleFavorite}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 640 640"
                        title={isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                    >
                        <path d="M305 151.1L320 171.8L335 151.1C360 116.5 400.2 96 442.9 96C516.4 96 576 155.6 576 229.1L576 231.7C576 343.9 436.1 474.2 363.1 529.9C350.7 539.3 335.5 544 320 544C304.5 544 289.2 539.4 276.9 529.9C203.9 474.2 64 343.9 64 231.7L64 229.1C64 155.6 123.6 96 197.1 96C239.8 96 280 116.5 305 151.1z"/>
                    </svg>

                    {/* Previous */}
                    <svg className={!currentSong ? 'player-btn-disabled' : ''} onClick={playPrev} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M236.3 107.1C247.9 96 265 92.9 279.7 99.2C294.4 105.5 304 120 304 136L304 272.3L476.3 107.2C487.9 96 505 92.9 519.7 99.2C534.4 105.5 544 120 544 136L544 504C544 520 534.4 534.5 519.7 540.8C505 547.1 487.9 544 476.3 532.9L304 367.7L304 504C304 520 294.4 534.5 279.7 540.8C265 547.1 247.9 544 236.3 532.9L44.3 348.9C36.5 341.3 32 330.9 32 320C32 309.1 36.5 298.7 44.3 291.1L236.3 107.1z" /></svg>

                    {/* Play / Pause */}
                    <button className='play-btn' onClick={togglePlay} disabled={!currentSong}>
                        {playing
                            ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z"/></svg>
                            : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z" /></svg>
                        }
                    </button>

                    {/* Next */}
                    <svg className={!currentSong ? 'player-btn-disabled' : ''} onClick={playNext} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M403.7 107.1C392.1 96 375 92.9 360.3 99.2C345.6 105.5 336 120 336 136L336 272.3L163.7 107.2C152.1 96 135 92.9 120.3 99.2C105.6 105.5 96 120 96 136L96 504C96 520 105.6 534.5 120.3 540.8C135 547.1 152.1 544 163.7 532.9L336 367.7L336 504C336 520 345.6 534.5 360.3 540.8C375 547.1 392.1 544 403.7 532.9L595.7 348.9C603.6 341.4 608 330.9 608 320C608 309.1 603.5 298.7 595.7 291.1L403.7 107.1z" /></svg>

                    {/* Add to playlist */}
                    <div className='player-add-wrap' ref={pickerRef}>
                        <svg
                            className='player-add-icon'
                            onClick={openPicker}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 640"
                            title='Add to playlist'
                        >
                            <path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM296 408L296 344L232 344C218.7 344 208 333.3 208 320C208 306.7 218.7 296 232 296L296 296L296 232C296 218.7 306.7 208 320 208C333.3 208 344 218.7 344 232L344 296L408 296C421.3 296 432 306.7 432 320C432 333.3 421.3 344 408 344L344 344L344 408C344 421.3 333.3 432 320 432C306.7 432 296 421.3 296 408z"/>
                        </svg>

                        {showPicker && (
                            <div className='player-picker'>
                                <p className='player-picker-title'>Add to playlist</p>
                                {myPlaylists.length === 0
                                    ? <p className='player-picker-empty'>No playlists yet</p>
                                    : myPlaylists.map(pl => (
                                        <button key={pl._id} className='player-picker-item' onClick={() => handleAddToPlaylist(pl)}>
                                            {pl.name}
                                        </button>
                                    ))
                                }
                            </div>
                        )}
                    </div>
                </div>

                <div className='player-right'>
                    <div className='player-extra-controls'>
                        {/* Repeat */}
                            <div
                                className={`player-ctrl-wrap${repeat !== 'none' ? ' player-ctrl-active' : ''}`}
                                onClick={toggleRepeat}
                                title={repeat === 'none' ? 'Repeat off' : 'Repeat on'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M534.6 182.6C547.1 170.1 547.1 149.8 534.6 137.3L470.6 73.3C461.4 64.1 447.7 61.4 435.7 66.4C423.7 71.4 416 83.1 416 96L416 128L256 128C150 128 64 214 64 320C64 337.7 78.3 352 96 352C113.7 352 128 337.7 128 320C128 249.3 185.3 192 256 192L416 192L416 224C416 236.9 423.8 248.6 435.8 253.6C447.8 258.6 461.5 255.8 470.7 246.7L534.7 182.7zM105.4 457.4C92.9 469.9 92.9 490.2 105.4 502.7L169.4 566.7C178.6 575.9 192.3 578.6 204.3 573.6C216.3 568.6 224 556.9 224 544L224 512L384 512C490 512 576 426 576 320C576 302.3 561.7 288 544 288C526.3 288 512 302.3 512 320C512 390.7 454.7 448 384 448L224 448L224 416C224 403.1 216.2 391.4 204.2 386.4C192.2 381.4 178.5 384.2 169.3 393.3L105.3 457.3z"/></svg>
                                {repeat === 'one' && <span className='player-repeat-badge'>1</span>}
                            </div>
                        {/* Shuffle */}
                            <div
                                className={`player-ctrl-wrap${shuffle ? ' player-ctrl-active' : ''}`}
                                onClick={toggleShuffle}
                                title={shuffle ? 'Shuffle on' : 'Shuffle off'}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M467.8 98.4C479.8 93.4 493.5 96.2 502.7 105.3L566.7 169.3C572.7 175.3 576.1 183.4 576.1 191.9C576.1 200.4 572.7 208.5 566.7 214.5L502.7 278.5C493.5 287.7 479.8 290.4 467.8 285.4C455.8 280.4 448 268.9 448 256L448 224L416 224C405.9 224 396.4 228.7 390.4 236.8L358 280L318 226.7L339.2 198.4C357.3 174.2 385.8 160 416 160L448 160L448 128C448 115.1 455.8 103.4 467.8 98.4zM218 360L258 413.3L236.8 441.6C218.7 465.8 190.2 480 160 480L96 480C78.3 480 64 465.7 64 448C64 430.3 78.3 416 96 416L160 416C170.1 416 179.6 411.3 185.6 403.2L218 360zM502.6 534.6C493.4 543.8 479.7 546.5 467.7 541.5C455.7 536.5 448 524.9 448 512L448 480L416 480C385.8 480 357.3 465.8 339.2 441.6L185.6 236.8C179.6 228.7 170.1 224 160 224L96 224C78.3 224 64 209.7 64 192C64 174.3 78.3 160 96 160L160 160C190.2 160 218.7 174.2 236.8 198.4L390.4 403.2C396.4 411.3 405.9 416 416 416L448 416L448 384C448 371.1 455.8 359.4 467.8 354.4C479.8 349.4 493.5 352.2 502.7 361.3L566.7 425.3C572.7 431.3 576.1 439.4 576.1 447.9C576.1 456.4 572.7 464.5 566.7 470.5L502.7 534.5z"/></svg>
                            </div>
                    </div>

                    {/* ── Volume ── */}
                    <div className='player-volume'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M533.6 96.5C523.3 88.1 508.2 89.7 499.8 100C491.4 110.3 493 125.4 503.3 133.8C557.5 177.8 592 244.8 592 320C592 395.2 557.5 462.2 503.3 506.3C493 514.7 491.5 529.8 499.8 540.1C508.1 550.4 523.3 551.9 533.6 543.6C598.5 490.7 640 410.2 640 320C640 229.8 598.5 149.2 533.6 96.5zM473.1 171C462.8 162.6 447.7 164.2 439.3 174.5C430.9 184.8 432.5 199.9 442.8 208.3C475.3 234.7 496 274.9 496 320C496 365.1 475.3 405.3 442.8 431.8C432.5 440.2 431 455.3 439.3 465.6C447.6 475.9 462.8 477.4 473.1 469.1C516.3 433.9 544 380.2 544 320.1C544 260 516.3 206.3 473.1 171.1zM412.6 245.5C402.3 237.1 387.2 238.7 378.8 249C370.4 259.3 372 274.4 382.3 282.8C393.1 291.6 400 305 400 320C400 335 393.1 348.4 382.3 357.3C372 365.7 370.5 380.8 378.8 391.1C387.1 401.4 402.3 402.9 412.6 394.6C434.1 376.9 448 350.1 448 320C448 289.9 434.1 263.1 412.6 245.5zM80 416L128 416L262.1 535.2C268.5 540.9 276.7 544 285.2 544C304.4 544 320 528.4 320 509.2L320 130.8C320 111.6 304.4 96 285.2 96C276.7 96 268.5 99.1 262.1 104.8L128 224L80 224C53.5 224 32 245.5 32 272L32 368C32 394.5 53.5 416 80 416z"/></svg>
                        <input
                            type='range' min='0' max='1' step='0.01'
                            value={volume}
                            onChange={e => changeVolume(parseFloat(e.target.value))}
                            className='volume-bar'
                        />
                    </div>
                </div>

                {/* Toast: added to playlist feedback */}
                {addedTo && (
                    <div className='player-toast'>Added to "{addedTo}"</div>
                )}
            </div>

            {/* ── Progress ── */}
            <div className='player-progress'>
                <span>{fmt(seek)}</span>
                <input
                    type='range' min='0' max='100' step='0.1'
                    value={progress}
                    onChange={e => seekTo((parseFloat(e.target.value) / 100) * duration)}
                    className='progress-bar'
                    style={{ '--progress': `${progress}%` }}
                />
                <span>{fmt(duration)}</span>
            </div>
        </div>
    )
}

export default Player
