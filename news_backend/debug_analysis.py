#!/usr/bin/env python3
"""
정치성향 분석 로직을 디버깅하는 스크립트
"""
from gemini_analyzer import calculate_political_score

def debug_analysis(text):
    """분석 과정을 단계별로 출력합니다."""
    print(f"분석 텍스트: {text}")
    text_lower = text.lower()
    print(f"소문자 변환: {text_lower}")
    
    # 1단계: 제목과 리드문 분석
    score1 = 0
    gov_criticism = [
        '관리부실', '책임', '실패', '문제', '비판', '지적', '우려',
        '논란', '의혹', '사태', '파문', '충격', '경고', '경각심',
        '무능', '부실', '비리', '부정', '사고', '장애', '마비'
    ]
    
    opp_criticism = [
        '정치공작', '정치적', '선동', '과도', '극단', '무리',
        '반대', '거부', '비판받는', '문제가 되는'
    ]
    
    print("\n1단계: 제목과 리드문 분석")
    print(f"정부/여당 비판 키워드: {[kw for kw in gov_criticism if kw in text_lower]}")
    print(f"야당 비판 키워드: {[kw for kw in opp_criticism if kw in text_lower]}")
    
    for keyword in gov_criticism:
        if keyword in text_lower:
            score1 += 2
            print(f"  +2점: {keyword}")
    
    for keyword in opp_criticism:
        if keyword in text_lower:
            score1 -= 2
            print(f"  -2점: {keyword}")
    
    print(f"1단계 점수: {score1}")
    
    # 2단계: 키워드 및 어휘 분석
    score2 = 0
    progressive_vocab = [
        '검찰독재', '언론장악', '사법장악', '권력남용', '독재', '전제',
        '민주주의', '인권', '평등', '다양성', '포용', '사회정의',
        '복지', '사회보장', '최저임금', '노동권', '공공성', '공정',
        '개혁', '변화', '진보', '혁신', '투명성', '책임성'
    ]
    
    conservative_vocab = [
        '종북', '운동권', '특권', '이념', '좌파', '진보세력',
        '안보', '국방', '질서', '안정', '전통', '가치', '도덕',
        '경쟁', '효율', '성장', '자유', '시장', '기업', '재벌',
        '보수', '우파', '우익', '보수적', '전통적'
    ]
    
    print("\n2단계: 키워드 및 어휘 분석")
    print(f"진보 어휘: {[kw for kw in progressive_vocab if kw in text_lower]}")
    print(f"보수 어휘: {[kw for kw in conservative_vocab if kw in text_lower]}")
    
    for keyword in progressive_vocab:
        if keyword in text_lower:
            score2 += 1
            print(f"  +1점: {keyword}")
    
    for keyword in conservative_vocab:
        if keyword in text_lower:
            score2 -= 1
            print(f"  -1점: {keyword}")
    
    print(f"2단계 점수: {score2}")
    
    # 3단계: 인용 및 출처 분석
    score3 = 0
    progressive_figures = [
        '문재인', '조국', '이낙연', '조희대',
        '민주당', '더불어민주당', '조국혁신당', '개혁신당'
    ]
    
    conservative_figures = [
        '윤석열', '이준석', '장동혁', '박근혜', '이명박',
        '국민의힘', '새누리당', '여당'
    ]
    
    print("\n3단계: 인용 및 출처 분석")
    print(f"진보 인사: {[kw for kw in progressive_figures if kw in text_lower]}")
    print(f"보수 인사: {[kw for kw in conservative_figures if kw in text_lower]}")
    
    for figure in progressive_figures:
        if figure in text_lower:
            score3 += 1
            print(f"  +1점: {figure}")
    
    for figure in conservative_figures:
        if figure in text_lower:
            score3 -= 1
            print(f"  -1점: {figure}")
    
    # 이재명 처리
    if '이재명' in text_lower:
        if any(word in text_lower for word in ['정부', '여당', '비판', '지적', '문제']):
            score3 += 1
            print(f"  +1점: 이재명 (정부 비판 맥락)")
        elif any(word in text_lower for word in ['국민의힘', '장동혁', '이준석', '정치공작']):
            score3 -= 1
            print(f"  -1점: 이재명 (보수 비판 맥락)")
    
    print(f"3단계 점수: {score3}")
    
    # 4단계: 프레임 및 맥락 생략 분석
    score4 = 0
    anti_gov_frames = [
        '실패', '부실', '무능', '비리', '부정', '비리', '사고',
        '장애', '마비', '문제', '논란', '의혹', '비판', '지적',
        '우려', '경고', '충격', '파문', '사태'
    ]
    
    anti_opp_frames = [
        '정치공작', '선동', '과도', '극단', '무리', '반대',
        '거부', '비판받는', '문제가 되는', '논란', '의혹'
    ]
    
    print("\n4단계: 프레임 및 맥락 생략 분석")
    print(f"정부/여당에 불리한 프레임: {[kw for kw in anti_gov_frames if kw in text_lower]}")
    print(f"야당에 불리한 프레임: {[kw for kw in anti_opp_frames if kw in text_lower]}")
    
    for frame in anti_gov_frames:
        if frame in text_lower:
            score4 += 1
            print(f"  +1점: {frame}")
    
    for frame in anti_opp_frames:
        if frame in text_lower:
            score4 -= 1
            print(f"  -1점: {frame}")
    
    print(f"4단계 점수: {score4}")
    
    # 5단계: 사실과 의견 혼합 분석
    score5 = 0
    progressive_values = [
        '민주주의', '인권', '평등', '다양성', '포용', '사회정의',
        '공정', '투명', '책임', '개혁', '변화', '혁신'
    ]
    
    conservative_values = [
        '안보', '질서', '안정', '전통', '가치', '도덕',
        '경쟁', '효율', '성장', '자유', '시장'
    ]
    
    print("\n5단계: 사실과 의견 혼합 분석")
    print(f"진보적 가치: {[kw for kw in progressive_values if kw in text_lower]}")
    print(f"보수적 가치: {[kw for kw in conservative_values if kw in text_lower]}")
    
    for value in progressive_values:
        if value in text_lower:
            score5 += 1
            print(f"  +1점: {value}")
    
    for value in conservative_values:
        if value in text_lower:
            score5 -= 1
            print(f"  -1점: {value}")
    
    print(f"5단계 점수: {score5}")
    
    # 최종 점수
    final_score = 50 + score1 + score2 + score3 + score4 + score5
    print(f"\n최종 점수: 50 + {score1} + {score2} + {score3} + {score4} + {score5} = {final_score}")
    
    return final_score

if __name__ == "__main__":
    test_text = "국민의힘 장동혁 이재명 정권 끝내자"
    debug_analysis(test_text)
