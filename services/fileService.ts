
import { ProcessedFile } from '../types';
import { ACCEPTED_TEXT_FILE_TYPES, MAX_FILE_SIZE_BYTES } from '../constants';

// Basic function to read file as text. For PDF/DOCX, this would need more complex libraries.
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

export const processUploadedFiles = async (files: File[]): Promise<ProcessedFile[]> => {
  const processedFiles: ProcessedFile[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      console.warn(`Plik ${file.name} przekracza maksymalny rozmiar i został pominięty.`);
      continue; // Skip file if too large
    }

    let content: string | null = null;
    // For this example, only .txt and .md files will have their content read directly.
    // PDF and DOCX would require server-side processing or heavy client-side libraries.
    // For now, we'll just pass their names and types for context.
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      try {
        content = await readFileAsText(file);
      } catch (error) {
        console.error(`Błąd odczytu pliku ${file.name}:`, error);
        content = null; // Could not read content
      }
    } else if (ACCEPTED_TEXT_FILE_TYPES.includes(file.type)) {
      // For PDF, DOCX, etc., we are not extracting content client-side in this basic example
      // We could potentially try to send them as base64 if Gemini API supports it for text models
      // but that's usually for vision models. So, just name/type.
      console.log(`Plik ${file.name} (${file.type}) zostanie przekazany przez nazwę/typ.`);
    }


    processedFiles.push({
      name: file.name,
      type: file.type,
      content: content, // This will be text content for .txt/.md, null otherwise for now
      size: file.size,
    });
  }
  return processedFiles;
};
    