/**
 * Service IA — Interprète de documents médicaux
 *
 * Vulgarise les documents médicaux via Gemini.
 * CONTRAINTE LÉGALE : Ne pose JAMAIS de diagnostic, ne suggère JAMAIS de traitement.
 *
 * Pipeline :
 *   Texte brut → PII Stripping → Gemini API → Réponse structurée
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// ============================================================
// SYSTEM PROMPT — Contrôle strict du comportement du modèle
// ============================================================
const MEDICAL_INTERPRETER_SYSTEM_PROMPT = `Tu es un assistant de vulgarisation médicale pour l'application Santé CI, un service de santé numérique en Côte d'Ivoire.

Ton rôle est d'expliquer en termes simples et accessibles les documents médicaux qui te sont soumis.

RÈGLES STRICTES ET NON NÉGOCIABLES :
1. Tu n'es PAS médecin. Tu ne dois JAMAIS poser de diagnostic médical.
2. Tu ne dois JAMAIS suggérer un traitement, prescrire un médicament, ni modifier une prescription.
3. Tu ne dois JAMAIS confirmer ou infirmer une maladie spécifique.
4. Si une valeur est hors norme, explique simplement CE QUE MESURE cette valeur, et indique clairement que l'interprétation clinique appartient au médecin.
5. Utilise un langage simple, bienveillant et accessible. Évite le jargon médical sans explication.
6. Adapte ton niveau de langage au contexte ivoirien, en utilisant un français clair.
7. Tu DOIS TOUJOURS terminer ta réponse par la section "⚕️ Rappel Important" ci-après.

FORMAT DE RÉPONSE :
Réponds UNIQUEMENT en JSON valide, sans balises markdown, avec cette structure exacte :
{
  "resume": "Un résumé en 1-2 phrases de ce que contient le document",
  "sections": [
    {
      "titre": "Nom de la section ou de l'examen",
      "explication": "Explication simple de ce que mesure cet élément",
      "valeur": "La valeur trouvée dans le document (si applicable)",
      "statut": "normal" | "attention" | "info",
      "note": "Note complémentaire simple si nécessaire (optionnel)"
    }
  ],
  "disclaimer": "Cet aperçu est fourni à titre informatif uniquement. Il ne remplace en aucun cas l'avis d'un professionnel de santé qualifié. Consultez votre médecin pour toute décision médicale."
}`;

// ============================================================
// PII STRIPPER — Suppression des données personnelles identifiables
// ============================================================

/**
 * Masque les informations personnelles identifiables (PII)
 * avant l'envoi au LLM externe.
 */
