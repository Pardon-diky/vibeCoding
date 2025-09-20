import React from 'react';
import { NewsArticle } from '../types';

interface NewsItemProps {
  article: NewsArticle;
  onScrap: (article: NewsArticle) => void;
}

const NewsItem: React.FC<NewsItemProps> = ({ article, onScrap }) => {
  return (
    <div className="card mb-3">
      <div className="row g-0">
        <div className="col-md-4">
          <img src={article.imageUrl} className="img-fluid rounded-start" alt={article.title} />
        </div>
        <div className="col-md-8">
          <div className="card-body">
            <h5 className="card-title">{article.title}</h5>
            <p className="card-text"><small className="text-muted">{article.source} - {new Date(article.publishedAt).toLocaleString()}</small></p>
            <p className="card-text">{article.summary}</p>
            <button onClick={() => onScrap(article)} className="btn btn-primary">스크랩</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsItem;
