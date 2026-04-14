import React, { useState, useEffect } from 'react';
import { Plus, Users, MoreHorizontal, Edit2, Trash2, ChevronLeft } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, differenceInCalendarDays } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useEvents, CATEGORY_MAP, DEPARTMENTS } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';

const START_HOUR = 9;
const HOURS_COUNT = 9; // 9 AM → 5 PM (17:00)

const CATEGORY_LIST = Object.entries(CATEGORY_MAP).map(([id, v]) => ({ id, ...v }));

/* ── Convert a unified item to a calendar slot (returns null if not in view week or no time) ── */
const toCalSlot = (item, weekStart) => {
  if (!item.dueDate || !item.dueTime) return null;
  const startDate = new Date(item.dueDate + 'T00:00:00');
  const endDateStr = item.endDate || item.dueDate;
  const endDate = new Date(endDateStr + 'T00:00:00');
  
  const startDayIndex = differenceInCalendarDays(startDate, weekStart);
  const endDayIndex = differenceInCalendarDays(endDate, weekStart);
  
  if (endDayIndex < 0 || startDayIndex > 6) return null;

  const clampedStart = Math.max(0, startDayIndex);
  const clampedEnd = Math.min(6, endDayIndex);
  const spanDays = clampedEnd - clampedStart + 1;

  const [h, m] = item.dueTime.split(':').map(Number);
  const start = h + m / 60;
  const cat = CATEGORY_MAP[item.categoryId] || Object.values(CATEGORY_MAP)[0];
  return { ...item, day: clampedStart, spanDays, start, color: cat.color, text: cat.text };
};

