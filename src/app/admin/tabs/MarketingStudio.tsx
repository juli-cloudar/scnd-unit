'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, Instagram, Facebook, Globe, 
  RefreshCw, Calendar, Send, Copy, Check, ImagePlus, 
  LayoutGrid, Layers, Wand2, Settings, ChevronLeft, ChevronRight,
  Heart, MessageCircle, Share2, Bookmark, Plus, X, Trash2,
  Languages, Palette, Grid3x3, Grid4x4, 
  Newspaper, ShoppingBag, TrendingUp, Clock, Star, Zap,
  AlertCircle, Upload, Save, Eye, EyeOff, Sliders, Edit3,
  ThumbsUp, ThumbsDown, RotateCcw, FileText, BookOpen,
  Bold, Italic, AlignLeft, Quote
} from 'lucide-react';

// Pinterest Icon (da lucide-react kein Pinterest hat)
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.23 2.65 7.86 6.35 9.31-.08-.79-.16-2 .03-2.86.18-.78 1.15-4.87 1.15-4.87s-.29-.58-.29-1.44c0-1.35.78-2.36 1.76-2.36.83 0 1.23.62 1.23 1.36 0 .83-.53 2.07-.8 3.22-.23.96.48 1.75 1.43 1.75 1.71 0 3.03-1.8 3.03-4.4 0-2.3-1.65-3.91-4.01-3.91-2.73 0-4.33 2.05-4.33 4.17 0 .82.32 1.71.72 2.19.08.09.08.18.04.27-.07.31-.24.98-.27 1.12-.04.18-.14.22-.33.13-1.23-.57-2-2.36-2-3.8 0-3.09 2.24-5.93 6.48-5.93 3.4 0 6.04 2.42 6.04 5.66 0 3.38-2.13 6.1-5.09 6.1-.99 0-1.92-.52-2.24-1.13 0 0-.49 1.86-.61 2.32-.22.86-.81 1.73-1.31 2.38.99.3 2.03.46 3.1.46 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
  </svg>
);

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

  const insertFormatting = (type: 'bold' | 'italic' | 'emoji' | 'linebreak' | 'quote') => {
    const textarea = document.getElementById('caption-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = caption.substring(start, end);
    
    let insertText = '';
    switch(type) {
      case 'bold': insertText = `*${selectedText || 'Text'}*`; break;
      case 'italic': insertText = `_${selectedText || 'Text'}_`; break;
      case 'emoji': insertText = selectedText || '✨'; break;
      case 'linebreak': insertText = '\n\n'; break;
      case 'quote': insertText = `"${selectedText || 'Quote'}"`; break;
    }
    
    const newText = caption.substring(0, start) + insertText + caption.substring(end);
    onCaptionChange(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + insertText.length, start + insertText.length);
    }, 10);
  };

  const getTextStats = () => {
    const chars = caption.length;
    const words = caption.split(/\s+/).filter(w => w.length > 0).length;
    const lines = caption.split('\n').length;
    return { chars, words, lines };
  };

  const stats = getTextStats();
  const suggestedHashtags = ['#vintage', '#streetwear', '#scndunit', '#secondhand', '#thrifted', '#vintagefashion'];

  return (
    <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden">
      <div className="flex border-b border-[#FF4400]/20">
        <button onClick={() => setActiveTab('edit')} className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${activeTab === 'edit' ? 'bg-[#FF4400]/10 text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>
          <Edit3 className="w-4 h-4" /> Bearbeiten
        </button>
        <button onClick={() => setActiveTab('preview')} className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${activeTab === 'preview' ? 'bg-[#FF4400]/10 text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>
          <Eye className="w-4 h-4" /> Vorschau
        </button>
        <button onClick={() => setActiveTab('templates')} className={`flex items-center gap-2 px-4 py-3 text-sm transition-all ${activeTab === 'templates' ? 'bg-[#FF4400]/10 text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>
          <BookOpen className="w-4 h-4" /> Templates
        </button>
      </div>

      {activeTab === 'edit' && (
        <div className="p-4">
          <div className="flex flex-wrap gap-1 mb-3 pb-3 border-b border-gray-800">
            <button onClick={() => insertFormatting('bold')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Fett"><Bold className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormatting('italic')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Kursiv"><Italic className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button onClick={() => insertFormatting('emoji')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Emoji"><span className="text-sm">😊</span></button>
            <button onClick={() => insertFormatting('linebreak')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Zeilenumbruch"><AlignLeft className="w-3.5 h-3.5" /></button>
            <button onClick={() => insertFormatting('quote')} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Anführungszeichen"><Quote className="w-3.5 h-3.5" /></button>
            <div className="w-px h-4 bg-gray-700 mx-1" />
            <button onClick={onRegenerate} className="p-1.5 hover:bg-[#FF4400]/10 rounded text-[#FF4400]" title="Neu generieren"><RotateCcw className="w-3.5 h-3.5" /></button>
          </div>

          <textarea id="caption-textarea" value={caption} onChange={(e) => onCaptionChange(e.target.value)} className="w-full h-48 bg-[#1A1A1A] border border-[#FF4400]/20 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#FF4400]" placeholder="Deine Caption..." />

          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <div className="flex gap-3"><span>📝 {stats.chars} Zeichen</span><span>📖 {stats.words} Wörter</span><span>📏 {stats.lines} Zeilen</span></div>
            <button onClick={() => { navigator.clipboard.writeText(caption); }} className="hover:text-[#FF4400]"><Copy className="w-3 h-3" /></button>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <label className="text-xs text-gray-400 uppercase tracking-wider block mb-2">Hashtags ({hashtags.length})</label>
            <div className="flex flex-wrap gap-2 mb-3">{hashtags.map(tag => (<span key={tag} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded-full flex items-center gap-1">{tag}<button onClick={() => removeHashtag(tag)}><X className="w-3 h-3" /></button></span>))}</div>
            <div className="flex gap-2"><input type="text" value={hashtagInput} onChange={(e) => setHashtagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addHashtag(hashtagInput)} placeholder="Neuen Hashtag" className="flex-1 bg-[#1A1A1A] border border-[#FF4400]/20 rounded px-3 py-2 text-sm" /><button onClick={() => addHashtag(hashtagInput)} className="px-3 py-2 bg-[#FF4400] text-white rounded text-sm"><Plus className="w-4 h-4" /></button></div>
            <div className="mt-3"><p className="text-xs text-gray-500 mb-2">Vorschläge:</p><div className="flex flex-wrap gap-1">{suggestedHashtags.filter(t => !hashtags.includes(t)).slice(0, 6).map(tag => (<button key={tag} onClick={() => addHashtag(tag)} className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full hover:bg-[#FF4400]/20">+ {tag}</button>))}</div></div>
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
            <button onClick={onSaveTemplate} className="flex-1 py-2 bg-[#1A1A1A] border border-[#FF4400]/30 text-gray-300 rounded-lg text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Als Template speichern</button>
            <button onClick={() => onFeedback('positive')} className="py-2 px-4 bg-green-600/20 border border-green-600/30 text-green-400 rounded-lg text-sm flex items-center gap-2"><ThumbsUp className="w-4 h-4" /> Gut</button>
            <button onClick={() => onFeedback('negative')} className="py-2 px-4 bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg text-sm flex items-center gap-2"><ThumbsDown className="w-4 h-4" /> Schlecht</button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="p-4">
          <div className="bg-[#0A0A0A] rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3"><div className="w-8 h-8 bg-[#FF4400] rounded-full flex items-center justify-center text-white text-xs font-bold">S</div><div><p className="text-sm font-bold">scnd_unit</p><p className="text-xs text-gray-500">Curated Vintage</p></div></div>
            <div className="whitespace-pre-wrap text-sm">{caption.split('\n').map((line, i) => (<p key={i} className="mb-1">{line.split(/(#[^\s#]+)/g).map((part, j) => part.startsWith('#') ? <span key={j} className="text-[#FF4400]">{part}</span> : <span key={j}>{part}</span>)}</p>))}</div>
            <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-800">{hashtags.map(tag => (<span key={tag} className="text-xs text-[#FF4400]">{tag}</span>))}</div>
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <div className="p-4 text-center text-gray-500 text-sm py-8">
          <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          Keine Templates gespeichert.<br />Bearbeite eine Caption und klicke auf "Als Template speichern".
        </div>
      )}
    </div>
  );
}

// ============================================================
// HAUPT-COMPONENT
// ============================================================
export function MarketingStudio({ products: externalProducts, toast }: { products?: Product[]; toast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [products, setProducts] = useState<Product[]>(externalProducts || []);
  const [loading, setLoading] = useState(!externalProducts);
  const [activeTab, setActiveTab] = useState<'generator' | 'scheduler' | 'brand' | 'history'>('generator');
  const [postType, setPostType] = useState<'single' | 'collage' | 'collection' | 'lookbook'>('single');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState<PostConfig>({
    type: 'single', products: [], template: 'streetwear', language: 'de-mixed',
    captionStyle: 'storytelling', includePrice: true, includeSize: true, includeBrand: true, variance: 5
  });
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [editableCaption, setEditableCaption] = useState('');
  const [editableHashtags, setEditableHashtags] = useState<string[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!externalProducts && !products.length) {
      fetch('/api/products').then(res => res.json()).then(data => { setProducts(data); setLoading(false); });
    }
  }, [externalProducts]);

  const availableProducts = products.filter(p => !p.sold);

  const generateCaption = (product: Product, language: string, style: string, options: any, variance: number): { caption: string; hashtags: string[] } => {
    const getUrgency = (v: number) => v >= 7 ? '🚨 URGENT 🚨' : v >= 4 ? '🔥 JUST LANDED 🔥' : '✨ NEW ARRIVAL ✨';
    const urgency = getUrgency(variance);
    
    const captions: Record<string, Record<string, string>> = {
      de: {
        storytelling: `✨ Gefunden beim Stöbern ✨\n\nDieses Piece hat eine Geschichte zu erzählen. Von einem Kleiderschrank zum nächsten - wir geben Fashion ein zweites Leben.\n\n${options.includeBrand ? `🏷️ Marke: ${product.brand}` : ''}${options.includeSize ? `\n📏 Größe: ${product.size}` : ''}${options.includePrice ? `\n💰 Preis: ${product.price}` : ''}\n\nWas ist eure beste Thrift-Findung? 👇`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 100) + 1}\n\n${product.name}\nZustand: 9/10${options.includeSize ? `\nGröße: ${product.size} - true to size` : ''}\n\nMaße auf Anfrage 📏\n\nLink in Bio 🔗`,
        emotional: `${urgency}\n\n${product.brand} ${product.name} - Das perfekte Piece${variance >= 7 ? ' für diese Season 🤌' : ''}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${variance >= 7 ? 'Schnell sein lohnt sich!' : 'Schau vorbei!'} ⬆️`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${product.brand} ${product.name} ${options.includeSize ? product.size : ''}\n\n#vintage #secondhand #streetwear #${product.brand?.toLowerCase()} #scndunit #vintagefashion #thrifted`
      },
      en: {
        storytelling: `✨ Found this gem while thrifting ✨\n\nThis rare piece tells a story. From someone's closet to yours - giving fashion a second life.\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\nWhat's your best thrift find? 👇`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 100) + 1}\n\n${product.name}\nCondition: 9/10${options.includeSize ? `\nSize: ${product.size} - true to size` : ''}\n\nMeasurements upon request 📏\n\nLink in Bio 🔗`,
        emotional: `${urgency}\n\n${product.brand} ${product.name} - The perfect piece${variance >= 7 ? ' for this season 🤌' : ''}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${variance >= 7 ? 'Be quick!' : 'Check it out!'} ⬆️`,
        'hashtag-heavy': `NEW DROP 🔥\n\n${product.brand} ${product.name} ${options.includeSize ? product.size : ''}\n\n#vintage #secondhand #streetwear #${product.brand?.toLowerCase()} #scndunit #vintagefashion #thrifted`
      },
      'de-mixed': {
        storytelling: `✨ Found this gem beim Stöbern ✨\n\nThis rare piece hat eine Geschichte zu erzählen. Von einem closet zum nächsten - giving fashion a second life.\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\nWhat's eure beste Thrift-Findung? 👇`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 100) + 1}\n\n${product.name}\nCondition: 9/10 (leichte Gebrauchsspuren)${options.includeSize ? `\nSize: ${product.size} - true to size` : ''}\n\nMeasurements auf Anfrage 📏\n\nLink in Bio 🔗`,
        emotional: `${urgency}\n\n${product.brand} ${product.name} - Das perfekte piece${variance >= 7 ? ' for this season 🤌' : ''}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${variance >= 7 ? 'Schnell sein pays off!' : 'Check it out!'} ⬆️`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${product.brand} ${product.name} ${options.includeSize ? product.size : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion #thrifted`
      }
    };
    
    const caption = captions[language]?.[style] || captions['de']['storytelling'];
    const hashtags = ['#scndunit', '#vintage', '#streetwear', product.brand ? `#${product.brand.toLowerCase().replace(/\s/g, '')}` : ''].filter(Boolean);
    
    return { caption, hashtags };
  };

  const generatePost = async () => {
    if (selectedProducts.length === 0 && postType !== 'collection') {
      toast('Bitte wähle mindestens ein Produkt aus', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const product = selectedProducts[0];
      const { caption, hashtags: newHashtags } = generateCaption(product, config.language, config.captionStyle, 
        { includePrice: config.includePrice, includeSize: config.includeSize, includeBrand: config.includeBrand }, config.variance);
      setEditableCaption(caption);
      setEditableHashtags(newHashtags);
      setGeneratedPost({ id: Date.now().toString(), imageUrl: '', caption, hashtags: newHashtags, platforms: ['instagram', 'tiktok'] });
      toast('Post erfolgreich generiert!', 'success');
    } catch (error) {
      toast('Fehler bei Generierung', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCaptionChange = (newCaption: string) => { setEditableCaption(newCaption); if (generatedPost) setGeneratedPost({ ...generatedPost, caption: newCaption }); };
  const handleHashtagsChange = (newHashtags: string[]) => { setEditableHashtags(newHashtags); if (generatedPost) setGeneratedPost({ ...generatedPost, hashtags: newHashtags }); };
  const handleFeedback = (type: 'positive' | 'negative') => toast(type === 'positive' ? 'Danke für das positive Feedback!' : 'Danke, wir optimieren die Generierung.', 'info');
  const handleSaveTemplate = () => { setSavedTemplates([...savedTemplates, { id: Date.now(), caption: editableCaption, hashtags: editableHashtags }]); toast('Template gespeichert!', 'success'); };
  const handleRegenerate = () => { if (selectedProducts.length > 0) generatePost(); };

  if (loading) return <div className="text-center py-20 text-gray-500">Lade Produkte...</div>;

  const ProductSelectorModal = () => (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#FF4400]/20"><h3 className="text-lg font-bold">Produkte auswählen</h3><button onClick={() => setShowProductSelector(false)} className="p-1 hover:bg-[#FF4400]/10 rounded"><X className="w-5 h-5" /></button></div>
        <div className="flex-1 overflow-y-auto p-4"><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{availableProducts.map(product => (<div key={product.id} onClick={() => { if (postType === 'single') { setSelectedProducts([product]); setShowProductSelector(false); } else { setSelectedProducts(prev => prev.find(p => p.id === product.id) ? prev.filter(p => p.id !== product.id) : [...prev, product]); } }} className={`relative border rounded-lg p-2 cursor-pointer transition-all ${selectedProducts.find(p => p.id === product.id) ? 'border-[#FF4400] bg-[#FF4400]/10' : 'border-gray-700 hover:border-[#FF4400]/50'}`}><div className="aspect-square bg-[#1A1A1A] rounded overflow-hidden"><img src={product.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(product.images[0])}` : ''} alt={product.name} className="w-full h-full object-cover" /></div><p className="text-xs font-bold mt-1 truncate">{product.name}</p><p className="text-[10px] text-gray-400">{product.brand} · {product.price}</p>{selectedProducts.find(p => p.id === product.id) && <div className="absolute top-2 right-2 bg-[#FF4400] rounded-full w-5 h-5 flex items-center justify-center"><Check className="w-3 h-3" /></div>}</div>))}</div></div>
        <div className="p-4 border-t border-[#FF4400]/20 flex justify-between"><span className="text-sm text-gray-400">{selectedProducts.length} Produkte ausgewählt</span><button onClick={() => setShowProductSelector(false)} className="px-4 py-2 bg-[#FF4400] text-white rounded font-bold">Übernehmen</button></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-[#FF4400]/20 pb-4">
        <button onClick={() => setActiveTab('generator')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'generator' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Wand2 className="w-4 h-4" />Post Generator</button>
        <button onClick={() => setActiveTab('scheduler')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'scheduler' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Calendar className="w-4 h-4" />Scheduler</button>
        <button onClick={() => setActiveTab('brand')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'brand' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Palette className="w-4 h-4" />Brand Assets</button>
        <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'history' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Clock className="w-4 h-4" />Verlauf</button>
      </div>

      {activeTab === 'generator' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Post Typ</label>
              <div className="flex gap-2 flex-wrap">{[
                { id: 'single', name: 'Einzelprodukt', icon: <ImagePlus className="w-4 h-4" /> },
                { id: 'collage', name: 'Collage', icon: <LayoutGrid className="w-4 h-4" /> },
                { id: 'collection', name: 'Collection', icon: <Layers className="w-4 h-4" /> },
                { id: 'lookbook', name: 'Lookbook', icon: <ShoppingBag className="w-4 h-4" /> }
              ].map(type => (<button key={type.id} onClick={() => { setPostType(type.id as any); setSelectedProducts([]); }} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${postType === type.id ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}>{type.icon}{type.name}</button>))}</div>
            </div>

            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">{postType === 'single' ? 'Produkt' : 'Produkte'} auswählen</label>
              <div className="flex items-center justify-between"><div className="flex gap-2 flex-wrap">{selectedProducts.length === 0 ? <span className="text-gray-500 text-sm">Keine Produkte ausgewählt</span> : selectedProducts.map(p => (<span key={p.id} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded">{p.name}<button onClick={() => setSelectedProducts(prev => prev.filter(prod => prod.id !== p.id))} className="ml-1 hover:text-white"><X className="w-3 h-3 inline" /></button></span>))}</div><button onClick={() => setShowProductSelector(true)} className="px-3 py-1 bg-[#1A1A1A] border border-[#FF4400]/30 text-[#FF4400] rounded text-sm hover:bg-[#FF4400]/10">Auswählen</button></div>
            </div>

            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Template / Design</label>
              <div className="grid grid-cols-3 gap-2">{Object.entries({ minimal: { name: 'Minimal', icon: '✨' }, editorial: { name: 'Editorial', icon: '📸' }, bold: { name: 'Bold', icon: '⚡' }, vintage: { name: 'Vintage', icon: '📻' }, streetwear: { name: 'Streetwear', icon: '🛹' } }).map(([key, value]) => (<button key={key} onClick={() => setConfig(prev => ({ ...prev, template: key }))} className={`px-3 py-2 rounded-lg text-sm transition-all ${config.template === key ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}><div className="flex items-center justify-center gap-1"><span>{value.icon}</span><span>{value.name}</span></div></button>))}</div>
            </div>

            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Sprache & Stil</label>
              <div className="mb-4"><div className="flex gap-2 mb-3"><button onClick={() => setConfig(prev => ({ ...prev, language: 'de' }))} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${config.language === 'de' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}><Languages className="w-4 h-4" />Deutsch</button><button onClick={() => setConfig(prev => ({ ...prev, language: 'en' }))} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${config.language === 'en' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}><Globe className="w-4 h-4" />English</button><button onClick={() => setConfig(prev => ({ ...prev, language: 'de-mixed' }))} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${config.language === 'de-mixed' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}><Languages className="w-4 h-4" />Deutsch + English</button></div><p className="text-xs text-gray-500">Deutsch + English: Moderne Mischung aus Deutsch mit englischen Keywords</p></div>
              <div className="grid grid-cols-2 gap-2">{Object.entries({ storytelling: { name: 'Storytelling', icon: '📖' }, technical: { name: 'Technisch', icon: '📏' }, emotional: { name: 'Emotional/FOMO', icon: '🔥' }, 'hashtag-heavy': { name: 'Hashtag-lastig', icon: '#️⃣' } }).map(([key, value]) => (<button key={key} onClick={() => setConfig(prev => ({ ...prev, captionStyle: key as any }))} className={`p-2 rounded-lg text-left text-sm transition-all ${config.captionStyle === key ? 'bg-[#FF4400]/20 border border-[#FF4400]' : 'bg-[#1A1A1A] border border-transparent hover:border-[#FF4400]/50'}`}><div className="flex items-center gap-2"><span>{value.icon}</span><span className="font-medium">{value.name}</span></div></button>))}</div>
            </div>

            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Optionen & Varianz</label>
              <div className="flex flex-wrap gap-3 mb-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.includePrice} onChange={e => setConfig(prev => ({ ...prev, includePrice: e.target.checked }))} className="rounded border-[#FF4400]/30" />Preis anzeigen</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.includeSize} onChange={e => setConfig(prev => ({ ...prev, includeSize: e.target.checked }))} className="rounded border-[#FF4400]/30" />Größe anzeigen</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={config.includeBrand} onChange={e => setConfig(prev => ({ ...prev, includeBrand: e.target.checked }))} className="rounded border-[#FF4400]/30" />Marke anzeigen</label></div>
              <div><div className="flex justify-between text-sm mb-2"><span>Varianz (Kreativität)</span><span className="text-[#FF4400]">{config.variance}/10</span></div><input type="range" min={1} max={10} value={config.variance} onChange={e => setConfig(prev => ({ ...prev, variance: parseInt(e.target.value) }))} className="w-full h-2 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-[#FF4400]" /><p className="text-xs text-gray-500 mt-2">Niedrig = konsistente Posts | Hoch = kreative, einzigartige Posts</p></div>
            </div>

            <button onClick={generatePost} disabled={isGenerating || (selectedProducts.length === 0 && postType !== 'collection')} className="w-full py-4 bg-[#FF4400] text-white font-bold uppercase tracking-widest rounded-lg hover:bg-[#FF4400]/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2">{isGenerating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}{isGenerating ? 'Generiere Post...' : 'Post Generieren'}</button>
          </div>

          <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden sticky top-20">
            <div className="p-4 border-b border-[#FF4400]/20 flex justify-between items-center"><h3 className="font-bold">Post Editor</h3><div className="flex gap-2"><button className="p-2 rounded-lg bg-[#1A1A1A] hover:bg-[#FF4400]/10"><Copy className="w-4 h-4" /></button></div></div>
            <div className="p-4 space-y-4">
              <div className="flex justify-center"><div className="w-[280px] bg-black rounded-2xl overflow-hidden shadow-xl"><div className="px-3 pt-2 pb-1 flex justify-between text-xs text-gray-400"><span>9:41</span><span>📶 🔋</span></div><div className="px-3 py-1 flex items-center gap-2"><div className="w-6 h-6 bg-[#FF4400] rounded-full flex items-center justify-center text-white text-[10px] font-bold">S</div><div className="flex-1"><p className="text-xs font-bold">scnd_unit</p></div></div><div className="aspect-square bg-gradient-to-br from-[#FF4400]/20 to-black flex items-center justify-center">{selectedProducts.length > 0 ? (<div className="text-center p-4"><div className="text-xs text-gray-400">Preview Image</div><p className="text-[#FF4400] text-xs font-bold mt-2">SCND_UNIT</p></div>) : (<p className="text-xs text-gray-500">Kein Produkt</p>)}</div><div className="p-3"><div className="flex gap-3 mb-2"><Heart className="w-4 h-4 text-gray-400" /><MessageCircle className="w-4 h-4 text-gray-400" /><Share2 className="w-4 h-4 text-gray-400" /></div><p className="text-xs font-bold mb-1">scnd_unit</p><p className="text-[11px] whitespace-pre-wrap line-clamp-4">{editableCaption.substring(0, 120)}...</p></div></div></div>
              {generatedPost && (<CaptionEditor caption={editableCaption} hashtags={editableHashtags} onCaptionChange={handleCaptionChange} onHashtagsChange={handleHashtagsChange} onSaveTemplate={handleSaveTemplate} onFeedback={handleFeedback} onRegenerate={handleRegenerate} />)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scheduler' && (<div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-8 text-center"><Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-bold mb-2">Post Scheduler</h3><p className="text-gray-400 text-sm">Bald verfügbar: Automatisches Posting auf Instagram, TikTok & mehr.<br />Plane deine Posts für die Woche.</p></div>)}
      {activeTab === 'brand' && (<div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-8 text-center"><Palette className="w-12 h-12 text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-bold mb-2">Brand Assets</h3><p className="text-gray-400 text-sm">Bald verfügbar: Logo, Fonts, Farbpaletten und Watermarks verwalten.</p></div>)}
      {activeTab === 'history' && (<div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-8 text-center"><Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" /><h3 className="text-lg font-bold mb-2">Verlauf</h3><p className="text-gray-400 text-sm">Hier siehst du alle generierten und geposteten Inhalte.</p></div>)}

      {showProductSelector && <ProductSelectorModal />}
    </div>
  );
}
