import type { Slide } from '../types';

export const generateSlidesFromAI = async (inputText: string): Promise<Slide[]> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key is missing. Add VITE_GEMINI_API_KEY to your .env file.');
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `
    You are an expert presentation designer. Convert the user's raw text into a structured presentation.
    You MUST output valid JSON matching this schema. 
    Choose the best slide template for each piece of content.
    Available slide types: "main", "toc", "main_point", "secondary_point", "table", "image", "end".

    REQUIRED FIELDS PER SLIDE TYPE (you MUST populate these — never leave them empty):
    - "main": title + subtitle (subtitle = a tagline, theme, or contextual phrase)
    - "toc": title + items (an array of 4-8 agenda topics or section names)
    - "main_point": title + subtitle (title = the bold claim; subtitle = a full sentence of supporting detail)
    - "secondary_point": title + items (an array of 3-6 descriptive bullet points, each 8+ words)
    - "table": title + headers (array of column names) + rows (array of arrays, at least 2 data rows with real values)
    - "image": title + imageUrl (constructed using the Pollinations format below)
    - "end": title + subtitle (subtitle = a call-to-action, contact info, or closing remark)

    CRITICAL INSTRUCTION FOR "image" SLIDES:
    If you use the "image" slide type, you MUST provide an 'imageUrl' property. Construct the URL dynamically using this exact format:
    https://image.pollinations.ai/prompt/{detailed-visual-description}?width=1920&height=1080&nologo=true
    Replace {detailed-visual-description} with a highly descriptive, hyphenated search term (e.g., futuristic-corporate-office-with-blue-lighting).

    EXAMPLE — Given this user input:
    "Our Q3 results: revenue up 30%, churn down to 2%, 500 new enterprise customers. Key wins: launched mobile app, expanded to APAC, hired 50 engineers."

    You should produce slides like:
    [
      {"type":"main","title":"Q3 Performance Review","subtitle":"Record-breaking growth across all key metrics"},
      {"type":"secondary_point","title":"Key Achievements","items":["Revenue grew 30% quarter-over-quarter, exceeding all forecasts","Customer churn dropped to a historic low of just 2%","Onboarded 500 new enterprise customers in a single quarter","Successfully launched the mobile application to general availability","Expanded operations into the Asia-Pacific market","Engineering team scaled up with 50 new hires"]},
      {"type":"table","title":"Q3 Metrics at a Glance","headers":["Metric","Q2 Baseline","Q3 Result","Change"],"rows":[["Revenue Growth","Baseline","30% increase","+30%"],["Churn Rate","4.5%","2.0%","-2.5pp"],["New Customers","310","500","+61%"]]},
      {"type":"end","title":"Looking Ahead to Q4","subtitle":"Building on momentum — targeting 40% revenue growth and EMEA expansion"}
    ]

    SPEAKER NOTES:
    For EVERY slide, include a "notes" field with 1-2 sentences of speaker talking points. These should help the presenter know what to say, not just repeat the slide content.

    CONTENT QUALITY RULES:
    - Generate at least 5 slides, even for short inputs. Expand on the topic if needed.
    - Subtitles must be full, descriptive sentences — never just one or two words.
    - Bullet point items must be descriptive phrases of at least 8 words, not single words or short fragments.
    - Table cells should contain real, specific data — never use placeholders like "TBD" or "N/A".
    - Every slide must look complete and professional — no empty or nearly empty slides.
    - Write in a clear, confident, professional tone suitable for business presentations.
  `;

    const schema = {
        type: "OBJECT",
        properties: {
            slides: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        type: {
                            type: "STRING",
                            enum: ["main", "toc", "main_point", "secondary_point", "table", "image", "end"],
                        },
                        title: { type: "STRING" },
                        subtitle: { type: "STRING" },
                        items: { type: "ARRAY", items: { type: "STRING" } },
                        headers: { type: "ARRAY", items: { type: "STRING" } },
                        rows: { type: "ARRAY", items: { type: "ARRAY", items: { type: "STRING" } } },
                        imageUrl: { type: "STRING" },
                        notes: { type: "STRING" },
                    },
                    required: ["type", "title"],
                },
            },
        },
    };

    const payload = {
        contents: [{ parts: [{ text: inputText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: schema,
        },
    };

    const MAX_RETRIES = 3;
    let delay = 2000;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        // Handle non-OK responses with specific error messages
        if (!response.ok) {
            const status = response.status;

            // Non-retryable client errors — fail immediately
            if (status === 400) throw new Error('Bad request. The input may be malformed.');
            if (status === 401 || status === 403) throw new Error('Invalid or unauthorized API key. Check your VITE_GEMINI_API_KEY in .env.');
            if (status === 404) throw new Error('Model not found. The API endpoint may have changed.');

            // Retryable errors — 429 (rate limit) and 5xx (server errors)
            if (status === 429 || status >= 500) {
                if (attempt === MAX_RETRIES) {
                    throw new Error(
                        status === 429
                            ? 'Rate limited by Gemini API. Please wait 30-60 seconds and try again.'
                            : `Server error (${status}). Please try again.`
                    );
                }
                console.warn(`Attempt ${attempt}/${MAX_RETRIES} failed with ${status}. Retrying in ${delay / 1000}s...`);
                await new Promise((res) => setTimeout(res, delay));
                delay *= 2;
                continue;
            }

            // Any other unexpected status
            throw new Error(`Unexpected API error (HTTP ${status}).`);
        }

        // Success path
        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) throw new Error('Empty response from AI. Try rephrasing your input.');

        const parsed = JSON.parse(textResponse);

        return parsed.slides.map((s: Record<string, unknown>) => ({
            id: Math.random().toString(36).substring(7),
            type: (s.type as string) || 'main',
            data: {
                title: s.title ? String(s.title) : undefined,
                subtitle: s.subtitle ? String(s.subtitle) : undefined,
                imageUrl: s.imageUrl ? String(s.imageUrl) : undefined,
                items: Array.isArray(s.items) ? s.items.map(String) : undefined,
                headers: Array.isArray(s.headers) ? s.headers.map(String) : undefined,
                rows: Array.isArray(s.rows)
                    ? s.rows.map((row: unknown) =>
                        Array.isArray(row) ? row.map(String) : []
                    )
                    : undefined,
            },
        }));
    }

    return [];
};
