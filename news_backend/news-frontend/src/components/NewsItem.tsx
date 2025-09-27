import React from 'react';
import { NewsArticle } from '../types';

interface NewsItemProps {
    article: NewsArticle;
    onScrap: (article: NewsArticle) => void;
    isScrapped?: boolean;
}

const NewsItem: React.FC<NewsItemProps> = ({
    article,
    onScrap,
    isScrapped = false,
}) => {
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
                display: 'flex',
                flexDirection: 'row',
                height: '200px',
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
            {/* 왼쪽 이미지 섹션 */}
            <div
                style={{
                    position: 'relative',
                    width: '300px',
                    height: '100%',
                    overflow: 'hidden',
                    flexShrink: 0,
                }}
            >
                <img
                    src={
                        article.imageUrl ||
                        'https://via.placeholder.com/300x200/6c757d/ffffff?text=뉴스+이미지'
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
                            'https://via.placeholder.com/300x200/6c757d/ffffff?text=이미지+없음';
                    }}
                />
            </div>

            {/* 오른쪽 콘텐츠 섹션 */}
            <div
                style={{
                    padding: 'var(--space-4)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}
            >
                {/* 제목과 요약 */}
                <div style={{ flex: 1 }}>
                    {/* 제목 */}
                    <h3
                        style={{
                            margin: 0,
                            marginBottom: 'var(--space-2)',
                            fontSize: '1.1rem',
                            fontWeight: '700',
                            color: 'var(--gray-900)',
                            lineHeight: '1.4',
                            cursor: 'pointer',
                            transition: 'color var(--transition-fast)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
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
                            marginBottom: 'var(--space-3)',
                            fontSize: '0.875rem',
                            color: 'var(--gray-600)',
                            lineHeight: '1.5',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}
                    >
                        {article.summary}
                    </p>
                </div>

                {/* 하단 정보 */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    {/* 출처 */}
                    <span
                        style={{
                            fontSize: '0.75rem',
                            color: 'var(--gray-500)',
                        }}
                    >
                        {article.source}
                    </span>

                    {/* 정치성향 배지와 점수 */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                        }}
                    >
                        {/* 정치성향 배지 */}
                        <div
                            style={{
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

                        {/* 정치성향 점수 - 실제 분석된 데이터만 표시 */}
                        {article.politicalScore &&
                            typeof article.politicalScore === 'number' && (
                                <div
                                    style={{
                                        background: '#374151',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '12px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        border: '1px solid #4B5563',
                                        marginTop: '4px',
                                        whiteSpace: 'nowrap',
                                    }}
                                    title="정치성향 점수 (1-100점, 낮을수록 보수, 높을수록 진보)"
                                >
                                    {article.politicalScore}점
                                </div>
                            )}

                        {/* 스크랩 버튼 */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onScrap(article);
                            }}
                            style={{
                                background: isScrapped
                                    ? 'var(--success-600)'
                                    : 'var(--primary-600)',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = isScrapped
                                    ? 'var(--success-700)'
                                    : 'var(--primary-700)';
                                e.currentTarget.style.transform =
                                    'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = isScrapped
                                    ? 'var(--success-600)'
                                    : 'var(--primary-600)';
                                e.currentTarget.style.transform =
                                    'translateY(0)';
                            }}
                            title={
                                isScrapped
                                    ? '스크랩을 해제합니다'
                                    : '이 기사를 스크랩합니다'
                            }
                        >
                            {isScrapped ? '✅ 스크랩됨' : '📌 스크랩'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsItem;
