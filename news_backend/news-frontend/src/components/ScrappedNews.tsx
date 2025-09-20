import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { NewsArticle } from '../types';

interface ScrappedNewsProps {
  user: User | null;
}

const ScrappedNews: React.FC<ScrappedNewsProps> = ({ user }) => {
  const [scrappedArticles, setScrappedArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    const storedScrappedArticles = localStorage.getItem('scrappedNews');
    if (storedScrappedArticles) {
      setScrappedArticles(JSON.parse(storedScrappedArticles));
    }
  }, []);

  const handleRemoveScrap = (articleId: string) => {
    const newScrappedArticles = scrappedArticles.filter(article => article.id !== articleId);
    setScrappedArticles(newScrappedArticles);
    localStorage.setItem('scrappedNews', JSON.stringify(newScrappedArticles));
    alert('스크랩을 취소했습니다.');
  };

  return (
    <div>
      <h2 className="mb-4">스크랩한 뉴스</h2>
      {scrappedArticles.length > 0 ? (
        scrappedArticles.map(article => (
          <div key={article.id} className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">{article.title}</h5>
              <p className="card-text"><small className="text-muted">{article.source} - {new Date(article.publishedAt).toLocaleString()}</small></p>
              <p className="card-text">{article.summary}</p>
              <button onClick={() => handleRemoveScrap(article.id)} className="btn btn-danger">스크랩 취소</button>
            </div>
          </div>
        ))
      ) : (
        <p>스크랩한 뉴스가 없습니다.</p>
      )}
    </div>
  );
};

export default ScrappedNews;
