import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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

    await sendDiagnosisEmail(answers, diagnosis);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof SyntaxError
        ? "OpenAI respondió con un formato inesperado."
        : "No se pudo conectar con OpenAI en este momento.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function sendDiagnosisEmail(answers: DiagnosisAnswers, diagnosis: Record<string, unknown>) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const resend = new Resend(apiKey);

  const diag = diagnosis as {
    brandPersonality: string;
    positioning: string;
    toneOfVoice: string;
    visualDirection: string;
    suggestedPalette: string[];
    designRecommendations: string[];
    improvementOpportunities: string[];
    internalBriefForWebLynMX: string;
  };

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #0a0a0a; color: #e0e0e0; margin: 0; padding: 24px; }
  .wrap { max-width: 640px; margin: 0 auto; }
  h1 { color: #ffffff; font-size: 22px; border-bottom: 1px solid #333; padding-bottom: 12px; }
  h2 { color: #a0a0a0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; margin: 28px 0 6px; }
  p, li { color: #d0d0d0; font-size: 14px; line-height: 1.6; margin: 0 0 4px; }
  ul { padding-left: 18px; margin: 0; }
  .section { background: #141414; border: 1px solid #222; border-radius: 8px; padding: 16px 20px; margin-bottom: 12px; }
  .brief { background: #1a1208; border-color: #3d2e00; }
  .answers { background: #0d1117; border-color: #1e2a3a; }
  .tag { display: inline-block; background: #222; color: #888; font-size: 11px; padding: 2px 8px; border-radius: 20px; margin: 2px; }
</style></head>
<body>
<div class="wrap">
  <h1>🎯 Diagnóstico de Marca — ${answers.businessName}</h1>

  <div class="section">
    <h2>Personalidad de marca</h2>
    <p>${diag.brandPersonality}</p>
  </div>

  <div class="section">
    <h2>Posicionamiento</h2>
    <p>${diag.positioning}</p>
  </div>

  <div class="section">
    <h2>Tono de voz</h2>
    <p>${diag.toneOfVoice}</p>
  </div>

  <div class="section">
    <h2>Dirección visual</h2>
    <p>${diag.visualDirection}</p>
  </div>

  <div class="section">
    <h2>Paleta sugerida</h2>
    ${diag.suggestedPalette.map((c) => `<span class="tag">${c}</span>`).join("")}
  </div>

  <div class="section">
    <h2>Recomendaciones de diseño</h2>
    <ul>${diag.designRecommendations.map((r) => `<li>${r}</li>`).join("")}</ul>
  </div>

  <div class="section">
    <h2>Oportunidades de mejora</h2>
    <ul>${diag.improvementOpportunities.map((o) => `<li>${o}</li>`).join("")}</ul>
  </div>

  <div class="section brief">
    <h2>Brief interno WebLynMX</h2>
    <p>${diag.internalBriefForWebLynMX}</p>
  </div>

  <div class="section answers">
    <h2>Respuestas del cliente</h2>
    ${Object.entries(answerLabels).map(([key, label]) => `<p><strong>${label}:</strong> ${answers[key as keyof DiagnosisAnswers]}</p>`).join("")}
  </div>
</div>
</body>
</html>`;

  await resend.emails.send({
    from: "WebLynMX Diagnóstico <onboarding@resend.dev>",
    to: ["weblynmx@gmail.com", "diegoneitor99@gmail.com"],
    subject: `🎯 Nuevo diagnóstico: ${answers.businessName}`,
    html,
  });
}
