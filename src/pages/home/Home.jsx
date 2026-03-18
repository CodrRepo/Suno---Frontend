import React from 'react'
import './home.css'
import AppNavigation from '../../components/appNavigation/AppNavigation'
import Dashboard from '../../components/dashboard/Dashboard'
import Collection from '../../components/collection/Collection'
import { usePlayer } from '../../context/PlayerContext'

const Home = () => {
    const { currentSong } = usePlayer();
    return (
        <div id='home'>

            <img className="home-bg-img" src={currentSong?.coverArtUrl || "/images/download3.jpg"} alt="background image" />

            <div className="panel-container">
                <AppNavigation />
                <Dashboard />
                <Collection />
            </div>

        </div>
    )
}

export default Home