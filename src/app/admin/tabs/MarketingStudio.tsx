// tabs/MarketingStudio.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, Instagram, TikTok, Facebook, Pinterest, Globe, 
  RefreshCw, Calendar, Send, Copy, Check, ImagePlus, 
  LayoutGrid, Layers, Wand2, Settings, ChevronLeft, ChevronRight,
  Heart, MessageCircle, Share2, Bookmark, Plus, X, Trash2,
  Languages, Droplet, Type, Palette, Grid3x3, Grid4x4, 
  Newspaper, ShoppingBag, TrendingUp, Clock, Star, Zap,
  AlertCircle, Upload, Save, Eye, EyeOff, Sliders, Edit3,
  ThumbsUp, ThumbsDown, RotateCcw, FileText, BookOpen, Zap as ZapIcon,
  AArrow, List, Hash, Quote, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react';

interface Product {
  id: number; name: string; brand: string; category: string; price: string;
  size: string; condition: string; images: string[]; vinted_url: string; sold: boolean;
}

interface PostConfig {
  type: 'single' | 'collage' | 'collection' | 'lookbook';
  products: Product[];
  template: string;
  language: 'de' | 'en' | 'de-mixed';
  captionStyle: 'storytelling' | 'technical' | 'emotional' | 'hashtag-heavy';
  includePrice: boolean;
  includeSize: boolean;
  includeBrand: boolean;
  variance: number;
}

interface GeneratedPost {
  id: string;
  imageUrl: string;
  caption: string;
  hashtags: string[];
  platforms: string[];
}

interface CaptionFeedback {
  originalText: string;
  editedText: string;
  productId: number;
  language: string;
  style: string;
  timestamp: Date;
}

