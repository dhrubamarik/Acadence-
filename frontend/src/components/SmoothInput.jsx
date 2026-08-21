// src/components/SmoothInput.jsx
import { useState } from 'react'

const EyeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const EyeOffIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-4.13 5.13M14.12 14.12a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1 1l22 22" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

/**
 * Drop-in replacement for <input> with an optional password visibility
 * toggle.
 *
 * Accepts the same props as a normal <input> (value, onChange, onFocus,
 * onBlur, name, placeholder, required, style, ...) so it can swap in for
 * existing <input> elements without changing surrounding logic.
 */
function SmoothInput({
  type = 'text',
  showPasswordToggle = false,
  value,
  onChange,
  onFocus,
  onBlur,
  style = {},
  wrapperStyle = {},
  ...props
}) {
  const [visible, setVisible] = useState(false)

  const actualType = showPasswordToggle ? (visible ? 'text' : 'password') : type

  return (
    <div style={{ position: 'relative', width: '100%', ...wrapperStyle }}>
      <input
        {...props}
        type={actualType}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        style={{
          ...style,
          caretColor: '#0d9488',
          paddingRight: showPasswordToggle ? '42px' : style.paddingRight,
        }}
      />

      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            color: '#7aada5',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#0d9488')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#7aada5')}
        >
          {visible ? EyeOffIcon : EyeIcon}
        </button>
      )}
    </div>
  )
}

export default SmoothInput