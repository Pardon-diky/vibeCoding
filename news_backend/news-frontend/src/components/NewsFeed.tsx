import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import NewsItem from './NewsItem';
import PoliticalGuidelineModal from './PoliticalGuidelineModal';
import { NewsArticle } from '../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface NewsFeedProps {
    user: User | null;
    onScrap?: (article: NewsArticle) => void;
    scrappedNews?: NewsArticle[];
    isConvertedToProfile?: boolean;
    userPoliticalIndex?: number | null;
    userInitialPoliticalScore?: number | null;
    onConvertToProfile?: () => void;
}

const NewsFeed: React.FC<NewsFeedProps> = ({
    user,
    onScrap,
    scrappedNews = [],
    isConvertedToProfile = false,
    userPoliticalIndex = null,
    userInitialPoliticalScore = null,
    onConvertToProfile,
}) => {
    const [articles, setArticles] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [userPoliticalLeaning, setUserPoliticalLeaning] =
        useState<string>('');
    const [userPoliticalScore, setUserPoliticalScore] = useState<number>(50);
    const [activityPoliticalScore, setActivityPoliticalScore] =
        useState<number>(50);
    const [balancedArticles, setBalancedArticles] = useState<NewsArticle[]>([]);
    const [isGuidelineModalOpen, setIsGuidelineModalOpen] =
        useState<boolean>(false);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [searchResults, setSearchResults] = useState<NewsArticle[]>([]);
    const [isSearching, setIsSearching] = useState<boolean>(false);
    const [showSearchResults, setShowSearchResults] = useState<boolean>(false);

    // 활동 기반 정치성향 계산 함수
    const calculateActivityPoliticalScore = () => {
        if (scrappedNews.length === 0) return 50; // 기본값

        let totalScore = 0;
        let validArticles = 0;

        scrappedNews.forEach((article) => {
            if (
                article.politicalScore &&
                typeof article.politicalScore === 'number'
            ) {
                // politicalScore를 직접 사용 (1-100, 1=보수, 100=진보)
                totalScore += article.politicalScore;
                validArticles++;
            }
        });

        return validArticles > 0 ? Math.round(totalScore / validArticles) : 50;
    };

    // 정치성향 점수에 따른 색상
    const getPoliticalColor = (score: number) => {
        if (score <= 45) return '#dc2626'; // 보수 - 빨간색
        if (score >= 56) return '#2563eb'; // 진보 - 파란색
        return '#6b7280'; // 중립 - 회색
    };

    // 정치성향 점수에 따른 텍스트
    const getPoliticalText = (score: number) => {
        if (score <= 45) return '보수';
        if (score >= 56) return '진보';
        return '중립';
    };

    // 원형 그래프 컴포넌트
    const CircularChart = ({
        score,
        title,
        size = 120,
    }: {
        score: number;
        title: string;
        size?: number;
    }) => {
        const radius = (size - 20) / 2;
        const circumference = 2 * Math.PI * radius;
        const strokeDasharray = circumference;
        const strokeDashoffset = circumference - (score / 100) * circumference;

        return (
            <div style={{ textAlign: 'center', margin: '0 20px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <svg
                        width={size}
                        height={size}
                        style={{ transform: 'rotate(-90deg)' }}
                    >
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
                            style={{
                                transition:
                                    'stroke-dashoffset 0.5s ease-in-out',
                            }}
                        />
                    </svg>
                    {/* 중앙 텍스트 */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: getPoliticalColor(score),
                            }}
                        >
                            {score}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {getPoliticalText(score)}
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        marginTop: '10px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                    }}
                >
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
                    console.log(
                        'NewsFeed: 사용자 데이터 가져오기 시작',
                        user.uid
                    );
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('NewsFeed: 사용자 데이터', userData);

                        // 회원가입 시 설정한 기본 정치성향 지수 사용
                        const politicalScore = userData.politicalScore || 50;
                        const politicalAffiliation =
                            userData.politicalAffiliation || 'neutral';

                        setUserPoliticalLeaning(politicalAffiliation);
                        setUserPoliticalScore(politicalScore);

                        // 저장된 활동 기반 점수가 있으면 사용
                        const savedActivityScore = userData.activityScore;
                        if (savedActivityScore !== undefined) {
                            setActivityPoliticalScore(savedActivityScore);
                        }

                        console.log(
                            'NewsFeed: 설정된 정치성향 점수',
                            politicalScore
                        );
                        console.log(
                            'NewsFeed: 설정된 정치성향 분류',
                            politicalAffiliation
                        );
                        console.log(
                            'NewsFeed: 활동 기반 점수',
                            savedActivityScore
                        );
                    }
                } catch (error) {
                    console.error(
                        'Error fetching user political leaning:',
                        error
                    );
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
                        const userDoc = await getDoc(
                            doc(db, 'users', user.uid)
                        );
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            setUserPoliticalScore(
                                userData.politicalScore || 50
                            );
                            setUserPoliticalLeaning(
                                userData.politicalAffiliation || 'neutral'
                            );
                            setActivityPoliticalScore(
                                userData.activityScore || 50
                            );
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
        if (user && scrappedNews.length > 0) {
            const calculateAndSaveActivityScore = async () => {
                const activityScore = calculateActivityPoliticalScore();
                setActivityPoliticalScore(activityScore);

                // Firestore에 활동 기반 점수 저장
                if (activityScore !== 50) {
                    try {
                        await setDoc(
                            doc(db, 'users', user.uid),
                            {
                                activityScore: activityScore,
                            },
                            { merge: true }
                        );
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
    }, [user, scrappedNews]);

    useEffect(() => {
        fetchNews();
    }, []);

    // 프로필 지수가 변경될 때 균형 잡힌 뉴스 업데이트
    useEffect(() => {
        if (userInitialPoliticalScore && articles.length > 0) {
            const balanced = getBalancedNews(
                articles,
                userInitialPoliticalScore
            );
            setBalancedArticles(balanced);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userInitialPoliticalScore, articles]);

    // 균형 잡힌 뉴스 추천 함수
    // 프로필 지수 기반 60:40 비율 뉴스 추천 함수
    const getBalancedNews = (
        articles: NewsArticle[],
        userProfileScore: number | null
    ) => {
        if (!userProfileScore) return articles;

        // 각 뉴스를 프로필 지수와의 차이로 분류
        const articlesWithDifference = articles.map((article) => ({
            ...article,
            scoreDifference: Math.abs(
                (article.politicalScore || 50) - userProfileScore
            ),
        }));

        // 프로필 지수와의 차이가 15 이하인 뉴스 (비슷한 성향)
        const similarArticles = articlesWithDifference
            .filter((article) => article.scoreDifference <= 15)
            .sort((a, b) => a.scoreDifference - b.scoreDifference);

        // 프로필 지수와의 차이가 15 초과인 뉴스 (반대 성향)
        const oppositeArticles = articlesWithDifference
            .filter((article) => article.scoreDifference > 15)
            .sort((a, b) => b.scoreDifference - a.scoreDifference);

        // 60:40 비율로 뉴스 선택
        const totalCount = Math.min(articles.length, 20); // 최대 20개
        const similarCount = Math.ceil(totalCount * 0.6); // 60%
        const oppositeCount = totalCount - similarCount; // 40%

        const selectedSimilar = similarArticles.slice(0, similarCount);
        const selectedOpposite = oppositeArticles.slice(0, oppositeCount);

        // 선택된 뉴스들을 섞어서 반환
        const mixedArticles = [...selectedSimilar, ...selectedOpposite];
        return mixedArticles.sort(() => Math.random() - 0.5);
    };

    const handleScrap = (article: NewsArticle) => {
        if (scrappedNews.find((a: NewsArticle) => a.id === article.id)) {
            alert('이미 스크랩한 기사입니다.');
            return;
        }
        if (onScrap) {
            onScrap(article);
            alert('기사를 스크랩했습니다.');
        }
    };

    // 검색 함수
    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setShowSearchResults(false);
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        setShowSearchResults(true);

        try {
            const response = await fetch(
                `http://localhost:8000/news/search?q=${encodeURIComponent(
                    query
                )}`
            );

            if (!response.ok) {
                throw new Error('검색 요청 실패');
            }

            const results = await response.json();
            setSearchResults(results);
        } catch (error) {
            console.error('검색 오류:', error);
            alert('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // Serper API를 사용해서 뉴스 새로고침
    const refreshNewsWithSerper = async () => {
        setRefreshing(true);
        try {
            console.log('Refreshing news with Serper API...');
            const response = await fetch(
                'http://localhost:8000/news/serper/refresh',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const result = await response.json();
            console.log('Serper refresh result:', result);

            // 새로고침 후 기존 뉴스 다시 가져오기
            await fetchNews();

            alert(`새로운 뉴스 ${result.news_count}개를 가져왔습니다!`);
        } catch (error) {
            console.error('Error refreshing news with Serper:', error);
            alert('뉴스 새로고침에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setRefreshing(false);
        }
    };

    // 검색 이벤트 리스너 등록
    useEffect(() => {
        const handleSearchEvent = (event: CustomEvent) => {
            const { query } = event.detail;
            handleSearch(query);
        };

        window.addEventListener('search', handleSearchEvent as EventListener);

        return () => {
            window.removeEventListener(
                'search',
                handleSearchEvent as EventListener
            );
        };
    }, []);

    // 뉴스 가져오기 함수 (기존 fetchNews를 별도 함수로 분리)
    const fetchNews = async () => {
        try {
            console.log('Fetching news from API...');
            const response = await fetch(
                'http://localhost:8000/news/political'
            );
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
                imageUrl: item.image_url || 'https://via.placeholder.com/150', // 이미지 URL 사용
                summary:
                    item.summary &&
                    item.summary !== 'API 키가 설정되지 않았습니다.'
                        ? item.summary
                        : item.title, // summary가 없거나 API 키 오류면 title로 대체
                publishedAt: item.created_at, // created_at을 publishedAt에 매핑
                url: item.url, // 뉴스 원문 URL
                politicalLeaning: item.political_leaning, // 정치 성향
                politicalScore: item.political_score || null, // 정치성향 점수 (1-100)
                neutralityScore: item.neutrality_score, // 중립지수
            }));

            console.log('Formatted data:', formattedData);
            setArticles(formattedData);

            // 균형 잡힌 뉴스 추천
            if (userInitialPoliticalScore) {
                const balanced = getBalancedNews(
                    formattedData,
                    userInitialPoliticalScore
                );
                setBalancedArticles(balanced);
            }
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            {loading ? (
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--space-16)',
                        textAlign: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '48px',
                            height: '48px',
                            border: '4px solid var(--gray-200)',
                            borderTop: '4px solid var(--primary-600)',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            marginBottom: 'var(--space-4)',
                        }}
                    ></div>
                    <p
                        style={{
                            fontSize: '1.125rem',
                            color: 'var(--gray-600)',
                            margin: 0,
                        }}
                    >
                        뉴스를 불러오는 중입니다...
                    </p>
                </div>
            ) : (
                <>
                    {/* 정치성향 지수 시각화 섹션 */}
                    {user && (
                        <div
                            className="card"
                            style={{
                                background:
                                    'linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%)',
                                border: 'none',
                                marginBottom: 'var(--space-8)',
                                padding: 'var(--space-20) var(--space-24)',
                            }}
                        >
                            <div
                                style={{
                                    textAlign: 'center',
                                    marginBottom: 'var(--space-8)',
                                }}
                            >
                                <h3
                                    style={{
                                        margin: '0 0 var(--space-2) 0',
                                        color: 'var(--gray-900)',
                                        fontSize: '1.875rem',
                                        fontWeight: '700',
                                        background:
                                            'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                    }}
                                >
                                    📊 나의 정치성향 분석
                                </h3>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: 'var(--space-2)',
                                        fontSize: '0.9rem',
                                        color: 'var(--gray-600)',
                                    }}
                                >
                                    <span>🤖 AI 기반 자동 분석</span>
                                    <span>•</span>
                                    <button
                                        onClick={() =>
                                            setIsGuidelineModalOpen(true)
                                        }
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--primary-600)',
                                            textDecoration: 'underline',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '500',
                                            transition:
                                                'color var(--transition-normal)',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color =
                                                'var(--primary-700)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color =
                                                'var(--primary-600)';
                                        }}
                                    >
                                        📋 분석 가이드라인 보기
                                    </button>
                                </div>
                                <p
                                    style={{
                                        margin: 'var(--space-2) 0 0 0',
                                        fontSize: '0.8rem',
                                        color: 'var(--gray-500)',
                                        fontStyle: 'italic',
                                    }}
                                >
                                    개인의 특정 정치적 의도나 편향은 전혀
                                    없습니다
                                </p>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flexWrap: 'wrap',
                                    gap: 'var(--space-8)',
                                }}
                            >
                                <CircularChart
                                    score={userInitialPoliticalScore || 50}
                                    title="프로필 정치성향 지수"
                                    size={160}
                                />
                                <CircularChart
                                    score={
                                        isConvertedToProfile
                                            ? calculateActivityPoliticalScore()
                                            : userPoliticalIndex || 50
                                    }
                                    title="활동 기반 정치성향 지수"
                                    size={160}
                                />
                            </div>

                            {/* 변환 버튼 */}
                            {user &&
                                scrappedNews.length > 0 &&
                                onConvertToProfile && (
                                    <div
                                        style={{
                                            marginTop: 'var(--space-6)',
                                            textAlign: 'center',
                                        }}
                                    >
                                        <button
                                            onClick={onConvertToProfile}
                                            style={{
                                                padding:
                                                    'var(--space-3) var(--space-6)',
                                                background:
                                                    'linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius:
                                                    'var(--radius-lg)',
                                                fontSize: '1rem',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                boxShadow:
                                                    '0 4px 12px rgba(34, 197, 94, 0.3)',
                                                transition: 'all 0.3s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform =
                                                    'translateY(-2px)';
                                                e.currentTarget.style.boxShadow =
                                                    '0 6px 20px rgba(34, 197, 94, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform =
                                                    'translateY(0)';
                                                e.currentTarget.style.boxShadow =
                                                    '0 4px 12px rgba(34, 197, 94, 0.3)';
                                            }}
                                        >
                                            🔄 활동지수를 프로필 지수로 변환하기
                                        </button>
                                    </div>
                                )}

                            <div
                                style={{
                                    marginTop: 'var(--space-6)',
                                    textAlign: 'center',
                                    fontSize: '0.875rem',
                                    color: 'var(--gray-600)',
                                    background: 'rgba(255, 255, 255, 0.7)',
                                    padding: 'var(--space-4)',
                                    borderRadius: 'var(--radius-lg)',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <p style={{ margin: 0 }}>
                                    <strong
                                        style={{ color: 'var(--primary-600)' }}
                                    >
                                        프로필 지수
                                    </strong>
                                    : 회원가입 시 설정한 기본 정치성향 |
                                    <strong
                                        style={{ color: 'var(--primary-600)' }}
                                    >
                                        {' '}
                                        활동 지수
                                    </strong>
                                    : 스크랩한 뉴스 분석 결과
                                </p>
                            </div>
                        </div>
                    )}

                    {/* 검색 결과 섹션 */}
                    {showSearchResults && (
                        <div
                            className="card"
                            style={{
                                background: 'white',
                                border: '1px solid var(--primary-200)',
                                marginBottom: 'var(--space-8)',
                                padding: 'var(--space-8)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    marginBottom: 'var(--space-6)',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-4)',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            background:
                                                'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
                                            borderRadius: 'var(--radius-lg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                        }}
                                    >
                                        🔍
                                    </div>
                                    <div>
                                        <h4
                                            style={{
                                                margin: 0,
                                                fontSize: '1.5rem',
                                                fontWeight: '700',
                                                color: 'var(--gray-900)',
                                            }}
                                        >
                                            🔍 검색 결과
                                        </h4>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '0.875rem',
                                                color: 'var(--gray-600)',
                                            }}
                                        >
                                            "{searchQuery}"에 대한 검색 결과 (
                                            {searchResults.length}개)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowSearchResults(false);
                                        setSearchQuery('');
                                        setSearchResults([]);
                                    }}
                                    style={{
                                        background: 'var(--gray-100)',
                                        border: '1px solid var(--gray-300)',
                                        borderRadius: 'var(--radius-md)',
                                        padding:
                                            'var(--space-2) var(--space-4)',
                                        color: 'var(--gray-700)',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: '500',
                                        transition:
                                            'all var(--transition-fast)',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background =
                                            'var(--gray-200)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background =
                                            'var(--gray-100)';
                                    }}
                                >
                                    ✕ 검색 닫기
                                </button>
                            </div>

                            {isSearching ? (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: 'var(--space-12)',
                                        color: 'var(--gray-600)',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            border: '4px solid var(--gray-200)',
                                            borderTop:
                                                '4px solid var(--primary-500)',
                                            borderRadius: '50%',
                                            animation:
                                                'spin 1s linear infinite',
                                            margin: '0 auto var(--space-4)',
                                        }}
                                    />
                                    검색 중...
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fit, minmax(600px, 1fr))',
                                        gap: 'var(--space-8)',
                                        marginBottom: 'var(--space-8)',
                                        maxWidth: '1600px',
                                        margin: '0 auto var(--space-8)',
                                    }}
                                >
                                    {searchResults.map((article) => (
                                        <div
                                            key={`search-${article.id}`}
                                            className="fade-in"
                                            style={{
                                                animationDelay: '0.1s',
                                            }}
                                        >
                                            <NewsItem
                                                article={article}
                                                onScrap={onScrap || handleScrap}
                                                isScrapped={scrappedNews.some(
                                                    (scrapped) =>
                                                        scrapped.id ===
                                                        article.id
                                                )}
                                                userProfileScore={null} // 검색 결과는 추천 라벨 없음
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: 'var(--space-12)',
                                        color: 'var(--gray-500)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '3rem',
                                            marginBottom: 'var(--space-4)',
                                        }}
                                    >
                                        🔍
                                    </div>
                                    <h3
                                        style={{
                                            margin: '0 0 var(--space-2) 0',
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: 'var(--gray-700)',
                                        }}
                                    >
                                        검색 결과가 없습니다
                                    </h3>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: '0.875rem',
                                        }}
                                    >
                                        다른 키워드로 검색해보세요
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 균형 잡힌 뉴스 추천 섹션 */}
                    {!showSearchResults &&
                        user &&
                        balancedArticles.length > 0 && (
                            <div style={{ marginBottom: 'var(--space-8)' }}>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--space-3)',
                                        marginBottom: 'var(--space-6)',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            background:
                                                'linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%)',
                                            borderRadius: 'var(--radius-lg)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.25rem',
                                        }}
                                    >
                                        🔄
                                    </div>
                                    <div>
                                        <h4
                                            style={{
                                                margin: 0,
                                                fontSize: '1.5rem',
                                                fontWeight: '700',
                                                color: 'var(--gray-900)',
                                            }}
                                        >
                                            🎯 맞춤 뉴스 추천
                                        </h4>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '0.875rem',
                                                color: 'var(--gray-600)',
                                            }}
                                        >
                                            사용자님의 프로필에 맞춘 60:40 균형
                                            뉴스 추천
                                        </p>
                                    </div>
                                </div>
                                <div
                                    style={{
                                        display: 'grid',
                                        gridTemplateColumns:
                                            'repeat(auto-fit, minmax(600px, 1fr))',
                                        gap: 'var(--space-8)',
                                        marginBottom: 'var(--space-8)',
                                        maxWidth: '1600px',
                                        margin: '0 auto var(--space-8)',
                                    }}
                                >
                                    {balancedArticles.map((article) => (
                                        <div
                                            key={`balanced-${article.id}`}
                                            className="fade-in"
                                        >
                                            <NewsItem
                                                article={article}
                                                onScrap={onScrap || handleScrap}
                                                isScrapped={scrappedNews.some(
                                                    (scrapped) =>
                                                        scrapped.id ===
                                                        article.id
                                                )}
                                                userProfileScore={
                                                    userInitialPoliticalScore
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    {/* 정치 뉴스 섹션 */}
                    <div
                        className="card"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-6)',
                            padding: 'var(--space-12)',
                            background:
                                'linear-gradient(135deg, var(--blue-50) 0%, var(--gray-50) 100%)',
                            border: 'none',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-3)',
                            }}
                        >
                            <div
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    background:
                                        'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.25rem',
                                }}
                            >
                                🏛️
                            </div>
                            <h4
                                style={{
                                    margin: 0,
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: 'var(--gray-900)',
                                }}
                            >
                                📰 일반 정치 뉴스
                            </h4>
                        </div>
                        <button
                            onClick={refreshNewsWithSerper}
                            disabled={refreshing}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-2)',
                                padding: 'var(--space-3) var(--space-4)',
                                background: refreshing
                                    ? 'var(--gray-300)'
                                    : 'linear-gradient(135deg, var(--success-500) 0%, var(--success-600) 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: refreshing ? 'not-allowed' : 'pointer',
                                transition: 'all var(--transition-normal)',
                                opacity: refreshing ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!refreshing) {
                                    e.currentTarget.style.transform =
                                        'translateY(-1px)';
                                    e.currentTarget.style.boxShadow =
                                        '0 4px 12px rgba(0, 0, 0, 0.15)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!refreshing) {
                                    e.currentTarget.style.transform =
                                        'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }}
                        >
                            {refreshing ? (
                                <>
                                    <div
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            border: '2px solid transparent',
                                            borderTop: '2px solid white',
                                            borderRadius: '50%',
                                            animation:
                                                'spin 1s linear infinite',
                                        }}
                                    />
                                    새로고침 중...
                                </>
                            ) : (
                                <>🔄 Serper API로 새로고침</>
                            )}
                        </button>
                    </div>

                    {articles.length > 0 ? (
                        <div
                            className="card"
                            style={{
                                padding: 'var(--space-12)',
                                background: 'white',
                                border: 'none',
                            }}
                        >
                            <div className="grid grid-cols-1 gap-6">
                                {articles
                                    .sort(() => Math.random() - 0.5) // 랜덤 섞기
                                    .map((article, index) => (
                                        <div
                                            key={article.id}
                                            className="fade-in"
                                            style={{
                                                animationDelay: `${
                                                    index * 0.1
                                                }s`,
                                            }}
                                        >
                                            <NewsItem
                                                article={article}
                                                onScrap={onScrap || handleScrap}
                                                isScrapped={scrappedNews.some(
                                                    (scrapped) =>
                                                        scrapped.id ===
                                                        article.id
                                                )}
                                                userProfileScore={null} // 일반 뉴스는 추천 라벨 없음
                                            />
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="card"
                            style={{
                                textAlign: 'center',
                                padding: 'var(--space-12)',
                                background: 'var(--gray-50)',
                                border: '2px dashed var(--gray-300)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '3rem',
                                    marginBottom: 'var(--space-4)',
                                }}
                            >
                                📰
                            </div>
                            <h3
                                style={{
                                    margin: 0,
                                    fontSize: '1.25rem',
                                    color: 'var(--gray-600)',
                                    marginBottom: 'var(--space-2)',
                                }}
                            >
                                뉴스가 없습니다
                            </h3>
                            <p
                                style={{
                                    margin: 0,
                                    color: 'var(--gray-500)',
                                    fontSize: '0.875rem',
                                }}
                            >
                                잠시 후 다시 시도해주세요
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* 가이드라인 모달 */}
            <PoliticalGuidelineModal
                isOpen={isGuidelineModalOpen}
                onClose={() => setIsGuidelineModalOpen(false)}
            />
        </div>
    );
};

export default NewsFeed;
