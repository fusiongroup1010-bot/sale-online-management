import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  MoreHorizontal, Edit2, Trash2, Plus, Calendar, Clock,
  Flag, Users, FileText, Tag, ChevronDown, ChevronRight,
  Bell, AlertTriangle, CheckCircle2, X
} from 'lucide-react';
import { useEvents, CATEGORY_MAP } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { format as formatFns } from 'date-fns';

/* ────────── Constants ────────── */
const TYPE_CONFIG = {
  meeting: { label: 'Meeting', icon: Users,    color: '#7c3aed', bg: '#f3e8ff' },
  task:    { label: 'Task',    icon: Tag,      color: '#0891b2', bg: '#e0f2fe' },
  report:  { label: 'Report',  icon: FileText, color: '#d97706', bg: '#fef3c7' },
};

const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: '#ef4444', bg: '#fee2e2' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
  low:    { label: 'Low',    color: '#22c55e', bg: '#dcfce7' },
};

const CATEGORIES = Object.entries(CATEGORY_MAP).map(([id, v]) => ({ id, ...v }));

const today = () => new Date().toISOString().split('T')[0];

const formatDate = (d, end) => {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  const startStr = `${day}/${m}/${y}`;
  if (!end || end === d) return startStr;
  const [ey, em, eday] = end.split('-');
  return `${startStr} - ${eday}/${em}/${ey}`;
};

const isOverdue = (task) => {
  if (task.status === 'done') return false;
  const due = new Date(`${task.dueDate}${task.dueTime ? 'T' + task.dueTime : 'T23:59'}`);
  return due < new Date();
};

const isDueToday = (task) => task.dueDate === today();