/* ── Event Card with hover ... dropdown ── */
const EventCard = ({ event, topPos, height, leftPos, width, onEdit, onDelete, onOpen, canEdit, isFocused, anyFocused }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const fmt = (h) => {
    const hours = Math.floor(h);
    const minutes = Math.round((h - hours) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const TYPE_LABEL = { meeting: '📅', task: '✅', report: '📊' };

  return (
    <div
      id={`event-${event.id}`}
      className="event-card"
      style={{
        top: `${topPos}%`, left: leftPos, width: width,
        height: `calc(${height}% - 2px)`,
        minHeight: '76px',
        zIndex: isFocused ? 25 : 15,
        background: event.color, 
        color: event.text, 
        borderColor: event.text,
        position: 'absolute', overflow: 'visible',
        opacity: anyFocused && !isFocused ? 0.15 : 1,
        filter: anyFocused && !isFocused ? 'grayscale(0.5) blur(1px)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: anyFocused && !isFocused ? 'none' : 'auto'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
      onClick={() => { if(canEdit) onOpen(); }}
    >
      {/* Title + ... button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '4px' }}>
        <div className="event-title" style={{ 
          flex: 1, 
          textAlign: event.status === 'in-progress' ? 'right' : 'left',
          fontSize: '11px',
          lineHeight: '1.2',
          maxHeight: '3.6em',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical'
        }}>
          {TYPE_LABEL[event.type] || ''} {event.title}
        </div>
        {canEdit && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }}
              style={{
                width: '20px', height: '20px', border: 'none',
                background: menuOpen ? 'rgba(0,0,0,0.12)' : (isHovered ? 'rgba(0,0,0,0.08)' : 'transparent'),
                borderRadius: '6px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'inherit', opacity: isHovered || menuOpen ? 1 : 0,
                transition: 'opacity 0.2s ease', padding: 0,
              }}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'absolute', top: '24px', right: 0,
                  background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
                  borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.14)',
                  padding: '6px', zIndex: 1000, minWidth: '160px',
                  animation: 'popIn 0.2s cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <div className="context-menu-item" onClick={() => { onEdit(); setMenuOpen(false); }}>
                  <Edit2 size={14} /> Edit Task
                </div>
                <div className="context-menu-item delete" onClick={() => { onDelete(); setMenuOpen(false); }}>
                  <Trash2 size={14} /> Delete Task
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Time & Dates */}
      <div style={{ fontSize: '9px', fontWeight: '700', marginTop: '2px', opacity: 0.9 }}>
        {fmt(event.start)} – {fmt(event.start + event.duration)}
        {event.spanDays > 1 && (
          <div style={{ marginTop: '2px', opacity: 0.8 }}>
            Multiple days: {event.spanDays} days
          </div>
        )}
      </div>

      {/* Focus Status Badge & Tracker */}
      <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', alignItems: 'center', gap: '4px', zIndex: 2 }}>
        {event.status === 'in-progress' && event.updatedBy && (
          <div style={{ fontSize: '9px', fontWeight: '700', color: 'inherit', opacity: 0.8, whiteSpace: 'nowrap', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {event.updatedBy}
          </div>
        )}
        {(() => {
          let text = '';
          let bgColor = '';
          const todayStr = new Date().toISOString().split('T')[0];
          
          if (event.status === 'done') {
            text = 'Done';
            bgColor = '#7c3aed';
          } else if (event.status === 'in-progress') {
            text = 'In progress';
            bgColor = '#2563eb';
          } else if (event.status === 'todo' && event.dueDate && event.dueDate < todayStr) {
            text = 'Overdue';
            bgColor = '#ef4444';
          }
  
          if (!text) return null;
  
          return (
            <div style={{
              backgroundColor: bgColor,
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: '800',
              padding: '1px 6px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {text}
            </div>
          );
        })()}
      </div>

      {/* Tracking info normally */}
      {event.updatedBy && event.status !== 'in-progress' && (
        <div style={{ 
          marginTop: '4px', 
          paddingTop: '4px', 
          borderTop: '1px solid rgba(0,0,0,0.06)', 
          fontSize: '8px', 
          fontWeight: '600',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          By <strong>{event.updatedBy}</strong>
        </div>
      )}
    </div>
  );
};

/* ── Main CalendarView ── */
const CalendarView = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { events, openEditModal, deleteEvent, updateEvent, openAddModal, activeLocation, isEditable } = useEvents();
  const { currentUser } = useAuth();
  const canEdit = isEditable;
  
  const currentDepts = DEPARTMENTS[activeLocation] || [];

  // Active category filter
  const [activeCategories, setActiveCategories] = useState({});
  const [internalSidebarOpen, setInternalSidebarOpen] = useState(true);
  const [gridZoom, setGridZoom] = useState(240); // Initial day width in px
  const [expandedDept, setExpandedDept] = useState(null);
  const [focusedTaskId, setFocusedTaskId] = useState(null);
  const [summarySidebarOpen, setSummarySidebarOpen] = useState(true);

  const scrollToTask = (id) => {
    const el = document.getElementById(`event-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      el.classList.add('highlight-event');
      setTimeout(() => el.classList.remove('highlight-event'), 2000);
    }
  };

  const toggleFocus = (id) => {
    setFocusedTaskId(prev => prev === id ? null : id);
    if (focusedTaskId !== id) scrollToTask(id);
  };

  useEffect(() => {
    setActiveCategories(Object.fromEntries(currentDepts.map(c => [c.id, true])));
  }, [activeLocation]);

  const toggleCat = (id) => setActiveCategories(p => ({ ...p, [id]: !p[id] }));

  const editTitle = (item) => {
    const t = window.prompt('Edit title:', item.title);
    if (t && t.trim()) updateEvent({ ...item, title: t });
  };

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekRangeStr = `${format(weekStart, 'dd MMM', { locale: enUS })} - ${format(addDays(weekStart, 6), 'dd MMM', { locale: enUS })}`;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    return { name: format(d, 'EEE', { locale: enUS }), date: format(d, 'd'), fullDate: d };
  });
  const hours = Array.from({ length: HOURS_COUNT }, (_, i) => i + START_HOUR);

  // Compute calendar slots from unified items
  const calSlots = events
    .filter(e => activeCategories[e.categoryId])
    .map(e => toCalSlot(e, weekStart))
    .filter(Boolean)
    .filter(s => s.start >= START_HOUR && s.start < START_HOUR + HOURS_COUNT);

  return (
    <div style={{ padding: '0 40px 24px' }} className="animate-fade-in calendar-page-root">
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', color: 'var(--text-primary)' }}>Calendar Planner</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '15px' }}>
            Showing tasks & meetings for week of {format(weekStart, 'MMM d', { locale: enUS })}.
          </p>
        </div>
        {/* Main Menu Sidebar toggle (from props) */}
        <button 
          className="sidebar-toggle-mobile"
          style={{ display: 'none' }} 
          onClick={() => {
            const sb = document.querySelector('.sidebar');
            if (sb) sb.classList.toggle('active');
          }}
        >
          <MoreHorizontal />
        </button>
      </div>

      <div className="calendar-container">
        {/* Toggle Internal Sidebar Button (Date section) */}
        <button 
          onClick={() => setInternalSidebarOpen(!internalSidebarOpen)}
          className="internal-sidebar-toggle"
          style={{
            position: 'absolute', left: internalSidebarOpen ? '270px' : '0px', top: '10px',
            zIndex: 110, background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
            padding: '5px', borderRadius: '50%', cursor: 'pointer', boxShadow: 'var(--shadow-soft)',
            transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title={internalSidebarOpen ? "Hide Filter" : "Show Filter"}
        >
          {internalSidebarOpen ? <ChevronLeft size={16} /> : <Users size={16} />}
        </button>

        {/* Internal Sidebar (Date & Filters) */}
        <div className={`calendar-sidebar ${!internalSidebarOpen ? 'collapsed' : ''}`}>
          {canEdit && (
            <button
              style={{
                background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '10px 20px',
                borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800',
                fontSize: '15px', color: 'var(--text-primary)', alignSelf: 'flex-start', boxShadow: 'var(--shadow-soft)', cursor: 'pointer'
              }}
              onClick={openAddModal}
            >
              <Plus size={18} strokeWidth={2.5} /> Create
            </button>
          )}

          <div style={{ marginTop: '8px' }}>
            <style>{`
              .rdp { --rdp-cell-size: 24px; --rdp-accent-color: var(--blue-accent); margin: 0; }
              .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover { background-color: var(--blue-accent); color: white; }
              .rdp-caption_label { font-size: 14px; font-weight: 800; color: var(--text-primary); }
              .rdp-head_cell { color: var(--text-secondary); font-size: 10px; font-weight: 700; text-transform: uppercase; }
              .rdp-day { font-size: 11px; font-weight: 600; color: var(--text-primary); border-radius: 6px; }
              .rdp-nav_button { color: var(--text-secondary); }
            `}</style>
            <DayPicker mode="single" selected={selectedDate} onSelect={d => d && setSelectedDate(d)} showOutsideDays weekStartsOn={1} />
          </div>

          {/* Department filter */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>My Calendars</h4>
              <button 
                onClick={() => {
                  const allSelected = currentDepts.every(c => activeCategories[c.id]);
                  const nextState = { ...activeCategories };
                  currentDepts.forEach(c => nextState[c.id] = !allSelected);
                  setActiveCategories(nextState);
                }}
                style={{ fontSize: '11px', fontWeight: '700', color: 'var(--blue-accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {currentDepts.length > 0 && currentDepts.every(c => activeCategories[c.id]) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {currentDepts.map(cat => (
                <label key={cat.id} className="check-item" style={{
                  cursor: 'pointer', padding: '6px 10px', borderRadius: '10px',
                  background: activeCategories[cat.id] ? `${cat.accent}18` : 'transparent',
                  border: `1px solid ${activeCategories[cat.id] ? cat.accent + '44' : 'transparent'}`,
                  transition: 'all 0.2s ease', userSelect: 'none',
                }}>
                  <input
                    type="checkbox" checked={activeCategories[cat.id]}
                    onChange={() => toggleCat(cat.id)}
                    style={{ accentColor: cat.accent, width: '15px', height: '15px' }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: '700', color: activeCategories[cat.id] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {cat.name}
                  </span>
                </label>
              ))}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-main)', borderRadius: '10px' }}>
              <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>CATEGORY</p>
              {[{e:'📅',l:'Meeting'},{e:'✅',l:'Task'},{e:'📊',l:'Report'}].map(({e,l})=>(
                <div key={l} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '3px' }}>{e} {l}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Grid Scroll Area */}
        <div className="calendar-main" id="calendar-scroll-target">
          <div className="calendar-header-wrapper">
             <div className="calendar-header">
                <div className="calendar-header-corner">
                  <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>GMT+07</span>
                </div>
                {days.map((d, i) => (
                  <div key={i} className="calendar-header-day">
                    <span style={{ color: i === 6 ? '#f43f5e' : 'inherit' }}>{d.name}</span>
                    <span style={{
                      color: isSameDay(d.fullDate, selectedDate) ? 'white' : (i === 6 ? '#f43f5e' : 'inherit'),
                      background: isSameDay(d.fullDate, selectedDate) ? (i === 6 ? '#f43f5e' : 'var(--blue-accent)') : 'transparent',
                      width: '32px', height: '32px', lineHeight: '32px', borderRadius: '50%', display: 'inline-block', margin: '0 auto'
                    }}>
                      {d.date}
                    </span>
                  </div>
                ))}
              </div>
          </div>

          <div className="calendar-body-scroll">
            <div className="calendar-grid-bg" style={{ gridTemplateRows: `repeat(${HOURS_COUNT}, 1fr)` }}>
              {hours.map(hour => (
                <React.Fragment key={hour}>
                  <div className="grid-cell-time">
                    <span>{hour.toString().padStart(2, '0')}:00</span>
                  </div>
                  {days.map((_, i) => <div key={i} className="grid-cell" />)}
                </React.Fragment>
              ))}
            </div>

            <div className="calendar-grid">
              {calSlots.map(slot => {
                const topPos = ((slot.start - START_HOUR) / HOURS_COUNT) * 100;
                const durTrimmed = Math.min(slot.duration, START_HOUR + HOURS_COUNT - slot.start);
                const height = (durTrimmed / HOURS_COUNT) * 100;
                
                // Use CSS variables for column widths to ensure perfect alignment even on zoom
                const leftPos = `calc(var(--time-col-width, 80px) + ${slot.day} * ((100% - var(--time-col-width, 80px)) / 7))`;
                const width = `calc((((100% - var(--time-col-width, 80px)) / 7) * ${slot.spanDays}) - 4px)`;
                
                return (
                  <EventCard
                    key={slot.id}
                    event={slot}
                    topPos={topPos} height={height} leftPos={leftPos} width={width}
                    onEdit={() => editTitle(slot)}
                    onDelete={() => deleteEvent(slot.id)}
                    onOpen={() => openEditModal(slot)}
                    canEdit={canEdit}
                    isFocused={focusedTaskId === slot.id}
                    anyFocused={focusedTaskId !== null}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Summary Panel */}
        <div className={`calendar-summary-panel ${!summarySidebarOpen ? 'collapsed' : ''}`}>
          <button 
            onClick={() => setSummarySidebarOpen(!summarySidebarOpen)}
            className="summary-sidebar-toggle"
            style={{
              position: 'absolute', right: summarySidebarOpen ? '220px' : '0px', top: '10px',
              zIndex: 110, background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
              padding: '5px', borderRadius: '50%', cursor: 'pointer', boxShadow: 'var(--shadow-soft)',
              transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
            title={summarySidebarOpen ? "Hide Stats" : "Show Stats"}
          >
            {summarySidebarOpen ? <ChevronLeft style={{ transform: 'rotate(180deg)' }} size={16} /> : <Users size={16} />}
          </button>

          <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
            <h3 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>📊 Weekly Stats</h3>
            <p style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{weekRangeStr}</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(() => {
              let globalIdx = 0;
              return currentDepts.map(dept => {
                const deptTasks = calSlots.filter(s => s.categoryId === dept.id);
                if (deptTasks.length === 0) return null;
                const isExpanded = expandedDept === dept.id;

                return (
                  <div key={dept.id} className={`summary-dept-card ${isExpanded ? 'active' : ''}`} onClick={() => setExpandedDept(isExpanded ? null : dept.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>📍</span>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: dept.text }}>{dept.name}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '8px', background: `${dept.accent}18`, color: dept.accent }}>
                        {deptTasks.length}
                      </span>
                    </div>

                    {isExpanded && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }} onClick={e => e.stopPropagation()}>
                        {deptTasks.map(task => {
                          globalIdx++;
                          const isFocused = focusedTaskId === task.id;
                          return (
                            <div 
                              key={task.id} 
                              className={`summary-task-item ${isFocused ? 'active' : ''}`}
                              onClick={() => toggleFocus(task.id)}
                              style={{ 
                                display: 'flex', gap: '8px',
                                background: isFocused ? 'var(--primary-pastel)' : 'transparent',
                                color: isFocused ? 'var(--primary-accent)' : 'inherit',
                                borderColor: isFocused ? 'var(--primary-accent)' : 'transparent'
                              }}
                            >
                              <span style={{ opacity: 0.6 }}>{globalIdx}.</span>
                              <span style={{ flex: 1 }}>{task.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Zoom Control & Mini-map Overlay (Visible on Mobile) */}
      <div className="calendar-controls-floating">
        <div className="zoom-control-panel">
          <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--text-muted)' }}>ZOOM</span>
          <input 
            type="range" 
            min="140" 
            max="600" 
            value={gridZoom} 
            onChange={(e) => {
              const val = e.target.value;
              setGridZoom(val);
              document.documentElement.style.setProperty('--grid-column-weight', `${val}px`);
            }}
            className="zoom-slider"
          />
        </div>
        <CalendarMinimap scrollSelector="#calendar-scroll-target" />
      </div>
    </div>
);
};

/* ── Mini-map Component ── */
const CalendarMinimap = ({ scrollSelector }) => {
  const [viewport, setViewport] = useState({ top: 0, left: 0, width: 100, height: 100 });

  useEffect(() => {
    const el = document.querySelector(scrollSelector);
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollLeft, scrollWidth, scrollHeight, clientWidth, clientHeight } = el;
      setViewport({
        top: (scrollTop / scrollHeight) * 100,
        left: (scrollLeft / scrollWidth) * 100,
        width: (clientWidth / scrollWidth) * 100,
        height: (clientHeight / scrollHeight) * 100
      });
    };

    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scrollSelector]);

  return (
    <div className="calendar-minimap">
      <div 
        className="minimap-viewport" 
        style={{ 
          top: `${viewport.top}%`, 
          left: `${viewport.left}%`, 
          width: `${viewport.width}%`, 
          height: `${viewport.height}%` 
        }} 
      />
    </div>
  );
};

export default CalendarView;
