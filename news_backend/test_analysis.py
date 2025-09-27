#!/usr/bin/env python3
"""
정치성향 분석 테스트 스크립트
"""
from gemini_analyzer import analyze_political_leaning, calculate_political_score

def test_analysis():
    """다양한 뉴스 제목으로 분석 테스트"""
    
    test_cases = [
        "민주당 이재명 대표가 최저임금 인상을 주장했다",
        "국민의힘 박근혜 전 대통령이 시장경제를 강조했다", 
        "문재인 대통령이 복지정책을 확대하겠다고 발표했다",
        "윤석열 대통령이 안보를 강화하겠다고 말했다",
        "오늘 날씨가 맑고 기온이 25도입니다",
        "방통위 개편법이 국회를 통과했다",
        "이진숙 방통위원장이 자동 면직된다",
        "한동훈 검찰총장이 민주당을 비판했다"
    ]
    
    print("정치성향 분석 테스트 결과:")
    print("=" * 50)
    
    for i, text in enumerate(test_cases, 1):
        leaning = analyze_political_leaning(text)
        score = calculate_political_score(text)
        print(f"{i}. {text}")
        print(f"   → {leaning} ({score}점)")
        print()

if __name__ == "__main__":
    test_analysis()


