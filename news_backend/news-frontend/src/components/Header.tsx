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
    <header className="bg-light p-3">
      <div className="container d-flex justify-content-between align-items-center">
        <h1 className="h4 mb-0">
          <Link to="/" className="text-dark text-decoration-none">
            뉴스 피드
          </Link>
        </h1>
        <div className="d-flex align-items-center">
          <SearchBar />
          {user ? (
            <>
              <Link to="/scrapped" className="btn btn-outline-secondary ms-3">
                스크랩
              </Link>
              <Link to="/mypage" className="btn btn-outline-info ms-2">
                마이페이지
              </Link>
              <span className="ms-3 text-muted">
                {nickname || user.email}
              </span>
              <Link to="/auth" className="btn btn-outline-danger ms-2">
                로그아웃
              </Link>
            </>
          ) : (
            <Link to="/auth" className="btn btn-primary ms-3">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
