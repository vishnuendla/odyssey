import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { accountApi } from '@/services/api';

interface FollowButtonProps {
  userId: string;
  initialFollowing?: boolean;
  initialFollowers?: number;
  onChanged?: (following: boolean, followers: number) => void;
  size?: 'sm' | 'default';
}

export default function FollowButton({
  userId,
  initialFollowing = false,
  initialFollowers = 0,
  onChanged,
  size = 'sm',
}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [following, setFollowing] = useState(initialFollowing);
  const [followers, setFollowers] = useState(initialFollowers);
  const [busy, setBusy] = useState(false);

  if (user?.id === userId) return null;

  const toggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const profile = following
        ? await accountApi.unfollow(userId)
        : await accountApi.follow(userId);
      const nextFollowing = profile.following ?? !following;
      const nextFollowers = profile.followersCount ?? followers + (nextFollowing ? 1 : -1);
      setFollowing(nextFollowing);
      setFollowers(nextFollowers);
      onChanged?.(nextFollowing, nextFollowers);
      toast({ description: nextFollowing ? 'Following this traveler.' : 'Unfollowed this traveler.' });
    } catch (error) {
      console.error('Failed to update follow', error);
      toast({ variant: 'destructive', description: 'Could not update follow. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={following ? 'outline' : 'default'} size={size} onClick={toggle} disabled={busy}>
      {following ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
      {following ? 'Following' : 'Follow'}
      <span className="ml-2 text-xs opacity-80">{followers}</span>
    </Button>
  );
}
