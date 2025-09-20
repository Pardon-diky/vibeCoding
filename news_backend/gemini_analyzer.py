import google.generativeai as genai
import os

# 중요: 실행 환경에 GOOGLE_API_KEY 환경 변수를 설정하거나, 아래 변수에 직접 키를 입력하세요.
# 예: genai.configure(api_key="YOUR_API_KEY")
API_KEY = os.getenv("GOOGLE_API_KEY") or "AIzaSyDdwDzVwpg1iG0thQdHAzpmv4B_lIptzMI"
genai.configure(api_key=API_KEY)

def summarize_text(text):
    """Gemini API를 사용하여 텍스트를 요약합니다."""
    if not API_KEY:
        return text[:100] + "..." if len(text) > 100 else text  # API 키가 없으면 텍스트 앞부분 반환
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"다음 뉴스 기사를 한 문장으로 요약해줘.\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return text[:100] + "..." if len(text) > 100 else text  # 오류 시 텍스트 앞부분 반환

def analyze_political_leaning(text):
    """Gemini API를 사용하여 텍스트의 정치 성향을 분석합니다."""
    if not API_KEY:
        return "중도"  # API 키가 없으면 중도로 설정
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"다음 뉴스 기사의 정치적 성향을 '진보', '중도', '보수' 중 하나로 분류하고, 그 이유를 한 문장으로 설명해줘.\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return "중도"  # 오류 시 중도로 설정

def calculate_neutrality_score(text):
    """Gemini API를 사용하여 뉴스의 중립지수를 계산합니다."""
    if not API_KEY:
        return 50  # API 키가 없으면 중립으로 설정
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""다음 뉴스 기사를 분석하여 중립지수를 0-100점으로 평가해주세요.
        
        평가 기준:
        - 0-30점: 매우 편향적 (한쪽 편에 치우침)
        - 31-60점: 약간 편향적 (어느 정도 편향)
        - 61-80점: 상당히 중립적 (균형 잡힌 관점)
        - 81-100점: 매우 중립적 (객관적이고 균형 잡힌 관점)
        
        다음 형식으로만 답변해주세요: "중립지수: XX점"
        
        뉴스 내용:
        {text}"""
        
        response = model.generate_content(prompt)
        result = response.text.strip()
        
        # "중립지수: XX점" 형식에서 숫자 추출
        if "중립지수:" in result:
            score_str = result.split("중립지수:")[1].split("점")[0].strip()
            try:
                score = int(score_str)
                return max(0, min(100, score))  # 0-100 범위로 제한
            except ValueError:
                return 50  # 파싱 실패 시 중립으로 설정
        else:
            return 50  # 예상 형식이 아닐 경우 중립으로 설정
            
    except Exception as e:
        print(f"중립지수 계산 중 오류 발생: {e}")
        return 50  # 오류 발생 시 중립으로 설정

