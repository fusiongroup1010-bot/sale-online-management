import React, { useState } from 'react';
import { Bell, Search, Plus, Calendar as CalendarIcon, Menu, MapPin, User, Settings, LogOut, Edit3, ChevronDown, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useEvents } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import SettingsModal from './SettingsModal';
import ProfileModal from './ProfileModal';
import PasswordModal from './PasswordModal';

const TopNav = ({ onMenuClick }) => {
  const today = new Date();
  const { openAddModal, activeLocation, setActiveLocation } = useEvents();
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [profileMode, setProfileMode] = useState('view');

  return (
    <header className="top-nav" style={{ marginBottom: '24px', position: 'relative' }}>
      <button 
        className="sidebar-toggle-main-mobile"
        style={{ display: 'none' }}
        onClick={onMenuClick}
      >
        <Menu size={24} />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
        {/* Location Switcher - 3 compact rectangle cards */}
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          alignItems: 'center',
        }}>
          {['hanoi', 'hcm', 'hungyen'].filter(loc => currentUser?.allowedLocations?.includes(loc)).map((loc) => {
            const LOCATION_THEME = {
              hanoi:   { activeBg: '#dbeafe', activeText: '#1e40af', activeBorder: '#93c5fd', icon: '🏙️', label: 'Hà Nội',  shadow: 'rgba(59,130,246,0.18)' },
              hcm:     { activeBg: '#fce7f3', activeText: '#be185d', activeBorder: '#f9a8d4', icon: '🌆', label: 'HCM',      shadow: 'rgba(236,72,153,0.18)' },
              hungyen: { activeBg: '#ede9fe', activeText: '#6d28d9', activeBorder: '#c4b5fd', icon: '🏭', label: 'Hưng Yên', shadow: 'rgba(139,92,246,0.18)' },
            };
            const theme = LOCATION_THEME[loc];
            const isActive = activeLocation === loc;

            return (
              <button
                key={loc}
                onClick={() => setActiveLocation(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: isActive ? theme.activeBg : 'var(--bg-panel)',
                  color: isActive ? theme.activeText : 'var(--text-muted)',
                  border: `1.5px solid ${isActive ? theme.activeBorder : 'var(--border-light)'}`,
                  boxShadow: isActive ? `0 4px 14px ${theme.shadow}` : 'var(--shadow-soft)',
                  cursor: currentUser?.allowedLocations?.length > 1 ? 'pointer' : 'default',
                  whiteSpace: 'nowrap',
                  transform: isActive ? 'translateY(-1px)' : 'none',
                  minWidth: '90px',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '14px', lineHeight: 1 }}>{theme.icon}</span>
                <span>{theme.label}</span>
                {isActive && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: theme.activeText, marginLeft: '2px', opacity: 0.7,
                    animation: 'pulse 2s ease-in-out infinite'
                  }} />
                )}
              </button>
            );
          })}
        </div>

        <div className="soft-panel" style={{ display: 'none', alignItems: 'center', padding: '12px 20px', borderRadius: 'var(--radius-full)', width: '340px', gap: '12px', background: 'var(--bg-panel)' }}>
          <Search size={18} color="var(--text-muted)" />
          <input 
            type="text" 
            placeholder="Quick Search..." 
            style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', width: '100%', fontSize: '15px', fontWeight: '500' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontWeight: '600', paddingRight: '12px', borderRight: '1px solid var(--border-light)' }}>
           <CalendarIcon size={18} color="var(--primary-accent)"/>
           <span>{format(today, 'EEEE, MMM dd', { locale: enUS })}</span>
        </div>

        {currentUser?.role !== 'guest' && currentUser?.editableLocations?.includes(activeLocation) && (
          <button 
            className="btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={openAddModal}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Task</span>
          </button>
        )}
        
        {/* User Badge with Dropdown */}
        <div style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ 
              padding: '0 12px 0 6px', height: '44px', borderRadius: '16px', 
              background: 'var(--pink-pastel)', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontWeight: '800', color: 'var(--pink-accent)', 
              marginLeft: '4px', cursor: 'pointer', boxShadow: 'var(--shadow-soft)', 
              fontSize: '14px', gap: '10px', border: isDropdownOpen ? '1px solid var(--pink-accent)' : '1px solid transparent'
            }}
          >
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', overflow: 'hidden', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               {currentUser?.avatar ? (
                 <img src={currentUser.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
               ) : (
                 <User size={18} />
               )}
            </div>
            {currentUser ? (currentUser.id === 'Guest' ? 'Guest mode' : currentUser.name) : 'Guest'}
            <ChevronDown size={14} style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </div>

          {isDropdownOpen && (
            <div 
              className="soft-panel animate-fade-in"
              style={{
                position: 'absolute', top: '54px', right: 0, width: '220px',
                padding: '8px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '4px',
                background: 'var(--bg-panel)', border: '1px solid var(--border-light)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)'
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', marginBottom: '4px' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>{currentUser?.name}</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>{currentUser?.id}</p>
              </div>

              <button className="user-dropdown-item" onClick={() => { setIsSettingsOpen(true); setIsDropdownOpen(false); }}>
                <Settings size={16} />
                <span>Settings</span>
              </button>
              
              <button className="user-dropdown-item" onClick={() => { setProfileMode('view'); setIsProfileOpen(true); setIsDropdownOpen(false); }}>
                <User size={16} />
                <span>Personal Info</span>
              </button>

              <button className="user-dropdown-item" onClick={() => { setProfileMode('edit'); setIsProfileOpen(true); setIsDropdownOpen(false); }}>
                <Edit3 size={16} />
                <span>Change Name</span>
              </button>

              <button className="user-dropdown-item" onClick={() => { setIsPasswordOpen(true); setIsDropdownOpen(false); }}>
                <Lock size={16} />
                <span>Change Password</span>
              </button>

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '4px 0' }} />

              <button 
                className="user-dropdown-item" 
                onClick={() => { logout(); setIsDropdownOpen(false); }}
                style={{ color: '#ef4444' }}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} initialMode={profileMode} />
      <PasswordModal isOpen={isPasswordOpen} onClose={() => setIsPasswordOpen(false)} />
    </header>
  );
};

export default TopNav;
