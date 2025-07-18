
import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse, Type } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants';
import { ProcessedFile, PersonaScaffold, GoogleAd } from '../types';

if (!process.env.API_KEY) {
  // This will be caught by the App component if API_KEY is not set.
  // For Railway.app, API_KEY should be set as an environment variable.
  console.warn("Klucz API Gemini nie jest skonfigurowany. Ustaw zmienną środowiskową API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });


const cleanJsonString = (jsonStr: string): string => {
  let cleaned = jsonStr.trim();
  // Remove markdown fences (```json ... ``` or ``` ... ```)
  if (cleaned.startsWith("```json") && cleaned.endsWith("```")) {
    cleaned = cleaned.substring(7, cleaned.length - 3).trim();
  } else if (cleaned.startsWith("```") && cleaned.endsWith("```")) {
     cleaned = cleaned.substring(3, cleaned.length - 3).trim();
  }
  return cleaned;
};

const parsePersonasFromResponse = (responseText: string): PersonaScaffold[] => {
  const cleanedJson = cleanJsonString(responseText);
  try {
    const parsed = JSON.parse(cleanedJson);
    // Gemini might return a single object or an array. Standardize to array.
    const rawPersonas = Array.isArray(parsed) ? parsed : (parsed.personas || [parsed]);

    if (!Array.isArray(rawPersonas)) {
      throw new Error("Oczekiwano tablicy person, ale otrzymano inny typ.");
    }

    return rawPersonas.map((p: any, index: number): PersonaScaffold => ({
      id: p.id || `persona-${Date.now()}-${index}`,
      name: p.name || "Nieznana Persona",
      age: typeof p.age === 'number' ? p.age : 0,
      occupation: p.occupation || "Nieznany zawód",
      demographics: p.demographics || "Brak danych demograficznych.",
      goals: Array.isArray(p.goals) ? p.goals : [],
      challenges: Array.isArray(p.challenges) ? p.challenges : [],
      motivations: Array.isArray(p.motivations) ? p.motivations : [],
      communicationChannels: Array.isArray(p.communicationChannels) ? p.communicationChannels : [],
      detailedDescription: p.detailedDescription || "Brak szczegółowego opisu.",
      googleAds: Array.isArray(p.googleAds) ? p.googleAds.map((ad: any): GoogleAd => ({
        headline1: ad.headline1 || "Przykładowy Nagłówek 1",
        headline2: ad.headline2 || "Przykładowy Nagłówek 2",
        headline3: ad.headline3, // Optional
        description1: ad.description1 || "Przykładowy opis reklamy Google.",
        description2: ad.description2, // Optional
      })) : [],
      socialMediaAdText: p.socialMediaAdText || "Przykładowy tekst reklamy social media.",
      imagePrompts: {
        storyboard: (Array.isArray(p.imagePrompts?.storyboard) && p.imagePrompts.storyboard.length === 3) ? p.imagePrompts.storyboard : [
          `Dynamic scene of ${p.name || 'persona'} interacting with a product.`,
          `${p.name || 'persona'} achieving a goal related to their challenges.`,
          `Close-up of ${p.name || 'persona'} looking satisfied or thoughtful.`,
        ],
        socialMediaAd: p.imagePrompts?.socialMediaAd || `Visually appealing square graphic for ${p.name || 'persona'} related to their interests.`
      }
    }));
  } catch (error) {
    console.error("Błąd parsowania JSON z odpowiedzi Gemini:", error, "Otrzymany tekst:", responseText);
    throw new Error("Nie udało się przetworzyć odpowiedzi od AI. Format JSON był nieprawidłowy.");
  }
};


export const generateInitialPersonaData = async (
  companyName: string,
  companyDescription: string,
  companyURL: string,
  marketingGoals: string,
  files: ProcessedFile[]
): Promise<PersonaScaffold[]> => {
  if (!process.env.API_KEY) {
    throw new Error("Klucz API Gemini (API_KEY) nie jest ustawiony w zmiennych środowiskowych.");
  }

  let fileContext = "";
  if (files.length > 0) {
    fileContext = "\n\nDodatkowe informacje z załączonych plików:\n";
    files.forEach(file => {
      fileContext += `- Nazwa pliku: ${file.name} (Typ: ${file.type}, Rozmiar: ${(file.size / 1024).toFixed(2)} KB)\n`;
      if (file.content) {
        fileContext += `  Treść (fragment): ${file.content.substring(0, 200)}...\n`;
      } else {
        fileContext += `  Plik "${file.name}" został załączony (brak bezpośredniej treści tekstowej do przetworzenia po stronie klienta).\n`;
      }
    });
  }

  const prompt = `
Jesteś zaawansowanym ekspertem od marketingu i strategii UX. Twoim zadaniem jest stworzenie 1-2 szczegółowych person marketingowych dla firmy na podstawie poniższych informacji.
Dla każdej persony wygeneruj także przykładowe teksty reklam Google Ads, tekst reklamy na media społecznościowe oraz konkretne PROMPTY (polecenia) do wygenerowania obrazów przez model AI (np. Imagen).

Informacje o firmie:
- Nazwa firmy: ${companyName}
- Opis firmy: ${companyDescription}
- Strona WWW: ${companyURL || 'Nie podano'}
- Cele marketingowe: ${marketingGoals}
${fileContext}

Zwróć odpowiedź WYŁĄCZNIE w formacie JSON, korzystając ze zdefiniowanego schematu.
`;
  
  const personaSchema = {
    type: Type.OBJECT,
    properties: {
        id: { type: Type.STRING, description: "Unikalny identyfikator tekstowy (np. 'persona-123')." },
        name: { type: Type.STRING, description: "Imię persony (np. 'Anna Innowatorka')." },
        age: { type: Type.INTEGER, description: "Wiek persony." },
        occupation: { type: Type.STRING, description: "Zawód/stanowisko." },
        demographics: { type: Type.STRING, description: "Opis demograficzny (lokalizacja, dochody, edukacja, rodzina itp.)." },
        goals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tablica z celami persony (min. 2)." },
        challenges: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tablica z wyzwaniami/problemami persony (min. 2)." },
        motivations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tablica z motywacjami persony (min. 2)." },
        communicationChannels: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tablica z preferowanymi kanałami komunikacji." },
        detailedDescription: { type: Type.STRING, description: "Szczegółowy opis narracyjny persony (min. 100 słów)." },
        googleAds: { 
            type: Type.ARRAY, 
            description: "Tablica 2-3 przykładowych reklam Google Ads.",
            items: {
                type: Type.OBJECT,
                properties: {
                    headline1: { type: Type.STRING },
                    headline2: { type: Type.STRING },
                    headline3: { type: Type.STRING, description: "Opcjonalny nagłówek." },
                    description1: { type: Type.STRING },
                    description2: { type: Type.STRING, description: "Opcjonalny opis." },
                },
                required: ["headline1", "headline2", "description1"]
            }
        },
        socialMediaAdText: { type: Type.STRING, description: "Jeden tekst reklamy na media społecznościowe." },
        imagePrompts: {
            type: Type.OBJECT,
            properties: {
                storyboard: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tablica DOKŁADNIE TRZECH (3) szczegółowych promptów do storyboardu." },
                socialMediaAd: { type: Type.STRING, description: "Jeden szczegółowy prompt do kwadratowego obrazu reklamy w mediach społecznościowych." }
            },
            required: ["storyboard", "socialMediaAd"]
        }
    },
    required: ["id", "name", "age", "occupation", "demographics", "goals", "challenges", "motivations", "communicationChannels", "detailedDescription", "googleAds", "socialMediaAdText", "imagePrompts"]
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: personaSchema
        }
      }
    });
    
    const responseText = response.text;
    if (!responseText) {
        throw new Error("AI nie zwróciło żadnej treści.");
    }
    return parsePersonasFromResponse(responseText);

  } catch (error) {
    console.error("Błąd wywołania Gemini API (generateInitialPersonaData):", error);
    if (error instanceof Error && (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid"))) {
        throw new Error("Klucz API Gemini jest nieprawidłowy. Sprawdź konfigurację.");
    }
    throw error;
  }
};


