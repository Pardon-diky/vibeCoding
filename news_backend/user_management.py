import sqlite3
import os
import bcrypt

# 데이터베이스 파일 경로
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')

def init_user_db():
    """users 테이블을 초기화합니다."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         username TEXT NOT NULL UNIQUE,
         password TEXT NOT NULL,
         political_leaning TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    ''')
    conn.commit()
    conn.close()
    print("User 데이터베이스가 초기화되었습니다.")

def create_user(username, password, political_leaning):
    """새로운 사용자를 생성하고 데이터베이스에 저장합니다."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 비밀번호 해싱
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    try:
        c.execute("INSERT INTO users (username, password, political_leaning) VALUES (?, ?, ?)",
                  (username, hashed_password, political_leaning))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return {"id": user_id, "username": username, "political_leaning": political_leaning}
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "이미 존재하는 사용자 이름입니다."}

def verify_user(username, password):
    """사용자 이름과 비밀번호를 확인합니다."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()
    
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
        return dict(user)
    return None

if __name__ == '__main__':
    init_user_db()