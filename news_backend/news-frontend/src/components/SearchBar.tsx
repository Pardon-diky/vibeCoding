import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    isSearching?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
    onSearch,
    isSearching = false,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchQuery);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch(e);
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        onSearch('');
    };

    return (
        <div
            style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <form
                onSubmit={handleSearch}
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
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={{
                            padding:
                                'var(--space-2) var(--space-3) var(--space-2) var(--space-10)',
                            border: '1px solid var(--gray-300)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.875rem',
                            background: isFocused ? 'white' : 'var(--gray-50)',
                            color: 'var(--gray-900)',
                            width: isFocused ? '300px' : '200px',
                            transition: 'all var(--transition-fast)',
                            outline: 'none',
                            borderColor: isFocused
                                ? 'var(--primary-500)'
                                : 'var(--gray-300)',
                            boxShadow: isFocused
                                ? '0 0 0 3px rgb(14 165 233 / 0.1)'
                                : 'none',
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
                        {isSearching ? '⏳' : '🔍'}
                    </div>

                    {/* 검색어가 있을 때 X 버튼 표시 */}
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={handleClear}
                            style={{
                                position: 'absolute',
                                right: 'var(--space-3)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--gray-400)',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                padding: '2px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = 'var(--gray-600)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = 'var(--gray-400)';
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SearchBar;
