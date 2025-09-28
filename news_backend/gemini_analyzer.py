import re
import random
import json
from typing import Dict, List, Tuple

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

def calculate_political_score(text):
    """정치성향분석기준 V3에 따른 체계적 분석으로 1-100 점수를 계산합니다."""
    if not text:
        return 50  # 중립

    text_lower = text.lower()

    # 1단계: 핵심 타겟 식별 및 기준점 설정
    def identify_target_and_set_baseline(text):
        # 정부/여당 비판 키워드 (보수 성향 - 점수 낮춤)
        gov_criticism_keywords = [
            '정부', '여당', '윤석열', '이재명', '정권', '관리부실', '책임', '실패', '문제', 
            '비판', '지적', '우려', '논란', '의혹', '사태', '파문', '충격', '경고', '경각심', '무능', '부실', 
            '비리', '부정', '사고', '장애', '마비', '정치공작', '권력남용', '독재', '전제'
        ]
        
        # 야당/진보 진영 비판 키워드 (진보 성향 - 점수 높임)
        opp_criticism_keywords = [
            '야당', '민주당', '더불어민주당', '문재인', '조국', '이낙연', '조희대', '진보세력', 
            '운동권', '종북', '좌파', '특권', '이념', '정치공작', '선동', '과도', '극단', '무리', '반대', 
            '거부', '비판받는', '문제가 되는'
        ]
        
        gov_criticism_count = sum(1 for keyword in gov_criticism_keywords if keyword in text_lower)
        opp_criticism_count = sum(1 for keyword in opp_criticism_keywords if keyword in text_lower)
        
        # 타겟 판단
        if gov_criticism_count > opp_criticism_count:
            return 35  # 정부/여당이 타겟 → 보수 성향 기준점 (점수 낮춤)
        elif opp_criticism_count > gov_criticism_count:
            return 65  # 야당/진보 진영이 타겟 → 진보 성향 기준점 (점수 높임)
        else:
            return 50  # 타겟 불분명 → 중립 기준점

    # 2단계: 편향성 요소 기반 미세 조정
    def analyze_vocabulary_nuance(text):
        """어휘의 뉘앙스 분석 (± 0~10점)"""
        score = 0
        
        # 진보 성향 어휘 (긍정적 뉘앙스)
        progressive_positive = [
            '민주주의', '인권', '평등', '다양성', '포용', '사회정의', '복지', '사회보장', '최저임금', 
            '노동권', '공공성', '공정', '개혁', '변화', '진보', '혁신', '투명성', '책임성', '검찰독재', 
            '언론장악', '사법장악', '권력남용'
        ]
        
        # 보수 성향 어휘 (긍정적 뉘앙스)
        conservative_positive = [
            '안보', '국방', '질서', '안정', '전통', '가치', '도덕', '경쟁', '효율', '성장', '자유', 
            '시장', '기업', '재벌', '보수', '우파', '우익', '보수적', '전통적'
        ]
        
        # 부정적 뉘앙스 키워드 (상대방 비판)
        negative_keywords = [
            '실패', '부실', '무능', '비리', '부정', '사고', '장애', '마비', '문제', '논란', '의혹', 
            '비판', '지적', '우려', '경고', '충격', '파문', '사태', '정치공작', '선동', '과도', '극단', 
            '무리', '반대', '거부'
        ]
        
        for keyword in progressive_positive:
            if keyword in text_lower:
                score += 1
        for keyword in conservative_positive:
            if keyword in text_lower:
                score -= 1
        for keyword in negative_keywords:
            if keyword in text_lower:
                # 맥락에 따라 점수 조정 (간단한 휴리스틱)
                if any(gov_word in text_lower for gov_word in ['정부', '여당', '윤석열', '이재명']):
                    score -= 0.5  # 정부 비판 → 보수 성향 (점수 낮춤)
                elif any(opp_word in text_lower for opp_word in ['야당', '민주당', '문재인', '조국']):
                    score += 0.5  # 야당 비판 → 진보 성향 (점수 높임)
        
        return max(-10, min(10, round(score)))

    def analyze_framing_structure(text):
        """문장 구조와 프레임 분석 (± 0~10점)"""
        score = 0
        
        # 책임 소재를 부각하는 프레임
        responsibility_frames = [
            '책임', '원인', '원인 제공', '발생', '일어난', '초래', '만들어낸', '야기한', '초래한'
        ]
        
        # 문제 상황을 강조하는 프레임
        problem_frames = [
            '문제', '논란', '의혹', '비판', '지적', '우려', '경고', '충격', '파문', '사태', '사고'
        ]
        
        for frame in responsibility_frames:
            if frame in text_lower:
                # 맥락에 따라 점수 조정
                if any(gov_word in text_lower for gov_word in ['정부', '여당', '윤석열', '이재명']):
                    score -= 1  # 정부 책임 부각 → 보수 성향 (점수 낮춤)
                elif any(opp_word in text_lower for opp_word in ['야당', '민주당', '문재인', '조국']):
                    score += 1  # 야당 책임 부각 → 진보 성향 (점수 높임)
        
        for frame in problem_frames:
            if frame in text_lower:
                # 맥락에 따라 점수 조정
                if any(gov_word in text_lower for gov_word in ['정부', '여당', '윤석열', '이재명']):
                    score -= 0.5  # 정부 문제 부각 → 보수 성향 (점수 낮춤)
                elif any(opp_word in text_lower for opp_word in ['야당', '민주당', '문재인', '조국']):
                    score += 0.5  # 야당 문제 부각 → 진보 성향 (점수 높임)
        
        return max(-10, min(10, round(score)))

    def analyze_quotes_quality(text):
        """인용의 질과 양 분석 (± 0~10점)"""
        score = 0
        
        # 진보 성향 인물/정당
        progressive_sources = [
            '문재인', '조국', '이낙연', '조희대', '민주당', '더불어민주당', '조국혁신당', '개혁신당'
        ]
        
        # 보수 성향 인물/정당
        conservative_sources = [
            '윤석열', '이준석', '장동혁', '박근혜', '이명박', '국민의힘', '새누리당', '여당'
        ]
        
        # 이재명은 맥락에 따라 다르게 처리
        if '이재명' in text_lower:
            if any(word in text_lower for word in ['정부', '여당', '비판', '지적', '문제']):
                score -= 2  # 정부/여당 비판 맥락 → 보수 성향 (점수 낮춤)
            elif any(word in text_lower for word in ['국민의힘', '장동혁', '이준석', '정치공작']):
                score += 2  # 보수 비판 맥락 → 진보 성향 (점수 높임)
        
        for source in progressive_sources:
            if source in text_lower:
                score += 2
        for source in conservative_sources:
            if source in text_lower:
                score -= 2
        
        return max(-10, min(10, round(score)))

    def analyze_context_omission(text):
        """의도적 생략 분석 (± 0~10점)"""
        score = 0
        
        # 맥락 생략을 암시하는 키워드
        omission_keywords = [
            '논란', '의혹', '비판', '지적', '우려', '경고', '충격', '파문', '사태', '사고', '문제'
        ]
        
        # 균형을 맞추려는 시도 키워드
        balance_keywords = [
            '반박', '해명', '설명', '입장', '견해', '의견', '주장', '논리', '근거', '배경'
        ]
        
        omission_count = sum(1 for keyword in omission_keywords if keyword in text_lower)
        balance_count = sum(1 for keyword in balance_keywords if keyword in text_lower)
        
        # 생략이 많고 균형이 적으면 편향성 증가
        if omission_count > balance_count:
            # 맥락에 따라 점수 조정
            if any(gov_word in text_lower for gov_word in ['정부', '여당', '윤석열', '이재명']):
                score -= 2  # 정부 맥락 생략 → 보수 성향 (점수 낮춤)
            elif any(opp_word in text_lower for opp_word in ['야당', '민주당', '문재인', '조국']):
                score += 2  # 야당 맥락 생략 → 진보 성향 (점수 높임)
        
        return max(-10, min(10, round(score)))

    # 1단계: 기준점 설정
    baseline_score = identify_target_and_set_baseline(text)
    
    # 2단계: 편향성 요소 분석
    vocab_score = analyze_vocabulary_nuance(text)
    framing_score = analyze_framing_structure(text)
    quotes_score = analyze_quotes_quality(text)
    omission_score = analyze_context_omission(text)
    
    # 최종 점수 계산
    final_score = baseline_score + vocab_score + framing_score + quotes_score + omission_score
    
    return max(1, min(100, round(final_score)))

