/**
 * ═══════════════════════════════════════════════════════════════
 * motion.js — Holyroom Motion System
 * Single source of truth for ALL animation values in the project.
 *
 * Import what you need:
 *   import { spring, duration, ease, variants, transitions } from './motion';
 * ═══════════════════════════════════════════════════════════════
 */

// ─────────────────────────────────────────────────────────────────
// SPRING CONFIGS
// Physics-based. No duration — motion ends naturally.
// Use for: interactive elements, modals, sidebars, cards.
// ─────────────────────────────────────────────────────────────────
export const spring = {
  // Gentle, cinematic — page-level transitions
  cinematic: {
    type: 'spring',
    stiffness: 60,
    damping: 20,
    mass: 1.2,
  },

  // Smooth, confident — panels sliding in/out
  panel: {
    type: 'spring',
    stiffness: 120,
    damping: 24,
    mass: 0.9,
  },

  // Snappy but premium — modals, cards popping in
  modal: {
    type: 'spring',
    stiffness: 200,
    damping: 28,
    mass: 0.8,
  },

  // Quick, responsive — button presses, toggles
  snap: {
    type: 'spring',
    stiffness: 380,
    damping: 30,
    mass: 0.6,
  },

  // Ultra-light — hover lifts, micro interactions
  micro: {
    type: 'spring',
    stiffness: 500,
    damping: 35,
    mass: 0.4,
  },

  // Soft settle — notifications, toasts
  soft: {
    type: 'spring',
    stiffness: 90,
    damping: 22,
    mass: 1.0,
  },
};

// ─────────────────────────────────────────────────────────────────
// DURATION TOKENS (seconds)
// Use for: opacity fades, color transitions, blur shifts.
// ─────────────────────────────────────────────────────────────────
export const duration = {
  instant:  0.08,
  fast:     0.18,
  normal:   0.32,
  smooth:   0.48,
  cinematic:0.70,
  slow:     1.00,
};

// ─────────────────────────────────────────────────────────────────
// EASING CURVES
// Cubic bezier arrays for tween animations.
// ─────────────────────────────────────────────────────────────────
export const ease = {
  // Standard deceleration — elements entering
  out:        [0.16, 1, 0.3, 1],
  // Standard acceleration — elements leaving
  in:         [0.7, 0, 0.84, 0],
  // Symmetric, cinematic
  inOut:      [0.45, 0, 0.55, 1],
  // Soft, organic
  soft:       [0.25, 0.46, 0.45, 0.94],
  // Depth feel — slight overshoot without bounce
  depth:      [0.34, 1.10, 0.64, 1],
  // Linear — for continuous loops only
  linear:     [0, 0, 1, 1],
};

// ─────────────────────────────────────────────────────────────────
// STAGGER DELAYS (seconds)
// Use with variants that have children.
// ─────────────────────────────────────────────────────────────────
export const stagger = {
  tight:  0.04,
  normal: 0.07,
  loose:  0.12,
  slow:   0.18,
};

// ─────────────────────────────────────────────────────────────────
// REUSABLE TRANSITION OBJECTS
// Pre-built transition configs for common patterns.
// ─────────────────────────────────────────────────────────────────
export const transitions = {
  // Page-level fade + rise
  page: {
    duration: duration.cinematic,
    ease: ease.out,
  },

  // Fade only — overlays, backgrounds
  fade: {
    duration: duration.smooth,
    ease: ease.inOut,
  },

  // Fast fade — tooltips, badges
  fadeFast: {
    duration: duration.fast,
    ease: ease.out,
  },

  // Panel slide — uses spring
  panel: spring.panel,

  // Modal — uses spring
  modal: spring.modal,

  // Button press — instant feel
  button: spring.snap,

  // Hover lift — very fast spring
  hover: spring.micro,

  // Notification — soft settle
  notification: spring.soft,

  // Stagger container
  staggerContainer: (staggerChildren = stagger.normal, delayChildren = 0.1) => ({
    duration: 0,
    staggerChildren,
    delayChildren,
  }),
};

// ─────────────────────────────────────────────────────────────────
// MOTION VARIANTS
// Ready-to-use variant objects for <motion.div variants={...}>.
// Each has: hidden → visible (→ exit where needed).
// ─────────────────────────────────────────────────────────────────

// ── Page transition ─────────────────────────────────────────────
export const pageVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    filter: 'blur(8px)',
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      ...transitions.page,
      // Children stagger in after parent settles
      staggerChildren: stagger.normal,
      delayChildren: 0.15,
    },
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(6px)',
    scale: 1.005,
    transition: {
      duration: duration.normal,
      ease: ease.in,
    },
  },
};

