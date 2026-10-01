import { useState, useEffect } from 'react';
import type { Editor } from '@tiptap/react';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      setForceUpdate(prev => prev + 1);
    };

    editor.on('transaction', handleTransaction);

    return () => {
      editor.off('transaction', handleTransaction);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const chain = () => editor.chain().focus();

  const baseBtn =
    'px-3 py-1.5 rounded text-xs font-sans font-medium transition-colors cursor-pointer flex items-center justify-center min-w-[32px] touch-target bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200';

  const activeBtn =
    'px-3 py-1.5 rounded text-xs font-sans font-medium transition-colors cursor-pointer flex items-center justify-center min-w-[32px] touch-target bg-amber-300 text-amber-950 border border-amber-400 shadow-xs';

  const btnClass = (isActive: boolean) => (isActive ? activeBtn : baseBtn);

  const plainBtn = `${baseBtn} disabled:opacity-40 disabled:cursor-not-allowed`;

  const separator = <span className="text-amber-300 mx-1">|</span>;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-4 mb-4 border-b border-amber-200 text-amber-950 bg-amber-50 p-2 rounded-lg overflow-x-auto">

      {/* Historique */}
      <button
        type="button"
        onClick={() => chain().undo().run()}
        disabled={!editor.can().undo()}
        className={plainBtn}
        title="Annuler (Ctrl+Z)"
      >
        ↺
      </button>
      <button
        type="button"
        onClick={() => chain().redo().run()}
        disabled={!editor.can().redo()}
        className={plainBtn}
        title="Rétablir (Ctrl+Y)"
      >
        ↻
      </button>

      {separator}

      {/* Style de texte */}
      <button type="button" onClick={() => chain().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Gras">
        <span className="font-bold">G</span>
      </button>
      <button type="button" onClick={() => chain().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italique">
        <span className="italic font-serif">I</span>
      </button>
      <button type="button" onClick={() => chain().toggleStrike().run()} className={btnClass(editor.isActive('strike'))} title="Barré">
        <span className="line-through">S</span>
      </button>
      <button type="button" onClick={() => chain().toggleCode().run()} className={btnClass(editor.isActive('code'))} title="Code">
        <span className="font-mono text-[11px]">&lt;/&gt;</span>
      </button>

      {separator}

      {/* Alignements */}
      <button type="button" onClick={() => chain().setTextAlign('left').run()} className={btnClass(editor.isActive({ textAlign: 'left' }))} title="Aligner à gauche">
        ≡
      </button>
      <button type="button" onClick={() => chain().setTextAlign('center').run()} className={btnClass(editor.isActive({ textAlign: 'center' }))} title="Centrer">
        ≣
      </button>
      <button type="button" onClick={() => chain().setTextAlign('right').run()} className={btnClass(editor.isActive({ textAlign: 'right' }))} title="Aligner à droite">
        ⁝
      </button>
      <button type="button" onClick={() => chain().setTextAlign('justify').run()} className={btnClass(editor.isActive({ textAlign: 'justify' }))} title="Justifier">
        ☰
      </button>

      {separator}

      {/* Titres */}
      <button type="button" onClick={() => chain().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Titre 1">
        H1
      </button>
      <button type="button" onClick={() => chain().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Titre 2">
        H2
      </button>
      <button type="button" onClick={() => chain().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))} title="Titre 3">
        H3
      </button>
      <button type="button" onClick={() => chain().setParagraph().run()} className={btnClass(editor.isActive('paragraph'))} title="Paragraphe">
        ¶
      </button>

      {separator}

      {/* Listes & Citations */}
      <button type="button" onClick={() => chain().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))} title="Liste à puces">
        • List
      </button>
      <button type="button" onClick={() => chain().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))} title="Liste numérotée">
        1. List
      </button>
      <button type="button" onClick={() => chain().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))} title="Citation">
        “ ”
      </button>
      <button type="button" onClick={() => chain().setHorizontalRule().run()} className={baseBtn} title="Séparateur">
        ―
      </button>

    </div>
  );
}