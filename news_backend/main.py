import sqlite3
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React 앱의 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# @app.on_event("startup")
# def startup_event():
#     init_user_db()

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

# @app.post("/users/register")
# def register_user(user: UserCreate):
#     """새로운 사용자를 등록합니다."""
#     result = create_user(user.username, user.password, user.political_leaning)
#     if "error" in result:
#         raise HTTPException(status_code=400, detail=result["error"])
#     return result

# @app.post("/users/login")
# def login_for_access_token(form_data: UserLogin):
#     """사용자 로그인 및 인증"""
#     user = verify_user(form_data.username, form_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=401,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     return {"message": f"Welcome {user['username']}"}

@app.get("/news")
def get_news():
    """데이터베이스에서 모든 뉴스 기사를 가져와 반환합니다."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT id, title, url, summary, political_leaning, neutrality_score, source, created_at FROM news ORDER BY created_at DESC")
        news_list = c.fetchall()
        return [dict(row) for row in news_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals():
            conn.close()

@app.get("/news/political")
def get_political_news():
    """정치 관련 뉴스만 가져와 반환합니다."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # 정치 관련 키워드로 필터링 (더 포괄적으로)
        political_keywords = [
            '정치', '정부', '대통령', '국회', '의회', '선거', '당', '정당', '여당', '야당',
            '보수', '진보', '좌파', '우파', '정치인', '정치적', '정책', '법안', '입법',
            '국정', '국정감사', '국정원', '검찰', '법원', '사법', '사법부', '헌법',
            '민주주의', '자유', '평등', '인권', '시민', '국민', '국가', '사회',
            '경제정책', '복지', '교육정책', '외교', '국방', '안보', '통일',
            '윤석열', '이재명', '한동훈', '조국', '이준석', '이낙연', '문재인',
            '국민의힘', '더불어민주당', '민주당', '국힘', '개혁신당', '조국혁신당',
            # 더 포괄적인 키워드 추가
            '청년', '노동', '고용', '경제', '금리', '인플레이션', '물가', '부동산',
            '주택', '임대료', '세금', '예산', '지출', '투자', '성장', '발전',
            '개발', '건설', '교통', '환경', '기후', '에너지', '재생에너지',
            '의료', '보건', '복지', '연금', '보험', '교육', '학교', '대학',
            '학생', '교사', '교수', '연구', '과학', '기술', '디지털', 'AI',
            '인공지능', '데이터', '개인정보', '보안', '사이버', '인터넷',
            '미디어', '언론', '방송', '신문', '기자', '보도', '취재',
            '여성', '남성', '아동', '노인', '장애인', '소수자', '차별',
            '평등', '공정', '정의', '윤리', '도덕', '가치', '문화',
            '예술', '스포츠', '올림픽', '월드컵', '축구', '야구', '농구',
            '국제', '글로벌', '세계', '아시아', '유럽', '미국', '중국',
            '일본', '북한', '러시아', '우크라이나', '전쟁', '평화',
            '안전', '재난', '재해', '방재', '소방', '경찰', '군대',
            '국방', '무기', '군사', '전쟁', '평화', '통일', '분단'
        ]
        
        # SQL LIKE 쿼리로 정치 관련 뉴스 필터링
        like_conditions = " OR ".join([f"title LIKE '%{keyword}%' OR summary LIKE '%{keyword}%'" for keyword in political_keywords])
        query = f"SELECT id, title, url, summary, political_leaning, neutrality_score, source, created_at FROM news WHERE {like_conditions} ORDER BY created_at DESC"
        
        c.execute(query)
        news_list = c.fetchall()
        return [dict(row) for row in news_list]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals():
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
