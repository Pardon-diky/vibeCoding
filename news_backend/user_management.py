import sqlite3
import os
import bcrypt

# 데이터베이스 파일 경로
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')

def init_user_db():
    """users 테이블을 초기화합니다."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 기존 테이블의 구조를 확인하고, 필요한 경우 컬럼을 추가합니다.
    c.execute("PRAGMA table_info(users)")
    columns = [column[1] for column in c.fetchall()]
    
    # 새로운 컬럼들을 추가
    new_columns = [
        ('firebase_uid', 'TEXT'),
        ('email', 'TEXT'),
        ('nickname', 'TEXT'),
        ('display_name', 'TEXT'),
        ('political_leaning_score', 'REAL'),
        ('profile_image_url', 'TEXT'),
        ('last_login', 'TIMESTAMP'),
        ('is_active', 'BOOLEAN DEFAULT 1')
    ]
    
    for column_name, column_type in new_columns:
        if column_name not in columns:
            c.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}")
    
    c.execute('''
        CREATE TABLE IF NOT EXISTS users
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         firebase_uid TEXT UNIQUE,
         username TEXT,
         email TEXT,
         nickname TEXT,
         display_name TEXT,
         password TEXT,
         political_leaning TEXT,
         political_leaning_score REAL,
         profile_image_url TEXT,
         last_login TIMESTAMP,
         is_active BOOLEAN DEFAULT 1,
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

def create_firebase_user(firebase_uid, email, nickname=None, display_name=None, political_leaning=None, political_leaning_score=None):
    """Firebase 사용자를 데이터베이스에 저장합니다."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    try:
        c.execute("""
            INSERT INTO users (firebase_uid, email, nickname, display_name, political_leaning, political_leaning_score, last_login)
            VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (firebase_uid, email, nickname, display_name, political_leaning, political_leaning_score))
        conn.commit()
        user_id = c.lastrowid
        conn.close()
        return {"id": user_id, "firebase_uid": firebase_uid, "email": email, "nickname": nickname, "display_name": display_name, "political_leaning": political_leaning}
    except sqlite3.IntegrityError:
        conn.close()
        return {"error": "이미 존재하는 사용자입니다."}

def get_user_by_firebase_uid(firebase_uid):
    """Firebase UID로 사용자 정보를 조회합니다."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM users WHERE firebase_uid = ?", (firebase_uid,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

def update_user_info(firebase_uid, **kwargs):
    """사용자 정보를 업데이트합니다."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # 업데이트할 필드들
    allowed_fields = ['nickname', 'display_name', 'political_leaning', 'political_leaning_score', 'profile_image_url']
    update_fields = []
    values = []
    
    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            update_fields.append(f"{field} = ?")
            values.append(value)
    
    if update_fields:
        values.append(firebase_uid)
        query = f"UPDATE users SET {', '.join(update_fields)}, last_login = CURRENT_TIMESTAMP WHERE firebase_uid = ?"
        c.execute(query, values)
        conn.commit()
    
    conn.close()
    return True

def get_user_by_email(email):
    """이메일로 사용자 정보를 조회합니다."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    user = c.fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

if __name__ == '__main__':
    init_user_db()