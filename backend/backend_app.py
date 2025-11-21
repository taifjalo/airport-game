from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
import math
from datetime import datetime

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)


def get_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="flight_game",
        autocommit=True
    )


def create_db():
    expected_schema = {
        "id": "int",
        "player_name": "varchar",
        "time": "float",
        "rebirths": "float",
        "total_earned": "float",
        "token": "varchar",
        "created_at": "timestamp"
    }
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SHOW TABLES LIKE 'leaderboard'")
    if cursor.fetchone():
        # Fetch the current schema
        cursor.execute("DESCRIBE leaderboard")
        current_schema = {row[0]: row[1].split('(')[0].lower() for row in cursor.fetchall()}

        # Normalize data types for comparison
        type_mapping = {
            "int": "int",
            "int(11)": "int",
            "float": "float",
            "double": "float",
            "varchar(255)": "varchar",
        }
        normalized_current_schema = {k: type_mapping.get(v, v) for k, v in current_schema.items()}
        normalized_expected_schema = {k: type_mapping.get(v, v) for k, v in expected_schema.items()}

        # Compare schema only
        if normalized_current_schema != normalized_expected_schema:
            cursor.execute("DROP TABLE leaderboard")
            print("Table dropped due to schema mismatch.")
            cursor.execute("""
                CREATE TABLE leaderboard (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    player_name VARCHAR(255) NOT NULL,
                    time FLOAT NOT NULL,
                    rebirths FLOAT NOT NULL,
                    total_earned FLOAT NOT NULL,
                    token VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            print("Table recreated with correct schema.")
    else:
        # Create the table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player_name VARCHAR(255) NOT NULL,
                time FLOAT NOT NULL,
                rebirths FLOAT NOT NULL,
                total_earned FLOAT NOT NULL,
                token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()

    # Insert default entry if the table is empty
    cursor.execute("SELECT COUNT(*) FROM leaderboard")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO leaderboard (player_name, time, rebirths, total_earned, token)
            VALUES ('your mom', 10, 10, 10, 123456789)
        """)
        conn.commit()

    cursor.close()
    conn.close()
    print("Database and table created or updated as needed.")

create_db()

@app.route('/api/leaderboard_wipe', methods=['GET'])
def wipe_leaderboard():
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DROP TABLE leaderboard")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS leaderboard (
                id INT AUTO_INCREMENT PRIMARY KEY,
                player_name VARCHAR(255) NOT NULL,
                time FLOAT NOT NULL,
                rebirths FLOAT NOT NULL,
                total_earned FLOAT NOT NULL,
                token VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("""
            INSERT INTO leaderboard (player_name, time, rebirths, total_earned, token)
            VALUES ('your mom', 10, 10, 10, 'default_token')
        """)
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        print(f"Error wiping leaderboard: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/leaderboard_all', methods=['GET'])
def get_leaderboard_all():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT player_name, time, rebirths, total_earned
            FROM leaderboard
            ORDER BY rebirths ASC, total_earned ASC
        """)
        return jsonify({"leaderboard": cursor.fetchall()})
    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/api/leaderboard', methods=['GET'])
def get_leaderboard():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
                  SELECT player_name, time, rebirths, total_earned
                      FROM leaderboard
                      ORDER BY rebirths DESC, total_earned DESC
        """)
        return jsonify({"leaderboard": cursor.fetchall()})
    except Exception as e:
        print(f"Error fetching leaderboard: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/save_game', methods=['POST'])
def save_game():
    try:
        data = request.json
        print(data)

        # Validate required fields
        required_fields = ['name', 'time', 'rebirths', 'total_earned', 'token']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        conn = get_db()
        cursor = conn.cursor()

        # Check if the player already has a score
        cursor.execute("""
            SELECT token
            FROM leaderboard
            WHERE player_name = %s
        """, (data['name'],))
        existing_tokens = cursor.fetchall()

        if existing_tokens:
            # Check if the token matches any existing token
            if data['token'] not in [row[0] for row in existing_tokens]:
                # Append (x) to the username
                base_name = data['name']
                count = 2
                while True:
                    new_name = f"{base_name} ({count})"
                    cursor.execute("""
                        SELECT COUNT(*)
                        FROM leaderboard
                        WHERE player_name = %s
                    """, (new_name,))
                    if cursor.fetchone()[0] == 0:
                        data['name'] = new_name
                        break
                    count += 1

        # Insert or update the leaderboard entry
        cursor.execute("""
            SELECT time, rebirths, total_earned
            FROM leaderboard
            WHERE player_name = %s
        """, (data['name'],))
        existing_score = cursor.fetchone()

        if existing_score:
            existing_time, existing_rebirths, existing_total_earned = existing_score
            if data['time'] < existing_time:  # Update only if the new time is better
                cursor.execute("""
                    UPDATE leaderboard
                    SET time = %s, rebirths = %s, total_earned = %s, token = %s, created_at = %s
                    WHERE player_name = %s
                """, (data['time'], data['rebirths'], data['total_earned'], data['token'], datetime.now(), data['name']))
            else:
                return jsonify({"status": "no update, score not better"}), 200
        else:
            cursor.execute("""
                INSERT INTO leaderboard
                (player_name, time, rebirths, total_earned, token, created_at)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (data['name'], data['time'], data['rebirths'], data['total_earned'], data['token'], datetime.now()))
        conn.commit()
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
