
import React from 'react';
import { Persona, GoogleAd } from '../types';
import { Button } from './Button';
import { DownloadIcon } from './icons/DownloadIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { ChatBubbleLeftRightIcon } from './icons/ChatBubbleLeftRightIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { PhotoIcon } from './icons/PhotoIcon';

interface PersonaCardProps {
  persona: Persona;
  onDownloadPDF: (personaId: string, personaName: string) => void;
}

const SectionTitle: React.FC<{ icon?: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center mb-3 mt-4">
    {icon && <span className="mr-2 text-indigo-400">{icon}</span>}
    <h4 className="text-lg font-semibold text-indigo-300 tracking-wide">{title}</h4>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-block bg-indigo-700 text-indigo-100 text-xs font-medium mr-2 mb-2 px-2.5 py-1 rounded-full">{children}</span>
);

export const PersonaCard: React.FC<PersonaCardProps> = ({ persona, onDownloadPDF }) => {
  const cardId = `persona-card-${persona.id}`;

  return (
    <div id={cardId} className="bg-slate-800 shadow-xl rounded-lg p-6 hover:shadow-indigo-500/30 transition-shadow duration-300 flex flex-col">
      <div className="flex-grow">
        <div className="flex items-center mb-4">
          <UserCircleIcon className="w-12 h-12 text-pink-500 mr-4" />
          <div>
            <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 text-transparent bg-clip-text">{persona.name}</h3>
            <p className="text-slate-400 text-sm">{persona.occupation}, {persona.age} lat</p>
          </div>
        </div>

        <p className="text-slate-300 mb-4 leading-relaxed">{persona.detailedDescription}</p>
        
        <SectionTitle icon={<ChartBarIcon className="w-5 h-5" />} title="Demografia" />
        <p className="text-slate-400 text-sm mb-4">{persona.demographics}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <SectionTitle icon={<CheckCircleIcon className="w-5 h-5 text-green-400" />} title="Cele" />
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
              {persona.goals.map((goal, i) => <li key={`goal-${i}`}>{goal}</li>)}
            </ul>
          </div>
          <div>
            <SectionTitle icon={<XCircleIcon className="w-5 h-5 text-red-400" />} title="Wyzwania" />
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
              {persona.challenges.map((challenge, i) => <li key={`challenge-${i}`}>{challenge}</li>)}
            </ul>
          </div>
        </div>
        
        <SectionTitle icon={<LightBulbIcon className="w-5 h-5" />} title="Motywacje" />
        <div className="mb-4">
          {persona.motivations.map((m, i) => <Pill key={`mot-${i}`}>{m}</Pill>)}
        </div>

        <SectionTitle icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />} title="Kanały Komunikacji" />
        <div className="mb-6">
          {persona.communicationChannels.map((c, i) => <Pill key={`comm-${i}`}>{c}</Pill>)}
        </div>
        
        <SectionTitle icon={<PhotoIcon className="w-5 h-5" />} title="Storyboard Wizualny" />
        <div className="grid grid-cols-1 gap-3 mb-6">
          {persona.storyboardImages.map((imgSrc, i) => (
            <img key={`storyboard-${i}`} src={imgSrc} alt={`Storyboard ${i+1} dla ${persona.name}`} className="rounded-lg shadow-md aspect-video object-cover w-full" />
          ))}
        </div>

        <SectionTitle icon={<MegaphoneIcon className="w-5 h-5" />} title="Przykładowe Reklamy Google Ads" />
        <div className="space-y-3 mb-6">
          {persona.googleAds.map((ad: GoogleAd, i: number) => (
            <div key={`gads-${i}`} className="bg-slate-700 p-3 rounded-md shadow">
              <p className="text-blue-400 font-semibold">{ad.headline1} | {ad.headline2} {ad.headline3 ? `| ${ad.headline3}` : ''}</p>
              <p className="text-sm text-slate-300">{ad.description1} {ad.description2 ? ad.description2 : ''}</p>
              <p className="text-xs text-green-400 mt-1">reklama <span className="text-slate-500">example.com</span></p>
            </div>
          ))}
        </div>

        <SectionTitle icon={<MegaphoneIcon className="w-5 h-5" />} title="Przykładowa Reklama Social Media" />
        <div className="flex flex-col sm:flex-row gap-4 items-start bg-slate-700 p-4 rounded-lg shadow">
          <img src={persona.socialMediaAd.image} alt={`Reklama Social Media dla ${persona.name}`} className="w-full sm:w-1/3 max-w-[200px] aspect-square object-cover rounded-md shadow-md"/>
          <p className="text-sm text-slate-300 flex-1">{persona.socialMediaAd.text}</p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-700">
        <Button onClick={() => onDownloadPDF(persona.id, persona.name)} variant="secondary" className="w-full group">
          <DownloadIcon className="w-5 h-5 mr-2 group-hover:animate-bounce" />
          Pobierz jako PDF
        </Button>
      </div>
    </div>
  );
};
