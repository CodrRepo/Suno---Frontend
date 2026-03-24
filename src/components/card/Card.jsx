import React from 'react'
import { usePlayer } from '../../context/PlayerContext'
import './card.css'

const Card = ({ item, song, fallbackLetter, onPlay }) => {
    const { playSong, currentSong, playing } = usePlayer()

    const isActive = currentSong?._id === song?._id
    const showPause = isActive && playing

    const handlePlay = (e) => {
        e.stopPropagation()
        if (!song) return
        if (onPlay) onPlay(song)
        else playSong(song)
    }

    const showLetter = !item.url && fallbackLetter

    console.log(item);

    return (
        <div className={`card`}>
            <div className='card-image'>
                {showLetter
                    ? <div className='card-letter-avatar'>{fallbackLetter[0].toUpperCase()}</div>
                    : <img src={item.url} alt="cover-art" />
                }

                <button className='play-btn' onClick={handlePlay}>
                    {showPause
                        ? <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M176 96C149.5 96 128 117.5 128 144L128 496C128 522.5 149.5 544 176 544L240 544C266.5 544 288 522.5 288 496L288 144C288 117.5 266.5 96 240 96L176 96zM400 96C373.5 96 352 117.5 352 144L352 496C352 522.5 373.5 544 400 544L464 544C490.5 544 512 522.5 512 496L512 144C512 117.5 490.5 96 464 96L400 96z"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M187.2 100.9C174.8 94.1 159.8 94.4 147.6 101.6C135.4 108.8 128 121.9 128 136L128 504C128 518.1 135.5 531.2 147.6 538.4C159.7 545.6 174.8 545.9 187.2 539.1L523.2 355.1C536 348.1 544 334.6 544 320C544 305.4 536 291.9 523.2 284.9L187.2 100.9z" /></svg>
                    }
                </button>
            </div>
            <h2 className='song-name'>{item.name || 'Unknown Title'}</h2>
            {item.profile && item.category !== 'album' && item.category !== 'playlist' && <h3 className='artist-name'>{item.profile}</h3>}
            {item.date && item.category !== 'playlist' && <p className='card-date'>{item.date}</p>}
        </div>
    )
}

export default Card