#!/usr/bin/env python3
"""
간단한 HTTP 서버 - 뉴스 API 제공
"""
import http.server
import socketserver
import json
import sqlite3
import os
from urllib.parse import urlparse, parse_qs
from serper_news import SerperNewsAPI, save_serper_news_to_db

# Serper API 키
SERPER_API_KEY = "324e82a232a260a167a7f1bfd699873a356b5f4d"

class NewsHandler(http.server.BaseHTTPRequestHandler):
    def _set_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"message": "News API Server - 뉴스 API 서버입니다."}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        elif parsed_path.path == '/news/political':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            try:
                print("API 요청 받음: /news/political")
                conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                c.execute("SELECT id, title, url, summary, political_leaning, political_score, neutrality_score, source, image_url, created_at FROM news ORDER BY created_at DESC LIMIT 20")
                news_list = c.fetchall()
                print(f"데이터베이스에서 {len(news_list)}개 뉴스 조회됨")
                conn.close()
                
                response = []
                for row in news_list:
                    row_dict = dict(row)
                    response.append(row_dict)
                print(f"응답 데이터 크기: {len(response)}")
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        
        elif parsed_path.path == '/news/search':
            # 뉴스 검색
            query_params = parse_qs(parsed_path.query)
            search_query = query_params.get('q', [''])[0]
            
            try:
                conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                
                if search_query:
                    c.execute("""
                        SELECT id, title, url, summary, political_leaning, political_score, 
                               neutrality_score, source, image_url, created_at 
                        FROM news 
                        WHERE title LIKE ? OR summary LIKE ?
                        ORDER BY created_at DESC 
                        LIMIT 20
                    """, (f'%{search_query}%', f'%{search_query}%'))
                else:
                    c.execute("""
                        SELECT id, title, url, summary, political_leaning, political_score, 
                               neutrality_score, source, image_url, created_at 
                        FROM news 
                        ORDER BY created_at DESC 
                        LIMIT 20
                    """)
                
                news_list = c.fetchall()
                conn.close()
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                response = [dict(row) for row in news_list]
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        
        elif parsed_path.path.startswith('/users/firebase/') and parsed_path.path.endswith('/scraps'):
            # 사용자 스크랩 목록 조회
            path_parts = parsed_path.path.split('/')
            firebase_uid = path_parts[3]
            self.get_user_scraps(firebase_uid)
            
        elif parsed_path.path.startswith('/users/firebase/'):
            # Firebase UID 추출
            path_parts = parsed_path.path.split('/')
            firebase_uid = path_parts[3]
            
            try:
                conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                
                # 사용자 정보 조회
                c.execute('''
                    SELECT * FROM users WHERE firebase_uid = ?
                ''', (firebase_uid,))
                
                user = c.fetchone()
                conn.close()
                
                if user:
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self._set_cors_headers()
                    self.end_headers()
                    
                    user_dict = dict(user)
                    self.wfile.write(json.dumps(user_dict, ensure_ascii=False).encode('utf-8'))
                else:
                    self.send_response(404)
                    self.send_header('Content-type', 'application/json')
                    self._set_cors_headers()
                    self.end_headers()
                    
                    response = {"error": "사용자를 찾을 수 없습니다."}
                    self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                    
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/news/serper/latest':
            # Serper API로 최신 뉴스 가져오기
            query_params = parse_qs(parsed_path.query)
            num_results = int(query_params.get('num_results', ['20'])[0])
            save_to_db = query_params.get('save_to_db', ['true'])[0].lower() == 'true'
            
            try:
                serper = SerperNewsAPI(SERPER_API_KEY)
                news_list = serper.get_latest_political_news(num_results)
                
                if save_to_db and news_list:
                    save_serper_news_to_db(news_list, 'news.db')
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                response = {
                    "message": f"총 {len(news_list)}개의 최신 정치 뉴스를 가져왔습니다.",
                    "news": news_list,
                    "saved_to_db": save_to_db
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                error_response = {
                    "error": f"뉴스 가져오기 중 오류가 발생했습니다: {str(e)}"
                }
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        
        elif parsed_path.path == '/news/serper/refresh':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            try:
                serper = SerperNewsAPI(SERPER_API_KEY)
                news_list = serper.get_latest_political_news(30)
                
                if news_list:
                    save_serper_news_to_db(news_list, 'news.db')
                    response = {
                        "message": f"총 {len(news_list)}개의 새로운 정치 뉴스를 데이터베이스에 저장했습니다.",
                        "news_count": len(news_list)
                    }
                else:
                    response = {
                        "message": "새로운 뉴스를 찾지 못했습니다.",
                        "news_count": 0
                    }
                
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                error_response = {
                    "error": f"뉴스 새로고침 중 오류가 발생했습니다: {str(e)}",
                    "news_count": 0
                }
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
                
        elif parsed_path.path.startswith('/users/firebase/') and parsed_path.path.endswith('/scraps'):
            # 스크랩 추가/삭제 처리
            path_parts = parsed_path.path.split('/')
            firebase_uid = path_parts[3]
            self.handle_scrap_action(firebase_uid)
            
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_PUT(self):
        # OPTIONS 요청 처리
        if self.command == 'OPTIONS':
            self.send_response(200)
            self._set_cors_headers()
            self.end_headers()
            return
            
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/users/firebase/') and parsed_path.path.endswith('/political-score'):
            # Firebase UID 추출
            path_parts = parsed_path.path.split('/')
            firebase_uid = path_parts[3]
            
            try:
                print(f"PUT 요청 받음: {parsed_path.path}")
                print(f"Firebase UID: {firebase_uid}")
                
                # 요청 본문 읽기
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                political_score = float(data.get("political_score", 50.0))
                print(f"Political Score: {political_score}")
                
                # 데이터베이스 업데이트
                conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
                c = conn.cursor()
                
                # 사용자 테이블이 있는지 확인하고 없으면 생성
                c.execute('''
                    CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        firebase_uid TEXT UNIQUE,
                        username TEXT,
                        email TEXT,
                        political_leaning_score REAL DEFAULT 50.0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                ''')
                
                # 사용자 정보 업데이트 (사용자가 존재하지 않으면 생성)
                c.execute('''
                    UPDATE users
                    SET political_leaning_score = ?
                    WHERE firebase_uid = ?
                ''', (political_score, firebase_uid))
                
                # 업데이트된 행이 없으면 새 사용자 생성
                if c.rowcount == 0:
                    c.execute('''
                        INSERT OR IGNORE INTO users (firebase_uid, username, email, political_leaning_score)
                        VALUES (?, ?, ?, ?)
                    ''', (firebase_uid, f"user_{firebase_uid[:8]}", f"user_{firebase_uid[:8]}@example.com", political_score))
                
                conn.commit()
                conn.close()
                print("데이터베이스 업데이트 성공")
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                response = {
                    "message": "정치성향 점수가 성공적으로 업데이트되었습니다.",
                    "political_score": political_score
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                
            except Exception as e:
                print(f"오류 발생: {str(e)}")
                import traceback
                traceback.print_exc()
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                error_response = {
                    "error": f"정치성향 점수 업데이트 중 오류가 발생했습니다: {str(e)}"
                }
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_DELETE(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path.startswith('/users/firebase/'):
            # Firebase UID 추출
            path_parts = parsed_path.path.split('/')
            firebase_uid = path_parts[3]
            self.delete_user(firebase_uid)
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def delete_user(self, firebase_uid):
        """사용자 계정 및 관련 데이터 삭제"""
        try:
            print(f"DELETE 요청 받음: 사용자 삭제 - {firebase_uid}")
            
            conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
            c = conn.cursor()
            
            # 1. 사용자 스크랩 데이터 삭제
            c.execute('''
                DELETE FROM user_scraps WHERE user_uid = ?
            ''', (firebase_uid,))
            scraps_deleted = c.rowcount
            
            # 2. 사용자 정보 삭제
            c.execute('''
                DELETE FROM users WHERE firebase_uid = ?
            ''', (firebase_uid,))
            user_deleted = c.rowcount
            
            conn.commit()
            conn.close()
            
            if user_deleted > 0:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                response = {
                    "message": "사용자 계정이 성공적으로 삭제되었습니다.",
                    "deleted_scraps": scraps_deleted,
                    "deleted_user": user_deleted
                }
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                print(f"✅ 사용자 삭제 완료: {firebase_uid} (스크랩 {scraps_deleted}개, 사용자 {user_deleted}개)")
            else:
                self.send_response(404)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                response = {"error": "사용자를 찾을 수 없습니다."}
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                print(f"❌ 사용자를 찾을 수 없음: {firebase_uid}")
                
        except Exception as e:
            print(f"❌ 사용자 삭제 중 오류 발생: {str(e)}")
            import traceback
            traceback.print_exc()
            
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            error_response = {
                "error": f"사용자 삭제 중 오류가 발생했습니다: {str(e)}"
            }
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
    
    def get_user_scraps(self, firebase_uid):
        """사용자의 스크랩 목록 조회"""
        try:
            conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            
            # user_scraps 테이블이 없으면 생성
            c.execute('''
                CREATE TABLE IF NOT EXISTS user_scraps (
                    user_uid TEXT NOT NULL,
                    news_id TEXT NOT NULL,
                    scrapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_uid, news_id)
                )
            ''')
            
            # 스크랩된 뉴스 조회
            c.execute('''
                SELECT n.* FROM news n
                JOIN user_scraps us ON n.id = us.news_id
                WHERE us.user_uid = ?
                ORDER BY us.scrapped_at DESC
            ''', (firebase_uid,))
            
            scrapped_news = [dict(row) for row in c.fetchall()]
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {"scrapped_news": scrapped_news}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            error_response = {"error": f"스크랩 목록 조회 중 오류가 발생했습니다: {str(e)}"}
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
    
    def handle_scrap_action(self, firebase_uid):
        """스크랩 추가/삭제 처리"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            article_id = data.get('article_id')
            action = data.get('action')  # 'add' or 'remove'
            
            if not all([article_id, action]):
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                error_response = {"error": "article_id와 action이 필요합니다."}
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
                return
            
            conn = sqlite3.connect('news.db', check_same_thread=False, timeout=10)
            c = conn.cursor()
            
            # user_scraps 테이블이 없으면 생성
            c.execute('''
                CREATE TABLE IF NOT EXISTS user_scraps (
                    user_uid TEXT NOT NULL,
                    news_id TEXT NOT NULL,
                    scrapped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_uid, news_id)
                )
            ''')
            
            if action == 'add':
                c.execute('''
                    INSERT OR IGNORE INTO user_scraps (user_uid, news_id)
                    VALUES (?, ?)
                ''', (firebase_uid, article_id))
                message = "뉴스가 스크랩되었습니다."
            elif action == 'remove':
                c.execute('''
                    DELETE FROM user_scraps
                    WHERE user_uid = ? AND news_id = ?
                ''', (firebase_uid, article_id))
                message = "스크랩이 해제되었습니다."
            else:
                self.send_response(400)
                self.send_header('Content-type', 'application/json')
                self._set_cors_headers()
                self.end_headers()
                
                error_response = {"error": "잘못된 action입니다. 'add' 또는 'remove'를 사용하세요."}
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
                conn.close()
                return
            
            conn.commit()
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            response = {"message": message}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self._set_cors_headers()
            self.end_headers()
            
            error_response = {"error": f"스크랩 처리 중 오류가 발생했습니다: {str(e)}"}
            self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))

if __name__ == "__main__":
    PORT = 8000
    
    # 서버 시작 전에 최신 뉴스 가져오기 및 분석
    print("서버 시작 전 최신 뉴스를 가져오고 분석합니다...")
    try:
        serper = SerperNewsAPI(SERPER_API_KEY)
        news_list = serper.get_latest_political_news(30)
        
        if news_list:
            save_serper_news_to_db(news_list, 'news.db')
            print(f"✅ 총 {len(news_list)}개의 새로운 정치 뉴스를 가져와서 분석했습니다.")
        else:
            print("⚠️ 새로운 뉴스를 찾지 못했습니다.")
    except Exception as e:
        print(f"❌ 뉴스 가져오기 중 오류 발생: {e}")
        print("서버는 계속 실행됩니다...")
    
    print("\n" + "="*50)
    
    with socketserver.TCPServer(("", PORT), NewsHandler) as httpd:
        print(f"서버가 포트 {PORT}에서 실행 중입니다...")
        print(f"http://localhost:{PORT}/ 에서 접속하세요")
        print("Ctrl+C를 눌러 서버를 종료하세요")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버를 종료합니다.")
            httpd.shutdown()