def analyze_political_leaning_detailed(text):
    """정밀한 3축 분석 시스템으로 정치 성향을 분석합니다."""
    if not text:
        return create_default_analysis()
    
    text_lower = text.lower()
    
    # 3축 키워드 정의
    economic_keywords = {
        'progressive': [
            '복지', '사회보장', '최저임금', '노동자', '노조', '공공부문', '증세',
            '반독점', '재벌규제', '소상공인', '자영업자', '중소기업', '공공의료',
            '교육복지', '주거복지', '공공주택', '임대주택', '사회보험'
        ],
        'conservative': [
            '감세', '규제완화', '작은정부', '민영화', '시장자율', '기업', '재벌',
            '대기업', '경쟁', '효율', '성장', '자유시장', '시장경제', '공기업',
            '공무원', '개인주의', '자기책임'
        ]
    }
    
    social_keywords = {
        'progressive': [
            '인권', '평등', '다양성', '젠더평등', '성평등', '페미니즘', '차별금지',
            '형사정책개혁', '검열반대', '장애인', '이주민', '다문화', '성소수자',
            'lgbtq', '포용', '사회통합'
        ],
        'conservative': [
            '전통', '가족', '가치', '도덕', '윤리', '종교', '기독교', '불교',
            '법과질서', '처벌강화', '표현물규제', '전통가치', '가족중심'
        ]
    }
    
    foreign_keywords = {
        'progressive': [
            '평화', '협상', '군축', '다자주의', '인권외교', '이민포용', '대화',
            '외교적해결', '국제협력', '평화협정'
        ],
        'conservative': [
            '군사력강화', '대북강경', '대중강경', '동맹강화', '이민제한', '안보',
            '국방', '군사', '미사일', '핵', '북한', '대북', '한미동맹'
        ]
    }
    
    # 축별 점수 계산
    E_score = calculate_axis_score(text_lower, economic_keywords)
    S_score = calculate_axis_score(text_lower, social_keywords)
    F_score = calculate_axis_score(text_lower, foreign_keywords)
    
    # 편향성 및 중립성 평가
    biased_count = count_biased_keywords(text_lower)
    neutral_count = count_neutral_keywords(text_lower)
    
    # 최종 점수 계산
    C_raw = 0.4 * max(E_score, 0) + 0.3 * max(S_score, 0) + 0.3 * max(F_score, 0)
    P_raw = 0.4 * max(-E_score, 0) + 0.3 * max(-S_score, 0) + 0.3 * max(-F_score, 0)
    
    # 중도 점수 계산
    base_n = 0.4
    centrist_boost = min(0.3, neutral_count * 0.05)
    bias_penalty = min(0.2, biased_count * 0.03)
    polar_amp = 0.2 * (abs(E_score) + abs(S_score) + abs(F_score))
    
    N_raw = base_n + centrist_boost - bias_penalty - polar_amp
    
    # 정규화
    total = C_raw + P_raw + N_raw
    if total > 0:
        conservative_score = round((C_raw / total) * 100, 1)
        progressive_score = round((P_raw / total) * 100, 1)
        centrist_score = round((N_raw / total) * 100, 1)
    else:
        conservative_score = 0.0
        progressive_score = 0.0
        centrist_score = 100.0
    
    # 반올림 오차 보정
    total_check = conservative_score + progressive_score + centrist_score
    if total_check != 100.0:
        centrist_score += (100.0 - total_check)
        centrist_score = round(centrist_score, 1)
    
    # 근거 및 증거 수집
    top_reasons = collect_top_reasons(text_lower, economic_keywords, social_keywords, foreign_keywords)
    evidence_spans = collect_evidence_spans(text, top_reasons)
    topic_flags = identify_topic_flags(text_lower)
    
    return {
        "scores": {
            "conservative": conservative_score,
            "progressive": progressive_score,
            "centrist": centrist_score
        },
        "top_reasons": top_reasons,
        "evidence_spans": evidence_spans,
        "topic_flags": topic_flags,
        "meta": {
            "is_opinion": is_opinion_article(text),
            "has_counterview": has_counterview(text),
            "stance_target": identify_stance_targets(text_lower),
            "uncertainty": calculate_uncertainty(conservative_score, progressive_score, centrist_score)
        }
    }

