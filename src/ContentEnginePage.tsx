import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserButton, useAuth } from '@clerk/clerk-react';
import { ArrowLeft, Copy, Check, Loader2, Globe, FileText, Video } from 'lucide-react';

type InputType = 'url' | 'text' | 'video';
type Format = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'blog' | 'email';

interface FormatOption {
  id: Format;
  label: string;
  description: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: 'twitter', label: 'Twitter / X Thread', description: '5–8 tweet thread' },
  { id: 'linkedin', label: 'LinkedIn Post', description: '150–300 words + hashtags' },
  { id: 'instagram', label: 'Instagram Caption', description: 'Caption + 15–20 hashtags' },
  { id: 'facebook', label: 'Facebook Post', description: '100–200 word post' },
  { id: 'blog', label: 'Blog Post', description: '500–800 word article' },
  { id: 'email', label: 'Email Newsletter', description: 'Subject + 200–350 word body' },
];

const FORMAT_LABELS: Record<Format, string> = {
  twitter: 'Twitter / X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  facebook: 'Facebook',
  blog: 'Blog Post',
  email: 'Email',
};

export default function ContentEnginePage() {
  const { getToken } = useAuth();

  const [inputType, setInputType] = useState<InputType>('url');
  const [inputValue, setInputValue] = useState('');
  const [selectedFormats, setSelectedFormats] = useState<Set<Format>>(
    new Set(['twitter', 'linkedin', 'blog'])
  );
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<Partial<Record<Format, string>>>({});
  const [activeTab, setActiveTab] = useState<Format | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<Format | null>(null);

  function toggleFormat(format: Format) {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) {
        next.delete(format);
      } else {
        next.add(format);
      }
      return next;
    });
  }

  async function handleGenerate() {
    if (!inputValue.trim() || selectedFormats.size === 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResults({});
    setActiveTab(null);

    try {
      const token = await getToken();
      const response = await fetch('/.netlify/functions/repurpose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          inputType,
          content: inputValue.trim(),
          formats: Array.from(selectedFormats),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      setResults(data.results ?? {});
      const firstFormat = Array.from(selectedFormats)[0];
      if (firstFormat && data.results?.[firstFormat]) {
        setActiveTab(firstFormat);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopy(format: Format) {
    const text = results[format];
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  }

  const canGenerate =
    inputValue.trim().length > 0 && selectedFormats.size > 0 && !isLoading;
  const generatedFormats = (Array.from(selectedFormats) as Format[]).filter(
    (f) => results[f]
  );

  return (
    <div className="min-h-screen bg-dark text-light">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-24 border-b border-light/10">
        <Link
          to="/"
          className="flex items-center gap-2 text-muted hover:text-light transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <h1 className="text-xl font-bold tracking-tighter">
          MARCUS & MUSE<span className="text-accent">.</span>
        </h1>
        <UserButton />
      </nav>

      {/* Hero */}
      <header className="px-6 pt-16 pb-12 md:px-24">
        <div className="max-w-2xl">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-none mb-4">
            Content Engine
          </h2>
          <p className="text-muted text-lg">
            Turn any URL, text, or YouTube video into ready-to-publish content for
            every channel.
          </p>
        </div>
      </header>

      <div className="px-6 pb-32 md:px-24 space-y-10 max-w-4xl">
        {/* Step 1: Input type */}
        <section>
          <p className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
            Step 1 — Source type
          </p>
          <div className="flex gap-3 flex-wrap">
            {(
              [
                { id: 'url' as InputType, label: 'URL', icon: Globe },
                { id: 'text' as InputType, label: 'Text', icon: FileText },
                { id: 'video' as InputType, label: 'YouTube', icon: Video },
              ] as { id: InputType; label: string; icon: React.ComponentType<{ className?: string }> }[]
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setInputType(id);
                  setInputValue('');
                  setError(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  inputType === id
                    ? 'bg-accent text-dark'
                    : 'bg-light/5 border border-light/10 text-muted hover:bg-light/10 hover:text-light'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </section>

        {/* Step 2: Input */}
        <section>
          <p className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
            Step 2 — {inputType === 'url' ? 'Enter a URL' : inputType === 'video' ? 'Enter a YouTube URL' : 'Paste your text'}
          </p>
          {inputType === 'text' ? (
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Paste your article, notes, transcript, or any content here…"
              rows={8}
              className="w-full bg-light/5 border border-light/10 rounded-xl px-5 py-4 text-light placeholder-muted/50 resize-y focus:outline-none focus:border-accent/50 transition-colors text-sm"
            />
          ) : (
            <input
              type="url"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={
                inputType === 'video'
                  ? 'https://www.youtube.com/watch?v=...'
                  : 'https://example.com/article'
              }
              className="w-full bg-light/5 border border-light/10 rounded-xl px-5 py-4 text-light placeholder-muted/50 focus:outline-none focus:border-accent/50 transition-colors text-sm"
            />
          )}
        </section>

        {/* Step 3: Output formats */}
        <section>
          <p className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
            Step 3 — Output formats
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {FORMAT_OPTIONS.map((opt) => {
              const selected = selectedFormats.has(opt.id);
              return (
                <button
                  key={opt.id}
                  onClick={() => toggleFormat(opt.id)}
                  className={`flex items-start gap-4 p-5 rounded-xl border text-left transition-colors ${
                    selected
                      ? 'bg-accent/10 border-accent/40 text-light'
                      : 'bg-light/5 border-light/10 text-muted hover:bg-light/10 hover:text-light'
                  }`}
                >
                  <div
                    className={`w-5 h-5 mt-0.5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      selected ? 'bg-accent border-accent' : 'border-muted/40'
                    }`}
                  >
                    {selected && <Check className="w-3 h-3 text-dark" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{opt.label}</p>
                    <p className="text-xs text-muted mt-0.5">{opt.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="flex items-center gap-2 px-8 py-4 text-sm font-medium bg-accent text-dark rounded-full hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating content…
            </>
          ) : (
            'Generate Content'
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-6 py-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {generatedFormats.length > 0 && (
          <section>
            <p className="text-sm font-medium text-muted uppercase tracking-widest mb-4">
              Results
            </p>

            {/* Tab strip */}
            <div className="flex gap-2 flex-wrap mb-4">
              {generatedFormats.map((format) => (
                <button
                  key={format}
                  onClick={() => setActiveTab(format)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === format
                      ? 'bg-accent text-dark'
                      : 'bg-light/5 border border-light/10 text-muted hover:bg-light/10 hover:text-light'
                  }`}
                >
                  {FORMAT_LABELS[format]}
                </button>
              ))}
            </div>

            {/* Active tab content */}
            {activeTab && results[activeTab] && (
              <div className="rounded-xl bg-light/5 border border-light/10">
                <div className="flex items-center justify-between px-6 py-4 border-b border-light/10">
                  <p className="font-medium text-sm">{FORMAT_LABELS[activeTab]}</p>
                  <button
                    onClick={() => handleCopy(activeTab)}
                    className="flex items-center gap-1.5 text-xs text-muted hover:text-light transition-colors"
                  >
                    {copiedFormat === activeTab ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="px-6 py-5 text-sm text-muted whitespace-pre-wrap font-sans leading-relaxed overflow-x-auto">
                  {results[activeTab]}
                </pre>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
