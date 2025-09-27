import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import ScrappedNews from './components/ScrappedNews';
import Auth from './components/Auth';
import MyPage from './components/MyPage';

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
                <Header user={user} />
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
                                element={<NewsFeed user={user} />}
                            />
                            <Route
                                path="/scrapped"
                                element={<ScrappedNews user={user} />}
                            />
                            <Route path="/auth" element={<Auth />} />
                            <Route
                                path="/mypage"
                                element={<MyPage user={user} />}
                            />
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
