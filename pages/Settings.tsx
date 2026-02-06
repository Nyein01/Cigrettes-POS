import React, { useRef, useState } from 'react';
import { Sun, Moon, Cloud, Droplets, Palette, Check, Image as ImageIcon, Upload } from 'lucide-react';

interface SettingsProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
  customBg: string;
  onCustomBgChange: (dataUrl: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ currentTheme, onThemeChange, customBg, onCustomBgChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  // Simplified IDs to match App.tsx mapping
  const themes = [
    { 
      id: 'daylight', 
      name: 'Daylight', 
      icon: Sun, 
      description: 'Bright and airy with soft gradients.',
      previewClass: 'bg-gradient-to-br from-indigo-100 to-rose-100'
    },
    { 
      id: 'midnight', 
      name: 'Midnight', 
      icon: Moon, 
      description: 'Dark, deep tones for night shifts.',
      previewClass: 'bg-slate-900'
    },
    { 
      id: 'sunset', 
      name: 'Sunset', 
      icon: Cloud, 
      description: 'Warm colors inspired by the evening sky.',
      previewClass: 'bg-gradient-to-br from-orange-200 to-rose-200'
    },
    { 
      id: 'ocean', 
      name: 'Ocean', 
      icon: Droplets, 
      description: 'Calm blue tones for a relaxed vibe.',
      previewClass: 'bg-gradient-to-br from-cyan-200 to-blue-200'
    },
    { 
      id: 'minimal', 
      name: 'Minimal', 
      icon: Palette, 
      description: 'Clean, solid grey for maximum focus.',
      previewClass: 'bg-slate-200'
    },
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      
      img.onload = () => {
        // Create canvas to resize image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Lowered max dimensions to 1280 to save localStorage space (Mobile friendly)
        const maxWidth = 1280;
        const maxHeight = 720;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress to JPEG 0.6 quality for smaller size string
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
            
            try {
                // Try setting it
                onCustomBgChange(compressedDataUrl);
                onThemeChange('custom');
            } catch (error) {
                console.error(error);
                alert("Image is still too large. Please try a smaller image.");
            }
        }
        setProcessing(false);
      };
      
      img.onerror = () => {
          setProcessing(false);
          alert("Failed to load image");
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input so the same file can be selected again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto animate-fade-in">
       <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 tracking-tight">Settings</h2>
            <p className="text-slate-600 font-medium mt-1 text-sm lg:text-base">Customize your app experience</p>
        </div>

        <div className="glass-panel rounded-2xl p-6 lg:p-8">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Palette className="text-indigo-600" size={20} /> App Appearance
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Standard Themes */}
                {themes.map((theme) => {
                    const isSelected = currentTheme === theme.id;
                    return (
                        <button
                            key={theme.id}
                            onClick={() => onThemeChange(theme.id)}
                            className={`relative group rounded-xl p-4 border-2 transition-all duration-300 text-left hover:scale-[1.02] flex items-start gap-4 ${
                                isSelected 
                                ? 'border-indigo-500 bg-white/60 shadow-lg' 
                                : 'border-transparent bg-white/30 hover:bg-white/50 hover:border-white/50'
                            }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner ${theme.previewClass} ${isSelected ? 'text-indigo-700' : 'text-slate-500'}`}>
                                <theme.icon size={24} strokeWidth={1.5} />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className={`font-bold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>{theme.name}</span>
                                    {isSelected && <div className="bg-indigo-600 text-white p-0.5 rounded-full"><Check size={12} strokeWidth={3} /></div>}
                                </div>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    {theme.description}
                                </p>
                            </div>
                        </button>
                    );
                })}

                {/* Custom Image Upload */}
                <button
                    onClick={triggerUpload}
                    className={`relative group rounded-xl p-4 border-2 transition-all duration-300 text-left hover:scale-[1.02] flex items-start gap-4 ${
                        currentTheme === 'custom' 
                        ? 'border-indigo-500 bg-white/60 shadow-lg' 
                        : 'border-dashed border-slate-300 bg-white/20 hover:bg-white/40 hover:border-indigo-300'
                    }`}
                >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative ${currentTheme === 'custom' ? 'ring-2 ring-offset-2 ring-indigo-500' : 'bg-slate-200'}`}>
                        {customBg ? (
                            <img src={customBg} alt="Custom" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon size={24} strokeWidth={1.5} className="text-slate-500" />
                        )}
                        {processing && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${currentTheme === 'custom' ? 'text-indigo-900' : 'text-slate-700'}`}>Custom Picture</span>
                            {currentTheme === 'custom' && <div className="bg-indigo-600 text-white p-0.5 rounded-full"><Check size={12} strokeWidth={3} /></div>}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {processing ? 'Processing...' : 'Upload your own background.'}
                        </p>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                    />
                </button>
            </div>
        </div>
    </div>
  );
};