// ── Sidebar slide ────────────────────────────────────────────────
export const sidebarVariants = {
  hidden: {
    x: -32,
    opacity: 0,
    filter: 'blur(4px)',
  },
  visible: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      ...spring.panel,
      staggerChildren: stagger.tight,
      delayChildren: 0.08,
    },
  },
  exit: {
    x: -20,
    opacity: 0,
    filter: 'blur(4px)',
    transition: {
      duration: duration.normal,
      ease: ease.in,
    },
  },
};

// ── Modal / settings panel ───────────────────────────────────────
export const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.94,
    y: 20,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: spring.modal,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    filter: 'blur(6px)',
    transition: {
      duration: duration.normal,
      ease: ease.in,
    },
  },
};

// ── Modal backdrop ───────────────────────────────────────────────
export const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.smooth, ease: ease.out } },
  exit:    { opacity: 0, transition: { duration: duration.normal, ease: ease.in } },
};

// ── Chat message ─────────────────────────────────────────────────
export const messageVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    x: -4,
    scale: 0.97,
    filter: 'blur(3px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    x: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      ...spring.soft,
      opacity: { duration: duration.normal, ease: ease.out },
    },
  },
};

// ── Stagger container — wraps lists of children ──────────────────
export const staggerContainerVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.normal,
      delayChildren: 0.05,
    },
  },
};

// ── Stagger item — child of staggerContainerVariants ────────────
export const staggerItemVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: 'blur(2px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: spring.soft,
  },
};

// ── User join event ──────────────────────────────────────────────
export const userJoinVariants = {
  hidden: {
    opacity: 0,
    scale: 0.85,
    y: -8,
    filter: 'blur(6px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: spring.modal,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 8,
    filter: 'blur(4px)',
    transition: {
      duration: duration.fast,
      ease: ease.in,
    },
  },
};

// ── Notification / toast ─────────────────────────────────────────
export const notificationVariants = {
  hidden: {
    opacity: 0,
    y: -20,
    scale: 0.96,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: spring.soft,
  },
  exit: {
    opacity: 0,
    y: -12,
    scale: 0.97,
    filter: 'blur(3px)',
    transition: {
      duration: duration.normal,
      ease: ease.in,
    },
  },
};

// ── Screen share bar ─────────────────────────────────────────────
export const shareBarVariants = {
  hidden: {
    opacity: 0,
    height: 0,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    height: 'auto',
    filter: 'blur(0px)',
    transition: {
      height: spring.panel,
      opacity: { duration: duration.smooth, ease: ease.out },
      filter: { duration: duration.smooth, ease: ease.out },
    },
  },
  exit: {
    opacity: 0,
    height: 0,
    filter: 'blur(4px)',
    transition: {
      height: { duration: duration.normal, ease: ease.in },
      opacity: { duration: duration.fast, ease: ease.in },
    },
  },
};

// ── Fullscreen video overlay ─────────────────────────────────────
export const fullscreenVariants = {
  hidden: {
    opacity: 0,
    scale: 0.92,
    filter: 'blur(12px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      ...spring.cinematic,
      opacity: { duration: duration.smooth, ease: ease.out },
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    filter: 'blur(8px)',
    transition: {
      duration: duration.normal,
      ease: ease.in,
    },
  },
};

// ── Input focus ring ─────────────────────────────────────────────
export const inputFocusVariants = {
  unfocused: {
    boxShadow: '0 0 0 0px rgba(168, 85, 247, 0)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  focused: {
    boxShadow: '0 0 0 3px rgba(168, 85, 247, 0.15)',
    borderColor: '#a855f7',
    transition: { duration: duration.fast, ease: ease.out },
  },
};

// ── Generic fade up — utility ────────────────────────────────────
export const fadeUpVariants = {
  hidden:  { opacity: 0, y: 12, filter: 'blur(4px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: duration.smooth, ease: ease.out },
  },
  exit: {
    opacity: 0, y: -8,
    transition: { duration: duration.fast, ease: ease.in },
  },
};

// ── Generic scale in — utility ───────────────────────────────────
export const scaleInVariants = {
  hidden:  { opacity: 0, scale: 0.95, filter: 'blur(4px)' },
  visible: {
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transition: spring.modal,
  },
  exit: {
    opacity: 0, scale: 0.97,
    transition: { duration: duration.fast, ease: ease.in },
  },
};