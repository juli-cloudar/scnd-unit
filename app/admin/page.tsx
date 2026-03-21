'use client';

import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  size: string;
  condition: string;
  image: string;
  vintedUrl: string;
  description: string;
}

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<Partial<Product>>({ 
    category: 'Tops', 
    condition: '9/10', 
    size: 'M' 
  });
  const [url, setUrl] = useState('');

  const add = () => {
    if (!form.name || !form.price) {
      alert('Name und Preis erforderlich!');
      return;
    }
    
    const newProduct: Product = { 
      id: Date.now().toString(),
      name: form.name,
      price: form.price,
      category: form.category || 'Tops',
      size: form.size || 'M',
      condition: form.condition || '9/10',
      image: form.image || '/products/placeholder.jpg',
      vintedUrl: url,
      description: form.description || ''
    };
    
    setProducts([...products, newProduct]);
    setForm({ category: 'Tops', condition: '9/10', size: 'M' });
    setUrl('');
  };

  const remove = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const copyCode = () => {
    const code = `const products = ${JSON.stringify(products, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Code kopiert! Füge ihn in deine Website ein.');
  };

  const inputStyle = {
    width: '100%',
    marginBottom: '10px',
    padding: '10px',
    background: '#0A0A0A',
    border: '1px solid #333',
    color: '#F5F5F5',
    borderRadius: '4px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '5px',
    color: '#D4AF37',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#0A0A0A', 
      color: '#F5F5F5', 
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#D4AF37', marginBottom: '5px' }}>
        SCND_UNIT <span style={{ color: '#666' }}>Admin</span>
      </h1>
      <p style={{ color: '#666', marginBottom: '30px', fontSize: '14px' }}>
        Produkt-Verwaltung für Vinted-Import
      </p>
      
      {/* Formular */}
      <div style={{ 
        background: '#1A1A1A', 
        padding: '20px', 
        marginBottom: '30px', 
        borderRadius: '8px',
        border: '1px solid #333'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Neues Produkt</h3>
        
        <label style={labelStyle}>Vinted URL</label>
        <input 
          placeholder="https://www.vinted.de/items/..." 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
          style={inputStyle}
        />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input 
              placeholder="z.B. Vintage Carhartt Jacket" 
              value={form.name || ''} 
              onChange={e => setForm({...form, name: e.target.value})} 
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Preis * (mit €)</label>
            <input 
              placeholder="z.B. €45" 
              value={form.price || ''} 
              onChange={e => setForm({...form, price: e.target.value})} 
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={labelStyle}>Kategorie</label>
            <select 
              value={form.category} 
              onChange={e => setForm({...form, category: e.target.value})}
              style={inputStyle}
            >
              <option>Tops</option>
              <option>Bottoms</option>
              <option>Outerwear</option>
              <option>Shoes</option>
              <option>Accessories</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Größe</label>
            <input 
              placeholder="L, M, 32..." 
              value={form.size || ''} 
              onChange={e => setForm({...form, size: e.target.value})} 
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Zustand</label>
            <select 
              value={form.condition} 
              onChange={e => setForm({...form, condition: e.target.value})}
              style={inputStyle}
            >
              <option>10/10</option>
              <option>9/10</option>
              <option>8/10</option>
              <option>7/10</option>
            </select>
          </div>
        </div>

        <label style={labelStyle}>Bild-Dateipfad</label>
        <input 
          placeholder="/products/jacket-001.jpg" 
          value={form.image || ''} 
          onChange={e => setForm({...form, image: e.target.value})} 
          style={inputStyle}
        />
        <p style={{ fontSize: '11px', color: '#666', marginTop: '-5px', marginBottom: '15px' }}>
          Speichere das Bild in public/products/ und gib hier den Dateinamen an
        </p>

        <button 
          onClick={add} 
          style={{ 
            background: '#D4AF37', 
            color: 'black', 
            padding: '12px 24px', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderRadius: '4px'
          }}
        >
          Hinzufügen
        </button>
      </div>

      {/* Inventarliste */}
      <h3 style={{ marginBottom: '15px' }}>
        Inventar <span style={{ color: '#D4AF37' }}>({products.length})</span>
      </h3>
      
      {products.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>Noch keine Produkte hinzugefügt...</p>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          {products.map(p => (
            <div 
              key={p.id} 
              style={{ 
                background: '#1A1A1A', 
                padding: '15px', 
                marginBottom: '10px',
                borderRadius: '4px',
                border: '1px solid #333',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong style={{ color: '#D4AF37' }}>{p.name}</strong>
                <span style={{ color: '#666', marginLeft: '10px' }}>{p.price}</span>
                <span style={{ color: '#666', marginLeft: '10px', fontSize: '12px' }}>
                  {p.category} • {p.size} • {p.condition}
                </span>
              </div>
              <button 
                onClick={() => remove(p.id)}
                style={{
                  background: 'transparent',
                  border: '1px solid #ff4444',
                  color: '#ff4444',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Export Button */}
      {products.length > 0 && (
        <button 
          onClick={copyCode} 
          style={{ 
            background: '#D4AF37', 
            color: 'black', 
            padding: '15px 30px', 
            border: 'none', 
            cursor: 'pointer',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            borderRadius: '4px',
            width: '100%'
          }}
        >
          Website-Code kopieren
        </button>
      )}
    </div>
  );
}
