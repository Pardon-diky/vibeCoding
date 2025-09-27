#!/usr/bin/env python3
"""
기존 뉴스 데이터의 political_score를 단일 점수 형식으로 변환합니다.
"""

import sqlite3
import json
from gemini_analyzer import calculate_political_score

def update_political_scores_to_single():
    """기존 뉴스의 political_score를 단일 점수로 업데이트합니다."""
    
    db_path = 'news.db'
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    
    # 기존 데이터 조회
    c.execute("SELECT id, title, summary, political_score FROM news")
    rows = c.fetchall()
    
    updated_count = 0
    
    for row in rows:
        news_id, title, summary, current_score = row
        
        # 분석할 텍스트 준비
        content_for_analysis = summary if summary and len(summary) > 50 else title
        
        try:
            # 새로운 단일 점수 계산
            new_score = calculate_political_score(content_for_analysis)
            
            # 데이터베이스 업데이트
            c.execute("UPDATE news SET political_score = ? WHERE id = ?", (new_score, news_id))
            updated_count += 1
            
            print(f"뉴스 ID {news_id}: {new_score}점으로 업데이트")
            
        except Exception as e:
            print(f"뉴스 ID {news_id} 업데이트 실패: {e}")
            # 실패시 중립 점수로 설정
            c.execute("UPDATE news SET political_score = ? WHERE id = ?", (50, news_id))
            updated_count += 1
    
    conn.commit()
    conn.close()
    
    print(f"\n총 {updated_count}개 뉴스의 정치성향 점수를 업데이트했습니다.")

if __name__ == "__main__":
    update_political_scores_to_single()

