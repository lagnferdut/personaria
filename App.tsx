
import React, { useState, useCallback } from 'react';
import { CompanyInputForm } from './components/CompanyInputForm';
import { PersonaCard } from './components/PersonaCard';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Persona, ProcessedFile, PersonaScaffold } from './types';
import { generateInitialPersonaData, generatePersonaImages } from './services/geminiService';
import { processUploadedFiles } from './services/fileService';
import { downloadPersonaAsPDF } from './services/pdfService';
import { SparklesIcon } from './components/icons/SparklesIcon'; // Assuming this icon is for a button or title

const App: React.FC = () => {
  const [generatedPersonas, setGeneratedPersonas] = useState<Persona[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePersonas = useCallback(async (
    companyName: string,
    companyDescription: string,
    companyURL: string,
    marketingGoals: string,
    files: File[]
  ) => {
    setIsLoading(true);
    setError(null);
    setGeneratedPersonas([]);

    try {
      const processedFiles: ProcessedFile[] = await processUploadedFiles(files);
      
      const personaScaffolds: PersonaScaffold[] = await generateInitialPersonaData(
        companyName,
        companyDescription,
        companyURL,
        marketingGoals,
        processedFiles
      );

      if (!personaScaffolds || personaScaffolds.length === 0) {
        setError("Nie udało się wygenerować person. Spróbuj ponownie z innymi danymi.");
        setIsLoading(false);
        return;
      }
      
      const personasWithImages: Persona[] = [];
      for (const scaffold of personaScaffolds) {
        const { storyboardImages, socialMediaAdImage } = await generatePersonaImages(scaffold.imagePrompts);
        personasWithImages.push({
          ...scaffold,
          storyboardImages,
          socialMediaAd: {
            image: socialMediaAdImage,
            text: scaffold.socialMediaAdText // Already present in scaffold
          }
        });
      }

      setGeneratedPersonas(personasWithImages);
    } catch (err) {
      console.error("Błąd podczas generowania person:", err);
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd.";
      setError(`Nie udało się wygenerować person. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDownloadPDF = useCallback(async (personaId: string, personaName: string) => {
    const elementId = `persona-card-${personaId}`;
    try {
      await downloadPersonaAsPDF(elementId, personaName);
    } catch (err) {
      console.error("Błąd podczas generowania PDF:", err);
      setError("Nie udało się wygenerować pliku PDF.");
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <section id="input-section" className="mb-12 bg-slate-800 bg-opacity-70 backdrop-blur-md shadow-2xl rounded-xl p-6 md:p-10 transition-all duration-500 ease-in-out">
          <div className="flex items-center mb-6">
            <SparklesIcon className="w-8 h-8 text-pink-500 mr-3" />
            <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-transparent bg-clip-text">
              Stwórz Persony Marketingowe
            </h2>
          </div>
          <p className="text-slate-300 mb-8 text-lg">
            Wprowadź dane o swojej firmie i celach, a my wygenerujemy szczegółowe persony marketingowe, które pomogą Ci dotrzeć do idealnych klientów.
          </p>
          <CompanyInputForm onSubmit={handleGeneratePersonas} isLoading={isLoading} />
        </section>

        {isLoading && (
          <div className="flex flex-col items-center justify-center my-12">
            <LoadingSpinner className="w-16 h-16 text-indigo-500" />
            <p className="mt-4 text-xl text-slate-300 animate-pulse">Generowanie person... To może chwilę potrwać.</p>
            <p className="mt-2 text-sm text-slate-400">Tworzymy opisy, reklamy i obrazy specjalnie dla Ciebie!</p>
          </div>
        )}

        {error && (
          <div className="my-12 p-6 bg-red-800 bg-opacity-50 border border-red-700 rounded-lg text-red-200 text-center">
            <h3 className="font-bold text-xl mb-2">Wystąpił błąd</h3>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && generatedPersonas.length > 0 && (
          <section id="personas-section">
            <h2 className="text-3xl font-bold text-center mb-10 tracking-tight bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 text-transparent bg-clip-text">
              Wygenerowane Persony
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {generatedPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  onDownloadPDF={() => handleDownloadPDF(persona.id, persona.name)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
    