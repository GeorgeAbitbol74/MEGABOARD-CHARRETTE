import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Canvas from './components/Canvas';
import Toolbar from './components/Toolbar';
import GenerateModal from './components/GenerateModal';
import ChatInterface from './components/ChatInterface';
import ProjectSelector from './components/ProjectSelector';
import { ElementType, CanvasElement, ToolCall, Project } from './types';
import { mixElements, generateImage } from './services/geminiService';
import { Editor, AssetRecordType, createShapeId, TLRecord } from 'tldraw';
import { v4 as uuidv4 } from 'uuid';

interface AppProps {
    embedded?: boolean; // If true, hides project selector (controlled by Laravel)
    projectId?: string; // ID from Laravel
    initialData?: any; // JSON payload from Laravel
    user?: any; // User info from Laravel
}

const App: React.FC<AppProps> = ({ embedded = false, projectId, initialData, user }) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isMixing, setIsMixing] = useState(false);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasCustomTemplate, setHasCustomTemplate] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string>('');

  // --- Project Management State ---
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  useEffect(() => {
    // Check if a custom template exists on load
    setHasCustomTemplate(!!localStorage.getItem('saas_custom_template'));
  }, []);

  // Update selection context for Chat whenever selection changes
  useEffect(() => {
    if (!editor) return;
    const updateContext = () => {
        const selectedShapes = editor.getSelectedShapes();
        if (selectedShapes.length > 0) {
            const contextText = selectedShapes
                // @ts-ignore
                .map(s => s.props?.text || s.props?.name || '')
                .filter(t => t.length > 0)
                .join('\n');
            setSelectedContext(contextText);
        } else {
            setSelectedContext('');
        }
    };
    const cleanup = editor.store.listen(updateContext);
    return cleanup;
  }, [editor]);

  // Helper: Create the "Architect Workflow" Template Data (Factory Default)
  const createFactoryTemplate = () => {
    const cx = 600; 
    const cy = 300; 
    
    // Define the shapes
    const shapes = [
        {
            id: createShapeId('header'),
            typeName: 'shape',
            type: 'text',
            parentId: 'page:page',
            x: cx - 180,
            y: cy - 250,
            rotation: 0,
            index: 'a1',
            props: { text: "PaperBoard Charrette", scale: 2, font: 'serif', w: 800, color: 'black', size: 'xl', align: 'middle', autoSize: true }
        },
        {
            id: createShapeId('label_1'),
            typeName: 'shape',
            type: 'text',
            parentId: 'page:page',
            x: cx - 400,
            y: cy - 40,
            rotation: 0,
            index: 'a2',
            props: { text: "01. INPUT", scale: 0.8, font: 'sans', w: 200, color: 'grey', size: 's', align: 'middle', autoSize: true }
        },
        {
            id: createShapeId('note_1'),
            typeName: 'shape',
            type: 'note',
            parentId: 'page:page',
            x: cx - 400,
            y: cy,
            rotation: 0,
            index: 'a3',
            props: { text: "SURVEY / LIDAR\n\n- Site Context\n- Point Cloud\n- As-Built Data", font: 'draw', color: 'blue', size: 'm', align: 'middle', verticalAlign: 'middle', fontSizeAdjustment: 0, growY: 0, url: '' }
        },
        {
            id: createShapeId('label_2'),
            typeName: 'shape',
            type: 'text',
            parentId: 'page:page',
            x: cx,
            y: cy - 40,
            rotation: 0,
            index: 'a4',
            props: { text: "02. PROCESS", scale: 0.8, font: 'sans', w: 200, color: 'grey', size: 's', align: 'middle', autoSize: true }
        },
        {
            id: createShapeId('note_2'),
            typeName: 'shape',
            type: 'note',
            parentId: 'page:page',
            x: cx,
            y: cy,
            rotation: 0,
            index: 'a5',
            props: { text: "AI & SKETCH\n\n- Concept Mixing\n- Moodboards\n- Iterations", font: 'draw', color: 'yellow', size: 'm', align: 'middle', verticalAlign: 'middle', fontSizeAdjustment: 0, growY: 0, url: '' }
        },
        {
            id: createShapeId('label_3'),
            typeName: 'shape',
            type: 'text',
            parentId: 'page:page',
            x: cx + 400,
            y: cy - 40,
            rotation: 0,
            index: 'a6',
            props: { text: "03. OUTPUT", scale: 0.8, font: 'sans', w: 200, color: 'grey', size: 's', align: 'middle', autoSize: true }
        },
        {
            id: createShapeId('note_3'),
            typeName: 'shape',
            type: 'note',
            parentId: 'page:page',
            x: cx + 400,
            y: cy,
            rotation: 0,
            index: 'a7',
            props: { text: "PRODUCTION\n\n- ArchViz Renders\n- 3D Printing\n- Client VR", font: 'draw', color: 'red', size: 'm', align: 'middle', verticalAlign: 'middle', fontSizeAdjustment: 0, growY: 0, url: '' }
        },
        {
            id: createShapeId('arrow_1'),
            typeName: 'shape',
            type: 'arrow',
            parentId: 'page:page',
            x: cx - 180,
            y: cy + 100,
            rotation: 0,
            index: 'a8',
            props: { start: { type: 'point', x: 0, y: 0 }, end: { type: 'point', x: 160, y: 0 }, arrowheadEnd: 'arrow', arrowheadStart: 'none', color: 'black', size: 'm', labelColor: 'black', fill: 'none', dash: 'draw', bend: 0, text: '', labelPosition: 0.5 }
        },
        {
            id: createShapeId('arrow_2'),
            typeName: 'shape',
            type: 'arrow',
            parentId: 'page:page',
            x: cx + 220,
            y: cy + 100,
            rotation: 0,
            index: 'a9',
            props: { start: { type: 'point', x: 0, y: 0 }, end: { type: 'point', x: 160, y: 0 }, arrowheadEnd: 'arrow', arrowheadStart: 'none', color: 'black', size: 'm', labelColor: 'black', fill: 'none', dash: 'draw', bend: 0, text: '', labelPosition: 0.5 }
        }
    ];
    
    // Convert to Tldraw Store format
    const storeData: Record<string, any> = {};
    shapes.forEach(s => {
        storeData[s.id] = s;
    });
    
    // Return structured data
    return { store: storeData };
  };

  // Get the Template to use (Custom > Factory)
  const getStartingTemplate = () => {
    const customTemplate = localStorage.getItem('saas_custom_template');
    if (customTemplate) {
        try {
            return JSON.parse(customTemplate);
        } catch (e) {
            console.error("Error parsing custom template", e);
            return createFactoryTemplate();
        }
    }
    return createFactoryTemplate();
  };

  const handleSaveAsTemplate = () => {
      if (!editor) return;
      const snapshot = editor.store.getSnapshot();
      const camera = editor.getCamera();
      const templateData = { store: snapshot.store, schema: snapshot.schema, camera: camera };
      localStorage.setItem('saas_custom_template', JSON.stringify(templateData));
      setHasCustomTemplate(true);
      alert("Template sauvegardé avec le zoom actuel !");
  };

  const handleResetTemplate = () => {
      if (window.confirm("Revenir au template par défaut ?")) {
          localStorage.removeItem('saas_custom_template');
          setHasCustomTemplate(false);
      }
  };

  // Initialize Projects OR Load Embedded Data
  useEffect(() => {
    // MODE: EMBEDDED (Laravel Integration)
    if (embedded && projectId) {
        // Create a transient project object for UI display
        const laravelProject: Project = { 
            id: projectId, 
            name: `Project #${projectId}`, 
            updatedAt: Date.now() 
        };
        setCurrentProject(laravelProject);
        
        // Use initialData from Laravel if available, otherwise default
        if (initialData) {
            localStorage.setItem(`saas_project_data_${projectId}`, JSON.stringify(initialData));
        } else {
            // If new project in Laravel, init with template
            const templateData = getStartingTemplate();
            localStorage.setItem(`saas_project_data_${projectId}`, JSON.stringify(templateData));
        }
        return;
    }

    // MODE: STANDALONE (Local Browser)
    const storedProjects = localStorage.getItem('saas_projects');
    if (storedProjects) {
      const parsed = JSON.parse(storedProjects);
      if (parsed.length > 0) {
        setProjects(parsed);
        setCurrentProject(parsed[0]);
        return;
      }
    }

    // First time load: Create default project
    const defaultId = 'default-1';
    const defaultProject: Project = { id: defaultId, name: 'Office Renovation', updatedAt: Date.now() };
    const templateData = getStartingTemplate();
    
    localStorage.setItem('saas_projects', JSON.stringify([defaultProject]));
    localStorage.setItem(`saas_project_data_${defaultId}`, JSON.stringify(templateData));
    setProjects([defaultProject]);
    setCurrentProject(defaultProject);

  }, [embedded, projectId, initialData]);

  // Save State
  const saveCurrentProjectState = () => {
    if (editor && currentProject) {
      const snapshot = editor.store.getSnapshot();
      const camera = editor.getCamera();
      const projectData = { ...snapshot, camera: camera };

      // Always save to LocalStorage for resilience
      localStorage.setItem(`saas_project_data_${currentProject.id}`, JSON.stringify(projectData));
      
      // If Standalone, update project list timestamp
      if (!embedded) {
        const updatedProjects = projects.map(p => 
            p.id === currentProject.id ? { ...p, updatedAt: Date.now() } : p
        );
        setProjects(updatedProjects);
        localStorage.setItem('saas_projects', JSON.stringify(updatedProjects));
      } else {
        // If Embedded, we should trigger an auto-save callback to Laravel here
        // console.log("Sending save to Laravel API...", projectData);
      }
    }
  };

  // Memoize the initial snapshot
  const initialSnapshot = useMemo(() => {
    if (!currentProject) return undefined;
    const data = localStorage.getItem(`saas_project_data_${currentProject.id}`);
    return data ? JSON.parse(data) : undefined;
  }, [currentProject]);

  // --- Handlers ---
  const handleSwitchProject = (projectId: string) => {
    saveCurrentProjectState();
    const nextProject = projects.find(p => p.id === projectId);
    if (nextProject) setCurrentProject(nextProject);
  };

  const handleCreateProject = (name: string) => {
    saveCurrentProjectState();
    const newId = uuidv4();
    const newProject: Project = { id: newId, name: name, updatedAt: Date.now() };
    const templateData = getStartingTemplate();
    localStorage.setItem(`saas_project_data_${newId}`, JSON.stringify(templateData));
    const newProjectsList = [...projects, newProject];
    setProjects(newProjectsList);
    localStorage.setItem('saas_projects', JSON.stringify(newProjectsList));
    setCurrentProject(newProject);
  };

  const handleDeleteProject = (projectId: string) => {
    localStorage.removeItem(`saas_project_data_${projectId}`);
    let newProjectsList = projects.filter(p => p.id !== projectId);
    let nextProject = currentProject;
    if (newProjectsList.length === 0) {
       const defaultId = uuidv4();
       const defaultProject = { id: defaultId, name: 'Mon Projet', updatedAt: Date.now() };
       const templateData = getStartingTemplate();
       localStorage.setItem(`saas_project_data_${defaultId}`, JSON.stringify(templateData));
       newProjectsList = [defaultProject];
       nextProject = defaultProject;
    } else if (currentProject?.id === projectId) {
       nextProject = newProjectsList[0];
    }
    setProjects(newProjectsList);
    localStorage.setItem('saas_projects', JSON.stringify(newProjectsList));
    if (nextProject) setCurrentProject(nextProject);
  };

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
        saveCurrentProjectState();
    }, 30000);
    return () => clearInterval(interval);
  }, [editor, currentProject, projects]);


  // --- Tldraw Logic ---
  const handleMix = async () => {
    if (!editor) return;
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length === 0) return;

    setIsMixing(true);

    try {
      const canvasElements: CanvasElement[] = selectedShapes.map(shape => {
         let content = '';
         let type = ElementType.TEXT;

         if (shape.type === 'text' || shape.type === 'geo' || shape.type === 'note') {
             // @ts-ignore
             content = shape.props.text || '';
             type = shape.type === 'note' ? ElementType.NOTE : ElementType.TEXT;
         } else if (shape.type === 'image') {
             type = ElementType.IMAGE;
             // @ts-ignore
             const assetId = shape.props.assetId;
             const asset = editor.getAsset(assetId);
             // @ts-ignore
             if (asset && asset.props.src) content = asset.props.src; 
         }
         return { id: shape.id, type, content };
      });

      const validElements = canvasElements.filter(e => e.content);
      if (validElements.length === 0) {
          alert("Select shapes with content.");
          setIsMixing(false);
          return;
      }

      const result = await mixElements(validElements);
      const { x, y, w, h } = editor.getViewportScreenBounds();
      const pagePoint = editor.screenToPage({ x: x + w / 2, y: y + h / 2 });

      if (result.type === ElementType.IMAGE) {
          await addImageToCanvas(result.content, result.promptUsed);
      } else {
          editor.createShape({
              type: result.type === ElementType.NOTE ? 'note' : 'text',
              x: pagePoint.x + 50,
              y: pagePoint.y + 50,
              props: { text: result.content }
          });
      }
    } catch (error) {
      console.error("Mix failed:", error);
      alert("Mix failed.");
    } finally {
      setIsMixing(false);
    }
  };

  const addImageToCanvas = async (dataUrl: string, prompt?: string, position?: { x: number, y: number }) => {
    if (!editor) return;
    const assetId = AssetRecordType.createId();
    const img = new Image();
    img.src = dataUrl;
    try {
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("Image failed"));
        });
    } catch(e) { return; }

    const mimeType = dataUrl.substring(dataUrl.indexOf(':') + 1, dataUrl.indexOf(';')) || 'image/png';
    editor.createAssets([{
        id: assetId, typeName: 'asset', type: 'image',
        props: { name: prompt || 'img', src: dataUrl, w: img.width, h: img.height, mimeType, isAnimated: false },
        meta: {}
    }]);

    let pagePoint = position;
    let targetW = 400;
    let targetH = (img.height / img.width) * targetW;

    if (!pagePoint) {
        const { x, y, w, h } = editor.getViewportScreenBounds();
        pagePoint = editor.screenToPage({ x: x + w / 2, y: y + h / 2 });
        pagePoint.x -= targetW / 2;
        pagePoint.y -= targetH / 2;
    }

    editor.createShape({
        type: 'image',
        x: pagePoint.x,
        y: pagePoint.y,
        rotation: (Math.random() * 0.1) - 0.05,
        props: { assetId, w: targetW, h: targetH }
    });
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) addImageToCanvas(event.target.result as string, "User Upload");
      };
      reader.readAsDataURL(file);
    }
  };

  // --- TOOL CALL HANDLERS ---
  const handleToolCalls = async (toolCalls: ToolCall[]) => {
    if (!editor) return;
    const { x, y, w, h } = editor.getViewportScreenBounds();
    const center = editor.screenToPage({ x: x + w / 2, y: y + h / 2 });

    for (const call of toolCalls) {
      
      // 1. GENERATE MOODBOARD
      if (call.name === 'generate_moodboard') {
        const prompts = call.args.image_descriptions as string[];
        if (!prompts || prompts.length === 0) continue;
        
        const cols = prompts.length > 4 ? 3 : 2;
        const gap = 420;
        const startX = center.x - ((cols * gap) / 2) + 200;
        const startY = center.y - 300;

        const promises = prompts.map(async (prompt, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            const posX = startX + (col * gap);
            const posY = startY + (row * 350) + ((col % 2) * 50);
            const base64 = await generateImage(prompt);
            await addImageToCanvas(base64, prompt, { x: posX, y: posY });
        });
        await Promise.all(promises);
      }

      // 2. BRAINSTORM IDEAS
      else if (call.name === 'brainstorm_ideas') {
          const ideas = call.args.ideas as string[];
          const color = call.args.color || 'yellow';
          if (!ideas) continue;

          ideas.forEach((idea, i) => {
              const radius = 300 + Math.random() * 200;
              const angle = (i / ideas.length) * Math.PI * 2;
              const noteX = center.x + Math.cos(angle) * radius - 100;
              const noteY = center.y + Math.sin(angle) * radius - 100;
              
              editor.createShape({
                  type: 'note',
                  x: noteX,
                  y: noteY,
                  rotation: (Math.random() * 0.2) - 0.1,
                  props: { text: idea, color: color, size: 'm' }
              });
          });
      }

      // 3. GENERATE DIAGRAM
      else if (call.name === 'generate_diagram') {
          const nodes = call.args.nodes || [];
          const edges = call.args.edges || [];
          if (nodes.length === 0) continue;

          const cols = Math.ceil(Math.sqrt(nodes.length));
          const gapX = 300;
          const gapY = 200;
          const nodeMap = new Map<string, string>();

          const startX = center.x - (cols * gapX) / 2;
          const startY = center.y - (Math.ceil(nodes.length / cols) * gapY) / 2;
          const validColors = ['black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow', 'orange', 'green', 'light-green', 'red', 'light-red'];

          editor.batch(() => {
              nodes.forEach((node: any, i: number) => {
                  const r = Math.floor(i / cols);
                  const c = i % cols;
                  const shapeId = createShapeId();
                  nodeMap.set(node.id, shapeId);

                  let color = 'black';
                  if (node.type === 'decision') color = 'orange';
                  if (node.type === 'start') color = 'green';
                  if (node.type === 'end') color = 'red';
                  if (!validColors.includes(color)) color = 'black';

                  editor.createShape({
                      id: shapeId,
                      type: 'geo',
                      x: startX + c * gapX,
                      y: startY + r * gapY,
                      props: {
                          geo: 'rectangle',
                          text: node.label,
                          w: 200,
                          h: 100,
                          color: color,
                          fill: 'semi'
                      }
                  });
              });
          });

          editor.batch(() => {
              edges.forEach((edge: any) => {
                  const fromId = nodeMap.get(edge.from);
                  const toId = nodeMap.get(edge.to);

                  if (fromId && toId) {
                      editor.createShape({
                          type: 'arrow',
                          props: {
                              start: { 
                                  type: 'binding', 
                                  boundShapeId: fromId, 
                                  normalizedAnchor: { x: 0.5, y: 0.5 }, 
                                  isPrecise: true 
                              },
                              end: { 
                                  type: 'binding', 
                                  boundShapeId: toId, 
                                  normalizedAnchor: { x: 0.5, y: 0.5 }, 
                                  isPrecise: true 
                              },
                              text: edge.label || '',
                              arrowheadEnd: 'arrow',
                              arrowheadStart: 'none'
                          }
                      });
                  }
              });
          });
      }
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden font-sans relative">
      {/* Show Project Selector only if NOT embedded */}
      {!embedded && currentProject && (
        <ProjectSelector 
          currentProject={currentProject}
          projects={projects}
          onSwitchProject={handleSwitchProject}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onSaveTemplate={handleSaveAsTemplate}
          onResetTemplate={handleResetTemplate}
          hasCustomTemplate={hasCustomTemplate}
        />
      )}
      
      {currentProject && (
        <Canvas 
            key={currentProject.id}
            onMount={setEditor}
            onMix={handleMix}
            isMixing={isMixing}
            initialSnapshot={initialSnapshot}
        />
      )}

      <Toolbar editor={editor} onUploadImage={handleUploadImage} />
      <ChatInterface 
          onGenerateImageRequest={() => setIsGenModalOpen(true)} 
          onToolCall={handleToolCalls} 
          selectedContext={selectedContext}
      />
      <GenerateModal 
        isOpen={isGenModalOpen} onClose={() => setIsGenModalOpen(false)}
        onGenerate={async (p) => { 
            setIsGenerating(true); 
            const b64 = await generateImage(p); 
            await addImageToCanvas(b64, p); 
            setIsGenerating(false); 
            setIsGenModalOpen(false); 
        }}
        isGenerating={isGenerating}
      />
    </div>
  );
};

export default App;