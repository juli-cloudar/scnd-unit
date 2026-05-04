'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, Instagram, Facebook, Globe, 
  RefreshCw, Calendar, Send, Copy, Check, ImagePlus, 
  LayoutGrid, Layers, Wand2, Settings, ChevronLeft, ChevronRight,
  Heart, MessageCircle, Share2, Bookmark, Plus, X, Trash2,
  Languages, Palette, 
  Newspaper, ShoppingBag, TrendingUp, Clock, Star, Zap,
  AlertCircle, Upload, Save, Eye, EyeOff, Edit3,
  ThumbsUp, ThumbsDown, RotateCcw, FileText, BookOpen,
  Bold, Italic, AlignLeft, Download, Filter
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
  const [postType, setPostType] = useState<'single' | 'collage' | 'collection' | 'lookbook'>('single');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [config, setConfig] = useState({
    template: 'streetwear', language: 'de-mixed', captionStyle: 'storytelling',
    includePrice: true, includeSize: true, includeBrand: true, variance: 10
  });
  const [generatedPost, setGeneratedPost] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [editableCaption, setEditableCaption] = useState('');
  const [editableHashtags, setEditableHashtags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!externalProducts && !products.length) {
      fetch('/api/products').then(res => res.json()).then(data => { setProducts(data); setLoading(false); });
    }
    const saved = localStorage.getItem('scnd_scheduled_posts');
    if (saved) setScheduledPosts(JSON.parse(saved));
  }, [externalProducts]);

  const availableProducts = products.filter(p => !p.sold);

  // ============================================================
  // CAPTION GENERIEREN
  // ============================================================
  const generateCaption = (products: Product[], language: string, style: string, options: any, variance: number): { caption: string; hashtags: string[] } => {
    const product = products[0];
    const productList = products.map(p => `${p.brand} ${p.name}`).join(' • ');
    
    const openers = variance >= 8 ? ['🔥🔥🔥', '🚨 BREAKING 🚨', '✨ DROP OF THE WEEK ✨'] : 
                    variance >= 5 ? ['✨ Neu eingetroffen', '🔥 Fresh Drop', '💫 Just landed'] :
                    ['Neu im Shop', 'Frisch gelistet'];
    
    const closers = variance >= 8 ? ['⬆️ Swipe up before it\'s gone!', '⏰ Don\'t sleep on this'] :
                    variance >= 5 ? ['🔗 Link in Bio', '👀 Check it out'] :
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
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion`
      },
      en: {
        storytelling: `${randomOpener}\n\n${productMention}\n\nThis rare piece tells a story.\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nCondition: 9/10${options.includeSize ? `\nSize: ${product.size}` : ''}${options.includePrice ? `\n💰 ${product.price}` : ''}\n\n📏 Measurements upon request\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - ${variance >= 7 ? 'The must-have!' : 'Perfect for you'}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEW DROP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion`
      },
      'de-mixed': {
        storytelling: `${randomOpener}\n\n${productMention}\n\nThis rare piece hat eine Geschichte.\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nCondition: 9/10${options.includeSize ? `\nSize: ${product.size}` : ''}${options.includePrice ? `\n💰 ${product.price}` : ''}\n\n📏 Measurements auf Anfrage\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - Das perfekte piece\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n#vintage #streetwear #scndunit #${product.brand?.toLowerCase()} #vintagefashion`
      }
    };
    
    const caption = captions[language]?.[style] || captions['de']['storytelling'];
    const hashtags = ['#scndunit', '#vintage', '#streetwear', product.brand ? `#${product.brand.toLowerCase().replace(/\s/g, '')}` : ''].filter(Boolean);
    
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
      products: generatedPost.products,
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

  const schedulePost = (post: ScheduledPost) => {
    const updated = [...scheduledPosts, post];
    setScheduledPosts(updated);
    localStorage.setItem('scnd_scheduled_posts', JSON.stringify(updated));
    toast('Post wurde geplant!', 'success');
  };

  const handleSchedule = () => {
    if (!generatedPost) return;
    schedulePost({
      id: Date.now().toString(),
      title: generatedPost.products[0]?.name || 'Neuer Post',
      caption: editableCaption,
      hashtags: editableHashtags,
      images: selectedImages,
      scheduledDate: new Date(Date.now() + 86400000).toISOString(),
      platform: 'instagram',
      status: 'pending'
    });
  };

  const handleCopyAll = () => {
    const fullText = `${editableCaption}\n\n${editableHashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    toast('Caption + Hashtags kopiert!', 'success');
  };

  if (loading) return <div className="text-center py-20 text-gray-500">Lade Produkte...</div>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#FF4400]/20 pb-4 flex-wrap">
        <button onClick={() => setActiveTab('generator')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'generator' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Wand2 className="w-4 h-4" />Generator</button>
        <button onClick={() => setActiveTab('scheduler')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'scheduler' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Calendar className="w-4 h-4" />Scheduler</button>
        <button onClick={() => setActiveTab('brand')} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${activeTab === 'brand' ? 'bg-[#FF4400] text-white' : 'text-gray-400 hover:text-[#FF4400]'}`}><Palette className="w-4 h-4" />Brand Assets</button>
      </div>

      {/* Generator Tab */}
      {activeTab === 'generator' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Linke Seite */}
          <div className="space-y-4">
            {/* Post Typ */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Post Typ</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'single', name: 'Einzelprodukt', icon: <ImagePlus className="w-4 h-4" /> },
                  { id: 'collage', name: 'Collage', icon: <LayoutGrid className="w-4 h-4" /> }
                ].map(type => (
                  <button key={type.id} onClick={() => { setPostType(type.id as any); setSelectedProducts([]); }} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${postType === type.id ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400 hover:text-[#FF4400]'}`}>{type.icon}{type.name}</button>
                ))}
              </div>
            </div>

            {/* Produktauswahl */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">{postType === 'single' ? 'Produkt' : 'Produkte (max. 6 für Collage)'}</label>
              <div className="flex items-center justify-between">
                <div className="flex gap-2 flex-wrap">
                  {selectedProducts.length === 0 ? <span className="text-gray-500 text-sm">Keine Produkte ausgewählt</span> : selectedProducts.map(p => (
                    <span key={p.id} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded">{p.name}
                      <button onClick={() => setSelectedProducts(prev => prev.filter(prod => prod.id !== p.id))} className="ml-1 hover:text-white"><X className="w-3 h-3 inline" /></button>
                    </span>
                  ))}
                </div>
                <button onClick={() => setShowProductSelector(true)} className="px-3 py-1 bg-[#1A1A1A] border border-[#FF4400]/30 text-[#FF4400] rounded text-sm">Auswählen</button>
              </div>
            </div>

            {/* Sprache & Stil */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Sprache & Stil</label>
              <div className="flex gap-2 mb-3">
                <button onClick={() => setConfig(prev => ({ ...prev, language: 'de' }))} className={`px-3 py-1 rounded text-sm ${config.language === 'de' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>Deutsch</button>
                <button onClick={() => setConfig(prev => ({ ...prev, language: 'en' }))} className={`px-3 py-1 rounded text-sm ${config.language === 'en' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>English</button>
                <button onClick={() => setConfig(prev => ({ ...prev, language: 'de-mixed' }))} className={`px-3 py-1 rounded text-sm ${config.language === 'de-mixed' ? 'bg-[#FF4400] text-white' : 'bg-[#1A1A1A] text-gray-400'}`}>Mixed</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'storytelling', name: 'Storytelling', icon: '📖' },
                  { id: 'technical', name: 'Technisch', icon: '📏' },
                  { id: 'emotional', name: 'Emotional', icon: '🔥' },
                  { id: 'hashtag-heavy', name: 'Hashtag-lastig', icon: '#️⃣' }
                ].map(style => (
                  <button key={style.id} onClick={() => setConfig(prev => ({ ...prev, captionStyle: style.id as any }))} className={`p-2 rounded-lg text-left text-sm transition-all ${config.captionStyle === style.id ? 'bg-[#FF4400]/20 border border-[#FF4400]' : 'bg-[#1A1A1A] border border-transparent'}`}>
                    <div className="flex items-center gap-2"><span>{style.icon}</span><span>{style.name}</span></div>
                  </button>
                ))}
              </div>
            </div>

            {/* Optionen */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <div className="flex flex-wrap gap-3 mb-4">
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={config.includePrice} onChange={e => setConfig(prev => ({ ...prev, includePrice: e.target.checked }))} className="rounded" />Preis</label>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={config.includeSize} onChange={e => setConfig(prev => ({ ...prev, includeSize: e.target.checked }))} className="rounded" />Größe</label>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={config.includeBrand} onChange={e => setConfig(prev => ({ ...prev, includeBrand: e.target.checked }))} className="rounded" />Marke</label>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2"><span>Varianz (Kreativität)</span><span className="text-[#FF4400]">{config.variance}/10</span></div>
                <input type="range" min={1} max={10} value={config.variance} onChange={e => setConfig(prev => ({ ...prev, variance: parseInt(e.target.value) }))} className="w-full accent-[#FF4400]" />
              </div>
            </div>

            <button onClick={generatePost} disabled={isGenerating || selectedProducts.length === 0} className="w-full py-3 bg-[#FF4400] text-white font-bold rounded-lg flex items-center justify-center gap-2">
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {isGenerating ? 'Generiere...' : 'Post Generieren'}
            </button>
          </div>

          {/* Rechte Seite: Preview */}
          <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-[#FF4400]/20 flex justify-between items-center">
              <h3 className="font-bold">Post Editor</h3>
              <div className="flex gap-1">
                <button onClick={handleCopyAll} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Kopieren"><Copy className="w-4 h-4" /></button>
                <button onClick={downloadPost} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Herunterladen"><Download className="w-4 h-4" /></button>
                <button onClick={handleSchedule} className="p-1.5 hover:bg-[#FF4400]/10 rounded" title="Planen"><Calendar className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Bild-Preview */}
              {selectedImages.length > 0 && (
                <div className="grid grid-cols-4 gap-1">
                  {selectedImages.slice(0, 4).map((img, i) => (
                    <div key={i} className="aspect-square bg-[#1A1A1A] rounded overflow-hidden">
                      <img src={`/api/image-proxy?url=${encodeURIComponent(img)}`} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {/* Caption Editor */}
              <textarea value={editableCaption} onChange={(e) => setEditableCaption(e.target.value)} rows={8} className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg p-3 text-sm resize-none" placeholder="Caption..." />

              {/* Hashtags */}
              <div className="flex flex-wrap gap-1">
                {editableHashtags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded-full">{tag}</span>
                ))}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button onClick={() => { setSavedTemplates([...savedTemplates, { id: Date.now(), caption: editableCaption, hashtags: editableHashtags }]); toast('Template gespeichert!', 'success'); }} className="flex-1 py-1.5 bg-[#1A1A1A] border border-gray-700 rounded text-sm"><Save className="w-3 h-3 inline mr-1" />Template</button>
                <button onClick={() => { if (selectedProducts.length > 0) generatePost(); }} className="flex-1 py-1.5 bg-[#1A1A1A] border border-gray-700 rounded text-sm"><RefreshCw className="w-3 h-3 inline mr-1" />Neu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Tab */}
      {activeTab === 'scheduler' && (
        <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#FF4400]" />Geplante Posts</h3>
          {scheduledPosts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Keine geplanten Posts. Erstelle einen Post und klicke auf Planen.</p>
          ) : (
            <div className="space-y-2">
              {scheduledPosts.map(post => (
                <div key={post.id} className="bg-[#1A1A1A] rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm">{post.title}</p>
                    <p className="text-xs text-gray-400">{new Date(post.scheduledDate).toLocaleString()} · {post.platform}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{post.caption.substring(0, 50)}...</p>
                  </div>
                  <button onClick={() => { const updated = scheduledPosts.filter(p => p.id !== post.id); setScheduledPosts(updated); localStorage.setItem('scnd_scheduled_posts', JSON.stringify(updated)); toast('Gelöscht', 'info'); }} className="p-2 hover:bg-red-600/20 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brand Assets Tab */}
      {activeTab === 'brand' && (
        <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Palette className="w-5 h-5 text-[#FF4400]" />Brand Assets</h3>
          <div className="space-y-4">
            <div><label className="text-sm block mb-2">Primärfarbe</label><input type="color" defaultValue="#FF4400" className="w-full h-10 rounded border border-gray-700" /></div>
            <div><label className="text-sm block mb-2">Watermark Text</label><input type="text" defaultValue="SCND_UNIT" className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2" /></div>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center"><Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" /><p className="text-sm text-gray-400">Logo hierher ziehen</p></div>
            <button onClick={() => toast('Brand Assets gespeichert!', 'success')} className="px-4 py-2 bg-[#FF4400] text-white rounded">Speichern</button>
          </div>
        </div>
      )}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-[#FF4400]/20">
              <h3 className="text-lg font-bold">Produkte auswählen {postType === 'collage' && '(max. 6)'}</h3>
              <button onClick={() => setShowProductSelector(false)} className="p-1 hover:bg-[#FF4400]/10 rounded"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {availableProducts.slice(0, 50).map(product => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  const isDisabled = postType === 'collage' && !isSelected && selectedProducts.length >= 6;
                  return (
                    <div 
                      key={product.id} 
                      onClick={() => { 
                        if (isDisabled) { toast('Maximal 6 Produkte für Collage', 'error'); return; } 
                        if (postType === 'single') { setSelectedProducts([product]); setShowProductSelector(false); } 
                        else { setSelectedProducts(prev => isSelected ? prev.filter(p => p.id !== product.id) : [...prev, product]); } 
                      }} 
                      className={`relative border rounded-lg p-2 cursor-pointer ${isSelected ? 'border-[#FF4400] bg-[#FF4400]/10' : 'border-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="aspect-square bg-[#1A1A1A] rounded overflow-hidden">
                        <img src={product.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(product.images[0])}` : ''} alt="" className="w-full h-full object-cover" />
                      </div>
                      <p className="text-xs font-bold truncate mt-1">{product.name}</p>
                      {isSelected && <div className="absolute top-2 right-2 bg-[#FF4400] rounded-full w-5 h-5 flex items-center justify-center"><Check className="w-3 h-3" /></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 border-t border-[#FF4400]/20 flex justify-between">
              <span className="text-sm text-gray-400">{selectedProducts.length} Produkte ausgewählt</span>
              <button onClick={() => setShowProductSelector(false)} className="px-4 py-2 bg-[#FF4400] text-white rounded font-bold">Fertig</button>
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
