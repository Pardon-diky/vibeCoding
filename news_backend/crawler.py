import requests
from bs4 import BeautifulSoup
import sqlite3
import os
from gemini_analyzer import summarize_text, analyze_political_leaning

# 데이터베이스 파일 경로
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'news.db')

def init_db():
    """데이터베이스를 초기화하고 news 테이블을 생성합니다."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # 기존 테이블의 구조를 확인하고, 필요한 경우 컬럼을 추가합니다.
    c.execute("PRAGMA table_info(news)")
    columns = [column[1] for column in c.fetchall()]
    
    if 'content' not in columns:
        c.execute("ALTER TABLE news ADD COLUMN content TEXT")
    if 'summary' not in columns:
        c.execute("ALTER TABLE news ADD COLUMN summary TEXT")
    if 'political_leaning' not in columns:
        c.execute("ALTER TABLE news ADD COLUMN political_leaning TEXT")

    c.execute('''
        CREATE TABLE IF NOT EXISTS news
        (id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT NOT NULL,
         url TEXT NOT NULL UNIQUE,
         content TEXT,
         summary TEXT,
         political_leaning TEXT,
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
    ''')
    conn.commit()
    conn.close()
    print("데이터베이스가 초기화되었습니다.")

def crawl_news_from_rss():
    """
    연합뉴스TV RSS 피드를 파싱하여 기사 제목과 URL을 리스트로 반환합니다.
    """
    # 연합뉴스TV 최신뉴스 RSS 피드 URL
    url = "http://www.yonhapnewstv.co.kr/browse/feed/"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print(f"RSS 피드를 가져오는 데 실패했습니다: {e}")
        return []

    # 'lxml' 파서를 사용하여 XML을 파싱
    soup = BeautifulSoup(response.content, "lxml-xml")
    
    # <item> 태그들을 모두 찾음
    items = soup.find_all('item')
    
    crawled_data = []
    for item in items:
        title = item.find('title').get_text(strip=True)
        link = item.find('link').get_text(strip=True)
        
        if title and link:
            crawled_data.append({'title': title, 'url': link})
            
    print(f"총 {len(crawled_data)}개의 뉴스를 RSS 피드에서 가져왔습니다.")
    return crawled_data

def get_article_content(url):
    """
    기사 URL에서 본문 내용을 크롤링하여 반환합니다.
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 연합뉴스TV 기사 본문에 해당하는 CSS 선택자
        article_body = soup.select_one('#articleBody')
        
        if article_body:
            return article_body.get_text(strip=True)
        else:
            print(f"본문 내용을 찾을 수 없습니다: {url}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"기사 내용을 가져오는 데 실패했습니다: {url}, Error: {e}")
        return None

def save_news_to_db(news_data):
    """
    크롤링한 뉴스 데이터를 데이터베이스에 저장합니다.
    URL이 중복되는 경우는 무시합니다.
    """
    if not news_data:
        print("저장할 뉴스 데이터가 없습니다.")
        return

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    saved_count = 0
    for news in news_data:
        try:
            # 기사 본문 내용 가져오기
            content = get_article_content(news['url'])
            if content:
                # Gemini API로 요약 및 정치 성향 분석
                summary = summarize_text(content)
                political_leaning = analyze_political_leaning(content)

                c.execute("INSERT INTO news (title, url, content, summary, political_leaning) VALUES (?, ?, ?, ?, ?)", 
                          (news['title'], news['url'], content, summary, political_leaning))
                if c.rowcount > 0:
                    saved_count += 1
        except sqlite3.IntegrityError:
            # 이미 존재하는 URL이면 무시
            pass
            
    conn.commit()
    conn.close()
    print(f"총 {saved_count}개의 새로운 뉴스를 데이터베이스에 저장했습니다.")

if __name__ == "__main__":
    print("뉴스 RSS 피드 수집 및 저장을 시작합니다.")
    init_db()
    news_list = crawl_news_from_rss()
    save_news_to_db(news_list)
    print("작업이 완료되었습니다.")