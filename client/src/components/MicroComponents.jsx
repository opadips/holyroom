/**
 * ═══════════════════════════════════════════════════════════════
 * MicroComponents.jsx — Micro Interaction UI Components
 * Holyroom
 *
 * همه کامپوننت‌های آماده برای micro interactions.
 * از motion.js برای timing و useMicroInteractions.js برای logic
 * استفاده می‌کنند.
 *
 * مسیر: client/src/components/MicroComponents.jsx
 *
 * Exports:
 *   TypingIndicator      — سه نقطه متحرک
 *   SendButton           — دکمه ارسال با ripple + delivery states
 *   VoiceBar             — نوار فعالیت صوتی
 *   UserJoinBadge        — badge ورود کاربر
 *   StreamToggleButton   — دکمه share با state machine
 *   MuteButton           — دکمه mute با pulse
 *   LoadingSkeleton      — skeleton placeholder
 *   AnimatedBorder       — کادر با border متحرک
 *   MessageStatus        — وضعیت ارسال پیام
 *   PulseAvatar          — آواتار با pulse فعالیت
 * ═══════════════════════════════════════════════════════════════
 */

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spring, duration, ease } from './motion';
import {
  useRipple,
  useVoiceActivity,
  useMagneticHover,
  useMessageDelivery,
  useStreamActivation,
} from '../hooks/useMicroInteractions';
import './MicroComponents.css';

// ─────────────────────────────────────────────────────────────
// TypingIndicator
// سه نقطه با فاز متفاوت — نشان‌دهنده در حال تایپ بودن
//
// <TypingIndicator isVisible={someoneIsTyping} username="Alex" />
// ─────────────────────────────────────────────────────────────
export function TypingIndicator({ isVisible, username = '' }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="typing-indicator"
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ ...spring.soft, opacity: { duration: duration.fast } }}
        >
          {username && (
            <span className="typing-indicator__name">{username}</span>
          )}
          <div className="typing-indicator__bubble">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="typing-indicator__dot"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// SendButton
