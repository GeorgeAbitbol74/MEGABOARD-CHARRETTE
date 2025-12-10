import React, { useState } from 'react';
import { Tldraw, Editor, TLRecord } from 'tldraw';
import { Sparkles } from 'lucide-react';

interface CanvasProps {
  onMount: (editor: Editor) => void;
  onMix: () => void;
  isMixing: boolean;
  initialSnapshot?: any;
}

const Canvas: React.FC<CanvasProps> = ({ onMount, onMix, isMixing, initialSnapshot }) => {
  const [hasSelection, setHasSelection] = useState(false);
  
  const handleMount = (editorInstance: Editor) => {
    // 1. Pass editor up
    onMount(editorInstance);

    // 2. Load Content with delay for engine readiness
    setTimeout(() => {
        if (initialSnapshot) {
            try {
                // FIXED LOADING STRATEGY:
                // Support new { store, camera } structure while maintaining backward compatibility
                const snapshot = initialSnapshot;
                const storeData = snapshot.store || snapshot;
                const camera = snapshot.camera; // May be undefined for old saves

                const recordsToLoad: TLRecord[] = [];
                
                let indexCounter = 1;

                Object.values(storeData).forEach((record: any) => {
                    if (record.typeName === 'shape') {
                        // SANITIZATION:
                        // Ensure required properties exist to avoid crashes
                        if (record.rotation === undefined) record.rotation = 0;
                        if (record.isLocked === undefined) record.isLocked = false;
                        if (record.opacity === undefined) record.opacity = 1;
                        if (record.meta === undefined) record.meta = {};
                        if (record.parentId === undefined) record.parentId = 'page:page';
                        
                        // Fix for missing index error
                        if (record.index === undefined) {
                            record.index = `a${indexCounter++}`;
                        }

                        // Fix for missing props or props.color
                        if (!record.props) record.props = {};

                        // Tldraw 2.0+ validation: Shapes with 'color', 'size', 'align' props must have valid values.
                        if (['text', 'note', 'geo', 'arrow', 'draw', 'highlight'].includes(record.type)) {
                            if (!record.props.color) {
                                record.props.color = 'black';
                            }
                            if (!record.props.size) {
                                record.props.size = 'm';
                            }
                        }

                        // Specific check for 'align' on text-based shapes
                        if (['text', 'note', 'geo'].includes(record.type)) {
                            if (!record.props.align) {
                                record.props.align = 'middle';
                            }
                        }

                        // Specific check for 'autoSize' and 'w' on text shapes
                        if (record.type === 'text') {
                            if (record.props.autoSize === undefined) {
                                record.props.autoSize = true;
                            }
                            // Tldraw validation requires 'w' even if autoSize is true
                            if (record.props.w === undefined) {
                                record.props.w = 200;
                            }
                        }

                        // Specific check for 'fontSizeAdjustment', 'verticalAlign', 'growY' AND 'url' on note shapes
                        if (record.type === 'note') {
                            if (record.props.fontSizeAdjustment === undefined) {
                                record.props.fontSizeAdjustment = 0;
                            }
                            if (record.props.verticalAlign === undefined) {
                                record.props.verticalAlign = 'middle';
                            }
                            if (record.props.growY === undefined) {
                                record.props.growY = 0;
                            }
                            if (record.props.url === undefined) {
                                record.props.url = "";
                            }
                        }
                        
                        // Specific check for arrow props (labelColor, fill, dash, arrowheadStart, arrowheadEnd, bend, text, labelPosition)
                        if (record.type === 'arrow') {
                             if (!record.props.labelColor) {
                                record.props.labelColor = 'black';
                             }
                             if (!record.props.fill) {
                                record.props.fill = 'none';
                             }
                             if (!record.props.dash) {
                                record.props.dash = 'draw';
                             }
                             if (!record.props.arrowheadStart) {
                                record.props.arrowheadStart = 'none';
                             }
                             if (!record.props.arrowheadEnd) {
                                record.props.arrowheadEnd = 'arrow';
                             }
                             if (record.props.bend === undefined) {
                                record.props.bend = 0;
                             }
                             if (record.props.text === undefined) {
                                record.props.text = "";
                             }
                             if (record.props.labelPosition === undefined) {
                                record.props.labelPosition = 0.5;
                             }
                        }

                        // Specific check for 'font' on text/note/geo/arrow shapes
                        if (['text', 'note', 'geo', 'arrow'].includes(record.type)) {
                             if (!record.props.font) {
                                record.props.font = 'draw';
                            }
                        }

                        recordsToLoad.push(record);
                    } else if (
                        record.typeName === 'asset' || 
                        record.typeName === 'binding'
                    ) {
                        recordsToLoad.push(record);
                    }
                });

                if (recordsToLoad.length > 0) {
                    editorInstance.store.put(recordsToLoad);
                }

                // CAMERA LOGIC
                // If the snapshot contains camera state (saved template or project), restore it.
                if (camera) {
                    editorInstance.setCamera(camera);
                } else {
                    // Fallback: Fit to content naturally if no camera state exists
                    const bounds = editorInstance.getCurrentPageBounds();
                    if (bounds) {
                        editorInstance.zoomToBounds(bounds.expand(50), { duration: 500 });
                    }
                }

            } catch (e) {
                console.error("Failed to load snapshot content", e);
            }
        }
        
        // 3. Force Grid
        editorInstance.updateInstanceState({ isGridMode: true });

    }, 100);

    // Listener
    editorInstance.store.listen(({ changes }) => {
        const selection = editorInstance.getSelectedShapes();
        setHasSelection(selection.length > 0);
    });
  };

  return (
    <div className="w-full h-full relative bg-transparent z-0">
      <div className="absolute inset-0 z-0">
        <Tldraw 
          autoFocus={true}
          onMount={handleMount}
          options={{ maxPages: 1 }}
          components={{ 
            Toolbar: null, 
            PageMenu: null, 
            HelpMenu: null, 
            NavigationPanel: null, 
            StylePanel: null, 
            MainMenu: null, 
            DebugMenu: null
          }}
        />
      </div>

      {hasSelection && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-[2500] pointer-events-auto animate-in fade-in zoom-in duration-200">
          <button
            onClick={onMix}
            disabled={isMixing}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-full font-medium text-sm tracking-wide shadow-2xl backdrop-blur-xl border border-white/50 transition-all
              ${isMixing 
                ? 'bg-indigo-50/90 text-indigo-700 cursor-wait' 
                : 'bg-indigo-600/90 text-white hover:bg-indigo-700 hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]'
              }
            `}
          >
            <Sparkles size={16} className={isMixing ? 'animate-spin' : ''} />
            {isMixing ? 'Mixing...' : 'Mix Selection'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Canvas;