export function stripPII(text: string): string {
  let sanitized = text;

  // Masquer les numéros de téléphone ivoiriens (+225 XX XX XX XX XX)
  sanitized = sanitized.replace(/(\+225[\s\-]?(\d[\s\-]?){10,12}|\b0[0-9]\s?\d{2}\s?\d{2}\s?\d{2}\b)/g, '[TEL_MASQUÉ]');

  // Masquer les emails
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[EMAIL_MASQUÉ]');

  // Masquer les numéros CMU (format CMU-AAAA-XXX-NNNNN)
  sanitized = sanitized.replace(/CMU[\s\-]?\d{4}[\s\-]?[A-Z]{2,5}[\s\-]?\d{4,6}/gi, '[CMU_MASQUÉ]');

  // Masquer les numéros de carte d'identité ivoiriens (format courant)
  sanitized = sanitized.replace(/\b[A-Z]{1,2}\d{7,10}\b/g, '[ID_MASQUÉ]');

  // Masquer les noms propres précédés de "Patient:", "Nom:", "Prénom:", "M.", "Mme", "Dr."
  // Note: approche conservative basée sur les patterns plutôt que NER
  sanitized = sanitized.replace(/(Patient\s*:\s*|Nom\s*:\s*|Prénom\s*:\s*)([\w\s\-']{2,40})/gi, '$1[MASQUÉ]');
  sanitized = sanitized.replace(/\b(M\.|Mme\.?|Monsieur|Madame)\s+[\w\-']{2,30}(\s+[\w\-']{2,30})?/gi, '[NOM_MASQUÉ]');

  return sanitized;
}

// ============================================================
// SIMULATION OCR — Extrait le "texte" d'un document
// ============================================================

/**
 * En Phase 2, les documents sont stockés avec une URL chiffrée.
 * Cette fonction simule l'extraction de texte selon le type de document.
 * En Phase 3, on intégrera un vrai OCR (Google Document AI ou Tesseract).
 */
function simulateOCR(documentType: string, documentTitle: string): string {
  const mockTexts: Record<string, string> = {
    RESULTAT_EXAMEN: `RÉSULTAT D'ANALYSE MÉDICALE
Centre d'Analyses Biologiques de Cocody, Abidjan
---
Document: ${documentTitle}
---
NUMÉRATION FORMULE SANGUINE (NFS)
Globules rouges (érythrocytes): 4.2 × 10^6/μL [Norme: 4.2-5.9]
Hémoglobine: 11.8 g/dL [Norme: 13.0-17.5]
Hématocrite: 36% [Norme: 38-52%]
VGM (Volume Globulaire Moyen): 82 fL [Norme: 80-100]
Globules blancs (leucocytes): 8.5 × 10^3/μL [Norme: 4.0-10.0]
Plaquettes: 230 × 10^3/μL [Norme: 150-400]

BIOCHIMIE
Glycémie à jeun: 1.15 g/L [Norme: 0.70-1.10]
Créatinine: 82 μmol/L [Norme: 53-115]
Urée: 5.2 mmol/L [Norme: 2.5-7.5]
Cholestérol total: 2.1 g/L [Norme: < 2.0]
Triglycérides: 1.8 g/L [Norme: < 1.5]`,

    ORDONNANCE: `ORDONNANCE MÉDICALE
---
Document: ${documentTitle}
---
Médicament 1: Amlodipine 5mg
  Posologie: 1 comprimé par jour le matin
  Durée: 3 mois

Médicament 2: Atorvastatine 20mg
  Posologie: 1 comprimé le soir au coucher
  Durée: 3 mois

Médicament 3: Aspirine 75mg
  Posologie: 1 comprimé par jour avec le repas
  Durée: Traitement continu

Renouvellement: Autorisé 1 fois
Recommandations: Régime pauvre en sel et en graisses saturées.
Prochain contrôle dans 3 mois.`,

    SCAN_PERSONNEL: `Document personnel scanné: ${documentTitle}
(Contenu extrait par OCR - vérification recommandée)
Ce document a été uploadé par le patient.`,
  };

  return mockTexts[documentType] || `Document médical: ${documentTitle}\n(Contenu non extractible pour ce type de document)`;
}

// ============================================================
// SERVICE PRINCIPAL
// ============================================================

export interface AIInterpretationResult {
  resume: string;
  sections: Array<{
    titre: string;
    explication: string;
    valeur?: string;
    statut: 'normal' | 'attention' | 'info';
    note?: string;
  }>;
  disclaimer: string;
  processedAt: string;
}

export async function interpretDocument(
  documentType: string,
  documentTitle: string,
  rawText?: string
): Promise<AIInterpretationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Si pas de clé API, retourner une simulation pour le développement
  if (!apiKey) {
    console.warn('[AIService] GEMINI_API_KEY non définie. Utilisation du mode simulation.');
    return simulateMockInterpretation(documentType, documentTitle);
  }

  // 1. Obtenir le texte brut (OCR simulé ou texte fourni)
  const rawContent = rawText || simulateOCR(documentType, documentTitle);

  // 2. Appliquer le PII Stripping
  const sanitizedContent = stripPII(rawContent);

  // 3. Appel Gemini
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: MEDICAL_INTERPRETER_SYSTEM_PROMPT,
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
      generationConfig: {
        temperature: 0.2,  // Bas pour des réponses prévisibles et factuelles
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Voici un document médical de type "${documentType}" intitulé "${documentTitle}". Explique-le en termes simples pour le patient :\n\n${sanitizedContent}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parser le JSON de réponse
    const parsed = JSON.parse(responseText) as AIInterpretationResult;

    // S'assurer que le disclaimer est toujours présent
    if (!parsed.disclaimer) {
      parsed.disclaimer = "Cet aperçu est fourni à titre informatif uniquement. Il ne remplace en aucun cas l'avis d'un professionnel de santé qualifié. Consultez votre médecin pour toute décision médicale.";
    }

    return {
      ...parsed,
      processedAt: new Date().toISOString(),
    };

  } catch (error: unknown) {
    const err = error as Error;
    console.error('[AIService] Erreur Gemini:', err.message);

    // En cas d'erreur API, retourner la simulation
    console.warn('[AIService] Basculement vers le mode simulation.');
    return simulateMockInterpretation(documentType, documentTitle);
  }
}

// ============================================================
// MODE SIMULATION (dev sans clé API / fallback erreur)
// ============================================================

function simulateMockInterpretation(documentType: string, documentTitle: string): AIInterpretationResult {
  if (documentType === 'ORDONNANCE') {
    return {
      resume: `Votre ordonnance "${documentTitle}" contient plusieurs médicaments prescrits par votre médecin pour votre traitement.`,
      sections: [
        {
          titre: "Amlodipine 5mg",
          explication: "C'est un médicament de la famille des inhibiteurs calciques. Il aide à détendre les vaisseaux sanguins pour faciliter la circulation du sang.",
          valeur: "1 comprimé/jour le matin",
          statut: 'info',
          note: "À prendre régulièrement, même si vous vous sentez bien."
        },
        {
          titre: "Atorvastatine 20mg",
          explication: "Ce médicament appartient à la famille des statines. Il agit sur le foie pour aider à réguler le taux de graisses dans le sang.",
          valeur: "1 comprimé le soir",
          statut: 'info',
          note: "Il est généralement pris le soir car le foie produit plus de cholestérol la nuit."
        },
        {
          titre: "Aspirine 75mg",
          explication: "À faible dose, l'aspirine est utilisée pour fluidifier légèrement le sang et protéger le coeur et les vaisseaux.",
          valeur: "1 comprimé/jour avec le repas",
          statut: 'info',
          note: "À prendre avec un repas pour protéger l'estomac."
        }
      ],
      disclaimer: "Cet aperçu est fourni à titre informatif uniquement. Il ne remplace en aucun cas l'avis d'un professionnel de santé qualifié. Ne modifiez jamais votre traitement sans consulter votre médecin.",
      processedAt: new Date().toISOString(),
    };
  }

  // Par défaut : résultat d'examen
  return {
    resume: `Votre document "${documentTitle}" est un résultat d'analyses biologiques. Voici ce que ces examens mesurent en termes simples.`,
    sections: [
      {
        titre: "Hémoglobine",
        explication: "L'hémoglobine est la protéine contenue dans les globules rouges qui transporte l'oxygène dans tout votre corps.",
        valeur: "11.8 g/dL (Norme : 13.0-17.5)",
        statut: 'attention',
        note: "Cette valeur est légèrement en dessous de la norme. Votre médecin est le mieux placé pour évaluer ce résultat."
      },
      {
        titre: "Glycémie à jeun",
        explication: "La glycémie mesure le taux de sucre (glucose) dans votre sang lorsque vous êtes à jeun.",
        valeur: "1.15 g/L (Norme : 0.70-1.10)",
        statut: 'attention',
        note: "Cette valeur est légèrement au-dessus de la norme. Votre médecin analysera si un suivi est nécessaire."
      },
      {
        titre: "Cholestérol total",
        explication: "Le cholestérol est une graisse naturellement présente dans le sang. Un taux élevé peut, sur la durée, affecter les vaisseaux sanguins.",
        valeur: "2.1 g/L (Norme : < 2.0)",
        statut: 'attention',
        note: "Légèrement au-dessus de la limite. Votre médecin vous conseillera sur les mesures à adopter."
      },
      {
        titre: "Globules blancs (leucocytes)",
        explication: "Les globules blancs sont les cellules qui défendent votre corps contre les infections et les maladies.",
        valeur: "8.5 × 10³/μL (Norme : 4.0-10.0)",
        statut: 'normal',
      },
      {
        titre: "Plaquettes",
        explication: "Les plaquettes sont de petites cellules qui aident le sang à coaguler lorsque vous vous blessez.",
        valeur: "230 × 10³/μL (Norme : 150-400)",
        statut: 'normal',
      }
    ],
    disclaimer: "Cet aperçu est fourni à titre informatif uniquement. Il ne remplace en aucun cas l'avis d'un professionnel de santé qualifié. Consultez votre médecin pour l'interprétation clinique complète de vos résultats.",
    processedAt: new Date().toISOString(),
  };
}