// دکمه ارسال با:
// - magnetic hover
// - ripple روی click
// - حالت‌های sending / sent / delivered
//
// <SendButton onSend={handleSend} disabled={!input.trim()} />
// ─────────────────────────────────────────────────────────────
export function SendButton({ onSend, disabled = false }) {
  const { ref: magnetRef } = useMagneticHover({ strength: 0.2, radius: 60 });
  const { ref: rippleRef, ripples, triggerRipple } = useRipple({
    color: 'rgba(168, 85, 247, 0.22)',
  });
  const { status, send } = useMessageDelivery();

  // Merge refs
  const setRef = (el) => {
    magnetRef.current = el;
    rippleRef.current = el;
  };

  const handleClick = (e) => {
    if (disabled || status === 'sending') return;
    triggerRipple(e);
    send(onSend);
  };

  const icons = {
    idle:       <SendIcon />,
    sending:    <SendingIcon />,
    sent:       <SentIcon />,
    delivered:  <DeliveredIcon />,
  };

  return (
    <motion.button
      ref={setRef}
      className={`send-btn ${status !== 'idle' ? `send-btn--${status}` : ''}`}
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.06 }}
      whileTap={disabled  ? {} : { scale: 0.93 }}
      transition={spring.snap}
      aria-label="Send message"
    >
      {/* Ripple layer */}
      <span className="send-btn__ripple-container" aria-hidden="true">
        {ripples}
      </span>

      {/* Icon — transitions between states */}
      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          className="send-btn__icon"
          initial={{ opacity: 0, scale: 0.6, rotate: -15 }}
          animate={{ opacity: 1, scale: 1,   rotate: 0   }}
          exit={{    opacity: 0, scale: 0.6, rotate:  15 }}
          transition={{ ...spring.snap, duration: duration.fast }}
        >
          {icons[status]}
        </motion.span>
      </AnimatePresence>

      {/* Glow ring — active when sending */}
      {status === 'sending' && (
        <motion.span
          className="send-btn__glow"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1.4 }}
          exit={{    opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.6, ease: ease.out, repeat: Infinity, repeatType: 'reverse' }}
          aria-hidden="true"
        />
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// VoiceBar
// نوار‌های فعالیت صوتی — اگه stream نباشه idle نشون میده
//
// <VoiceBar stream={localAudioStream} isMuted={isMuted} />
// ─────────────────────────────────────────────────────────────
export function VoiceBar({ stream, isMuted, barCount = 4 }) {
  const { barHeights, isActive } = useVoiceActivity(
    isMuted ? null : stream,
    { barCount }
  );

  return (
    <div
      className={`voice-bar ${isMuted ? 'voice-bar--muted' : ''} ${isActive ? 'voice-bar--active' : ''}`}
      aria-label={isMuted ? 'Muted' : isActive ? 'Speaking' : 'Silent'}
    >
      {barHeights.map((h, i) => (
        <motion.span
          key={i}
          className="voice-bar__bar"
          animate={{ scaleY: isMuted ? 0.15 : h }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 20,
            mass: 0.3,
          }}
          style={{ transformOrigin: 'center' }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MuteButton
// دکمه mute با pulse وقتی active و انیمیشن mute شدن
//
// <MuteButton isMuted={isMuted} onToggle={toggleMute} />
// ─────────────────────────────────────────────────────────────
export function MuteButton({ isMuted, onToggle }) {
  const { ref: magnetRef } = useMagneticHover({ strength: 0.18, radius: 50 });
  const { ref: rippleRef, ripples, triggerRipple } = useRipple({
    color: isMuted
      ? 'rgba(239, 68, 68, 0.18)'
      : 'rgba(168, 85, 247, 0.18)',
  });

  const setRef = (el) => {
    magnetRef.current = el;
    rippleRef.current = el;
  };

  return (
    <motion.button
      ref={setRef}
      className={`mute-btn ${isMuted ? 'mute-btn--muted' : 'mute-btn--active'}`}
      onClick={(e) => { triggerRipple(e); onToggle?.(); }}
      whileHover={{ scale: 1.08 }}
      whileTap={{   scale: 0.91 }}
      transition={spring.snap}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
    >
      <span className="mute-btn__ripple-container" aria-hidden="true">
        {ripples}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={isMuted ? 'muted' : 'unmuted'}
          className="mute-btn__icon"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1   }}
          exit={{    opacity: 0, scale: 0.7 }}
          transition={spring.snap}
        >
          {isMuted ? <MicOffIcon /> : <MicOnIcon />}
        </motion.span>
      </AnimatePresence>

      {/* pulse ring وقتی فعاله */}
      {!isMuted && <span className="mute-btn__pulse" aria-hidden="true" />}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// StreamToggleButton
// دکمه share با state machine:
// idle → activating → active → deactivating → idle
//
// <StreamToggleButton
//   isSharing={isSharing}
//   onStart={startSharingWithQuality}
//   onStop={stopSharing}
// />
// ─────────────────────────────────────────────────────────────
export function StreamToggleButton({ isSharing, onStart, onStop }) {
  const { streamState, activate, deactivate } = useStreamActivation();
  const { ref: rippleRef, ripples, triggerRipple } = useRipple({
    color: isSharing
      ? 'rgba(239, 68, 68, 0.18)'
      : 'rgba(34, 211, 238, 0.15)',
  });

  const handleClick = (e) => {
    triggerRipple(e);
    if (isSharing) {
      deactivate(onStop);
    } else {
      activate(onStart);
    }
  };

  const label = {
    idle:         isSharing ? 'Stop Sharing' : 'Share Screen',
    activating:   'Starting…',
    active:       'Stop Sharing',
    deactivating: 'Stopping…',
  }[streamState] ?? (isSharing ? 'Stop Sharing' : 'Share Screen');

  return (
    <motion.button
      ref={rippleRef}
      className={`stream-btn ${isSharing ? 'stream-btn--active' : 'stream-btn--idle'} ${
        streamState === 'activating' || streamState === 'deactivating' ? 'stream-btn--transitioning' : ''
      }`}
      onClick={handleClick}
      whileHover={{ scale: 1.03 }}
      whileTap={{   scale: 0.96 }}
      transition={spring.snap}
      aria-label={label}
    >
      <span className="stream-btn__ripple-container" aria-hidden="true">
        {ripples}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={streamState + String(isSharing)}
          className="stream-btn__content"
          initial={{ opacity: 0, y: 4  }}
          animate={{ opacity: 1, y: 0  }}
          exit={{    opacity: 0, y: -4 }}
          transition={{ duration: duration.fast, ease: ease.out }}
        >
          {(streamState === 'activating' || streamState === 'deactivating')
            ? <SpinnerIcon />
            : isSharing
              ? <StopIcon />
              : <ShareIcon />
          }
          <span className="stream-btn__label">{label}</span>
        </motion.span>
      </AnimatePresence>

      {/* border sweep وقتی active */}
      {isSharing && <span className="stream-btn__border-sweep" aria-hidden="true" />}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// UserJoinBadge
// badge ورود کاربر با entrance کوچک و exit آهسته
//
// <UserJoinBadge username="Alex" avatarColor="#7c3aed" />
// ─────────────────────────────────────────────────────────────
export function UserJoinBadge({ username, avatarColor = '#7c3aed' }) {
  return (
    <motion.div
      className="user-join-badge"
      initial={{ opacity: 0, scale: 0.88, y: -10, filter: 'blur(6px)' }}
      animate={{ opacity: 1, scale: 1,    y: 0,   filter: 'blur(0px)' }}
      exit={{    opacity: 0, scale: 0.94, y:  8,  filter: 'blur(4px)' }}
      transition={spring.modal}
      layout
    >
      <span
        className="user-join-badge__avatar"
        style={{ background: avatarColor }}
      >
        {username?.[0]?.toUpperCase()}
      </span>
      <span className="user-join-badge__text">
        <strong>{username}</strong> joined
      </span>
      <span className="user-join-badge__dot" aria-hidden="true" />
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MessageStatus
// نشانگر وضعیت ارسال پیام — idle / sending / sent / delivered
//
// <MessageStatus status={status} />
// ─────────────────────────────────────────────────────────────
export function MessageStatus({ status = 'idle' }) {
  const icons = {
    sending:   <ClockIcon   className="msg-status__icon msg-status__icon--sending" />,
    sent:      <CheckIcon   className="msg-status__icon msg-status__icon--sent" />,
    delivered: <DoubleCheckIcon className="msg-status__icon msg-status__icon--delivered" />,
  };

  if (status === 'idle' || !icons[status]) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={status}
        className="msg-status"
        initial={{ opacity: 0, scale: 0.7, x: -4 }}
        animate={{ opacity: 1, scale: 1,   x:  0 }}
        exit={{    opacity: 0, scale: 0.7, x:  4 }}
        transition={spring.snap}
      >
        {icons[status]}
      </motion.span>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────
// PulseAvatar
// آواتار با pulse ring برای کاربر در حال صحبت
//
// <PulseAvatar username="Alex" color="#7c3aed" isSpeaking={true} />
// ─────────────────────────────────────────────────────────────
export function PulseAvatar({ username, color = '#7c3aed', isSpeaking = false, size = 36 }) {
  return (
    <div className="pulse-avatar" style={{ width: size, height: size }}>
      {/* pulse rings — فقط وقتی صحبت می‌کنه */}
      <AnimatePresence>
        {isSpeaking && (
          <>
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="pulse-avatar__ring"
                style={{ borderColor: color }}
                initial={{ opacity: 0.6, scale: 1   }}
                animate={{ opacity: 0,   scale: 1.7 }}
                exit={{    opacity: 0              }}
                transition={{
                  duration: 1.4,
                  ease: ease.out,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatDelay: 0.2,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* آواتار اصلی */}
      <motion.div
        className="pulse-avatar__face"
        style={{ background: color, width: size, height: size }}
        animate={isSpeaking
          ? { boxShadow: `0 0 0 2px ${color}55, 0 0 16px ${color}33` }
          : { boxShadow: '0 0 0 0px transparent' }
        }
        transition={{ duration: duration.normal }}
      >
        {username?.[0]?.toUpperCase()}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LoadingSkeleton
// skeleton placeholder با shimmer animation
//
// <LoadingSkeleton width="100%" height={20} rounded />
// <LoadingSkeleton width={120} height={12} rounded className="mt-2" />
// ─────────────────────────────────────────────────────────────
export function LoadingSkeleton({ width = '100%', height = 16, rounded = false, className = '' }) {
  return (
    <div
      className={`loading-skeleton ${rounded ? 'loading-skeleton--rounded' : ''} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// ─────────────────────────────────────────────────────────────
// AnimatedBorder
// کادری با border انیمیشن sweep — برای highlight کردن پنل‌ها
//
// <AnimatedBorder isActive={isFocused} color="purple">
//   <InputBar />
// </AnimatedBorder>
// ─────────────────────────────────────────────────────────────
export function AnimatedBorder({ children, isActive = false, color = 'purple', className = '' }) {
  return (
    <div className={`animated-border animated-border--${color} ${isActive ? 'animated-border--active' : ''} ${className}`}>
      {isActive && (
        <span className="animated-border__sweep" aria-hidden="true" />
      )}
      {children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SVG ICONS — inline, no external dependency
// ══════════════════════════════════════════════════════════════

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function SendingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeDasharray="28 56" strokeDashoffset="0">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function SentIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DeliveredIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 6 9 17 4 12" />
      <polyline points="23 6 14 17" />
    </svg>
  );
}

function MicOnIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8"  y1="23" x2="16" y2="23" />
    </svg>
  );
}

function MicOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8"  y1="23" x2="16" y2="23" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <polyline points="8 21 12 17 16 21" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" strokeDasharray="28 56">
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.7s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function ClockIcon({ className }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DoubleCheckIcon({ className }) {
  return (
    <svg className={className} width="14" height="12" viewBox="0 0 28 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 6 9 17 4 12" />
      <polyline points="24 6 15 17" />
    </svg>
  );
}