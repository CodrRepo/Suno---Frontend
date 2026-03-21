import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react'
import { Howl } from 'howler'

const PlayerContext = createContext(null)

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const PlayerProvider = ({ children }) => {
  const howlRef = useRef(null)
  const rafRef = useRef(null)
  const volumeRef = useRef(0.7)

  const [currentSong, setCurrentSong] = useState(null)
  const [playing, setPlaying] = useState(false)
  const [seek, setSeek] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)

  // Queue — refs so Howl callbacks always see fresh values
  const queueRef = useRef([])
  const queueIdxRef = useRef(-1)
  const shuffleOrderRef = useRef([]) // shuffled array of indices
  const shufflePosRef = useRef(0)    // current position in shuffleOrder
  const repeatRef = useRef('none')   // 'none' | 'one'
  const shuffleRef = useRef(false)

  // UI state
  const [repeat, setRepeat] = useState('none')
  const [shuffle, setShuffle] = useState(false)

  // Forward ref so onend can always call the latest playNext
  const playNextCbRef = useRef(null)

  const stopTick = () => cancelAnimationFrame(rafRef.current)

  const tick = useCallback(function handleTick() {
    if (howlRef.current?.playing()) {
      setSeek(howlRef.current.seek())
      rafRef.current = requestAnimationFrame(handleTick)
    }
  }, [])

  // Internal: create a Howl instance and start playing
  const _loadAndPlay = useCallback((song) => {
    if (howlRef.current) {
      howlRef.current.unload()
      stopTick()
    }

    const howl = new Howl({
      src: [song.audioUrl],
      html5: true,
      volume: volumeRef.current,
      onload() {
        setDuration(howl.duration())
      },
      onplay() {
        setPlaying(true)
        rafRef.current = requestAnimationFrame(tick)
      },
      onpause() {
        setPlaying(false)
        stopTick()
      },
      onstop() {
        setPlaying(false)
        setSeek(0)
        stopTick()
      },
      onend() {
        setPlaying(false)
        setSeek(0)
        stopTick()
        playNextCbRef.current?.()
      },
    })

    howlRef.current = howl
    setCurrentSong(song)
    setSeek(0)
    howl.play()
  }, [tick])

  const playNext = useCallback(() => {
    const queue = queueRef.current
    if (!queue.length) return

    if (repeatRef.current === 'one') {
      _loadAndPlay(queue[queueIdxRef.current])
      return
    }

    if (shuffleRef.current && shuffleOrderRef.current.length) {
      let pos = shufflePosRef.current + 1
      if (pos >= shuffleOrderRef.current.length) return
      shufflePosRef.current = pos
      const idx = shuffleOrderRef.current[pos]
      queueIdxRef.current = idx
      _loadAndPlay(queue[idx])
    } else {
      let idx = queueIdxRef.current + 1
      if (idx >= queue.length) return
      queueIdxRef.current = idx
      _loadAndPlay(queue[idx])
    }
  }, [_loadAndPlay])

  // Keep playNextCbRef current so onend always calls the latest version
  useEffect(() => { playNextCbRef.current = playNext }, [playNext])

  const playPrev = useCallback(() => {
    const queue = queueRef.current
    if (!queue.length) return

    // If more than 3 s into the song, restart it
    if (howlRef.current && howlRef.current.seek() > 3) {
      howlRef.current.seek(0)
      return
    }

    if (repeatRef.current === 'one') {
      _loadAndPlay(queue[queueIdxRef.current])
      return
    }

    if (shuffleRef.current && shuffleOrderRef.current.length) {
      let pos = shufflePosRef.current - 1
      if (pos < 0) { howlRef.current?.seek(0); return }
      shufflePosRef.current = pos
      const idx = shuffleOrderRef.current[pos]
      queueIdxRef.current = idx
      _loadAndPlay(queue[idx])
    } else {
      let idx = queueIdxRef.current - 1
      if (idx < 0) { howlRef.current?.seek(0); return }
      queueIdxRef.current = idx
      _loadAndPlay(queue[idx])
    }
  }, [_loadAndPlay])

  const playQueue = useCallback((songs, startIndex = 0) => {
    if (!songs || !songs.length) return
    queueRef.current = songs
    queueIdxRef.current = startIndex
    if (shuffleRef.current) {
      const others = songs.map((_, i) => i).filter(i => i !== startIndex)
      shuffleOrderRef.current = [startIndex, ...shuffleArray(others)]
      shufflePosRef.current = 0
    } else {
      shuffleOrderRef.current = []
      shufflePosRef.current = 0
    }
    _loadAndPlay(songs[startIndex])
  }, [_loadAndPlay])

  const playSong = useCallback((song) => {
    playQueue([song], 0)
  }, [playQueue])

  const play = useCallback(() => {
    if (!howlRef.current) return
    howlRef.current.play()
  }, [])

  const pause = useCallback(() => {
    if (!howlRef.current) return
    howlRef.current.pause()
  }, [])

  const togglePlay = useCallback(() => {
    if (!howlRef.current) return
    if (howlRef.current.playing()) {
      howlRef.current.pause()
    } else {
      howlRef.current.play()
    }
  }, [])

  const seekTo = useCallback((val) => {
    if (!howlRef.current) return
    howlRef.current.seek(val)
    setSeek(val)
  }, [])

  const changeVolume = useCallback((val) => {
    volumeRef.current = val
    setVolume(val)
    if (howlRef.current) howlRef.current.volume(val)
  }, [])

  const toggleRepeat = useCallback(() => {
    const next = repeatRef.current === 'none' ? 'one' : 'none'
    repeatRef.current = next
    setRepeat(next)

    // Repeat and shuffle are mutually exclusive.
    if (next !== 'none' && shuffleRef.current) {
      shuffleRef.current = false
      setShuffle(false)
      shuffleOrderRef.current = []
      shufflePosRef.current = 0
    }
  }, [])

  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current
    shuffleRef.current = next
    setShuffle(next)

    // Repeat and shuffle are mutually exclusive.
    if (next && repeatRef.current !== 'none') {
      repeatRef.current = 'none'
      setRepeat('none')
    }

    const queue = queueRef.current
    if (next && queue.length > 0) {
      const curIdx = queueIdxRef.current
      const others = queue.map((_, i) => i).filter(i => i !== curIdx)
      shuffleOrderRef.current = [curIdx, ...shuffleArray(others)]
      shufflePosRef.current = 0
    } else {
      shuffleOrderRef.current = []
      shufflePosRef.current = 0
    }
  }, [])

  useEffect(() => {
    return () => {
      stopTick()
      howlRef.current?.unload()
    }
  }, [])

  return (
    <PlayerContext.Provider value={{
      currentSong, playing, seek, duration, volume,
      repeat, shuffle,
      playSong, playQueue, playNext, playPrev,
      play, pause, togglePlay, toggleRepeat, toggleShuffle,
      seekTo, changeVolume,
    }}>
      {children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => useContext(PlayerContext)
