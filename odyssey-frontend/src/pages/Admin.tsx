import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Loader2, ShieldCheck, Eye, EyeOff, Check, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { moderationApi } from '@/services/api';
import { AdminStats, ReportItem } from '@/types';

type Filter = 'OPEN' | 'ALL' | 'RESOLVED' | 'DISMISSED';

const statusVariant: Record<ReportItem['status'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  OPEN: 'destructive',
  RESOLVED: 'default',
  DISMISSED: 'secondary',
};

const AdminPage = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [filter, setFilter] = useState<Filter>('OPEN');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const [nextStats, nextReports] = await Promise.all([
        moderationApi.stats(),
        moderationApi.listReports(filter === 'ALL' ? undefined : filter),
      ]);
      setStats(nextStats);
      setReports(nextReports);
    } catch (error) {
      console.error('Failed to load moderation queue', error);
      toast({ variant: 'destructive', description: 'Could not load the moderation queue.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading || user?.role !== 'ADMIN') return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.role, filter]);

  const counts = useMemo(() => {
    return {
      open: reports.filter((report) => report.status === 'OPEN').length,
    };
  }, [reports]);

  const resolve = async (report: ReportItem, action: 'HIDE' | 'DISMISS') => {
    setBusyId(report.id);
    try {
      await moderationApi.resolveReport(report.id, action, notes[report.id]?.trim() || undefined);
      toast({
        description: action === 'HIDE'
          ? 'Content hidden and report resolved.'
          : 'Report dismissed.',
      });
      setNotes((current) => ({ ...current, [report.id]: '' }));
      await load();
    } catch (error) {
      console.error('Failed to resolve report', error);
      const message = error instanceof Error ? error.message : 'Could not resolve the report.';
      toast({ variant: 'destructive', description: message });
    } finally {
      setBusyId(null);
    }
  };

  const toggleVisibility = async (report: ReportItem) => {
    setBusyId(report.id);
    try {
      const target = report.targetType === 'JOURNAL'
        ? moderationApi.setJournalVisibility
        : moderationApi.setCommentVisibility;
      await target(report.targetId, !report.targetHidden);
      toast({ description: 'Visibility updated.' });
      await load();
    } catch (error) {
      console.error('Failed to update visibility', error);
      toast({ variant: 'destructive', description: 'Could not update visibility.' });
    } finally {
      setBusyId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container max-w-2xl py-16 px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" /> Moderators only
              </CardTitle>
              <CardDescription>
                This area is limited to accounts with the admin role.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link to="/explore">Back to explore</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-5xl py-10 px-4">
        <div className="mb-8 flex flex-col gap-2">
          <h1 className="flex items-center gap-2 text-3xl font-bold">
            <ShieldCheck className="h-7 w-7" /> Moderation
          </h1>
          <p className="text-muted-foreground">
            Review reported journals and comments, then hide or dismiss them.
          </p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Users', value: stats?.users },
            { label: 'Journals', value: stats?.journals },
            { label: 'Public journals', value: stats?.publicJournals },
            { label: 'Open reports', value: stats?.openReports },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value ?? '—'}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(['OPEN', 'RESOLVED', 'DISMISSED', 'ALL'] as Filter[]).map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? 'default' : 'outline'}
              onClick={() => setFilter(value)}
            >
              {value === 'ALL' ? 'All reports' : value.charAt(0) + value.slice(1).toLowerCase()}
            </Button>
          ))}
          {filter === 'OPEN' && counts.open > 0 && (
            <Badge variant="destructive">{counts.open} open</Badge>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Flag className="mb-3 h-9 w-9 text-muted-foreground" />
              <p className="font-medium">Queue is clear</p>
              <p className="text-sm text-muted-foreground">No reports match this filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant[report.status]}>{report.status}</Badge>
                    <Badge variant="outline">{report.targetType}</Badge>
                    <Badge variant="secondary">{report.reason}</Badge>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <CardTitle className="text-base">
                    {report.targetPreview || 'Removed content'}
                  </CardTitle>
                  <CardDescription>
                    Reported by {report.reporterName}
                    {report.targetAuthorName ? ` · author ${report.targetAuthorName}` : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.details && (
                    <p className="rounded-md bg-muted p-3 text-sm">{report.details}</p>
                  )}

                  {report.targetType === 'JOURNAL' && report.targetAuthorId && (
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/journals/${report.targetId}`}>Open reported journal</Link>
                    </Button>
                  )}

                  {report.status === 'OPEN' ? (
                    <div className="space-y-3">
                      <Textarea
                        value={notes[report.id] ?? ''}
                        onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))}
                        placeholder="Optional moderator note"
                        maxLength={500}
                      />
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === report.id}
                          onClick={() => resolve(report, 'HIDE')}
                        >
                          {busyId === report.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <EyeOff className="mr-2 h-4 w-4" />}
                          Hide content
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === report.id}
                          onClick={() => resolve(report, 'DISMISS')}
                        >
                          <X className="mr-2 h-4 w-4" /> Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === report.id}
                          onClick={() => toggleVisibility(report)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Toggle visibility
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4" />
                      Reviewed{report.resolvedByName ? ` by ${report.resolvedByName}` : ''}
                      {report.resolutionNote ? ` · ${report.resolutionNote}` : ''}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default AdminPage;
