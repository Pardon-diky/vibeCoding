import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [politicalAffiliation, setPoliticalAffiliation] = useState('');
    const [politicalScore, setPoliticalScore] = useState(50); // 0~100 슬라이더 값
    const [user, setUser] = useState<User | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 추가 회원가입 필드
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [nickname, setNickname] = useState('');

    const toggleAuthMode = () => {
        setIsLogin(!isLogin);
    };

    // 사용하지 않는 함수 제거

    // 정치 성향 점수에 따른 성향 분류
    const getPoliticalAffiliationFromScore = (score: number) => {
        if (score <= 30) return 'progressive';
        if (score >= 70) return 'conservative';
        return 'neutral';
    };

    // 정치 성향 점수에 따른 색상
    const getPoliticalColor = (score: number) => {
        if (score <= 30) return '#ff6b6b'; // 진보 - 빨간색
        if (score >= 70) return '#4dabf7'; // 보수 - 파란색
        return '#51cf66'; // 중립 - 초록색
    };

    // 정치 성향 점수에 따른 텍스트
    const getPoliticalText = (score: number) => {
        if (score <= 30) return '진보';
        if (score >= 70) return '보수';
        return '중립';
    };

    // Firebase 인증 상태 감지
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                // 사용자 정보 가져오기
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setPoliticalAffiliation(
                            userData.politicalAffiliation || ''
                        );
                        setPoliticalScore(userData.politicalScore || 50);
                        setName(userData.name || '');
                        setGender(userData.gender || '');
                        setBirthDate(userData.birthDate || '');
                        setNickname(userData.nickname || '');
                    }
                } catch (error) {
                    console.error('사용자 정보 가져오기 실패:', error);
                }
            } else {
                // 로그아웃 시 초기화
                setPoliticalAffiliation('');
                setPoliticalScore(50);
                setName('');
                setGender('');
                setBirthDate('');
                setNickname('');
            }
        });
        return () => unsubscribe();
    }, []);

    // 회원가입 함수
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            setLoading(false);
            return;
        }

        if (!name || !gender || !birthDate || !nickname) {
            setError('모든 필드를 입력해주세요.');
            setLoading(false);
            return;
        }

        // 정치 성향 점수로부터 성향 분류 자동 설정
        const politicalAffiliationFromScore =
            getPoliticalAffiliationFromScore(politicalScore);
        setPoliticalAffiliation(politicalAffiliationFromScore);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            // Firestore에 사용자 정보 저장
            await setDoc(doc(db, 'users', user.uid), {
                email: user.email,
                name: name,
                gender: gender,
                birthDate: birthDate,
                nickname: nickname,
                politicalAffiliation: politicalAffiliationFromScore,
                politicalScore: politicalScore, // 0~100 점수 저장
                createdAt: new Date().toISOString(),
            });

            // 백엔드 데이터베이스에도 사용자 정보 저장
            try {
                const response = await fetch(
                    'http://127.0.0.1:8000/users/firebase',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            firebase_uid: user.uid,
                            email: user.email,
                            nickname: nickname,
                            display_name: name,
                            political_leaning: politicalAffiliationFromScore,
                            political_leaning_score: politicalScore,
                        }),
                    }
                );

                if (!response.ok) {
                    console.error(
                        '백엔드 사용자 저장 실패:',
                        await response.text()
                    );
                } else {
                    console.log('백엔드 사용자 저장 성공');
                }
            } catch (backendError) {
                console.error('백엔드 연결 오류:', backendError);
            }

            console.log('회원가입 성공:', user);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 로그인 함수
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );
            console.log('로그인 성공:', userCredential.user);
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 로그아웃 함수
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            console.log('로그아웃 성공');
        } catch (error: any) {
            setError(error.message);
        }
    };

    // 로그인된 사용자가 있으면 사용자 정보 표시
    if (user) {
        return (
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '60vh',
                    padding: 'var(--space-8)',
                }}
            >
                <div
                    className="card"
                    style={{
                        width: '100%',
                        maxWidth: '500px',
                        textAlign: 'center',
                        padding: 'var(--space-8)',
                        background:
                            'linear-gradient(135deg, var(--primary-50) 0%, var(--gray-50) 100%)',
                        border: 'none',
                    }}
                >
                    <div
                        style={{
                            width: '80px',
                            height: '80px',
                            background:
                                'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-6)',
                            fontSize: '2rem',
                            color: 'white',
                            fontWeight: 'bold',
                        }}
                    >
                        {(nickname || user.email || 'U')
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <h2
                        style={{
                            margin: 0,
                            marginBottom: 'var(--space-4)',
                            fontSize: '1.875rem',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                        }}
                    >
                        환영합니다! 👋
                    </h2>

                    <div
                        style={{
                            background: 'rgba(255, 255, 255, 0.8)',
                            borderRadius: 'var(--radius-lg)',
                            padding: 'var(--space-6)',
                            marginBottom: 'var(--space-6)',
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <span
                                style={{
                                    fontWeight: '600',
                                    color: 'var(--gray-700)',
                                }}
                            >
                                닉네임:
                            </span>
                            <span
                                style={{
                                    marginLeft: 'var(--space-2)',
                                    color: 'var(--gray-900)',
                                }}
                            >
                                {nickname || '닉네임 없음'}
                            </span>
                        </div>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <span
                                style={{
                                    fontWeight: '600',
                                    color: 'var(--gray-700)',
                                }}
                            >
                                이메일:
                            </span>
                            <span
                                style={{
                                    marginLeft: 'var(--space-2)',
                                    color: 'var(--gray-900)',
                                }}
                            >
                                {user.email}
                            </span>
                        </div>
                        <div style={{ marginBottom: 'var(--space-3)' }}>
                            <span
                                style={{
                                    fontWeight: '600',
                                    color: 'var(--gray-700)',
                                }}
                            >
                                정치 성향:
                            </span>
                            <span
                                style={{
                                    marginLeft: 'var(--space-2)',
                                    color: getPoliticalColor(politicalScore),
                                    fontWeight: '600',
                                }}
                            >
                                {politicalAffiliation === 'progressive'
                                    ? '진보'
                                    : politicalAffiliation === 'conservative'
                                    ? '보수'
                                    : '중립'}
                            </span>
                        </div>
                        <div>
                            <span
                                style={{
                                    fontWeight: '600',
                                    color: 'var(--gray-700)',
                                }}
                            >
                                정치 성향 지수:
                            </span>
                            <span
                                style={{
                                    marginLeft: 'var(--space-2)',
                                    color: getPoliticalColor(politicalScore),
                                    fontWeight: '600',
                                }}
                            >
                                {politicalScore}점
                            </span>
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--space-3)',
                            justifyContent: 'center',
                        }}
                    >
                        <button
                            onClick={() => (window.location.href = '/')}
                            className="btn btn-primary"
                            style={{ fontSize: '0.875rem' }}
                        >
                            🏠 홈으로
                        </button>
                        <button
                            onClick={handleSignOut}
                            className="btn btn-outline"
                            style={{
                                fontSize: '0.875rem',
                                color: 'var(--error-600)',
                                borderColor: 'var(--error-600)',
                            }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '80vh',
                padding: 'var(--space-8)',
            }}
        >
            <div
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: 'var(--space-8)',
                    background: 'white',
                    border: 'none',
                    boxShadow: 'var(--shadow-xl)',
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
                            width: '60px',
                            height: '60px',
                            background:
                                'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
                            borderRadius: 'var(--radius-xl)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto var(--space-4)',
                            fontSize: '1.5rem',
                            color: 'white',
                            fontWeight: 'bold',
                        }}
                    >
                        N
                    </div>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: '1.875rem',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                        }}
                    >
                        {isLogin ? '로그인' : '회원가입'}
                    </h2>
                    <p
                        style={{
                            margin: 0,
                            marginTop: 'var(--space-2)',
                            fontSize: '0.875rem',
                            color: 'var(--gray-600)',
                        }}
                    >
                        {isLogin
                            ? 'News Balance에 오신 것을 환영합니다'
                            : '새로운 계정을 만들어보세요'}
                    </p>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div
                        style={{
                            background: 'var(--error-50)',
                            color: 'var(--error-600)',
                            padding: 'var(--space-3)',
                            marginBottom: 'var(--space-6)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--error-200)',
                            fontSize: '0.875rem',
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            이메일
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="form-input"
                            placeholder="이메일을 입력하세요"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            비밀번호
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="form-input"
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>
                    {!isLogin && (
                        <>
                            <div className="form-group">
                                <label htmlFor="name" className="form-label">
                                    이름
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="form-input"
                                    placeholder="이름을 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label
                                    htmlFor="nickname"
                                    className="form-label"
                                >
                                    닉네임
                                </label>
                                <input
                                    type="text"
                                    id="nickname"
                                    name="nickname"
                                    value={nickname}
                                    onChange={(e) =>
                                        setNickname(e.target.value)
                                    }
                                    required
                                    className="form-input"
                                    placeholder="닉네임을 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="gender" className="form-label">
                                    성별
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    required
                                    className="form-input"
                                >
                                    <option value="">성별을 선택하세요</option>
                                    <option value="male">남성</option>
                                    <option value="female">여성</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label
                                    htmlFor="birthDate"
                                    className="form-label"
                                >
                                    생년월일
                                </label>
                                <input
                                    type="date"
                                    id="birthDate"
                                    name="birthDate"
                                    value={birthDate}
                                    onChange={(e) =>
                                        setBirthDate(e.target.value)
                                    }
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label
                                    htmlFor="confirmPassword"
                                    className="form-label"
                                >
                                    비밀번호 확인
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                    className="form-input"
                                    placeholder="비밀번호를 다시 입력하세요"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    정치 성향 지수: {politicalScore} (
                                    {getPoliticalText(politicalScore)})
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
                                        진보
                                    </span>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={politicalScore}
                                        onChange={(e) =>
                                            setPoliticalScore(
                                                Number(e.target.value)
                                            )
                                        }
                                        style={{
                                            flex: 1,
                                            height: '8px',
                                            background: `linear-gradient(to right, var(--error-500) 0%, var(--success-500) 50%, var(--primary-500) 100%)`,
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
                                        보수
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '0.75rem',
                                        color: 'var(--gray-500)',
                                        marginBottom: 'var(--space-3)',
                                    }}
                                >
                                    <span>0 (진보)</span>
                                    <span>50 (중립)</span>
                                    <span>100 (보수)</span>
                                </div>
                                <div
                                    style={{
                                        padding: 'var(--space-4)',
                                        background:
                                            getPoliticalColor(politicalScore) +
                                            '15',
                                        border: `2px solid ${getPoliticalColor(
                                            politicalScore
                                        )}`,
                                        borderRadius: 'var(--radius-lg)',
                                        textAlign: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: getPoliticalColor(
                                            politicalScore
                                        ),
                                    }}
                                >
                                    현재 선택: {politicalScore}점 (
                                    {getPoliticalText(politicalScore)} 성향)
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{
                            width: '100%',
                            padding: 'var(--space-4)',
                            fontSize: '1rem',
                            fontWeight: '600',
                        }}
                    >
                        {loading ? (
                            <>
                                <div
                                    style={{
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid transparent',
                                        borderTop: '2px solid currentColor',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                        marginRight: 'var(--space-2)',
                                    }}
                                ></div>
                                처리 중...
                            </>
                        ) : isLogin ? (
                            '로그인'
                        ) : (
                            '회원가입'
                        )}
                    </button>
                </form>

                <div
                    style={{
                        textAlign: 'center',
                        marginTop: 'var(--space-6)',
                        paddingTop: 'var(--space-6)',
                        borderTop: '1px solid var(--gray-200)',
                    }}
                >
                    <button
                        onClick={toggleAuthMode}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary-600)',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            textDecoration: 'underline',
                        }}
                    >
                        {isLogin
                            ? '계정이 없으신가요? 회원가입'
                            : '이미 계정이 있으신가요? 로그인'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
