import React from 'react';
import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.995,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -6,
    scale: 1.002,
  },
};

const pageTransition = {
  type: 'tween',
  ease: [0.22, 1, 0.36, 1], // Apple ProMotion / 60-120Hz smooth spring curve
  duration: 0.22,
};

/**
 * PageTransition — Envuelve el contenido de una página con una animación
 * fluida, reactiva y acelerada por GPU (sin coste de blur ni repaints de CPU).
 *
 * Optimizado para pantallas de 60Hz y 120Hz (ProMotion).
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{
        width: '100%',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        willChange: 'transform, opacity'
      }}
    >
      {children}
    </motion.div>
  );
}
