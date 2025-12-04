import React from 'react';
import { Link } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <Link to="/dashboard" className="navbar-brand">
        🏥 Community Health Service
      </Link>
      
      <div className="navbar-menu">
        <Link to="/dashboard" className="navbar-link">Dashboard</Link>
        <Link to="/patients" className="navbar-link">Patients</Link>
        <Link to="/patients/register" className="navbar-link">Register Patient</Link>
        
        <div className="navbar-user">
          <div className="user-info">
            <div className="user-name">{user.name}</div>
            <div className="user-role">{user.role.replace('_', ' ')}</div>
          </div>
          <button onClick={onLogout} className="btn btn-danger">Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;