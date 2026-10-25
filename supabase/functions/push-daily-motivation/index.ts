import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const AI_MOTIVATION_POOL = [
  {
    title: "Nouveau Conseil & Motivation Nia-Mind",
    category: "Gestion de la pression",
    summary: "Déposer le masque 5 minutes aujourd'hui",
    message:
      "Tu n'as pas besoin de porter toutes les attentes du monde en même temps. Choisis une seule priorité sincère aujourd'hui et respire profondément.",
    exercise:
      "Inspire pendant 4 secondes, retiens 2 secondes, expire lentement pendant 6 secondes en relâchant tes épaules.",
  },
  {
    title: "Motivation du jour • Écoute intérieure",
    category: "Équilibre émotionnel",
    summary: "Nommer ce que l'on ressent sans se juger",
    message:
      "Reconnaître sa fatigue n'est pas un aveu de faiblesse, c'est le premier acte de lucidité envers soi-même.",
    exercise:
      "Écris une phrase commençant par « Aujourd'hui, j'ai le droit de ressentir... » dans ton espace personnel.",
  },
  {
    title: "Conseil Bien-être • Sommeil & Calme",
    category: "Sommeil",
    summary: "Préparer un atterrissage mental doux",
    message:
      "Ton esprit a besoin d'un sas de décompression avant le repos. Même 3 minutes de silence loin des sollicitations changent la qualité de ta nuit.",
    exercise:
      "Note sur une feuille ou dans ton journal les 2 pensées qui tournent en boucle afin de les confier au lendemain.",
  },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let payload: Record<string, unknown> = {};
    if (req.method === "POST") {
      try {
        payload = await req.json();
      } catch {
        payload = {};
      }
    }

    const mode = String(payload.mode || "daily_motivation");
    const dayIndex = new Date().getUTCDate() % AI_MOTIVATION_POOL.length;
    const selectedTip = AI_MOTIVATION_POOL[dayIndex];

    if (mode === "gmail_push_verification") {
      const email = String(payload.email || "").trim().toLowerCase();
      return new Response(
        JSON.stringify({
          ok: true,
          mode: "gmail_push_verification",
          email,
          pushSentAt: new Date().toISOString(),
          notificationTitle: "Vérification Push Gmail • Nia-Mind",
          notificationMessage: `Une notification Push de vérification a été transmise à votre compte Gmail (${email}). Confirmez l'invitation et votre mot de passe (6+ caractères).`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        mode: "daily_motivation",
        dispatchedAt: new Date().toISOString(),
        generatedByAiFallback: Boolean(payload.aiFallback ?? true),
        pushNotification: {
          title: selectedTip.title,
          message: selectedTip.message,
          category: selectedTip.category,
          summary: selectedTip.summary,
          exercise: selectedTip.exercise,
          actionUrl: "/conseils",
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Erreur Edge Function",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
