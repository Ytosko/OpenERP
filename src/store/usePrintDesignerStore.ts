import { create } from 'zustand';
import {
  TemplateSchema,
  PrintElement,
  STARTER_80MM_RECEIPT,
  STARTER_58MM_RECEIPT,
  STARTER_4X6_LABEL,
  STARTER_60X40_LABEL,
  STARTER_50X30_LABEL,
  PageUnit,
  PageMode,
} from '@/types/print-designer';

interface PrintDesignerState {
  mode: 'easy' | 'advanced';
  templates: TemplateSchema[];
  schema: TemplateSchema;
  selectedElementId: string | null;
  zoom: number;
  history: TemplateSchema[];
  historyIndex: number;
  saving: boolean;
  lastSavedAt: string | null;

  setMode: (mode: 'easy' | 'advanced') => void;
  setSchema: (schema: TemplateSchema) => void;
  selectTemplate: (id: string) => void;
  createNewTemplate: (name: string, type: string) => void;
  duplicateTemplate: () => void;
  deleteTemplate: (id: string) => void;
  uploadLogoImage: (dataUrl: string) => void;
  
  setSelectedElementId: (id: string | null) => void;
  setZoom: (zoom: number) => void;
  
  toggleElementEnabled: (id: string) => void;
  updateElement: (id: string, updates: Partial<PrintElement>) => void;
  addElement: (type: PrintElement['type'], label: string) => void;
  deleteElement: (id: string) => void;
  moveElementOrder: (id: string, direction: 'up' | 'down') => void;
  
  setPageSize: (width: number, height: number, unit: PageUnit, mode: PageMode) => void;
  setMargins: (margins: TemplateSchema['page']['margins']) => void;
  
  undo: () => void;
  redo: () => void;
  saveTemplate: () => void;
}

export const usePrintDesignerStore = create<PrintDesignerState>((set, get) => ({
  mode: 'easy',
  templates: [
    STARTER_4X6_LABEL,
    STARTER_80MM_RECEIPT,
    STARTER_58MM_RECEIPT,
    STARTER_60X40_LABEL,
    STARTER_50X30_LABEL,
  ],
  schema: STARTER_4X6_LABEL,
  selectedElementId: null,
  zoom: 100,
  history: [STARTER_4X6_LABEL],
  historyIndex: 0,
  saving: false,
  lastSavedAt: null,

  setMode: (mode) => set({ mode }),

  selectTemplate: (id) => {
    const { templates } = get();
    const found = templates.find((t) => t.id === id);
    if (found) {
      set({
        schema: found,
        history: [found],
        historyIndex: 0,
        selectedElementId: null,
      });
    }
  },

  createNewTemplate: (name, type) => {
    const { templates } = get();
    let base = STARTER_4X6_LABEL;
    if (type === '80mm') base = STARTER_80MM_RECEIPT;
    if (type === '58mm') base = STARTER_58MM_RECEIPT;
    if (type === '60x40') base = STARTER_60X40_LABEL;
    if (type === '50x30') base = STARTER_50X30_LABEL;

    const newSchema: TemplateSchema = {
      ...base,
      id: `tmpl-${Date.now()}`,
      name: name || `Custom Template ${templates.length + 1}`,
    };

    set({
      templates: [...templates, newSchema],
      schema: newSchema,
      history: [newSchema],
      historyIndex: 0,
    });
  },

  duplicateTemplate: () => {
    const { schema, templates } = get();
    const dup: TemplateSchema = {
      ...schema,
      id: `tmpl-${Date.now()}`,
      name: `${schema.name} (Copy)`,
    };
    set({
      templates: [...templates, dup],
      schema: dup,
      history: [dup],
      historyIndex: 0,
    });
  },

  deleteTemplate: (id) => {
    const { templates, schema } = get();
    if (templates.length <= 1) return;
    const remaining = templates.filter((t) => t.id !== id);
    set({
      templates: remaining,
      schema: schema.id === id ? remaining[0] : schema,
    });
  },

  uploadLogoImage: (dataUrl) => {
    const { schema, setSchema } = get();
    const logoEl = schema.elements.find((el) => el.type === 'logo' || el.id === 'e-logo');
    if (logoEl) {
      get().updateElement(logoEl.id, { content: dataUrl });
    } else {
      get().addElement('logo', 'Uploaded Store Logo');
      const updatedLogo = get().schema.elements.find((el) => el.type === 'logo');
      if (updatedLogo) {
        get().updateElement(updatedLogo.id, { content: dataUrl });
      }
    }
  },

  setSchema: (schema) => {
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(schema);

    set({
      schema,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  setSelectedElementId: (selectedElementId) => set({ selectedElementId }),
  setZoom: (zoom) => set({ zoom }),

  toggleElementEnabled: (id) => {
    const { schema, setSchema } = get();
    const updatedElements = schema.elements.map((el) =>
      el.id === id ? { ...el, enabled: !el.enabled } : el
    );
    setSchema({ ...schema, elements: updatedElements });
  },

  updateElement: (id, updates) => {
    const { schema, setSchema } = get();
    const updatedElements = schema.elements.map((el) =>
      el.id === id ? { ...el, ...updates, style: { ...el.style, ...updates.style } } : el
    );
    setSchema({ ...schema, elements: updatedElements });
  },

  addElement: (type, label) => {
    const { schema, setSchema } = get();
    const newId = `el-${Date.now()}`;
    const newElement: PrintElement = {
      id: newId,
      type,
      label,
      enabled: true,
      x: 5,
      y: 10,
      width: Math.min(50, schema.page.width - 10),
      height: 10,
      zIndex: schema.elements.length + 1,
      style: { fontSize: 12, textAlign: 'left' },
    };

    setSchema({ ...schema, elements: [...schema.elements, newElement] });
    set({ selectedElementId: newId });
  },

  deleteElement: (id) => {
    const { schema, setSchema, selectedElementId } = get();
    const updatedElements = schema.elements.filter((el) => el.id !== id);
    setSchema({ ...schema, elements: updatedElements });
    if (selectedElementId === id) set({ selectedElementId: null });
  },

  moveElementOrder: (id, direction) => {
    const { schema, setSchema } = get();
    const index = schema.elements.findIndex((el) => el.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schema.elements.length) return;

    const newElements = [...schema.elements];
    const temp = newElements[index];
    newElements[index] = newElements[targetIndex];
    newElements[targetIndex] = temp;

    setSchema({ ...schema, elements: newElements });
  },

  setPageSize: (width, height, unit, mode) => {
    const { schema, setSchema } = get();
    setSchema({
      ...schema,
      page: {
        ...schema.page,
        width,
        height,
        unit,
        mode,
      },
    });
  },

  setMargins: (margins) => {
    const { schema, setSchema } = get();
    setSchema({
      ...schema,
      page: {
        ...schema.page,
        margins,
      },
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        schema: history[historyIndex - 1],
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        schema: history[historyIndex + 1],
      });
    }
  },

  saveTemplate: () => {
    set({ saving: true });
    setTimeout(() => {
      set({ saving: false, lastSavedAt: new Date().toLocaleTimeString() });
    }, 600);
  },
}));
