## 1. Bootstrap an empty TanStack Start project with a passing test
Goal: Create the minimal runnable project foundation.
Description: Set up an empty TanStack Start application using React, TypeScript, and the repository’s chosen package tooling. Add one automated test that verifies the project boots or renders a minimal health-check component, and configure the test command so it passes in a clean checkout.

## 2. Add the shared flashcard domain model and validation
Goal: Define one validated representation for generated and edited cards.
Description: Create shared TypeScript types and runtime validation for basic cards, cloze cards, tags, and card collections. The model must distinguish required fields, preserve cloze syntax, and return explicit validation errors for malformed data.

## 3. Add the application shell and navigation
Goal: Provide the initial page structure for the flashcard generator.
Description: Create the main TanStack Start routes and a minimal application shell with navigation between input, review, and export areas. Keep the screens functional but intentionally sparse, with clear empty states and no AI or persistence behavior yet.

## 4. Build the raw-text and prompt input experience
Goal: Let users provide source material directly in the browser.
Description: Implement an input screen with a raw-text editor and a prompt-only mode. Add client-side validation, character or size guidance, submit-state handling, and an accessible path for handing the submitted content to the generation workflow.

## 5. Implement structured AI card-generation contracts
Goal: Convert model responses into validated flashcard collections.
Description: Define the AI request and response contracts for basic and cloze cards, including generation instructions and structured JSON parsing. Handle malformed, incomplete, or provider-error responses explicitly so the UI never treats invalid model output as successful generation.

## 6. Add a server-side AI provider adapter
Goal: Call an AI provider without exposing credentials to the browser.
Description: Add a server function or route that accepts validated generation requests, invokes the configured AI provider, and returns validated card data. Keep provider-specific behavior behind an adapter so switching between supported providers does not change the client contract.

## 7. Add file upload and document text extraction
Goal: Support PDF, TXT, Markdown, and DOCX source files.
Description: Add an upload flow that validates file type and size before processing. Extract readable text on the server for each supported format, return explicit errors for unsupported or unreadable files, and expose the extracted content to the same generation workflow used by raw text.

## 8. Add URL fetching and article-text extraction
Goal: Generate cards from a user-provided web page URL.
Description: Add a server-side URL input flow that validates URL syntax and fetches the page without exposing server credentials or turning the browser into an unrestricted proxy. Extract the primary readable article text, report fetch and parsing failures clearly, and pass successful results into generation.

## 9. Create the review workspace data state
Goal: Give users a reliable client-side draft collection to review.
Description: Build the review workspace state using the TanStack ecosystem, including loading a generated collection, tracking unsaved edits, and representing selected, deleted, and newly created cards. Define predictable behavior for empty collections, reset operations, and navigation away from unsaved changes.

## 10. Implement inline card editing and manual card creation
Goal: Let users directly correct and expand generated cards.
Description: Add editable Front and Back fields, cloze content editing, tag add/remove controls, card deletion, and manual card creation in the review workspace. Validate edits against the shared card model and show field-level errors without losing other draft changes.

## 11. Add bulk and per-card AI refinement
Goal: Let users improve cards through targeted AI instructions.
Description: Add controls for global refinement prompts and per-card refinement actions, sending only the required card data and instruction to the server. Apply returned changes safely to the draft collection, preserve unaffected cards, and expose failures without discarding local edits.

## 12. Add review-table usability features
Goal: Make larger card collections practical to inspect and edit.
Description: Configure the review workspace with TanStack Table features appropriate for flashcards, including stable columns, sorting or filtering, row selection, and useful keyboard/focus behavior. Preserve edits while the visible row set changes and provide accessible labels for all table actions.

## 13. Implement CSV and TXT export
Goal: Provide a dependable text-based fallback export.
Description: Add client-side export for Anki-compatible CSV and plain-text formats using the validated review collection. Handle escaping, multiline fields, tags, cloze syntax, empty values, and download filenames consistently, and add focused tests for representative edge cases.

## 14. Implement client-side APKG export
Goal: Export reviewed cards as an Anki package directly from the browser.
Description: Integrate the selected client-side Anki package builder and map basic and cloze cards into a valid deck and note structure. Generate a downloadable `.apkg`, report generation failures explicitly, and verify that exported content preserves fields, tags, and cloze markup.

## 15. Add generation and export progress/error UX
Goal: Make long-running operations understandable and recoverable.
Description: Add consistent loading, progress, cancellation or retry behavior where supported, and error states for AI generation, file extraction, URL fetching, refinement, and exports. Ensure controls cannot submit conflicting operations and that users can recover without losing an editable draft.

## 16. Add server-side request limits and input safety checks
Goal: Protect the application’s server-facing processing paths.
Description: Add validation and limits for prompt size, uploaded files, fetched URLs, extracted text, and AI request payloads. Prevent unsafe URL access patterns, reject unexpected content, and return actionable errors while preserving the application’s normal user experience.

## 17. Add end-to-end coverage for the MVP workflow
Goal: Verify the complete path from source input to Anki export.
Description: Add automated coverage for submitting source text, receiving a representative generated collection through a mocked AI boundary, editing cards, refining a card, and exporting CSV and APKG output. Keep external AI, network fetching, and binary generation dependencies deterministic through test doubles or fixtures.