export const generatePersonaImages = async (
  imagePrompts: PersonaScaffold['imagePrompts']
): Promise<{ storyboardImages: string[]; socialMediaAdImage: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("Klucz API Gemini (API_KEY) nie jest ustawiony w zmiennych środowiskowych.");
  }
  
  const generateSingleImage = async (prompt: string, aspectRatio: '1:1' | '16:9' = '1:1'): Promise<string> => {
    try {
      const response: GenerateImagesResponse = await ai.models.generateImages({
        model: GEMINI_IMAGE_MODEL,
        prompt: `Photo-realistic, detailed image: ${prompt}`,
        config: { 
          numberOfImages: 1, 
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio
        }
      });

      if (response.generatedImages && 
          response.generatedImages.length > 0 && 
          response.generatedImages[0]?.image?.imageBytes) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
      console.error("Nie udało się wygenerować obrazu: niekompletna odpowiedź API.", response);
      throw new Error("Nie udało się wygenerować obrazu: brak danych obrazu w odpowiedzi.");
    } catch (error) {
      console.error(`Błąd generowania obrazu dla promptu "${prompt}":`, error);
      // Zwróć obraz zastępczy w przypadku błędu
      const placeholderSize = aspectRatio === '1:1' ? '500x500' : '800x450';
      return `https://via.placeholder.com/${placeholderSize}.png?text=Błąd+obrazu`;
    }
  };

  // Storyboard obrazy mogą mieć inny aspect ratio
  const storyboardImagesPromises = imagePrompts.storyboard.map(prompt => generateSingleImage(prompt, '16:9'));
  const socialMediaAdImagePromise = generateSingleImage(imagePrompts.socialMediaAd, '1:1');

  const storyboardImages = await Promise.all(storyboardImagesPromises);
  const socialMediaAdImage = await socialMediaAdImagePromise;

  return { storyboardImages, socialMediaAdImage };
};
