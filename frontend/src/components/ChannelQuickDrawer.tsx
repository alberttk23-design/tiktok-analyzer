import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  ExternalLink,
  Calendar,
  Eye,
  Bookmark,
  Heart,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export interface MonthlyBreakdown {
  month: string;
  views: number;
  videos: number;
  avg_views: number;
}

export interface WinningVideo {
  video_id: string;
  url: string;
  caption: string;
  views: number;
  likes: number;
  saves: number;
  score: number;
  upload_date: string;
  sound_type?: string;
}

export interface ChannelAnalytics {
  creator: string;
  nickname: string;
  avatar_url?: string;
  follower_count: number;
  video_count: number;
  heart_count: number;
  signature?: string;
  email?: string;
  verified: boolean;
  growth_score: number;
  trend_status: 'surging' | 'growing' | 'stable' | 'cooling';
  trend_label: string;
  trend_color: string;
  recent_videos: number;
  recent_views: number;
  recent_avg_views: number;
  recent_max_views: number;
  prev_videos: number;
  prev_views: number;
  growth_rate_pct: number;
  is_breakout: boolean;
  viral_multiplier: number;
  monthly_breakdown: MonthlyBreakdown[];
  winning_videos: WinningVideo[];
  profile_url: string;
}

interface ChannelQuickDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  creatorName: string | null;
  keyword: string;
  onNavigateToTab2: (creatorName: string) => void;
}

