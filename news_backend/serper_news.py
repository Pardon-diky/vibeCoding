import requests
import os
from typing import List, Dict, Optional
from datetime import datetime
import sqlite3
from gemini_analyzer import summarize_text, analyze_political_leaning

class SerperNewsAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://google.serper.dev/news"
        self.headers = {
            "X-API-KEY": api_key,
            "Content-Type": "application/json"
        }
    
    def search_political_news(self, query: str = "정치 뉴스", num_results: int = 10) -> List[Dict]:
        """
        Serper API를 사용하여 정치 뉴스를 검색합니다.
        
        Args:
            query: 검색 쿼리 (기본값: "정치 뉴스")
            num_results: 반환할 결과 수 (기본값: 10)
        
        Returns:
            뉴스 기사 리스트
        """
        payload = {
            "q": query,
            "num": num_results,
            "gl": "kr",  # 한국
            "hl": "ko",  # 한국어
            "tbs": "qdr:d"  # 최근 1일
        }
        
        try:
            response = requests.post(self.base_url, headers=self.headers, json=payload)
            response.raise_for_status()
            data = response.json()
            
            news_list = []
            if "news" in data:
                for item in data["news"]:
                    news_item = {
                        "title": item.get("title", ""),
                        "url": item.get("link", ""),
                        "summary": item.get("snippet", ""),
                        "source": item.get("source", ""),
                        "image_url": item.get("imageUrl", ""),
                        "published_date": item.get("date", ""),
                        "created_at": datetime.now().isoformat()
                    }
                    news_list.append(news_item)
            
            return news_list
            
        except requests.exceptions.RequestException as e:
            print(f"Serper API 요청 실패: {e}")
            return []
        except Exception as e:
            print(f"뉴스 검색 중 오류 발생: {e}")
            return []
    
    def search_specific_political_news(self, keywords: List[str], num_results: int = 10) -> List[Dict]:
        """
        특정 정치 키워드로 뉴스를 검색합니다.
        
        Args:
            keywords: 검색할 키워드 리스트
            num_results: 반환할 결과 수
        
        Returns:
            뉴스 기사 리스트
        """
        # 키워드를 조합하여 검색 쿼리 생성
        query = " OR ".join(keywords)
        return self.search_political_news(query, num_results)
    
    def get_latest_political_news(self, num_results: int = 20) -> List[Dict]:
        """
        최신 정치 뉴스를 가져옵니다.
        
        Args:
            num_results: 반환할 결과 수
        
        Returns:
            뉴스 기사 리스트
        """
        political_keywords = [
            "정치", "정부", "대통령", "국회", "의회", "선거", "정당", 
            "여당", "야당", "보수", "진보", "정치인", "정책", "법안",
            "윤석열", "이재명", "한동훈", "조국", "이준석", "이낙연",
            "국민의힘", "더불어민주당", "민주당", "개혁신당", "조국혁신당"
        ]
        
        return self.search_specific_political_news(political_keywords, num_results)

