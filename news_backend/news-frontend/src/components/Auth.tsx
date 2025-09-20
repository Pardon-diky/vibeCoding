
import React, { useState } from 'react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [politicalAffiliation, setPoliticalAffiliation] = useState('');

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const handlePoliticalAffiliation = (affiliation: string) => {
    setPoliticalAffiliation(prev => prev === affiliation ? '' : affiliation);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <h2>{isLogin ? '로그인' : '회원가입'}</h2>
        <form>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>이메일</label>
            <input type="email" id="email" name="email" required style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호</label>
            <input type="password" id="password" name="password" required style={{ width: '100%', padding: '0.5rem' }} />
          </div>
          {!isLogin && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem' }}>비밀번호 확인</label>
                <input type="password" id="confirmPassword" name="confirmPassword" required style={{ width: '100%', padding: '0.5rem' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>정치 성향</label>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    type="button"
                    onClick={() => handlePoliticalAffiliation('conservative')}
                    style={{
                      width: '30%',
                      padding: '0.5rem',
                      backgroundColor: politicalAffiliation === 'conservative' ? '#007bff' : 'white',
                      color: politicalAffiliation === 'conservative' ? 'white' : 'black',
                      border: '1px solid #ccc',
                    }}
                  >
                    보수
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePoliticalAffiliation('progressive')}
                    style={{
                      width: '30%',
                      padding: '0.5rem',
                      backgroundColor: politicalAffiliation === 'progressive' ? '#007bff' : 'white',
                      color: politicalAffiliation === 'progressive' ? 'white' : 'black',
                      border: '1px solid #ccc',
                    }}
                  >
                    진보
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePoliticalAffiliation('neutral')}
                    style={{
                      width: '30%',
                      padding: '0.5rem',
                      backgroundColor: politicalAffiliation === 'neutral' ? '#007bff' : 'white',
                      color: politicalAffiliation === 'neutral' ? 'white' : 'black',
                      border: '1px solid #ccc',
                    }}
                  >
                    중립
                  </button>
                </div>
              </div>
            </>
          )}
          <button type="submit" style={{ width: '100%', padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
            {isLogin ? '로그인' : '회원가입'}
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
