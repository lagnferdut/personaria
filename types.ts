
export interface ProcessedFile {
  name: string;
  type: string;
  content: string | null; // Content as base64 string for images/text, or null for other types
  size: number;
}

export interface GoogleAd {
  headline1: string;
  headline2: string;
  headline3?: string; // Optional
  description1: string;
  description2?: string; // Optional
}

// Intermediate structure from first Gemini call, includes image prompts
export interface PersonaScaffold {
  id: string;
  name: string;
  age: number;
  occupation: string;
  demographics: string; // e.g., location, income, education, family status
  goals: string[]; // Professional or personal goals relevant to the product/service
  challenges: string[]; // Pain points, obstacles
  motivations: string[]; // What drives them
  communicationChannels: string[]; // Where to reach them (social media, blogs, forums)
  detailedDescription: string; // A narrative about the persona
  googleAds: GoogleAd[];
  socialMediaAdText: string;
  imagePrompts: {
    storyboard: string[]; // Array of 3 prompts for storyboard images
    socialMediaAd: string; // Prompt for one square social media ad image
  };
}

// Final Persona structure including generated image URLs/base64 strings
export interface Persona extends Omit<PersonaScaffold, 'imagePrompts' | 'socialMediaAdText'> {
  storyboardImages: string[]; // Array of 3 base64 image strings
  socialMediaAd: {
    image: string; // base64 image string
    text: string;
  };
}

export interface CompanyInputData {
  companyName: string;
  companyDescription: string;
  companyURL: string;
  marketingGoals: string;
  files: ProcessedFile[];
}

// For Gemini Image generation response
export interface GeminiImage {
    imageBytes: string; // Base64 encoded string
    mimeType: string;
}

export interface GeminiImageGenerationResponse {
    generatedImages: GeminiImage[];
}

// For Gemini grounding metadata (if used)
export interface GroundingChunkWeb {
  uri: string;
  title: string;
}
export interface GroundingChunk {
  web?: GroundingChunkWeb;
  // Other types of chunks can be defined here if needed
}
export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  // Other grounding metadata fields
}
export interface Candidate {
  groundingMetadata?: GroundingMetadata;
  // Other candidate fields
}

// Simplified version of GenerateContentResponse from @google/genai
// Actual GenerateContentResponse is more complex and has methods, this is for typing data
export interface SimpleGenerateContentResponse {
  text: string; // Directly accessing the text property
  candidates?: Candidate[]; // For grounding metadata
  // Add other fields you might need from GenerateContentResponse
}
    