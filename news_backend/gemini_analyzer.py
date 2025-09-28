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
    V3: 맥락 분석을 강화하여 키워드 조합과 비판 강도를 고려한 타겟 식별
    """
    # 1단계: 강한 비판 키워드 조합 분석
    strong_criticism_patterns = {
        'progressive_criticism': [
            (['이재명', '사법리스크'], 3),  # 이재명 + 사법리스크 = 강한 보수 성향
            (['민주당', '방탄'], 2),        # 민주당 + 방탄 = 보수 성향
            (['정부', '포퓰리즘'], 2),      # 정부 + 포퓰리즘 = 보수 성향
            (['이재명', '대북송금'], 3),    # 이재명 + 대북송금 = 강한 보수 성향
            (['조국', '특혜'], 2),          # 조국 + 특혜 = 보수 성향
        ],
        'conservative_criticism': [
            (['윤석열', '거부권'], 3),      # 윤석열 + 거부권 = 강한 진보 성향
            (['김건희', '특검'], 3),        # 김건희 + 특검 = 강한 진보 성향
            (['국민의힘', '막말'], 2),      # 국민의힘 + 막말 = 진보 성향
            (['한동훈', '검찰'], 2),        # 한동훈 + 검찰 = 진보 성향
            (['채상병', '수사외압'], 3),    # 채상병 + 수사외압 = 강한 진보 성향
        ]
    }
    
    # 2단계: 비판 강도 키워드 분석
    intensity_keywords = {
        'high_intensity': ['강력히', '단호히', '결단력있게', '과감히', '무조건', '절대', '완전히', '매우', '극도로', '심각한', '충격적인', '놀라운', '비난', '규탄'],
        'medium_intensity': ['비판', '지적', '우려', '경고', '문제', '논란', '의혹'],
        'low_intensity': ['제안', '요청', '건의', '의견', '입장']
    }
    
    # 3단계: 맥락 분석
    context_indicators = {
        'negative_context': ['실패', '부실', '무능', '비리', '부정', '사고', '장애', '마비', '파문', '사태'],
        'positive_context': ['성공', '성과', '개선', '발전', '진전', '해결', '완료', '달성'],
        'neutral_context': ['보고', '발표', '전망', '예상', '추정', '분석', '조사', '결과']
    }
    
    # 점수 계산
    progressive_score = 0
    conservative_score = 0
    
    # 강한 비판 패턴 분석
    for pattern, weight in strong_criticism_patterns['progressive_criticism']:
        if all(keyword in text_lower for keyword in pattern):
            progressive_score += weight
    
    for pattern, weight in strong_criticism_patterns['conservative_criticism']:
        if all(keyword in text_lower for keyword in pattern):
            conservative_score += weight
    
    # 비판 강도 분석
    for intensity, keywords in intensity_keywords.items():
        intensity_count = sum(1 for keyword in keywords if keyword in text_lower)
        if intensity == 'high_intensity':
            multiplier = 2
        elif intensity == 'medium_intensity':
            multiplier = 1
        else:  # low_intensity
            multiplier = 0.5
        
        # 맥락에 따라 가중치 적용
        if any(neg in text_lower for neg in context_indicators['negative_context']):
            if any(prog in text_lower for prog in ['이재명', '민주당', '정부', '여당']):
                progressive_score += intensity_count * multiplier
            if any(cons in text_lower for cons in ['윤석열', '국민의힘', '야당']):
                conservative_score += intensity_count * multiplier
    
    # 4단계: 최종 기준점 설정
    if progressive_score > conservative_score:
        return 35  # 보수 성향 기준점
    elif conservative_score > progressive_score:
        return 65  # 진보 성향 기준점
    else:
        return 50  # 중립 기준점

def analyze_contextual_patterns_v2(text_lower: str) -> int:
    """
    V3: 맥락 분석을 강화한 컨텍스트 패턴 분석
    키워드 조합과 비판의 강도, 맥락을 종합적으로 고려
    """
    score_adjustment = 0
    
    # 1단계: 강한 비판 패턴 (높은 가중치)
    strong_patterns = [
        # 보수 -> 진보 공격 패턴 (점수를 낮춤)
        (['이재명', '사법리스크'], -8),
        (['이재명', '대북송금'], -8),
        (['민주당', '방탄'], -6),
        (['정부', '포퓰리즘'], -5),
        (['조국', '특혜'], -6),
        (['이재명', '법인카드'], -7),

        # 진보 -> 보수 공격 패턴 (점수를 높임)
        (['윤석열', '거부권'], +8),
        (['김건희', '특검'], +8),
        (['김건희', '주가조작'], +8),
        (['한동훈', '검찰'], +6),
        (['국민의힘', '막말'], +5),
        (['채상병', '수사외압'], +8),
        (['윤석열', '불통'], +6)
    ]
    
    # 2단계: 중간 비판 패턴 (중간 가중치)
    medium_patterns = [
        # 보수 -> 진보 공격 패턴
        (['이재명', '문제'], -3),
        (['민주당', '비판'], -3),
        (['정부', '실패'], -4),
        (['여당', '논란'], -3),

        # 진보 -> 보수 공격 패턴
        (['윤석열', '비판'], +3),
        (['국민의힘', '문제'], +3),
        (['야당', '논란'], +3),
        (['한동훈', '지적'], +3)
    ]
    
    # 3단계: 맥락 강화 키워드
    context_amplifiers = {
        'negative_amplifiers': ['강력히', '단호히', '결단력있게', '과감히', '무조건', '절대', '완전히', '매우', '극도로', '심각한', '충격적인', '놀라운', '비난', '규탄'],
        'positive_amplifiers': ['성공', '성과', '개선', '발전', '진전', '해결', '완료', '달성'],
        'neutral_amplifiers': ['보고', '발표', '전망', '예상', '추정', '분석', '조사', '결과']
    }
    
    # 강한 패턴 분석
    for keywords, adjustment in strong_patterns:
        if all(keyword in text_lower for keyword in keywords):
            # 맥락 강화 키워드가 있으면 가중치 적용
            if any(amp in text_lower for amp in context_amplifiers['negative_amplifiers']):
                score_adjustment += adjustment * 1.5
            elif any(amp in text_lower for amp in context_amplifiers['positive_amplifiers']):
                score_adjustment += adjustment * 0.5
            else:
                score_adjustment += adjustment
    
    # 중간 패턴 분석
    for keywords, adjustment in medium_patterns:
        if all(keyword in text_lower for keyword in keywords):
            # 맥락 강화 키워드가 있으면 가중치 적용
            if any(amp in text_lower for amp in context_amplifiers['negative_amplifiers']):
                score_adjustment += adjustment * 1.2
            elif any(amp in text_lower for amp in context_amplifiers['positive_amplifiers']):
                score_adjustment += adjustment * 0.8
            else:
                score_adjustment += adjustment
    
    # 4단계: 문장 구조 분석
    sentence_patterns = [
        # 비판적 문장 구조
        (r'(\w+)의\s+(책임|실책|문제|부실)', -2),
        (r'(\w+)이\s+(원인|주범|원인제공)', -2),
        (r'(\w+)의\s+(무능|부실|실패)', -2),
        (r'(\w+)에\s+(비판|지적|우려)', -1),
        (r'(\w+)를\s+(규탄|비난)', -3),
    ]
    
    for pattern, adjustment in sentence_patterns:
        matches = re.findall(pattern, text_lower)
        if matches:
            # 매치된 키워드가 진보/보수 인물인지 확인
            for match in matches:
                if any(prog in match[0] for prog in ['이재명', '민주당', '정부', '여당']):
                    score_adjustment += adjustment
                elif any(cons in match[0] for cons in ['윤석열', '국민의힘', '야당']):
                    score_adjustment -= adjustment
    
    # 조정 점수 범위를 -25 ~ +25로 제한
    return max(-25, min(25, round(score_adjustment)))

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
