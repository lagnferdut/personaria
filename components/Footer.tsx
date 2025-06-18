
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 bg-opacity-50 border-t border-slate-700 py-6 text-center">
      <div className="container mx-auto px-4">
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} Personaria. Wszelkie prawa zastrzeżone.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Napędzane przez Gemini API i React.
        </p>
      </div>
    </footer>
  );
};
    