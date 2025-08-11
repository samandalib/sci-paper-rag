export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Parse body
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body", details: e.message, raw: req.body });
      }
    }
    if (!body || !body.query) {
      return res.status(400).json({ error: "Missing query in body", body });
    }

    // OpenAI Embedding
    let embedding;
    try {
      const openaiRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: body.query,
          model: 'text-embedding-ada-002',
        }),
      });
      const openaiData = await openaiRes.json();
      if (!openaiRes.ok) throw new Error(openaiData.error?.message || 'OpenAI embedding error');
      embedding = openaiData.data[0].embedding;
    } catch (err) {
      console.error("OpenAI Embedding error:", err);
      return res.status(500).json({ error: "OpenAI Embedding error", details: err.message });
    }

    // Supabase vector search
    let chunks;
    try {
      const supabaseRes = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/match_pdf_chunks`, {
        method: 'POST',
        headers: {
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query_embedding: embedding,
          match_count: 5,
        }),
      });
      const supabaseData = await supabaseRes.json();
      if (!supabaseRes.ok) throw new Error(supabaseData.error?.message || 'Supabase match error');
      chunks = supabaseData;
    } catch (err) {
      console.error("Supabase vector search error:", err);
      return res.status(500).json({ error: "Supabase vector search error", details: err.message });
    }

    return res.status(200).json({ chunks });
  } catch (err) {
    console.error("UNEXPECTED ERROR:", err);
    return res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
} 