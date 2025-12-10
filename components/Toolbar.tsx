import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Image as ImageIcon, 
  StickyNote, 
  MousePointer2, 
  Hand, 
  Pencil,
  Eraser,
  ArrowRight,
  Square,
  Highlighter,
  Frame,
  Zap,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Copy,
  Trash2,
  Lock,
  Group,
  Ungroup,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Editor, DefaultColorStyle } from 'tldraw';

interface ToolbarProps {
  editor: Editor | null;
  onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const colors = [
  { id: 'black', hex: '#1e293b' },
  { id: 'grey', hex: '#94a3b8' },
  { id: 'blue', hex: '#3b82f6' },
  { id: 'violet', hex: '#8b5cf6' },
  { id: 'red', hex: '#ef4444' },
  { id: 'yellow', hex: '#eab308' },
  { id: 'green', hex: '#22c55e' },
];

const Toolbar: React.FC<ToolbarProps> = ({ editor, onUploadImage }) => {
  const [activeTool, setActiveTool] = useState('select');
  const [hasSelection, setHasSelection] = useState(false);
  const [selectionCount, setSelectionCount] = useState(0);
  
  // State for the floating tooltip
  const [tooltip, setTooltip] = useState<{ label: string; y: number; x: number } | null>(null);

  // Sync state from editor
  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
        setActiveTool(editor.getCurrentToolId());
        const selected = editor.getSelectedShapeIds();
        setHasSelection(selected.length > 0);
        setSelectionCount(selected.length);
    };

    // Initial check
    updateState();

    // Listen to changes
    const cleanup = editor.store.listen(updateState);
    
    // Also poll for tool changes as they might not trigger store updates immediately
    const interval = setInterval(() => {
        const current = editor.getCurrentToolId();
        setActiveTool(prev => (current !== prev ? current : prev));
    }, 200);

