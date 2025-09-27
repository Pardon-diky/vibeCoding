#!/usr/bin/env python3
"""
API 응답을 테스트하는 스크립트
"""
import requests
import json

def test_api():
    try:
        # 백엔드 API 호출
        response = requests.get('http://localhost:8000/news/political')
        
        if response.status_code == 200:
            data = response.json()
            print(f"API 응답 성공! 뉴스 개수: {len(data)}")
            
            # 첫 번째 뉴스의 political_score 확인
            if data:
                first_news = data[0]
                print(f"\n첫 번째 뉴스:")
                print(f"ID: {first_news.get('id')}")
                print(f"Title: {first_news.get('title', '')[:50]}...")
                print(f"Political Leaning: {first_news.get('political_leaning')}")
                print(f"Political Score: {first_news.get('political_score')}")
                print(f"Political Score Type: {type(first_news.get('political_score'))}")
                
                # JSON 파싱 시도
                political_score = first_news.get('political_score')
                if political_score:
                    try:
                        if isinstance(political_score, str):
                            parsed = json.loads(political_score)
                            print(f"Parsed Score: {parsed}")
                        else:
                            print(f"Already parsed: {political_score}")
                    except:
                        print("JSON 파싱 실패")
        else:
            print(f"API 호출 실패: {response.status_code}")
            print(f"응답: {response.text}")
            
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == "__main__":
    test_api()


