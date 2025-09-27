#!/usr/bin/env python3
"""
기존 데이터베이스의 뉴스들에 political_score를 업데이트하는 스크립트
"""
import sqlite3
from gemini_analyzer import analyze_political_leaning, calculate_political_score

def update_political_scores():
    """기존 뉴스들의 political_score를 업데이트합니다."""
    conn = sqlite3.connect('news.db')
    c = conn.cursor()
    
    # political_score가 NULL이거나 50인 뉴스들을 가져옴
    c.execute("""
        SELECT id, title, summary, political_leaning 
        FROM news 
        WHERE political_score IS NULL OR political_score = 50
        ORDER BY created_at DESC
    """)
    
    news_list = c.fetchall()
    print(f"업데이트할 뉴스 개수: {len(news_list)}")
    
    updated_count = 0
    for news_id, title, summary, current_leaning in news_list:
        try:
            # 분석할 텍스트 준비
            content_for_analysis = summary if len(summary) > 50 else title
            
            # 새로운 정치성향과 점수 계산
            new_leaning = analyze_political_leaning(content_for_analysis)
            new_score = calculate_political_score(content_for_analysis)
            
            print(f"ID {news_id}: '{title[:30]}...' -> {new_leaning} ({new_score}점)")
            
            # 데이터베이스 업데이트
            c.execute("""
                UPDATE news 
                SET political_leaning = ?, political_score = ?
                WHERE id = ?
            """, (new_leaning, new_score, news_id))
            
            updated_count += 1
            
        except Exception as e:
            print(f"ID {news_id} 업데이트 실패: {e}")
            continue
    
    conn.commit()
    conn.close()
    
    print(f"\n업데이트 완료: {updated_count}개 뉴스")
    return updated_count

if __name__ == "__main__":
    update_political_scores()


