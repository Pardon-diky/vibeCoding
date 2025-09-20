import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import ScrappedNews from './components/ScrappedNews';
import Auth from './components/Auth';
import MyPage from './components/MyPage';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        앱을 불러오는 중...
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Header user={user} />
        <main className="container mt-4">
          <Routes>
            <Route path="/" element={<NewsFeed user={user} />} />
            <Route path="/scrapped" element={<ScrappedNews user={user} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/mypage" element={<MyPage user={user} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;