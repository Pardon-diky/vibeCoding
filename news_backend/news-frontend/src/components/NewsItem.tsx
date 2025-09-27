import React from 'react';
import { NewsArticle } from '../types';

interface NewsItemProps {
    article: NewsArticle;
    onScrap: (article: NewsArticle) => void;
}

const NewsItem: React.FC<NewsItemProps> = ({ article, onScrap }) => {
    const handleNewsClick = () => {
        // 뉴스 URL이 있으면 새 탭에서 열기
        if (article.url) {
            window.open(article.url, '_blank');
        }
    };

    // 정치 성향 분석 함수
    const getPoliticalLeaning = (politicalLeaning: string) => {
        if (
            !politicalLeaning ||
            politicalLeaning === 'API 키가 설정되지 않았습니다.'
        ) {
            return {
                label: '중립',
                color: '#6c757d',
            };
        }

        const lower = politicalLeaning.toLowerCase();
        if (lower.includes('보수') || lower.includes('conservative')) {
            return {
                label: '보수',
                color: '#dc3545',
            };
        } else if (lower.includes('진보') || lower.includes('progressive')) {
            return {
                label: '진보',
                color: '#007bff',
            };
        } else {
            return {
                label: '중립',
                color: '#6c757d',
            };
        }
    };

    const politicalInfo = getPoliticalLeaning(article.politicalLeaning || '');

    return (
        <div
            className="card"
            style={{
                background: 'white',
                border: '1px solid var(--gray-200)',
                borderRadius: 'var(--radius-xl)',
                overflow: 'hidden',
                transition: 'all var(--transition-normal)',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                }}
            >
                {/* 이미지 섹션 */}
                <div
                    style={{
                        position: 'relative',
                        height: '200px',
                        overflow: 'hidden',
                    }}
                >
                    <img
                        src={
                            article.imageUrl ||
                            'https://via.placeholder.com/400x200/6c757d/ffffff?text=뉴스+이미지'
                        }
                        alt={article.title}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform var(--transition-normal)',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                        }}
                        onError={(e) => {
                            e.currentTarget.src =
                                'https://via.placeholder.com/400x200/6c757d/ffffff?text=이미지+없음';
                        }}
                    />
                    {/* 정치성향 배지 */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 'var(--space-3)',
                            right: 'var(--space-3)',
                            background: politicalInfo.color,
                            color: 'white',
                            padding: 'var(--space-1) var(--space-2)',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em',
                            boxShadow: 'var(--shadow-md)',
                        }}
                    >
                        {politicalInfo.label}
                    </div>
                </div>

                {/* 콘텐츠 섹션 */}
                <div
                    style={{
                        padding: 'var(--space-6)',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* 제목 */}
                    <h3
                        style={{
                            margin: 0,
                            marginBottom: 'var(--space-3)',
                            fontSize: '1.125rem',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                            lineHeight: '1.4',
                            cursor: 'pointer',
                            transition: 'color var(--transition-fast)',
                        }}
                        onClick={handleNewsClick}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--primary-600)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--gray-900)';
                        }}
                        title="클릭하면 뉴스 원문을 볼 수 있습니다"
                    >
                        {article.title}
                    </h3>

                    {/* 요약 */}
                    <p
                        style={{
                            margin: 0,
                            marginBottom: 'var(--space-4)',
                            fontSize: '0.875rem',
                            color: 'var(--gray-600)',
                            lineHeight: '1.6',
                            flex: 1,
                        }}
                    >
                        {article.summary}
                    </p>

                    {/* 메타 정보 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 'var(--space-4)',
                            fontSize: '0.75rem',
                            color: 'var(--gray-500)',
                        }}
                    >
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                            }}
                        >
                            📰 {article.source}
                        </span>
                        <span
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-1)',
                            }}
                        >
                            🕒{' '}
                            {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                    </div>

                    {/* 액션 버튼들 */}
                    <div
                        style={{
                            display: 'flex',
                            gap: 'var(--space-2)',
                        }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onScrap(article);
                            }}
                            className="btn btn-primary"
                            style={{
                                flex: 1,
                                fontSize: '0.875rem',
                                padding: 'var(--space-2) var(--space-3)',
                            }}
                        >
                            📌 스크랩
                        </button>
                        {article.url && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleNewsClick();
                                }}
                                className="btn btn-outline"
                                style={{
                                    flex: 1,
                                    fontSize: '0.875rem',
                                    padding: 'var(--space-2) var(--space-3)',
                                }}
                            >
                                🔗 원문 보기
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsItem;