/* ────────── Task Card ────────── */
const TaskCard = ({ task, index, onEdit, onDelete, onStatusChange, canEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const TypeIcon = TYPE_CONFIG[task.type]?.icon || Tag;
  const typeCfg = TYPE_CONFIG[task.type] || TYPE_CONFIG.task;
  const priCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const catCfg = CATEGORIES.find(c => c.id === task.categoryId);
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);
 
  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={!canEdit}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => { setIsHovered(false); setMenuOpen(false); }}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? '#ffffff' : 'var(--bg-panel)',
            borderRadius: '16px', padding: '16px', marginBottom: '10px',
            boxShadow: snapshot.isDragging ? '0 20px 40px rgba(0,0,0,0.12)' : 'var(--shadow-soft)',
            border: overdue ? '1px solid #fecaca' : '1px solid var(--border-light)',
            opacity: snapshot.isDragging ? 0.95 : 1,
            position: 'relative', transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
          }}
        >
          {/* Overdue / today indicator */}
          {(overdue || dueToday) && task.status !== 'done' && (
            <div style={{
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
              borderRadius: '16px 0 0 16px',
              background: overdue ? '#ef4444' : '#f59e0b',
            }} />
          )}

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginLeft: (overdue || dueToday) && task.status !== 'done' ? '4px' : 0 }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px',
                color: typeCfg.color, background: typeCfg.bg, padding: '3px 8px', borderRadius: '8px',
              }}>
                <TypeIcon size={11} />{typeCfg.label}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                fontSize: '11px', fontWeight: '700', color: priCfg.color, background: priCfg.bg,
                padding: '3px 8px', borderRadius: '8px',
              }}>
                <Flag size={10} />{priCfg.label}
              </span>
            </div>

            {/* ... menu restrictions */}
            {canEdit && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(p => !p); }}
                style={{
                  width: '28px', height: '28px', border: 'none', borderRadius: '8px',
                  background: menuOpen ? 'var(--primary-pastel)' : (isHovered ? 'var(--bg-main)' : 'transparent'),
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: menuOpen ? 'var(--primary-accent)' : 'var(--text-secondary)',
                  opacity: isHovered || menuOpen ? 1 : 0,
                  transition: 'opacity 0.2s ease, background 0.2s ease',
                }}
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', top: '32px', right: 0,
                    background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
                    padding: '6px', zIndex: 999, minWidth: '170px',
                    animation: 'popIn 0.2s cubic-bezier(0.16,1,0.3,1)',
                  }}
                >
                  {task.status !== 'in-progress' && (
                    <div className="context-menu-item" onClick={() => { onStatusChange(task.id, 'in-progress'); setMenuOpen(false); }}>
                      <Clock size={14} /> Mark In Progress
                    </div>
                  )}
                  {task.status !== 'done' && (
                    <div className="context-menu-item" onClick={() => { onStatusChange(task.id, 'done'); setMenuOpen(false); }}>
                      <CheckCircle2 size={14} /> Mark Done
                    </div>
                  )}
                  {task.status !== 'todo' && (
                    <div className="context-menu-item" onClick={() => { onStatusChange(task.id, 'todo'); setMenuOpen(false); }}>
                      <Tag size={14} /> Move to To Do
                    </div>
                  )}
                  <div className="context-menu-item" onClick={() => { onEdit(task); setMenuOpen(false); }}>
                    <Edit2 size={14} /> Edit Task
                  </div>
                  <div className="context-menu-item delete" onClick={() => { onDelete(task.id); setMenuOpen(false); }}>
                    <Trash2 size={14} /> Delete Task
                  </div>
                </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <div className="task-title" style={{
            fontSize: '15px', 
            color: task.status === 'done' ? 'var(--text-muted)' : 'var(--text-primary)',
            marginTop: '10px', marginBottom: '10px',
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            textAlign: task.status === 'in-progress' ? 'right' : 'left'
          }}>
            {task.title}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {overdue && task.status !== 'done' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>
                <AlertTriangle size={12} /> Overdue · {formatDate(task.dueDate, task.endDate)}
              </span>
            ) : dueToday && task.status !== 'done' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700', color: '#f59e0b' }}>
                <Clock size={12} /> Today{task.dueTime ? ` · ${(() => {
                  if (!task.duration) return task.dueTime;
                  const [h, m] = task.dueTime.split(':').map(Number);
                  const endNum = h + m / 60 + task.duration;
                  const h2 = Math.floor(endNum) % 24;
                  const m2 = Math.round((endNum - Math.floor(endNum)) * 60);
                  return `${task.dueTime} - ${h2.toString().padStart(2, '0')}:${m2.toString().padStart(2, '0')}`;
                })()}` : ''}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                <Calendar size={12} /> {formatDate(task.dueDate, task.endDate)}{task.dueTime ? ` · ${(() => {
                  if (!task.duration) return task.dueTime;
                  const [h, m] = task.dueTime.split(':').map(Number);
                  const endNum = h + m / 60 + task.duration;
                  const h2 = Math.floor(endNum) % 24;
                  const m2 = Math.round((endNum - Math.floor(endNum)) * 60);
                  return `${task.dueTime} - ${h2.toString().padStart(2, '0')}:${m2.toString().padStart(2, '0')}`;
                })()}` : ''}
              </span>
            )}

            {catCfg && (
              <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', color: catCfg.accent, background: `${catCfg.accent}18` }}>
                {catCfg.name}
              </span>
            )}
          </div>
          
          {/* Tracking info */}
          {task.status === 'in-progress' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
              {task.updatedBy && (
                 <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>
                   Edit by <strong>{task.updatedBy}</strong>
                 </div>
              )}
              <div style={{
                backgroundColor: '#2563eb', color: '#ffffff', fontSize: '10px', fontWeight: '800',
                padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap'
              }}>
                In progress
              </div>
            </div>
          ) : task.updatedBy && (
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border-light)', fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
              Edited by <strong style={{ color: 'var(--text-secondary)' }}>{task.updatedBy}</strong> at {task.updatedAt ? formatFns(new Date(task.updatedAt), 'HH:mm dd/MM') : ''}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

/* ── Type group in To Do column ── */
const TypeGroup = ({ label, icon: Icon, color, bg, tasks, onEdit, onDelete, onStatusChange, startIndex, canEdit }) => {
  const [open, setOpen] = useState(true);
  if (tasks.length === 0) return null;
  return (
    <div style={{ marginBottom: '8px' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px', width: '100%',
          background: bg, border: 'none', borderRadius: '10px', padding: '6px 12px',
          marginBottom: '8px', cursor: 'pointer', color, fontWeight: '800',
          fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px'
        }}
      >
        <Icon size={13} /> {label}
        <span style={{ marginLeft: 'auto', background: color, color: 'white', borderRadius: '8px', padding: '1px 7px', fontSize: '11px' }}>
          {tasks.length}
        </span>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
      {open && tasks.map((task, i) => (
        <TaskCard key={task.id} task={task} index={startIndex + i}
          onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} canEdit={canEdit} />
      ))}
    </div>
  );
};

