import React, { useState } from 'react';
import { X, Sparkles, Image as ImageIcon } from 'lucide-react';

interface GenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const GenerateModal: React.FC<GenerateModalProps> = ({ isOpen, onClose, onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-indigo-600">
            <Sparkles size={18} />
            <span className="font-semibold text-sm uppercase tracking-wider">AI Asset Generator</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
            <label className="block text-slate-600 text-sm font-medium mb-2">
                Describe your architectural element or texture
            </label>
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., A futuristic concrete facade with vertical gardens, photorealistic, 4k..."
                className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none mb-4"
                autoFocus
            />
            
            <button
                onClick={() => onGenerate(prompt)}
                disabled={!prompt.trim() || isGenerating}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all
                    ${!prompt.trim() || isGenerating 
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                    }`}
            >
                {isGenerating ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                    </>
                ) : (
                    <>
                        <ImageIcon size={18} />
                        Generate to Board
                    </>
                )}
            </button>
        </div>

        {/* Footer info */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
             <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash Image</p>
        </div>
      </div>
    </div>
  );
};

export default GenerateModal;