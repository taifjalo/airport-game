import styles from "../page.module.css";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch leaderboard
  useEffect(() => {
    fetch('http://localhost:5000/api/leaderboard')
        .then(res => res.json())
        .then(data => setLeaderboard(data.leaderboard))
        .catch(() => toast.error("Leaderboard-haku epäonnistui"));
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "b";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "m";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "k";
    return num.toString();
  };

  return (
      <div className={styles.leaderboard}>
        <h3>🏆 Parhaat 50</h3>
        <table>
          <thead>
          <tr>
            <th>Sija</th>
            <th>Nimi</th>
            <th>Rebirths</th>
            <th>Total earned</th>
            <th>Aika</th>
          </tr>
          </thead>
          <tbody>
          {leaderboard.map((entry, index) => (
              <tr key={index}>
                <td>{index + 1}.</td>
                <td>{entry.player_name}</td>
                <td>{entry.rebirths}</td>
                <td>{formatNumber(entry.total_earned)}</td>
                <td>{formatTime(entry.time)}</td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  );
};

export default Leaderboard;