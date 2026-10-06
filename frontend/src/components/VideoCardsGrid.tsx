import React, { useState, useMemo } from 'react';
import {
  Play,
  ExternalLink,
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  Clock,
  Search,
  TrendingUp,
  X,
  Volume2
} from 'lucide-react';

export interface VideoItem {
  id?: number;
  video_id: string;
  url: string;
  creator: string;
  caption: string;
  upload_date: string;
  duration_sec?: number;
  views: number;
  likes: number;
  comments: number;
  reposts?: number;
  saves: number;
  engagement_rate?: number;
  score?: number;
  creator_followers?: number;
  cover_url?: string;
  avatar_url?: string;
  sound_title?: string;
  sound_author?: string;
  sound_type?: string;
}

interface VideoCardsGridProps {
  videos: VideoItem[];
  keyword: string;
  isCrawling?: boolean;
  crawlProgress?: number;
  onSelectCreator: (creatorName: string) => void;
}

export const VideoCardsGrid: React.FC<VideoCardsGridProps> = ({
  videos,
  keyword,
  isCrawling = false,
  crawlProgress = 0,
  onSelectCreator
}) => {
  // Sort state: 'views' | 'comments' | 'saves' | 'likes' | 'recent'
  const [sortBy, setSortBy] = useState<'views' | 'comments' | 'saves' | 'likes' | 'recent'>('views');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);

  // Helper format view numbers (e.g. 22K, 1.2M)
  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return (num || 0).toLocaleString();
  };

  // Helper relative / friendly date
  const formatUploadDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (_) {}
    return dateStr;
  };

  // Filter and Sort videos
  const processedVideos = useMemo(() => {
    let list = [...videos];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        v =>
          v.caption.toLowerCase().includes(q) ||
          v.creator.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'views') return (b.views || 0) - (a.views || 0);
      if (sortBy === 'comments') return (b.comments || 0) - (a.comments || 0);
      if (sortBy === 'saves') return (b.saves || 0) - (a.saves || 0);
      if (sortBy === 'likes') return (b.likes || 0) - (a.likes || 0);
      if (sortBy === 'recent') {
        return (b.upload_date || '').localeCompare(a.upload_date || '');
      }
      return 0;
    });

    return list;
  }, [videos, searchQuery, sortBy]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOP CONTROL BAR: QUICK SORTS & SEARCH */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* SORT BUTTONS (User specified: Xem nhiều, Comment nhiều, Lưu nhiều, Tim nhiều, Mới đăng) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800/90">
            <button
              onClick={() => setSortBy('views')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'views'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Eye size={14} />
              <span>Xem nhiều</span>
            </button>

            <button
              onClick={() => setSortBy('comments')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'comments'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <MessageCircle size={14} />
              <span>Comment nhiều</span>
            </button>

            <button
              onClick={() => setSortBy('saves')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'saves'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Bookmark size={14} />
              <span>Lưu nhiều</span>
            </button>

            <button
              onClick={() => setSortBy('likes')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'likes'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Heart size={14} />
              <span>Tim nhiều</span>
            </button>

            <button
              onClick={() => setSortBy('recent')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                sortBy === 'recent'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Clock size={14} />
              <span>Mới đăng</span>
            </button>
          </div>

          {/* SEARCH & STATS COUNTER */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Lọc từ khoá, hashtag, kênh..."
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="bg-slate-950 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs font-mono font-bold text-emerald-400 whitespace-nowrap">
              {processedVideos.length} <span className="text-slate-500 font-normal">/ {videos.length} clip</span>
            </div>
          </div>
        </div>

        {/* LIVE STREAMING CRAWL PROGRESS INDICATOR */}
        {isCrawling && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 animate-in fade-in">
            <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5">
              <span className="flex items-center gap-2 font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>Đang cào video ngách "{keyword}" theo thời gian thực (Live Stream)...</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{crawlProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-300"
                style={{ width: `${crawlProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* EMPTY STATE */}
      {processedVideos.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-16 text-center text-slate-400">
          <Eye size={44} className="mx-auto mb-3 text-slate-600" />
          <h3 className="text-base font-bold text-white mb-1">Chưa có video nào phù hợp</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? 'Không tìm thấy video khớp với từ khoá tìm kiếm. Hãy thử từ khoá khác.'
              : 'Hãy nhập từ khoá ngách (ví dụ: "crochet kit") và bấm Cào Video để quét 100 video mới nhất.'}
          </p>
        </div>
      )}

      {/* VIDEO CARDS GRID (3-4 COLUMNS MATCHING USER'S IMAGE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {processedVideos.map((video, index) => {
          // Rank styling (gold, silver, bronze for top 3)
          const rank = index + 1;
          const rankBg =
            rank === 1
              ? 'bg-amber-500 text-slate-950 font-black'
              : rank === 2
              ? 'bg-slate-300 text-slate-950 font-black'
              : rank === 3
              ? 'bg-amber-700 text-white font-black'
              : 'bg-slate-800 text-slate-300 font-bold';

          // Duration fallback
          const durationStr = video.duration_sec ? `${video.duration_sec}s` : '15s';
          const friendlyDate = formatUploadDate(video.upload_date);

          return (
            <div
              key={video.video_id || index}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-200 flex flex-col group"
            >
              {/* CARD TOP INFO STRIP */}
              <div className="p-3.5 pb-2.5 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Rank Badge */}
                  <span className={`w-5 h-5 rounded-md text-[11px] font-mono flex items-center justify-center ${rankBg}`}>
                    {rank}
                  </span>

                  {/* Organic Badge */}
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[10px] font-bold">
                    Organic
                  </span>

                  {/* Upload Date */}
                  {friendlyDate && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Calendar size={11} className="text-slate-500" />
                      <span>{friendlyDate}</span>
                    </span>
                  )}
                </div>

                {/* Duration */}
                <span className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <Clock size={11} className="text-slate-500" />
                  <span>{durationStr}</span>
                </span>
              </div>

              {/* PROMINENT VIEWS BADGE */}
              <div className="px-3.5 pb-2">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-slate-200 text-xs font-bold font-mono">
                  <Eye size={13} className="text-emerald-400" />
                  <span>{formatCompact(video.views)}</span>
                  <span className="text-[10px] text-slate-500 font-normal ml-0.5">views</span>
                </div>
              </div>

              {/* VIDEO THUMBNAIL / PREVIEW AREA */}
              <div className="relative aspect-[9/14] bg-slate-950 overflow-hidden mx-3 rounded-2xl border border-slate-800/70 flex items-center justify-center">
                {/* Video Cover Image */}
                {video.cover_url ? (
                  <img
                    src={video.cover_url}
                    alt={video.caption || video.creator}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e: any) => {
                      e.target.onerror = null;
                      // Fallback to keyframe if available
                      e.target.src = `/api/keyframe/${video.video_id}_kf1.jpg`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                      <Play size={20} className="ml-0.5" />
                    </div>
                    <span className="text-xs text-slate-400 font-bold">TikTok Video</span>
                    <span className="text-[10px] text-slate-600 font-mono mt-0.5">@{video.creator}</span>
                  </div>
                )}

                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-transparent to-slate-950/40 pointer-events-none" />

                {/* CENTER PLAY BUTTON (CLICK TO WATCH IN-APP MODAL) */}
                <button
                  onClick={() => setPlayingVideo(video)}
                  title="Nhấp để phát video trực tiếp trên app"
                  className="absolute inset-0 m-auto w-13 h-13 rounded-full bg-slate-950/70 hover:bg-emerald-500 text-white hover:text-slate-950 border border-white/20 hover:border-emerald-400 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer group/btn"
                >
                  <Play size={22} className="ml-0.5 fill-current transition-colors" />
                </button>

                {/* RIGHT SIDEBAR ACTIONS (LIKE TIKTOK NATIVE UI) */}
                <div className="absolute right-2 bottom-12 flex flex-col items-center gap-2.5 text-white z-10">
                  {/* Likes */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-slate-950/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      <Heart size={13} className="text-rose-400 fill-rose-400/30" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5 font-bold drop-shadow">
                      {formatCompact(video.likes)}
                    </span>
                  </div>

                  {/* Comments */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-slate-950/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      <MessageCircle size={13} className="text-sky-400" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5 font-bold drop-shadow">
                      {formatCompact(video.comments)}
                    </span>
                  </div>

                  {/* Saves */}
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-slate-950/60 backdrop-blur-sm flex items-center justify-center border border-white/10">
                      <Bookmark size={13} className="text-amber-400 fill-amber-400/30" />
                    </div>
                    <span className="text-[9px] font-mono mt-0.5 font-bold drop-shadow">
                      {formatCompact(video.saves)}
                    </span>
                  </div>

                  {/* Open Native TikTok Link */}
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Mở video gốc trên TikTok"
                    className="w-7 h-7 rounded-full bg-slate-950/60 hover:bg-emerald-500 backdrop-blur-sm flex items-center justify-center border border-white/10 hover:text-slate-950 transition cursor-pointer"
                  >
                    <ExternalLink size={12} />
                  </a>
                </div>

                {/* BOTTOM OVERLAY INFO (USERNAME + CAPTION + SOUND) */}
                <div className="absolute left-3 right-12 bottom-2 text-left z-10">
                  <button
                    onClick={() => onSelectCreator(video.creator)}
                    className="font-extrabold text-white text-xs hover:text-emerald-400 transition flex items-center gap-1 cursor-pointer text-left truncate drop-shadow"
                  >
                    <span>@{video.creator}</span>
                  </button>

                  <p className="text-[11px] text-slate-200 line-clamp-2 mt-1 leading-snug drop-shadow-sm font-normal">
                    {video.caption || 'Video không có caption'}
                  </p>

                  {video.sound_title && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-300 mt-1 truncate">
                      <Volume2 size={10} className="text-emerald-400 flex-shrink-0" />
                      <span className="truncate">{video.sound_title}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CARD FOOTER: CHANNEL PROFILE BAR (CLICK TO OPEN DRAWER) */}
              <div
                onClick={() => onSelectCreator(video.creator)}
                className="p-3.5 mt-auto flex items-center justify-between gap-2.5 hover:bg-slate-800/50 transition cursor-pointer border-t border-slate-800/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {video.avatar_url ? (
                    <img
                      src={video.avatar_url}
                      alt={video.creator}
                      className="w-7 h-7 rounded-full object-cover border border-slate-700 bg-slate-950 flex-shrink-0"
                      onError={(e: any) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${video.creator}&background=0f172a&color=10b981&bold=true`;
                      }}
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white text-[10px] font-bold border border-slate-700 flex-shrink-0">
                      {video.creator.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate group-hover:text-emerald-400 transition flex items-center gap-1">
                      <span>@{video.creator}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {video.creator_followers ? `${formatCompact(video.creator_followers)} flw` : 'Xem kênh'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-emerald-400 transition">
                  <TrendingUp size={14} />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* IN-APP VIDEO PLAYER MODAL (TIKTOK EMBED PLAYER) */}
      {playingVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={() => setPlayingVideo(null)}
          />

          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => {
                    const c = playingVideo.creator;
                    setPlayingVideo(null);
                    onSelectCreator(c);
                  }}
                  className="font-bold text-sm text-white hover:text-emerald-400 transition truncate flex items-center gap-1"
                >
                  <span>@{playingVideo.creator}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={playingVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  title="Mở tab TikTok gốc"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => setPlayingVideo(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Embedded TikTok Player */}
            <div className="aspect-[9/16] w-full bg-black relative flex items-center justify-center">
              <iframe
                src={`https://www.tiktok.com/embed/v2/${playingVideo.video_id}?lang=vi-VN`}
                title={playingVideo.caption || 'TikTok video player'}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3 text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Eye size={12} />
                  <span>{formatCompact(playingVideo.views)}</span>
                </span>
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart size={12} />
                  <span>{formatCompact(playingVideo.likes)}</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <Bookmark size={12} />
                  <span>{formatCompact(playingVideo.saves)}</span>
                </span>
              </div>

              <button
                onClick={() => {
                  const c = playingVideo.creator;
                  setPlayingVideo(null);
                  onSelectCreator(c);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <span>Phân tích kênh</span>
                <TrendingUp size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default VideoCardsGrid;
