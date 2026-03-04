# Slydex - AI Presentation Generator

Slydex is a modern, responsive web application that leverages the Gemini API to instantly generate structured, multi-slide presentations from raw text or uploaded documents. It features a rich suite of templates, dynamic image generation, speaker notes, and an interactive left sidebar for managing your slide deck.

## 🚀 Features

- **Instant AI Slides** — Convert your thoughts, meeting notes, or raw data into a fully structured presentation in seconds.
- **File Ingestion** — Drag-and-drop, paste, or upload `.txt`, `.md`, `.json`, `.csv`, `.log`, and `.html` files directly into the context window.
- **Dynamic Slide Templates** — The AI intelligently selects the best layout for your content:
  - Main Title
  - Table of Contents
  - Major Point
  - Secondary Point (with numbered items)
  - Data Table
  - Image Slide (Powered by Pollinations.ai)
  - End/Conclusion Slide
- **Actionable Speaker Notes** — The AI automatically generates talking points for every single slide, cleanly displayed in the bottom notes panel.
- **Smart Rate Limiting** — An integrated API usage tracker visually monitors your Gemini requests (RPM and Daily limits) right in the sidebar to prevent quota exhaustion.
- **Export to PDF** — Render your finished presentation into a clean, paginated PDF deck with one click (via `html2canvas` + `jsPDF`).

## 🛠️ Tech Stack

- **Framework**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **AI Engine**: [Google Gemini 2.5 Flash API](https://aistudio.google.com/)
- **Image Generation**: [Pollinations.ai](https://pollinations.ai/)

## ⚙️ Local Setup

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/zhnuksyh/slydex.git
   cd slydex
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment Variables**
   Create a \`.env\` file in the root directory and add your Google Gemini API key:
   \`\`\`env
   VITE_GEMINI_API_KEY="your_api_key_here"
   \`\`\`

4. **Run the Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   Navigate to \`http://localhost:5173\` in your browser to start generating slides.

---

## 📜 Recent Updates
<!-- CHANGELOG START -->
- **2026-03-05** (7cb93d1): fix: update pollinations API host from image.pollinations.ai to pollinations.ai/p
- **2026-03-05** (6c2bdde): fix: add image slide to few-shot example in aiService prompt
- **2026-03-05** (24d52d2): fix: resolve infinite render loop in ApiUsageMonitor
- **2026-03-05** (3579d24): ci: add github action to auto-update readme changelog
- **2026-03-05** (d25dd4e): docs: create comprehensive README.md
- Initial Setup
<!-- CHANGELOG END -->
