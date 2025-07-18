
export const GEMINI_TEXT_MODEL = "gemini-2.5-flash";
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002";

export const MAX_FILES = 5;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const ACCEPTED_TEXT_FILE_TYPES = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
// For PDF and DOCX, we'd ideally extract text. For now, we'll just send their names/types if not .txt/.md.
// Simple client-side text extraction for .txt and .md.
