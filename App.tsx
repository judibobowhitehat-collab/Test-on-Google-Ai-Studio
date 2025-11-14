
import React, { useState, useCallback, useRef } from 'react';
import { Tab } from './types';
import { analyzeImage, editImage } from './services/geminiService';
import { PhotoIcon, SparklesIcon, DocumentTextIcon, LoaderIcon, XCircleIcon } from './components/icons';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Editor);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearState = () => {
    setPrompt('');
    setGeneratedImage(null);
    setAnalysisResult(null);
    setError(null);
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    clearState();
  };
  
  const handleImageReset = () => {
    setImageFile(null);
    setImageUrl(null);
    clearState();
    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageReset();
      setImageFile(file);
      try {
        const base64 = await fileToBase64(file);
        setImageUrl(base64);
      } catch (err) {
        setError('Failed to read image file.');
        console.error(err);
      }
    }
  }, []);

  const handleSubmit = async () => {
    if (!imageFile || !imageUrl || !prompt) {
      setError('Please upload an image and enter a prompt.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setAnalysisResult(null);

    try {
      if (activeTab === Tab.Editor) {
        const result = await editImage(imageUrl, imageFile.type, prompt);
        setGeneratedImage(result);
      } else {
        const result = await analyzeImage(imageUrl, imageFile.type, prompt);
        setAnalysisResult(result);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const TabButton: React.FC<{ tab: Tab; icon: React.ReactNode }> = ({ tab, icon, children }) => (
    <button
      onClick={() => handleTabChange(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${
        activeTab === tab
          ? 'bg-indigo-600 text-white shadow'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
      }`}
    >
      {icon}
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col p-4 sm:p-6 lg:p-8 font-sans">
      <header className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-purple-400 to-indigo-500 text-transparent bg-clip-text">
            Gemini Image Studio
          </span>
        </h1>
        <p className="mt-2 text-lg text-gray-400">Edit and analyze images with the power of AI.</p>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Controls Panel */}
        <div className="lg:col-span-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col gap-6 h-fit">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">1. Choose Mode</label>
            <div className="flex gap-2">
              <TabButton tab={Tab.Editor} icon={<SparklesIcon className="w-5 h-5" />}>Editor</TabButton>
              <TabButton tab={Tab.Analyzer} icon={<DocumentTextIcon className="w-5 h-5" />}>Analyzer</TabButton>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">2. Upload Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 border border-gray-600 transition-colors"
            >
              <PhotoIcon className="w-5 h-5" />
              <span>{imageFile ? 'Change Image' : 'Select Image'}</span>
            </button>
            {imageFile && (
                <div className="mt-3 text-xs text-gray-400 text-center truncate">
                    {imageFile.name}
                </div>
            )}
          </div>
          
          <div className="flex-1">
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
              3. Enter Prompt
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={!imageUrl}
              placeholder={
                !imageUrl ? "Upload an image first" :
                activeTab === Tab.Editor
                  ? 'e.g., "Add a retro film grain effect"'
                  : 'e.g., "What is the main subject of this image?"'
              }
              className="w-full h-32 p-3 bg-gray-900/50 border border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!imageUrl || !prompt || isLoading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
          >
            {isLoading ? (
              <>
                <LoaderIcon className="w-5 h-5" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {activeTab === Tab.Editor ? <SparklesIcon className="w-5 h-5" /> : <DocumentTextIcon className="w-5 h-5" />}
                <span>{activeTab === Tab.Editor ? 'Generate' : 'Analyze'}</span>
              </>
            )}
          </button>
          {error && <p className="text-red-400 text-sm mt-2 text-center">{error}</p>}
        </div>

        {/* Display Panel */}
        <div className="lg:col-span-8 bg-gray-800/50 p-6 rounded-2xl border border-gray-700 flex flex-col items-center justify-center min-h-[400px] lg:min-h-0 relative">
          {!imageUrl ? (
            <div className="text-center text-gray-500">
              <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-semibold">Image Preview</h3>
              <p>Upload an image to get started</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col gap-6">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                 <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-gray-900/50 rounded-lg overflow-hidden">
                    <img src={imageUrl} alt="Original" className="max-w-full max-h-full object-contain"/>
                    <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Original</div>
                     <button onClick={handleImageReset} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-red-500 transition-colors">
                        <XCircleIcon className="w-6 h-6"/>
                     </button>
                 </div>
                 <div className="relative w-full h-full min-h-[300px] flex items-center justify-center bg-gray-900/50 rounded-lg overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
                            <LoaderIcon className="w-12 h-12 text-indigo-400"/>
                            <p className="mt-4 text-lg">Generating result...</p>
                        </div>
                    )}
                    {generatedImage ? (
                        <>
                            <img src={generatedImage} alt="Generated" className="max-w-full max-h-full object-contain"/>
                            <div className="absolute top-2 left-2 bg-indigo-600/80 text-white text-xs px-2 py-1 rounded">Result</div>
                        </>
                    ) : analysisResult ? (
                         <div className="p-4 w-full h-full text-gray-300 overflow-y-auto">
                            <h3 className="text-lg font-semibold mb-2 text-indigo-400">Analysis Result</h3>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{analysisResult}</p>
                         </div>
                    ) : (
                        <div className="text-center text-gray-500">
                           <SparklesIcon className="w-12 h-12 mx-auto mb-4"/>
                           <h3 className="text-xl font-semibold">Result will appear here</h3>
                           <p>Enter a prompt and click Generate/Analyze</p>
                        </div>
                    )}
                 </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
