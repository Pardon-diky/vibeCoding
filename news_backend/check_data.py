#!/usr/bin/env python3
import sqlite3
import json

def check_political_scores():
    conn = sqlite3.connect('news.db')
    c = conn.cursor()
    
    # 최근 5개 뉴스의 political_score 확인
    c.execute("""
        SELECT id, title, political_score, political_leaning 
        FROM news 
        ORDER BY created_at DESC 
        LIMIT 5
    """)
    
    rows = c.fetchall()
    print("=== 최근 5개 뉴스의 political_score 확인 ===")
    
    for row in rows:
        news_id, title, political_score, political_leaning = row
        print(f"\nID: {news_id}")
        print(f"Title: {title[:50]}...")
        print(f"Political Leaning: {political_leaning}")
        print(f"Political Score: {political_score}")
        
        # JSON 파싱 시도
        try:
            if political_score:
                parsed_score = json.loads(political_score)
                print(f"Parsed Score: {parsed_score}")
            else:
                print("Political Score is None/Empty")
        except:
            print("Failed to parse as JSON")
    
    conn.close()

if __name__ == "__main__":
    check_political_scores()


