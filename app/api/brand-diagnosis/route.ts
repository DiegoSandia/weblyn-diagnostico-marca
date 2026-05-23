import { NextRequest, NextResponse } from "next/server";

type DiagnosisAnswers = Record<string, string>;

const answerLabels: Record<string, string> = {
  businessName: "Nombre del negocio",
  whatItReallySells: "Qué vende realmente",
  solvedProblem: "Problema que resuelve",
  whyChooseIt: "Por qué deberían elegirlo",
  idealCustomer: "Cliente ideal",
  desiredPerception: "Cómo quiere ser percibido",
  undesiredLook: "Cómo NO quiere verse",
  brandAsPerson: "Si la marca fuera persona, cómo sería",
  admiredBrands: "Marcas que admira",
  desiredVisualStyle: "Estilo visual deseado",
  colorPreferences: "Colores deseados/prohibidos",
  projectMainGoal: "Objetivo principal del proyecto",
  currentNeed: "Qué necesita actualmente",
  currentMaterials: "Materiales actuales",
  additionalNotes: "Algo importante adicional",
};

const diagnosisSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "brandPersonality",
    "positioning",
    "toneOfVoice",
    "visualDirection",
    "suggestedPalette",
    "designRecommendations",
    "improvementOpportunities",
    "internalBriefForWebLynMX",
  ],
  properties: {
    brandPersonality: {
      type: "string",
      description: "Personalidad estratégica de la marca en español.",
    },
    positioning: {
      type: "string",
      description: "Posicionamiento recomendado con enfoque comercial.",
    },
    toneOfVoice: {
      type: "string",
      description: "Tono verbal recomendado para comunicación de marca.",
    },
    visualDirection: {
      type: "string",
      description: "Dirección visual recomendada para identidad, web y piezas.",
    },
    suggestedPalette: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: { type: "string" },
    },
    designRecommendations: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: { type: "string" },
    },
    improvementOpportunities: {
      type: "array",
      minItems: 4,
      maxItems: 7,
      items: { type: "string" },
    },
    internalBriefForWebLynMX: {
      type: "string",
      description: "Brief interno accionable para el equipo WebLynMX.",
    },
  },
} as const;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar OPENAI_API_KEY en .env.local." },
      { status: 500 },
    );
  }

  let answers: DiagnosisAnswers;

  try {
    const body = await request.json();
    answers = body.answers;
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }

  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "Faltan respuestas para generar el diagnóstico." }, { status: 400 });
  }

  const missingRequiredAnswer = Object.keys(answerLabels).find((key) => {
    const value = answers[key];
    return typeof value !== "string" || value.trim().length < 2;
  });

  if (missingRequiredAnswer) {
    return NextResponse.json(
      { error: `Falta responder: ${answerLabels[missingRequiredAnswer]}.` },
      { status: 400 },
    );
  }

  const formattedAnswers = Object.entries(answerLabels)
    .map(([key, label]) => `${label}: ${answers[key].trim()}`)
    .join("\n");

  try {
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5.1",
        instructions:
          "Eres estratega senior de branding en WebLynMX. Analiza respuestas de clientes y entrega un diagnóstico claro, premium, accionable y comercial. Escribe en español mexicano profesional, con criterio estratégico y sin relleno.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Genera un Diagnóstico de Marca para WebLynMX con estas respuestas:\n\n${formattedAnswers}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "brand_diagnosis",
            strict: true,
            schema: diagnosisSchema,
          },
        },
        reasoning: { effort: "low" },
        max_output_tokens: 2500,
      }),
    });

    const payload = await openAIResponse.json();

    if (!openAIResponse.ok) {
      return NextResponse.json(
        { error: payload.error?.message ?? "OpenAI no pudo generar el diagnóstico." },
        { status: openAIResponse.status },
      );
    }

    const outputText = payload.output_text;
    const diagnosis = typeof outputText === "string" ? JSON.parse(outputText) : null;

    if (!diagnosis) {
      return NextResponse.json({ error: "La respuesta de OpenAI llegó vacía." }, { status: 502 });
    }

    return NextResponse.json({ diagnosis });
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "OpenAI respondió con un formato inesperado."
        : "No se pudo conectar con OpenAI en este momento.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
