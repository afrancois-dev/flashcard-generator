# Anki Flashcard Generator — Project Scope & Architecture Blueprint

## 1. Executive Summary
An interactive, web-based tool designed to transform various input formats (raw text, files, URLs, or open prompts) into structured Anki flashcards. Built with a client-first approach, it allows users to generate, review, inline-edit, and refine cards using AI before exporting directly to `.apkg` or text format.

---

## 2. Core Feature Matrix

### Input Processing
* **Raw Text:** Direct paste box for articles, notes, or raw excerpts.
* **File Uploads:** Support for text-based documents (`.pdf`, `.txt`, `.md`, `.docx`).
* **URL Extraction:** Input web page URLs to scrape and process article text.
* **Prompt-Only Mode:** Conversational/prompt-based card generation from scratch.

### Generation Engine (MVP Phase)
* **Basic Cards:** Standard Front / Back format.
* **Cloze Deletion Cards:** Contextual sentences utilizing standard Anki format (e.g., `{{c1::answer}}`).
* **AI Orchestration:** Structured JSON output via AI models.

### Interactive Review Workspace (Hybrid Editor)
* **Direct Inline Editing:** 
  * Edit Front and Back fields directly within a table/grid view.
  * Tag management (add/remove tags per card).
  * Card deletion and manual card creation.
* **AI Refinement Actions:** 
  * Global/Bulk prompts (e.g., *"Make answers more concise"*, *"Simplify vocabulary"*).
  * Targeted refinements per card.

### Export Engine
* Client-side `.apkg` generation (utilizing libraries such as `genanki-js` or `sql.js`).
* Fallback `.csv` / `.txt` export for quick importing.

---

## 3. Technology Stack

* **Framework:** React with TanStack ecosystem (e.g., TanStack Start / React Router).
* **Data Fetching & State Management:** TanStack Query & TanStack Table.
* **Styling:** Tailwind CSS.
* **AI Layer:** Direct API calls (OpenAI / Gemini API or Vercel AI SDK).
* **Anki Package Generation:** Client-side binary builder (`genanki-js`).

---

## 4. Phase 1 (MVP) vs. Future Roadmap

| Feature | Phase 1 (MVP) | Phase 2 (Future) |
| :--- | :---: | :---: |
| **Basic & Cloze Cards** | ✅ | ✅ |
| **Inline & AI Refinement Workspace** | ✅ | ✅ |
| **Client-side `.apkg` Export** | ✅ | ✅ |
| **Text, File, URL, & Prompt Inputs** | ✅ | ✅ |
| **Text-to-Speech (Audio Cards)** | ❌ | ✅ |
| **Image & Diagram Attachments** | ❌ | ✅ |
| **Custom Anki Styling Templates** | ❌ | ✅ |

---

## 5. Next Steps
1. Define the JSON schema for AI card generation outputs.
2. Set up the TanStack Table state layout for the hybrid review workspace.
3. Configure the client-side `.apkg` builder pipeline.