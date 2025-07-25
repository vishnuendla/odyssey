import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { useJournals } from '@/hooks/use-journals';

export function JournalList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { journals, isLoading } = useJournals();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('journal.list.title')}
            </h1>
            <Button
              onClick={() => navigate('/journals/create')}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('journal.list.createNew')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4">
                  <div className="h-6 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded mb-4" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                    <div className="h-8 w-20 bg-muted rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('journal.list.title')}
          </h1>
          <Button
            onClick={() => navigate('/journals/create')}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('journal.list.createNew')}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {journals.length > 0 ? (
            journals.map((journal) => (
              <Card key={journal.id} className="overflow-hidden">
                {journal.images && journal.images.length > 0 && (
                  <div className="aspect-video relative">
                    <img
                      src={journal.images[0]}
                      alt={journal.title}
                      className="w-full h-full object-cover"
                    />
                    {!journal.isPublic && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary">
                          {t('journal.list.private')}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <CardContent className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{journal.title}</h2>
                  <p className="text-muted-foreground line-clamp-3 mb-4">
                    {journal.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={journal.author.avatar} />
                        <AvatarFallback>
                          {journal.author.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{journal.author.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/journals/${journal.id}`)}
                    >
                      {t('common.readMore')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground mb-4">
                {t('journal.list.noJournals')}
              </p>
              <Button
                onClick={() => navigate('/journals/create')}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {t('journal.list.createNew')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 