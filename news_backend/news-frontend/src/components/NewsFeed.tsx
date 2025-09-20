import React, { useState, useEffect } from 'react';
import NewsItem from './NewsItem';
import { NewsArticle } from '../types';

const NewsFeed: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [scrappedArticles, setScrappedArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedScrappedArticles = localStorage.getItem('scrappedNews');
    if (storedScrappedArticles) {
      setScrappedArticles(JSON.parse(storedScrappedArticles));
    }
    
    const fetchNews = async () => {
      try {
        const response = await fetch('http://localhost:8000/news');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json(); // 타입 지정 없이 데이터를 받습니다.
        
        // 🚨 이 부분이 핵심입니다! 데이터를 NewsArticle 형식에 맞게 변환합니다.
        const formattedData: NewsArticle[] = data.map((item: any) => ({
            id: item.id.toString(), // id가 숫자일 경우 문자열로 변환
            title: item.title,
            source: '연합뉴스', // 백엔드 데이터에 'source'가 없으므로 임의로 지정
            imageUrl: item.url_to_image || 'https://via.placeholder.com/150', // 이미지가 없으면 기본값 사용
            summary: item.summary || item.title, // summary가 없으면 title로 대체
            publishedAt: item.created_at, // created_at을 publishedAt에 매핑
        }));

        setArticles(formattedData);
      } catch (error) {
        console.error('Error fetching news:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNews();
  }, []);

  const handleScrap = (article: NewsArticle) => {
    if (scrappedArticles.find(a => a.id === article.id)) {
      alert('이미 스크랩한 기사입니다.');
      return;
    }
    const newScrappedArticles = [...scrappedArticles, article];
    setScrappedArticles(newScrappedArticles);
    localStorage.setItem('scrappedNews', JSON.stringify(newScrappedArticles));
    alert('기사를 스크랩했습니다.');
  };

  return (
    <div>
      {loading ? (
        <p>뉴스를 불러오는 중입니다...</p>
      ) : articles.length > 0 ? (
        articles.map(article => (
          <NewsItem key={article.id} article={article} onScrap={handleScrap} />
        ))
      ) : (
        <p>뉴스가 없습니다.</p>
      )}
    </div>
  );
};

export default NewsFeed;