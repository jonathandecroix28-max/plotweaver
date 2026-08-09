import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { BooksPage } from './modules/books/pages/BooksPage';
import { BookDetailPage } from './modules/books/pages/BookDetailPage';
import { ChapterEditorPage } from './modules/chapters/pages/ChapterEditorPage';
import { ChapterReadPage } from './modules/chapters/pages/ChapterReadPage';
import { NotFound } from './pages/404';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#fcf9f2] flex flex-col">
        <Navbar />
        <main className="grow">
          <Routes>
            <Route path="/" element={<BooksPage />} />
            <Route path="/books/:id" element={<BookDetailPage />} />
            <Route path="/books/:bookId/chapters/:chapterId" element={<ChapterEditorPage />} />
            <Route path="/books/:bookId/chapters/:chapterId/read" element={<ChapterReadPage />} />
  
            {/* Route explicite pour la 404 */}
            <Route path="/404" element={<NotFound />} />
            {/* Route attrape-tout pour toutes les autres URL inexistantes */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;