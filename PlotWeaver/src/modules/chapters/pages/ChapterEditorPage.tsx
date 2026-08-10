import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify'; 
import { offlineChapterService } from '../../../services/offlineChapterService';
import { useUpdateChapter } from '../../chapters/hooks/UseUpdateChapter';
import { EditorToolbar } from '../../../components/EditorToolbar';
import type { ChapterResponse } from '../../../types/chapter';

export function ChapterEditorPage() {
  const { chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();

  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [title, setTitle] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');
  const [isPreview, setIsPreview] = useState(false); 

  const { updateChapter, isUpdating, error: updateError } = useUpdateChapter();

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
        class: 'prose prose-amber max-w-none focus:outline-none min-h-[60vh] text-lg leading-relaxed text-amber-950/90 font-serif',
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

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center font-serif text-amber-950">
        Ouverture de l'écritoire...
      </div>
    );
  }

  if (!chapter) {
    return null;
  }

  const chapterNum = chapter?.chapter_number ?? 1;

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c221e] flex flex-col font-serif">
      
      {/* Barre de navigation supérieure */}
      <header className="border-b border-amber-900/10 bg-[#fffdf9] px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-amber-900/60 hover:text-amber-950 transition-colors text-sm cursor-pointer flex items-center gap-1 font-sans"
          >
            &larr; Retour
          </button>
          <span className="text-amber-900/20">|</span>
          <span className="text-sm font-sans text-amber-900/70">
            Chapitre {chapterNum}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPreview(!isPreview)}
            className="px-4 py-2 rounded-lg bg-amber-950/5 hover:bg-amber-950/10 text-amber-950 font-sans text-sm font-medium transition-colors cursor-pointer"
          >
            {isPreview ? "Modifier" : "Aperçu lecture"}
          </button>

          {saveMessage && (
            <span className="text-xs font-sans text-emerald-700 font-medium animate-pulse">
              {saveMessage}
            </span>
          )}
          
          <button
            onClick={handleSave}
            disabled={isUpdating || isPreview}
            className="px-5 py-2 rounded-lg bg-amber-900 text-amber-50 font-sans text-sm font-medium hover:bg-amber-950 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isUpdating ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </header>

      {/* Zone de rédaction ou d'aperçu */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col">
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPreview}
          placeholder="Titre du chapitre..."
          className="text-3xl md:text-4xl font-bold font-serif text-amber-950 bg-transparent border-b border-amber-900/10 pb-4 mb-6 focus:outline-none focus:border-amber-900/40 placeholder:text-amber-900/30 disabled:border-transparent"
        />

        {isPreview ? (
          <div 
            className="prose prose-amber max-w-none text-lg leading-relaxed text-amber-950/90 font-serif py-4"
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(editor ? editor.getHTML() : '') 
            }} 
          />
        ) : (
          <>
            <EditorToolbar editor={editor} />
            <div className="flex-1 w-full bg-transparent cursor-text">
              <EditorContent editor={editor} />
            </div>
          </>
        )}

      </main>
    </div>
  );
}