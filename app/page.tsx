"use client";

import { FormEvent, useMemo, useState } from "react";

type Step = {
  key: keyof DiagnosisAnswers;
  label: string;
  prompt: string;
  placeholder: string;
};

type DiagnosisAnswers = {
  businessName: string;
  whatItReallySells: string;
  solvedProblem: string;
  whyChooseIt: string;
  idealCustomer: string;
  desiredPerception: string;
  undesiredLook: string;
  brandAsPerson: string;
  admiredBrands: string;
  desiredVisualStyle: string;
  colorPreferences: string;
  projectMainGoal: string;
  currentNeed: string;
  currentMaterials: string;
  additionalNotes: string;
};

type DiagnosisResult = {
  brandPersonality: string;
  positioning: string;
  toneOfVoice: string;
  visualDirection: string;
  suggestedPalette: string[];
  designRecommendations: string[];
  improvementOpportunities: string[];
  internalBriefForWebLynMX: string;
};

const steps: Step[] = [
  {
    key: "businessName",
    label: "Nombre del negocio",
    prompt: "¿Cómo se llama el negocio?",
    placeholder: "Ej. Casa Nativa, Studio Alva, Clínica Aura...",
  },
  {
    key: "whatItReallySells",
    label: "Qué vende realmente",
    prompt: "Más allá del producto, ¿qué vende realmente?",
    placeholder: "Ej. Confianza, estatus, calma, rapidez, una transformación...",
  },
  {
    key: "solvedProblem",
    label: "Problema que resuelve",
    prompt: "¿Qué problema importante resuelve para sus clientes?",
    placeholder: "Describe el dolor, fricción o deseo que atiende la marca.",
  },
  {
    key: "whyChooseIt",
    label: "Por qué deberían elegirlo",
    prompt: "¿Por qué deberían elegir esta marca y no otra?",
    placeholder: "Diferenciadores, forma de trabajar, promesa, experiencia.",
  },
  {
    key: "idealCustomer",
    label: "Cliente ideal",
    prompt: "¿Quién es el cliente ideal?",
    placeholder: "Perfil, aspiraciones, miedos, contexto y poder de decisión.",
  },
  {
    key: "desiredPerception",
    label: "Cómo quiere ser percibido",
    prompt: "¿Cómo quiere que la marca sea percibida?",
    placeholder: "Ej. Premium, cercana, experta, rebelde, minimalista, humana.",
  },
  {
    key: "undesiredLook",
    label: "Cómo NO quiere verse",
    prompt: "¿Cómo NO quiere verse ni sentirse la marca?",
    placeholder: "Ej. Genérica, barata, fría, infantil, saturada, corporativa.",
  },
  {
    key: "brandAsPerson",
    label: "Marca como persona",
    prompt: "Si la marca fuera una persona, ¿cómo sería?",
    placeholder: "Personalidad, actitud, forma de hablar, presencia.",
  },
  {
    key: "admiredBrands",
    label: "Marcas que admira",
    prompt: "¿Qué marcas admira y por qué?",
    placeholder: "Pueden ser de cualquier industria. Explica qué te atrae.",
  },
  {
    key: "desiredVisualStyle",
    label: "Estilo visual deseado",
    prompt: "¿Qué estilo visual imagina para la marca?",
    placeholder: "Dirección estética, referencias, mood, texturas, fotografía.",
  },
  {
    key: "colorPreferences",
    label: "Colores deseados/prohibidos",
    prompt: "¿Qué colores desea usar o evitar?",
    placeholder: "Colores deseados, prohibidos y cualquier asociación relevante.",
  },
  {
    key: "projectMainGoal",
    label: "Objetivo principal",
    prompt: "¿Cuál es el objetivo principal del proyecto?",
    placeholder: "Ej. Reposicionar, vender más, lanzar, verse premium, ordenar marca.",
  },
  {
    key: "currentNeed",
    label: "Qué necesita actualmente",
    prompt: "¿Qué necesita actualmente la marca?",
    placeholder: "Logo, identidad, web, estrategia, redes, empaque, campaña...",
  },
  {
    key: "currentMaterials",
    label: "Materiales actuales",
    prompt: "¿Qué materiales de marca existen hoy?",
    placeholder: "Logo, manual, web, Instagram, fotos, presentaciones, nada aún.",
  },
  {
    key: "additionalNotes",
    label: "Algo importante adicional",
    prompt: "¿Hay algo importante que WebLynMX deba saber?",
    placeholder: "Contexto, restricciones, historia, metas, dudas o sensibilidad del sector.",
  },
];

const initialAnswers: DiagnosisAnswers = steps.reduce(
  (answers, step) => ({ ...answers, [step.key]: "" }),
  {} as DiagnosisAnswers,
);

