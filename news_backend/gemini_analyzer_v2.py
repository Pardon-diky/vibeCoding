# -*- coding: utf-8 -*-
import re
from typing import Dict, List, Tuple

# 2025년 하반기 정치 지형을 기준으로 키워드를 재정의하고 분석 로직을 고도화합니다.
# 가정: 진보 정부 (더불어민주당), 보수 야당 (국민의힘)

# --- V2: 핵심 키워드 및 인물 데이터베이스 ---

# [진보 진영]을 비판의 대상으로 삼는 키워드 (기사를 '보수' 성향으로 만듦)
CONSERVATIVE_ATTACK_KEYWORDS = {
    "인물": ['이재명', '조국', '김동연', '정청래', '추미애', '박찬대'],
    "단체": ['더불어민주당', '민주당', '조국혁신당', '정부', '여당', '진보진영'],
    "부정적 프레임": [
        '사법리스크', '대북송금', '방탄', '포퓰리즘', '내로남불', '운동권 특혜', 
        '입법 독주', '거대 야당의 폭주', '발목잡기', '반대를 위한 반대'
    ]
}

# [보수 진영]을 비판의 대상으로 삼는 키워드 (기사를 '진보' 성향으로 만듦)
PROGRESSIVE_ATTACK_KEYWORDS = {
    "인물": ['윤석열', '김건희', '한동훈', '나경원', '오세훈', '홍준표', '장동혁'],
    "단체": ['국민의힘', '국힘', '보수진영', '야당', '전 정권', '이명박근혜'],
    "부정적 프레임": [
        '검찰 독재', '거부권 정치', '김건희 특검', '채상병 특검', '언론 장악', 
        '민생 파탄', '부자 감세', '친일 굴욕 외교', '권력 사유화', '불통'
    ]
}

def summarize_text(text):
    """텍스트를 간단히 요약합니다."""
    if not text:
        return "요약 정보 없음"
    
    # 텍스트를 문장 단위로 분리
    sentences = re.split(r'[.!?]\s+', text)
    
    # 첫 번째 문장이 50자 이상이면 앞부분만 자르기
    if len(sentences[0]) > 50:
        return sentences[0][:50] + "..."
    
    # 첫 번째 문장이 있으면 사용, 없으면 전체 텍스트의 앞부분 사용
    if sentences[0]:
        return sentences[0]
    else:
        return text[:100] + "..." if len(text) > 100 else text

def calculate_political_score(text):
    """
    V2: 고도화된 키워드와 컨텍스트 분석을 통해 정치 성향 점수를 계산합니다.
    (1-45: 보수, 46-55: 중도, 56-100: 진보)
    """
    if not text:
        return 50  # 텍스트가 없으면 중립

    text_lower = text.lower()
    
    # 1단계: 기사의 주된 공격 타겟을 식별하여 기준점 설정
    baseline_score = identify_target_and_set_baseline_v2(text_lower)
    
    # 2단계: 특정 프레임과 키워드 조합을 분석하여 점수 미세 조정
    adjustment_score = analyze_contextual_patterns_v2(text_lower)
    
    # 최종 점수 계산
    final_score = baseline_score + adjustment_score
    
    # 점수를 1점에서 100점 사이로 제한
    return max(1, min(100, round(final_score)))

def identify_target_and_set_baseline_v2(text_lower: str) -> int:
    """
    기사에 언급된 인물, 단체, 프레임 키워드를 종합하여 주된 비판 대상을 식별하고
    그에 따라 분석의 시작점(기준 점수)을 설정합니다.
    """
    progressive_target_count = 0
    for category in CONSERVATIVE_ATTACK_KEYWORDS.values():
        for keyword in category:
            if keyword in text_lower:
                progressive_target_count += 1

    conservative_target_count = 0
    for category in PROGRESSIVE_ATTACK_KEYWORDS.values():
        for keyword in category:
            if keyword in text_lower:
                conservative_target_count += 1
    
    # 진보 진영에 대한 비판이 더 많으면 '보수적 기사'로 판단
    if progressive_target_count > conservative_target_count:
        return 35  # 보수 성향 기준점
    # 보수 진영에 대한 비판이 더 많으면 '진보적 기사'로 판단
    elif conservative_target_count > progressive_target_count:
        return 65  # 진보 성향 기준점
    # 비판 대상이 불분명하면 중립에서 시작
    else:
        return 50

