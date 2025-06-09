
import React, { useState } from 'react';
import { 
  Share2, 
  Copy, 
  Facebook, 
  Twitter, 
  Mail, 
  Check,
  MessageSquare
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ShareJournalProps {
  journalId: string;
  title: string;
}

const ShareJournal: React.FC<ShareJournalProps> = ({ journalId, title }) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const journalUrl = `${window.location.origin}/journals/${journalId}`;
  const encodedUrl = encodeURIComponent(journalUrl);
  const encodedTitle = encodeURIComponent(title);
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(journalUrl)
      .then(() => {
        setCopied(true);
        toast({
          description: "Link copied to clipboard!",
        });
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        toast({
          variant: "destructive",
          description: "Failed to copy link. Please try again.",
        });
      });
  };

  const shareLinks = [
    {
      name: "Facebook",
      icon: <Facebook className="h-4 w-4 mr-2" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-[#3b5998] hover:bg-[#3b5998]/80"
    },
    {
      name: "Twitter",
      icon: <Twitter className="h-4 w-4 mr-2" />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(`📍 Travel Journal: ${title}\n🗺️ Explore this story now!`)}`,
      color: "bg-[#1DA1F2] hover:bg-[#1DA1F2]/80"
    },
    {
      name: "WhatsApp",
      icon: <MessageSquare className="h-4 w-4 mr-2" />,
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(`📌 *${title}*\n🌍 A travel experience worth checking:\n${journalUrl}`)}`,
      color: "bg-[#25D366] hover:bg-[#25D366]/80"
    },
    {
      name: "Email",
      icon: <Mail className="h-4 w-4 mr-2" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Hey! Check out this travel journal I found: ${journalUrl}\n\nLet me know what you think!`)}`,
      color: "bg-gray-500 hover:bg-gray-500/80"
    }
  ];
  

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Share2 className="h-4 w-4 mr-1" /> Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Share this travel journal</h4>
          
          <div className="flex items-center">
            <Input 
              readOnly 
              value={journalUrl} 
              className="flex-1 mr-2 text-xs" 
            />
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${link.color} text-white flex items-center justify-center p-2 rounded-md text-sm`}
              >
                {link.icon}
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ShareJournal;