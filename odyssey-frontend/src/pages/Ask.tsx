import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { aiApi } from '@/services/api';
import type { AiStatus, AskAnswer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'Where did I eat the best meal?',
  'Which trip was the most exhausting?',
  'What did I write about trains?',
  'Summarise my trip to Japan',
];

/** Renders [n] citation markers in the answer as links to the source list. */
function renderAnswer(answer: string) {
  const parts = answer.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (!match) {
      return <span key={i}>{part}</span>;
    }
    return (
      <a
        key={i}
        href={`#source-${match[1]}`}
        className="align-super text-xs font-semibold text-primary hover:underline"
      >
        [{match[1]}]
      </a>
    );
  });
}

const Ask = () => {
  const { toast } = useToast();
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    aiApi
      .status()
      .then(setStatus)
      .catch(() => setStatus({ configured: false, embeddingModel: '', chatModel: '' }));
  }, []);

  const submit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || loading) {
      return;
    }
    setLoading(true);
    setAnswer(null);
    try {
      setAnswer(await aiApi.ask(trimmed));
    } catch (error) {
      console.error('AI ask failed', error);
      toast({
        variant: 'destructive',
        description:
          error instanceof Error && error.message.includes('50')
            ? 'AI is not available right now. Please try again later.'
            : 'Could not answer that question. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto py-8 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2" aria-hidden="true">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Ask your journal</h1>
              <p className="text-sm text-muted-foreground">
                Semantic answers from your own entries, with citations back to the words you wrote.
              </p>
            </div>
          </div>

          {status && !status.configured && (
            <Card className="mb-6">
              <CardContent className="p-6 text-sm text-muted-foreground">
                <p className="mb-2 font-medium text-foreground">AI is not configured on this server</p>
                <p>
                  Ask your journal needs an embeddings and chat provider. Set{' '}
                  <code className="rounded bg-muted px-1 py-0.5">AI_API_KEY</code> (any
                  OpenAI-compatible provider, including a local Ollama via{' '}
                  <code className="rounded bg-muted px-1 py-0.5">AI_BASE_URL</code>) and restart the
                  backend. Your journals are only searched after you write them.
                </p>
              </CardContent>
            </Card>
          )}

          <form
            className="flex gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              submit(question);
            }}
          >
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Where did I eat the best meal in Japan?"
              maxLength={500}
              aria-label="Your question"
            />
            <Button type="submit" disabled={loading || !question.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setQuestion(suggestion);
                  submit(suggestion);
                }}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {answer && (
            <div className="mt-8 space-y-6">
              <Card>
                <CardContent className="p-6">
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {renderAnswer(answer.answer)}
                  </p>
                </CardContent>
              </Card>

              {answer.sources.length > 0 && (
                <div>
                  <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                    Sources · {answer.sources.length} excerpt
                    {answer.sources.length === 1 ? '' : 's'}
                  </h2>
                  <div className="space-y-3">
                    {answer.sources.map((source) => (
                      <Link
                        key={source.index}
                        id={`source-${source.index}`}
                        to={`/journals/${source.journalId}`}
                        className="block rounded-md border border-border p-4 transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">[{source.index}]</Badge>
                          <span className="font-medium">{source.journalTitle}</span>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{source.snippet}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!answer && !loading && status?.configured && (
            <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Your journals are indexed automatically as you write; private entries stay private.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Ask;
