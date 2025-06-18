
import React, { useState, useCallback, ChangeEvent } from 'react';
import { MAX_FILES, MAX_FILE_SIZE_BYTES } from '../constants';
import { Button } from './Button';
import { UploadIcon } from './icons/UploadIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';


interface CompanyInputFormProps {
  onSubmit: (
    companyName: string,
    companyDescription: string,
    companyURL: string,
    marketingGoals: string,
    files: File[]
  ) => void;
  isLoading: boolean;
}

export const CompanyInputForm: React.FC<CompanyInputFormProps> = ({ onSubmit, isLoading }) => {
  const [companyName, setCompanyName] = useState<string>('');
  const [companyDescription, setCompanyDescription] = useState<string>('');
  const [companyURL, setCompanyURL] = useState<string>('');
  const [marketingGoals, setMarketingGoals] = useState<string>('');
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      if (files.length + newFiles.length > MAX_FILES) {
        setFileError(`Możesz załączyć maksymalnie ${MAX_FILES} plików.`);
        return;
      }
      for (const file of newFiles) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setFileError(`Plik "${file.name}" jest za duży. Maksymalny rozmiar to ${MAX_FILE_SIZE_BYTES / (1024*1024)}MB.`);
          return;
        }
      }
      setFiles(prevFiles => [...prevFiles, ...newFiles].slice(0, MAX_FILES)); // Ensure not exceeding MAX_FILES due to concurrent additions
    }
  }, [files]);

  const removeFile = useCallback((fileName: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setFileError(null);
  }, []);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyName.trim() || !companyDescription.trim() || !marketingGoals.trim()) {
        alert("Proszę wypełnić wszystkie wymagane pola: Nazwa firmy, Opis firmy, Cele marketingowe.");
        return;
    }
    onSubmit(companyName, companyDescription, companyURL, marketingGoals, files);
  };
  
  const inputClass = "w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors duration-200";
  const labelClass = "block text-sm font-medium text-slate-300 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="companyName" className={labelClass}>Nazwa firmy <span className="text-pink-500">*</span></label>
        <input
          id="companyName"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="np. Acme Corporation"
          className={inputClass}
          required
        />
      </div>
      <div>
        <label htmlFor="companyDescription" className={labelClass}>Opis firmy <span className="text-pink-500">*</span></label>
        <textarea
          id="companyDescription"
          value={companyDescription}
          onChange={(e) => setCompanyDescription(e.target.value)}
          placeholder="Czym zajmuje się Twoja firma? Jakie problemy rozwiązuje?"
          className={`${inputClass} min-h-[100px]`}
          rows={4}
          required
        />
      </div>
      <div>
        <label htmlFor="companyURL" className={labelClass}>URL strony firmowej (opcjonalnie)</label>
        <input
          id="companyURL"
          type="url"
          value={companyURL}
          onChange={(e) => setCompanyURL(e.target.value)}
          placeholder="https://www.przykladowa-firma.pl"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="marketingGoals" className={labelClass}>Cele marketingowe <span className="text-pink-500">*</span></label>
        <textarea
          id="marketingGoals"
          value={marketingGoals}
          onChange={(e) => setMarketingGoals(e.target.value)}
          placeholder="Co chcesz osiągnąć? np. zwiększenie świadomości marki, pozyskanie nowych klientów, promocja nowego produktu."
          className={`${inputClass} min-h-[100px]`}
          rows={4}
          required
        />
      </div>
      <div>
        <label htmlFor="fileUpload" className={labelClass}>
          Dodatkowe pliki (opcjonalnie, maks. {MAX_FILES} plików, każdy do {MAX_FILE_SIZE_BYTES / (1024*1024)}MB)
        </label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md bg-slate-700 hover:border-indigo-500 transition-colors">
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
            <div className="flex text-sm text-slate-400">
              <label
                htmlFor="file-upload-input"
                className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-slate-700 focus-within:ring-indigo-500 px-2 py-1"
              >
                <span>Załącz pliki</span>
                <input id="file-upload-input" name="file-upload-input" type="file" className="sr-only" multiple onChange={handleFileChange} accept=".txt,.pdf,.md,.docx" />
              </label>
              <p className="pl-1">lub przeciągnij i upuść</p>
            </div>
            <p className="text-xs text-slate-500">Obsługiwane: TXT, PDF, MD, DOCX</p>
          </div>
        </div>
        {fileError && <p className="mt-2 text-sm text-red-400">{fileError}</p>}
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium text-slate-300">Wybrane pliki:</h4>
            <ul className="divide-y divide-slate-600 rounded-md border border-slate-600 bg-slate-700">
              {files.map(file => (
                <li key={file.name} className="flex items-center justify-between py-2 px-3 text-sm">
                  <span className="text-slate-200 truncate pr-2">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={() => removeFile(file.name)}
                    className="text-red-400 hover:text-red-300"
                    aria-label={`Usuń plik ${file.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Button type="submit" disabled={isLoading} variant="primary" className="w-full text-lg group">
        {isLoading ? (
          'Generowanie...'
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2 group-hover:animate-ping" />
            Generuj Persony
          </>
        )}
      </Button>
    </form>
  );
};
    