    return () => {
        cleanup();
        clearInterval(interval);
    };
  }, [editor]);
  
  const setTool = (tool: string) => {
    if (editor) {
        editor.setCurrentTool(tool);
        setActiveTool(tool);
    }
  };

  // --- ACTIONS ---

  const handleUndo = () => editor?.undo();
  const handleRedo = () => editor?.redo();
  
  const handleZoomIn = () => editor?.zoomIn();
  const handleZoomOut = () => editor?.zoomOut();
  const handleZoomFit = () => editor?.zoomToFit();

  const handleDuplicate = () => {
    if (!editor) return;
    const ids = editor.getSelectedShapeIds();
    if (ids.length > 0) editor.duplicateShapes(ids);
  };

  const handleDelete = () => {
    if (!editor) return;
    const ids = editor.getSelectedShapeIds();
    if (ids.length > 0) editor.deleteShapes(ids);
  };

  const handleGroup = () => {
      if (!editor) return;
      const ids = editor.getSelectedShapeIds();
      if (ids.length > 0) editor.groupShapes(ids);
  };

  const handleUngroup = () => {
      if (!editor) return;
      const ids = editor.getSelectedShapeIds();
      if (ids.length > 0) editor.ungroupShapes(ids);
  };

  const handleMoveToFront = () => {
      if (!editor) return;
      const ids = editor.getSelectedShapeIds();
      if (ids.length > 0) editor.bringToFront(ids);
  };

  const handleMoveToBack = () => {
      if (!editor) return;
      const ids = editor.getSelectedShapeIds();
      if (ids.length > 0) editor.sendToBack(ids);
  };

  const handleToggleLock = () => {
      if (!editor) return;
      const ids = editor.getSelectedShapeIds();
      if (ids.length > 0) editor.toggleLock(ids);
  };

  const handleColorClick = (e: React.MouseEvent, color: string) => {
    e.preventDefault(); 
    e.stopPropagation();
    if (editor) {
      editor.setStyleForSelectedShapes(DefaultColorStyle, color);
    }
  };

  // Tooltip Logic
  const showTooltip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
        label,
        y: rect.top + (rect.height / 2),
        x: rect.left - 12 // Gap from left
    });
  };
  const hideTooltip = () => setTooltip(null);

  // Determine which sub-panels to show
  const showColorPalette = ['draw', 'highlight', 'geo', 'arrow', 'note', 'text'].includes(activeTool) || hasSelection;
  const showContextActions = hasSelection;

  // Logical grouping for grid layout
  // 12 slots perfect for 2 columns x 6 rows
  const toolsGrid = [
    { id: 'select', icon: MousePointer2, label: 'Select', action: () => setTool('select') },
    { id: 'hand', icon: Hand, label: 'Pan', action: () => setTool('hand') },
    
    { id: 'draw', icon: Pencil, label: 'Draw', action: () => setTool('draw') },
    { id: 'eraser', icon: Eraser, label: 'Eraser', action: () => setTool('eraser') },
    
    { id: 'text', icon: Type, label: 'Text', action: () => setTool('text') },
    { id: 'note', icon: StickyNote, label: 'Note', action: () => setTool('note') },
    
    { id: 'arrow', icon: ArrowRight, label: 'Arrow', action: () => setTool('arrow') },
    { id: 'geo', icon: Square, label: 'Shape', action: () => setTool('geo') },
    
    { id: 'frame', icon: Frame, label: 'Frame', action: () => setTool('frame') },
    { id: 'highlight', icon: Highlighter, label: 'Highlight', action: () => setTool('highlight') },

    { id: 'laser', icon: Zap, label: 'Laser', action: () => setTool('laser') },
    // Upload is handled specially in render but conceptually belongs in the grid
  ];

  return (
    <>
        {/* --- GLOBAL FLOATING TOOLTIP --- */}
        {tooltip && (
            <div 
                className="fixed z-[3000] px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-md shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150"
                style={{ 
                    top: tooltip.y, 
                    left: tooltip.x, 
                    transform: 'translate(-100%, -50%)' 
                }}
            >
                {tooltip.label}
                {/* Tiny arrow pointing right */}
                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-slate-800 transform -translate-y-1/2 rotate-45" />
            </div>
        )}

        <div className="fixed right-6 top-1/2 transform -translate-y-1/2 flex flex-col gap-4 z-[2000] pointer-events-none">
        
        {/* --- CONTEXT PANEL (Appears to the LEFT) --- */}
        {(showColorPalette || showContextActions) && (
            <div className="absolute right-full top-0 mr-4 pointer-events-auto flex flex-col gap-3">
                
                {/* Color Palette */}
                {showColorPalette && (
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-2xl p-2 animate-in fade-in slide-in-from-right-4 duration-200 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider py-1 border-b border-slate-100">Style</span>
                        {colors.map((c) => (
                            <button
                                key={c.id}
                                onMouseDown={(e) => handleColorClick(e, c.id)}
                                onMouseEnter={(e) => showTooltip(e, c.id.charAt(0).toUpperCase() + c.id.slice(1))}
                                onMouseLeave={hideTooltip}
                                className="w-8 h-8 rounded-full border border-black/5 hover:scale-110 transition-transform duration-200 shadow-sm focus:outline-none relative group"
                                style={{ backgroundColor: c.hex }}
                            />
                        ))}
                    </div>
                )}

                {/* Object Actions (Only if selected) */}
                {showContextActions && (
                    <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-2xl p-2 animate-in fade-in slide-in-from-right-4 duration-200 flex flex-col gap-2">
                        <span className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider py-1 border-b border-slate-100">Action</span>
                        
                        <button 
                            onClick={handleDuplicate} 
                            onMouseEnter={(e) => showTooltip(e, "Duplicate")}
                            onMouseLeave={hideTooltip}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg group relative"
                        >
                            <Copy size={18} />
                        </button>
                        
                        <div className="h-px bg-slate-100 w-full" />
                        
                        <button 
                            onClick={handleMoveToFront} 
                            onMouseEnter={(e) => showTooltip(e, "To Front")}
                            onMouseLeave={hideTooltip}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg group relative"
                        >
                            <ArrowUp size={18} />
                        </button>
                        <button 
                            onClick={handleMoveToBack} 
                            onMouseEnter={(e) => showTooltip(e, "To Back")}
                            onMouseLeave={hideTooltip}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg group relative"
                        >
                            <ArrowDown size={18} />
                        </button>

                        <div className="h-px bg-slate-100 w-full" />

                        {selectionCount > 1 ? (
                            <button 
                                onClick={handleGroup} 
                                onMouseEnter={(e) => showTooltip(e, "Group")}
                                onMouseLeave={hideTooltip}
                                className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg group relative"
                            >
                                <Group size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleUngroup} 
                                onMouseEnter={(e) => showTooltip(e, "Ungroup")}
                                onMouseLeave={hideTooltip}
                                className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg group relative"
                            >
                                <Ungroup size={18} />
                            </button>
                        )}

                        <button 
                            onClick={handleToggleLock} 
                            onMouseEnter={(e) => showTooltip(e, "Lock/Unlock")}
                            onMouseLeave={hideTooltip}
                            className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg group relative"
                        >
                            <Lock size={18} />
                        </button>

                        <div className="h-px bg-slate-100 w-full" />

                        <button 
                            onClick={handleDelete} 
                            onMouseEnter={(e) => showTooltip(e, "Delete")}
                            onMouseLeave={hideTooltip}
                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg group relative"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>
        )}


        {/* --- MAIN TOOLBAR --- */}
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-2xl flex flex-col p-2 gap-2 pointer-events-auto select-none">
            
            {/* History Group */}
            <div className="flex justify-between gap-1 pb-2 border-b border-slate-100">
                <button 
                    onClick={handleUndo} 
                    onMouseEnter={(e) => showTooltip(e, "Undo")}
                    onMouseLeave={hideTooltip}
                    className="flex-1 p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors flex justify-center"
                >
                    <Undo2 size={16} />
                </button>
                <div className="w-px bg-slate-100 my-1"></div>
                <button 
                    onClick={handleRedo} 
                    onMouseEnter={(e) => showTooltip(e, "Redo")}
                    onMouseLeave={hideTooltip}
                    className="flex-1 p-2 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors flex justify-center"
                >
                    <Redo2 size={16} />
                </button>
            </div>

            {/* Tools Grid (2 Columns) */}
            <div className="grid grid-cols-2 gap-1.5">
                {toolsGrid.map((tool) => (
                    <button
                        key={tool.id}
                        onClick={tool.action}
                        onMouseEnter={(e) => showTooltip(e, tool.label)}
                        onMouseLeave={hideTooltip}
                        className={`p-2.5 rounded-xl transition-all relative group flex justify-center items-center ${
                        activeTool === tool.id 
                            ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        <tool.icon size={20} strokeWidth={2} />
                    </button>
                ))}

                {/* Image Upload integrated in grid */}
                <label 
                    className="p-2.5 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-700 cursor-pointer transition-all relative group flex justify-center items-center"
                    onMouseEnter={(e) => showTooltip(e, "Upload Image")}
                    onMouseLeave={hideTooltip}
                >
                    <input type="file" accept="image/*" className="hidden" onChange={onUploadImage} />
                    <ImageIcon size={20} strokeWidth={2} />
                </label>
            </div>

            <div className="h-px bg-slate-100 w-full mx-auto my-1"></div>

            {/* Zoom Group (Horizontal) */}
            <div className="flex gap-1 items-center justify-between">
                <button 
                    onClick={handleZoomIn} 
                    onMouseEnter={(e) => showTooltip(e, "Zoom In")}
                    onMouseLeave={hideTooltip}
                    className="flex-1 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex justify-center"
                >
                    <ZoomIn size={16} />
                </button>
                <button 
                    onClick={handleZoomFit} 
                    onMouseEnter={(e) => showTooltip(e, "Zoom Fit")}
                    onMouseLeave={hideTooltip}
                    className="flex-1 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex justify-center"
                >
                    <Maximize size={16} />
                </button>
                <button 
                    onClick={handleZoomOut} 
                    onMouseEnter={(e) => showTooltip(e, "Zoom Out")}
                    onMouseLeave={hideTooltip}
                    className="flex-1 p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-lg flex justify-center"
                >
                    <ZoomOut size={16} />
                </button>
            </div>

        </div>

        </div>
    </>
  );
};

export default Toolbar;