/* ── Notification Bell ── */
const NotificationBell = ({ tasks }) => {
  const [open, setOpen] = useState(false);
  const tday = today();

  const alerts = tasks.filter(t => t.status !== 'done' && (isOverdue(t) || isDueToday(t)));

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const interval = setInterval(() => {
      tasks.forEach(t => {
        if (t.status === 'done' || t.type !== 'meeting' || !t.dueTime || t.dueDate !== tday) return;
        const [h, m] = t.dueTime.split(':').map(Number);
        const due = new Date(); due.setHours(h, m, 0, 0);
        const diff = (due - new Date()) / 60000;
        if (diff > 0 && diff <= 15) {
          new Notification(`📅 Meeting in ${Math.round(diff)} min`, { body: t.title });
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tasks, tday]);

  return (
    <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '40px', height: '40px', borderRadius: '12px',
          border: '1px solid var(--border-light)',
          background: open ? 'var(--primary-pastel)' : 'var(--bg-panel)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--primary-accent)' : 'var(--text-secondary)', position: 'relative',
        }}
      >
        <Bell size={18} />
        {alerts.length > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#ef4444', color: 'white', borderRadius: '10px',
            fontSize: '11px', fontWeight: '800', padding: '1px 5px',
            boxShadow: '0 0 0 2px var(--bg-main)',
          }}>{alerts.length}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: '48px', right: 0,
          background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
          borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          padding: '16px', zIndex: 1200, width: '320px',
          animation: 'popIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Notifications</h3>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          {alerts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '16px 0' }}>No alerts 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
              {alerts.map(t => {
                const over = isOverdue(t);
                const TIcon = TYPE_CONFIG[t.type]?.icon || Tag;
                return (
                  <div key={t.id} style={{
                    display: 'flex', gap: '10px', alignItems: 'flex-start',
                    padding: '10px 12px', borderRadius: '12px',
                    background: over ? '#fef2f2' : '#fffbeb',
                    border: `1px solid ${over ? '#fecaca' : '#fde68a'}`,
                  }}>
                    <span style={{ color: over ? '#ef4444' : '#f59e0b', marginTop: '2px' }}>
                      {over ? <AlertTriangle size={16} /> : <Clock size={16} />}
                    </span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2px' }}>{t.title}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: over ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TIcon size={11} /> {TYPE_CONFIG[t.type]?.label} · {over ? 'Overdue' : 'Due today'} · {formatDate(t.dueDate)}{t.dueTime ? ` ${t.dueTime}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ────────── Main TaskBoard ────────── */
const TaskBoard = () => {
  const { filteredItems: allItems, updateEvent, deleteEvent, changeStatus, openAddModal, openEditModal, isEditable } = useEvents();
  const { currentUser } = useAuth();
  const canEdit = isEditable;

  // Current Week Filter (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const startOfWk = new Date(now);
  startOfWk.setDate(now.getDate() + diffToMon);
  startOfWk.setHours(0,0,0,0);
  const endOfWk = new Date(startOfWk);
  endOfWk.setDate(startOfWk.getDate() + 6);
  endOfWk.setHours(23,59,59,999);

  const weekRangeStr = `${formatFns(startOfWk, 'dd MMM')} - ${formatFns(endOfWk, 'dd MMM')}`;

  const items = allItems.filter(item => {
    const d1 = new Date(item.dueDate + 'T00:00:00');
    const d2 = new Date((item.endDate || item.dueDate) + 'T23:59:59');
    return d1 <= endOfWk && startOfWk <= d2;
  });

  const onDragEnd = ({ destination, source, draggableId }) => {
    if (!destination) return;
    const STATUS_MAP = { 'col-todo': 'todo', 'col-inprogress': 'in-progress', 'col-done': 'done' };
    const newStatus = STATUS_MAP[destination.droppableId];
    if (newStatus) changeStatus(draggableId, newStatus);
  };

  const sortByDate = (a, b) => (a.dueDate || '').localeCompare(b.dueDate || '');

  const todoTasks      = items.filter(t => t.status === 'todo').sort(sortByDate);
  const inProgressTasks = items.filter(t => t.status === 'in-progress').sort(sortByDate);
  const doneTasks      = items.filter(t => t.status === 'done').sort(sortByDate);

  const todoMeetings  = todoTasks.filter(t => t.type === 'meeting');
  const todoTaskItems = todoTasks.filter(t => t.type === 'task');
  const todoReports   = todoTasks.filter(t => t.type === 'report');

  const colHeader = (title, count, accent) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid var(--border-light)' }}>
      <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{title}</span>
      <span style={{ fontSize: '12px', fontWeight: '800', padding: '2px 10px', borderRadius: '10px', background: accent + '20', color: accent }}>{count}</span>
    </div>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px', color: 'var(--text-primary)' }}>Planner Board</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} /> Weekly View: {weekRangeStr} · {items.filter(t => t.status !== 'done').length} active tasks
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <NotificationBell tasks={items} />
          {canEdit && (
            <button
              onClick={openAddModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, var(--primary-accent), var(--pink-accent))',
                color: 'white', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(168,85,247,0.3)',
              }}
            >
              <Plus size={17} strokeWidth={2.5} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', flex: 1, alignItems: 'flex-start' }}>

          {/* To Do */}
          <div className="soft-panel" style={{ borderRadius: '20px', padding: '20px' }}>
            {colHeader('To Do', todoTasks.length, '#7c3aed')}
            <Droppable droppableId="col-todo">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  style={{ minHeight: '200px', background: snapshot.isDraggingOver ? 'rgba(124,58,237,0.04)' : 'transparent', borderRadius: '12px', transition: 'background 0.2s' }}>
                  <TypeGroup label="Meeting" icon={Users}    color="#7c3aed" bg="#f3e8ff" tasks={todoMeetings}  startIndex={0}                                        onEdit={openEditModal} onDelete={deleteEvent} onStatusChange={changeStatus} canEdit={canEdit} />
                  <TypeGroup label="Task"    icon={Tag}      color="#0891b2" bg="#e0f2fe" tasks={todoTaskItems} startIndex={todoMeetings.length}                        onEdit={openEditModal} onDelete={deleteEvent} onStatusChange={changeStatus} canEdit={canEdit} />
                  <TypeGroup label="Report"  icon={FileText} color="#d97706" bg="#fef3c7" tasks={todoReports}   startIndex={todoMeetings.length + todoTaskItems.length} onEdit={openEditModal} onDelete={deleteEvent} onStatusChange={changeStatus} canEdit={canEdit} />
                  {todoTasks.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>No tasks 🎉</p>}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* In Progress */}
          <div className="soft-panel" style={{ borderRadius: '20px', padding: '20px' }}>
            {colHeader('In Progress', inProgressTasks.length, '#0891b2')}
            <Droppable droppableId="col-inprogress">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  style={{ minHeight: '200px', background: snapshot.isDraggingOver ? 'rgba(8,145,178,0.04)' : 'transparent', borderRadius: '12px', transition: 'background 0.2s' }}>
                  {inProgressTasks.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>Nothing in progress</p>}
                  {inProgressTasks.map((task, i) => (
                    <TaskCard key={task.id} task={task} index={i} onEdit={openEditModal} onDelete={deleteEvent} onStatusChange={changeStatus} canEdit={canEdit} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          {/* Done */}
          <div className="soft-panel" style={{ borderRadius: '20px', padding: '20px' }}>
            {colHeader('Done', doneTasks.length, '#16a34a')}
            <Droppable droppableId="col-done">
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps}
                  style={{ minHeight: '200px', background: snapshot.isDraggingOver ? 'rgba(22,163,74,0.04)' : 'transparent', borderRadius: '12px', transition: 'background 0.2s' }}>
                  {doneTasks.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '32px 0' }}>No completed tasks yet</p>}
                  {doneTasks.map((task, i) => (
                    <TaskCard key={task.id} task={task} index={i} onEdit={openEditModal} onDelete={deleteEvent} onStatusChange={changeStatus} canEdit={canEdit} />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

        </div>
      </DragDropContext>
    </div>
  );
};

export default TaskBoard;