export const ChannelQuickDrawer: React.FC<ChannelQuickDrawerProps> = ({
  isOpen,
  onClose,
  creatorName,
  keyword,
  onNavigateToTab2
}) => {
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | 'all'>('3m');
  const [loading, setLoading] = useState<boolean>(false);
  const [channelData, setChannelData] = useState<ChannelAnalytics | null>(null);

  useEffect(() => {
    if (!isOpen || !creatorName) {
      setChannelData(null);
      return;
    }

    const fetchCreatorDetails = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          keyword: keyword || '',
          timeframe: timeframe,
          min_videos: '1',
          limit: '150'
        });
        const res = await fetch(`/api/creators/trending-growth?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load creator growth data');
        const data = await res.json();
        const found = (data.creators || []).find(
          (c: any) => c.creator.toLowerCase() === creatorName.toLowerCase()
        );
        if (found) {
          setChannelData(found);
        } else {
          // If not in top filtered, fetch general creators endpoint as fallback
          const cRes = await fetch(`/api/creators?keyword=${encodeURIComponent(keyword || '')}`);
          if (cRes.ok) {
            const cData = await cRes.json();
            const fallback = (cData.creators || []).find(
              (c: any) => c.creator.toLowerCase() === creatorName.toLowerCase()
            );
            if (fallback) {
              setChannelData({
                creator: fallback.creator,
                nickname: fallback.nickname || fallback.creator,
                avatar_url: fallback.avatar_url || '',
                follower_count: fallback.follower_count || 0,
                video_count: fallback.video_count || 0,
                heart_count: fallback.heart_count || 0,
                signature: fallback.signature || '',
                email: fallback.email || '',
                verified: Boolean(fallback.verified),
                growth_score: 50,
                trend_status: 'stable',
                trend_label: '⚖️ Ổn Định',
                trend_color: 'slate',
                recent_videos: fallback.videos_in_niche || 1,
                recent_views: fallback.total_views || 0,
                recent_avg_views: fallback.avg_views || 0,
                recent_max_views: fallback.max_views || 0,
                prev_videos: 0,
                prev_views: 0,
                growth_rate_pct: 0,
                is_breakout: false,
                viral_multiplier: fallback.viral_multiplier || 1,
                monthly_breakdown: [],
                winning_videos: fallback.top_videos || [],
                profile_url: fallback.profile_url || `https://www.tiktok.com/@${fallback.creator}`
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching creator drawer data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatorDetails();
  }, [isOpen, creatorName, keyword, timeframe]);

  if (!isOpen || !creatorName) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide-over Drawer panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
          
          {/* DRAWER HEADER */}
          <div className="p-6 border-b border-slate-800/80 sticky top-0 bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <TrendingUp size={16} />
                <span>Phân Tích Kênh 1-Chạm (Quick Velocity)</span>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* CREATOR PROFILE HIGHLIGHT */}
            <div className="mt-4 flex items-center gap-3.5">
              {channelData?.avatar_url ? (
                <img
                  src={channelData.avatar_url}
                  alt={creatorName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500/40 bg-slate-950"
                  onError={(e: any) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${creatorName}&background=0f172a&color=10b981&bold=true`;
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-extrabold text-lg border-2 border-slate-700">
                  {creatorName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-black text-white truncate">
                    @{creatorName}
                  </h3>
                  {channelData?.verified && (
                    <CheckCircle2 size={16} className="text-sky-400" />
                  )}
                  {channelData?.trend_label && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {channelData.trend_label}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2.5">
                  {channelData?.nickname && (
                    <span className="text-slate-300 font-medium">{channelData.nickname}</span>
                  )}
                  <span>&bull;</span>
                  <span>
                    Follower: <strong className="font-mono text-white">{channelData?.follower_count ? channelData.follower_count.toLocaleString() : 'Chưa quét'}</strong>
                  </span>
                  {channelData?.viral_multiplier && channelData.viral_multiplier >= 3 && (
                    <>
                      <span>&bull;</span>
                      <span className="text-amber-400 font-mono font-bold">
                        💎 {channelData.viral_multiplier}x đòn bẩy
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* TIMEFRAME SELECTOR INSIDE DRAWER */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-xs text-slate-400 font-medium">Khung thời gian:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {(['1m', '3m', '6m', 'all'] as const).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      timeframe === tf
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tf === '1m' ? '1 Tháng' : tf === '3m' ? '3 Tháng' : tf === '6m' ? '6 Tháng' : '1 Năm'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* DRAWER BODY CONTENT */}
          <div className="p-6 space-y-6 flex-1">
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Đang tải lịch sử tăng trưởng kênh...</span>
              </div>
            ) : channelData ? (
              <>
                {/* METRICS GRID */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Views Kỳ Này</div>
                    <div className="text-base font-extrabold text-white font-mono mt-0.5">
                      {channelData.recent_views.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                      {channelData.recent_videos} video
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Views Kỳ Trước</div>
                    <div className="text-base font-extrabold text-slate-300 font-mono mt-0.5">
                      {channelData.prev_views > 0 ? channelData.prev_views.toLocaleString() : '0 (Mới)'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {channelData.prev_videos} video
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">% Tăng Trưởng</div>
                    <div
                      className={`text-base font-extrabold font-mono mt-0.5 ${
                        channelData.growth_rate_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {channelData.growth_rate_pct >= 0 ? '+' : ''}
                      {channelData.growth_rate_pct.toLocaleString()}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {channelData.is_breakout ? 'Breakout' : 'Vận tốc view'}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Điểm Vận Tốc</div>
                    <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
                      {channelData.growth_score} <span className="text-xs text-slate-500">/100</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Velocity Score
                    </div>
                  </div>
                </div>

                {/* MONTHLY VIEW PROGRESSION CHART */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Calendar size={14} className="text-emerald-400" />
                      <span>Biểu Đồ Đánh Giá Lượt View Từng Tháng</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {channelData.monthly_breakdown.length} mốc thời gian
                    </span>
                  </div>

                  {channelData.monthly_breakdown.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-slate-500 italic">
                      Chưa có đủ lịch sử theo tháng cho kênh này
                    </div>
                  ) : (
                    <div className="h-36 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={channelData.monthly_breakdown.map(m => ({
                            ...m,
                            viewsK: Math.round(m.views / 1000)
                          }))}
                          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                          <Tooltip
                            content={({ payload, label }) => {
                              if (!payload || payload.length === 0) return null;
                              const item = payload[0]?.payload || {};
                              return (
                                <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                  <div className="font-bold text-white flex justify-between gap-3 border-b border-slate-800 pb-1">
                                    <span>Tháng: {label}</span>
                                    <span className="text-emerald-400 font-mono">{item.videos} clip</span>
                                  </div>
                                  <div className="text-emerald-400 text-[11px]">
                                    👁️ Views: <strong className="font-mono text-white">{(item.views || 0).toLocaleString()}</strong>
                                  </div>
                                  <div className="text-sky-400 text-[10px]">
                                    ⚡ Avg/clip: <strong className="font-mono text-white">{(item.avg_views || 0).toLocaleString()}</strong>
                                  </div>
                                </div>
                              );
                            }}
                          />
                          <Bar dataKey="viewsK" radius={[4, 4, 0, 0]}>
                            {channelData.monthly_breakdown.map((_, idx) => (
                              <Cell
                                key={`cell-drw-${idx}`}
                                fill={
                                  idx === channelData.monthly_breakdown.length - 1
                                    ? '#10b981'
                                    : idx === channelData.monthly_breakdown.length - 2
                                    ? '#14b8a6'
                                    : '#0ea5e9'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* TOP WINNING CONTENT IN PERIOD */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Content Thắng Lớn Nhất ({channelData.winning_videos.length} clips)</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Kịch bản đã viral trong ngách</span>
                  </div>

                  <div className="space-y-2.5">
                    {channelData.winning_videos.map((vid, idx) => (
                      <a
                        key={vid.video_id || idx}
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-3.5 transition group"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                          <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                            <Eye size={12} />
                            <span>{vid.views.toLocaleString()} views</span>
                          </span>
                          <span className="text-slate-500 font-mono text-[10px]">{vid.upload_date}</span>
                        </div>
                        <p className="text-xs text-slate-300 line-clamp-2 group-hover:text-white transition">
                          {vid.caption || 'Video không có caption'}
                        </p>
                        <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-3 text-slate-400">
                            <span className="flex items-center gap-1">
                              <Heart size={11} className="text-rose-400" />
                              <span className="font-mono">{vid.likes.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Bookmark size={11} className="text-amber-400" />
                              <span className="font-mono">{vid.saves.toLocaleString()}</span>
                            </span>
                          </div>
                          <span className="text-emerald-400 font-bold flex items-center gap-0.5 text-[10px]">
                            <span>Xem clip</span>
                            <ExternalLink size={10} />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có dữ liệu phân tích chi tiết cho kênh này.
              </div>
            )}
          </div>

          {/* DRAWER FOOTER: JUMP TO TAB 2 BUTTON */}
          <div className="p-5 border-t border-slate-800 bg-slate-900/95 sticky bottom-0 z-10 flex items-center justify-between gap-3">
            <a
              href={`https://www.tiktok.com/@${creatorName}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Mở TikTok Profile</span>
              <ExternalLink size={13} />
            </a>

            <button
              onClick={() => {
                onClose();
                onNavigateToTab2(creatorName);
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Xem Đầy Đủ Ở Tab Trending (Tab 2)</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
export default ChannelQuickDrawer;
