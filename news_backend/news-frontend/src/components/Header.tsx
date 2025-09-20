import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

const Header: React.FC = () => {
  return (
    <header className="bg-light p-3">
      <div className="container d-flex justify-content-between align-items-center">
        <h1 className="h4 mb-0">
          <Link to="/" className="text-dark text-decoration-none">
            뉴스 피드
          </Link>
        </h1>
        <div className="d-flex">
          <SearchBar />
          <Link to="/scrapped" className="btn btn-outline-secondary ms-3">
            스크랩
          </Link>
          <Link to="/auth" className="btn btn-primary ms-3">
            로그인
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
