import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { BooksPage } from './modules/books/pages/BooksPage';
import { BookDetailPage } from './modules/books/pages/BookDetailPage';
import { ChapterEditorPage } from './modules/chapters/pages/ChapterEditorPage';
import { ChapterReadPage } from './modules/chapters/pages/ChapterReadPage';
import { ChapterVersionsPage } from './modules/chapters/pages/ChapterVersionsPage';
import { NotFound } from './pages/404';
import { IdeasPage } from './modules/ideas/pages/IdeasPage';
import { IdeaVersionsPage } from './modules/ideas/pages/IdeaVersionsPage';
import VersionsHubPage from './pages/VersionsHubPage';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-dvh bg-[#fcf9f2] flex flex-col">
  {!isLandingPage && <Navbar />}

  <main
    className={`grow flex flex-col ${
      !isLandingPage ? 'pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0' : ''
    }`}
  >
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/books" element={<BooksPage />} />
          <Route path="/books/:id" element={<BookDetailPage />} />
          <Route path="/books/:bookId/chapters/:chapterId" element={<ChapterEditorPage />} />
          <Route path="/books/:bookId/chapters/:chapterId/versions" element={<ChapterVersionsPage />} />
          <Route path="/books/:bookId/chapters/:chapterId/versions/:versionId" element={<ChapterVersionsPage />} />
          <Route path="/books/:bookId/chapters/:chapterId/read" element={<ChapterReadPage />} />
          <Route path="/ideas" element={<IdeasPage />} />
          <Route path="/versions" element={<VersionsHubPage />} />
          <Route path="/ideas/:ideaId/versions" element={<IdeaVersionsPage />} />
          <Route path="/ideas/:ideaId/versions/:versionId" element={<IdeaVersionsPage />} />

          {/* Route 404 */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;