#!/usr/bin/env python3
"""
데이터베이스에 political_score 컬럼을 추가하는 스크립트
"""
import sqlite3

def add_political_score_column():
    """데이터베이스에 political_score 컬럼을 추가합니다."""
    conn = sqlite3.connect('news.db')
    c = conn.cursor()
    
    try:
        # political_score 컬럼 추가
        c.execute("ALTER TABLE news ADD COLUMN political_score INTEGER DEFAULT 50")
        print("political_score 컬럼이 성공적으로 추가되었습니다.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("political_score 컬럼이 이미 존재합니다.")
        else:
            print(f"컬럼 추가 실패: {e}")
    
    # 테이블 구조 확인
    c.execute("PRAGMA table_info(news)")
    columns = c.fetchall()
    print("\n현재 테이블 구조:")
    for column in columns:
        print(f"  {column[1]} ({column[2]})")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    add_political_score_column()


