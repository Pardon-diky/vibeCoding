import React from 'react';
import { User } from 'firebase/auth';
import { NewsArticle } from '../types';
import NewsItem from './NewsItem';

interface ScrappedNewsProps {
    user: User | null;
    scrappedNews: NewsArticle[];
    onScrap: (article: NewsArticle) => void;
}

const ScrappedNews: React.FC<ScrappedNewsProps> = ({
    user,
    scrappedNews,
    onScrap,
}) => {
    return (
        <div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-6)',
                }}
            >
                <h1
                    style={{
                        fontSize: '2rem',
                        fontWeight: '700',
                        color: 'var(--gray-900)',
                        margin: 0,
                    }}
                >
                    📌 스크랩한 뉴스
                </h1>
                <div
                    style={{
                        background: 'var(--primary-100)',
                        color: 'var(--primary-700)',
                        padding: 'var(--space-2) var(--space-4)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                    }}
                >
                    총 {scrappedNews.length}개
                </div>
            </div>

            {scrappedNews.length > 0 ? (
                <div
                    style={{
                        display: 'grid',
                        gap: 'var(--space-4)',
                    }}
                >
                    {scrappedNews.map((article, index) => (
                        <div
                            key={article.id}
                            className="fade-in"
                            style={{
                                animationDelay: `${index * 0.1}s`,
                            }}
                        >
                            <NewsItem
                                article={article}
                                onScrap={onScrap}
                                isScrapped={true}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 'var(--space-12) var(--space-4)',
                        color: 'var(--gray-500)',
                    }}
                >
                    <div
                        style={{
                            fontSize: '4rem',
                            marginBottom: 'var(--space-4)',
                        }}
                    >
                        📰
                    </div>
                    <h3
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: '600',
                            marginBottom: 'var(--space-2)',
                            color: 'var(--gray-700)',
                        }}
                    >
                        아직 스크랩한 뉴스가 없습니다
                    </h3>
                    <p
                        style={{
                            fontSize: '1rem',
                            marginBottom: 'var(--space-6)',
                        }}
                    >
                        관심 있는 뉴스를 스크랩해보세요!
                    </p>
                </div>
            )}
        </div>
    );
};

export default ScrappedNews;
