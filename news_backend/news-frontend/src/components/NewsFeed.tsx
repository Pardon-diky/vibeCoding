import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import NewsItem from './NewsItem';
import { NewsArticle } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface NewsFeedProps {
  user: User | null;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ user }) => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [scrappedArticles, setScrappedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userPoliticalLeaning, setUserPoliticalLeaning] = useState<string>('');
  const [userPoliticalScore, setUserPoliticalScore] = useState<number>(50);
  const [activityPoliticalScore, setActivityPoliticalScore] = useState<number>(50);
  const [balancedArticles, setBalancedArticles] = useState<NewsArticle[]>([]);

  // 활동 기반 정치성향 계산 함수
  const calculateActivityPoliticalScore = () => {
    if (scrappedArticles.length === 0) return 50; // 기본값
    
    let totalScore = 0;
    let validArticles = 0;
    
    scrappedArticles.forEach(article => {
      if (article.neutralityScore && article.neutralityScore !== 50) {
        // 중립지수를 정치성향 점수로 변환
        // 중립지수가 낮을수록(편향적일수록) 극단적인 정치성향으로 간주
        const neutrality = article.neutralityScore;
        let politicalScore = 50; // 기본 중립
        
        if (neutrality < 40) {
          // 매우 편향적 - 정치성향이 강함
          politicalScore = neutrality < 20 ? (neutrality < 10 ? 10 : 20) : 30;
        } else if (neutrality > 60) {
          // 중립적 - 정치성향이 약함
          politicalScore = neutrality > 80 ? 50 : 45;
        }
        
        totalScore += politicalScore;
        validArticles++;
      }
    });
    
    return validArticles > 0 ? Math.round(totalScore / validArticles) : 50;
  };

  // 정치성향 점수에 따른 색상
  const getPoliticalColor = (score: number) => {
    if (score <= 30) return '#ff6b6b'; // 진보 - 빨간색
    if (score >= 70) return '#4dabf7'; // 보수 - 파란색
    return '#51cf66'; // 중립 - 초록색
  };

  // 정치성향 점수에 따른 텍스트
  const getPoliticalText = (score: number) => {
    if (score <= 30) return '진보';
    if (score >= 70) return '보수';
    return '중립';
  };

  // 원형 그래프 컴포넌트
  const CircularChart = ({ score, title, size = 120 }: { score: number; title: string; size?: number }) => {
    const radius = (size - 20) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    return (
      <div style={{ textAlign: 'center', margin: '0 20px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* 배경 원 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#e9ecef"
              strokeWidth="8"
            />
            {/* 진행 원 */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={getPoliticalColor(score)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          {/* 중앙 텍스트 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: getPoliticalColor(score) }}>
              {score}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {getPoliticalText(score)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '14px', fontWeight: 'bold' }}>
          {title}
        </div>
      </div>
    );
  };

  // 사용자의 기본 정치 성향 가져오기 (회원가입 시 설정한 값)
  useEffect(() => {
    if (user) {
      const getUserPoliticalLeaning = async () => {
        try {
          console.log('NewsFeed: 사용자 데이터 가져오기 시작', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('NewsFeed: 사용자 데이터', userData);
            
            // 회원가입 시 설정한 기본 정치성향 지수 사용
            const politicalScore = userData.politicalScore || 50;
            const politicalAffiliation = userData.politicalAffiliation || 'neutral';
            
            setUserPoliticalLeaning(politicalAffiliation);
            setUserPoliticalScore(politicalScore);
            
            // 저장된 활동 기반 점수가 있으면 사용
            const savedActivityScore = userData.activityScore;
            if (savedActivityScore !== undefined) {
              setActivityPoliticalScore(savedActivityScore);
            }
            
            console.log('NewsFeed: 설정된 정치성향 점수', politicalScore);
            console.log('NewsFeed: 설정된 정치성향 분류', politicalAffiliation);
            console.log('NewsFeed: 활동 기반 점수', savedActivityScore);
          }
        } catch (error) {
          console.error('Error fetching user political leaning:', error);
        }
      };
      getUserPoliticalLeaning();
    }
  }, [user]);

  // 페이지 포커스 시 데이터 새로고침 (마이페이지에서 돌아왔을 때)
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        const refreshData = async () => {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setUserPoliticalScore(userData.politicalScore || 50);
              setUserPoliticalLeaning(userData.politicalAffiliation || 'neutral');
              setActivityPoliticalScore(userData.activityScore || 50);
            }
          } catch (error) {
            console.error('데이터 새로고침 실패:', error);
          }
        };
        refreshData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user]);

  // 활동 기반 정치성향 계산 (스크랩한 뉴스가 변경될 때)
  useEffect(() => {
    if (user && scrappedArticles.length > 0) {
      const calculateAndSaveActivityScore = async () => {
        const activityScore = calculateActivityPoliticalScore();
        setActivityPoliticalScore(activityScore);
        
        // Firestore에 활동 기반 점수 저장
        if (activityScore !== 50) {
          try {
            await setDoc(doc(db, 'users', user.uid), {
              activityScore: activityScore
            }, { merge: true });
          } catch (error) {
            console.error('활동 점수 저장 실패:', error);
          }
        }
      };
      calculateAndSaveActivityScore();
    } else if (user) {
      // 스크랩한 뉴스가 없으면 기본값으로 설정
      setActivityPoliticalScore(50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, scrappedArticles]);

  useEffect(() => {
    const storedScrappedArticles = localStorage.getItem('scrappedNews');
    if (storedScrappedArticles) {
      setScrappedArticles(JSON.parse(storedScrappedArticles));
    }
    
    const fetchNews = async () => {
      try {
        console.log('Fetching news from API...');
        const response = await fetch('http://localhost:8000/news/political');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        console.log('Received data:', data);
        
        // 🚨 이 부분이 핵심입니다! 데이터를 NewsArticle 형식에 맞게 변환합니다.
        const formattedData: NewsArticle[] = data.map((item: any) => ({
            id: item.id.toString(), // id가 숫자일 경우 문자열로 변환
            title: item.title,
            source: item.source || '연합뉴스', // 실제 뉴스 매체명 사용
            imageUrl: 'https://via.placeholder.com/150', // 기본 이미지 사용
            summary: item.summary && item.summary !== 'API 키가 설정되지 않았습니다.' ? item.summary : item.title, // summary가 없거나 API 키 오류면 title로 대체
            publishedAt: item.created_at, // created_at을 publishedAt에 매핑
            url: item.url, // 뉴스 원문 URL
            politicalLeaning: item.political_leaning, // 정치 성향
            neutralityScore: item.neutrality_score, // 중립지수
        }));

        console.log('Formatted data:', formattedData);
        setArticles(formattedData);
        
        // 균형 잡힌 뉴스 추천
        if (userPoliticalLeaning) {
          const balanced = getBalancedNews(formattedData, userPoliticalLeaning);
          setBalancedArticles(balanced);
        }
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  // 사용자 정치 성향이 변경될 때 균형 잡힌 뉴스 업데이트
  useEffect(() => {
    if (userPoliticalLeaning && articles.length > 0) {
      const balanced = getBalancedNews(articles, userPoliticalLeaning);
      setBalancedArticles(balanced);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPoliticalLeaning, articles]);

  // 균형 잡힌 뉴스 추천 함수
  const getBalancedNews = (articles: NewsArticle[], userLeaning: string) => {
    const oppositeLeaning = userLeaning === 'conservative' ? 'progressive' : 
                           userLeaning === 'progressive' ? 'conservative' : 'neutral';
    
    // 반대 성향 뉴스 필터링
    const oppositeArticles = articles.filter(article => {
      if (!article.politicalLeaning || article.politicalLeaning === 'API 키가 설정되지 않았습니다.') {
        return false;
      }
      
      const lower = article.politicalLeaning.toLowerCase();
      if (oppositeLeaning === 'conservative') {
        return lower.includes('보수') || lower.includes('conservative');
      } else if (oppositeLeaning === 'progressive') {
        return lower.includes('진보') || lower.includes('progressive');
      }
      return false;
    });
    
    // 최대 3개까지 반환
    return oppositeArticles.slice(0, 3);
  };

  const handleScrap = (article: NewsArticle) => {
    if (scrappedArticles.find(a => a.id === article.id)) {
      alert('이미 스크랩한 기사입니다.');
      return;
    }
    const newScrappedArticles = [...scrappedArticles, article];
    setScrappedArticles(newScrappedArticles);
    localStorage.setItem('scrappedNews', JSON.stringify(newScrappedArticles));
    alert('기사를 스크랩했습니다.');
  };

  return (
    <div>
      {loading ? (
        <p>뉴스를 불러오는 중입니다...</p>
      ) : (
        <>
          {/* 정치성향 지수 시각화 섹션 */}
          {user && (
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '30px',
              borderRadius: '12px',
              marginBottom: '30px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ 
                textAlign: 'center', 
                marginBottom: '30px', 
                color: '#333',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                📊 나의 정치성향 분석
              </h3>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px'
              }}>
                <CircularChart 
                  score={userPoliticalScore} 
                  title="프로필 정치성향 지수"
                  size={140}
                />
                <CircularChart 
                  score={activityPoliticalScore} 
                  title="활동 기반 정치성향 지수"
                  size={140}
                />
              </div>
              <div style={{
                marginTop: '20px',
                textAlign: 'center',
                fontSize: '14px',
                color: '#666'
              }}>
                <p>
                  <strong>프로필 지수</strong>: 회원가입 시 설정한 기본 정치성향 | 
                  <strong> 활동 지수</strong>: 스크랩한 뉴스 분석 결과
                </p>
              </div>
            </div>
          )}
          
          {/* 균형 잡힌 뉴스 추천 섹션 */}
          {user && balancedArticles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-primary mb-3">
                🔄 균형 잡힌 뉴스 추천 
                <small className="text-muted ms-2">
                  ({userPoliticalLeaning === 'conservative' ? '진보' : 
                    userPoliticalLeaning === 'progressive' ? '보수' : '다양한'} 성향)
                </small>
              </h4>
              <div className="row">
                {balancedArticles.map(article => (
                  <div key={`balanced-${article.id}`} className="col-md-4 mb-3">
                    <NewsItem article={article} onScrap={handleScrap} />
                  </div>
                ))}
              </div>
              <hr className="my-4" />
            </div>
          )}
          
          {/* 정치 뉴스 섹션 */}
          <h4 className="mb-3">🏛️ 정치 뉴스</h4>
          {articles.length > 0 ? (
            articles.map(article => (
              <NewsItem key={article.id} article={article} onScrap={handleScrap} />
            ))
          ) : (
            <p>뉴스가 없습니다.</p>
          )}
        </>
      )}
    </div>
  );
};

export default NewsFeed;