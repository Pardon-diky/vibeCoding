import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import SearchBar from './SearchBar';

interface HeaderProps {
    user: User | null;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
    const [nickname, setNickname] = useState<string>('');

    // 사용자 닉네임 가져오기
    useEffect(() => {
        const fetchNickname = async () => {
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setNickname(userData.nickname || '');
                }
            } catch (error) {
                console.error('닉네임 가져오기 실패:', error);
            }
        };

        fetchNickname();
    }, [user]);

    return (
        <header
            style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--gray-200)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: 'var(--shadow-sm)',
            }}
        >
            <div
                className="container"
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-4) 0',
                    maxWidth: '1200px',
                    margin: '0 auto',
                }}
            >
                {/* Logo */}
                <Link
                    to="/"
                    style={{
                        textDecoration: 'none',
                        color: 'var(--gray-900)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                    }}
                >
                    <div
                        style={{
                            width: '32px',
                            height: '32px',
                            background:
                                'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                        }}
                    >
                        N
                    </div>
                    <span
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                        }}
                    >
                        News Balance
                    </span>
                </Link>

                {/* Navigation */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-4)',
                    }}
                >
                    <SearchBar />

                    {user ? (
                        <>
                            <Link
                                to="/scrapped"
                                className="btn btn-secondary"
                                style={{ fontSize: '0.875rem' }}
                            >
                                📌 스크랩
                            </Link>
                            <Link
                                to="/mypage"
                                className="btn btn-outline"
                                style={{ fontSize: '0.875rem' }}
                            >
                                👤 마이페이지
                            </Link>

                            {/* User Profile */}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-2) var(--space-3)',
                                    background: 'var(--gray-100)',
                                    borderRadius: 'var(--radius-full)',
                                    fontSize: '0.875rem',
                                    color: 'var(--gray-700)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        background: 'var(--primary-500)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {(nickname || user.email || 'U')
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                                <span style={{ fontWeight: '500' }}>
                                    {nickname ||
                                        user.email?.split('@')[0] ||
                                        '사용자'}
                                </span>
                            </div>

                            <Link
                                to="/auth"
                                className="btn btn-outline"
                                style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--error-600)',
                                    borderColor: 'var(--error-600)',
                                }}
                            >
                                로그아웃
                            </Link>
                        </>
                    ) : (
                        <Link
                            to="/auth"
                            className="btn btn-primary"
                            style={{ fontSize: '0.875rem' }}
                        >
                            로그인
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
