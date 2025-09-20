import React from 'react';

const SearchBar: React.FC = () => {
  return (
    <form className="d-flex">
      <input
        className="form-control me-2"
        type="search"
        placeholder="뉴스 검색"
        aria-label="Search"
      />
      <button className="btn btn-outline-success" type="submit">
        검색
      </button>
    </form>
  );
};

export default SearchBar;