def save_serper_news_to_db(news_list: List[Dict], db_path: str):
    """
    Serper API로 가져온 뉴스를 데이터베이스에 저장합니다.
    
    Args:
        news_list: 저장할 뉴스 리스트
        db_path: 데이터베이스 파일 경로
    """
    if not news_list:
        print("저장할 뉴스 데이터가 없습니다.")
        return
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 테이블이 없으면 생성
    c.execute('''
        CREATE TABLE IF NOT EXISTS news
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         url TEXT NOT NULL UNIQUE,
         content TEXT,
         summary TEXT,
         political_leaning TEXT,
         image_url TEXT,
         source TEXT,
         neutrality_score REAL,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    ''')
    
    saved_count = 0
    for news in news_list:
        try:
            # URL이 이미 존재하는지 확인
            c.execute("SELECT id FROM news WHERE url = ?", (news['url'],))
            if c.fetchone():
                continue  # 이미 존재하면 건너뛰기
            
            # Gemini API로 정치 성향 분석 (요약은 이미 Serper에서 제공)
            try:
                # 요약이 너무 짧으면 제목을 사용
                content_for_analysis = news['summary'] if len(news['summary']) > 50 else news['title']
                political_leaning = analyze_political_leaning(content_for_analysis)
            except Exception as e:
                print(f"Gemini API 오류, 기본값 사용: {e}")
                political_leaning = "중립"
            
            # 중립성 점수 계산 (간단한 휴리스틱)
            neutrality_score = calculate_neutrality_score(news['title'], news['summary'])
            
            c.execute("""
                INSERT INTO news (title, url, content, summary, political_leaning, image_url, source, neutrality_score, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                news['title'],
                news['url'],
                news['summary'],  # content로 사용
                news['summary'],
                political_leaning,
                news['image_url'],
                news['source'],
                neutrality_score,
                news['created_at']
            ))
            
            if c.rowcount > 0:
                saved_count += 1
                
        except sqlite3.IntegrityError:
            # 이미 존재하는 URL이면 무시
            pass
        except Exception as e:
            print(f"뉴스 저장 중 오류 발생: {e}")
            
    conn.commit()
    conn.close()
    print(f"총 {saved_count}개의 새로운 뉴스를 데이터베이스에 저장했습니다.")

def calculate_neutrality_score(title: str, summary: str) -> float:
    """
    간단한 휴리스틱을 사용하여 중립성 점수를 계산합니다.
    
    Args:
        title: 뉴스 제목
        summary: 뉴스 요약
    
    Returns:
        중립성 점수 (0.0 ~ 1.0, 1.0이 가장 중립적)
    """
    text = f"{title} {summary}".lower()
    
    # 감정적 표현이나 편향적 단어들
    biased_words = [
        "충격", "폭로", "폭탄", "대박", "완전", "정말", "진짜", "엄청",
        "최고", "최악", "끔찍", "놀라운", "놀라게", "놀랍게", "놀라운",
        "대단한", "대단히", "엄청난", "엄청나게", "정말로", "진짜로",
        "완전히", "완전한", "절대적", "절대", "무조건", "반드시",
        "당연히", "당연한", "확실히", "확실한", "분명히", "분명한"
    ]
    
    # 객관적 표현들
    neutral_words = [
        "발표", "발표했다", "발표했다고", "보고", "보고했다", "보고했다고",
        "전했다", "전했다고", "밝혔다", "밝혔다고", "말했다", "말했다고",
        "설명했다", "설명했다고", "논의", "논의했다", "논의했다고",
        "검토", "검토했다", "검토했다고", "검토 중", "검토하고 있다",
        "계획", "계획하고 있다", "계획했다", "계획했다고"
    ]
    
    biased_count = sum(1 for word in biased_words if word in text)
    neutral_count = sum(1 for word in neutral_words if word in text)
    
    # 기본 점수는 0.7로 시작
    base_score = 0.7
    
    # 편향적 단어가 있으면 점수 감소
    if biased_count > 0:
        base_score -= min(0.3, biased_count * 0.1)
    
    # 객관적 단어가 있으면 점수 증가
    if neutral_count > 0:
        base_score += min(0.2, neutral_count * 0.05)
    
    return max(0.0, min(1.0, base_score))

# 사용 예시
if __name__ == "__main__":
    # API 키를 환경변수에서 가져오거나 직접 설정
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        print("SERPER_API_KEY 환경변수를 설정해주세요.")
        exit(1)
    
    serper = SerperNewsAPI(api_key)
    
    # 최신 정치 뉴스 가져오기
    news_list = serper.get_latest_political_news(20)
    
    if news_list:
        print(f"총 {len(news_list)}개의 뉴스를 가져왔습니다.")
        
        # 데이터베이스에 저장
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')
        save_serper_news_to_db(news_list, db_path)
    else:
        print("뉴스를 가져오지 못했습니다.")
