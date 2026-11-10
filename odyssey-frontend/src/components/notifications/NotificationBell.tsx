import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { notificationApi } from '@/services/api';
import { NotificationItem } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';

export default function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationApi.list(),
        notificationApi.unreadCount(),
      ]);
      setItems(list.slice(0, 8));
      setUnread(count);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    load();
    if (!isAuthenticated) return;
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, load, location.pathname]);

  const handleMarkAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch (error) {
      console.error('Failed to mark notifications read', error);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <Popover open={open} onOpenChange={(next) => { setOpen(next); if (next) load(); }}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button variant="ghost" size="sm" onClick={handleMarkAll} className="h-7 text-xs">
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              You are all caught up.
            </p>
          ) : (
            <div className="divide-y">
              {items.map((item) => {
                const href = item.journalId ? `/journals/${item.journalId}` : item.actorId ? `/users/${item.actorId}` : '/notifications';
                return (
                  <Link
                    key={item.id}
                    to={href}
                    onClick={() => { setOpen(false); if (!item.read) notificationApi.markRead(item.id).catch(() => undefined); }}
                    className={`block px-4 py-3 text-sm hover:bg-accent ${item.read ? '' : 'bg-primary/5'}`}
                  >
                    <p className="leading-snug">{item.message || 'New activity on your account.'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="border-t p-2">
          <Button variant="ghost" size="sm" className="w-full" asChild>
            <Link to="/notifications" onClick={() => setOpen(false)}>View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
