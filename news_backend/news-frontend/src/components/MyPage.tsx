import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, checkFirebaseConnection, isNetworkOnline } from '../firebase';

interface MyPageProps {
  user: User | null;
}

const MyPage: React.FC<MyPageProps> = ({ user }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    nickname: '',
    gender: '',
    birthDate: '',
    politicalScore: 50,
    activityScore: 50,
    profileImage: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // 사용자 프로필 데이터 가져오기 함수
  const fetchProfileData = async (isRetry = false) => {
      if (!user) {
        console.log('마이페이지: 사용자가 없음');
        setLoading(false);
        return;
      }
      
      if (isRetry) {
        setIsRetrying(true);
      }
      
      // 네트워크 상태 확인
      if (!isNetworkOnline()) {
        setError('인터넷 연결을 확인해주세요. 오프라인 상태입니다.');
        setLoading(false);
        setIsRetrying(false);
        return;
      }
      
      // Firebase 연결 상태 확인
      const isConnected = await checkFirebaseConnection();
      if (!isConnected) {
        setError('Firebase 서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.');
        setLoading(false);
        setIsRetrying(false);
        return;
      }
      
      // 타임아웃 설정 (15초로 증가)
      const timeoutId = setTimeout(() => {
        console.log('마이페이지: 타임아웃 발생');
        setError('데이터를 가져오는데 시간이 오래 걸립니다. 다시 시도해주세요.');
        setLoading(false);
        setIsRetrying(false);
      }, 15000);
      
      try {
        console.log('마이페이지: 사용자 데이터 가져오기 시작', user.uid, isRetry ? '(재시도)' : '');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        console.log('마이페이지: Firestore 문서 존재 여부', userDoc.exists());
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('마이페이지: 사용자 데이터', userData);
          
          setProfileData({
            name: userData.name || '',
            nickname: userData.nickname || '',
            gender: userData.gender || '',
            birthDate: userData.birthDate || '',
            politicalScore: userData.politicalScore || 50,
            activityScore: userData.activityScore || 50,
            profileImage: userData.profileImage || ''
          });
          
          setError(''); // 에러 초기화
          setRetryCount(0); // 재시도 카운트 초기화
          clearTimeout(timeoutId);
        } else {
          console.log('마이페이지: 사용자 문서가 존재하지 않음');
          setError('사용자 프로필을 찾을 수 없습니다. 회원가입을 다시 해주세요.');
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('마이페이지: 프로필 데이터 가져오기 실패:', error);
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
        
        // 오프라인 에러인 경우 특별 처리
        if (errorMessage.includes('offline') || errorMessage.includes('Failed to get document')) {
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setError(`연결에 문제가 있습니다. ${retryCount + 1}/3 재시도 중...`);
            setTimeout(() => {
              fetchProfileData(true);
            }, 2000 * (retryCount + 1)); // 점진적 지연
            clearTimeout(timeoutId);
            return;
          } else {
            setError('서버 연결에 실패했습니다. 네트워크 상태를 확인하고 새로고침해주세요.');
          }
        } else {
          setError(`프로필 데이터를 가져오는데 실패했습니다: ${errorMessage}`);
        }
        clearTimeout(timeoutId);
      } finally {
        console.log('마이페이지: 로딩 완료');
        setLoading(false);
        setIsRetrying(false);
      }
    };

  // 사용자 프로필 데이터 가져오기
  useEffect(() => {
    // 사용자가 있을 때만 데이터 가져오기
    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user, retryCount]);

  // 수동 재시도 함수
  const handleRetry = () => {
    setError('');
    setRetryCount(0);
    setLoading(true);
    if (user) {
      fetchProfileData();
    }
  };

  // 프로필 업데이트
  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      await setDoc(doc(db, 'users', user.uid), {
        ...profileData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setSuccess('프로필이 성공적으로 업데이트되었습니다.');
      setEditing(false);
    } catch (error) {
      console.error('프로필 업데이트 실패:', error);
      setError('프로필 업데이트에 실패했습니다.');
    }
  };

  // 활동지수를 기본 프로필로 설정
  const handleSetActivityAsProfile = async () => {
    if (!user) return;
    
    try {
      const newPoliticalScore = profileData.activityScore;
      const newPoliticalAffiliation = getPoliticalAffiliationFromScore(newPoliticalScore);
      
      await setDoc(doc(db, 'users', user.uid), {
        politicalScore: newPoliticalScore,
        politicalAffiliation: newPoliticalAffiliation,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setProfileData(prev => ({
        ...prev,
        politicalScore: newPoliticalScore
      }));
      
      setSuccess('활동지수가 기본 프로필로 설정되었습니다.');
    } catch (error) {
      console.error('활동지수 설정 실패:', error);
      setError('활동지수 설정에 실패했습니다.');
    }
  };

  // 정치성향 점수에 따른 성향 분류
  const getPoliticalAffiliationFromScore = (score: number) => {
    if (score <= 30) return 'progressive';
    if (score >= 70) return 'conservative';
    return 'neutral';
  };

  // 프로필 이미지 업로드 (간단한 URL 입력 방식)
  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 실제로는 Firebase Storage를 사용해야 하지만, 여기서는 URL로 처리
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          profileImage: e.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
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

  if (!user) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        fontSize: '18px',
        color: '#666'
      }}>
        로그인이 필요합니다.
        <div style={{ marginTop: '1rem' }}>
          <a href="/auth" style={{ color: '#007bff', textDecoration: 'none' }}>
            로그인하러 가기
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '2rem',
        fontSize: '18px',
        color: '#666'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          {isRetrying ? '재연결 시도 중...' : '프로필을 불러오는 중...'}
        </div>
        
        {/* 로딩 스피너 */}
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        
        <div style={{ marginTop: '1rem', fontSize: '14px' }}>
          사용자: {user?.email}
        </div>
        
        {isRetrying && (
          <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#ff6b6b' }}>
            네트워크 연결을 확인하고 있습니다...
          </div>
        )}
        
        <div style={{ marginTop: '1rem' }}>
          <button 
            onClick={handleRetry}
            disabled={isRetrying}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: isRetrying ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              marginRight: '0.5rem'
            }}
          >
            {isRetrying ? '재시도 중...' : '다시 시도'}
          </button>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            새로고침
          </button>
        </div>
        
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h2 style={{ marginBottom: '2rem', textAlign: 'center' }}>마이페이지</h2>
      
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          border: '1px solid #f5c6cb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ marginRight: '0.5rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
          
          {!isRetrying && (
            <div style={{ marginTop: '0.5rem' }}>
              <button 
                onClick={handleRetry}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  marginRight: '0.5rem'
                }}
              >
                다시 시도
              </button>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                새로고침
              </button>
            </div>
          )}
          
          {isRetrying && (
            <div style={{ marginTop: '0.5rem', fontSize: '12px', color: '#666' }}>
              자동으로 재시도 중입니다. 잠시만 기다려주세요...
            </div>
          )}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '0.75rem',
          marginBottom: '1rem',
          borderRadius: '4px',
          border: '1px solid #c3e6cb'
        }}>
          {success}
        </div>
      )}

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {/* 프로필 이미지 */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            backgroundColor: '#e9ecef',
            margin: '0 auto 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '3px solid #dee2e6'
          }}>
            {profileData.profileImage ? (
              <img 
                src={profileData.profileImage} 
                alt="프로필" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span style={{ fontSize: '48px', color: '#6c757d' }}>👤</span>
            )}
          </div>
          {editing && (
            <input
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              style={{ marginBottom: '1rem' }}
            />
          )}
        </div>

        {/* 프로필 정보 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>이름</label>
            {editing ? (
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <p style={{ margin: 0, padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                {profileData.name || '정보 없음'}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>닉네임</label>
            {editing ? (
              <input
                type="text"
                value={profileData.nickname}
                onChange={(e) => setProfileData(prev => ({ ...prev, nickname: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <p style={{ margin: 0, padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                {profileData.nickname || '정보 없음'}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>성별</label>
            {editing ? (
              <select
                value={profileData.gender}
                onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            ) : (
              <p style={{ margin: 0, padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                {profileData.gender === 'male' ? '남성' : profileData.gender === 'female' ? '여성' : '기타'}
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>생년월일</label>
            {editing ? (
              <input
                type="date"
                value={profileData.birthDate}
                onChange={(e) => setProfileData(prev => ({ ...prev, birthDate: e.target.value }))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            ) : (
              <p style={{ margin: 0, padding: '0.5rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                {profileData.birthDate || '정보 없음'}
              </p>
            )}
          </div>
        </div>

        {/* 정치성향 지수 */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>정치성향 지수</h3>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: getPoliticalColor(profileData.politicalScore),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {profileData.politicalScore}
              </div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>프로필 지수</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {getPoliticalText(profileData.politicalScore)}
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                backgroundColor: getPoliticalColor(profileData.activityScore),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 0.5rem',
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {profileData.activityScore}
              </div>
              <p style={{ margin: 0, fontWeight: 'bold' }}>활동 지수</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                {getPoliticalText(profileData.activityScore)}
              </p>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!editing ? (
            <>
              <button
                onClick={() => setEditing(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                프로필 수정
              </button>
              <button
                onClick={handleSetActivityAsProfile}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                활동지수를 기본으로 설정
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleUpdateProfile}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                저장
              </button>
              <button
                onClick={() => setEditing(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                취소
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPage;
