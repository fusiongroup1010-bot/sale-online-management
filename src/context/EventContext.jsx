import React, { createContext, useState, useContext, useEffect } from 'react';

/* ── Combined Departments (Location-based categories) ── */
export const DEPARTMENTS = {
  all: [
    { id: 'sonl-hn', name: 'Sale Online HN', color: '#fce7f3', text: '#9d174d', accent: '#ec4899' },
    { id: 'sonl-hcm', name: 'Sale Online HCM', color: '#dbeafe', text: '#1e40af', accent: '#3b82f6' },
    { id: 'sonl-hy', name: 'Sale Online HY', color: '#fef9c3', text: '#854d0e', accent: '#eab308' },
  ]
};

// Flat map for lookup
export const CATEGORY_MAP = Object.fromEntries(
  Object.values(DEPARTMENTS).flat().map(d => [d.id, d])
);

const initialItems = []; // Start fresh for CEO branch

import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

export const EventContext = createContext();

export const EventProvider = ({ children }) => {
  const loadMergedState = (fbData) => {
    const fallbackFbStr = localStorage.getItem('last_known_fb_data_sonl');
    let baseData = fbData;
    
    if (!baseData && fallbackFbStr) {
        baseData = JSON.parse(fallbackFbStr);
    } else if (!baseData) {
        baseData = [];
    } else {
        localStorage.setItem('last_known_fb_data_sonl', JSON.stringify(fbData));
    }

    const localStr = localStorage.getItem('local_changes_sonl');
    const localChanges = localStr ? JSON.parse(localStr) : {};
    
    const dataMap = {};
    baseData.forEach(i => dataMap[i.id] = i);
    
    Object.keys(localChanges).forEach(id => {
      const change = localChanges[id];
      if (change === null) delete dataMap[id];
      else dataMap[id] = change;
    });
    
    return Object.values(dataMap);
  };

  const [items, setItems] = useState(() => loadMergedState(null)); // Initialize robustly!
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState(null);
  const { currentUser } = useAuth();
  const [activeLocation, setActiveLocation] = useState('all');

  // Auto-set location based on user permissions on login (Simplified for all-in-one)
  useEffect(() => {
    setActiveLocation('all');
  }, [currentUser]);

  // Change full app theme when activeLocation changes
  useEffect(() => {
    const THEME_MAP = {
      all: {
        bg:             '#eef6ff',
        panelHover:     '#f0f8ff',
        border:         'rgba(59,130,246,0.09)',
        accent:         '#3b82f6',
        pastel:         '#dbeafe',
        pastelHover:    '#bfdbfe',
        textSecondary:  '#3b82f6',
        textPrimary:    '#1e3a8a',
        shadowSoft:     '0 10px 30px rgba(59,130,246,0.05)',
        shadowHover:    '0 15px 40px rgba(59,130,246,0.12)',
        bannerBg:       'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)',
      },
    };
    const t = THEME_MAP[activeLocation] || THEME_MAP.all;
    const root = document.documentElement;
    const userBg = localStorage.getItem('bgColor');
    const userTheme = localStorage.getItem('themeColor');
    if (!userBg) {
      root.style.setProperty('--bg-main', t.bg);
      root.style.setProperty('--bg-panel-hover', t.panelHover);
      root.style.setProperty('--border-light', t.border);
    }
    if (!userTheme) {
      root.style.setProperty('--primary-accent', t.accent);
      root.style.setProperty('--primary-pastel', t.pastel);
      root.style.setProperty('--primary-pastel-hover', t.pastelHover);
      root.style.setProperty('--text-secondary', t.textSecondary);
      root.style.setProperty('--text-primary', t.textPrimary);
      root.style.setProperty('--shadow-soft', t.shadowSoft);
      root.style.setProperty('--shadow-hover', t.shadowHover);
    }
    // Store banner bg for Dashboard to read
    root.style.setProperty('--location-banner-bg', t.bannerBg);
  }, [activeLocation]);

  const saveChangeLocal = (id, objOrNull) => {
    const localStr = localStorage.getItem('local_changes_sonl');
    const localChanges = localStr ? JSON.parse(localStr) : {};
    localChanges[id] = objOrNull;
    localStorage.setItem('local_changes_sonl', JSON.stringify(localChanges));
    
    setItems(prev => {
      if (objOrNull === null) return prev.filter(i => i.id !== id);
      if (prev.find(i => i.id === id)) return prev.map(i => i.id === id ? objOrNull : i);
      return [...prev, objOrNull];
    });
  };

  const clearChangeLocal = (id) => {
    const localStr = localStorage.getItem('local_changes_sonl');
    const localChanges = localStr ? JSON.parse(localStr) : {};
    if (id in localChanges) {
      delete localChanges[id];
      localStorage.setItem('local_changes_sonl', JSON.stringify(localChanges));
    }
  };

  const syncPendingChangesToCloud = () => {
    const localStr = localStorage.getItem('local_changes_sonl');
    if (!localStr) return;
    const localChanges = JSON.parse(localStr);
    const keys = Object.keys(localChanges);
    if (keys.length === 0) return;

    keys.forEach(id => {
      const change = localChanges[id];
      clearChangeLocal(id);
      
      if (change === null) {
        deleteDoc(doc(db, 'sale_online_items', id)).catch(e => saveChangeLocal(id, null));
      } else {
        setDoc(doc(db, 'sale_online_items', id), change, { merge: true }).catch(e => saveChangeLocal(id, change));
      }
    });
  };

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'sale_online_items'), orderBy('dueDate', 'asc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const fbData = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        setItems(loadMergedState(fbData));
        syncPendingChangesToCloud();
      },
      (error) => {
        console.warn("Firestore sync failed. Offline mode active.", error);
        setItems(loadMergedState(null));
      }
    );
    return () => unsubscribe();
  }, []);

  /* ── CRUD (Firestore with robust local overrides) ── */
  const addEvent = async (item) => {
    const newId = `item-${Date.now()}`;
    const newItem = { ...item, id: newId };
    saveChangeLocal(newId, newItem);
    setIsModalOpen(false);
    try { 
      await setDoc(doc(db, 'sale_online_items', newId), newItem); 
      clearChangeLocal(newId);
    } catch (e) { console.warn(e); }
  };

  const updateEvent = async (updated) => {
    saveChangeLocal(updated.id, updated);
    setIsModalOpen(false);
    setCurrentEvent(null);
    try { 
      await setDoc(doc(db, 'sale_online_items', updated.id), updated, { merge: true }); 
      clearChangeLocal(updated.id);
    } catch (e) { console.warn(e); }
  };

  const deleteEvent = async (id) => {
    saveChangeLocal(id, null);
    setIsModalOpen(false);
    setCurrentEvent(null);
    try { 
      await deleteDoc(doc(db, 'sale_online_items', id)); 
      clearChangeLocal(id);
    } catch (e) { console.warn(e); }
  };

  const changeStatus = async (id, status) => {
    setItems((prev) => {
      const target = prev.find(i => i.id === id);
      if (!target) return prev;
      const upd = { 
        ...target, status, 
        updatedBy: currentUser ? currentUser.name : 'Unknown', 
        updatedAt: new Date().toISOString() 
      };
      
      // Async save to pending queue
      Promise.resolve().then(() => {
        const localStr = localStorage.getItem('local_changes_sonl');
        const localChanges = localStr ? JSON.parse(localStr) : {};
        localChanges[id] = upd;
        localStorage.setItem('local_changes_sonl', JSON.stringify(localChanges));
      });
      
      setDoc(doc(db, 'sale_online_items', id), upd, { merge: true })
        .then(() => clearChangeLocal(id))
        .catch(console.warn);

      return prev.map(i => i.id === id ? upd : i);
    });
  };

  /* ── Modal triggers ── */
  const openAddModal = () => { setCurrentEvent(null); setIsModalOpen(true); };
  const openEditModal = (item) => { setCurrentEvent(item); setIsModalOpen(true); };

  /* ── Derived: "events" for Calendar (items with dueTime, shown on calendar grid) ── */
  const events = items; // CalendarView will filter/compute day dynamically

  /* ── Notifications ── */
  const [notifiedIds, setNotifiedIds] = useState(new Set());

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkNotifications = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      items.forEach(item => {
        if (item.status === 'done' || !item.dueDate || !item.dueTime || item.dueDate !== todayStr) return;
        if (notifiedIds.has(item.id)) return;

        const [h, m] = item.dueTime.split(':').map(Number);
        const dueTime = new Date();
        dueTime.setHours(h, m, 0, 0);

        const diffMinutes = (dueTime.getTime() - now.getTime()) / 60000;

        // Notify if it's within 15 minutes
        if (diffMinutes > 0 && diffMinutes <= 15) {
          const typeLabel = item.type === 'meeting' ? '📅 Meeting' : item.type === 'report' ? '📊 Report' : '✅ Task';
          new Notification(`${typeLabel} soon: ${item.title}`, {
            body: `Starting at ${item.dueTime} (in ${Math.round(diffMinutes)} mins)`,
            icon: '/fusion-logo.png' // Fallback to provided logo if available
          });
          setNotifiedIds(prev => new Set([...prev, item.id]));
        }
      });
    };

    const interval = setInterval(checkNotifications, 60000); 
    checkNotifications(); // check immediately
    return () => clearInterval(interval);
  }, [items, notifiedIds]);

  return (
    <EventContext.Provider value={{
      items,           // raw unified list
      activeLocation,
      setActiveLocation,
      filteredItems: items,
      events: items, // For Calendar
      isEditable: true, 
      addEvent, updateEvent, deleteEvent, changeStatus,
      isModalOpen, setIsModalOpen,
      currentEvent,
      openAddModal, openEditModal,
    }}>
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = () => useContext(EventContext);
