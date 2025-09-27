#!/usr/bin/env python3
"""
기존 데이터베이스의 political_score를 상세 점수 형식으로 업데이트하는 스크립트
"""
import sqlite3
import json
from gemini_analyzer import analyze_political_leaning_detailed

def update_detailed_scores():
    """기존 뉴스들의 political_score를 상세 점수 형식으로 업데이트합니다."""
    conn = sqlite3.connect('news.db')
    c = conn.cursor()
    
    # political_score가 단순 숫자이거나 기본값인 뉴스들을 가져옴
    c.execute("""
        SELECT id, title, summary, political_leaning 
        FROM news 
        WHERE political_score IS NULL 
           OR political_score = '50'
           OR CAST(political_score AS INTEGER) = 50
        ORDER BY created_at DESC
    """)
    
    news_list = c.fetchall()
    print(f"업데이트할 뉴스 개수: {len(news_list)}")
    
    updated_count = 0
    for news_id, title, summary, current_leaning in news_list:
        try:
            # 분석할 텍스트 준비
            content_for_analysis = summary if len(summary) > 50 else title
            
            # 상세 분석 실행
            detailed_analysis = analyze_political_leaning_detailed(content_for_analysis)
            detailed_scores = detailed_analysis['scores']
            
            print(f"ID {news_id}: '{title[:30]}...' -> {detailed_scores}")
            
            # 데이터베이스 업데이트
            c.execute("""
                UPDATE news 
                SET political_score = ?
                WHERE id = ?
            """, (json.dumps(detailed_scores), news_id))
            
            updated_count += 1
            
        except Exception as e:
            print(f"ID {news_id} 업데이트 실패: {e}")
            continue
    
    conn.commit()
    conn.close()
    
    print(f"\n업데이트 완료: {updated_count}개 뉴스")
    return updated_count

if __name__ == "__main__":
    update_detailed_scores()


