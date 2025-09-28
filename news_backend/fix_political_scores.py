#!/usr/bin/env python3
"""
모든 뉴스의 정치성향 점수와 분류를 올바르게 수정하는 스크립트
"""
import sqlite3
from gemini_analyzer import calculate_political_score, analyze_political_leaning

def fix_all_political_scores():
    """모든 뉴스의 정치성향 점수와 분류를 수정합니다."""
    conn = sqlite3.connect('news.db')
    c = conn.cursor()
    
    # 모든 뉴스 가져오기
    c.execute('SELECT id, title, summary FROM news')
    news_list = c.fetchall()
    
    print(f'총 {len(news_list)}개 뉴스 업데이트 시작')
    
    updated = 0
    for news_id, title, summary in news_list:
        try:
            # 분석할 텍스트 준비
            content = summary if len(summary) > 50 else title
            
            # 새로운 정치성향 점수와 분류 계산
            score = calculate_political_score(content)
            leaning = analyze_political_leaning(content)
            
            # 데이터베이스 업데이트
            c.execute('''
                UPDATE news 
                SET political_score = ?, political_leaning = ?
                WHERE id = ?
            ''', (score, leaning, news_id))
            
            updated += 1
            
            if updated % 10 == 0:
                print(f'{updated}개 완료')
                
        except Exception as e:
            print(f'ID {news_id} 업데이트 실패: {e}')
            continue
    
    conn.commit()
    conn.close()
    
    print(f'완료: {updated}개 뉴스 업데이트')
    return updated

if __name__ == "__main__":
    fix_all_political_scores()
