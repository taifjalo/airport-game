'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './page.module.css'; // CSS module
import { useRouter } from 'next/navigation';


const LandingScreen = () => {
  const router = useRouter();

  const handleNewGame = () => {
    router.push('/game'); // Change this to the path of your game screen
  };

  return (
      <div className={styles.landingContainer}>
          <motion.img
              src={'game_logo.avif'}
              initial={{opacity: 0, scale: 0.5}}
              animate={{opacity: 1, scale: 1}}
              transition={{duration: 1.2, delay: 0.5}}
              style={{
                  width: '200px',
                  height: 'auto',
                  margin: '2rem auto',
                  display: 'block',
                  borderRadius: '12px',
              }}
          />

          <motion.div
              className={styles.background}
              initial={{opacity: 0}}
              animate={{opacity: 1}}
              transition={{duration: 2}}
          ></motion.div>

          <motion.h1
              initial={{opacity: 0, y: -40}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.8}}
              className={styles.title}
          >
              Welcome to The game
          </motion.h1>


          <motion.button
              whileHover={{scale: 1.1, rotate: 10}}
              whileTap={{scale: 0.95}}
              className={styles.newGameButton}
              onClick={handleNewGame}
          >
Let's play          </motion.button>


      </div>
  );
};

export default LandingScreen;
