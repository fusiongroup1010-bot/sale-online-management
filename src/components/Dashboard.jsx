import React from 'react';
import { Sparkles, Calendar, Clock, CheckCircle, ArrowRight, AlertTriangle, Users, FileText, Tag, Sun, Sunset, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEvents, CATEGORY_MAP } from '../context/EventContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const today = () => new Date().toISOString().split('T')[0];

const TYPE_CONFIG = {
  meeting: { label: 'Meeting', icon: Users,    color: '#7c3aed', bg: '#f3e8ff' },
  task:    { label: 'Task',    icon: Tag,      color: '#0891b2', bg: '#e0f2fe' },
  report:  { label: 'Report',  icon: FileText, color: '#d97706', bg: '#fef3c7' },
};

const formatDate = (d, end) => {
  if (!d) return '';
  const dt = new Date(d + 'T00:00:00');
  const startStr = format(dt, 'EEE, MMM d', { locale: enUS });
  if (!end || end === d) {
    const diff = Math.ceil((dt - new Date()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff < 0) return `${Math.abs(diff)}d overdue (${startStr})`;
    return startStr;
  }
  const dtEnd = new Date(end + 'T00:00:00');
  return `${startStr} - ${format(dtEnd, 'MMM d', { locale: enUS })}`;
};

const Dashboard = () => {
  const { filteredItems: items, openEditModal, activeLocation } = useEvents();
  const { currentUser } = useAuth();
  const tday = today();

  // Location-aware banner config
  const LOCATION_BANNER = {
    hanoi:   { bannerBg: 'linear-gradient(135deg, #f0f9ff 0%, #dbeafe 100%)', textColor: '#1e3a8a' },
    hcm:     { bannerBg: 'linear-gradient(135deg, #fff0f7 0%, #fce7f3 100%)', textColor: '#831843' },
    hungyen: { bannerBg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)', textColor: '#4c1d95' },
  };
  const locBanner = LOCATION_BANNER[activeLocation] || LOCATION_BANNER.hanoi;

  const getGreeting = () => {
    const hour = new Date().getHours();
    const { bannerBg, textColor } = locBanner;
    if (hour >= 6 && hour < 12)  return { text: 'Good morning',  icon: Sun,      bannerBg, iconColor: textColor, accent: '#f59e0b', animate: 'sun-rotate'   };
    if (hour >= 12 && hour < 18) return { text: 'Good afternoon', icon: Sunset,   bannerBg, iconColor: textColor, accent: '#f97316', animate: 'sunset-float' };
    if (hour >= 18 && hour < 23) return { text: 'Good evening',   icon: Moon,     bannerBg, iconColor: textColor, accent: '#fcd34d', animate: 'sunset-float' };
    return                              { text: 'Good night',     icon: Sparkles, bannerBg, iconColor: textColor, accent: '#fcd34d', animate: 'sunset-float' };
  };

  const greet = getGreeting();
  const GreetIcon = greet.icon;
  const userName = currentUser?.name || 'CEO';

  // Current Week Filter (Monday to Sunday)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0(Sun) - 6(Sat)
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const startOfWk = new Date(now);
  startOfWk.setDate(now.getDate() + diffToMon);
  startOfWk.setHours(0,0,0,0);
  
  const endOfWk = new Date(startOfWk);
  endOfWk.setDate(startOfWk.getDate() + 6);
  endOfWk.setHours(23,59,59,999);

  /* ── Stats ── */
  const dueToday   = items.filter(t => t.status !== 'done' && t.dueDate === tday);
  const completed  = items.filter(t => t.status === 'done');
  const inProgress = items.filter(t => t.status === 'in-progress');
  const overdue    = items.filter(t => {
    if (t.status === 'done') return false;
    const due = new Date(`${t.dueDate}${t.dueTime ? 'T' + t.dueTime : 'T23:59'}`);
    return due < new Date();
  });

  /* ── Today's items (all types) sorted by time ── */
  const todayItems = items
    .filter(t => t.status !== 'done' && t.dueDate === tday)
    .sort((a, b) => (a.dueTime || '23:59').localeCompare(b.dueTime || '23:59'));

  /* ── Upcoming deadlines (next 7 days, not today, not done) ── */
  const upcoming = items
    .filter(t => t.status !== 'done' && t.dueDate > tday)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  /* ── Color for each category ── */
  const getCatColor = (catId) => CATEGORY_MAP[catId]?.accent || '#888';

  const todayFormatted = format(new Date(), 'EEEE, MMMM d', { locale: enUS });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Greeting banner */}
      <div className="soft-panel animate-fade-in" style={{
        background: greet.bannerBg,
        padding: '32px', borderRadius: 'var(--radius-lg)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        border: 'none', boxShadow: '0 12px 30px rgba(0,0,0,0.05)'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: greet.iconColor, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {greet.text}, {userName}!
          </h1>
          {/* Brand Showcase - replaces Current Sheet label */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '30px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {/* SAY ALo */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>SAY</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#cc1515', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', lineHeight: 1 }}>
                AL<span style={{ fontStyle: 'italic' }}>O</span>
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#cc1515', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#cc1515', letterSpacing: '0.4px', fontStyle: 'italic', marginTop: '3px', opacity: 0.85 }}>Taste the difference</span>
            </div>

            {/* HOW Today's */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>HOW</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#d4880a', fontFamily: 'Georgia, serif', letterSpacing: '-0.5px', lineHeight: 1 }}>
                Today<span style={{ color: '#d4880a' }}>'</span>s
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#d4880a', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#d4880a', letterSpacing: '0.4px', fontStyle: 'italic', marginTop: '3px', opacity: 0.85 }}>Designed for Pets</span>
            </div>

            {/* FEEL FINE */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>FEEL</span>
              <span style={{ fontSize: '20px', fontWeight: '900', color: '#2e7d32', fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '1px', lineHeight: 1 }}>
                FINE
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#2e7d32', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
              <span style={{ fontSize: '8px', fontWeight: '700', color: '#2e7d32', letterSpacing: '0.4px', fontStyle: 'italic', marginTop: '3px', opacity: 0.85 }}>From Nature</span>
            </div>

            {/* AND Merci — PURE TASTE over 'erci' */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1, position: 'relative', paddingLeft: '24px', paddingTop: '4px' }}>
              <span style={{ position: 'absolute', top: '-4px', left: 0, fontSize: '9px', fontWeight: '700', color: greet.iconColor, letterSpacing: '1.5px', textTransform: 'uppercase', opacity: 0.55 }}>AND</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#e07b18', fontFamily: 'Georgia, serif', letterSpacing: '0.5px', lineHeight: 1, marginTop: '5px' }}>
                M
                <span style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', bottom: '100%', left: 0, fontSize: '6px', fontWeight: '700', color: '#e07b18', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap', marginBottom: '2px', opacity: 0.85 }}>PURE TASTE</span>
                  erci
                </span>
                <span style={{ fontSize: '8px', fontWeight: '700', color: '#e07b18', verticalAlign: 'super', marginLeft: '1px' }}>®</span>
              </span>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '600', marginTop: '0', display: 'flex', alignItems: 'center' }}>
            <span>Week: {format(startOfWk, 'dd/MM')} - {format(endOfWk, 'dd/MM')}</span>
            <span style={{ margin: '0 12px' }}>·</span>
            <span>{dueToday.length > 0 ? `${dueToday.length} item${dueToday.length>1?'s':''} due today` : 'No tasks due today'}</span>
            {overdue.length > 0 && (
              <>
                <span style={{ margin: '0 32px' }}>·</span>
                <span>{overdue.length} overdue</span>
              </>
            )}
          </p>
        </div>
        <div style={{ width: '120px', height: '120px', background: 'rgba(255,255,255,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', backdropFilter: 'blur(4px)' }}>
          <div className={greet.animate}>
            <GreetIcon size={64} color={greet.accent} strokeWidth={1.5} style={{ filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.1))' }} />
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '20px' }}>
        {[
          { label: 'Due Today',   value: dueToday.length,   sub: 'tasks/meetings', icon: Clock,        accentColor: '#ec4899', bgColor: 'var(--pink-pastel)' },
          { label: 'In Progress', value: inProgress.length, sub: 'ongoing',         icon: ArrowRight,   accentColor: '#0891b2', bgColor: '#e0f2fe' },
          { label: 'Completed',   value: completed.length,  sub: 'total done',      icon: CheckCircle,  accentColor: '#16a34a', bgColor: '#dcfce7' },
          { label: 'Overdue',     value: overdue.length,    sub: 'need attention',  icon: AlertTriangle,accentColor: '#ef4444', bgColor: '#fee2e2' },
        ].map(({ label, value, sub, icon: Icon, accentColor, bgColor }) => (
          <Link 
            key={label} 
            to="/tasks" 
            className="soft-panel kpi-card" 
            style={{ 
              padding: '20px', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              textDecoration: 'none', 
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
          >
            <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accentColor }}>
              <Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</p>
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {value} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>{sub}</span>
              </h2>
            </div>
          </Link>
        ))}
      </div>

      {/* Today's tasks + Upcoming timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px' }}>
        
        {/* Today's items */}
        <div className="soft-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Today's Schedule</h3>
            <Link to="/tasks" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: 'auto', padding: '6px 12px', color: 'var(--primary-accent)', fontSize: '13px' }}>
                View Board <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          {todayItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
              🎉 Nothing due today! Enjoy your day.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayItems.map(item => {
                const typeCfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.task;
                const catColor = getCatColor(item.categoryId);
                const TypeIcon = typeCfg.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => openEditModal(item)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: 'var(--bg-panel-hover)', borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-main)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-panel-hover)'}
                  >
                    <div style={{ width: '10px', height: '44px', background: catColor, borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '800', color: typeCfg.color, background: typeCfg.bg, borderRadius: '6px', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <TypeIcon size={10} /> {typeCfg.label}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)' }}>{CATEGORY_MAP[item.categoryId]?.name}</span>
                      </div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>{item.title}</h4>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', background: 'var(--bg-panel)', padding: '6px 12px', borderRadius: 'var(--radius-full)', boxShadow: 'var(--shadow-soft)', flexShrink: 0 }}>
                      {(() => {
                        if (!item.dueTime) return 'All day';
                        if (!item.duration) return item.dueTime;
                        const [h, m] = item.dueTime.split(':').map(Number);
                        const endNum = (h + m / 60) + item.duration;
                        const h2 = Math.floor(endNum) % 24;
                        const m2 = Math.round((endNum - Math.floor(endNum)) * 60);
                        return `${item.dueTime} - ${h2.toString().padStart(2, '0')}:${m2.toString().padStart(2, '0')}`;
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming timeline */}
        <div className="soft-panel" style={{ padding: '28px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>Upcoming</h3>
            <Link to="/calendar" style={{ textDecoration: 'none' }}>
              <button className="btn-ghost" style={{ width: 'auto', padding: '6px 12px', color: 'var(--blue-accent)', fontSize: '13px' }}>
                Calendar <ArrowRight size={14} />
              </button>
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>Nothing upcoming 🎉</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '16px', width: '2px', background: 'var(--border-light)', zIndex: 0 }} />
              {upcoming.map(item => {
                const catColor = getCatColor(item.categoryId);
                const isOv = item.dueDate < tday;
                return (
                  <div key={item.id} onClick={() => openEditModal(item)} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1, cursor: 'pointer' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: isOv ? '#fee2e2' : `${catColor}20`, border: '2px solid #ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)', flexShrink: 0 }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOv ? '#ef4444' : catColor }} />
                    </div>
                    <div style={{ paddingTop: '6px' }}>
                      <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '3px', whiteSpace: 'normal', wordBreak: 'break-word', lineHeight: '1.4' }}>{item.title}</h4>
                      <p style={{ fontSize: '11px', fontWeight: '600', color: isOv ? '#ef4444' : 'var(--text-secondary)' }}>
                        {formatDate(item.dueDate, item.endDate)}{item.dueTime ? ` · ${item.dueTime}` : ''} · {CATEGORY_MAP[item.categoryId]?.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: 'var(--text-muted)', opacity: 0.5 }}>
        v1.1 (Updated: Wrapping Fix)
      </div>
    </div>
  );
};

export default Dashboard;
