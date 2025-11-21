import React, { useState } from 'react';
import styles from '../page.module.css';

const UsernamePrompt = ({ onSubmit, defaultUsername }) => {
    if(defaultUsername === "Player"){
        defaultUsername = "";
    }
    const [username, setUsername] = useState(defaultUsername || '');

    const handleSubmit = () => {
        if (username.trim()) {
            onSubmit(username.trim());
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h2>Syötä käyttäjänimi</h2>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Kirjoita nimimerkkisi..."
                    className={styles.input}
                    autoFocus
                />
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.button}
                        onClick={handleSubmit}
                        disabled={!username.trim()}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UsernamePrompt;
