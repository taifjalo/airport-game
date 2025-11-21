import React, { useState } from "react";

export default function AdminTools({ timeMultiplier, setTimeMultiplier, gameState, setGameState }) {
    const [playerName, setPlayerName] = useState("");
    const [currency, setCurrency] = useState(gameState.currency);
    const [rebirths, setRebirths] = useState(gameState.rebirths);
    const [totalEarned, setTotalEarned] = useState(gameState.TotalEarned);

    const handleUpdateGameState = () => {
        setGameState(prev => ({
            ...prev,
            currency: parseFloat(currency) || prev.currency,
            rebirths: parseInt(rebirths) || prev.rebirths,
            TotalEarned: parseFloat(totalEarned) || prev.TotalEarned,
        }));
        alert("Game state updated successfully!");
    };

    const tier10AllRegions = () => {
        const updatedRegionTiers = {};
        gameState.ownedRegions.forEach(region => {
            updatedRegionTiers[region] = 10;
        });
        setGameState(prev => ({
            ...prev,
            regionTiers: updatedRegionTiers,
        }));
        alert("All owned regions upgraded to tier 10!");
    };

    return (
        <div>
            <input
                type="text"
                placeholder="Player Name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
            />
            <input
                type="number"
                placeholder="Rebirths"
                onChange={(e) => setRebirths(e.target.value)}
            />
            <input
                type="number"
                placeholder="Currency"
                onChange={(e) => setCurrency(e.target.value)}
            />
            <input
                type="number"
                placeholder="Total Earned"
                onChange={(e) => setTotalEarned(e.target.value)}
            />
            <button onClick={handleUpdateGameState}>Update Game State</button>
            <button onClick={() => setTimeMultiplier(!timeMultiplier)}>
                {timeMultiplier ? "Disable 100x Multiplier" : "Enable 100x Multiplier"}
            </button>
            <button onClick={tier10AllRegions}>Max Regions</button>
        </div>
    );
}
