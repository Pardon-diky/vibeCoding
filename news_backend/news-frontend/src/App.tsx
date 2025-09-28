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

    // 스크랩된 뉴스에서 정치성향지수 계산
    const calculateUserPoliticalIndex = (
        scrappedArticles: NewsArticle[]
    ): number | null => {
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

    // 뉴스 스크랩 함수
    const handleScrapNews = (article: NewsArticle) => {
        const isAlreadyScrapped = scrappedNews.some(
            (scrapped) => scrapped.id === article.id
        );

        if (isAlreadyScrapped) {
            // 이미 스크랩된 경우 제거
            const updatedScrapped = scrappedNews.filter(
                (scrapped) => scrapped.id !== article.id
            );
            setScrappedNews(updatedScrapped);
            setUserPoliticalIndex(calculateUserPoliticalIndex(updatedScrapped));
        } else {
            // 새로 스크랩
            const updatedScrapped = [...scrappedNews, article];
            setScrappedNews(updatedScrapped);
            setUserPoliticalIndex(calculateUserPoliticalIndex(updatedScrapped));
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
                    userPoliticalIndex={userPoliticalIndex}
                    scrappedCount={scrappedNews.length}
                />
                <main
                    className="container"
                    style={{
                        paddingTop: 'var(--space-8)',
                        paddingBottom: 'var(--space-8)',
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
