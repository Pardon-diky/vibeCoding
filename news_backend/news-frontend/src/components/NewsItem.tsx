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
    if (!politicalLeaning || politicalLeaning === 'API 키가 설정되지 않았습니다.') {
      return { 
        label: '중립', 
        color: '#6c757d'
      };
    }
    
    const lower = politicalLeaning.toLowerCase();
    if (lower.includes('보수') || lower.includes('conservative')) {
      return { 
        label: '보수', 
        color: '#dc3545'
      };
    } else if (lower.includes('진보') || lower.includes('progressive')) {
      return { 
        label: '진보', 
        color: '#007bff'
      };
    } else {
      return { 
        label: '중립', 
        color: '#6c757d'
      };
    }
  };

  const politicalInfo = getPoliticalLeaning(article.politicalLeaning || '');

  return (
    <div className="card mb-3">
      <div className="row g-0">
        <div className="col-md-4">
          <img src={article.imageUrl} className="img-fluid rounded-start" alt={article.title} />
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <h5 
              className="card-title" 
              style={{ cursor: 'pointer', color: '#007bff' }}
              onClick={handleNewsClick}
              title="클릭하면 뉴스 원문을 볼 수 있습니다"
            >
              {article.title}
            </h5>
            <p className="card-text">
              <small className="text-muted">{article.source} - {new Date(article.publishedAt).toLocaleString()}</small>
              <span 
                className="badge ms-2" 
                style={{ 
                  backgroundColor: politicalInfo.color, 
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              >
                {politicalInfo.label}
              </span>
            </p>
            <p className="card-text">{article.summary}</p>
            <div className="d-flex gap-2">
              <button onClick={() => onScrap(article)} className="btn btn-primary">스크랩</button>
              {article.url && (
                <button 
                  onClick={handleNewsClick} 
                  className="btn btn-outline-secondary"
                >
                  원문 보기
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsItem;