def calculate_axis_score(text, keywords_dict):
    """특정 축의 점수를 계산합니다."""
    progressive_count = sum(1 for keyword in keywords_dict['progressive'] if keyword in text)
    conservative_count = sum(1 for keyword in keywords_dict['conservative'] if keyword in text)
    
    # 점수 계산 (진보는 음수, 보수는 양수)
    score = conservative_count - progressive_count
    
    # 강한 키워드에 가중치 적용
    strong_progressive = ['민주당', '더불어민주당', '문재인', '이재명']
    strong_conservative = ['국민의힘', '새누리당', '박근혜', '이명박']
    
    for keyword in strong_progressive:
        if keyword in text:
            score -= 1
    
    for keyword in strong_conservative:
        if keyword in text:
            score += 1
    
    return max(-3, min(3, score))  # -3 ~ +3 범위로 제한

def count_biased_keywords(text):
    """편향적 표현 키워드 개수를 계산합니다."""
    biased_keywords = [
        '절대', '완전히', '매우', '극도로', '심각한', '충격적인', '놀라운',
        '당연히', '분명히', '확실히', '틀림없이', '의심의 여지없이',
        '비난', '규탄', '강력히', '단호히', '결단력있게', '과감히',
        '무조건', '무엇보다', '가장', '최고', '최악', '최선',
        '반드시', '꼭', '절대적으로', '전적으로'
    ]
    return sum(1 for keyword in biased_keywords if keyword in text)

