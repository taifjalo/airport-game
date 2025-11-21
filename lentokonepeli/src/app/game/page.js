"use client";
import React, { useState, useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "../page.module.css";
import Leaderboard from "../components/leaderboard";
import PowerUps from "../components/powerups";
import AdminTools from "../components/admintools";
import Game_map from "../components/game_map";
import UsernamePrompt from "@/app/components/usernamePrompt";


// Weather emojis
const WEATHER_EMOJIS = {
    clear: "☀️",
    storm: "⛈️",
    fog: "🌫️"
};

// Helper function to format numbers with suffixes
const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "b";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "m";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "k";
    return num.toString();
};

export default function Home() {
    const [gameState, setGameState] = useState({
        username: "Player",
        rebirths: 0,
        TotalEarned: 0,
        Earned: 0,
        gameOver: false,
        timer: 0,
        weather: null,
        achievements: [],
        currency: 0, // Moved here
        ownedRegions: new Set(["Uusimaa"]), // Moved here
        multiplierOwned: false, // Moved here
        regionTiers: {}, // Moved here
        auth: {
            token: null,
            },
        rebirthCost: 900000,
    });
    const [showAdminTools, setShowAdminTools] = useState(false);
    const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
    const [powerUps, setPowerUps] = useState({ incomeBoost: 1, doubleBalance: 1 }); // Updated power-ups
    const multiplierCost = 2000;
    const [timeMultiplier, setTimeMultiplier] = useState(false); // New state for 100x multiplier

    // Timer effect
    useEffect(() => {
        let interval;
        if (!gameState.gameOver) {
            interval = setInterval(() => {
                setGameState(prev => ({
                    ...prev,
                    timer: prev.timer + (timeMultiplier ? 100 : 1) // Multiply time by 100 if enabled
                }));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.gameOver, timeMultiplier]);

    // Currency generation effect
useEffect(() => {
    const incomePerRegion = {
        Uusimaa: 10,
    };
    const getIncome = (region, multiplierOwned, tier) =>
        ((incomePerRegion[region] ?? 5) * (multiplierOwned ? 2 : 1)) * (tier || 1);

    const interval = setInterval(() => {
        let totalIncome = 0;
        gameState.ownedRegions.forEach((region) => {
            const tier = gameState.regionTiers[region] || 1;
            totalIncome += getIncome(region, gameState.multiplierOwned, tier);
        });

        // Apply rebirth income boost
        const rebirthBoost = 1 + gameState.rebirths * 0.1;
        totalIncome = Math.ceil(totalIncome * rebirthBoost);

        setGameState(prev => ({
            ...prev,
            currency: prev.currency + totalIncome * (timeMultiplier ? 100 : 1), // Multiply income by 100 if enabled
            Earned: prev.Earned + totalIncome * (timeMultiplier ? 100 : 1)
        }));
    }, 1000);

    return () => clearInterval(interval);
}, [gameState.ownedRegions, gameState.multiplierOwned, gameState.regionTiers, gameState.rebirths, timeMultiplier]);

    // Calculate total income per second with rebirth boost
    const calculateTotalIncome = () => {
        const incomePerRegion = {
            Uusimaa: 10,
        };
        const getIncome = (region, multiplierOwned, tier) =>
            ((incomePerRegion[region] ?? 5) * (multiplierOwned ? 2 : 1)) * (tier || 1);

        let totalIncome = 0;
        gameState.ownedRegions.forEach((region) => {
            const tier = gameState.regionTiers[region] || 1;
            totalIncome += getIncome(region, gameState.multiplierOwned, tier);
        });

        // Apply rebirth income boost
        const rebirthBoost = 1 + gameState.rebirths * 0.1;
        return Math.ceil(totalIncome * rebirthBoost);
    };

    const totalIncome = calculateTotalIncome(); // Calculate income dynamically
    const sendToServer = async (gameState) => {
        try {
            const gameStateToSend = {
                name: gameState.username, // Map username to name
                time: gameState.timer, // Map timer to time
                rebirths: gameState.rebirths,
                total_earned: gameState.TotalEarned + gameState.Earned, // Calculate total_earned
                token: gameState.auth.token
            };

            const res = await fetch("http://localhost:5000/api/save_game", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(gameStateToSend),
            });

            if (!res.ok) throw new Error("Failed to save game");
            toast.success("Peli tallennettu palvelimelle!");
        } catch (error) {
            toast.error("Tallennus epäonnistui");
        }
    }
    const saveGame = async (local) => {
        const gameStateToSave = {
            ...gameState,
            ownedRegions: Array.from(gameState.ownedRegions), // Convert Set to Array
        };
        localStorage.setItem("gameState", JSON.stringify(gameStateToSave));
        toast.success("Peli tallennettu!");
        if (!local) {
            await sendToServer(gameStateToSave);
            window.location.reload();
        }
    };

    const startNewGame = () => {
        const userInput = prompt("Please type 'start' to confirm new game");
    
        if (!userInput || userInput.trim().toLowerCase() !== "start") {
            toast.error("Uuden pelin aloittaminen peruutettu.");
            return;
        }
    
        setGameState({
            username: "Player",
            rebirths: 0,
            TotalEarned: 0,
            Earned: 0,
            gameOver: false,
            timer: 0,
            weather: null,
            achievements: [],
            currency: 0,
            ownedRegions: new Set(["Uusimaa"]),
            multiplierOwned: false,
            regionTiers: {},
            rebirthCost: 900000, // Initial rebirth cost
        });
        localStorage.removeItem("gameState");
        window.location.reload();
    };

    // Use power-ups
    const usePowerUp = useCallback(async (type) => {
        if (!powerUps[type]) return;

        setPowerUps(prev => ({ ...prev, [type]: prev[type] - 1 }));

        if (type === "incomeBoost") {
            toast.success("30x income boost activated for 10 seconds! 🚀");
            const originalMultiplier = timeMultiplier;
            setTimeMultiplier(true);
            setTimeout(() => setTimeMultiplier(originalMultiplier), 10000); // Reset after 10 seconds
        } else if (type === "doubleBalance") {
            setGameState(prev => ({
                ...prev,
                currency: prev.currency * 2
            }));
            toast.success("Balance doubled! 💰");
        }
    }, [powerUps, timeMultiplier]);

    // Handle purchasing a region
    const handlePurchaseRegion = (region, price) => {
        if (gameState.ownedRegions.has(region)) {
            toast.error(`${region} is already owned.`);
            return;
        }
        if (gameState.currency < price) {
            toast.error(`Not enough currency to purchase ${region}. You need €${price}.`);
            return;
        }

        setGameState(prev => ({
            ...prev,
            currency: prev.currency - price,
            ownedRegions: new Set(prev.ownedRegions).add(region)
        }));
        toast.success(`Purchased ${region} for €${price}`);
    };

    // Handle upgrading a region
    const handleUpgradeRegion = (region) => {
        if (!gameState.ownedRegions.has(region)) {
            toast.error(`You don't own ${region}.`);
            return;
        }
        const currentTier = gameState.regionTiers[region] || 1;
        if (currentTier >= 10) {
            toast.error(`${region} is already at max tier.`);
            return;
        }
        const upgradeCost = (currentTier + 1) * 500;
        if (gameState.currency < upgradeCost) {
            toast.error(`Not enough currency to upgrade ${region}. You need €${upgradeCost}.`);
            return;
        }

        setGameState(prev => ({
            ...prev,
            currency: prev.currency - upgradeCost,
            regionTiers: { ...prev.regionTiers, [region]: currentTier + 1 }
        }));
        toast.success(`Upgraded ${region} to tier ${currentTier + 1} for €${upgradeCost}`);
    };

    const checkAchievements = (state, unlock) => {
        const newAchievements = [];
    
        if (!state.achievements.includes("First Blood") && state.Earned >= 1) {
            newAchievements.push("First Blood");
        }
        if (!state.achievements.includes("Millionaire") && (state.currency >= 1_000_000)) {
            newAchievements.push("Millionaire");
        }
        if (!state.achievements.includes("Tycoon") && state.ownedRegions.size >= 5) {
            newAchievements.push("Tycoon");
        }
        const hasTier5 = Object.values(state.regionTiers).some(t => t >= 5);
        if (!state.achievements.includes("Investor") && hasTier5) {
            newAchievements.push("Investor");
        }
    
        if (newAchievements.length) {
            unlock(newAchievements);
        }
    };

    useEffect(() => {
        checkAchievements(gameState, (unlocked) => {
            unlocked.forEach(name => {
                toast.success(`Achievement unlocked: ${name} 🏆`);
            });
    
            setGameState(prev => ({
                ...prev,
                achievements: [...prev.achievements, ...unlocked]
            }));
        });
    }, [gameState.Earned, gameState.currency, gameState.ownedRegions, gameState.regionTiers]);    
    

    // Handle purchasing the multiplier
    const handlePurchaseMultiplier = () => {
        if (gameState.multiplierOwned) {
            toast.error("Multiplier already owned!");
            return;
        }
        if (gameState.currency < multiplierCost) {
            toast.error(`You need €${multiplierCost} to buy the income multiplier.`);
            return;
        }

        setGameState(prev => ({
            ...prev,
            currency: prev.currency - multiplierCost,
            multiplierOwned: true
        }));

        checkAchievements();<div className={styles.gameCard}>
        <div className={styles.gameSectionTitle}>🏅 Achievements</div>
        <ul>
            {gameState.achievements.map(id => {
                const achievement = ALL_ACHIEVEMENTS.find(a => a.id === id);
                return <li key={id}>✅ {achievement?.name}</li>;
            })}
        </ul>
    </div>
        toast.success("Income multiplier purchased!");
    };

    // Handle purchasing a rebirth
    const handlePurchaseRebirth = () => {
        if (gameState.currency < gameState.rebirthCost) {
            toast.error(`Not enough currency to rebirth. You need €${formatNumber(gameState.rebirthCost)}.`);
            return;
        }

        setGameState(prev => ({
            ...prev,
            currency: 0,
            rebirths: prev.rebirths + 1,
            ownedRegions: new Set(["Uusimaa"]),
            regionTiers: {},
            rebirthCost: Math.ceil(prev.rebirthCost * 1.2) // Increase cost by 20%
        }));
        toast.success(`Rebirth successful! Income boosted by ${(gameState.rebirths + 1) * 10}%.`);
    };

    const handlePlaneButtonClick = () => {
        const income = calculateTotalIncome();
        const bonusCurrency = Math.floor(income * 0.1); // 10% of current income
        setGameState(prev => ({
            ...prev,
            currency: prev.currency + bonusCurrency
        }));
        toast.success(`You received €${formatNumber(bonusCurrency)} from the plane! ✈️`);
    };

    // Helper function for formatting time
    const formatTime = (seconds) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs > 0 ? hrs + ':' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const setUsername = (name) => {
        if (name) {
            const creationDate = new Date();
            const token = btoa(`${name}-${creationDate.toISOString()}`);
            setGameState(prev => ({
                ...prev,
                username: name,
                auth: { token: token },
            }));
            console.log("username set to:", name);
            toast.success("Username set!");
            console.log(`Game created on: ${creationDate.toString()}`);
        }
    };

    useEffect(() => {
        const savedGame = localStorage.getItem("gameState");
        if (savedGame) {
            const parsedState = JSON.parse(savedGame);
            console.log("Parsed game state:", parsedState);
            setGameState(prev => ({
                ...parsedState,
                ownedRegions: new Set(parsedState.ownedRegions),
                auth: { ...prev.auth, ...parsedState.auth },
            }));
        } else {
            setShowUsernamePrompt(true);
        }
    }, []);

    return (
        <>
            <link
                href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400&display=swap"
                rel="stylesheet"
            />

            <div className={styles.gameBg}></div>
            {showUsernamePrompt && (
                <UsernamePrompt
                    defaultUsername={gameState.username } // Pass default username
                    onSubmit={(name) => {
                        setUsername(name);
                        setShowUsernamePrompt(false); // Hide the prompt after setting the username
                    }}
                />
            )}
            <div className={styles.gameContainer}>
                <div className={styles.gameSidebar}>
                    <div className={styles.gameUsername}>👤  {gameState.username}</div>

                    <div className={styles.gameCard}>
                        <div className={styles.gameSectionTitle}>🤑 Valuutta & Stats</div>
                        <p>⏱️ Aika: {formatTime(gameState.timer)}</p>
                        <p>🔄 Rebirths: {gameState.rebirths}</p>
                        <p>📏 Total earned: {formatNumber(gameState.TotalEarned + gameState.Earned)}</p>
                        <p>🌱 Earned: {formatNumber(gameState.Earned)}</p>
                        <button className={styles.powerupsButton}
                            onClick={handlePurchaseRebirth}
                        >
                            Rebirth for €{formatNumber(gameState.rebirthCost)}
                        </button>
                     
                    
                    </div>
                    <div className={styles.instructionsCard}>
                        <div className={styles.instructionsHeader}>
                            <span className={styles.headerIcon}>☠️</span>
                            <h3>Kultaklikkeri</h3>
                            <span className={styles.headerIcon}>💰</span>
                        </div>
                        <ul className={styles.instructionsList}>
                            <li>
                                <span className={styles.stepIcon}>🔥</span>
                                <strong>Kerää valuuttaa</strong> <span className={styles.emoji}>🍪💎</span>
                            </li>
                            <li>
                                <span className={styles.stepIcon}>⚡</span>
                                <strong>Hyödynnä power‑upit viisaasti🎯🚀</strong>
                            </li>
                            <li>
                                <span className={styles.stepIcon}>🏆</span>
                                <strong>Kilpaile leaderboardilla😇</strong>
                            </li>
                        </ul>
                    </div>


                    <div className={styles.gameCard} style={{ overflowY:"auto" }}>
                        <div className={styles.gameSectionTitle}>Asetukset</div>

                        <button className={styles.powerupsButton} onClick={() => saveGame()}>
                            <span className={styles.powerupIcon}>⚡</span>
                            Save game
                        </button>
                        <li></li>
                        <button className={styles.powerupsButton} onClick={() => startNewGame()}>
                            <span className={styles.powerupIcon}>⚡</span>
                            Start new game
                        </button>
                        <li/>

                        {gameState.username === "Admin" &&
                            <button className={styles.powerupsButton}
                                    onClick={() => setShowAdminTools(!showAdminTools)}>
                                {showAdminTools ? "Sulje Adminpaneeli" : "Avaa Adminpaneeli"}
                            </button>
                        }
                        {showAdminTools && (
                            <AdminTools
                                timeMultiplier={timeMultiplier}
                                setTimeMultiplier={setTimeMultiplier}
                                gameState={gameState} // Pass gameState to AdminTools
                                setGameState={setGameState} // Pass setGameState to AdminTools
                            />
                        )}
                    </div>
                    <div className={styles.weather}>
                        {gameState.weather && (
                            <div className={styles.weatherAlert}>
                                {WEATHER_EMOJIS[gameState.weather.type]}
                                {gameState.weather.msg}
                            </div>
                        )}
                    </div>
                </div>


                <div className={styles.gameMap} align="center">
                    <Game_map
                        gameState={gameState}
                        setCurrency={(value) => setGameState(prev => ({ ...prev, currency: value }))}
                        handlePurchaseRegion={handlePurchaseRegion}
                        handlePurchaseMultiplier={handlePurchaseMultiplier}
                        multiplierCost={multiplierCost}
                        handleUpgradeRegion={handleUpgradeRegion}
                        income={totalIncome}
                        handlePlaneButtonClick={handlePlaneButtonClick} // Pass the plane button handler
                    />
                </div>
                <div className={styles.gameSidepanel}>
                    <div className={styles.leaderboardBox}>
                        <Leaderboard className={styles}/>
                    </div>

                    <div className={styles.powerupGridBox}>
                        <PowerUps
                            powerUps={powerUps}
                            usePowerUp={usePowerUp}
                            styles={styles}
                        />
                    </div>
                </div>



                <ToastContainer position="bottom-right" autoClose={3000}/>
            </div>
        </>
    );
}

