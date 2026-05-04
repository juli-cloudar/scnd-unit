'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Instagram, Facebook, Globe, 
  RefreshCw, Calendar, Send, Copy, Check, ImagePlus, 
  LayoutGrid, Layers, Wand2, Settings, ChevronLeft, ChevronRight,
  Heart, MessageCircle, Share2, Bookmark, Plus, X, Trash2,
  Languages, Palette, 
  Newspaper, ShoppingBag, TrendingUp, Clock, Star, Zap,
  AlertCircle, Upload, Save, Eye, EyeOff, Edit3,
  ThumbsUp, ThumbsDown, RotateCcw, FileText, BookOpen,
  Bold, Italic, AlignLeft, Download, Filter, Grid3X3, Image,
  Type, Sliders, Droplet, Music, Grid
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

interface BrandAsset {
  id: string;
  type: 'logo' | 'watermark' | 'font' | 'color' | 'overlay';
  name: string;
  value: string;
  previewUrl?: string;
}

// ============================================================
// BRAND ASSETS MANAGER
// ============================================================
function BrandAssetsManager({ assets, onUpdate, toast }: { 
  assets: BrandAsset[]; 
  onUpdate: (assets: BrandAsset[]) => void; 
  toast: (msg: string, type: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'colors' | 'fonts' | 'logo' | 'watermark'>('colors');
  const [brandColors, setBrandColors] = useState([
    { name: 'Primary', value: '#FF4400' },
    { name: 'Secondary', value: '#0A0A0A' },
    { name: 'Accent', value: '#00FF00' },
    { name: 'Text', value: '#FFFFFF' }
  ]);

  const handleColorChange = (index: number, value: string) => {
    const newColors = [...brandColors];
    newColors[index].value = value;
    setBrandColors(newColors);
  };

  return (
    <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
      <div className="flex gap-2 mb-4 border-b border-gray-800">
        <button onClick={() => setActiveTab('colors')} className={`px-3 py-2 text-sm ${activeTab === 'colors' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>Farben</button>
        <button onClick={() => setActiveTab('fonts')} className={`px-3 py-2 text-sm ${activeTab === 'fonts' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>Schriften</button>
        <button onClick={() => setActiveTab('logo')} className={`px-3 py-2 text-sm ${activeTab === 'logo' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>Logo</button>
        <button onClick={() => setActiveTab('watermark')} className={`px-3 py-2 text-sm ${activeTab === 'watermark' ? 'text-[#FF4400] border-b-2 border-[#FF4400]' : 'text-gray-400'}`}>Watermark</button>
      </div>

      {activeTab === 'colors' && (
        <div className="space-y-3">
          {brandColors.map((color, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-20 text-sm">{color.name}</div>
              <input type="color" value={color.value} onChange={(e) => handleColorChange(i, e.target.value)} className="w-10 h-10 rounded border border-gray-700" />
              <input type="text" value={color.value} onChange={(e) => handleColorChange(i, e.target.value)} className="flex-1 bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2 text-sm" />
            </div>
          ))}
          <button onClick={() => toast('Farben gespeichert!', 'success')} className="mt-4 px-4 py-2 bg-[#FF4400] text-white rounded text-sm">Farben speichern</button>
        </div>
      )}

      {activeTab === 'fonts' && (
        <div className="space-y-3">
          <div><label className="text-sm block mb-2">Überschriftenschrift</label><select className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2"><option>Space Grotesk</option><option>Inter</option><option>Montserrat</option></select></div>
          <div><label className="text-sm block mb-2">Fließtextschrift</label><select className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2"><option>Inter</option><option>Arial</option><option>Helvetica</option></select></div>
        </div>
      )}

      {activeTab === 'logo' && (
        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-lg">
          <Upload className="w-8 h-8 mx-auto text-gray-500 mb-2" />
          <p className="text-sm text-gray-400">Logo hierher ziehen oder klicken</p>
          <p className="text-xs text-gray-500 mt-1">Empfohlen: 500x500px PNG mit Transparenz</p>
        </div>
      )}

      {activeTab === 'watermark' && (
        <div><label className="text-sm block mb-2">Watermark Text</label><input type="text" defaultValue="SCND_UNIT" className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2" /><p className="text-xs text-gray-500 mt-2">Wird auf alle Bilder angewendet</p></div>
      )}
    </div>
  );
}

// ============================================================
// SCHEDULER COMPONENT
// ============================================================
function Scheduler({ posts, onSchedule, onDelete, toast }: { 
  posts: ScheduledPost[]; 
  onSchedule: (post: ScheduledPost) => void; 
  onDelete: (id: string) => void;
  toast: (msg: string, type: string) => void;
}) {
  const [newPost, setNewPost] = useState<Partial<ScheduledPost>>({ title: '', caption: '', hashtags: [], scheduledDate: '', platform: 'instagram' });
  const [showForm, setShowForm] = useState(false);

  const handleSchedule = () => {
    if (!newPost.title || !newPost.caption || !newPost.scheduledDate) {
      toast('Bitte Titel, Caption und Datum ausfüllen', 'error');
      return;
    }
    const post: ScheduledPost = {
      id: Date.now().toString(),
      title: newPost.title || '',
      caption: newPost.caption || '',
      hashtags: newPost.hashtags || [],
      images: newPost.images || [],
      scheduledDate: newPost.scheduledDate || '',
      platform: newPost.platform || 'instagram',
      status: 'pending'
    };
    onSchedule(post);
    setNewPost({ title: '', caption: '', hashtags: [], scheduledDate: '', platform: 'instagram' });
    setShowForm(false);
    toast('Post geplant!', 'success');
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowForm(!showForm)} className="w-full py-3 bg-[#FF4400] text-white rounded-lg font-bold flex items-center justify-center gap-2"><Plus className="w-4 h-4" />Neuen Post planen</button>

      {showForm && (
        <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4 space-y-3">
          <input type="text" placeholder="Titel" value={newPost.title} onChange={(e) => setNewPost({...newPost, title: e.target.value})} className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2" />
          <textarea placeholder="Caption" rows={3} value={newPost.caption} onChange={(e) => setNewPost({...newPost, caption: e.target.value})} className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2" />
          <input type="datetime-local" value={newPost.scheduledDate} onChange={(e) => setNewPost({...newPost, scheduledDate: e.target.value})} className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2" />
          <select value={newPost.platform} onChange={(e) => setNewPost({...newPost, platform: e.target.value})} className="w-full bg-[#1A1A1A] border border-gray-700 rounded px-3 py-2"><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="facebook">Facebook</option><option value="pinterest">Pinterest</option></select>
          <button onClick={handleSchedule} className="w-full py-2 bg-green-600 text-white rounded">Planen</button>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {posts.map(post => (
          <div key={post.id} className="bg-[#1A1A1A] rounded-lg p-3 flex justify-between items-center">
            <div><p className="font-bold text-sm">{post.title}</p><p className="text-xs text-gray-400">{new Date(post.scheduledDate).toLocaleString()} · {post.platform}</p><p className="text-xs text-gray-500 line-clamp-1">{post.caption.substring(0, 50)}...</p></div>
            <button onClick={() => onDelete(post.id)} className="p-2 hover:bg-red-600/20 rounded"><Trash2 className="w-4 h-4 text-red-400" /></button>
          </div>
        ))}
      </div>

      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
        <p className="text-xs text-blue-400">📅 Exportiere geplante Posts als CSV für Manuelles Posting</p>
        <button className="mt-2 text-xs text-blue-400 flex items-center gap-1"><Download className="w-3 h-3" />CSV Export</button>
      </div>
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
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (!externalProducts && !products.length) {
      fetch('/api/products').then(res => res.json()).then(data => { setProducts(data); setLoading(false); });
    }
    // Load scheduled posts from localStorage
    const saved = localStorage.getItem('scnd_scheduled_posts');
    if (saved) setScheduledPosts(JSON.parse(saved));
  }, [externalProducts]);

  const availableProducts = products.filter(p => !p.sold);

  // ============================================================
  // CAPTION GENERIEREN MIT HOHER VARIANZ
  // ============================================================
  const generateCaption = (products: Product[], language: string, style: string, options: any, variance: number): { caption: string; hashtags: string[] } => {
    const product = products[0];
    const productList = products.map(p => `${p.brand} ${p.name}`).join(', ');
    
    // Varianz-basierte Textbausteine
    const openers = variance >= 8 ? ['🔥🔥🔥', '🚨 BREAKING 🚨', '✨ DROP OF THE WEEK ✨', '💎 HIDDEN GEM 💎'] : 
                    variance >= 5 ? ['✨ Neu eingetroffen', '🔥 Fresh Drop', '💫 Just landed', '⭐ Curated pick'] :
                    ['Neu', 'Neu im Shop', 'Frisch gelistet', 'Neu eingetroffen'];
    
    const closers = variance >= 8 ? ['Swipe up before it\'s gone! ⬆️', 'Don\'t sleep on this one 💤', 'First come first serve 🏃', 'This won\'t last 24h ⏰'] :
                    variance >= 5 ? ['Link in Bio 🔗', 'Shop now →', 'Check it out 👀', 'Get yours today 📦'] :
                    ['Link in Bio', 'Mehr erfahren', 'Jetzt shoppen', 'Vorbei schauen'];
    
    const randomOpener = openers[Math.floor(Math.random() * openers.length)];
    const randomCloser = closers[Math.floor(Math.random() * closers.length)];
    
    // Für Collage: Mehrere Produkte erwähnen
    const productMention = postType === 'collage' && products.length > 1 
      ? `Im Drop: ${products.map(p => `${p.brand} ${p.name}`).join(' • ')}`
      : `${product.brand} ${product.name}`;
    
    const captions: Record<string, Record<string, string>> = {
      de: {
        storytelling: `${randomOpener}\n\n${productMention}\n\nDieses Piece hat eine Geschichte zu erzählen. ${variance >= 7 ? 'Von einem Kleiderschrank zum nächsten - wir geben Fashion ein zweites Leben.' : 'Gefunden, geliebt, weitergegeben.'}\n\n${options.includeBrand ? `🏷️ Marke: ${product.brand}` : ''}${options.includeSize ? `\n📏 Größe: ${product.size}` : ''}${options.includePrice ? `\n💰 Preis: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nZustand: ${variance >= 7 ? '9/10 - kaum getragen' : 'Sehr gut erhalten'}${options.includeSize ? `\nGröße: ${product.size} - ${variance >= 7 ? 'true to size' : 'Normal'}` : ''}\n${options.includePrice ? `\nPreis: ${product.price}` : ''}\n\nMaße auf Anfrage 📏\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - ${variance >= 8 ? 'Das absolute Must-Have dieser Saison!' : variance >= 5 ? 'Ein Piece das dir keiner mehr wegnehmen wird' : 'Perfekt für deine Sammlung'}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n` + [...new Set(['vintage', 'secondhand', 'streetwear', product.brand?.toLowerCase(), 'scndunit', 'vintagefashion', 'thrifted', variance >= 7 ? 'rarefind' : 'shop', variance >= 8 ? 'grail' : 'daily']).filter(Boolean)].slice(0, 12).map(t => `#${t}`).join(' ')
      },
      en: {
        storytelling: `${randomOpener}\n\n${productMention}\n\nThis rare piece tells a story. ${variance >= 7 ? 'From someone\'s closet to yours - giving fashion a second life.' : 'Found, loved, passed on.'}\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nCondition: ${variance >= 7 ? '9/10 - barely worn' : 'Very good'}\n${options.includeSize ? `Size: ${product.size} - ${variance >= 7 ? 'true to size' : 'Regular'}` : ''}\n${options.includePrice ? `Price: ${product.price}` : ''}\n\nMeasurements upon request 📏\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - ${variance >= 8 ? 'The absolute must-have of the season!' : variance >= 5 ? 'A piece nobody will take from you' : 'Perfect for your collection'}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEW DROP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n` + [...new Set(['vintage', 'secondhand', 'streetwear', product.brand?.toLowerCase(), 'scndunit', 'vintagefashion', 'thrifted', variance >= 7 ? 'rarefind' : 'shop', variance >= 8 ? 'grail' : 'daily']).filter(Boolean)].slice(0, 12).map(t => `#${t}`).join(' ')
      },
      'de-mixed': {
        storytelling: `${randomOpener}\n\n${productMention}\n\nThis rare piece hat eine Geschichte zu erzählen. ${variance >= 7 ? 'From someone\'s closet to yours - giving fashion a second life.' : 'Found, loved, passed on.'}\n\n${options.includeBrand ? `🏷️ Brand: ${product.brand}` : ''}${options.includeSize ? `\n📏 Size: ${product.size}` : ''}${options.includePrice ? `\n💰 Price: ${product.price}` : ''}\n\n${randomCloser}`,
        technical: `📸 SCND_UNIT Drop #${Math.floor(Math.random() * 500 + 1)}\n\n${productMention}\nCondition: 9/10 (leichte Gebrauchsspuren)${options.includeSize ? `\nSize: ${product.size} - true to size` : ''}\n${options.includePrice ? `Price: ${product.price}` : ''}\n\nMeasurements auf Anfrage 📏\n\n${randomCloser}`,
        emotional: `${randomOpener}\n\n${product.brand} ${product.name} - Das perfekte piece${variance >= 7 ? ' for this season 🤌' : ''}\n\n${options.includePrice ? `💸 ${product.price}` : ''}\n\n${randomCloser}`,
        'hashtag-heavy': `NEU IM SHOP 🔥\n\n${productMention}\n\n${options.includeSize ? `📏 ${product.size}` : ''} ${options.includePrice ? `💰 ${product.price}` : ''}\n\n` + [...new Set(['vintage', 'streetwear', 'scndunit', product.brand?.toLowerCase(), 'vintagefashion', 'thrifted', variance >= 7 ? 'rarefind' : 'shop']).filter(Boolean)].slice(0, 10).map(t => `#${t}`).join(' ')
      }
    };
    
    const caption = captions[language]?.[style] || captions['de']['storytelling'];
    const hashtags = ['#scndunit', '#vintage', '#streetwear', product.brand ? `#${product.brand.toLowerCase().replace(/\s/g, '')}` : '', variance >= 7 ? '#rarefind' : '#shop', variance >= 8 ? '#grail' : '#daily'].filter(Boolean);
    
    return { caption, hashtags };
  };

  const generatePost = async () => {
    if (selectedProducts.length === 0 && postType !== 'collection') {
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
    toast('Post als JSON heruntergeladen!', 'success');
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
          {/* Linke Seite: Konfiguration */}
          <div className="space-y-4">
            {/* Post Typ */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Post Typ</label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'single', name: 'Einzelprodukt', icon: <ImagePlus className="w-4 h-4" /> },
                  { id: 'collage', name: 'Collage (mehrere)', icon: <LayoutGrid className="w-4 h-4" /> },
                  { id: 'collection', name: 'Collection', icon: <Layers className="w-4 h-4" /> }
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
                  {selectedProducts.length === 0 ? <span className="text-gray-500 text-sm">Keine Produkte ausgewählt</span> : selectedProducts.map(p => (<span key={p.id} className="px-2 py-1 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded">{p.name}<button onClick={() => setSelectedProducts(prev => prev.filter(prod => prod.id !== p.id))} className="ml-1 hover:text-white"><X className="w-3 h-3 inline" /></button></span>))}
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
                  <button key={style.id} onClick={() => setConfig(prev => ({ ...prev, captionStyle: style.id as any }))} className={`p-2 rounded-lg text-left text-sm transition-all ${config.captionStyle === style.id ? 'bg-[#FF4400]/20 border border-[#FF4400]' : 'bg-[#1A1A1A] border border-transparent'}`}><div className="flex items-center gap-2"><span>{style.icon}</span><span>{style.name}</span></div></button>
                ))}
              </div>
            </div>

            {/* Optionen & Varianz */}
            <div className="bg-[#111] border border-[#FF4400]/20 rounded-lg p-4">
              <div className="flex flex-wrap gap-3 mb-4">
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={config.includePrice} onChange={e => setConfig(prev => ({ ...prev, includePrice: e.target.checked }))} className="rounded" />Preis</label>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={config.includeSize} onChange={e => setConfig(prev => ({ ...prev, includeSize: e.target.checked }))} className="rounded" />Größe</label>
                <label className="flex items-center gap-1 text-sm"><input type="checkbox" checked={config.includeBrand} onChange={e => setConfig(prev => ({ ...prev, includeBrand: e.target.checked }))} className="rounded" />Marke</label>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2"><span>Varianz (Kreativität)</span><span className="text-[#FF4400]">{config.variance}/10</span></div>
                <input type="range" min={1} max={10} value={config.variance} onChange={e => setConfig(prev => ({ ...prev, variance: parseInt(e.target.value) }))} className="w-full accent-[#FF4400]" />
                <p className="text-xs text-gray-500 mt-1">Je höher, desto kreativer und unterschiedlicher die Texte</p>
              </div>
            </div>

            <button onClick={generatePost} disabled={isGenerating || selectedProducts.length === 0} className="w-full py-3 bg-[#FF4400] text-white font-bold rounded-lg flex items-center justify-center gap-2">{isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}{isGenerating ? 'Generiere...' : 'Post Generieren'}</button>
          </div>

          {/* Rechte Seite: Preview & Editor */}
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
                  {selectedImages.slice(0, 4).map((img, i) => (<div key={i} className="aspect-square bg-[#1A1A1A] rounded overflow-hidden"><img src={`/api/image-proxy?url=${encodeURIComponent(img)}`} alt="" className="w-full h-full object-cover" /></div>))}
                </div>
              )}

              {/* Caption Editor */}
              <textarea value={editableCaption} onChange={(e) => setEditableCaption(e.target.value)} rows={8} className="w-full bg-[#1A1A1A] border border-gray-700 rounded-lg p-3 text-sm resize-none" placeholder="Caption..." />

              {/* Hashtags */}
              <div className="flex flex-wrap gap-1">
                {editableHashtags.map(tag => (<span key={tag} className="px-2 py-0.5 bg-[#FF4400]/20 text-[#FF4400] text-xs rounded-full">{tag}</span>))}
              </div>

              {/* Template speichern */}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <button onClick={() => { setSavedTemplates([...savedTemplates, { id: Date.now(), caption: editableCaption, hashtags: editableHashtags }]); toast('Template gespeichert!', 'success'); }} className="flex-1 py-1.5 bg-[#1A1A1A] border border-gray-700 rounded text-sm"><Save className="w-3 h-3 inline mr-1" />Template</button>
                <button onClick={() => { const newCaption = generateCaption(selectedProducts, config.language, config.captionStyle, { includePrice: config.includePrice, includeSize: config.includeSize, includeBrand: config.includeBrand }, config.variance); setEditableCaption(newCaption.caption); toast('Neu generiert!', 'success'); }} className="flex-1 py-1.5 bg-[#1A1A1A] border border-gray-700 rounded text-sm"><RefreshCw className="w-3 h-3 inline mr-1" />Neu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduler Tab */}
      {activeTab === 'scheduler' && <Scheduler posts={scheduledPosts} onSchedule={schedulePost} onDelete={(id) => { const updated = scheduledPosts.filter(p => p.id !== id); setScheduledPosts(updated); localStorage.setItem('scnd_scheduled_posts', JSON.stringify(updated)); toast('Gelöscht', 'info'); }} toast={toast} />}

      {/* Brand Assets Tab */}
      {activeTab === 'brand' && <BrandAssetsManager assets={brandAssets} onUpdate={setBrandAssets} toast={toast} />}

      {/* Product Selector Modal */}
      {showProductSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111] border border-[#FF4400]/30 rounded-xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b"><h3>Produkte auswählen {postType === 'collage' && '(max. 6)'}</h3><button onClick={() => setShowProductSelector(false)}><X className="w-5 h-5" /></button></div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {availableProducts.slice(0, 50).map(product => {
                  const isSelected = selectedProducts.find(p => p.id === product.id);
                  const isDisabled = postType === 'collage' && !isSelected && selectedProducts.length >= 6;
                  return (<div key={product.id} onClick={() => { if (isDisabled) { toast('Maximal 6 Produkte für Collage', 'error'); return; } if (postType === 'single') { setSelectedProducts([product]); setShowProductSelector(false); } else { setSelectedProducts(prev => isSelected ? prev.filter(p => p.id !== product.id) : [...prev, product]); } }} className={`relative border rounded-lg p-2 cursor-pointer ${isSelected ? 'border-[#FF4400] bg-[#FF4400]/10' : 'border-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}><div className="aspect-square bg-[#1A1A1A] rounded overflow-hidden"><img src={product.images?.[0] ? `/api/image-proxy?url=${encodeURIComponent(product.images[0])}` : ''} className="w-full h-full object-cover" /></div><p className="text-xs font-bold truncate mt-1">{product.name}</p>{isSelected && <div className="absolute top-2 right-2 bg-[#FF4400] rounded-full w-5 h-5 flex items-center justify-center"><Check className="w-3 h-3" /></div>}</div>))}
              </div>
            </div>
            <div className="p-4 border-t flex justify-between"><span>{selectedProducts.length} Produkte</span><button onClick={() => setShowProductSelector(false)} className="px-4 py-2 bg-[#FF4400] rounded font-bold">Fertig</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// Check Component
const Check = ({ className }: { className?: string }) => (<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>);
