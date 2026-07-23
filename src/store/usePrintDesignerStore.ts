import { create } from 'zustand';
import {
  TemplateSchema,
  PrintElement,
  STARTER_80MM_RECEIPT,
  STARTER_58MM_RECEIPT,
  STARTER_4X6_LABEL,
  STARTER_RONGTA_RP400,
  STARTER_60X40_LABEL,
  STARTER_50X30_LABEL,
  PageUnit,
  PageMode,
} from '@/types/print-designer';

const LOCAL_STORAGE_TEMPLATES_KEY = 'modular_pos_print_templates_v2';
const LOCAL_STORAGE_ACTIVE_SCHEMA_KEY = 'modular_pos_active_schema_v2';

function loadInitialTemplates(): TemplateSchema[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load saved templates from localStorage:', err);
  }
  return [
    STARTER_RONGTA_RP400,
    STARTER_4X6_LABEL,
    STARTER_80MM_RECEIPT,
    STARTER_58MM_RECEIPT,
    STARTER_60X40_LABEL,
    STARTER_50X30_LABEL,
  ];
}

function loadInitialSchema(templates: TemplateSchema[]): TemplateSchema {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SCHEMA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load active schema from localStorage:', err);
  }
  return templates[0] || STARTER_RONGTA_RP400;
}

function saveToLocalStorage(templates: TemplateSchema[], activeSchema: TemplateSchema) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(templates));
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SCHEMA_KEY, JSON.stringify(activeSchema));
  } catch (err) {
    console.warn('Failed to save templates to localStorage:', err);
  }
}

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
  createNewTemplate: (
    name: string,
    presetType: string,
    customOpts?: { width: number; height: number; unit: PageUnit; mode: PageMode }
  ) => void;
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

const initialTemplates = loadInitialTemplates();
const initialSchema = loadInitialSchema(initialTemplates);

export const usePrintDesignerStore = create<PrintDesignerState>((set, get) => ({
  mode: 'easy',
  templates: initialTemplates,
  schema: initialSchema,
  selectedElementId: null,
  zoom: 100,
  history: [initialSchema],
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
      saveToLocalStorage(templates, found);
    }
  },

  createNewTemplate: (name, presetType, customOpts) => {
    const { templates } = get();
    let base = STARTER_RONGTA_RP400;

    if (presetType === '80mm') base = STARTER_80MM_RECEIPT;
    if (presetType === '58mm') base = STARTER_58MM_RECEIPT;
    if (presetType === '4x6') base = STARTER_4X6_LABEL;
    if (presetType === '60x40') base = STARTER_60X40_LABEL;
    if (presetType === '50x30') base = STARTER_50X30_LABEL;

    let pageConfig = { ...base.page };
    if (presetType === 'custom' && customOpts) {
      pageConfig = {
        ...pageConfig,
        width: customOpts.width,
        height: customOpts.height,
        unit: customOpts.unit,
        mode: customOpts.mode,
      };
    }

    const newSchema: TemplateSchema = {
      ...base,
      id: `tmpl-${Date.now()}`,
      name: name || `Custom Template ${templates.length + 1}`,
      page: pageConfig,
    };

    const newTemplates = [...templates, newSchema];
    set({
      templates: newTemplates,
      schema: newSchema,
      history: [newSchema],
      historyIndex: 0,
    });
    saveToLocalStorage(newTemplates, newSchema);
  },

  duplicateTemplate: () => {
    const { schema, templates } = get();
    const dup: TemplateSchema = {
      ...schema,
      id: `tmpl-${Date.now()}`,
      name: `${schema.name} (Copy)`,
    };
    const newTemplates = [...templates, dup];
    set({
      templates: newTemplates,
      schema: dup,
      history: [dup],
      historyIndex: 0,
    });
    saveToLocalStorage(newTemplates, dup);
  },

  deleteTemplate: (id) => {
    const { templates, schema } = get();
    if (templates.length <= 1) return;
    const remaining = templates.filter((t) => t.id !== id);
    const active = schema.id === id ? remaining[0] : schema;
    set({
      templates: remaining,
      schema: active,
    });
    saveToLocalStorage(remaining, active);
  },

  uploadLogoImage: (dataUrl) => {
    const { schema } = get();
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
    const { history, historyIndex, templates } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(schema);

    // Update in templates list as well
    const updatedTemplates = templates.map((t) => (t.id === schema.id ? schema : t));

    set({
      schema,
      templates: updatedTemplates,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
    saveToLocalStorage(updatedTemplates, schema);
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
      const prev = history[historyIndex - 1];
      set({
        historyIndex: historyIndex - 1,
        schema: prev,
      });
      saveToLocalStorage(get().templates, prev);
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        historyIndex: historyIndex + 1,
        schema: next,
      });
      saveToLocalStorage(get().templates, next);
    }
  },

  saveTemplate: () => {
    const { schema, templates } = get();
    const updatedTemplates = templates.map((t) => (t.id === schema.id ? schema : t));
    
    set({
      saving: true,
      templates: updatedTemplates,
    });
    
    saveToLocalStorage(updatedTemplates, schema);

    setTimeout(() => {
      set({ saving: false, lastSavedAt: new Date().toLocaleTimeString() });
    }, 400);
  },
}));
