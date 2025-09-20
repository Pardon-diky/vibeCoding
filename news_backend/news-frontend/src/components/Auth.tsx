
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User
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
            setPoliticalAffiliation(userData.politicalAffiliation || '');
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
    const politicalAffiliationFromScore = getPoliticalAffiliationFromScore(politicalScore);
    setPoliticalAffiliation(politicalAffiliationFromScore);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
        createdAt: new Date().toISOString()
      });
      
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <h2>환영합니다!</h2>
          <p>닉네임: {nickname || '닉네임 없음'}</p>
          <p>이메일: {user.email}</p>
          <p>정치 성향: {politicalAffiliation === 'progressive' ? '진보' : politicalAffiliation === 'conservative' ? '보수' : '중립'}</p>
          <p>정치 성향 지수: {politicalScore}점</p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
            <button 
              onClick={() => window.location.href = '/'}
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              홈으로
            </button>
            <button 
              onClick={handleSignOut}
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer',
                borderRadius: '4px'
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
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h2>{isLogin ? '로그인' : '회원가입'}</h2>
        {error && (
          <div style={{ 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            padding: '0.75rem', 
            marginBottom: '1rem', 
            borderRadius: '4px',
            border: '1px solid #f5c6cb'
          }}>
            {error}
          </div>
        )}
        <form onSubmit={isLogin ? handleSignIn : handleSignUp}>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>이메일</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              style={{ width: '100%', padding: '0.5rem' }} 
            />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              style={{ width: '100%', padding: '0.5rem' }} 
            />
          </div>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem' }}>이름</label>
                <input 
                  type="text" 
                  id="name" 
                  name="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '0.5rem' }} 
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="nickname" style={{ display: 'block', marginBottom: '0.5rem' }}>닉네임</label>
                <input 
                  type="text" 
                  id="nickname" 
                  name="nickname" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '0.5rem' }} 
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="gender" style={{ display: 'block', marginBottom: '0.5rem' }}>성별</label>
                <select 
                  id="gender" 
                  name="gender" 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">성별을 선택하세요</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="birthDate" style={{ display: 'block', marginBottom: '0.5rem' }}>생년월일</label>
                <input 
                  type="date" 
                  id="birthDate" 
                  name="birthDate" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '0.5rem' }} 
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호 확인</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  style={{ width: '100%', padding: '0.5rem' }} 
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  정치 성향 지수: {politicalScore} ({getPoliticalText(politicalScore)})
                </label>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ fontSize: '0.9rem', color: '#ff6b6b' }}>진보</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={politicalScore}
                    onChange={(e) => setPoliticalScore(Number(e.target.value))}
                    style={{
                      flex: 1,
                      height: '6px',
                      background: `linear-gradient(to right, #ff6b6b 0%, #51cf66 50%, #4dabf7 100%)`,
                      outline: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', color: '#4dabf7' }}>보수</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '0.8rem', 
                  color: '#666',
                  marginBottom: '0.5rem'
                }}>
                  <span>0 (진보)</span>
                  <span>50 (중립)</span>
                  <span>100 (보수)</span>
                </div>
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: getPoliticalColor(politicalScore) + '20',
                  border: `2px solid ${getPoliticalColor(politicalScore)}`,
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  color: getPoliticalColor(politicalScore)
                }}>
                  현재 선택: {politicalScore}점 ({getPoliticalText(politicalScore)} 성향)
                </div>
              </div>
            </>
          )}
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              backgroundColor: loading ? '#6c757d' : '#007bff', 
              color: 'white', 
              border: 'none', 
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '4px'
            }}
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>
        <button onClick={toggleAuthMode} style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginTop: '1rem', padding: 0 }}>
          {isLogin ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
        </button>
      </div>
    </div>
  );
};

export default Auth;
