/**
 * ═══════════════════════════════════════════════════════════════
 * MotionWrapper.jsx — Reusable Animated Components
 * Holyroom Motion System
 *
 * Provides ready-to-use wrappers for every animation pattern.
 * All use AnimatePresence internally where exit animations needed.
 *
 * Usage:
 *   import { PageTransition, ModalMotion, MessageMotion, ... } from './MotionWrapper';
 * ═══════════════════════════════════════════════════════════════
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  pageVariants,
  sidebarVariants,
  modalVariants,
  backdropVariants,
  messageVariants,
  staggerContainerVariants,
  staggerItemVariants,
  userJoinVariants,
  notificationVariants,
  shareBarVariants,
  fullscreenVariants,
  fadeUpVariants,
  scaleInVariants,
  spring,
  duration,
  ease,
} from './motion';

// ─────────────────────────────────────────────────────────────────
// PageTransition
// Wraps full page views (LoginPage ↔ MainLayout).
// Use with AnimatePresence in App.js — key prop required.
//
// <AnimatePresence mode="wait">
//   <PageTransition key={joined ? 'main' : 'login'}>
//     {joined ? <MainLayout /> : <LoginPage />}
//   </PageTransition>
// </AnimatePresence>
// ─────────────────────────────────────────────────────────────────
export function PageTransition({ children, className = '' }) {
  return (
    <motion.div
      className={`relative z-10 ${className}`}
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SidebarMotion
// Animates sidebar entrance. Children stagger automatically.
//
// <SidebarMotion>
//   <UserList />
//   <ShareControls />
// </SidebarMotion>
// ─────────────────────────────────────────────────────────────────
export function SidebarMotion({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ModalMotion
// Wraps SettingsPanel and any overlay panel.
// Includes a blurred backdrop.
//
// <ModalMotion isOpen={settingsOpen} onClose={() => setSettingsOpen(false)}>
//   <SettingsPanel />
// </ModalMotion>
// ─────────────────────────────────────────────────────────────────
export function ModalMotion({ isOpen, onClose, children, className = '' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-30"
            style={{ background: 'rgba(0,0,5,0.55)', backdropFilter: 'blur(4px)' }}
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          {/* Centering shell — static div, Framer Motion هیچ‌وقت position رو لمس نمی‌کنه */}
          <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
            <motion.div
              className={`pointer-events-auto ${className}`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// MessageMotion
// Single animated chat message. Used inside ChatArea map().
//
// {messages.map((msg) => (
//   <MessageMotion key={msg.id}>
//     <ChatBubble msg={msg} />
//   </MessageMotion>
// ))}
// ─────────────────────────────────────────────────────────────────
export function MessageMotion({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      layout
      layoutId={undefined}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// StaggerList + StaggerItem
// Animates a list of items with cascading entrance.
//
// <StaggerList>
//   {users.map(u => (
//     <StaggerItem key={u.id}>
//       <UserCard user={u} />
//     </StaggerItem>
//   ))}
// </StaggerList>
// ─────────────────────────────────────────────────────────────────
export function StaggerList({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div className={className} variants={staggerItemVariants}>
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// NotificationMotion
// Wraps NotificationBar. Slides in from top, auto-exits.
//
// <NotificationMotion message={notification}>
//   <NotificationBar ... />
// </NotificationMotion>
// ─────────────────────────────────────────────────────────────────
export function NotificationMotion({ message, children }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-40"
          variants={notificationVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key={message} // re-animates on new message
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// UserJoinMotion
// Animates a user appearing in the user list.
//
// <AnimatePresence>
//   {users.map(u => (
//     <UserJoinMotion key={u.id}>
//       <UserRow user={u} />
//     </UserJoinMotion>
//   ))}
// </AnimatePresence>
// ─────────────────────────────────────────────────────────────────
export function UserJoinMotion({ children, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={userJoinVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ShareBarMotion
// Animates the ScreenShareBar appearing / disappearing.
//
// <ShareBarMotion isVisible={activeSharers.length > 0}>
//   <ScreenShareBar ... />
// </ShareBarMotion>
// ─────────────────────────────────────────────────────────────────
export function ShareBarMotion({ isVisible, children }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={shareBarVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// FullscreenMotion
// Wraps the fullscreen video overlay.
//
// <FullscreenMotion isOpen={!!fullscreenVideo} onClose={() => setFullscreenVideo(null)}>
//   <video ... />
// </FullscreenMotion>
// ─────────────────────────────────────────────────────────────────
export function FullscreenMotion({ isOpen, onClose, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          variants={fullscreenVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// MotionButton
// Drop-in replacement for <button> with press + hover physics.
//
// <MotionButton className="btn-primary px-6 py-3" onClick={handleJoin}>
//   Join Room
// </MotionButton>
// ─────────────────────────────────────────────────────────────────
export function MotionButton({ children, className = '', onClick, disabled, type = 'button' }) {
  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.025, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97, y: 0 }}
      transition={spring.snap}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────
// MotionIconButton
// For small icon buttons — Mute, Settings, Leave, etc.
//
// <MotionIconButton className="glass-icon-btn p-2" onClick={toggleMute}>
//   <MicIcon />
// </MotionIconButton>
// ─────────────────────────────────────────────────────────────────
export function MotionIconButton({ children, className = '', onClick, title }) {
  return (
    <motion.button
      className={className}
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.08, y: -1 }}
      whileTap={{ scale: 0.92 }}
      transition={spring.micro}
    >
      {children}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────
// FadeUp
// Generic utility — fades + rises on mount.
// Accepts optional delay for manual staggering.
//
// <FadeUp delay={0.2}>
//   <SomeContent />
// </FadeUp>
// ─────────────────────────────────────────────────────────────────
export function FadeUp({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      variants={fadeUpVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ScaleIn
// Generic utility — scales + fades on mount.
//
// <ScaleIn>
//   <Card />
// </ScaleIn>
// ─────────────────────────────────────────────────────────────────
export function ScaleIn({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      className={className}
      variants={scaleInVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MotionCard
// GlassPanel card with hover lift physics.
//
// <MotionCard className="glass-panel glass-panel--card p-4">
//   content
// </MotionCard>
// ─────────────────────────────────────────────────────────────────
export function MotionCard({ children, className = '', onClick }) {
  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileHover={{ y: -3, scale: 1.008 }}
      whileTap={{ y: 0, scale: 0.997 }}
      transition={spring.micro}
    >
      {children}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Exports summary for quick reference:
//
// Layout:      PageTransition, SidebarMotion
// Overlays:    ModalMotion, FullscreenMotion
// Lists:       StaggerList, StaggerItem, UserJoinMotion
// Chat:        MessageMotion
// Feedback:    NotificationMotion, ShareBarMotion
// Interactive: MotionButton, MotionIconButton, MotionCard
// Utilities:   FadeUp, ScaleIn
// ─────────────────────────────────────────────────────────────────