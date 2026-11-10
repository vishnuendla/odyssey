import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Loader2, Trash2 } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { notificationApi } from '@/services/api';
import { NotificationItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const NotificationsPage = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      setItems(await notificationApi.list());
    } catch (error) {
      console.error('Failed to load notifications', error);
      toast({ variant: 'destructive', description: 'Could not load notifications.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await notificationApi.markRead(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  };

  const markAll = async () => {
    await notificationApi.markAllRead();
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  };

  const remove = async (id: string) => {
    await notificationApi.delete(id);
    setItems((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container max-w-3xl py-12 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Follows, reactions, comments and saved journals.</p>
          </div>
          <Button variant="outline" size="sm" onClick={markAll} disabled={items.every((item) => item.read)}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <Bell className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Nothing here yet</p>
              <p className="text-sm text-muted-foreground">
                When someone follows you or interacts with your journals, it shows up here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const href = item.journalId ? `/journals/${item.journalId}` : item.actorId ? `/users/${item.actorId}` : '#';
              return (
                <Card key={item.id} className={item.read ? '' : 'border-primary/40 bg-primary/5'}>
                  <CardContent className="flex items-start gap-4 py-4">
                    <div className="flex-1">
                      <Link to={href} onClick={() => !item.read && markRead(item.id)} className="font-medium hover:text-primary">
                        {item.message || 'New activity'}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.type.toLowerCase()} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!item.read && (
                      <Button variant="ghost" size="sm" onClick={() => markRead(item.id)}>
                        Read
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => remove(item.id)} aria-label="Delete notification">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
