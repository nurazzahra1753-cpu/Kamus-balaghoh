import React, { useState, useEffect } from 'react';
import { Search, Book, Sparkles, ChevronRight, Info, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

interface DictionaryEntry {
  id: number;
  term_ar: string;
  term_id: string;
  definition: string;
  category: string;
}

interface SearchResponse {
  source: 'local' | 'ai';
  results?: DictionaryEntry[];
  content?: string;
  message?: string;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent, term?: string) => {
    if (e) e.preventDefault();
    const searchTerm = term || query;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error('Gagal mengambil data');
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('Terjadi kesalahan saat mencari. Pastikan server berjalan.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const commonTerms = [
    { ar: 'التشبيه', id: 'Tashbih' },
    { ar: 'الاستعارة', id: 'Isti\'arah' },
    { ar: 'الكناية', id: 'Kinayah' },
    { ar: 'الطباق', id: 'Thibaq' },
    { ar: 'الجناس', id: 'Jinas' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f2ed] text-[#1a1a1a] font-serif selection:bg-[#5A5A40] selection:text-white">
      {/* Header */}
      <header className="border-b border-black/10 py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#5A5A40] rounded-full flex items-center justify-center text-white shadow-lg">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-light tracking-tight">Kamus <span className="italic">Balaghoh</span></h1>
              <p className="text-xs uppercase tracking-widest opacity-60">Digital Rhetoric Lexicon</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="relative w-full md:w-96">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari istilah (Arab/Indo)..."
              className="w-full bg-white border border-black/10 rounded-full py-3 px-6 pr-12 focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 transition-all shadow-sm"
            />
            <button 
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#5A5A40] hover:bg-[#f5f2ed] rounded-full transition-colors"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
              ) : (
                <Search size={20} />
              )}
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <AnimatePresence mode="wait">
          {!response && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              <section className="text-center space-y-4">
                <h2 className="text-5xl font-light leading-tight">
                  Jelajahi Keindahan <br />
                  <span className="italic serif text-[#5A5A40]">Sastra Arab</span>
                </h2>
                <p className="max-w-xl mx-auto text-lg opacity-70">
                  Temukan definisi, kategori, dan contoh dari berbagai istilah Balaghoh (Retorika Arab) dengan bantuan kecerdasan buatan.
                </p>
              </section>

              <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {commonTerms.map((term) => (
                  <button
                    key={term.id}
                    onClick={() => {
                      setQuery(term.id);
                      handleSearch(undefined, term.id);
                    }}
                    className="p-4 bg-white border border-black/5 rounded-2xl hover:border-[#5A5A40] hover:shadow-md transition-all group text-center"
                  >
                    <span className="block text-2xl mb-1 font-arabic" dir="rtl">{term.ar}</span>
                    <span className="block text-xs uppercase tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity">{term.id}</span>
                  </button>
                ))}
              </section>
            </motion.div>
          )}

          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-24 space-y-4"
            >
              <div className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
              <p className="italic opacity-60">Mencari dalam khazanah ilmu...</p>
            </motion.div>
          )}

          {response && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-4">
                <button 
                  onClick={() => setResponse(null)}
                  className="text-sm uppercase tracking-widest opacity-50 hover:opacity-100 flex items-center gap-2 transition-opacity"
                >
                  <ChevronRight className="rotate-180" size={16} /> Kembali
                </button>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest opacity-50">
                  {response.source === 'ai' ? (
                    <><Sparkles size={14} className="text-[#5A5A40]" /> AI Generated</>
                  ) : (
                    <><Book size={14} /> Database Lokal</>
                  )}
                </div>
              </div>

              {response.source === 'local' && response.results && response.results.length > 0 ? (
                <div className="space-y-8">
                  {response.results.map((item) => (
                    <div key={item.id} className="bg-white p-8 rounded-[32px] shadow-sm border border-black/5 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                          <span className="text-xs uppercase tracking-widest text-[#5A5A40] font-bold">{item.category}</span>
                          <h3 className="text-4xl font-light">{item.term_id}</h3>
                        </div>
                        <span className="text-6xl font-arabic text-[#5A5A40]/20" dir="rtl">{item.term_ar}</span>
                      </div>
                      <p className="text-xl leading-relaxed opacity-80">
                        {item.definition}
                      </p>
                    </div>
                  ))}
                </div>
              ) : response.source === 'ai' ? (
                <div className="bg-white p-8 md:p-12 rounded-[32px] shadow-sm border border-black/5 prose prose-stone max-w-none">
                  <div className="markdown-body">
                    <Markdown>{response.content}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 bg-white rounded-[32px] border border-dashed border-black/20">
                  <Info className="mx-auto mb-4 opacity-20" size={48} />
                  <p className="text-xl italic opacity-60">{response.message || 'Istilah tidak ditemukan.'}</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mt-8 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center text-sm">
            {error}
          </div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto py-12 px-6 border-t border-black/10 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-xs uppercase tracking-widest">
          <p>© 2026 Kamus Balaghoh Digital</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Tentang</a>
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Metodologi</a>
            <a href="#" className="hover:text-[#5A5A40] transition-colors">Kontak</a>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Amiri:wght@400;700&display=swap');
        
        .font-serif { font-family: 'Cormorant Garamond', serif; }
        .font-arabic { font-family: 'Amiri', serif; }
        
        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
          font-family: 'Cormorant Garamond', serif;
          font-weight: 400;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .markdown-body h1 { font-size: 2.5rem; }
        .markdown-body h2 { font-size: 2rem; border-bottom: 1px solid rgba(0,0,0,0.1); padding-bottom: 0.3em; }
        .markdown-body p { font-size: 1.25rem; line-height: 1.7; margin-bottom: 1em; opacity: 0.85; }
        .markdown-body ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1em; }
        .markdown-body li { font-size: 1.1rem; margin-bottom: 0.5em; opacity: 0.8; }
        .markdown-body strong { font-weight: 600; color: #5A5A40; }
        .markdown-body blockquote { border-left: 4px solid #5A5A40; padding-left: 1em; font-style: italic; opacity: 0.7; }
      `}} />
    </div>
  );
}
