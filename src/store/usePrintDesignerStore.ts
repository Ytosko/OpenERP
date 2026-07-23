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
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/store/useAuthStore';

const LOCAL_STORAGE_TEMPLATES_KEY = 'modular_pos_print_templates_v2';
const LOCAL_STORAGE_ACTIVE_SCHEMA_KEY = 'modular_pos_active_schema_v2';

const STARTER_TEMPLATES: TemplateSchema[] = [
  STARTER_RONGTA_RP400,
  STARTER_4X6_LABEL,
  STARTER_80MM_RECEIPT,
  STARTER_58MM_RECEIPT,
  STARTER_60X40_LABEL,
  STARTER_50X30_LABEL,
];

/** DB rows use UUID ids; local starter/unsaved templates use tmpl-* ids. */
const isDbId = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

function schemaToRow(schema: TemplateSchema, projectId: string, userId?: string) {
  return {
    project_id: projectId,
    name: schema.name,
    document_type: 'receipt',
    page_mode: schema.page.mode,
    width: schema.page.width,
    height: schema.page.height ?? null,
    unit: schema.page.unit,
    margin_top: schema.page.margins.top,
    margin_right: schema.page.margins.right,
    margin_bottom: schema.page.margins.bottom,
    margin_left: schema.page.margins.left,
    orientation: schema.page.orientation,
    dpi: schema.page.dpi,
    // Full schema snapshot is the source of truth for rendering.
    layout: schema as unknown as Record<string, unknown>,
    settings: schema.editor as unknown as Record<string, unknown>,
    status: 'published',
    created_by: userId ?? null,
  };
}

function rowToSchema(row: any): TemplateSchema {
  const snapshot = row.layout as TemplateSchema | null;
  if (snapshot && Array.isArray(snapshot.elements) && snapshot.page) {
    return { ...snapshot, id: row.id, name: row.name };
  }
  // Fallback for rows written by other tools: rebuild from columns.
  return {
    id: row.id,
    name: row.name,
    version: 1,
    page: {
      mode: (row.page_mode as PageMode) || 'continuous',
      width: Number(row.width) || 80,
      height: Number(row.height) || 150,
      unit: (row.unit as PageUnit) || 'mm',
      orientation: row.orientation || 'portrait',
      margins: {
        top: Number(row.margin_top) || 3,
        right: Number(row.margin_right) || 3,
        bottom: Number(row.margin_bottom) || 3,
        left: Number(row.margin_left) || 3,
      },
      dpi: row.dpi || 203,
    },
    editor: { gridEnabled: true, gridSize: 2, snapEnabled: true },
    elements: [],
  };
}

function cacheLocally(templates: TemplateSchema[], activeSchema: TemplateSchema) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(templates));
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SCHEMA_KEY, JSON.stringify(activeSchema));
  } catch (err) {
    console.warn('Failed to cache templates locally:', err);
  }
}

function loadLocalCache(): { templates: TemplateSchema[]; schema: TemplateSchema } {
  let templates = STARTER_TEMPLATES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) templates = parsed;
    }
  } catch { /* starter fallback */ }

  let schema = templates[0] || STARTER_RONGTA_RP400;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SCHEMA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.id) schema = parsed;
    }
  } catch { /* first template fallback */ }

  return { templates, schema };
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
  loading: boolean;
  lastSavedAt: string | null;
  saveError: string | null;
  /** True once the current schema differs from its last saved state. */
  dirty: boolean;
  loadedProjectId: string | null;

  setMode: (mode: 'easy' | 'advanced') => void;
  setSchema: (schema: TemplateSchema) => void;
  selectTemplate: (id: string) => void;
  createNewTemplate: (
    name: string,
    presetType: string,
    customOpts?: { width: number; height: number; unit: PageUnit; mode: PageMode }
  ) => void;
  duplicateTemplate: () => void;
  deleteTemplate: (id: string) => Promise<void>;
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
  loadTemplatesFromDb: () => Promise<void>;
  saveTemplate: () => Promise<void>;
}

const initialCache = loadLocalCache();

