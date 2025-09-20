import sqlite3
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
import os
from user_management import init_user_db, create_user, verify_user

# FastAPI 앱 생성
app = FastAPI()

# 데이터베이스 파일 경로
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')

# Pydantic 모델 정의
class UserCreate(BaseModel):
    username: str
    password: str
    political_leaning: str

class UserLogin(BaseModel):
    username: str
    password: str

@app.on_event("startup")
def startup_event():
    init_user_db()

def get_db_connection():
    """데이터베이스 연결을 생성하고 row_factory를 설정합니다."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail=f"데이터베이스 파일('{DB_PATH}')을 찾을 수 없습니다. 먼저 crawler.py를 실행하여 데이터베이스를 생성하세요.")
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def read_root():
    return {"message": "News API에 오신 것을 환영합니다. /news 로 접속하여 최신 뉴스를 확인하세요."}

@app.post("/users/register")
def register_user(user: UserCreate):
    """새로운 사용자를 등록합니다."""
    result = create_user(user.username, user.password, user.political_leaning)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.post("/users/login")
def login_for_access_token(form_data: UserLogin):
    """사용자 로그인 및 인증"""
    user = verify_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"message": f"Welcome {user['username']}"}

@app.get("/news")
def get_news(conn: sqlite3.Connection = Depends(get_db_connection)):
    """데이터베이스에서 모든 뉴스 기사를 가져와 반환합니다."""
    try:
        c = conn.cursor()
        c.execute("SELECT id, title, url, summary, political_leaning, created_at, url_to_image FROM news ORDER BY created_at DESC")
        news_list = c.fetchall()
        return [dict(row) for row in news_list]
    finally:
        conn.close()

@app.get("/news/recommended")
def get_recommended_news(political_leaning: str, conn: sqlite3.Connection = Depends(get_db_connection)):
    """사용자의 정치 성향에 기반하여 뉴스를 추천합니다."""
    try:
        c = conn.cursor()
        # 사용자의 성향과 일치하는 뉴스를 우선적으로 추천
        c.execute("SELECT * FROM news WHERE political_leaning LIKE ? ORDER BY created_at DESC LIMIT 10", (f'%{political_leaning}%',))
        recommended_news = c.fetchall()
        return [dict(row) for row in recommended_news]
    finally:
        conn.close()

@app.get("/news/balance")
def get_news_balance(user_id: int, conn: sqlite3.Connection = Depends(get_db_connection)):
    """사용자가 소비한 뉴스의 정치 성향 균형 지수를 계산합니다."""
    # TBD: 사용자가 읽은 기사 기록을 추적하는 기능이 필요합니다.
    # 우선은 전체 기사의 성향 분포를 보여주는 것으로 대체합니다.
    try:
        c = conn.cursor()
        c.execute("SELECT political_leaning, COUNT(*) as count FROM news GROUP BY political_leaning")
        balance_data = c.fetchall()
        return {row['political_leaning']: row['count'] for row in balance_data}
    finally:
        conn.close()
