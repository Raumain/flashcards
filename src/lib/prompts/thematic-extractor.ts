import { z } from 'zod'

/**
 * System prompt for extracting thematic information from PDF content
 *
 * This prompt instructs the AI to analyze the first pages of a PDF
 * and extract a concise thematic summary for categorization.
 */
export const THEMATIC_EXTRACTION_PROMPT = `Tu es un expert en éducation médicale. Analyse le contenu de ce PDF et extrait la thématique principale.

## Ta tâche
1. Identifie le sujet principal du document
2. Génère un nom court et descriptif (max 50 caractères)
3. Génère une description (max 200 caractères)
4. Suggère une couleur hex et un emoji appropriés

## Règles importantes
- Le nom doit être clair et mémorable
- La description doit résumer le contenu principal
- Choisis une couleur qui correspond au domaine médical
- L'emoji doit être pertinent et professionnel

## Exemples de couleurs par domaine
| Domaine | Couleur | Emoji suggéré |
|---------|---------|---------------|
| Anatomie | #EF4444 (rouge) | 🫀 🦴 🧠 |
| Physiologie | #3B82F6 (bleu) | 💓 🫁 ⚡ |
| Pharmacologie | #10B981 (vert) | 💊 💉 🧪 |
| Pathologie | #8B5CF6 (violet) | 🔬 🦠 ⚕️ |
| Biochimie | #F59E0B (orange) | 🧬 ⚗️ 🔋 |
| Microbiologie | #EC4899 (rose) | 🦠 🧫 🔬 |
| Cardiologie | #DC2626 (rouge foncé) | ❤️ 🫀 💓 |
| Neurologie | #6366F1 (indigo) | 🧠 ⚡ 🔮 |
| Pneumologie | #0EA5E9 (bleu ciel) | 🫁 💨 🌬️ |
| Gastro-entérologie | #84CC16 (vert lime) | 🍽️ 🫃 💚 |
| Néphrologie | #F97316 (orange foncé) | 🫘 💧 🔶 |
| Endocrinologie | #A855F7 (violet clair) | 🦋 ⚖️ 🔬 |
| Hématologie | #E11D48 (rose foncé) | 🩸 🔴 💉 |
| Dermatologie | #FB923C (pêche) | 🩹 ✋ 🌡️ |
| Ophtalmologie | #38BDF8 (bleu clair) | 👁️ 👓 🔍 |
| ORL | #4ADE80 (vert clair) | 👂 👃 🗣️ |
| Rhumatologie | #C084FC (lavande) | 🦴 💪 🤲 |
| Infectiologie | #FACC15 (jaune) | 🦠 🧫 💉 |
| Pédiatrie | #FB7185 (rose clair) | 👶 🧒 🍼 |
| Gériatrie | #9CA3AF (gris) | 👴 🩺 🏥 |
| Psychiatrie | #818CF8 (pervenche) | 🧠 💭 🗣️ |
| Urgences | #F43F5E (rouge vif) | 🚑 ⚠️ 🆘 |
| Chirurgie | #14B8A6 (turquoise) | 🔪 🩺 🏥 |
| Génétique | #D946EF (magenta) | 🧬 🔬 👪 |
| Immunologie | #22D3EE (cyan) | 🛡️ 💪 🔬 |
| Oncologie | #7C3AED (violet foncé) | 🎗️ 🔬 ⚕️ |

## Format de sortie (JSON uniquement)
{
  "name": "Nom de la thématique",
  "description": "Description courte du contenu",
  "color": "#HEX_COLOR",
  "icon": "emoji"
}

## Exemples de sorties attendues

Exemple 1 - Cours d'anatomie cardiaque:
{
  "name": "Anatomie du cœur",
  "description": "Structure et vascularisation cardiaque, cavités et valves",
  "color": "#DC2626",
  "icon": "🫀"
}

Exemple 2 - Cours de pharmacologie des antibiotiques:
{
  "name": "Antibiotiques",
  "description": "Classes d'antibiotiques, mécanismes d'action et résistances",
  "color": "#10B981",
  "icon": "💊"
}

Exemple 3 - Cours de neurologie:
{
  "name": "Système nerveux central",
  "description": "Anatomie et physiologie du cerveau et de la moelle épinière",
  "color": "#6366F1",
  "icon": "🧠"
}

Retourne UNIQUEMENT le JSON, sans texte supplémentaire, sans markdown, sans explication.`

/**
 * Zod schema for validating thematic extraction response
 */
export const thematicExtractionSchema = z.object({
  name: z
    .string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères'),
  description: z
    .string()
    .max(500, 'La description ne doit pas dépasser 500 caractères')
    .optional()
    .nullable()
    .transform((val) => val ?? undefined),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Format de couleur invalide')
    .default('#3B82F6'),
  icon: z.string().min(1).max(10).default('📚'),
})

/**
 * Type inferred from the schema
 */
export type ThematicExtraction = z.infer<typeof thematicExtractionSchema>

/**
 * Default thematic values when extraction fails
 */
export const DEFAULT_THEMATIC: ThematicExtraction = {
  name: 'Document médical',
  description: 'Contenu médical importé',
  color: '#3B82F6',
  icon: '📚',
}

/**
 * Parses and validates thematic extraction response
 * Falls back to defaults if parsing fails
 */
export function parseThematicResponse(response: string): ThematicExtraction {
  try {
    // Clean the response (remove markdown code blocks if present)
    let cleaned = response.trim()
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7)
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3)
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3)
    }
    cleaned = cleaned.trim()

    const parsed = JSON.parse(cleaned)
    const validated = thematicExtractionSchema.safeParse(parsed)

    if (validated.success) {
      return validated.data
    }

    console.warn('[ThematicExtractor] Validation failed:', validated.error.issues)
    return { ...DEFAULT_THEMATIC, name: parsed.name || DEFAULT_THEMATIC.name }
  } catch (error) {
    console.error('[ThematicExtractor] Parse error:', error)
    return DEFAULT_THEMATIC
  }
}
