import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Megaphone, AlertTriangle, Info, Clock, CheckCircle2, Zap } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useBranch } from '../hooks/useBranch';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: string;
  content: string;
  priority: 'normal' | 'high';
  branch_location: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export function NewsTickerBar() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const { activeBranch } = useBranch();

  useEffect(() => {
    fetchActiveNews();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('news_updates_ticker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'news_updates'
        },
        () => {
          fetchActiveNews();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeBranch]);

  const fetchActiveNews = async () => {
    try {
      const now = new Date().toISOString();
      const currentBranch = typeof activeBranch === 'string' ? activeBranch : (activeBranch as any)?.name || 'calicut';

      const { data, error } = await supabase
        .from('news_updates')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('priority', { ascending: false }) // High priority first
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter by branch
      const filteredNews = (data || []).filter(item =>
        item.branch_location === currentBranch || item.branch_location === 'global'
      );

      setNewsItems(filteredNews as NewsItem[]);
    } catch (error) {
      console.error('Error fetching news:', error);
    }
  };

  const isNew = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  };

  if (newsItems.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-8 px-1">
      <div className="relative overflow-hidden rounded-2xl bg-[#e0e5ec] shadow-[9px_9px_16px_rgba(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.8)] border border-white/20">

        <div className="flex items-stretch h-14">
          {/* Live Badge Section - Gold/Yellow Theme */}
          <div className="relative z-10 flex items-center px-6 bg-gradient-to-r from-[#FFD700] via-[#FDB931] to-[#FFD700] shadow-[4px_0_15px_rgba(255,215,0,0.3)]">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-8 h-8">
                <div className="absolute inset-0 bg-yellow-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative z-10 bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-inner border border-white/40">
                  <Zap className="w-full h-full text-yellow-900 fill-yellow-900" strokeWidth={2.5} />
                </div>
              </div>
              <span className="text-yellow-950 font-black text-sm tracking-[0.2em] uppercase hidden sm:block drop-shadow-sm">
                FETS LIVE
              </span>
            </div>
            {/* Angled Divider */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-[#e0e5ec] translate-x-4 skew-x-12 opacity-90 blur-sm"></div>
          </div>

          {/* Ticker Content - Neumorphic Inset */}
          <div
            className="flex-1 flex items-center overflow-hidden relative shadow-[inset_3px_3px_6px_#bec3c9,inset_-3px_-3px_6px_#ffffff] bg-[#e0e5ec]/50"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <motion.div
              className="flex gap-16 px-8 whitespace-nowrap"
              animate={{
                x: isPaused ? 0 : [0, -1000]
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: Math.max(30, newsItems.length * 15), // Smoother scrolling
                  ease: "linear"
                }
              }}
            >
              {[...newsItems, ...newsItems, ...newsItems].map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="inline-flex items-center gap-4 group"
                >
                  {/* Priority Indicator - Neumorphic Pill */}
                  {item.priority === 'high' ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff] border border-red-200/30 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                      <AlertTriangle size={12} className="fill-red-600/20" />
                      Urgent
                    </span>
                  ) : isNew(item.created_at) ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff] border border-blue-200/30 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                      <Clock size={12} className="fill-blue-600/20" />
                      New
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0e5ec] shadow-[3px_3px_6px_#bec3c9,-3px_-3px_6px_#ffffff] border border-gray-200/30 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                      <Info size={12} />
                      Info
                    </span>
                  )}

                  {/* Content */}
                  <span className="text-gray-700 font-medium text-sm tracking-wide group-hover:text-amber-900 transition-colors cursor-pointer select-none">
                    {item.content}
                  </span>

                  {/* Separator - Small golden dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/30 shadow-[1px_1px_2px_rgba(0,0,0,0.1)]" />
                </div>
              ))}
            </motion.div>

            {/* Fade Gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#e0e5ec] via-[#e0e5ec]/80 to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#e0e5ec] via-[#e0e5ec]/80 to-transparent z-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
