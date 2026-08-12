// src/components/Sidebar.jsx
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const SIDEBAR_WIDTH = 260

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/tasks', label: 'Tasks', icon: '✅' },
  { path: '/calendar', label: 'Calendar', icon: '📅' },
  { path: '/analytics', label: 'Analytics', icon: '📈' },
  { path: '/department', label: 'Department', icon: '👥' },
  { path: '/files', label: 'Files', icon: '📁' },
  { path: '/alerts', label: 'Professor Alerts', icon: '🚨' },
  { path: '/chat', label: 'Aura AI Chat', icon: '🤖' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

const sidebarStyle = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-10px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .nav-item {
    transition: all 0.2s cubic-bezier(0.23, 1, 0.32, 1);
  }
  .nav-item:hover {
    background: rgba(13, 148, 136, 0.08);
    transform: translateX(3px);
  }
  .nav-item.active {
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(20, 184, 166, 0.1));
    border-left: 3px solid #0d9488;
  }

  .logout-btn {
    transition: all 0.2s;
  }
  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #dc2626;
  }

  /* Sidebar nav scrollbar */
  .sidebar-scroll-nav {
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: rgba(13, 148, 136, 0.3) transparent;
  }
  .sidebar-scroll-nav::-webkit-scrollbar {
    width: 5px;
  }
  .sidebar-scroll-nav::-webkit-scrollbar-track {
    background: transparent;
  }
  .sidebar-scroll-nav::-webkit-scrollbar-thumb {
    background: rgba(13, 148, 136, 0.3);
    border-radius: 10px;
  }
  .sidebar-scroll-nav::-webkit-scrollbar-thumb:hover {
    background: rgba(13, 148, 136, 0.5);
  }
`

function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)

  // Get user info from localStorage
  useState(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }, [])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <>
      <style>{sidebarStyle}</style>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: SIDEBAR_WIDTH,
          height: '100vh',       /* FIX: explicit height (with top/bottom:0 this was
                                     already effectively pinned, but pairing an explicit
                                     height with the flex column below guarantees the
                                     nav's overflow can engage instead of the whole
                                     aside growing with its content) */
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fdfc 100%)',
          borderRight: '1px solid rgba(13, 148, 136, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)',
          '@media (min-width: 768px)': {
            transform: 'translateX(0)',
          },
        }}
        className="sidebar"
      >
        {/* Logo Section - Fixed */}
        <div
          style={{
            padding: '24px 20px',
            borderBottom: '1px solid rgba(13, 148, 136, 0.1)',
            flexShrink: 0,
          }}
        >
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: '26px',
              fontWeight: 700,
              margin: 0,
              background: 'linear-gradient(135deg, #0d9488, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.5px',
            }}
          >
            Acadence
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '11px',
              color: '#7aada5',
              fontWeight: 500,
            }}
          >
            Learn · Align · Thrive
          </p>
        </div>

        {/* User Info - Fixed */}
        {user && (
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid rgba(13, 148, 136, 0.1)',
              background: 'linear-gradient(135deg, #f0fdfa, #e0faf6)',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: 'white',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)',
                }}
              >
                {user.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#0f2a27',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.full_name || 'Student'}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '11px',
                    color: '#7aada5',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.department_code || 'CSSE12'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - SCROLLABLE */}
        <nav
          className="sidebar-scroll-nav"
          style={{
            flex: 1,
            minHeight: 0,          /* FIX: this is the key line — without it, a flex
                                       child won't shrink below its content's natural
                                       height, so overflowY:'auto' never actually
                                       activates and the outer page scrolls instead */
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '16px 12px',
          }}
        >
          {navItems.map((item, idx) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  if (window.innerWidth < 768) onClose()
                }}
                className="nav-item"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  marginBottom: '6px',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(13, 148, 136, 0.15), rgba(20, 184, 166, 0.1))'
                    : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '3px solid #0d9488' : '3px solid transparent',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  animation: `slideIn 0.3s cubic-bezier(0.23, 1, 0.32, 1) ${idx * 0.05}s both`,
                }}
              >
                <span
                  style={{
                    fontSize: '17px',
                    filter: isActive ? 'saturate(1.2)' : 'none',
                  }}
                >
                  {item.icon}
                </span>
                <span
                  style={{
                    fontSize: '13.5px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#0d7a7a' : '#5e8b83',
                    flex: 1,
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Logout Button - Fixed at Bottom */}
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(13, 148, 136, 0.1)',
            background: '#ffffff',
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleLogout}
            className="logout-btn"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              color: '#dc2626',
              transition: 'all 0.2s',
            }}
          >
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar