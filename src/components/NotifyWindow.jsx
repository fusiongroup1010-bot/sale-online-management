import React from 'react';
import { MessageSquare, Bell } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotify } from '../context/NotifyContext';
import { useAuth } from '../context/AuthContext';

const NotifyWindow = () => {
  const { currentUser } = useAuth();
  const { unreadCount } = useNotify();
  const navigate = useNavigate();
  const location = useLocation();

  if (!currentUser) return null;
  
  // Don't show the floating button if we are already on the Notify page
  if (location.pathname === '/notify') return null;

  return (
    <div className="notify-wrapper">
      <button 
        className={`notify-toggle ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => navigate('/notify')}
        title="Go to Notify Center"
      >
        <MessageSquare size={24} />
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </button>
    </div>
  );
};

export default NotifyWindow;
