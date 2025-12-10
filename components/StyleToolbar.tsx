import React from 'react';
import { Editor, DefaultColorStyle } from 'tldraw';

const colors = [
  { id: 'black', hex: '#1e293b' },
  { id: 'grey', hex: '#94a3b8' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'red', hex: '#ef4444' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'green', hex: '#22c55e' },
];

interface StyleToolbarProps {
  editor: Editor | null;
}

const StyleToolbar: React.FC<StyleToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const handleColorClick = (color: string) => {
    // Tldraw 2.0+ Style handling: 'run' is no longer needed/available on editor for simple actions.
    // We call setStyleForSelectedShapes directly.
    editor.setStyleForSelectedShapes(DefaultColorStyle, color);
  };

  return (
    <div className="fixed top-6 left-6 z-[2500] flex items-center gap-2 p-2 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-xl animate-in slide-in-from-top-4 duration-500">
      {colors.map((c) => (
        <button
          key={c.id}
          className="w-6 h-6 rounded-md border border-black/5 hover:scale-110 transition-transform duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
          style={{ backgroundColor: c.hex }}
          onClick={() => handleColorClick(c.id)}
          title={c.id.charAt(0).toUpperCase() + c.id.slice(1)}
        />
      ))}
    </div>
  );
};

export default StyleToolbar;