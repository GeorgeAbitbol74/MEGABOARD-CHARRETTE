import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { CanvasElement, ElementType, ChatMessage, ChatResponse } from "../types";

// --- CONFIGURATION ---
// Pour l'intégration Laravel : 
// 1. Créez un fichier .env à la racine du projet React : VITE_GOOGLE_API_KEY=votre_cle
// 2. Pour la prod, remplacez les appels directs par des fetch vers votre API Laravel (/api/ai/generate)

const USE_BACKEND_PROXY = process.env.VITE_USE_BACKEND === 'true';

// Instance locale (Mode Démo / Dev)
// En production SaaS, nous éviterons d'instancier ceci côté client pour ne pas exposer la clé
const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

// Helper to clean base64 string for API
const cleanBase64 = (dataUrl: string) => {
  return dataUrl.split(',')[1] || dataUrl;
};

// Determine mime type
const getMimeType = (dataUrl: string) => {
  if (dataUrl.startsWith('data:image/png')) return 'image/png';
  if (dataUrl.startsWith('data:image/jpeg')) return 'image/jpeg';
  if (dataUrl.startsWith('data:image/webp')) return 'image/webp';
  return 'image/png';
};

// --- Function Declarations (Tools) ---

const generateMoodboardTool: FunctionDeclaration = {
  name: 'generate_moodboard',
  description: 'Generates a set of AI images to form a visual moodboard based on a theme. Use this when the user asks for images, inspiration, visual references, or textures.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      image_descriptions: {
        type: Type.ARRAY,
        description: 'A list of distinct, detailed image prompts to generate.',
        items: { type: Type.STRING }
      },
      layout_style: {
        type: Type.STRING,
        description: 'The preferred layout style.',
        enum: ['grid', 'scattered']
      }
    },
    required: ['image_descriptions']
  }
};

const brainstormIdeasTool: FunctionDeclaration = {
  name: 'brainstorm_ideas',
  description: 'Generates a list of short concepts or ideas to be placed as sticky notes on the canvas. Use this when the user asks for ideas, concepts, lists, or brainstorming.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      ideas: {
        type: Type.ARRAY,
        description: 'A list of short, punchy text strings (max 15 words each).',
        items: { type: Type.STRING }
      },
      color: {
        type: Type.STRING,
        description: 'The color of the sticky notes.',
        enum: ['yellow', 'blue', 'red', 'green', 'violet']
      }
    },
    required: ['ideas']
  }
};

const generateDiagramTool: FunctionDeclaration = {
  name: 'generate_diagram',
  description: 'Generates a structured node-and-edge diagram or flowchart. Use this when the user asks to map out a process, an organization, a floor plan hierarchy, or a relationship graph.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      nodes: {
        type: Type.ARRAY,
        description: 'List of nodes (boxes) in the diagram.',
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: 'Unique simple ID (e.g., "n1")' },
            label: { type: Type.STRING, description: 'Text inside the node' },
            type: { type: Type.STRING, enum: ['start', 'process', 'decision', 'end'], description: 'Type determines visual shape' }
          },
          required: ['id', 'label']
        }
      },
      edges: {
        type: Type.ARRAY,
        description: 'List of connections between nodes.',
        items: {
          type: Type.OBJECT,
          properties: {
            from: { type: Type.STRING, description: 'ID of the source node' },
            to: { type: Type.STRING, description: 'ID of the target node' },
            label: { type: Type.STRING, description: 'Optional label on the arrow' }
          },
          required: ['from', 'to']
        }
      }
    },
    required: ['nodes', 'edges']
  }
};

/**
 * Mixes selected elements to generate new content.
 */
