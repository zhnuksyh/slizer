import type { Slide } from '../types';

export const generateSlidesFromAI = async (inputText: string): Promise<Slide[]> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `
    You are an expert presentation designer. Convert the user's raw text into a structured presentation.
    You MUST output valid JSON matching this schema. 
    Choose the best slide template for each piece of content.
    Available slide types: "main", "toc", "main_point", "secondary_point", "table", "image", "end".
    
    CRITICAL INSTRUCTION FOR "image" SLIDES:
    If you use the "image" slide type, you MUST provide an 'imageUrl' property. Construct the URL dynamically using this exact format:
    https://image.pollinations.ai/prompt/{detailed-visual-description}?width=1920&height=1080&nologo=true
    Replace {detailed-visual-description} with a highly descriptive, hyphenated search term (e.g., futuristic-corporate-office-with-blue-lighting).
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

    let retries = 5;
    let delay = 1000;

    while (retries > 0) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) throw new Error("Empty response from AI");

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
        } catch (error) {
            retries--;
            if (retries === 0) throw error;
            await new Promise((res) => setTimeout(res, delay));
            delay *= 2;
        }
    }

    return [];
};
