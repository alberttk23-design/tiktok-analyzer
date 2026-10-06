import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  Flame,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronRight,
  BarChart2,
  Video,
  Eye,
  Bookmark,
  Heart,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Search,
  DollarSign,
  Save,
  Clock,
  Layers,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
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

export interface TrendingCreator {
  creator: string;
  nickname: string;
  avatar_url?: string;
  follower_count: number;
  video_count: number;
  heart_count: number;
  signature?: string;
  email?: string;
  verified: boolean;
  booking_status: string;
  booking_notes: string;
  booking_price: number;
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

export interface AggregateMonthly {
  month: string;
  total_views: number;
  total_videos: number;
  active_creators: number;
}

interface TrendingGrowthTabProps {
  keyword: string;
  onNavigateToBookingCRM?: (creatorName: string) => void;
  onUpdateCreatorBooking?: (creator: string, status: string, price: number, notes: string) => Promise<void>;
}

export const TrendingGrowthTab: React.FC<TrendingGrowthTabProps> = ({
  keyword,
  onNavigateToBookingCRM,
  onUpdateCreatorBooking
}) => {
  const [timeframe, setTimeframe] = useState<'1m' | '3m' | '6m' | 'all'>('3m');
  const [minVideos, setMinVideos] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'growth_score' | 'recent_views' | 'growth_rate_pct' | 'viral_multiplier'>('growth_score');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [creators, setCreators] = useState<TrendingCreator[]>([]);
  const [aggregateMonthly, setAggregateMonthly] = useState<AggregateMonthly[]>([]);
  const [anchorDate, setAnchorDate] = useState<string>('');
  const [recentPeriod, setRecentPeriod] = useState<string>('');
  const [prevPeriod, setPrevPeriod] = useState<string>('');
  const [totalCreatorsCount, setTotalCreatorsCount] = useState<number>(0);

  // Quick edit states for CRM
  const [editingCreator, setEditingCreator] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<string>('new');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');
  const [savingCreator, setSavingCreator] = useState<string | null>(null);

  // Fetch Trending & Growth Data from API
  const fetchTrendingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        keyword: keyword || '',
        timeframe: timeframe,
        min_videos: String(minVideos),
        sort_by: sortBy,
        limit: '60'
      });
      const res = await fetch(`/api/creators/trending-growth?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();

      setCreators(data.creators || []);
      setAggregateMonthly(data.aggregate_monthly || []);
      setAnchorDate(data.anchor_date || '');
      setRecentPeriod(data.recent_period || '');
      setPrevPeriod(data.prev_period || '');
      setTotalCreatorsCount(data.total_creators || 0);
    } catch (err: any) {
      console.error('Error fetching trending growth data:', err);
      setError('Không thể tải dữ liệu tăng trưởng kênh. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendingData();
  }, [keyword, timeframe, minVideos, sortBy]);

  // Handle inline CRM quick save
  const handleSaveBooking = async (creatorName: string) => {
    setSavingCreator(creatorName);
    try {
      if (onUpdateCreatorBooking) {
        await onUpdateCreatorBooking(creatorName, editStatus, editPrice, editNotes);
      } else {
        const res = await fetch(`/api/creators/${creatorName}/booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_status: editStatus,
            booking_price: editPrice,
            booking_notes: editNotes
          })
        });
        if (!res.ok) throw new Error('Cập nhật booking thất bại');
      }

      // Update local state
      setCreators(prev =>
        prev.map(c =>
          c.creator === creatorName
            ? { ...c, booking_status: editStatus, booking_price: editPrice, booking_notes: editNotes }
            : c
        )
      );
      setEditingCreator(null);
    } catch (e) {
      console.error(e);
      alert('Có lỗi khi lưu thông tin booking.');
    } finally {
      setSavingCreator(null);
    }
  };

  // Filter creators by search term
  const filteredCreators = useMemo(() => {
    if (!searchTerm.trim()) return creators;
    const term = searchTerm.toLowerCase();
    return creators.filter(
      c =>
        c.creator.toLowerCase().includes(term) ||
        (c.nickname && c.nickname.toLowerCase().includes(term))
    );
  }, [creators, searchTerm]);

  // Compute KPI Highlights
  const kpis = useMemo(() => {
    if (creators.length === 0) {
      return {
        topSurgingCreator: null,
        totalPeriodViews: 0,
        activeCreatorsCount: 0,
        breakoutCount: 0
      };
    }
    const topSurging = [...creators].sort((a, b) => b.growth_rate_pct - a.growth_rate_pct)[0];
    const totalViews = creators.reduce((acc, c) => acc + (c.recent_views || 0), 0);
    const breakouts = creators.filter(c => c.is_breakout).length;
    return {
      topSurgingCreator: topSurging,
      totalPeriodViews: totalViews,
      activeCreatorsCount: totalCreatorsCount || creators.length,
      breakoutCount: breakouts
    };
  }, [creators, totalCreatorsCount]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* HEADER & TIME HORIZON FILTER BAR */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-l from-emerald-500/10 via-teal-500/5 to-transparent blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
                <TrendingUp size={24} />
              </span>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>📈 Xu Hướng & Tốc Độ Tăng Trưởng Kênh</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Channel Velocity
                  </span>
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Đo lường nhịp tăng view theo tháng &bull; Phát hiện kênh bứt phá &bull; Lọc ra content đang build tốt trong ngách <strong className="text-emerald-400">"{keyword}"</strong>
                </p>
              </div>
            </div>
          </div>

          {/* TIMEFRAME SELECTOR BUTTONS */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 border border-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setTimeframe('1m')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeframe === '1m'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Clock size={14} />
              <span>1 Tháng (30 Ngày)</span>
            </button>

            <button
              onClick={() => setTimeframe('3m')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeframe === '3m'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Flame size={14} />
              <span>3 Tháng (90 Ngày)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 font-mono">Chuẩn</span>
            </button>

            <button
              onClick={() => setTimeframe('6m')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeframe === '6m'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers size={14} />
              <span>6 Tháng (180 Ngày)</span>
            </button>

            <button
              onClick={() => setTimeframe('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <span>Toàn Bộ (1 Năm)</span>
            </button>
          </div>
        </div>

        {/* TIME HORIZON CONTEXT & FILTER STRIP */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-3">
            <span className="bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-[11px] text-slate-300 flex items-center gap-1.5">
              <Calendar size={13} className="text-emerald-400" />
              <span>Kỳ đánh giá: <strong className="text-white">{recentPeriod}</strong></span>
            </span>
            <span className="text-slate-500 hidden sm:inline">&bull;</span>
            <span className="text-slate-400">
              Đối chứng kỳ trước: <span className="font-mono text-slate-300">{prevPeriod}</span>
            </span>
            {anchorDate && (
              <>
                <span className="text-slate-500 hidden sm:inline">&bull;</span>
                <span className="text-slate-400">
                  Cập nhật đến: <span className="font-mono text-emerald-400">{anchorDate}</span>
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Tìm kênh / creator..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-44"
              />
            </div>

            {/* Min Videos Filter */}
            <select
              value={minVideos}
              onChange={e => setMinVideos(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value={1}>Tất cả (≥ 1 clip)</option>
              <option value={2}>Đang build đều (≥ 2 clips)</option>
              <option value={3}>Ra video liên tục (≥ 3 clips)</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="growth_score">Xếp theo: Điểm Vận Tốc (Score)</option>
              <option value="recent_views">Xếp theo: Lượt View Kỳ Này</option>
              <option value="growth_rate_pct">Xếp theo: % Tăng Trưởng</option>
              <option value="viral_multiplier">Xếp theo: Đòn Bẩy Outlier (x)</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI HIGHLIGHTS SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: TOP SURGING CREATOR */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Flame size={15} />
              <span>Bứt Phá Nhanh Nhất</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-mono">
              +{kpis.topSurgingCreator?.growth_rate_pct.toLocaleString()}%
            </span>
          </div>
          {kpis.topSurgingCreator ? (
            <div>
              <div className="font-extrabold text-white text-base truncate flex items-center gap-1.5">
                <span>@{kpis.topSurgingCreator.creator}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{kpis.topSurgingCreator.recent_views.toLocaleString()} views kỳ này</span>
                <span className="text-emerald-400 font-mono font-bold">
                  {kpis.topSurgingCreator.recent_videos} video
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500">Đang quét...</div>
          )}
        </div>

        {/* KPI 2: TOTAL PERIOD VIEWS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-sky-400 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Eye size={15} />
              <span>Tổng Views Đã Tạo Trong Kỳ</span>
            </span>
          </div>
          <div className="font-extrabold text-2xl text-white font-mono">
            {kpis.totalPeriodViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Lưu lượng xem tích lũy từ các clip ra mắt trong kỳ
          </p>
        </div>

        {/* KPI 3: ACTIVE CREATORS IN PERIOD */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Video size={15} />
              <span>Creator Đang Xây Content</span>
            </span>
          </div>
          <div className="font-extrabold text-2xl text-white font-mono">
            {kpis.activeCreatorsCount} <span className="text-sm font-normal text-slate-400">kênh</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Có video xuất bản trong khung thời gian đã chọn
          </p>
        </div>

        {/* KPI 4: BREAKOUT SURGING CHANNELS */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs text-amber-400 font-bold mb-2">
            <span className="flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>Kênh Bùng Nổ Mới (Breakout)</span>
            </span>
          </div>
          <div className="font-extrabold text-2xl text-white font-mono">
            {kpis.breakoutCount} <span className="text-sm font-normal text-slate-400">kênh mới</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Kỳ trước chưa có view, kỳ này nổ view đột biến
          </p>
        </div>
      </div>

      {/* MACRO AGGREGATE MONTHLY VIEW PROGRESSION CHART */}
      {aggregateMonthly.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="text-emerald-400" size={18} />
                <span>Biểu Đồ Đánh Giá Lượt View Toàn Ngách Theo Từng Tháng</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Quan sát nhịp độ tạo view và độ nóng của từ khoá theo từng mốc tháng upload
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                <span>Lượt Views (k)</span>
              </span>
              <span className="flex items-center gap-1.5 text-sky-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                <span>Số Lượng Video</span>
              </span>
            </div>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={aggregateMonthly.map(item => ({
                  ...item,
                  viewsK: Math.round((item.total_views || 0) / 1000)
                }))}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendingViewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload || payload.length === 0) return null;
                    const item = payload[0]?.payload || {};
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-2xl shadow-2xl text-xs space-y-1.5 min-w-[190px]">
                        <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                          <span>Tháng: {label}</span>
                          <span className="text-emerald-400 font-mono">{item.total_videos} video</span>
                        </div>
                        <div className="text-emerald-400 text-[11px]">
                          👁️ Tổng Views: <strong className="font-mono text-white">{(item.total_views || 0).toLocaleString()}</strong>
                        </div>
                        <div className="text-sky-400 text-[11px]">
                          👥 Kênh Hoạt Động: <strong className="font-mono text-white">{item.active_creators} kênh</strong>
                        </div>
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="viewsK"
                  name="Lượt Xem (k)"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#trendingViewsGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CREATOR LIST HEADER */}
      <div className="flex items-center justify-between text-sm text-slate-300 px-1 pt-2">
        <div className="flex items-center gap-2">
          <Award className="text-amber-400" size={18} />
          <span className="font-bold text-white">Bảng Xếp Hạng Kênh Tăng Trưởng & Content Đang Build Ngon</span>
          <span className="text-xs text-slate-500 font-mono">({filteredCreators.length} kết quả)</span>
        </div>
        {loading && (
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium animate-pulse">
            <Sparkles size={14} />
            <span>Đang cập nhật chỉ số...</span>
          </div>
        )}
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && filteredCreators.length === 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <TrendingUp size={44} className="mx-auto mb-3 text-slate-600" />
          <h4 className="text-base font-bold text-white mb-1">Không tìm thấy kênh phù hợp</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Hãy thử mở rộng khung thời gian sang 3 Tháng hoặc 6 Tháng, hoặc giảm điều kiện số lượng video tối thiểu.
          </p>
        </div>
      )}

      {/* CREATOR CARDS LIST */}
      <div className="space-y-5">
        {filteredCreators.map((creator, index) => {
          const isSurging = creator.trend_status === 'surging';
          const isGrowing = creator.trend_status === 'growing';
          const isEditing = editingCreator === creator.creator;

          return (
            <div
              key={creator.creator}
              className={`bg-slate-900/85 border rounded-3xl p-5 md:p-6 shadow-xl transition-all duration-200 ${
                isSurging
                  ? 'border-emerald-500/40 hover:border-emerald-400 shadow-emerald-950/20'
                  : isGrowing
                  ? 'border-teal-500/30 hover:border-teal-400'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* TOP ROW: PROFILE HEADER + GROWTH SCORE BADGE */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {creator.avatar_url ? (
                      <img
                        src={creator.avatar_url}
                        alt={creator.creator}
                        className="w-13 h-13 rounded-2xl object-cover border-2 border-slate-700 bg-slate-950"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = `https://ui-avatars.com/api/?name=${creator.creator}&background=0f172a&color=10b981&bold=true`;
                        }}
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-extrabold text-base border-2 border-slate-700">
                        {creator.creator.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 flex items-center justify-center">
                      #{index + 1}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <a
                        href={creator.profile_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-extrabold text-white text-base hover:text-emerald-400 transition flex items-center gap-1 group"
                      >
                        <span>@{creator.creator}</span>
                        <ExternalLink size={13} className="text-slate-500 group-hover:text-emerald-400 transition" />
                      </a>

                      {creator.verified && (
                        <span className="text-sky-400" title="Đã xác minh TikTok">
                          <CheckCircle2 size={15} />
                        </span>
                      )}

                      {/* Status / Momentum Badge */}
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold border flex items-center gap-1 ${
                          isSurging
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isGrowing
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700'
                        }`}
                      >
                        <span>{creator.trend_label}</span>
                      </span>

                      {/* Outlier leverage badge */}
                      {creator.viral_multiplier >= 5 && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                          💎 {creator.viral_multiplier}x đòn bẩy
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                      {creator.nickname && (
                        <span className="text-slate-300 font-medium">{creator.nickname}</span>
                      )}
                      <span>&bull;</span>
                      <span>
                        Followers: <strong className="font-mono text-white">{creator.follower_count ? creator.follower_count.toLocaleString() : 'Chưa quét'}</strong>
                      </span>
                      {creator.email && (
                        <>
                          <span>&bull;</span>
                          <span className="text-emerald-400 font-mono">✉️ {creator.email}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* GROWTH SCORE & CRM STATUS PILL */}
                <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-3.5 py-2 text-right">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Điểm Tăng Trưởng
                    </div>
                    <div className="text-lg font-black text-emerald-400 font-mono leading-none mt-0.5">
                      {creator.growth_score} <span className="text-xs text-slate-500 font-normal">/100</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onNavigateToBookingCRM) {
                        onNavigateToBookingCRM(creator.creator);
                      } else {
                        setEditingCreator(isEditing ? null : creator.creator);
                        setEditStatus(creator.booking_status || 'new');
                        setEditPrice(creator.booking_price || 0);
                        setEditNotes(creator.booking_notes || '');
                      }
                    }}
                    className="px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>CRM: {creator.booking_status || 'new'}</span>
                    <ChevronRight size={14} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* MIDDLE ROW: GROWTH METRICS + MONTHLY VIEW BREAKDOWN CHART */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 py-4 items-center">
                {/* 5-COLUMN METRICS STRIP */}
                <div className="xl:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Views Kỳ Này</div>
                    <div className="text-base font-extrabold text-white font-mono mt-0.5">
                      {creator.recent_views.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
                      {creator.recent_videos} video trong kỳ
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Views Kỳ Trước</div>
                    <div className="text-base font-extrabold text-slate-300 font-mono mt-0.5">
                      {creator.prev_views > 0 ? creator.prev_views.toLocaleString() : '0 (Mới)'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                      {creator.prev_videos} video kỳ trước
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Tốc Độ Tăng</div>
                    <div
                      className={`text-base font-extrabold font-mono mt-0.5 ${
                        creator.growth_rate_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {creator.growth_rate_pct >= 0 ? '+' : ''}
                      {creator.growth_rate_pct.toLocaleString()}%
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {creator.is_breakout ? 'Breakout mới' : 'So kỳ trước'}
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Avg Views / Clip</div>
                    <div className="text-base font-extrabold text-sky-400 font-mono mt-0.5">
                      {creator.recent_avg_views.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      Hiệu suất trung bình
                    </div>
                  </div>
                </div>

                {/* MONTHLY VIEW PROGRESSION MINI-CHART (BIỂU ĐỒ VIEW TỪNG THÁNG CHO KÊNH) */}
                <div className="xl:col-span-6 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <BarChart2 size={14} className="text-emerald-400" />
                      <span>Đánh Giá Lượt View Từng Tháng ({creator.monthly_breakdown.length} mốc)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {creator.monthly_breakdown.map(m => m.month).join(' ➔ ')}
                    </span>
                  </div>

                  {creator.monthly_breakdown.length === 0 ? (
                    <div className="h-20 flex items-center justify-center text-xs text-slate-500">
                      Chưa đủ dữ liệu mốc tháng
                    </div>
                  ) : (
                    <div className="h-24 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={creator.monthly_breakdown.map(m => ({
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
                            {creator.monthly_breakdown.map((_, idx) => (
                              <Cell
                                key={`cell-${idx}`}
                                fill={
                                  idx === creator.monthly_breakdown.length - 1
                                    ? '#10b981'
                                    : idx === creator.monthly_breakdown.length - 2
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
              </div>

              {/* BOTTOM ROW: CONTENT ĐANG BUILD NGON (TOP WINNING CONTENT IN PERIOD) */}
              <div className="pt-3 border-t border-slate-800/60">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span>Content Đang Build Ngon Trong Kỳ ({creator.winning_videos.length} clip tiêu biểu)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Bấm để mở trực tiếp kịch bản video trên TikTok
                  </span>
                </div>

                {creator.winning_videos.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-2">
                    Không có clip ghi nhận trong khung thời gian này.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {creator.winning_videos.map((vid, vIdx) => (
                      <a
                        key={vid.video_id || vIdx}
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-950/70 border border-slate-800/80 hover:border-emerald-500/60 rounded-2xl p-3.5 transition group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                            <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                              <Eye size={12} />
                              <span>{vid.views.toLocaleString()}</span>
                            </span>

                            <div className="flex items-center gap-2">
                              {vid.sound_type && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1">
                                  <Volume2 size={10} className="text-sky-400" />
                                  <span>{vid.sound_type === 'voiceover' ? 'Voiceover' : vid.sound_type === 'music_only' ? 'Music' : vid.sound_type}</span>
                                </span>
                              )}
                              <span className="text-slate-500 font-mono text-[10px]">{vid.upload_date}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed group-hover:text-white transition">
                            {vid.caption || 'Video không có caption mô tả'}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Heart size={11} className="text-rose-400" />
                              <span className="font-mono">{vid.likes.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Bookmark size={11} className="text-amber-400" />
                              <span className="font-mono">{vid.saves.toLocaleString()}</span>
                            </span>
                          </div>
                          <span className="text-emerald-400 group-hover:translate-x-0.5 transition font-bold flex items-center gap-0.5 text-[10px]">
                            <span>Xem clip</span>
                            <ExternalLink size={10} />
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* INLINE CRM QUICK EDIT DRAWER */}
              {isEditing && (
                <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/90 rounded-2xl p-4 animate-in fade-in duration-200">
                  <div className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                    <DollarSign size={14} className="text-amber-400" />
                    <span>Cập nhật nhanh trạng thái Booking & CRM cho @{creator.creator}:</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Trạng thái hợp tác:</label>
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="new">🆕 Mới phát hiện (New)</option>
                        <option value="contacted">📩 Đã liên hệ (Contacted)</option>
                        <option value="negotiating">💬 Đang đàm phán (Negotiating)</option>
                        <option value="sent_sample">📦 Đã gửi mẫu thử (Sent Sample)</option>
                        <option value="published">🎬 Đã lên video (Published)</option>
                        <option value="rejected">❌ Từ chối / Không hợp (Rejected)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Giá deal dự kiến ($):</label>
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(Number(e.target.value))}
                        placeholder="50"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Ghi chú deal / mẫu:</label>
                      <input
                        type="text"
                        value={editNotes}
                        onChange={e => setEditNotes(e.target.value)}
                        placeholder="Ghi chú kịch bản, gửi cây 5ft..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      onClick={() => setEditingCreator(null)}
                      className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleSaveBooking(creator.creator)}
                      disabled={savingCreator === creator.creator}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Save size={13} />
                      <span>{savingCreator === creator.creator ? 'Đang lưu...' : 'Lưu Booking'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default TrendingGrowthTab;
