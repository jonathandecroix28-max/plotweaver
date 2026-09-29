import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify'; 
import { offlineChapterService } from '../../../services/offlineChapterService';
import { offlineChapterVersionService } from '../../../services/offlineChapterVersionService';
import { useUpdateChapter } from '../../chapters/hooks/UseUpdateChapter';
import { useChapterVersions } from '../hooks/useChapterVersions';
import { EditorToolbar } from '../../../components/EditorToolbar';
import type { ChapterResponse } from '../../../types/chapter';
import type { ChapterVersionResponse } from '../../../types/chapterVersion';

export function ChapterEditorPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  const chapterIdNumber = chapterId ? Number(chapterId) : null;

  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [title, setTitle] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPreview, setIsPreview] = useState(false); 

  const { updateChapter, isUpdating, error: updateError } = useUpdateChapter();
  const { versions: chapterVersions, refetch: refetchChapterVersions } = useChapterVersions(chapterIdNumber);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[60vh] text-lg leading-relaxed text-amber-100/90 font-serif',
      },
    },
  });

  useEffect(() => {
    const fetchChapter = async () => {
      if (!chapterId) return;
      try {
        setIsPageLoading(true);
        const data = await offlineChapterService.getById(Number(chapterId));
        
        if (!data) {
          navigate('/404', { replace: true });
          return;
        }

        setChapter(data);
        setTitle(data.title);
      } catch (error) {
        console.error("Erreur lors du chargement du chapitre :", error);
        navigate('/404', { replace: true });
      } finally {
        setIsPageLoading(false);
      }
    };

    fetchChapter();
  }, [chapterId, navigate]);

  useEffect(() => {
    if (editor && chapter && chapter.content) {
      if (editor.getText() === '') {
        editor.commands.setContent(chapter.content);
      }
    }
  }, [editor, chapter]);

  const handleSave = async () => {
    if (!chapterId || !chapter || !editor) return;

    setSaveMessage('');
    const htmlContent = editor.getHTML();

    const updated = await updateChapter(Number(chapterId), title, htmlContent);

    if (updated) {
      setChapter(updated);
      setSaveMessage('Modifications enregistrées ! ✨');
      setTimeout(() => setSaveMessage(''), 3000);
    } else if (updateError) {
      setSaveMessage('Erreur lors de la sauvegarde.');
    }
  };

  const handleCreateVersion = async () => {
    if (!chapterId || !chapter || !editor) return;

    const nextVersionNumber = chapterVersions.length > 0
      ? Math.max(...chapterVersions.map((version: ChapterVersionResponse) => Number(version.versionNumber))) + 1
      : 1;

    try {
      await offlineChapterVersionService.create({
        chapterId: Number(chapterId),
        versionNumber: nextVersionNumber,
        name: title.trim() || chapter.title,
        content: editor.getHTML(),
      });
      await refetchChapterVersions();
      setSaveMessage(`Version ${nextVersionNumber} créée.`);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Erreur lors de la création de version :', error);
      setSaveMessage('Impossible de créer la version.');
    }
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#1c1411] flex items-center justify-center font-serif text-amber-200/60">
        Ouverture de l'écritoire...
      </div>
    );
  }

  if (!chapter) return null;

  const chapterNum = chapter?.chapter_number ?? 1;

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] flex flex-col font-serif overflow-x-hidden">
      
      {/* Barre de navigation supérieure */}
      <header className="border-b border-amber-900/40 bg-neutral-950/80 px-4 sm:px-6 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shadow-md sticky top-0 z-10 backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-amber-200/60 hover:text-amber-100 transition-colors text-sm cursor-pointer flex items-center gap-1 font-sans"
          >
            &larr; Retour
          </button>
          <span className="hidden sm:inline text-amber-900/50">|</span>
          <span className="text-sm font-sans text-amber-200/70">
            Chapitre {chapterNum}
          </span>
          <button
            onClick={() => navigate(`/books/${bookId}/chapters/${chapterId}/versions`)}
            className="px-3 py-1.5 rounded-lg border border-amber-900/30 bg-neutral-900 hover:bg-neutral-800 text-amber-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Versions
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCreateVersion}
            disabled={isUpdating || isPreview}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-200 font-sans text-sm font-medium transition-colors cursor-pointer border border-amber-900/30 disabled:opacity-50 touch-target"
          >
            Nouvelle version
          </button>

          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-200 font-sans text-sm font-medium transition-colors cursor-pointer border border-amber-900/30 touch-target"
          >
            {isPreview ? "Modifier" : "Aperçu lecture"}
          </button>

          {saveMessage && (
            <span className="text-xs font-sans text-emerald-400 font-medium animate-pulse">
              {saveMessage}
            </span>
          )}
          
          <button
            onClick={handleSave}
            disabled={isUpdating || isPreview}
            className="px-5 py-2 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 font-sans text-sm font-medium transition-colors shadow-md cursor-pointer disabled:opacity-50 touch-target"
          >
            {isUpdating ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </header>

      {/* Zone de rédaction ou d'aperçu */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col">
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPreview}
          placeholder="Titre du chapitre..."
          className="text-2xl sm:text-3xl md:text-4xl font-bold font-serif text-amber-100 bg-transparent border-b border-amber-900/30 pb-4 mb-6 focus:outline-none focus:border-amber-600 placeholder:text-amber-200/30 disabled:border-transparent"
        />

        {isPreview ? (
          <div 
            className="prose prose-invert max-w-none text-lg leading-relaxed text-amber-100/90 font-serif py-4"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(editor ? editor.getHTML() : '') 
            }} 
          />
        ) : (
          <>
            <EditorToolbar editor={editor} />
            <div className="flex-1 w-full bg-transparent cursor-text mt-4">
              <EditorContent editor={editor} />
            </div>
          </>
        )}

      </main>
    </div>
  );
}