#!/usr/bin/env python3
"""
간단한 테스트 서버 - Serper API 테스트용
"""
import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from serper_news import SerperNewsAPI, save_serper_news_to_db

# FastAPI 앱 생성
app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serper API 키 설정
SERPER_API_KEY = "324e82a232a260a167a7f1bfd699873a356b5f4d"

@app.get("/")
def read_root():
    return {"message": "Test Server - Serper API 테스트 서버입니다."}

@app.get("/news/political")
def get_political_news():
    """정치 뉴스 가져오기 (기존 데이터베이스에서)"""
    try:
        import sqlite3
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')
        
        if not os.path.exists(db_path):
            return []
            
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT id, title, url, summary, political_leaning, neutrality_score, source, image_url, created_at FROM news ORDER BY created_at DESC LIMIT 20")
        news_list = c.fetchall()
        conn.close()
        
        return [dict(row) for row in news_list]
    except Exception as e:
        print(f"Error: {e}")
        return []

@app.post("/news/serper/refresh")
def refresh_political_news_with_serper():
    """Serper API를 사용하여 정치 뉴스를 새로고침하고 데이터베이스에 저장합니다."""
    try:
        serper = SerperNewsAPI(SERPER_API_KEY)
        news_list = serper.get_latest_political_news(30)
        
        if news_list:
            db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')
            save_serper_news_to_db(news_list, db_path)
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
        return {
            "error": f"뉴스 새로고침 중 오류가 발생했습니다: {str(e)}",
            "news_count": 0
        }

if __name__ == "__main__":
    print("테스트 서버를 시작합니다...")
    print(f"Serper API 키: {SERPER_API_KEY[:10]}...")
    uvicorn.run(app, host="127.0.0.1", port=8001)
