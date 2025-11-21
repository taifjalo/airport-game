import React from "react";
import styles from "../page.module.css";

export default function PowerUps({ powerUps, usePowerUp }) {
    return (
        <div className={styles.powerupGrid}>
            <h3>Power-upit 🔋</h3>
            {Object.entries(powerUps).map(([type, count]) => (
                <button
                    key={type}
                    onClick={() => usePowerUp(type)}
                    disabled={count < 1}
                    className={`${styles.powerupsButton} ${styles.fullWidthButton}`} // Added full width class
                >
                    {type.toUpperCase()} ({count})
                </button>
            ))}
        </div>
    );
}
