import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 18,
    filter: 'blur(4px)',
    scale: 0.99,
  },
  in: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -10,
    filter: 'blur(2px)',
    scale: 1.005,
  },
};

const pageTransition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.38,
};

/**
 * PageTransition — Envuelve el contenido de una página con una animación
 * suave de entrada (fade + slide-up + blur desfoque).
 *
 * Uso:
 *   <PageTransition>
 *     <MiVista />
 *   </PageTransition>
 */
export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      style={{ width: '100%' }}
    >
      {children}
    </motion.div>
  );
}
