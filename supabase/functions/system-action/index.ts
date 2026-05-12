import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { action } = await req.json();

    if (action !== "reboot" && action !== "shutdown") {
      return new Response(
        JSON.stringify({ error: "Invalid action. Use 'reboot' or 'shutdown'." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // This edge function acts as a signal relay.
    // The actual reboot/shutdown must be handled by a local agent on the device
    // that polls this endpoint or listens for webhooks.
    // For now, we acknowledge the command.
    return new Response(
      JSON.stringify({
        success: true,
        action,
        message: `System ${action} command acknowledged.`,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
