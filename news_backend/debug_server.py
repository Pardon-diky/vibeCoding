#!/usr/bin/env python3
"""
서버 응답을 디버깅하는 스크립트
"""
import sqlite3
import json

def debug_server_response():
    try:
        conn = sqlite3.connect('news.db')
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        
        # 서버와 동일한 쿼리 실행
        c.execute("SELECT id, title, url, summary, political_leaning, political_score, neutrality_score, source, image_url, created_at FROM news ORDER BY created_at DESC LIMIT 3")
        news_list = c.fetchall()
        conn.close()
        
        print("=== 서버 응답 디버깅 ===")
        print(f"뉴스 개수: {len(news_list)}")
        
        response = []
        for row in news_list:
            row_dict = dict(row)
            print(f"\n원본 row_dict: {row_dict}")
            
            # political_score가 문자열이면 JSON 파싱
            political_score = row_dict.get('political_score')
            print(f"political_score 원본: {political_score} (타입: {type(political_score)})")
            
            if political_score and isinstance(political_score, str):
                try:
                    import json
                    parsed_score = json.loads(political_score)
                    row_dict['political_score'] = parsed_score
                    print(f"파싱된 political_score: {parsed_score}")
                except Exception as e:
                    print(f"JSON 파싱 실패: {e}")
                    row_dict['political_score'] = None
            elif political_score is None:
                print("political_score가 None입니다")
            
            response.append(row_dict)
            print(f"최종 row_dict: {row_dict}")
        
        print(f"\n최종 response: {response}")
        
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    debug_server_response()


