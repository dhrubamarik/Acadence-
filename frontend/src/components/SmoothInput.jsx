// src/components/SmoothInput.jsx
import { useEffect, useRef, useState } from 'react'

// Dot character used to measure password-masked text width (matches native
// browser rendering closely enough for caret positioning purposes).
const PASSWORD_CHAR =
  typeof navigator !== 'undefined' && navigator.userAgent.match(/firefox|fxios/i)
    ? '\u25CF'
    : '\u2022'

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
 * Drop-in replacement for <input>. Renders a thin teal caret that glides
 * smoothly (spring-ish ease) to the cursor position instead of the native
 * blinking caret, and — when showPasswordToggle is set — an eye button
 * that toggles between masked and plain text.
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
  const [focused, setFocused] = useState(false)
  const [caretX, setCaretX] = useState(0)
  const [caretShown, setCaretShown] = useState(false)

  const actualType = showPasswordToggle ? (visible ? 'text' : 'password') : type
  const isPassword = actualType === 'password'

  const inputRef = useRef(null)
  const measureRef = useRef(null)

  const syncMeasureFont = () => {
    const input = inputRef.current
    const measureSpan = measureRef.current
    if (!input || !measureSpan) return
    const styles = window.getComputedStyle(input)
    let fontSize = styles.fontSize
    if (isPassword && !/chrome|chromium|crios/i.test(navigator.userAgent)) {
      // dot glyphs render slightly larger than the font-size box in most
      // non-Chromium engines — nudge measurement to compensate
      fontSize = `${parseFloat(fontSize) + 6}px`
    }
    measureSpan.style.font = `${styles.fontStyle} ${styles.fontWeight} ${fontSize} ${styles.fontFamily}`
    measureSpan.style.letterSpacing = styles.letterSpacing
  }

  const measurePrefixWidth = (text) => {
    const input = inputRef.current
    const measureSpan = measureRef.current
    if (!input || !measureSpan) return null
    syncMeasureFont()
    measureSpan.textContent = text
    const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft) || 0
    return text.length > 0 ? measureSpan.offsetWidth + paddingLeft : paddingLeft
  }

  const updateCaret = (target) => {
    if (!target) return
    const s = target.selectionStart ?? 0
    const e = target.selectionEnd ?? 0
    const hasSelection = s !== e
    const caretIndex = target.selectionDirection === 'backward' ? s : e
    const textBeforeCaret = isPassword
      ? PASSWORD_CHAR.repeat(caretIndex)
      : target.value.slice(0, caretIndex)
    const absoluteWidth = measurePrefixWidth(textBeforeCaret)
    if (absoluteWidth === null) return
    const paddingRight = parseFloat(window.getComputedStyle(target).paddingRight) || 0
    const maxX = target.clientWidth - paddingRight
    setCaretX(Math.min(absoluteWidth, maxX))
    setCaretShown(!hasSelection)
  }

  useEffect(() => {
    const input = inputRef.current
    if (input && document.activeElement === input) updateCaret(input)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, actualType])

  useEffect(() => {
    const input = inputRef.current
    if (!input) return
    const onSelectionChange = () => {
      if (document.activeElement !== input) return
      requestAnimationFrame(() => {
        if (document.activeElement === input) updateCaret(input)
      })
    }
    document.addEventListener('selectionchange', onSelectionChange)
    return () => document.removeEventListener('selectionchange', onSelectionChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', ...wrapperStyle }}>
      <input
        {...props}
        ref={inputRef}
        type={actualType}
        value={value}
        onChange={(e) => {
          onChange?.(e)
          requestAnimationFrame(() => updateCaret(e.target))
        }}
        onFocus={(e) => {
          setFocused(true)
          updateCaret(e.target)
          onFocus?.(e)
        }}
        onBlur={(e) => {
          setFocused(false)
          onBlur?.(e)
        }}
        style={{
          ...style,
          caretColor: 'transparent',
          paddingRight: showPasswordToggle ? '42px' : style.paddingRight,
        }}
      />

      {/* hidden span used only to measure text width for caret placement */}
      <span
        ref={measureRef}
        aria-hidden
        style={{ position: 'absolute', top: 0, left: 0, visibility: 'hidden', whiteSpace: 'pre', pointerEvents: 'none' }}
      />

      {/* the animated caret itself */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          height: '55%',
          width: '2px',
          borderRadius: '2px',
          background: '#0d9488',
          pointerEvents: 'none',
          transform: `translate(${caretX}px, -50%)`,
          transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.15s ease',
          opacity: focused && caretShown ? 1 : 0,
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