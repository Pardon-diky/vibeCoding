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
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"message": "News API Server - 뉴스 API 서버입니다."}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            
        elif parsed_path.path == '/news/political':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            try:
                conn = sqlite3.connect('news.db')
                conn.row_factory = sqlite3.Row
                c = conn.cursor()
                c.execute("SELECT id, title, url, summary, political_leaning, neutrality_score, source, image_url, created_at FROM news ORDER BY created_at DESC LIMIT 20")
                news_list = c.fetchall()
                conn.close()
                
                response = [dict(row) for row in news_list]
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
            except Exception as e:
                error_response = {"error": str(e)}
                self.wfile.write(json.dumps(error_response, ensure_ascii=False).encode('utf-8'))
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_POST(self):
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/news/serper/refresh':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
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
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = {"error": "Not found"}
            self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    PORT = 8002
    
    with socketserver.TCPServer(("", PORT), NewsHandler) as httpd:
        print(f"서버가 포트 {PORT}에서 실행 중입니다...")
        print(f"http://localhost:{PORT}/ 에서 접속하세요")
        print("Ctrl+C를 눌러 서버를 종료하세요")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n서버를 종료합니다.")
            httpd.shutdown()
