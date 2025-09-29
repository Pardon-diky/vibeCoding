import React, { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { NewsArticle } from '../types';

interface MyPageProps {
    user: User | null;
    userPoliticalIndex: number | null;
    userInitialPoliticalScore: number | null;
    scrappedNews: NewsArticle[];
    isConvertedToProfile: boolean;
    onUpdateProfile?: () => void;
}

const MyPage: React.FC<MyPageProps> = ({
    user,
    userPoliticalIndex,
    userInitialPoliticalScore,
    scrappedNews,
    isConvertedToProfile,
    onUpdateProfile,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [editData, setEditData] = useState({
        nickname: '',
        name: '',
        politicalScore: 50,
    });

    // 사용자 데이터 가져오기
    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setUserData(data);
                    setEditData({
                        nickname: data.nickname || '',
                        name: data.name || '',
                        politicalScore:
                            data.political_leaning_score ||
                            data.politicalScore ||
                            50,
                    });
                }
            } catch (error) {
                console.error('사용자 데이터 가져오기 실패:', error);
            }
        };

        fetchUserData();
    }, [user]);

    // 정치 성향 점수에 따른 색상
    const getPoliticalColor = (score: number) => {
        if (score <= 45) return '#dc2626'; // 보수 - 빨간색
        if (score >= 56) return '#2563eb'; // 진보 - 파란색
        return '#6b7280'; // 중립 - 회색
    };

    // 정치 성향 점수에 따른 텍스트
    const getPoliticalText = (score: number) => {
        if (score <= 45) return '보수';
        if (score >= 56) return '진보';
        return '중립';
    };

    // 프로필 수정 저장
    const handleSaveProfile = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const politicalAffiliation =
                editData.politicalScore <= 45
                    ? 'conservative'
                    : editData.politicalScore >= 56
                    ? 'progressive'
                    : 'neutral';

            await updateDoc(doc(db, 'users', user.uid), {
                nickname: editData.nickname,
                name: editData.name,
                political_leaning_score: editData.politicalScore,
                politicalScore: editData.politicalScore, // 호환성
                politicalAffiliation: politicalAffiliation,
                lastUpdated: new Date().toISOString(),
            });

            // 백엔드에도 업데이트
            try {
                await fetch(
                    `http://127.0.0.1:8000/users/firebase/${user.uid}/political-score`,
                    {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            political_score: editData.politicalScore,
                        }),
                    }
                );
            } catch (backendError) {
                console.error('백엔드 업데이트 실패:', backendError);
            }

            setUserData((prev: any) => ({
                ...prev,
                nickname: editData.nickname,
                name: editData.name,
                political_leaning_score: editData.politicalScore,
                politicalScore: editData.politicalScore,
                politicalAffiliation: politicalAffiliation,
            }));

            setIsEditing(false);
            if (onUpdateProfile) {
                onUpdateProfile();
            }
            alert('프로필이 성공적으로 업데이트되었습니다!');
        } catch (error) {
            console.error('프로필 업데이트 실패:', error);
            alert('프로필 업데이트에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 로그아웃
    const handleLogout = async () => {
        try {
            await signOut(auth);
            window.location.href = '/';
        } catch (error) {
            console.error('로그아웃 실패:', error);
        }
    };

    if (!user || !userData) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    fontSize: '1.125rem',
                    color: 'var(--gray-600)',
                }}
            >
                로딩 중...
            </div>
        );
    }

    return (
        <div
            style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: 'var(--space-6)',
            }}
        >
            {/* 헤더 */}
            <div
                style={{
                    textAlign: 'center',
                    marginBottom: 'var(--space-8)',
                }}
            >
                <div
                    style={{
                        width: '100px',
                        height: '100px',
                        background:
                            'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--space-4)',
                        fontSize: '2.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {(userData.nickname || user.email || 'U')
                        .charAt(0)
                        .toUpperCase()}
                </div>
                <h1
                    style={{
                        margin: 0,
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--gray-900)',
                        marginBottom: 'var(--space-2)',
                    }}
                >
                    {userData.nickname || '닉네임 없음'}
                </h1>
                <p
                    style={{
                        margin: 0,
                        color: 'var(--gray-600)',
                        fontSize: '1rem',
                    }}
                >
                    {user.email}
                </p>
            </div>

            {/* 프로필 정보 카드 */}
            <div
                className="card"
                style={{
                    marginBottom: 'var(--space-6)',
                    padding: 'var(--space-6)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--space-6)',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                        }}
                    >
                        프로필 정보
                    </h2>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="btn btn-outline"
                        style={{ fontSize: '0.875rem' }}
                    >
                        {isEditing ? '취소' : '수정'}
                    </button>
                </div>

                {isEditing ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 'var(--space-4)',
                        }}
                    >
                        <div className="form-group">
                            <label className="form-label">닉네임</label>
                            <input
                                type="text"
                                value={editData.nickname}
                                onChange={(e) =>
                                    setEditData((prev) => ({
                                        ...prev,
                                        nickname: e.target.value,
                                    }))
                                }
                                className="form-input"
                                placeholder="닉네임을 입력하세요"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">이름</label>
                            <input
                                type="text"
                                value={editData.name}
                                onChange={(e) =>
                                    setEditData((prev) => ({
                                        ...prev,
                                        name: e.target.value,
                                    }))
                                }
                                className="form-input"
                                placeholder="이름을 입력하세요"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">
                                정치 성향 지수: {editData.politicalScore} (
                                {getPoliticalText(editData.politicalScore)})
                            </label>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-3)',
                                    marginBottom: 'var(--space-3)',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--error-500)',
                                        fontWeight: '600',
                                    }}
                                >
                                    보수
                                </span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={editData.politicalScore}
                                    onChange={(e) =>
                                        setEditData((prev) => ({
                                            ...prev,
                                            politicalScore: Number(
                                                e.target.value
                                            ),
                                        }))
                                    }
                                    style={{
                                        flex: 1,
                                        height: '8px',
                                        background: `linear-gradient(to right, var(--error-500) 0%, var(--gray-500) 50%, var(--primary-500) 100%)`,
                                        outline: 'none',
                                        borderRadius: 'var(--radius-full)',
                                        cursor: 'pointer',
                                        WebkitAppearance: 'none',
                                        appearance: 'none',
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--primary-500)',
                                        fontWeight: '600',
                                    }}
                                >
                                    진보
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                display: 'flex',
                                gap: 'var(--space-3)',
                                justifyContent: 'flex-end',
                            }}
                        >
                            <button
                                onClick={() => setIsEditing(false)}
                                className="btn btn-outline"
                                disabled={loading}
                            >
                                취소
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 'var(--space-4)',
                        }}
                    >
                        <div>
                            <span
                                style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'var(--gray-600)',
                                    marginBottom: 'var(--space-1)',
                                }}
                            >
                                닉네임
                            </span>
                            <span
                                style={{
                                    fontSize: '1rem',
                                    color: 'var(--gray-900)',
                                }}
                            >
                                {userData.nickname || '닉네임 없음'}
                            </span>
                        </div>
                        <div>
                            <span
                                style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'var(--gray-600)',
                                    marginBottom: 'var(--space-1)',
                                }}
                            >
                                이름
                            </span>
                            <span
                                style={{
                                    fontSize: '1rem',
                                    color: 'var(--gray-900)',
                                }}
                            >
                                {userData.name || '이름 없음'}
                            </span>
                        </div>
                        <div>
                            <span
                                style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: 'var(--gray-600)',
                                    marginBottom: 'var(--space-1)',
                                }}
                            >
                                가입일
                            </span>
                            <span
                                style={{
                                    fontSize: '1rem',
                                    color: 'var(--gray-900)',
                                }}
                            >
                                {userData.createdAt
                                    ? new Date(
                                          userData.createdAt
                                      ).toLocaleDateString('ko-KR')
                                    : '알 수 없음'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 정치성향 정보 카드 */}
            <div
                className="card"
                style={{
                    marginBottom: 'var(--space-6)',
                    padding: 'var(--space-6)',
                }}
            >
                <h2
                    style={{
                        margin: 0,
                        marginBottom: 'var(--space-6)',
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        color: 'var(--gray-900)',
                    }}
                >
                    정치성향 분석
                </h2>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns:
                            'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: 'var(--space-6)',
                    }}
                >
                    {/* 현재 정치성향 */}
                    <div
                        style={{
                            background:
                                'linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%)',
                            padding: 'var(--space-6)',
                            borderRadius: 'var(--radius-lg)',
                            border: `2px solid ${getPoliticalColor(
                                userInitialPoliticalScore || 50
                            )}`,
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                marginBottom: 'var(--space-4)',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: 'var(--gray-900)',
                            }}
                        >
                            현재 정치성향
                        </h3>
                        <div
                            style={{
                                textAlign: 'center',
                                marginBottom: 'var(--space-4)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '2.5rem',
                                    fontWeight: '700',
                                    color: getPoliticalColor(
                                        userInitialPoliticalScore || 50
                                    ),
                                    marginBottom: 'var(--space-2)',
                                }}
                            >
                                {userInitialPoliticalScore || 50}점
                            </div>
                            <div
                                style={{
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    color: getPoliticalColor(
                                        userInitialPoliticalScore || 50
                                    ),
                                }}
                            >
                                {getPoliticalText(
                                    userInitialPoliticalScore || 50
                                )}
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: '0.875rem',
                                color: 'var(--gray-600)',
                                textAlign: 'center',
                            }}
                        >
                            {isConvertedToProfile ? '프로필 기반' : '활동 기반'}
                        </div>
                    </div>

                    {/* 활동 통계 */}
                    <div
                        style={{
                            background:
                                'linear-gradient(135deg, var(--success-50) 0%, var(--gray-50) 100%)',
                            padding: 'var(--space-6)',
                            borderRadius: 'var(--radius-lg)',
                            border: '2px solid var(--success-200)',
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                marginBottom: 'var(--space-4)',
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                color: 'var(--gray-900)',
                            }}
                        >
                            활동 통계
                        </h3>
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--space-3)',
                            }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--gray-600)',
                                    }}
                                >
                                    스크랩한 뉴스
                                </span>
                                <span
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '600',
                                        color: 'var(--success-600)',
                                    }}
                                >
                                    {scrappedNews.length}개
                                </span>
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: '0.875rem',
                                        color: 'var(--gray-600)',
                                    }}
                                >
                                    활동 기반 점수
                                </span>
                                <span
                                    style={{
                                        fontSize: '1.25rem',
                                        fontWeight: '600',
                                        color: getPoliticalColor(
                                            userPoliticalIndex || 50
                                        ),
                                    }}
                                >
                                    {userPoliticalIndex || 50}점
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 액션 버튼들 */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <button
                    onClick={() => (window.location.href = '/')}
                    className="btn btn-primary"
                >
                    🏠 홈으로
                </button>
                <button
                    onClick={() => (window.location.href = '/scrapped')}
                    className="btn btn-outline"
                >
                    📰 스크랩한 뉴스
                </button>
                <button
                    onClick={handleLogout}
                    className="btn btn-outline"
                    style={{
                        color: 'var(--error-600)',
                        borderColor: 'var(--error-600)',
                    }}
                >
                    로그아웃
                </button>
            </div>
        </div>
    );
};

export default MyPage;