export const mixElements = async (elements: CanvasElement[]): Promise<{ type: ElementType, content: string, promptUsed: string }> => {
  if (elements.length === 0) throw new Error("No elements to mix");
  if (!ai && !USE_BACKEND_PROXY) throw new Error("API Key missing. Please check your .env file.");

  // Classification of mix type
  const images = elements.filter(e => e.type === ElementType.IMAGE);
  const texts = elements.filter(e => e.type === ElementType.TEXT || e.type === ElementType.NOTE);

  // Case 1: Text + Text -> Synthesis
  if (images.length === 0 && texts.length > 0) {
    const combinedText = texts.map(t => t.content).join('\n---\n');
    
    // TODO: Implement fetch('/api/ai/text-mix', { body: ... }) for Laravel
    if (ai) {
        const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a creative assistant for an architectural design studio called "L'ami Charrette". 
        Combine, summarize, or expand upon the following ideas into a cohesive concept note:
        
        ${combinedText}`,
        config: {
            systemInstruction: "Keep it concise, inspiring, and professional.",
        }
        });
        return { type: ElementType.NOTE, content: response.text || "No response generated.", promptUsed: "Text Synthesis" };
    }
  }

  // Case 2: Image Generation / Remixing
  if (images.length > 0 || texts.length > 0) {
    let prompt = "A high quality architectural visualization or artistic composition.";
    if (texts.length > 0) {
      prompt = texts.map(t => t.content).join(' ');
    }

    const parts: any[] = [];
    parts.push({ text: prompt });

    if (images.length > 0) {
      const img = images[0];
      if (img.content && img.content.startsWith('data:')) {
        parts.push({
            inlineData: {
              data: cleanBase64(img.content),
              mimeType: getMimeType(img.content)
            }
          });
          parts.push({ text: "Use the provided image as a strong visual reference or composition guide." });
      }
    }

    try {
        // TODO: Implement fetch('/api/ai/image-remix', { body: ... }) for Laravel
      if (ai) {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
          });

          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const base64Str = part.inlineData.data;
              const mimeType = part.inlineData.mimeType || 'image/png';
              return {
                type: ElementType.IMAGE,
                content: `data:${mimeType};base64,${base64Str}`,
                promptUsed: prompt
              };
            }
          }
      }
      throw new Error("No image generated.");
    } catch (e) {
      console.error("Gemini Image Gen Error:", e);
      throw e;
    }
  }

  throw new Error("Unsupported mix combination.");
};

/**
 * Direct Text-to-Image generation
 */
export const generateImage = async (prompt: string): Promise<string> => {
  if (!ai && !USE_BACKEND_PROXY) throw new Error("API Key missing.");

  // TODO: Implement fetch('/api/ai/image-gen', { body: { prompt } }) for Laravel
  if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const mimeType = part.inlineData.mimeType || 'image/png';
          return `data:${mimeType};base64,${part.inlineData.data}`;
        }
      }
  }
  throw new Error("Failed to generate image");
};

/**
 * Chat with Gemini 3 Pro (With Tools)
 */
export const sendChatMessage = async (history: ChatMessage[], newMessage: string, image?: string, context?: string): Promise<ChatResponse> => {
  if (!ai && !USE_BACKEND_PROXY) throw new Error("API Key missing.");

  const parts: any[] = [];
  
  if (context) {
      parts.push({ text: `[CONTEXT FROM CANVAS SELECTION]: ${context}\n\nUser Question based on context:` });
  }

  if (image) {
    parts.push({
      inlineData: {
        data: cleanBase64(image),
        mimeType: getMimeType(image)
      }
    });
  }

  parts.push({ text: newMessage });

  // TODO: Implement fetch('/api/ai/chat', { body: { messages: ... } }) for Laravel
  if (ai) {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
        role: 'user',
        parts: parts
        },
        config: {
        systemInstruction: "You are 'L'ami Charrette AI'. You help architects and designers. \n" +
                            "Your capabilities:\n" +
                            "1. If asked for images/moodboards -> Use `generate_moodboard`.\n" +
                            "2. If asked for ideas, concepts, lists -> Use `brainstorm_ideas` (creates sticky notes).\n" +
                            "3. If asked for diagrams, flowcharts, hierarchies -> Use `generate_diagram`.\n" +
                            "4. Otherwise, answer helpfully in text.\n" +
                            "Be concise and professional.",
        tools: [{ functionDeclarations: [generateMoodboardTool, brainstormIdeasTool, generateDiagramTool] }]
        }
      });

      const candidate = response.candidates?.[0];
      const modelParts = candidate?.content?.parts || [];
      
      let text = "";
      const toolCalls: any[] = [];

      for (const part of modelParts) {
        if (part.text) {
        text += part.text;
        }
        if (part.functionCall) {
        toolCalls.push(part.functionCall);
        }
      }

      return {
        text: text || (toolCalls.length > 0 ? "Working on your canvas..." : "I couldn't generate a response."),
        toolCalls: toolCalls.length > 0 ? toolCalls : undefined
      };
  }
  
  return { text: "Error: No AI Connection" };
};