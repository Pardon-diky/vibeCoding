import google.generativeai as genai
import os

# 중요: 실행 환경에 GOOGLE_API_KEY 환경 변수를 설정하거나, 아래 변수에 직접 키를 입력하세요.
# 예: genai.configure(api_key="YOUR_API_KEY")
API_KEY = os.getenv("AIzaSyDdwDzVwpg1iG0thQdHAzpmv4B_lIptzMI")
genai.configure(api_key=API_KEY)

def summarize_text(text):
    """Gemini API를 사용하여 텍스트를 요약합니다."""
    if not API_KEY:
        return "API 키가 설정되지 않았습니다."
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"다음 뉴스 기사를 한 문장으로 요약해줘.\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"요약 중 오류 발생: {e}"

def analyze_political_leaning(text):
    """Gemini API를 사용하여 텍스트의 정치 성향을 분석합니다."""
    if not API_KEY:
        return "API 키가 설정되지 않았습니다."
    try:
        model = genai.GenerativeModel('gemini-pro')
        prompt = f"다음 뉴스 기사의 정치적 성향을 '진보', '중도', '보수' 중 하나로 분류하고, 그 이유를 한 문장으로 설명해줘.\n\n{text}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"정치 성향 분석 중 오류 발생: {e}"

