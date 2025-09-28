import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import ScrappedNews from './components/ScrappedNews';
import Auth from './components/Auth';
import { NewsArticle } from './types';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [minLoadingComplete, setMinLoadingComplete] = useState(false);
    const [scrappedNews, setScrappedNews] = useState<NewsArticle[]>([]);
    const [userPoliticalIndex, setUserPoliticalIndex] = useState<number | null>(
        null
    );
    const [userInitialPoliticalScore, setUserInitialPoliticalScore] = useState<
        number | null
    >(null);
    const [isConvertedToProfile, setIsConvertedToProfile] =
        useState<boolean>(false);

    // 스크랩된 뉴스에서 정치성향지수 계산
    const calculateUserPoliticalIndex = (
        scrappedArticles: NewsArticle[]
    ): number | null => {
        // 변환된 상태에서는 프로필 점수를 우선적으로 사용
        if (isConvertedToProfile && userInitialPoliticalScore !== null) {
            return userInitialPoliticalScore;
        }

        if (scrappedArticles.length === 0) {
            // 스크랩된 뉴스가 없으면 사용자의 초기 정치성향 점수 사용
            return userInitialPoliticalScore;
        }

        const validScores = scrappedArticles
            .filter(
                (article) =>
                    article.politicalScore &&
                    typeof article.politicalScore === 'number'
            )
            .map((article) => article.politicalScore as number);

        if (validScores.length === 0) {
            // 유효한 점수가 없으면 사용자의 초기 정치성향 점수 사용
            return userInitialPoliticalScore;
        }

        const averageScore =
            validScores.reduce((sum, score) => sum + score, 0) /
            validScores.length;
        return Math.round(averageScore);
    };

    // 스크랩된 뉴스 가져오기
    const fetchScrappedNews = async (firebaseUid: string) => {
        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users/firebase/${firebaseUid}/scraps`
            );

            if (response.ok) {
                const data = await response.json();
                setScrappedNews(data.scrapped_news || []);
            } else {
                console.error('스크랩된 뉴스 가져오기 실패');
            }
        } catch (error) {
            console.error('스크랩된 뉴스 가져오기 오류:', error);
        }
    };

    // 뉴스 스크랩 함수
    const handleScrapNews = async (article: NewsArticle) => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        const isAlreadyScrapped = scrappedNews.some(
            (scrapped) => scrapped.id === article.id
        );

        try {
            const action = isAlreadyScrapped ? 'remove' : 'add';
            const response = await fetch(
                `http://127.0.0.1:8000/users/firebase/${user.uid}/scraps`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        article_id: article.id,
                        action: action,
                    }),
                }
            );

            if (response.ok) {
                if (isAlreadyScrapped) {
                    // 이미 스크랩된 경우 제거
                    const updatedScrapped = scrappedNews.filter(
                        (scrapped) => scrapped.id !== article.id
                    );
                    setScrappedNews(updatedScrapped);

                    // 변환된 상태가 아니면 활동기반 점수 업데이트
                    if (!isConvertedToProfile) {
                        setUserPoliticalIndex(
                            calculateUserPoliticalIndex(updatedScrapped)
                        );
                    }
                } else {
                    // 새로 스크랩
                    const updatedScrapped = [...scrappedNews, article];
                    setScrappedNews(updatedScrapped);

                    // 변환된 상태가 아니면 활동기반 점수 업데이트
                    if (!isConvertedToProfile) {
                        setUserPoliticalIndex(
                            calculateUserPoliticalIndex(updatedScrapped)
                        );
                    }
                }
            } else {
                throw new Error('스크랩 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('스크랩 처리 오류:', error);
            alert('스크랩 처리 중 오류가 발생했습니다.');
        }
    };

    // 활동기반정치성향지수를 프로필정치성향지수로 변환하는 함수
    const convertActivityToProfile = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        if (scrappedNews.length === 0) {
            alert(
                '스크랩한 뉴스가 없습니다. 최소 1개 이상의 뉴스를 스크랩해주세요.'
            );
            return;
        }

        // 현재 활동기반 점수 계산 (변환 상태와 관계없이 실제 스크랩된 뉴스에서 계산)
        const validScores = scrappedNews
            .filter(
                (article) =>
                    article.politicalScore &&
                    typeof article.politicalScore === 'number'
            )
            .map((article) => article.politicalScore as number);

        if (validScores.length === 0) {
            alert('유효한 정치성향 점수가 있는 뉴스가 없습니다.');
            return;
        }

        const currentActivityScore = Math.round(
            validScores.reduce((sum, score) => sum + score, 0) /
                validScores.length
        );

        try {
            const response = await fetch(
                `http://127.0.0.1:8000/users/firebase/${user.uid}/political-score`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        political_score: currentActivityScore,
                    }),
                }
            );

            if (response.ok) {
                const result = await response.json();
                // 프로필 점수를 현재 활동기반 점수로 업데이트
                setUserInitialPoliticalScore(currentActivityScore);
                // 변환 상태 설정
                setIsConvertedToProfile(true);
                // localStorage에 변환 상태 저장
                localStorage.setItem('isConvertedToProfile', 'true');
                alert(
                    `프로필정치성향지수가 ${currentActivityScore}점으로 업데이트되었습니다!`
                );
                console.log('정치성향 점수 업데이트 성공:', result);
            } else {
                throw new Error('서버 응답 오류');
            }
        } catch (error) {
            console.error('정치성향 점수 업데이트 실패:', error);
            alert('정치성향 점수 업데이트에 실패했습니다. 다시 시도해주세요.');
        }
    };

    useEffect(() => {
        // 최소 로딩 시간 설정 (500ms)
        const minLoadingTimer = setTimeout(() => {
            setMinLoadingComplete(true);
        }, 500);

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // 기본값으로 먼저 설정하여 빠른 로딩
                setUserInitialPoliticalScore(50);
                setUserPoliticalIndex(50);

                // 백그라운드에서 사용자 정보 가져오기 (비동기, 3초 타임아웃)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                fetch(`http://127.0.0.1:8000/users/firebase/${user.uid}`, {
                    signal: controller.signal,
                })
                    .then((response) => {
                        clearTimeout(timeoutId);
                        if (response.ok) {
                            return response.json();
                        }
                        throw new Error('API 호출 실패');
                    })
                    .then((userData) => {
                        const score = userData.political_leaning_score || 50;
                        setUserInitialPoliticalScore(score);
                        setUserPoliticalIndex(score);

                        // 변환 상태 확인
                        const isConverted =
                            localStorage.getItem('isConvertedToProfile') ===
                            'true';
                        setIsConvertedToProfile(isConverted);

                        // 스크랩된 뉴스 가져오기
                        fetchScrappedNews(user.uid);
                    })
                    .catch((error) => {
                        clearTimeout(timeoutId);
                        if (error.name !== 'AbortError') {
                            console.warn(
                                '사용자 정보 가져오기 실패, 기본값 사용:',
                                error
                            );
                        }
                    });
            } else {
                setUserInitialPoliticalScore(null);
                setUserPoliticalIndex(null);
            }

            // 최소 로딩 시간이 지났으면 로딩 완료
            if (minLoadingComplete) {
                setLoading(false);
            }
        });

        return () => {
            clearTimeout(minLoadingTimer);
            unsubscribe();
        };
    }, [minLoadingComplete]);

    // 최소 로딩 시간이 지나면 로딩 완료
    useEffect(() => {
        if (minLoadingComplete && user !== null) {
            setLoading(false);
        }
    }, [minLoadingComplete, user]);

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    background:
                        'linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%)',
                    color: 'var(--gray-700)',
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
                        fontWeight: '500',
                        margin: 0,
                    }}
                >
                    News Balance를 불러오는 중...
                </p>
            </div>
        );
    }

    return (
        <Router>
            <div
                className="App"
                style={{
                    minHeight: '100vh',
                    background: 'var(--gray-50)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <Header
                    user={user}
                    userPoliticalIndex={userInitialPoliticalScore}
                    scrappedCount={scrappedNews.length}
                />
                <main
                    className="container"
                    style={{
                        paddingTop: 'var(--space-10)',
                        paddingBottom: 'var(--space-10)',
                        paddingLeft: 'var(--space-6)',
                        paddingRight: 'var(--space-6)',
                        flex: '1', // 남은 공간을 모두 차지
                    }}
                >
                    <div className="fade-in">
                        <Routes>
                            <Route
                                path="/"
                                element={
                                    <NewsFeed
                                        user={user}
                                        onScrap={handleScrapNews}
                                        scrappedNews={scrappedNews}
                                        isConvertedToProfile={
                                            isConvertedToProfile
                                        }
                                        userPoliticalIndex={userPoliticalIndex}
                                        userInitialPoliticalScore={
                                            userInitialPoliticalScore
                                        }
                                        onConvertToProfile={
                                            convertActivityToProfile
                                        }
                                    />
                                }
                            />
                            <Route
                                path="/scrapped"
                                element={
                                    <ScrappedNews
                                        user={user}
                                        scrappedNews={scrappedNews}
                                        onScrap={handleScrapNews}
                                        isConvertedToProfile={
                                            isConvertedToProfile
                                        }
                                        userPoliticalIndex={userPoliticalIndex}
                                        userInitialPoliticalScore={
                                            userInitialPoliticalScore
                                        }
                                    />
                                }
                            />
                            <Route path="/auth" element={<Auth />} />
                        </Routes>
                    </div>
                </main>

                {/* 푸터 */}
                <footer
                    style={{
                        background:
                            'linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%)',
                        color: 'white',
                        padding: 'var(--space-6) 0',
                        borderTop: '1px solid var(--primary-200)',
                    }}
                >
                    <div className="container">
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 'var(--space-4)',
                                textAlign: 'center',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '1.5rem',
                                        fontWeight: '700',
                                        color: 'white',
                                    }}
                                >
                                    📰 News Balance
                                </span>
                            </div>

                            <div
                                style={{
                                    maxWidth: '600px',
                                    lineHeight: '1.6',
                                }}
                            >
                                <p
                                    style={{
                                        margin: '0 0 var(--space-2) 0',
                                        fontSize: '0.9rem',
                                        opacity: 0.9,
                                    }}
                                >
                                    이 웹사이트는 <strong>학습 목적</strong>으로
                                    제작되었습니다.
                                </p>
                                <p
                                    style={{
                                        margin: '0',
                                        fontSize: '0.8rem',
                                        opacity: 0.8,
                                    }}
                                >
                                    수익성 목표가 아닌 학생들의 웹 개발 학습 및
                                    뉴스 분석 기술 습득을 위한 교육용
                                    프로젝트입니다.
                                </p>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    fontSize: '0.8rem',
                                    opacity: 0.8,
                                }}
                            >
                                <span>🎓 교육용 프로젝트</span>
                                <span>•</span>
                                <span>📚 학습 목적</span>
                                <span>•</span>
                                <span>🚫 수익성 없음</span>
                            </div>

                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    opacity: 0.7,
                                    marginTop: 'var(--space-2)',
                                }}
                            >
                                © 2025 News Balance - Educational Project
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </Router>
    );
}

export default App;
