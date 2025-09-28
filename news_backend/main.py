import sqlite3
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from user_management import init_user_db, create_firebase_user, get_user_by_firebase_uid, update_user_info, get_user_by_email
from serper_news import SerperNewsAPI, save_serper_news_to_db

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

class FirebaseUserCreate(BaseModel):
    firebase_uid: str
    email: str
    nickname: str = None
    display_name: str = None
    political_leaning: str = None
    political_leaning_score: float = None

class UserUpdate(BaseModel):
    nickname: str = None
    display_name: str = None
    political_leaning: str = None
    political_leaning_score: float = None
    profile_image_url: str = None

class SerperNewsRequest(BaseModel):
    query: str = "정치 뉴스"
    num_results: int = 10
    save_to_db: bool = True

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

# 사용자 관련 API 엔드포인트들
@app.post("/users/firebase")
def create_firebase_user_endpoint(user_data: FirebaseUserCreate):
    """Firebase 사용자를 데이터베이스에 저장합니다."""
    result = create_firebase_user(
        firebase_uid=user_data.firebase_uid,
        email=user_data.email,
        nickname=user_data.nickname,
        display_name=user_data.display_name,
        political_leaning=user_data.political_leaning,
        political_leaning_score=user_data.political_leaning_score
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result

@app.get("/users/firebase/{firebase_uid}")
def get_user_by_firebase_uid_endpoint(firebase_uid: str):
    """Firebase UID로 사용자 정보를 조회합니다."""
    user = get_user_by_firebase_uid(firebase_uid)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user

@app.put("/users/firebase/{firebase_uid}")
def update_user_info_endpoint(firebase_uid: str, user_data: UserUpdate):
    """사용자 정보를 업데이트합니다."""
    update_data = user_data.dict(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="업데이트할 데이터가 없습니다.")
    
    success = update_user_info(firebase_uid, **update_data)
    if not success:
        raise HTTPException(status_code=500, detail="사용자 정보 업데이트에 실패했습니다.")
    
    # 업데이트된 사용자 정보 반환
    updated_user = get_user_by_firebase_uid(firebase_uid)
    return updated_user

@app.get("/users/email/{email}")
def get_user_by_email_endpoint(email: str):
    """이메일로 사용자 정보를 조회합니다."""
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    return user

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
        c.execute("SELECT id, title, url, summary, political_leaning, political_score, neutrality_score, source, image_url, created_at FROM news ORDER BY created_at DESC")
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
        query = f"SELECT id, title, url, summary, political_leaning, political_score, neutrality_score, source, image_url, created_at FROM news WHERE {like_conditions} ORDER BY created_at DESC"
        
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

# Serper API 관련 엔드포인트들
@app.post("/news/serper/search")
def search_news_with_serper(request: SerperNewsRequest):
    """Serper API를 사용하여 뉴스를 검색합니다."""
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="SERPER_API_KEY가 설정되지 않았습니다.")
    
    try:
        serper = SerperNewsAPI(api_key)
        news_list = serper.search_political_news(request.query, request.num_results)
        
        if request.save_to_db and news_list:
            save_serper_news_to_db(news_list, DB_PATH)
        
        return {
            "message": f"총 {len(news_list)}개의 뉴스를 검색했습니다.",
            "news": news_list,
            "saved_to_db": request.save_to_db
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"뉴스 검색 중 오류가 발생했습니다: {str(e)}")

@app.get("/news/serper/latest")
def get_latest_political_news_with_serper(num_results: int = 20, save_to_db: bool = True):
    """Serper API를 사용하여 최신 정치 뉴스를 가져옵니다."""
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="SERPER_API_KEY가 설정되지 않았습니다.")
    
    try:
        serper = SerperNewsAPI(api_key)
        news_list = serper.get_latest_political_news(num_results)
        
        if save_to_db and news_list:
            save_serper_news_to_db(news_list, DB_PATH)
        
        return {
            "message": f"총 {len(news_list)}개의 최신 정치 뉴스를 가져왔습니다.",
            "news": news_list,
            "saved_to_db": save_to_db
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"뉴스 가져오기 중 오류가 발생했습니다: {str(e)}")

@app.post("/news/serper/refresh")
def refresh_political_news_with_serper():
    """Serper API를 사용하여 정치 뉴스를 새로고침하고 데이터베이스에 저장합니다."""
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="SERPER_API_KEY가 설정되지 않았습니다.")
    
    try:
        serper = SerperNewsAPI(api_key)
        news_list = serper.get_latest_political_news(30)  # 더 많은 뉴스 가져오기
        
        if news_list:
            save_serper_news_to_db(news_list, DB_PATH)
            return {
                "message": f"총 {len(news_list)}개의 새로운 정치 뉴스를 데이터베이스에 저장했습니다.",
                "news_count": len(news_list)
            }
        else:
            return {
                "message": "새로운 뉴스를 찾지 못했습니다.",
                "news_count": 0
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"뉴스 새로고침 중 오류가 발생했습니다: {str(e)}")

