'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, Instagram, Facebook, Globe, 
  RefreshCw, Calendar, Copy, ImagePlus, 
  LayoutGrid, Layers, Wand2, Heart, MessageCircle, Share2, 
  Bookmark, Plus, X, Trash2, Languages, Palette, 
  ShoppingBag, TrendingUp, Clock, Star, Zap,
  AlertCircle, Upload, Save, Eye, EyeOff, Edit3,
  ThumbsUp, ThumbsDown, RotateCcw, BookOpen,
  Bold, Italic, AlignLeft, Download, Check, Grid
} from 'lucide-react';

interface Product {
  id: number; name: string; brand: string; category: string; price: string;
  size: string; condition: string; images: string[]; vinted_url: string; sold: boolean;
}

interface ScheduledPost {
  id: string;
  title: string;
  caption: string;
  hashtags: string[];
  images: string[];
  scheduledDate: string;
  platform: string;
  status: 'pending' | 'published' | 'failed';
}

// ============================================================
// HAUPT-COMPONENT
// ============================================================
export function MarketingStudio({ products: externalProducts, toast }: { products?: Product[]; toast: (msg: string, type?: 'success' | 'error' | 'info') => void }) {
  const [products, setProducts] = useState<Product[]>(externalProducts || []);
  const [loading, setLoading] = useState(!externalProducts);
  const [activeTab, setActiveTab] = useState<'generator' | 'scheduler' | 'brand' | 'history'>('generator');
  const [postType, setPostType] = useState<'single' | 'collage' | 'collection'>('single');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState({
    template: 'streetwear', language: 'de-mixed', captionStyle: 'storytelling',
    includePrice: true, includeSize: true, includeBrand: true, variance: 8
  });
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [editableCaption, setEditableCaption] = useState('');
  const [editableHashtags, setEditableHashtags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [schedulePlatform, setSchedulePlatform] = useState('instagram');

  // Produkte laden
  useEffect(() => {
    if (!externalProducts && !products.length) {
      fetch('/api/products')
        .then(res => res.json())
        .then(data => { 
          setProducts(data); 
          setLoading(false);
        })
        .catch(err => {
          console.error('Fehler beim Laden:', err);
          setLoading(false);
        });
    }
    // Gespeicherte Posts laden
    const saved = localStorage.getItem('scnd_scheduled_posts');
    if (saved) {
      try {
        setScheduledPosts(JSON.parse(saved));
      } catch(e) {}
    }
  }, [externalProducts]);

  // Verfügbare Produkte (nicht verkauft)
  const availableProducts = products.filter(p => !p.sold);

  // ============================================================
  // CAPTION GENERIEREN
  // ============================================================
  const generateCaption = (products: Product[], language: string, style: string, options: any, variance: number): { caption: string; hashtags: string[] } => {
    const product = products[0];
    const productList = products.map(p => `${p.brand} ${p.name}`).join(' • ');
    
    // Varianz-basierte Textbausteine
    const openers = variance >= 8 ? ['🔥🔥🔥', '🚨 EXKLUSIV 🚨', '✨ DROP DES TAGES ✨'] : 
                    variance >= 5 ? ['✨ Neu eingetroffen', '🔥 Fresh Drop', '💫 Just landed'] :
                    ['Neu im Shop', 'Frisch gelistet'];
    
    const closers = variance >= 8 ? ['⬆️ Jetzt zuschlagen!', '⏰ Nur solange Vorrat reicht'] :
                    variance >= 5 ? ['🔗 Link in Bio', '👀 Vorbeischauen'] :
                    ['Link in Bio', 'Mehr erfahren'];
    
    const randomOpener = openers[Math.floor(Math.random() * openers.length)];
    const randomCloser = closers[Math.floor(Math.random() * closers.length)];
    
    const productMention = postType === 'collage' && products.length > 1 
      ? `Im Drop: ${productList}`
      : `${product.brand} ${product.name}`;
    
    const captions: Record<string, Record<string, string>> = {
      de: {
        storytelling: `${randomOpener}\n\n${productMention}\n\nDieses Piece hat eine Geschichte zu erzählen.\n\n${options.includeBrand ? `🏷️ Marke: ${product.brand}` : ''}${options.includeSize ? `\n📏 Größe: ${product.size}` : ''}${options.includePrice ? `\n💰 Preis: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nZustand: 9/10${options.includeSize ? `\nGröße: ${product.size}` : ''}${options.includePrice ? `\n💰 ${product.price}` : ''}\n\n📏 Maße auf Anfrage\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - ${variance >= 7 ? 'Das Must-Have!' : 'Perfekt für dich'}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion #thrifted #secondhand`
      },
      en: {
        storytelling: `${randomOpener}\n\n${productMention}\n\nThis rare piece tells a story.\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nCondition: 9/10${options.includeSize ? `\nSize: ${product.size}` : ''}${options.includePrice ? `\n💰 ${product.price}` : ''}\n\n📏 Measurements upon request\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - ${variance >= 7 ? 'The must-have!' : 'Perfect for you'}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEW DROP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion #thrifted #secondhand`
      },
      'de-mixed': {
        storytelling: `${randomOpener}\n\n${productMention}\n\nThis rare piece hat eine Geschichte.\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nCondition: 9/10${options.includeSize ? `\nSize: ${product.size}` : ''}${options.includePrice ? `\n💰 ${product.price}` : ''}\n\n📏 Measurements auf Anfrage\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - Das perfekte piece\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion #thrifted`
      }
    };
    
    const caption = captions[language]?.[style] || captions['de']['storytelling'];
    const hashtags = ['#scndunit', '#vintage', '#streetwear', product.brand ? `#${product.brand.toLowerCase().replace(/\s/g, '')}` : '', '#vintagefashion', '#thrifted'].filter(Boolean);
    
    return { caption, hashtags };
  };

  const generatePost = async () => {
    if (selectedProducts.length === 0) {
      toast('Bitte wähle mindestens ein Produkt aus', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const productsToUse = postType === 'collage' ? selectedProducts : [selectedProducts[0]];
      const { caption, hashtags: newHashtags } = generateCaption(productsToUse, config.language, config.captionStyle, 
        { includePrice: config.includePrice, includeSize: config.includeSize, includeBrand: config.includeBrand }, config.variance);
      
      setEditableCaption(caption);
      setEditableHashtags(newHashtags);
      
      // Bilder sammeln
      let images: string[] = [];
      if (postType === 'single' && selectedProducts[0]?.images) {
        images = selectedProducts[0].images.slice(0, 4);
      } else if (postType === 'collage') {
        images = selectedProducts.slice(0, 6).flatMap(p => p.images?.[0] || []).filter(Boolean);
      }
      setSelectedImages(images);
      
      setGeneratedPost({ id: Date.now().toString(), products: productsToUse, caption, hashtags: newHashtags, images });
      toast('Post erfolgreich generiert!', 'success');
    } catch (error) {
      console.error(error);
      toast('Fehler bei Generierung', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadPost = () => {
    if (!generatedPost) return;
    const content = {
      caption: editableCaption,
      hashtags: editableHashtags,
      images: selectedImages,
      products: generatedPost.products.map((p: any) => ({ name: p.name, brand: p.brand, price: p.price, size: p.size })),
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `post_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Post heruntergeladen!', 'success');
  };

  const saveSchedule = () => {
    if (!generatedPost) return;
    if (!scheduleDate) {
      toast('Bitte Datum und Uhrzeit auswählen', 'error');
      return;
    }
    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      title: generatedPost.products[0]?.name || 'Neuer Post',
      caption: editableCaption,
      hashtags: editableHashtags,
      images: selectedImages,
      scheduledDate: scheduleDate,
      platform: schedulePlatform,
      status: 'pending'
    };
    const updated = [...scheduledPosts, newPost];
    setScheduledPosts(updated);
    localStorage.setItem('scnd_scheduled_posts', JSON.stringify(updated));
    setShowScheduleModal(false);
    setScheduleDate('');
    toast('Post wurde geplant!', 'success');
  };

  const deleteScheduledPost = (id: string) => {
    const updated = scheduledPosts.filter(p => p.id !== id);
    setScheduledPosts(updated);
    localStorage.setItem('scnd_scheduled_posts', JSON.stringify(updated));
    toast('Post gelöscht', 'info');
  };

  const copyToClipboard = () => {
    const fullText = `${editableCaption}\n\n${editableHashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    toast('In Zwischenablage kopiert!', 'success');
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Lade Produkte...</div>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#FF4400]/20 pb-4 flex-wrap">
        <button onClick={() => setActiveTab('generator')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'generator' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Wand2 className="w-4 h-4" />Generator</button>
        <button onClick={() => setActiveTab('scheduler')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'scheduler' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Calendar className="w-4 h-4" />Scheduler ({scheduledPosts.length})</button>
        <button onClick={() => setActiveTab('brand')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'brand' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Palette className="w-4 h-4" />Brand Assets</button>
      </div>

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Linke Seite - Konfiguration */}
          <div className="space-y-4">
            {/* Post Typ */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Post Typ</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'single', name: 'Einzelprodukt', icon: <ImagePlus className="w-4 h-4" />, desc: 'Ein Produkt im Fokus' },
                  { id: 'collage', name: 'Collage', icon: <LayoutGrid className="w-4 h-4" />, desc: 'Mehrere Produkte' },
                  { id: 'collection', name: 'Collection', icon: <Layers className="w-4 h-4" />, desc: 'Kategorie / Drop' }
                ].map(type => (
                  <button key={type.id} onClick={() => { setPostType(type.id as any); setSelectedProducts([]); setSelectedImages([]); }} 
                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-sm transition-all ${postType === type.id ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}>
                    {type.icon}
                    <span>{type.name}</span>
                    <span className="text-[10px] opacity-70">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Produktauswahl */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">
                {postType === 'single' ? 'Produkt auswählen' : 'Produkte auswählen (max. 6)'}
              </label>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap max-w-[70%]">
                  {selectedProducts.length === 0 ? (
                    <span className="text-gray-500 text-sm">Keine Produkte ausgewählt</span>
                  ) : (
                    selectedProducts.map(p => (
                      <span key={p.id} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded-full flex items-center gap-1">
                        {p.name.substring(0, 20)}{p.name.length > 20 ? '...' : ''}
                        <button onClick={() => setSelectedProducts(prev => prev.filter(prod => prod.id !== p.id))} className="hover:text-white">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <button 
                  onClick={() => setShowProductSelector(true)} 
                  className="px-3 py-1.5 bg-[#FF4400] text-white rounded text-sm hover:bg-[#FF4400]/80 transition-colors"
                >
                  <Plus className="w-3 h-3 inline mr-1" />
                  Auswählen
                </button>
              </div>
              {postType === 'collage' && selectedProducts.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">
                  {selectedProducts.length} von max. 6 Produkten ausgewählt
                </p>
              )}
            </div>

            {/* Sprache & Stil */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Sprache & Stil</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setConfig(prev => ({ ...prev, language: 'de' }))} className={`px-3 py-1.5 rounded text-sm transition-all ${config.language === 'de' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}>🇩🇪 Deutsch</button>
                <button onClick={() => setConfig(prev => ({ ...prev, language: 'en' }))} className={`px-3 py-1.5 rounded text-sm transition-all ${config.language === 'en' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}>🇬🇧 English</button>
                <button onClick={() => setConfig(prev => ({ ...prev, language: 'de-mixed' }))} className={`px-3 py-1.5 rounded text-sm transition-all ${config.language === 'de-mixed' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}>🌐 Mixed</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'storytelling', name: 'Storytelling', icon: '📖', desc: 'Emotionale Geschichte' },
                  { id: 'technical', name: 'Technisch', icon: '📏', desc: 'Details & Fakten' },
                  { id: 'emotional', name: 'Emotional', icon: '🔥', desc: 'Dringlichkeit / FOMO' },
                  { id: 'hashtag-heavy', name: 'Hashtag-lastig', icon: '#️⃣', desc: 'SEO & Reichweite' }
                ].map(style => (
                  <button key={style.id} onClick={() => setConfig(prev => ({ ...prev, captionStyle: style.id as any }))} 
                    className={`p-2 rounded-lg text-left text-sm transition-all ${config.captionStyle === style.id ? 'bg-[#FF4400]/20 border border-[#FF4400]' : 'bg-[#1A1A1A] border border-transparent hover:border-[#FF4400]/50'}`}>
                    <div className="flex items-center gap-2"><span>{style.icon}</span><span className="font-medium">{style.name}</span></div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{style.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Optionen */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <div className="flex flex-wrap gap-4 mb-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={config.includePrice} onChange={e => setConfig(prev => ({ ...prev, includePrice: e.target.checked }))} className="w-4 h-4 rounded accent-[#FF4400]" />
                  <span>💰 Preis anzeigen</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={config.includeSize} onChange={e => setConfig(prev => ({ ...prev, includeSize: e.target.checked }))} className="w-4 h-4 rounded accent-[#FF4400]" />
                  <span>📏 Größe anzeigen</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={config.includeBrand} onChange={e => setConfig(prev => ({ ...prev, includeBrand: e.target.checked }))} className="w-4 h-4 rounded accent-[#FF4400]" />
                  <span>🏷️ Marke anzeigen</span>
                </label>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>🎨 Kreativität / Varianz</span>
                  <span className="text-[#FF4400] font-bold">{config.variance}/10</span>
                </div>
                <input type="range" min={1} max={10} value={config.variance} onChange={e => setConfig(prev => ({ ...prev, variance: parseInt(e.target.value) }))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#FF4400]" />
                <p className="text-xs text-gray-500 mt-2">
                  {config.variance <= 3 ? '📝 Konsistent - Immer ähnliche Texte' : 
                   config.variance <= 7 ? '✨ Ausgewogen - Gute Mischung' : 
                   '🎲 Kreativ - Sehr abwechslungsreiche Texte'}
                </p>
              </div>
            </div>

            <button onClick={generatePost} disabled={isGenerating || selectedProducts.length === 0} 
              className="w-full py-3 bg-[#FF4400] text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-[#FF4400]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Generiere...' : 'Post Generieren'}
            </button>
          </div>

          {/* Rechte Seite - Preview & Editor */}
          <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-[#FF4400]/20 flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2"><Eye className="w-4 h-4 text-[#FF4400]" />Post Editor</h3>
              <div className="flex gap-1">
                <button onClick={copyToClipboard} className="p-1.5 hover:bg-[#FF4400]/10 rounded transition-colors" title="Kopieren"><Copy className="w-4 h-4" /></button>
                <button onClick={downloadPost} className="p-1.5 hover:bg-[#FF4400]/10 rounded transition-colors" title="Herunterladen"><Download className="w-4 h-4" /></button>
                <button onClick={() => setShowScheduleModal(true)} disabled={!generatedPost} className="p-1.5 hover:bg-[#FF4400]/10 rounded transition-colors disabled:opacity-50" title="Planen"><Calendar className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Instagram Mockup Preview */}
              <div className="bg-black rounded-2xl overflow-hidden max-w-[320px] mx-auto">
                <div className="px-3 pt-2 pb-1 flex justify-between text-xs text-white">
                  <span>9:41</span>
                  <span>📶 🔋 100%</span>
                </div>
                <div className="px-3 py-1 flex items-center gap-2 border-t border-gray-800">
                  <div className="w-6 h-6 bg-[#FF4400] rounded-full flex items-center justify-center text-white text-[10px] font-bold">S</div>
                  <div><p className="text-xs font-bold text-white">scnd_unit</p></div>
                </div>
                <div className="aspect-square bg-gradient-to-br from-[#FF4400]/20 to-black flex items-center justify-center">
                  {selectedImages.length > 0 ? (
                    <div className="w-full h-full">
                      <img src={selectedImages[0]} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <ImagePlus className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">Bild Vorschau</p>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex gap-3 mb-2">
                    <Heart className="w-4 h-4 text-white" />
                    <MessageCircle className="w-4 h-4 text-white" />
                    <Share2 className="w-4 h-4 text-white" />
                    <Bookmark className="w-4 h-4 text-white ml-auto" />
                  </div>
                  <p className="text-xs font-bold text-white mb-1">scnd_unit</p>
                  <p className="text-[11px] text-gray-300 whitespace-pre-wrap line-clamp-3">{editableCaption.substring(0, 150)}...</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editableHashtags.slice(0, 5).map(tag => (
                      <span key={tag} className="text-[10px] text-[#FF4400]">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Caption Editor */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Caption bearbeiten</label>
                <textarea 
                  value={editableCaption} 
                  onChange={(e) => setEditableCaption(e.target.value)} 
                  rows={6} 
                  className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#FF4400] transition-colors" 
                  placeholder="Deine Caption erscheint hier..." 
                />
              </div>

              {/* Hashtags */}
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wider mb-2 block">Hashtags</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {editableHashtags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded-full flex items-center gap-1">
                      {tag}
                      <button onClick={() => setEditableHashtags(prev => prev.filter(t => t !== tag))} className="hover:text-white">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Neuen Hashtag hinzufügen (z.B. streetwear)" 
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value) {
                        const newTag = e.currentTarget.value.startsWith('#') ? e.currentTarget.value : `#${e.currentTarget.value}`;
                        if (!editableHashtags.includes(newTag)) {
                          setEditableHashtags([...editableHashtags, newTag]);
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF4400]"
                  />
                </div>
              </div>

              {/* Aktionsbuttons */}
              <div className="flex gap-3 pt-2 border-t border-gray-800">
                <button onClick={() => { 
                  setSavedTemplates(prev => [...prev, { id: Date.now(), caption: editableCaption, hashtags: editableHashtags }]); 
                  toast('Template gespeichert!', 'success'); 
                }} className="flex-1 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-sm hover:border-[#FF4400] transition-colors flex items-center justify-center gap-1">
                  <Save className="w-3.5 h-3.5" /> Template
                </button>
                <button onClick={generatePost} className="flex-1 py-2 bg-[#1A1A1A] border border-gray-700 rounded-lg text-sm hover:border-[#FF4400] transition-colors flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5" /> Neu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#FF4400]" /> 
            Geplante Posts
            <span className="text-xs text-gray-500 ml-2">({scheduledPosts.length} geplant)</span>
          </h3>
          
          {scheduledPosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Keine geplanten Posts.</p>
              <p className="text-sm mt-1">Erstelle einen Post im Generator und klicke auf Planen.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {scheduledPosts.map(post => (
                <div key={post.id} className="bg-[#1A1A1A] rounded-lg p-4 flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm">{post.title}</p>
                      <span className="px-2 py-0.5 bg-[#FF4400]/20 text-[#FF4400] text-[10px] rounded-full">{post.platform}</span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      📅 {new Date(post.scheduledDate).toLocaleString('de-DE')}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">{post.caption.substring(0, 100)}...</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {post.hashtags.slice(0, 5).map(tag => (
                        <span key={tag} className="text-[10px] text-[#FF4400]/70">{tag}</span>
                      ))}
                      {post.hashtags.length > 5 && <span className="text-[10px] text-gray-500">+{post.hashtags.length - 5}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteScheduledPost(post.id)} className="p-2 hover:bg-red-600/20 rounded-lg transition-colors ml-2">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              Posts werden automatisch nicht veröffentlicht. Kopiere die Daten zum manuellen Posten.
            </p>
          </div>
        </div>
      )}

      {/* Brand Assets Tab */}
      {activeTab === 'brand' && (
        <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-[#FF4400]" />Brand Assets</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm block mb-2 text-gray-300">Primärfarbe</label>
              <div className="flex gap-2">
                <input type="color" defaultValue="#FF4400" className="w-12 h-12 rounded border border-gray-700 cursor-pointer" />
                <input type="text" defaultValue="#FF4400" className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-2 text-gray-300">Sekundärfarbe</label>
              <div className="flex gap-2">
                <input type="color" defaultValue="#0A0A0A" className="w-12 h-12 rounded border border-gray-700 cursor-pointer" />
                <input type="text" defaultValue="#0A0A0A" className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-sm block mb-2 text-gray-300">Watermark Text</label>
              <input type="text" defaultValue="SCND_UNIT" className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm block mb-2 text-gray-300">Logo</label>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center hover:border-[#FF4400] transition-colors cursor-pointer">
                <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
                <p className="text-sm text-gray-400">Logo hierher ziehen oder klicken</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG (max. 2MB)</p>
              </div>
            </div>
            <button onClick={() => toast('Brand Assets gespeichert!', 'success')} className="px-4 py-2 bg-[#FF4400] text-white rounded-lg hover:bg-[#FF4400]/80 transition-colors">
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && generatedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b border-[#FF4400]/20">
              <h3 className="text-lg font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-[#FF4400]" />Post planen</h3>
              <button onClick={() => setShowScheduleModal(false)} className="p-1 hover:bg-[#FF4400]/10 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Datum & Uhrzeit</label>
                <input type="datetime-local" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Plattform</label>
                <select value={schedulePlatform} onChange={(e) => setSchedulePlatform(e.target.value)} className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm">
                  <option value="instagram">📸 Instagram</option>
                  <option value="tiktok">🎵 TikTok</option>
                  <option value="facebook">📘 Facebook</option>
                  <option value="pinterest">📌 Pinterest</option>
                </select>
              </div>
              <div className="bg-[#1A1A1A] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">📝 {generatedPost.products[0]?.name}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{editableCaption.substring(0, 80)}...</p>
                <div className="flex flex-wrap gap-1 mt-2">{editableHashtags.slice(0, 3).map(tag => (<span key={tag} className="text-[10px] text-[#FF4400]">{tag}</span>))}</div>
              </div>
              <button onClick={saveSchedule} className="w-full py-3 bg-[#FF4400] text-white font-bold rounded-lg hover:bg-[#FF4400]/80 transition-colors">
                Post planen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#FF4400]/20">
              <h3 className="text-lg font-bold">
                Produkte auswählen 
                {postType === 'collage' && <span className="text-sm text-gray-400 ml-2">(max. 6)</span>}
              </h3>
              <button onClick={() => setShowProductSelector(false)} className="p-1 hover:bg-[#FF4400]/10 rounded"><X className="w-5 h-5" /></button>
            </div>
            
            {/* Suche */}
            <div className="p-3 border-b border-gray-800">
              <input 
                type="text" 
                placeholder="Produkt suchen..." 
                className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-[#FF4400]"
                id="product-search"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  const items = document.querySelectorAll('.product-item');
                  items.forEach(item => {
                    const name = item.getAttribute('data-name')?.toLowerCase() || '';
                    (item as HTMLElement).style.display = name.includes(searchTerm) ? 'flex' : 'none';
                  });
                }}
              />
            </div>
            
            {/* Produktliste */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableProducts.map(product => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  const isDisabled = postType === 'collage' && !isSelected && selectedProducts.length >= 6;
                  return (
                    <div 
                      key={product.id} 
                      data-name={product.name}
                      className={`product-item relative border rounded-lg p-2 cursor-pointer transition-all ${
                        isSelected ? 'border-[#FF4400] bg-[#FF4400]/10' : 'border-gray-700 hover:border-[#FF4400]/50'
                      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={() => { 
                        if (isDisabled) { 
                          toast('Maximal 6 Produkte für Collage', 'error'); 
                          return; 
                        } 
                        if (postType === 'single') { 
                          setSelectedProducts([product]); 
                          setShowProductSelector(false); 
                        } else { 
                          setSelectedProducts(prev => 
                            isSelected ? prev.filter(p => p.id !== product.id) : [...prev, product]
                          ); 
                        } 
                      }}
                    >
                      <div className="aspect-square bg-[#1A1A1A] rounded-md overflow-hidden">
                        {product.images?.[0] ? (
                          <img 
                            src={`/api/image-proxy?url=${encodeURIComponent(product.images[0])}`} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImagePlus className="w-8 h-8 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-bold truncate mt-2">{product.name}</p>
                      <p className="text-[10px] text-gray-400">{product.brand} · {product.price}</p>
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-[#FF4400] rounded-full w-5 h-5 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {availableProducts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>Keine verfügbaren Produkte gefunden.</p>
                  <p className="text-sm mt-2">Alle Produkte sind als verkauft markiert.</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#FF4400]/20 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                {selectedProducts.length} Produkt{selectedProducts.length !== 1 ? 'e' : ''} ausgewählt
              </span>
              <button 
                onClick={() => setShowProductSelector(false)} 
                className="px-4 py-2 bg-[#FF4400] text-white rounded-lg font-bold hover:bg-[#FF4400]/80 transition-colors"
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