def count_neutral_keywords(text):
    """객관적 표현 키워드 개수를 계산합니다."""
    neutral_keywords = [
        '보고', '발표', '전망', '예상', '추정', '분석', '조사',
        '결과', '데이터', '통계', '수치', '기준', '기준으로',
        '관련', '관련하여', '대해', '대하여', '대한',
        '경우', '상황', '조건', '환경', '측면', '관점'
    ]
    return sum(1 for keyword in neutral_keywords if keyword in text)

def collect_top_reasons(text, economic_keywords, social_keywords, foreign_keywords):
    """상위 3개 근거를 수집합니다."""
    reasons = []
    
    # 경제 관련 근거
    economic_progressive = sum(1 for kw in economic_keywords['progressive'] if kw in text)
    economic_conservative = sum(1 for kw in economic_keywords['conservative'] if kw in text)
    
    if economic_progressive > economic_conservative:
        reasons.append("경제정책에서 진보적 입장 강조")
    elif economic_conservative > economic_progressive:
        reasons.append("경제정책에서 보수적 입장 강조")
    
    # 사회 관련 근거
    social_progressive = sum(1 for kw in social_keywords['progressive'] if kw in text)
    social_conservative = sum(1 for kw in social_keywords['conservative'] if kw in text)
    
    if social_progressive > social_conservative:
        reasons.append("사회정책에서 진보적 가치 강조")
    elif social_conservative > social_progressive:
        reasons.append("사회정책에서 보수적 가치 강조")
    
    # 안보 관련 근거
    foreign_progressive = sum(1 for kw in foreign_keywords['progressive'] if kw in text)
    foreign_conservative = sum(1 for kw in foreign_keywords['conservative'] if kw in text)
    
    if foreign_progressive > foreign_conservative:
        reasons.append("외교안보정책에서 진보적 접근")
    elif foreign_conservative > foreign_progressive:
        reasons.append("외교안보정책에서 보수적 접근")
    
    # 3개 미만이면 기본 근거 추가
    while len(reasons) < 3:
        reasons.append("키워드 분석을 통한 정치성향 판단")
    
    return reasons[:3]

