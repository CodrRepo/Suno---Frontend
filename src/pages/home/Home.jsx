import React, { useState } from 'react'
import './home.css'
import AppNavigation from '../../components/appNavigation/AppNavigation'
import Dashboard from '../../components/dashboard/Dashboard'
import Collection from '../../components/collection/Collection'
import { usePlayer } from '../../context/PlayerContext'
import MobileNav from '../../components/mobileNav/MobileNav'

const Home = () => {
    const { currentSong } = usePlayer();
    const [isHamMenuOpen, setIsHamMenuOpen] = useState(false);
    const [isHistoryMenuOpen, setIsHistoryMenuOpen] = useState(false);

    return (
        <div id='home'>

            <img className="home-bg-img" src={currentSong?.coverArtUrl || "/images/download3.jpg"} alt="background image" />
            <MobileNav isHamMenuOpen={isHamMenuOpen} setIsHamMenuOpen={setIsHamMenuOpen} isHistoryMenuOpen={isHistoryMenuOpen} setIsHistoryMenuOpen={setIsHistoryMenuOpen} />

            <div className="panel-container">
                <AppNavigation isHamMenuOpen={isHamMenuOpen} setIsHamMenuOpen={setIsHamMenuOpen} />
                <Dashboard />
                <Collection isHistoryMenuOpen={isHistoryMenuOpen} setIsHistoryMenuOpen={setIsHistoryMenuOpen} />
            </div>

        </div>
    )
}

export default Home
