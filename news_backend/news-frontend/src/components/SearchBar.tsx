import React from 'react';

const SearchBar: React.FC = () => {
    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                }}
            >
                <input
                    type="search"
                    placeholder="뉴스 검색..."
                    aria-label="Search"
                    style={{
                        padding:
                            'var(--space-2) var(--space-3) var(--space-2) var(--space-10)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        background: 'var(--gray-50)',
                        color: 'var(--gray-900)',
                        width: '200px',
                        transition: 'all var(--transition-fast)',
                        outline: 'none',
                    }}
                    onFocus={(e) => {
                        e.target.style.width = '250px';
                        e.target.style.background = 'white';
                        e.target.style.borderColor = 'var(--primary-500)';
                        e.target.style.boxShadow =
                            '0 0 0 3px rgb(14 165 233 / 0.1)';
                    }}
                    onBlur={(e) => {
                        e.target.style.width = '200px';
                        e.target.style.background = 'var(--gray-50)';
                        e.target.style.borderColor = 'var(--gray-300)';
                        e.target.style.boxShadow = 'none';
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        left: 'var(--space-3)',
                        color: 'var(--gray-400)',
                        fontSize: '0.875rem',
                    }}
                >
                    🔍
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
