import React from 'react'
import { Outlet } from 'react-router-dom'
import Player from '../player/Player'
import './dashboard.css'

const Dashboard = () => {
  return (
    <div className='panel dashboard'>
      <div className="dashboard-content">
        <Outlet />
      </div>

      <div className="player-container">
        <Player />
      </div>
    </div>
  )
}

export default Dashboard