def collect_evidence_spans(text, reasons):
    """증거 인용문을 수집합니다."""
    evidence_spans = []
    
    # 간단한 인용문 추출 (실제로는 더 정교한 로직 필요)
    sentences = re.split(r'[.!?]\s+', text)
    
    for i, reason in enumerate(reasons):
        if i < len(sentences) and len(sentences[i]) > 20:
            quote = sentences[i][:50] + "..." if len(sentences[i]) > 50 else sentences[i]
            evidence_spans.append({
                "quote": quote,
                "reason": reason
            })
    
    # 3개 미만이면 기본 인용문 추가
    while len(evidence_spans) < 3:
        evidence_spans.append({
            "quote": "키워드 기반 정치성향 분석 결과",
            "reason": "자동 분석 시스템"
        })
    
    return evidence_spans[:3]

def identify_topic_flags(text):
    """주제 태그를 식별합니다."""
    topic_keywords = {
        "경제": ["경제", "경기", "성장", "투자", "기업", "재벌"],
        "복지": ["복지", "사회보장", "최저임금", "노동자"],
        "노동": ["노동", "노조", "임금", "고용"],
        "환경": ["환경", "기후", "재생에너지", "탈원전"],
        "안보": ["안보", "국방", "군사", "북한", "미사일"],
        "외교": ["외교", "동맹", "국제", "협상"],
        "사회": ["사회", "인권", "평등", "다양성"],
        "교육": ["교육", "학교", "학생", "교사"],
        "의료": ["의료", "보건", "병원", "의사"],
        "정치": ["정치", "정부", "국회", "선거"]
    }
    
    flags = []
    for topic, keywords in topic_keywords.items():
        if any(keyword in text for keyword in keywords):
            flags.append(topic)
    
    return flags[:6]  # 최대 6개

def is_opinion_article(text):
    """오피니언 기사인지 판단합니다."""
    opinion_indicators = ["사설", "칼럼", "기고", "논설", "시론", "만평"]
    return any(indicator in text for indicator in opinion_indicators)

def has_counterview(text):
    """반대 의견이 포함되어 있는지 판단합니다."""
    counterview_indicators = ["반면", "하지만", "그러나", "다른 의견", "반대", "비판"]
    return any(indicator in text for indicator in counterview_indicators)

def identify_stance_targets(text):
    """평가 대상 정책/법안/행위자를 식별합니다."""
    targets = []
    
    # 정책 관련
    if "정책" in text:
        targets.append("정책")
    if "법안" in text:
        targets.append("법안")
    if "예산" in text:
        targets.append("예산")
    if "규제" in text:
        targets.append("규제")
    
    return targets[:3]

def calculate_uncertainty(conservative_score, progressive_score, centrist_score):
    """불확실성을 계산합니다."""
    # 점수가 균등하게 분포되어 있을수록 불확실성 높음
    scores = [conservative_score, progressive_score, centrist_score]
    max_score = max(scores)
    min_score = min(scores)
    
    if max_score - min_score < 10:
        return 0.8  # 매우 불확실
    elif max_score - min_score < 20:
        return 0.6  # 상당히 불확실
    elif max_score - min_score < 30:
        return 0.4  # 약간 불확실
    else:
        return 0.2  # 비교적 확실

def create_default_analysis():
    """기본 분석 결과를 생성합니다."""
    return {
        "scores": {
            "conservative": 0.0,
            "progressive": 0.0,
            "centrist": 100.0
        },
        "top_reasons": [
            "분석할 텍스트가 없음",
            "기본값으로 중도 설정",
            "추가 분석 필요"
        ],
        "evidence_spans": [
            {"quote": "텍스트 없음", "reason": "기본값"},
            {"quote": "분석 불가", "reason": "기본값"},
            {"quote": "중도 설정", "reason": "기본값"}
        ],
        "topic_flags": [],
        "meta": {
            "is_opinion": False,
            "has_counterview": False,
            "stance_target": [],
            "uncertainty": 1.0
        }
    }

def calculate_neutrality_score(text):
    """키워드 기반으로 뉴스의 중립지수를 계산합니다."""
    if not text:
        return 50
    
    # 상세 분석 결과에서 중도 점수 사용
    analysis = analyze_political_leaning_detailed(text)
    centrist_score = analysis['scores']['centrist']
    
    # 중도 점수를 중립지수로 변환 (0-100 범위)
    return int(centrist_score)