// ============================================================
// CAPTION EDITOR COMPONENT
// ============================================================
function CaptionEditor({ 
  caption, 
  hashtags, 
  onCaptionChange, 
  onHashtagsChange,
  onSaveTemplate,
  onFeedback,
  onRegenerate
}: { 
  caption: string;
  hashtags: string[];
  onCaptionChange: (text: string) => void;
  onHashtagsChange: (hashtags: string[]) => void;
  onSaveTemplate: () => void;
  onFeedback: (type: 'positive' | 'negative') => void;
  onRegenerate: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview' | 'templates'>('edit');
  const [hashtagInput, setHashtagInput] = useState('');
  const [showRichEditor, setShowRichEditor] = useState(false);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);

  // Hashtag hinzufügen
  const addHashtag = (tag: string) => {
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    if (!hashtags.includes(normalizedTag)) {
      onHashtagsChange([...hashtags, normalizedTag]);
    }
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => {
    onHashtagsChange(hashtags.filter(t => t !== tag));
  };

  // Text-Formatierung (einfacher Rich Editor)
  const insertFormatting = (type: 'bold' | 'italic' | 'emoji' | 'linebreak' | 'quote') => {
    const textarea = document.getElementById('caption-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = caption.substring(start, end);
    
    let newText = caption;
    let insertText = '';
    
    switch(type) {
      case 'bold':
        insertText = `*${selectedText || 'Text'}*`;
        break;
      case 'italic':
        insertText = `_${selectedText || 'Text'}_`;
        break;
      case 'emoji':
        insertText = selectedText || '✨';
        break;
      case 'linebreak':
        insertText = '\n\n';
        break;
      case 'quote':
        insertText = `"${selectedText || 'Quote'}"`;
        break;
    }
    
    newText = caption.substring(0, start) + insertText + caption.substring(end);
    onCaptionChange(newText);
    
    // Set cursor position after timeout
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // Hilfsfunktionen für Text
  const getTextStats = () => {
    const chars = caption.length;
    const words = caption.split(/\s+/).filter(w => w.length > 0).length;
    const lines = caption.split('\n').length;
    const hashtagCount = hashtags.length;
    
    return { chars, words, lines, hashtagCount };
  };

  const stats = getTextStats();

  // Vorschlagene Hashtags basierend auf Caption
  const suggestedHashtags = [
    '#vintage', '#streetwear', '#scndunit', '#secondhand', 
    '#thrifted', '#vintagefashion', '#90sfashion', '#2000sfashion'
  ];

  return (
    <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#FF4400]/20">
        <button
          onClick={() => setActiveTab('edit')}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${
            activeTab === 'edit' ? 'bg-[#FF4400]/10 text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          Bearbeiten
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${
            activeTab === 'preview' ? 'bg-[#FF4400]/10 text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'
          }`}
        >
          <Eye className="w-4 h-4" />
          Vorschau
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${
            activeTab === 'templates' ? 'bg-[#FF4400]/10 text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Templates
        </button>
      </div>

      {/* Edit Tab */}
      {activeTab === 'edit' && (
        <div className="p-4">
          {/* Rich Editor Toolbar */}
          <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-gray-800">
            <button onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Fett (Text um *sternchen* setzen)">
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Kursiv (Text um _unterstriche_ setzen)">
              <Italic className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button onClick={() => insertFormatting('emoji')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Emoji einfügen">
              <span className="text-sm">😊</span>
            </button>
            <button onClick={() => insertFormatting('linebreak')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Zeilenumbruch">
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => insertFormatting('quote')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Anführungszeichen">
              <Quote className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button onClick={onRegenerate} className="p-1.5 hover:bg-[#FF4400]/10 rounded text-[#FF4400]" title="Neu generieren">
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Textarea */}
          <textarea
            id="caption-textarea"
            value={caption}
            onChange={(e) => onCaptionChange(e.target.value)}
            className="w-full h-48 bg-[#1A1A1A] border border-[#FF4400]/20 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#FF4400]"
            placeholder="Deine Caption..."
          />

          {/* Text Stats */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div className="flex gap-3">
              <span>📝 {stats.chars} Zeichen</span>
              <span>📖 {stats.words} Wörter</span>
              <span>📏 {stats.lines} Zeilen</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => {
                navigator.clipboard.writeText(caption);
                // toast('Caption kopiert!', 'success');
              }} className="hover:text-[#FF4400]">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Hashtag Manager */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">
              Hashtags ({stats.hashtagCount})
            </label>
            
            {/* Existing Hashtags */}
            <div className="flex flex-wrap gap-2 mb-3">
              {hashtags.map(tag => (
                <span key={tag} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded-full flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeHashtag(tag)} className="hover:text-white">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add Hashtag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addHashtag(hashtagInput)}
                placeholder="Neuen Hashtag eingeben (z.B. streetwear)"
                className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/20 rounded px-3 py-2 text-sm"
              />
              <button onClick={() => addHashtag(hashtagInput)} className="px-3 py-2 bg-[#FF4400] text-white rounded text-sm">
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Suggested Hashtags */}
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">Vorschläge:</p>
              <div className="flex flex-wrap gap-1">
                {suggestedHashtags.filter(t => !hashtags.includes(t)).slice(0, 8).map(tag => (
                  <button
                    key={tag}
                    onClick={() => addHashtag(tag)}
                    className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full hover:bg-[#FF4400]/20 hover:text-[#FF4400]"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={onSaveTemplate}
              className="flex-1 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-gray-300 rounded-lg text-sm flex items-center justify-center gap-2 hover:border-[#FF4400]"
            >
              <Save className="w-4 h-4" />
              Als Template speichern
            </button>
            <button
              onClick={() => onFeedback('positive')}
              className="py-2 px-4 bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg text-sm flex items-center gap-2 hover:bg-green-600/30"
            >
              <ThumbsUp className="w-4 h-4" />
              Gut
            </button>
            <button
              onClick={() => onFeedback('negative')}
              className="py-2 px-4 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-2 hover:bg-red-600/30"
            >
              <ThumbsDown className="w-4 h-4" />
              Schlecht
            </button>
          </div>
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === 'preview' && (
        <div className="p-4">
          <div className="bg-[#0A0A0A] rounded-lg p-4 max-h-96 overflow-y-auto">
            {/* Instagram-style Preview */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#FF4400] rounded-full flex items-center justify-center text-white text-xs font-bold">S</div>
              <div>
                <p className="text-sm font-bold">scnd_unit</p>
                <p className="text-xs text-gray-500">Curated Vintage</p>
              </div>
            </div>
            <div className="whitespace-pre-wrap text-sm">
              {caption.split('\n').map((line, i) => {
                // Erkenne Hashtags und mache sie klickbar (Preview)
                const parts = line.split(/(#[^\s#]+)/g);
                return (
                  <p key={i} className="mb-1">
                    {parts.map((part, j) => 
                      part.startsWith('#') ? (
                        <span key={j} className="text-[#FF4400]">{part}</span>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                  </p>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-800">
              {hashtags.map(tag => (
                <span key={tag} className="text-xs text-[#FF4400]">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="p-4">
          <p className="text-sm text-gray-400 mb-4">
            Gespeicherte Caption-Templates. Klicke um sie zu laden.
          </p>
          <div className="space-y-2">
            {/* Hier würden gespeicherte Templates angezeigt */}
            <div className="text-center text-gray-500 text-sm py-8">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Keine Templates gespeichert.<br />
              Bearbeite eine Caption und klicke auf "Als Template speichern".
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HAUPT-COMPONENT
// ============================================================
export function MarketingStudio({ products, toast }: { 
  products: Product[]; 
  toast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [activeTab, setActiveTab] = useState<'generator' | 'scheduler' | 'brand' | 'history'>('generator');
  const [postType, setPostType] = useState<'single' | 'collage' | 'collection' | 'lookbook'>('single');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<PostConfig>({
    type: 'single',
    products: [],
    template: 'streetwear',
    language: 'de-mixed',
    captionStyle: 'storytelling',
    includePrice: true,
    includeSize: true,
    includeBrand: true,
    variance: 5
  });
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState<'instagram' | 'tiktok'>('instagram');
  
  // Editierbare Caption State
  const [editableCaption, setEditableCaption] = useState('');
  const [editableHashtags, setEditableHashtags] = useState<string[]>([]);
  const [captionHistory, setCaptionHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Feedback Speicherung (für zukünftige Generierungen)
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  
  const availableProducts = products.filter(p => !p.sold);

  // ============================================================
  // CAPTION GENERIEREN (mit Lernfähigkeit)
  // ============================================================
  const generateCaption = useCallback((product: Product, language: string, style: string, options: any, variance: number): { caption: string; hashtags: string[] } => {
    // Lerne aus vergangenen Bearbeitungen (simuliert)
    // In der echten Implementierung würdest du aus einer DB mit Feedback lesen
    
    const getVariantModifier = () => {
      const varianceLevels = {
        1: { emojiChance: 0.2, linebreakChance: 0.3, excitement: 'low' },
        5: { emojiChance: 0.6, linebreakChance: 0.7, excitement: 'medium' },
        10: { emojiChance: 1.0, linebreakChance: 1.0, excitement: 'high' }
      };
      const level = variance <= 2 ? 1 : variance <= 7 ? 5 : 10;
      return varianceLevels[level as 1 | 5 | 10];
    };
    
    const varianceMod = getVariantModifier();
    
    const captions: Record<string, Record<string, (product: any, options: any, variance: any) => string>> = {
      de: {
        storytelling: (p, opts, v) => {
          const emojis = v.emojiChance > Math.random() ? ['✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 4)] : '';
          const linebreaks = v.linebreakChance > Math.random() ? '\n\n' : '\n';
          return `${emojis} Gefunden beim Stöbern ${emojis}${linebreaks}Dieses Piece hat eine Geschichte zu erzählen. Von einem Kleiderschrank zum nächsten - wir geben Fashion ein zweites Leben.${linebreaks}${opts.includeBrand ? `🏷️ Marke: ${p.brand}` : ''}${opts.includeSize ? `\n📏 Größe: ${p.size}` : ''}${opts.includePrice ? `\n💰 Preis: ${p.price}` : ''}${linebreaks}Was ist eure beste Thrift-Findung? 👇`;
        },
        technical: (p, opts, v) => {
          const dropNumber = Math.floor(Math.random() * (100 + (v.excitement === 'high' ? 200 : 0))) + 1;
          return `📸 SCND_UNIT Drop #${dropNumber}\n\n${p.name}\nZustand: 9/10${opts.includeSize ? `\nGröße: ${p.size} - true to size` : ''}\n\nMaße auf Anfrage 📏\n\nLink in Bio 🔗`;
        },
        emotional: (p, opts, v) => {
          const urgencyWords = v.excitement === 'high' ? '🚨 URGENT 🚨' : v.excitement === 'medium' ? '🔥 JUST LANDED 🔥' : '✨ NEW ARRIVAL ✨';
          return `${urgencyWords}\n\n${p.brand} ${p.name} - Das perfekte Piece${v.excitement === 'high' ? ' für diese Season 🤌' : ''}\n\n${opts.includePrice ? `💸 ${p.price}` : ''}\n\n${v.excitement === 'high' ? 'Schnell sein lohnt sich!' : 'Schau vorbei!'} ⬆️`;
        },
        'hashtag-heavy': (p, opts, v) => {
          const baseHashtags = ['vintage', 'secondhand', 'streetwear', p.brand?.toLowerCase(), 'scndunit'];
          const randomHashtags = v.excitement === 'high' ? ['90sfashion', '2000sfashion', 'rarefind', 'thrifted', 'vintagefashion'] : ['kleidung', 'thrifting'];
          const allHashtags = [...baseHashtags, ...randomHashtags].filter(Boolean);
          return `NEU IM SHOP 🔥\n\n${p.brand} ${p.name} ${opts.includeSize ? p.size : ''}\n\n${allHashtags.map(t => `#${t.toLowerCase().replace(/\s/g, '')}`).join(' ')}`;
        }
      },
      en: {
        storytelling: (p, opts, v) => {
          const emojis = v.emojiChance > Math.random() ? ['✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 4)] : '';
          const linebreaks = v.linebreakChance > Math.random() ? '\n\n' : '\n';
          return `${emojis} Found this gem while thrifting ${emojis}${linebreaks}This rare piece tells a story. From someone's closet to yours - giving fashion a second life.${linebreaks}${opts.includeBrand ? `🏷️ Brand: ${p.brand}` : ''}${opts.includeSize ? `\n📏 Size: ${p.size}` : ''}${opts.includePrice ? `\n💰 Price: ${p.price}` : ''}${linebreaks}What's your best thrift find? 👇`;
        },
        technical: (p, opts, v) => {
          const dropNumber = Math.floor(Math.random() * (100 + (v.excitement === 'high' ? 200 : 0))) + 1;
          return `📸 SCND_UNIT Drop #${dropNumber}\n\n${p.name}\nCondition: 9/10${opts.includeSize ? `\nSize: ${p.size} - true to size` : ''}\n\nMeasurements upon request 📏\n\nLink in Bio 🔗`;
        },
        emotional: (p, opts, v) => {
          const urgencyWords = v.excitement === 'high' ? '🚨 URGENT 🚨' : v.excitement === 'medium' ? '🔥 JUST LANDED 🔥' : '✨ NEW ARRIVAL ✨';
          return `${urgencyWords}\n\n${p.brand} ${p.name} - The perfect piece${v.excitement === 'high' ? ' for this season 🤌' : ''}\n\n${opts.includePrice ? `💸 ${p.price}` : ''}\n\n${v.excitement === 'high' ? 'Be quick!' : 'Check it out!'} ⬆️`;
        },
        'hashtag-heavy': (p, opts, v) => {
          const baseHashtags = ['vintage', 'secondhand', 'streetwear', p.brand?.toLowerCase(), 'scndunit'];
          const randomHashtags = v.excitement === 'high' ? ['90sfashion', '2000sfashion', 'rarefind', 'thrifted', 'vintagefashion'] : ['clothing', 'thrift'];
          const allHashtags = [...baseHashtags, ...randomHashtags].filter(Boolean);
          return `NEW DROP 🔥\n\n${p.brand} ${p.name} ${opts.includeSize ? p.size : ''}\n\n${allHashtags.map(t => `#${t.toLowerCase().replace(/\s/g, '')}`).join(' ')}`;
        }
      },
      'de-mixed': {
        storytelling: (p, opts, v) => {
          const emojis = v.emojiChance > Math.random() ? ['✨', '🌟', '💫', '⭐'][Math.floor(Math.random() * 4)] : '';
          const linebreaks = v.linebreakChance > Math.random() ? '\n\n' : '\n';
          return `${emojis} Found this gem beim Stöbern ${emojis}${linebreaks}This rare piece hat eine Geschichte zu erzählen. Von einem closet zum nächsten - giving fashion a second life.${linebreaks}${opts.includeBrand ? `🏷️ Brand: ${p.brand}` : ''}${opts.includeSize ? `\n📏 Size: ${p.size}` : ''}${opts.includePrice ? `\n💰 Price: ${p.price}` : ''}${linebreaks}What's eure beste Thrift-Findung? 👇`;
        },
        technical: (p, opts, v) => {
          const dropNumber = Math.floor(Math.random() * (100 + (v.excitement === 'high' ? 200 : 0))) + 1;
          return `📸 SCND_UNIT Drop #${dropNumber}\n\n${p.name}\nCondition: 9/10 (leichte Gebrauchsspuren)${opts.includeSize ? `\nSize: ${p.size} - true to size` : ''}\n\nMeasurements auf Anfrage 📏\n\nLink in Bio 🔗`;
        },
        emotional: (p, opts, v) => {
          const urgencyWords = v.excitement === 'high' ? '🚨 URGENT 🚨' : v.excitement === 'medium' ? '🔥 JUST LANDED 🔥' : '✨ NEW ARRIVAL ✨';
          return `${urgencyWords}\n\n${p.brand} ${p.name} - Das perfekte piece${v.excitement === 'high' ? ' for this season 🤌' : ''}\n\n${opts.includePrice ? `💸 ${p.price}` : ''}\n\n${v.excitement === 'high' ? 'Schnell sein pays off!' : 'Check it out!'} ⬆️`;
        },
        'hashtag-heavy': (p, opts, v) => {
          const baseHashtags = ['vintage', 'secondhand', 'streetwear', p.brand?.toLowerCase(), 'scndunit'];
          const randomHashtags = v.excitement === 'high' ? ['90sfashion', '2000sfashion', 'rarefind', 'thrifted', 'vintagefashion'] : ['kleidung', 'thrifting'];
          const allHashtags = [...baseHashtags, ...randomHashtags].filter(Boolean);
          return `NEU IM SHOP 🔥\n\n${p.brand} ${p.name} ${opts.includeSize ? p.size : ''}\n\n${allHashtags.map(t => `#${t.toLowerCase().replace(/\s/g, '')}`).join(' ')}`;
        }
      }
    };
    
    const generator = captions[language]?.[style];
    if (!generator) {
      return { caption: 'Fehler: Keine Caption generiert', hashtags: ['#scndunit'] };
    }
    
    const caption = generator(product, options, varianceMod);
    const hashtags = ['scndunit', product.brand?.toLowerCase(), 'vintage', 'streetwear'].filter(Boolean).map(t => `#${t}`);
    
    return { caption, hashtags };
  }, []);

  // Post generieren
  const generatePost = async () => {
    if (selectedProducts.length === 0 && postType !== 'collection') {
      toast('Bitte wähle mindestens ein Produkt aus', 'error');
      return;
    }

    setIsGenerating(true);
    
    try {
      const product = selectedProducts[0];
      const { caption, hashtags: newHashtags } = generateCaption(
        product, 
        config.language, 
        config.captionStyle,
        { includePrice: config.includePrice, includeSize: config.includeSize, includeBrand: config.includeBrand },
        config.variance
      );
      
      setEditableCaption(caption);
      setEditableHashtags(newHashtags);
      
      // History speichern
      setCaptionHistory([caption]);
      setHistoryIndex(0);
      
      setGeneratedPost({
        id: Date.now().toString(),
        imageUrl: '',
        caption: caption,
        hashtags: newHashtags,
        platforms: ['instagram', 'tiktok']
      });
      
      toast('Post erfolgreich generiert!', 'success');
    } catch (error) {
      toast('Fehler bei Generierung', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // Caption Änderungen speichern (für Lernfähigkeit)
  const handleCaptionChange = (newCaption: string) => {
    setEditableCaption(newCaption);
    if (generatedPost) {
      setGeneratedPost({ ...generatedPost, caption: newCaption });
    }
  };

  const handleHashtagsChange = (newHashtags: string[]) => {
    setEditableHashtags(newHashtags);
    if (generatedPost) {
      setGeneratedPost({ ...generatedPost, hashtags: newHashtags });
    }
  };

  // Feedback für zukünftige Generierungen
  const handleFeedback = (type: 'positive' | 'negative') => {
    if (type === 'positive') {
      toast('Danke! Das hilft uns bessere Captions zu generieren.', 'success');
      // Hier würde das positive Feedback in der DB gespeichert
    } else {
      toast('Danke für das Feedback! Wir optimieren die Generierung.', 'info');
      // Hier würde das negative Feedback in der DB gespeichert
    }
  };

  // Template speichern
  const handleSaveTemplate = () => {
    const template = {
      id: Date.now(),
      name: `Template ${savedTemplates.length + 1}`,
      caption: editableCaption,
      hashtags: editableHashtags,
      language: config.language,
      style: config.captionStyle,
      createdAt: new Date()
    };
    setSavedTemplates([...savedTemplates, template]);
    toast('Template gespeichert!', 'success');
  };

  // Neu generieren
  const handleRegenerate = () => {
    if (selectedProducts.length > 0) {
      generatePost();
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#FF4400]/20 pb-4">
        <button
          onClick={() => setActiveTab('generator')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
            activeTab === 'generator' 
              ? 'bg-[#FF4400] text-white' 
              : 'text-gray-400 hover:text-[#FF4400]'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Post Generator
        </button>
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
            activeTab === 'scheduler' 
              ? 'bg-[#FF4400] text-white' 
              : 'text-gray-400 hover:text-[#FF4400]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Scheduler
        </button>
        <button
          onClick={() => setActiveTab('brand')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
            activeTab === 'brand' 
              ? 'bg-[#FF4400] text-white' 
              : 'text-gray-400 hover:text-[#FF4400]'
          }`}
        >
          <Palette className="w-4 h-4" />
          Brand Assets
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
            activeTab === 'history' 
              ? 'bg-[#FF4400] text-white' 
              : 'text-gray-400 hover:text-[#FF4400]'
          }`}
        >
          <Clock className="w-4 h-4" />
          Verlauf
        </button>
      </div>

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Linke Seite: Konfiguration */}
          <div className="space-y-6">
            {/* Post Typ */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                Post Typ
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'single', name: 'Einzelprodukt', icon: <ImagePlus className="w-4 h-4" /> },
                  { id: 'collage', name: 'Collage', icon: <LayoutGrid className="w-4 h-4" /> },
                  { id: 'collection', name: 'Collection', icon: <Layers className="w-4 h-4" /> },
                  { id: 'lookbook', name: 'Lookbook', icon: <ShoppingBag className="w-4 h-4" /> }
                ].map(type => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setPostType(type.id as any);
                      setSelectedProducts([]);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                      postType === type.id
                        ? 'bg-[#FF4400] text-white'
                        : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'
                    }`}
                  >
                    {type.icon}
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Produktauswahl */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                {postType === 'single' ? 'Produkt' : 'Produkte'} auswählen
              </label>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {selectedProducts.length === 0 ? (
                    <span className="text-gray-500 text-sm">Keine Produkte ausgewählt</span>
                  ) : (
                    selectedProducts.map(p => (
                      <span key={p.id} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded">
                        {p.name}
                        <button 
                          onClick={() => setSelectedProducts(prev => prev.filter(prod => prod.id !== p.id))}
                          className="ml-1 hover:text-white"
                        >
                          <X className="w-3 h-3 inline" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowProductSelector(true)}
                  className="px-3 py-1 bg-[#1A1A1A] border border-[#FF4400]/30 text-[#FF4400] rounded text-sm hover:bg-[#FF4400]/10"
                >
                  Auswählen
                </button>
              </div>
            </div>

            {/* Template & Design */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                Template / Design
              </label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries({
                  minimal: { name: 'Minimal', icon: '✨' },
                  editorial: { name: 'Editorial', icon: '📸' },
                  bold: { name: 'Bold', icon: '⚡' },
                  vintage: { name: 'Vintage', icon: '📻' },
                  streetwear: { name: 'Streetwear', icon: '🛹' }
                }).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setConfig(prev => ({ ...prev, template: key }))}
                    className={`px-3 py-2 rounded-lg text-sm transition-all ${
                      config.template === key
                        ? 'bg-[#FF4400] text-white'
                        : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{value.icon}</span>
                      <span>{value.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sprache & Stil */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                Sprache & Stil
              </label>
              
              <div className="mb-4">
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, language: 'de' }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      config.language === 'de' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'
                    }`}
                  >
                    <Languages className="w-4 h-4" />
                    Deutsch
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, language: 'en' }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      config.language === 'en' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'
                    }`}
                  >
                    <Globe className="w-4 h-4" />
                    English
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, language: 'de-mixed' }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      config.language === 'de-mixed' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'
                    }`}
                  >
                    <Languages className="w-4 h-4" />
                    Deutsch + English
                  </button>
                </div>
                <p className="text-xs text-gray-500">Deutsch + English: Moderne Mischung aus Deutsch mit englischen Keywords</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  storytelling: { name: 'Storytelling', icon: '📖', example: 'Found this gem while thrifting...' },
                  technical: { name: 'Technisch', icon: '📏', example: 'Condition 9/10, True to size...' },
                  emotional: { name: 'Emotional/FOMO', icon: '🔥', example: 'Won\'t last long! Must-have...' },
                  'hashtag-heavy': { name: 'Hashtag-lastig', icon: '#️⃣', example: '#vintage #streetwear #scndunit' }
                }).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => setConfig(prev => ({ ...prev, captionStyle: key as any }))}
                    className={`p-2 rounded-lg text-left text-sm transition-all ${
                      config.captionStyle === key
                        ? 'bg-[#FF4400]/20 border border-[#FF4400]'
                        : 'bg-[#1A1A1A] border border-transparent hover:border-[#FF4400]/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{value.icon}</span>
                      <span className="font-medium">{value.name}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1 truncate">{value.example}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Optionen & Varianz */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                Optionen & Varianz
              </label>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={config.includePrice}
                    onChange={e => setConfig(prev => ({ ...prev, includePrice: e.target.checked }))}
                    className="rounded border-[#FF4400]/30"
                  />
                  Preis anzeigen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={config.includeSize}
                    onChange={e => setConfig(prev => ({ ...prev, includeSize: e.target.checked }))}
                    className="rounded border-[#FF4400]/30"
                  />
                  Größe anzeigen
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={config.includeBrand}
                    onChange={e => setConfig(prev => ({ ...prev, includeBrand: e.target.checked }))}
                    className="rounded border-[#FF4400]/30"
                  />
                  Marke anzeigen
                </label>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Varianz (Kreativität)</span>
                  <span className="text-[#FF4400]">{config.variance}/10</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={config.variance}
                  onChange={e => setConfig(prev => ({ ...prev, variance: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#FF4400]"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Niedrig = konsistente Posts | Hoch = kreative, einzigartige Posts
                </p>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePost}
              disabled={isGenerating || (selectedProducts.length === 0 && postType !== 'collection')}
              className="w-full py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest rounded-lg hover:bg-[#FF4400]/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isGenerating ? 'Generiere Post...' : 'Post Generieren'}
            </button>
          </div>

          {/* Rechte Seite: Preview & Editor */}
          <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden sticky top-20">
            <div className="p-4 border-b border-[#FF4400]/20 flex justify-between items-center">
              <h3 className="font-bold">Post Editor</h3>
              <div className="flex gap-2">
                <button className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#FF4400]/10">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Phone Mockup + Caption Editor */}
            <div className="p-4 space-y-4">
              {/* Phone Mockup Preview */}
              <div className="flex justify-center">
                <div className="w-[280px] bg-black rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-3 pt-2 pb-1 flex justify-between text-xs text-gray-400">
                    <span>9:41</span>
                    <span>📶 🔋</span>
                  </div>
                  <div className="px-3 py-1 flex items-center gap-2">
                    <div className="w-6 h-6 bg-[#FF4400] rounded-full flex items-center justify-center text-white text-[10px] font-bold">S</div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">scnd_unit</p>
                    </div>
                  </div>
                  <div className="aspect-square bg-gradient-to-br from-[#FF4400]/20 to-black flex items-center justify-center">
                    {selectedProducts.length > 0 ? (
                      <div className="text-center p-4">
                        <div className="text-xs text-gray-400">Preview Image</div>
                        <p className="text-[#FF4400] text-xs font-bold mt-2">SCND_UNIT</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">Kein Produkt</p>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex gap-3 mb-2">
                      <Heart className="w-4 h-4 text-gray-400" />
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      <Share2 className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-xs font-bold mb-1">scnd_unit</p>
                    <p className="text-[11px] whitespace-pre-wrap line-clamp-4">
                      {editableCaption.substring(0, 120)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Caption Editor Component */}
              {generatedPost && (
                <CaptionEditor
                  caption={editableCaption}
                  hashtags={editableHashtags}
                  onCaptionChange={handleCaptionChange}
                  onHashtagsChange={handleHashtagsChange}
                  onSaveTemplate={handleSaveTemplate}
                  onFeedback={handleFeedback}
                  onRegenerate={handleRegenerate}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#FF4400]/20">
              <h3 className="text-lg font-bold">Produkte auswählen</h3>
              <button onClick={() => setShowProductSelector(false)} className="p-1 hover:bg-[#FF4400]/10 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableProducts.map(product => (
                  <div 
                    key={product.id}
                    onClick={() => {
                      if (postType === 'single') {
                        setSelectedProducts([product]);
                        setShowProductSelector(false);
                      } else {
                        setSelectedProducts(prev => 
                          prev.find(p => p.id === product.id)
                            ? prev.filter(p => p.id !== product.id)
                            : [...prev, product]
                        );
                      }
                    }}
                    className={`relative border rounded-lg p-2 cursor-pointer transition-all ${
                      selectedProducts.find(p => p.id === product.id)
                        ? 'border-[#FF4400] bg-[#FF4400]/10'
                        : 'border-gray-700 hover:border-[#FF4400]/50'
                    }`}
                  >
                    <div className="aspect-square bg-[#1A1A1A] rounded overflow-hidden">
                      <img 
                        src={product.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(product.images[0])}` : ''}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-xs font-bold mt-1 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.brand} · {product.price}</p>
                    {selectedProducts.find(p => p.id === product.id) && (
                      <div className="absolute top-2 right-2 bg-[#FF4400] rounded-full w-5 h-5 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-[#FF4400]/20 flex justify-between">
              <span className="text-sm text-gray-400">
                {selectedProducts.length} Produkte ausgewählt
              </span>
              <button 
                onClick={() => setShowProductSelector(false)}
                className="px-4 py-2 bg-[#FF4400] text-white rounded font-bold"
              >
                Übernehmen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Check Component
const Check = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);