def analyze_contextual_patterns_v2(text_lower: str) -> int:
    """
    특정 키워드 조합(공격 패턴)을 분석하여 점수를 가감합니다.
    이는 단순 키워드 카운트보다 훨씬 더 정확하게 의도를 파악할 수 있습니다.
    """
    score_adjustment = 0
    
    # ( [키워드1, 키워드2, ...], 점수 변화 ) 형식의 튜플 리스트
    # 이 패턴들이 기사 내에 함께 등장할 경우 점수를 조정합니다.
    ATTACK_PATTERNS: List[Tuple[List[str], int]] = [
        # 보수 -> 진보 공격 패턴 (점수를 낮춤)
        (['이재명', '리스크'], -5),
        (['이재명', '법인카드'], -5),
        (['민주당', '방탄'], -4),
        (['정부', '포퓰리즘'], -3),
        (['운동권', '특혜'], -4),

        # 진보 -> 보수 공격 패턴 (점수를 높임)
        (['윤석열', '거부권'], +5),
        (['김건희', '특검'], +5),
        (['김건희', '주가조작'], +5),
        (['한동훈', '검찰'], +4),
        (['국민의힘', '막말'], +3),
        (['채상병', '수사외압'], +5)
    ]
    
    for keywords, adjustment in ATTACK_PATTERNS:
        # 패턴의 모든 키워드가 텍스트에 포함되어 있는지 확인
        if all(keyword in text_lower for keyword in keywords):
            score_adjustment += adjustment
            
    # 조정 점수 범위를 -20 ~ +20으로 제한
    return max(-20, min(20, score_adjustment))

def analyze_political_leaning(text):
    """정치성향 점수에 따라 성향을 분류합니다."""
    if not text:
        return "중도"
    
    # 정치성향 점수 계산
    score = calculate_political_score(text)
    
    # 새로운 구간에 따라 분류
    if score <= 45:
        return "보수"
    elif score >= 56:
        return "진보"
    else:
        return "중도"

# --- 테스트를 위한 예시 ---
if __name__ == '__main__':
    # 예시 1: 진보 성향으로 예상되는 기사
    progressive_text_example = """
    윤석열 대통령이 또다시 거부권을 행사했다. 김건희 특검법에 이어 채상병 특검법까지 거부하면서
    국민의힘 내부에서도 비판의 목소리가 나오고 있다. 이는 명백한 권력 사유화이며, 
    검찰 독재의 연장선이라는 지적이 나온다. 한동훈 전 위원장의 책임론도 불거지고 있다.
    """
    
    # 예시 2: 보수 성향으로 예상되는 기사
    conservative_text_example = """
    이재명 대표의 사법리스크가 더불어민주당의 발목을 잡고 있다. 대북송금 의혹에 대한
    검찰 수사가 계속되면서, 민주당은 연일 방탄 국회를 열고 있다는 비판을 피하기 어렵게 됐다.
    정부의 민생 정책이 거대 야당의 입법 독주에 막혀있다는 우려가 커진다.
    """
    
    # 예시 3: 중도 성향으로 예상되는 기사
    neutral_text_example = """
    여야가 연금개혁을 두고 또다시 평행선을 달리고 있다. 국민의힘은 재정 건전성을 우선해야 한다는 입장인 반면,
    더불어민주당은 소득 보장 강화를 주장하고 있다. 전문가들은 양측의 합의 없이는
    미래 세대에 부담을 전가할 수밖에 없다고 지적했다.
    """
    
    score1 = calculate_political_score(progressive_text_example)
    leaning1 = analyze_political_leaning(progressive_text_example)
    print(f"예시 1 점수: {score1}, 성향: {leaning1}")
    
    score2 = calculate_political_score(conservative_text_example)
    leaning2 = analyze_political_leaning(conservative_text_example)
    print(f"예시 2 점수: {score2}, 성향: {leaning2}")
    
    score3 = calculate_political_score(neutral_text_example)
    leaning3 = analyze_political_leaning(neutral_text_example)
    print(f"예시 3 점수: {score3}, 성향: {leaning3}")