export default function Home() {
  const [screen, setScreen] = useState<"landing" | "form" | "loading" | "result">("landing");
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<DiagnosisAnswers>(initialAnswers);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState("");

  const step = steps[currentStep];
  const progress = useMemo(() => ((currentStep + 1) / steps.length) * 100, [currentStep]);
  const canContinue = answers[step.key].trim().length > 1;

  function updateAnswer(value: string) {
    setAnswers((current) => ({ ...current, [step.key]: value }));
  }

  function goNext() {
    if (!canContinue) return;
    setCurrentStep((index) => Math.min(index + 1, steps.length - 1));
  }

  function goBack() {
    setCurrentStep((index) => Math.max(index - 1, 0));
  }

  async function submitDiagnosis(event: FormEvent) {
    event.preventDefault();
    if (!canContinue) return;

    setScreen("loading");
    setError("");

    try {
      const response = await fetch("/api/brand-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo generar el diagnóstico.");
      }

      setResult(payload.diagnosis);
      setScreen("result");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Ocurrió un error inesperado al analizar la marca.",
      );
      setScreen("form");
    }
  }

  return (
    <main className="shell">
      <div className="grain" />
      <Header onStart={() => setScreen("form")} />

      {screen === "landing" && (
        <section className="landing panel-bleed">
          <div className="landing-copy">
            <p className="microline">Diagnóstico estratégico de marca</p>
            <h1>
              No diseñamos logos.
              <span> Diseñamos percepción.</span>
            </h1>
            <button className="primary-button" type="button" onClick={() => setScreen("form")}>
              Iniciar diagnóstico
              <ArrowIcon />
            </button>
          </div>
          <div className="signal-card" aria-hidden="true">
            <div className="portrait" />
            <div className="wireframe one" />
            <div className="wireframe two" />
            <span className="brand-mark">W</span>
          </div>
        </section>
      )}

      {screen === "form" && (
        <form className="diagnosis-grid" onSubmit={submitDiagnosis}>
          <section className="question-card">
            <div className="step-meta">
              <span>{String(currentStep + 1).padStart(2, "0")}</span>
              <span>/ {String(steps.length).padStart(2, "0")}</span>
            </div>
            <h2>{step.prompt}</h2>
            <label htmlFor={step.key}>{step.label}</label>
            <textarea
              id={step.key}
              value={answers[step.key]}
              onChange={(event) => updateAnswer(event.target.value)}
              placeholder={step.placeholder}
              autoFocus
            />
            {error && <p className="form-error">{error}</p>}
            <div className="actions">
              <button className="ghost-button" type="button" onClick={goBack} disabled={currentStep === 0}>
                <ArrowIcon direction="left" />
              </button>
              {currentStep === steps.length - 1 ? (
                <button className="primary-button" type="submit" disabled={!canContinue}>
                  Finalizar diagnóstico
                  <CheckIcon />
                </button>
              ) : (
                <button className="primary-button" type="button" onClick={goNext} disabled={!canContinue}>
                  Siguiente
                  <ArrowIcon />
                </button>
              )}
            </div>
          </section>

          <aside className="progress-card">
            <div className="progress-track">
              <span style={{ height: `${progress}%` }} />
            </div>
            <ol>
              {steps.map((item, index) => (
                <li
                  className={index === currentStep ? "active" : index < currentStep ? "done" : ""}
                  key={item.key}
                >
                  <button type="button" onClick={() => setCurrentStep(index)}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item.label}
                  </button>
                </li>
              ))}
            </ol>
          </aside>
        </form>
      )}

      {screen === "loading" && (
        <section className="loading-state panel-bleed" aria-live="polite">
          <div className="scanner" />
          <h2>Analizando tu marca...</h2>
          <p>Estamos convirtiendo tus respuestas en dirección estratégica, visual y verbal.</p>
        </section>
      )}

      {screen === "result" && result && (
        <section className="result-view">
          <div className="result-hero">
            <p className="microline">Diagnóstico generado</p>
            <h2>{answers.businessName || "Marca diagnosticada"}</h2>
            <button
              className="ghost-link"
              type="button"
              onClick={() => {
                setCurrentStep(0);
                setScreen("form");
              }}
            >
              Editar respuestas
            </button>
          </div>

          <ResultBlock title="Personalidad de marca" content={result.brandPersonality} />
          <ResultBlock title="Posicionamiento" content={result.positioning} />
          <ResultBlock title="Tono de voz" content={result.toneOfVoice} />
          <ResultBlock title="Dirección visual" content={result.visualDirection} />
          <ListBlock title="Paleta sugerida" items={result.suggestedPalette} palette />
          <ListBlock title="Recomendaciones de diseño" items={result.designRecommendations} />
          <ListBlock title="Oportunidades de mejora" items={result.improvementOpportunities} />
          <ResultBlock title="Brief interno para WebLynMX" content={result.internalBriefForWebLynMX} wide />
        </section>
      )}
    </main>
  );
}

function Header({ onStart }: { onStart: () => void }) {
  return (
    <header className="site-header">
      <a className="logo" href="#" aria-label="WebLynMX">
        WEBLYN<span>MX</span>
      </a>
      <nav aria-label="Secciones">
        <a href="#diagnostico">Diagnóstico</a>
        <a href="#metodo">Método</a>
        <a href="#brief">Brief</a>
      </nav>
      <button type="button" onClick={onStart}>
        Iniciar diagnóstico
        <ArrowIcon />
      </button>
    </header>
  );
}

function ResultBlock({ title, content, wide = false }: { title: string; content: string; wide?: boolean }) {
  return (
    <article className={wide ? "result-card wide" : "result-card"}>
      <span>{title}</span>
      <p>{content}</p>
    </article>
  );
}

function ListBlock({ title, items, palette = false }: { title: string; items: string[]; palette?: boolean }) {
  return (
    <article className="result-card">
      <span>{title}</span>
      <ul className={palette ? "palette-list" : ""}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </article>
  );
}

function ArrowIcon({ direction = "right" }: { direction?: "left" | "right" }) {
  return (
    <svg className={direction === "left" ? "icon left" : "icon"} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}