export const usePrintDesignerStore = create<PrintDesignerState>((set, get) => ({
  mode: 'easy',
  templates: initialCache.templates,
  schema: initialCache.schema,
  selectedElementId: null,
  zoom: 100,
  history: [initialCache.schema],
  historyIndex: 0,
  saving: false,
  loading: false,
  lastSavedAt: null,
  saveError: null,
  dirty: false,
  loadedProjectId: null,

  setMode: (mode) => set({ mode }),

  /** Pulls the store's saved templates from the print_templates table. */
  loadTemplatesFromDb: async () => {
    const projectId = useAuthStore.getState().activeProject?.id;
    if (!isSupabaseConfigured() || !projectId) return;
    if (get().loadedProjectId === projectId) return;

    set({ loading: true });
    const { data, error } = await supabase
      .from('print_templates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at');
    set({ loading: false, loadedProjectId: projectId });

    if (error) {
      set({ saveError: `Failed to load saved templates: ${error.message}` });
      return;
    }

    if (data && data.length > 0) {
      const templates = data.map(rowToSchema);
      const current = get().schema;
      const active = templates.find((t) => t.id === current.id) || templates[0];
      set({
        templates,
        schema: active,
        history: [active],
        historyIndex: 0,
        selectedElementId: null,
        dirty: false,
      });
      cacheLocally(templates, active);
    }
    // No rows yet: keep the starter templates — the first SAVE writes them to the DB.
  },

  /** Persists the active template to Supabase (insert for starters, update for saved ones). */
  saveTemplate: async () => {
    const { schema, templates } = get();
    const auth = useAuthStore.getState();
    const projectId = auth.activeProject?.id;

    if (!isSupabaseConfigured() || !projectId) {
      set({ saveError: 'No active store — sign in and select a store to save templates.' });
      return;
    }

    set({ saving: true, saveError: null });
    const row = schemaToRow(schema, projectId, auth.user?.id);

    try {
      if (isDbId(schema.id)) {
        const { error } = await supabase.from('print_templates').update(row).eq('id', schema.id);
        if (error) throw new Error(error.message);
        const updatedTemplates = templates.map((t) => (t.id === schema.id ? schema : t));
        set({ templates: updatedTemplates, dirty: false });
        cacheLocally(updatedTemplates, schema);
      } else {
        const { data, error } = await supabase
          .from('print_templates')
          .insert(row)
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        // Adopt the DB id so future saves update instead of duplicating.
        const savedSchema = { ...schema, id: data.id as string };
        const updatedTemplates = templates.map((t) => (t.id === schema.id ? savedSchema : t));
        set({
          schema: savedSchema,
          templates: updatedTemplates,
          history: [savedSchema],
          historyIndex: 0,
          dirty: false,
        });
        cacheLocally(updatedTemplates, savedSchema);
      }
      set({ saving: false, lastSavedAt: new Date().toLocaleTimeString() });
    } catch (err: any) {
      set({ saving: false, saveError: `Save failed: ${err?.message || err}` });
    }
  },

  selectTemplate: (id) => {
    const { templates } = get();
    const found = templates.find((t) => t.id === id);
    if (found) {
      set({
        schema: found,
        history: [found],
        historyIndex: 0,
        selectedElementId: null,
        dirty: false,
      });
      cacheLocally(templates, found);
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
      dirty: true,
    });
    cacheLocally(newTemplates, newSchema);
    // Persist immediately so a new template exists in the DB from the start.
    void get().saveTemplate();
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
      dirty: true,
    });
    cacheLocally(newTemplates, dup);
    void get().saveTemplate();
  },

  deleteTemplate: async (id) => {
    const { templates, schema } = get();
    if (templates.length <= 1) return;

    if (isDbId(id) && isSupabaseConfigured()) {
      const { error } = await supabase.from('print_templates').delete().eq('id', id);
      if (error) {
        set({ saveError: `Delete failed: ${error.message}` });
        return;
      }
    }

    const remaining = templates.filter((t) => t.id !== id);
    const active = schema.id === id ? remaining[0] : schema;
    set({ templates: remaining, schema: active, dirty: false });
    cacheLocally(remaining, active);
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

    const updatedTemplates = templates.map((t) => (t.id === schema.id ? schema : t));

    set({
      schema,
      templates: updatedTemplates,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      dirty: true,
    });
    cacheLocally(updatedTemplates, schema);
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
        dirty: true,
      });
      cacheLocally(get().templates, prev);
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      set({
        historyIndex: historyIndex + 1,
        schema: next,
        dirty: true,
      });
      cacheLocally(get().templates, next);
    }
  },
}));
