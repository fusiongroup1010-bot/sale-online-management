import React, { useState } from 'react';
import { useEvents, CATEGORY_MAP, DEPARTMENTS } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { X, Calendar, Clock, Flag, Users, Tag, FileText, MapPin } from 'lucide-react';

const selectStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '12px',
  border: '1px solid var(--border-light)', background: 'var(--bg-main)',
  fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)',
  outline: 'none', cursor: 'pointer', boxSizing: 'border-box', fontFamily: 'inherit'
};

const inputStyle = {
  ...selectStyle, cursor: 'text',
};

const labelStyle = {
  fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px'
};

const TaskModal = () => {
  const { isModalOpen, setIsModalOpen, addEvent, updateEvent, deleteEvent, currentEvent, activeLocation } = useEvents();
  const { currentUser } = useAuth();

  const defaultForm = {
    title: '', 
    type: 'task', 
    categoryId: 'hn-bm',
    location: activeLocation || 'hanoi', // Default to current view's location
    priority: 'medium', 
    status: 'todo',
    dueDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00', 
    duration: 1,
  };

  const [form, setForm] = useState(defaultForm);

  React.useEffect(() => {
    if (currentEvent) {
      setForm({
        title:      currentEvent.title      || '',
        type:       currentEvent.type       || 'task',
        categoryId: currentEvent.categoryId || 'hn-bm',
        location:   currentEvent.location   || 'hanoi',
        priority:   currentEvent.priority   || 'medium',
        status:     currentEvent.status     || 'todo',
        dueDate:    currentEvent.dueDate    || new Date().toISOString().split('T')[0],
        endDate:    currentEvent.endDate    || currentEvent.dueDate || new Date().toISOString().split('T')[0],
        dueTime:    currentEvent.dueTime    || '',
        duration:   currentEvent.duration   || 1,
      });
    } else {
      // Default to activeLocation if editable, else first editable location
      const defaultLoc = currentUser?.editableLocations?.includes(activeLocation) 
        ? activeLocation 
        : (currentUser?.editableLocations?.[0] || 'hanoi');
      setForm({ ...defaultForm, location: defaultLoc });
    }
  }, [currentEvent, isModalOpen, activeLocation, currentUser]);

  if (!isModalOpen) return null;

  const set = (k, v) => {
    if (k === 'location') {
      const firstDept = DEPARTMENTS[v][0]?.id;
      setForm(f => ({ ...f, [k]: v, categoryId: firstDept }));
    } else {
      setForm(f => ({ ...f, [k]: v }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const cat = CATEGORY_MAP[form.categoryId] || (DEPARTMENTS[form.location][0]);
    const itemData = {
      ...form,
      duration: parseFloat(form.duration),
      color: cat.color,
      text:  cat.text,
      updatedBy: currentUser ? currentUser.name : 'Unknown',
      updatedAt: new Date().toISOString(),
    };
    if (currentEvent) {
      updateEvent({ ...itemData, id: currentEvent.id });
    } else {
      addEvent(itemData);
    }
  };

  const currentCategories = DEPARTMENTS[form.location] || [];

  const TypeIcon = form.type === 'meeting' ? Users : form.type === 'report' ? FileText : Tag;
  const typeColors = {
    meeting: { color: '#7c3aed', bg: '#f3e8ff' },
    task:    { color: '#0891b2', bg: '#e0f2fe' },
    report:  { color: '#d97706', bg: '#fef3c7' },
  };
  const tc = typeColors[form.type] || typeColors.task;
  const diffDays = form.dueDate && form.endDate 
    ? Math.max(1, Math.ceil((new Date(form.endDate) - new Date(form.dueDate)) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

  return (
    <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <button
          className="btn-icon"
          style={{ position: 'absolute', top: '24px', right: '24px', width: '36px', height: '36px' }}
          onClick={() => setIsModalOpen(false)}
        >
          <X size={18} />
        </button>

        <div className="modal-header" style={{ paddingRight: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '12px',
              background: tc.bg, color: tc.color
            }}>
              <TypeIcon size={18} />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ margin: 0 }}>{currentEvent ? 'Edit Task' : 'Create New Task'}</h2>
              {diffDays > 1 && (
                <div style={{ fontSize: '11px', fontWeight: '800', color: 'var(--blue-accent)', background: 'var(--blue-pastel)', padding: '2px 8px', borderRadius: '8px', alignSelf: 'flex-start', marginTop: '4px' }}>
                   Range: {diffDays} days
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label style={labelStyle}>Title *</label>
            <input
              type="text" required
              placeholder="e.g. Q2 Strategy Meeting"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              style={inputStyle}
            />
          </div>

          {/* Location + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={labelStyle}><MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />Location</label>
              <select value={form.location} onChange={e => set('location', e.target.value)} style={selectStyle}>
                {['hanoi', 'hcm', 'hungyen'].filter(loc => currentUser?.editableLocations?.includes(loc)).map(loc => (
                  <option key={loc} value={loc}>{loc === 'hanoi' ? 'Hanoi' : loc === 'hcm' ? 'HCM' : 'Hung Yen'}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => set('type', e.target.value)} style={selectStyle}>
                <option value="meeting">📅 Meeting</option>
                <option value="task">✅ Task</option>
                <option value="report">📊 Report</option>
              </select>
            </div>
          </div>

          {/* Department + Priority */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={labelStyle}>Department</label>
              <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} style={selectStyle}>
                {currentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {/* Priority + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={labelStyle}>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)} style={selectStyle}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div className="form-group">
              <label style={labelStyle}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={labelStyle}><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />Start Date</label>
              <input type="date" value={form.dueDate} onChange={e => {
                const newStart = e.target.value;
                if (form.endDate < newStart) setForm(f => ({ ...f, dueDate: newStart, endDate: newStart }));
                else set('dueDate', newStart);
              }} style={inputStyle} />
            </div>
            <div className="form-group">
              <label style={labelStyle}><Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />End Date</label>
              <input type="date" value={form.endDate} min={form.dueDate} onChange={e => set('endDate', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Time & Duration */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={labelStyle}><Clock size={11} style={{ display: 'inline', marginRight: 4 }} />Start Time</label>
              <input type="time" value={form.dueTime} onChange={e => set('dueTime', e.target.value)} style={inputStyle} />
            </div>
            <div className="form-group">
              <label style={labelStyle}>Duration (hours/day)</label>
              <input
                type="number" step="0.5" min="0.5" max="10"
                value={form.duration}
                onChange={e => set('duration', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div className="modal-footer">
            {currentEvent && (
              <button
                type="button"
                style={{ marginRight: 'auto', background: 'var(--pink-pastel)', color: 'var(--pink-accent)', padding: '10px 20px', borderRadius: '12px', border: 'none', fontWeight: '800', cursor: 'pointer' }}
                onClick={() => deleteEvent(currentEvent.id)}
              >
                Delete
              </button>
            )}
            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{currentEvent ? 'Update' : 'Add Task'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
