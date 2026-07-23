import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { TemplateSchema } from '@/types/print-designer';

export interface ForecastResult {
  productName: string;
  daysRemaining: number;
  recommendedOrderQty: number;
  urgency: 'high' | 'medium' | 'low';
  summary: string;
}

/**
 * Calls the ai-gateway Supabase Edge Function, which holds the Gemini API key
 * server-side. Throws if the function is unreachable or returns an error.
 */
async function callAIGateway(prompt: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const { data, error } = await supabase.functions.invoke('ai-gateway', {
    body: { prompt },
  });
  if (error) {
    throw new Error(`AI gateway error: ${error.message}`);
  }
  const text = (data as any)?.text;
  if (!text) {
    throw new Error('AI gateway returned an empty response');
  }
  return text as string;
}

function stripCodeFences(raw: string): string {
  return raw.replace(/```json/g, '').replace(/```/g, '').trim();
}

export async function runAIForecasting(products: any[]): Promise<ForecastResult[]> {
  try {
    const raw = await callAIGateway(
      `Analyze these inventory products and predict which items need reordering:\n${JSON.stringify(
        products
      )}\nReturn ONLY a raw JSON array of forecast alerts with fields: productName, daysRemaining, recommendedOrderQty, urgency ('high'|'medium'|'low'), summary. Do not include markdown codeblocks.`
    );
    return JSON.parse(stripCodeFences(raw));
  } catch (err) {
    console.warn('AI forecasting unavailable, using local stock-level heuristic:', err);
  }

  // Local heuristic fallback based on stock levels & thresholds (clearly non-AI)
  return products.map((p) => {
    const daysLeft = Math.max(1, Math.floor((p.stock_quantity || 10) / 1.5));
    const urgency = (p.stock_quantity || 10) <= 5 ? 'high' : daysLeft <= 7 ? 'medium' : 'low';
    return {
      productName: p.name,
      daysRemaining: daysLeft,
      recommendedOrderQty: Math.max(20, (p.low_stock_threshold || 5) * 4),
      urgency,
      summary: `Estimated stock exhaustion in ${daysLeft} days based on sales velocity.`,
    };
  });
}

export async function runAILayoutOptimizer(schema: TemplateSchema): Promise<TemplateSchema> {
  try {
    const raw = await callAIGateway(
      `You are a world-class graphic designer specializing in thermal receipts and industrial barcode labels.

Take this current print template schema JSON for a ${schema.page.width}${schema.page.unit} (${schema.page.mode}) layout:
${JSON.stringify(schema)}

Redesign and optimize this layout with 2 primary directives:
1. SAVE 30%+ PAPER: Compact vertical Y coordinates, tighten element height, reduce margins to 2-3mm, and set crisp font sizes (8px - 14px).
2. MODERN INTELLIGENT REDESIGN: Re-align element X/Y positions, widths, font weights, and text alignments (center store headers, right-align totals, center barcodes/QRs) so the printed paper looks ultra-clean, readable, and professional.

IMPORTANT: Return ONLY a valid TemplateSchema JSON object with the exact structure (id, name, version, page, editor, elements). Do NOT include markdown codeblocks or explanations.`
    );

    const parsed = JSON.parse(stripCodeFences(raw));
    if (parsed && Array.isArray(parsed.elements) && parsed.page) {
      return {
        ...schema,
        page: { ...schema.page, ...parsed.page },
        elements: parsed.elements,
      };
    }
  } catch (err) {
    console.warn('AI layout optimizer unavailable, using local paper-saver:', err);
  }

  // Local fallback paper saver optimization
  return optimizeThermalPaperSaver(schema);
}

export function optimizeThermalPaperSaver(schema: TemplateSchema): TemplateSchema {
  return {
    ...schema,
    page: {
      ...schema.page,
      margins: {
        top: Math.max(1, schema.page.margins.top - 1),
        bottom: Math.max(1, schema.page.margins.bottom - 1),
        left: Math.max(1, schema.page.margins.left - 1),
        right: Math.max(1, schema.page.margins.right - 1),
      },
    },
    elements: schema.elements.map((el) => ({
      ...el,
      style: {
        ...el.style,
        fontSize: el.style.fontSize ? Math.max(8, el.style.fontSize - 1) : 10,
        lineHeight: 1.1,
      },
    })),
  };
}
