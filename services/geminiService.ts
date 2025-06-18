
import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL } from '../constants';
import { ProcessedFile, PersonaScaffold, GoogleAd, SimpleGenerateContentResponse } from '../types';

if (!process.env.API_KEY) {
  // This will be caught by the App component if API_KEY is not set.
  // For Railway.app, API_KEY should be set as an environment variable.
  console.warn("Klucz API Gemini nie jest skonfigurowany. Ustaw zmienną środowiskową API_KEY.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY_PLACEHOLDER" });


const cleanJsonString = (jsonStr: string): string => {
  let cleaned = jsonStr.trim();
  // Remove markdown fences (```json ... ``` or ``` ... ```)
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleaned.match(fenceRegex);
  if (match && match[2]) {
    cleaned = match[2].trim();
  }
  return cleaned;
};

const parsePersonasFromResponse = (responseText: string): PersonaScaffold[] => {
  const cleanedJson = cleanJsonString(responseText);
  try {
    const parsed = JSON.parse(cleanedJson);
    // Gemini might return a single object or an array. Standardize to array.
    const rawPersonas = Array.isArray(parsed) ? parsed : (parsed.personas || [parsed]);

    return rawPersonas.map((p: any, index: number) => ({
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
  if (!process.env.API_KEY || process.env.API_KEY === "YOUR_API_KEY_PLACEHOLDER") {
    throw new Error("Klucz API Gemini (API_KEY) nie jest ustawiony w zmiennych środowiskowych.");
  }

  let fileContext = "";
  if (files.length > 0) {
    fileContext = "\n\nDodatkowe informacje z załączonych plików:\n";
    files.forEach(file => {
      fileContext += `- Nazwa pliku: ${file.name} (Typ: ${file.type}, Rozmiar: ${(file.size / 1024).toFixed(2)} KB)\n`;
      if (file.content && (file.type === 'text/plain' || file.type === 'text/markdown')) {
        fileContext += `  Treść (fragment): ${file.content.substring(0, 200)}...\n`;
      } else if (file.content) { // Could be base64 data for other types if handled, or just name/type
         fileContext += `  Plik "${file.name}" został załączony. Przeanalizuj go w kontekście firmy.\n`;
      } else {
        fileContext += `  Plik "${file.name}" został załączony (brak bezpośredniej treści tekstowej do wyświetlenia).\n`;
      }
    });
  }

  const prompt = `
Jesteś zaawansowanym ekspertem od marketingu i strategii UX. Twoim zadaniem jest stworzenie 2-3 szczegółowych person marketingowych dla firmy na podstawie poniższych informacji.
Dla każdej persony wygeneruj także przykładowe teksty reklam Google Ads, tekst reklamy na media społecznościowe oraz konkretne PROMPTY (polecenia) do wygenerowania obrazów przez model AI (np. Imagen).

Informacje o firmie:
- Nazwa firmy: ${companyName}
- Opis firmy: ${companyDescription}
- Strona WWW: ${companyURL || 'Nie podano'}
- Cele marketingowe: ${marketingGoals}
${fileContext}

Struktura odpowiedzi MUSI być w formacie JSON. Wygeneruj tablicę obiektów JSON, gdzie każdy obiekt reprezentuje jedną personę.
Każdy obiekt persony powinien zawierać następujące pola:
- id: unikalny identyfikator tekstowy (np. "persona-123")
- name: imię persony (np. "Anna Innowatorka")
- age: wiek (liczba)
- occupation: zawód/stanowisko
- demographics: opis demograficzny (lokalizacja, dochody, edukacja, rodzina itp.)
- goals: tablica stringów z celami persony (min. 2)
- challenges: tablica stringów z wyzwaniami/problemami persony (min. 2)
- motivations: tablica stringów z motywacjami persony (min. 2)
- communicationChannels: tablica stringów z preferowanymi kanałami komunikacji (np. "LinkedIn", "Blogi branżowe")
- detailedDescription: szczegółowy opis narracyjny persony (min. 100 słów)
- googleAds: tablica obiektów, każdy z polami: "headline1", "headline2", "headline3" (opcjonalny), "description1", "description2" (opcjonalny) (wygeneruj 2-3 reklamy)
- socialMediaAdText: jeden tekst reklamy na media społecznościowe (np. Facebook, Instagram)
- imagePrompts: obiekt zawierający:
  - storyboard: tablica DOKŁADNIE TRZECH (3) stringów, każdy będący szczegółowym promptem dla AI do wygenerowania obrazu do storyboardu. Prompty powinny być opisowe i wizualne.
  - socialMediaAd: jeden string, będący szczegółowym promptem dla AI do wygenerowania kwadratowego obrazu do reklamy w mediach społecznościowych.

Przykład struktury JSON dla jednej persony (użyj tej struktury dla każdej generowanej persony):
{
  "id": "persona-ewa-manager",
  "name": "Ewa Managerka",
  "age": 38,
  "occupation": "Marketing Manager w średniej firmie B2B",
  "demographics": "Mieszka w dużym mieście, zarobki powyżej średniej krajowej, wykształcenie wyższe, mężatka, jedno dziecko.",
  "goals": ["Zwiększenie ROI z kampanii marketingowych", "Automatyzacja powtarzalnych zadań", "Rozwój kompetencji zespołu"],
  "challenges": ["Ograniczony budżet marketingowy", "Szybko zmieniające się trendy", "Trudność w mierzeniu efektywności niektórych działań"],
  "motivations": ["Osiąganie wyników", "Nowe technologie", "Uznanie w branży"],
  "communicationChannels": ["LinkedIn", "Newslettery branżowe", "Konferencje marketingowe"],
  "detailedDescription": "Ewa jest ambitną managerką marketingu... (dłuższy opis)",
  "googleAds": [
    { "headline1": "Zwiększ ROI z Reklam", "headline2": "Narzędzia dla Managerów", "headline3": "Testuj za Darmo!", "description1": "Odkryj platformę, która pomoże Ci zoptymalizować budżet i osiągnąć lepsze wyniki. Zacznij już dziś!", "description2": "Nasze rozwiązania wspierają managerów takich jak Ty."}
  ],
  "socialMediaAdText": "Jesteś Marketing Managerem i szukasz sposobów na przełamanie rutyny? 🚀 Odkryj narzędzia, które pomogą Ci osiągnąć więcej! #marketing #B2Bmarketing #automation",
  "imagePrompts": {
    "storyboard": [
      "Ewa Managerka siedzi przy biurku w nowoczesnym biurze, analizując wykresy na monitorze komputera, wygląda na skupioną.",
      "Ewa prowadzi prezentację dla swojego zespołu, wskazując na ekran z danymi, wszyscy są zaangażowani.",
      "Ewa uśmiecha się, patrząc na tablet, na którym widać pozytywne wyniki kampanii, w tle panorama miasta."
    ],
    "socialMediaAd": "Dynamiczna, kwadratowa grafika z ikonami symbolizującymi wzrost i efektywność, nowoczesna typografia z hasłem 'Marketing na Wyższym Poziomie', stonowana kolorystyka z akcentami turkusu."
  }
}

Pamiętaj, aby dostarczyć odpowiedź wyłącznie jako poprawny obiekt JSON lub tablicę takich obiektów, bez dodatkowego tekstu przed lub po JSONie. Upewnij się, że prompty do obrazów są kreatywne i szczegółowe.
Generuj od 1 do 2 person, chyba że informacje wejściowe sugerują większą różnorodność.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const responseText = response.text;
    if (!responseText) {
        throw new Error("AI nie zwróciło żadnej treści.");
    }
    return parsePersonasFromResponse(responseText);

  } catch (error) {
    console.error("Błąd wywołania Gemini API (generateInitialPersonaData):", error);
    if (error instanceof Error && error.message.includes("API_KEY_INVALID")) {
        throw new Error("Klucz API Gemini jest nieprawidłowy. Sprawdź konfigurację.");
    }
    throw error;
  }
};


export const generatePersonaImages = async (
  imagePrompts: PersonaScaffold['imagePrompts']
): Promise<{ storyboardImages: string[]; socialMediaAdImage: string }> => {
  if (!process.env.API_KEY || process.env.API_KEY === "YOUR_API_KEY_PLACEHOLDER") {
    throw new Error("Klucz API Gemini (API_KEY) nie jest ustawiony w zmiennych środowiskowych.");
  }
  
  const generateSingleImage = async (prompt: string): Promise<string> => {
    try {
      // Use the SDK's GenerateImagesResponse type
      const response: GenerateImagesResponse = await ai.models.generateImages({
        model: GEMINI_IMAGE_MODEL,
        prompt: prompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' }
      });

      // Access imageBytes using the correct path from the SDK's type and perform null checks
      if (response.generatedImages && 
          response.generatedImages.length > 0 && 
          response.generatedImages[0] &&
          response.generatedImages[0].image && 
          response.generatedImages[0].image.imageBytes) {
        const base64ImageBytes = response.generatedImages[0].image.imageBytes;
        // The outputMimeType was 'image/jpeg', so using image/jpeg here is consistent.
        // const mimeType = response.generatedImages[0].image.mimeType; // e.g. "image/jpeg" 
        return `data:image/jpeg;base64,${base64ImageBytes}`;
      }
      console.error("Nie udało się wygenerować obrazu: niekompletna odpowiedź API.", response);
      throw new Error("Nie udało się wygenerować obrazu: brak danych obrazu w odpowiedzi lub niekompletna struktura.");
    } catch (error) {
      console.error(`Błąd generowania obrazu dla promptu "${prompt}":`, error);
      // Return a placeholder or re-throw. For now, returning a placeholder.
      return "https://picsum.photos/500/500?grayscale&blur=2"; // Placeholder image indicating an error
    }
  };

  const storyboardImagesPromises = imagePrompts.storyboard.map(prompt => generateSingleImage(prompt));
  const socialMediaAdImagePromise = generateSingleImage(imagePrompts.socialMediaAd);

  const storyboardImages = await Promise.all(storyboardImagesPromises);
  const socialMediaAdImage = await socialMediaAdImagePromise;

  return { storyboardImages, socialMediaAdImage };
};
