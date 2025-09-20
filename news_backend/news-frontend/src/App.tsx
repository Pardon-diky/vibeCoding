import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import NewsFeed from './components/NewsFeed';
import ScrappedNews from './components/ScrappedNews';
import Auth from './components/Auth';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="container mt-4">
          <Routes>
            <Route path="/" element={<NewsFeed />} />
            <Route path="/scrapped" element={<ScrappedNews />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;