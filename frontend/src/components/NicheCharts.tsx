import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Flame,
  BarChart3,
  Calendar,
  Sparkles,
  Volume2
} from 'lucide-react';

interface VideoItem {
  video_id: string;
  creator: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  upload_date?: string;
  duration_sec?: number;
  url?: string;
  caption?: string;
  sound_type?: string;
  score?: number;
}

interface ReviewItem {
  video_id: string;
  viral_score?: number;
  hook_score?: number;
  conversion_score?: number;
  ad_angle?: string;
  hook?: string;
}

interface NicheChartsProps {
  videos: VideoItem[];
  reviews?: ReviewItem[];
  keyword: string;
}

export const NicheCharts: React.FC<NicheChartsProps> = ({ videos = [], reviews = [], keyword }) => {
  const [activeChartTab, setActiveChartTab] = useState<'matrix' | 'timeline' | 'angles' | 'audio'>('matrix');

  // Map reviews by video_id for fast lookup
  const reviewsMap = useMemo(() => {
    const map = new Map<string, ReviewItem>();
    reviews.forEach((r) => map.set(r.video_id, r));
    return map;
  }, [reviews]);

  // 1. Data for Scatter Plot (Views vs Saves Matrix)
  const scatterData = useMemo(() => {
    return videos
      .filter((v) => (v.views || 0) > 0)
      .map((v) => {
        const rev = reviewsMap.get(v.video_id);
        const saveRate = v.views > 0 ? (v.saves / v.views) * 100 : 0;
        const engRate = v.views > 0 ? ((v.likes + v.comments) / v.views) * 100 : 0;
        
        let category = 'standard';
        if (saveRate >= 1.2 && v.views >= 100000) {
          category = 'gold'; // High views + High saves
        } else if (saveRate >= 1.2) {
          category = 'gem'; // Lower views + Very high saves (Buyer Intent)
        } else if (v.views >= 300000) {
          category = 'viral'; // High views + Average saves
        }

        return {
          id: v.video_id,
          creator: v.creator || 'creator',
          views: v.views,
          saves: v.saves,
          likes: v.likes,
          comments: v.comments,
          saveRate: parseFloat(saveRate.toFixed(2)),
          engRate: parseFloat(engRate.toFixed(2)),
          viewsK: Math.round(v.views / 1000),
          caption: v.caption ? (v.caption.length > 70 ? v.caption.slice(0, 70) + '...' : v.caption) : '',
          url: v.url || `https://www.tiktok.com/@${v.creator}/video/${v.video_id}`,
          adAngle: rev?.ad_angle || 'DTC Angle',
          category
        };
      });
  }, [videos, reviewsMap]);

  // 2. Data for Timeline Trend (Upload Date Series)
  const timelineData = useMemo(() => {
    const monthMap = new Map<string, { month: string; totalViews: number; totalSaves: number; count: number }>();
    
    videos.forEach((v) => {
      if (!v.upload_date) return;
      const m = v.upload_date.slice(0, 7); // 'YYYY-MM'
      if (!m || m.length !== 7) return;

      const curr = monthMap.get(m) || { month: m, totalViews: 0, totalSaves: 0, count: 0 };
      curr.totalViews += v.views || 0;
      curr.totalSaves += v.saves || 0;
      curr.count += 1;
      monthMap.set(m, curr);
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        month: item.month,
        viewsK: Math.round(item.totalViews / 1000),
        saves: item.totalSaves,
        avgSaveRate: item.totalViews > 0 ? parseFloat(((item.totalSaves / item.totalViews) * 100).toFixed(2)) : 0,
        count: item.count
      }));
  }, [videos]);

  // 3. Data for Ad Angles & Hook Categories
  const angleData = useMemo(() => {
    const angleMap = new Map<string, { angle: string; count: number; totalViews: number; totalSaves: number }>();

    videos.forEach((v) => {
      const rev = reviewsMap.get(v.video_id);
      const angle = rev?.ad_angle || 'Organic / Lifestyle';
      const curr = angleMap.get(angle) || { angle, count: 0, totalViews: 0, totalSaves: 0 };
      curr.count += 1;
      curr.totalViews += v.views || 0;
      curr.totalSaves += v.saves || 0;
      angleMap.set(angle, curr);
    });

    return Array.from(angleMap.values())
      .map((a) => ({
        angle: a.angle,
        count: a.count,
        avgViewsK: a.count > 0 ? Math.round(a.totalViews / a.count / 1000) : 0,
        avgSaves: a.count > 0 ? Math.round(a.totalSaves / a.count) : 0,
        avgSaveRate: a.totalViews > 0 ? parseFloat(((a.totalSaves / a.totalViews) * 100).toFixed(2)) : 0
      }))
      .sort((a, b) => b.avgSaves - a.avgSaves)
      .slice(0, 6);
  }, [videos, reviewsMap]);

  // 4. Data for Audio Benchmark
  const audioData = useMemo(() => {
    const typeMap = new Map<string, { label: string; count: number; totalViews: number; totalSaves: number }>();
    const labels: Record<string, string> = {
      voiceover: '🎙️ Voiceover',
      voice_with_music: '🎧 Voice + BGM',
      music_only: '🎵 Nhạc Trend',
      asmr: '🤫 ASMR'
    };

    videos.forEach((v) => {
      const st = v.sound_type || 'voiceover';
      const label = labels[st] || 'Khác';
      const curr = typeMap.get(label) || { label, count: 0, totalViews: 0, totalSaves: 0 };
      curr.count += 1;
      curr.totalViews += v.views || 0;
      curr.totalSaves += v.saves || 0;
      typeMap.set(label, curr);
    });

    return Array.from(typeMap.values()).map((a) => ({
      name: a.label,
      count: a.count,
      avgViewsK: a.count > 0 ? Math.round(a.totalViews / a.count / 1000) : 0,
      avgSaves: a.count > 0 ? Math.round(a.totalSaves / a.count) : 0,
      avgSaveRate: a.totalViews > 0 ? parseFloat(((a.totalSaves / a.totalViews) * 100).toFixed(2)) : 0
    }));
  }, [videos]);

  // Colors for scatter points
  const goldPoints = scatterData.filter((d) => d.category === 'gold');
  const gemPoints = scatterData.filter((d) => d.category === 'gem');
  const viralPoints = scatterData.filter((d) => d.category === 'viral');
  const standardPoints = scatterData.filter((d) => d.category === 'standard');

  const COLORS = ['#10b981', '#38bdf8', '#a855f7', '#f43f5e', '#f59e0b'];

  return (
    <div className="space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 size={16} />
            <span>Trung Tâm Phân Tích Biểu Đồ Trực Quan (Interactive Data Visualizer)</span>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {videos.length} Videos Analyzed
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            Bản Đồ Dữ Liệu & Điểm Đột Biến Ngách "{keyword.toUpperCase()}"
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Xác định ngay video nào có tỷ lệ lưu mua hàng cao nhất, kịch bản nào chuyển đổi mạnh nhất và xu hướng ngách đang tăng hay giảm.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveChartTab('matrix')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeChartTab === 'matrix'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={14} />
            <span>Ma Trận Chốt Đơn (Scatter)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeChartTab === 'timeline'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar size={14} />
            <span>Xu Hướng Tháng (Trend)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('angles')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeChartTab === 'angles'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles size={14} />
            <span>Góc Kịch Bản (Angles)</span>
          </button>

          <button
            onClick={() => setActiveChartTab('audio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeChartTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 size={14} />
            <span>Âm Thanh (Audio)</span>
          </button>
        </div>
      </div>

      {/* CHART 1: VIEWS VS SAVES SCATTER PLOT */}
      {activeChartTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>Mỏ Vàng Chốt Đơn (Save-Rate ≥ 1.2%)</span>
              </div>
              <p className="text-[11px] text-slate-300">Khách xem là lưu để mua, tỷ lệ chuyển đổi cao gấp 3x trung bình.</p>
            </div>

            <div className="bg-amber-950/30 border border-amber-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Mega Outliers (View &gt; 100k + Save Cao)</span>
              </div>
              <p className="text-[11px] text-slate-300">Video bùng nổ thuật toán và mang lại doanh số lớn nhất.</p>
            </div>

            <div className="bg-purple-950/30 border border-purple-500/30 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-purple-400 font-bold mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400 inline-block" />
                <span>Viral Lan Tỏa (View &gt; 300k)</span>
              </div>
              <p className="text-[11px] text-slate-300">Độ phủ thương hiệu khổng lồ, thích hợp học hỏi cách làm Hook 3s đầu.</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                <span>Standard Performers</span>
              </div>
              <p className="text-[11px] text-slate-400">Các video trong ngạch chuẩn, cần cải thiện CTA để tăng Save.</p>
            </div>
          </div>

          <div className="h-[420px] w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  type="number"
                  dataKey="viewsK"
                  name="Lượt Xem"
                  unit="k"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  dataKey="saves"
                  name="Lượt Lưu"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs max-w-xs space-y-1.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                          <span className="font-bold text-white">@{data.creator}</span>
                          <span className="font-mono text-emerald-400 font-bold">Save: {data.saveRate}%</span>
                        </div>
                        <p className="text-slate-300 italic text-[11px]">"{data.caption}"</p>
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 text-slate-400">
                          <div>👁️ Views: <strong className="text-white font-mono">{data.views.toLocaleString()}</strong></div>
                          <div>🔖 Saves: <strong className="text-white font-mono">{data.saves.toLocaleString()}</strong></div>
                          <div>💬 Cmt: <strong className="text-white font-mono">{data.comments.toLocaleString()}</strong></div>
                          <div>🎯 Góc: <strong className="text-indigo-300">{data.adAngle}</strong></div>
                        </div>
                        <a
                          href={data.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-center bg-pink-600 hover:bg-pink-500 text-white font-medium py-1 px-2 rounded-lg text-[10px] transition"
                        >
                          Mở Video Trên TikTok ↗
                        </a>
                      </div>
                    );
                  }}
                />
                <Scatter name="Mỏ Vàng (High Save Rate)" data={gemPoints} fill="#10b981" />
                <Scatter name="Mega Outliers (View + Save Cao)" data={goldPoints} fill="#f59e0b" />
                <Scatter name="Viral Lan Tỏa" data={viralPoints} fill="#a855f7" />
                <Scatter name="Video Chuẩn" data={standardPoints} fill="#64748b" opacity={0.6} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 2: TIMELINE TREND */}
      {activeChartTab === 'timeline' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Biểu đồ thể hiện dung lượng lượt xem và độ quan tâm (Saves) theo từng tháng đăng tải video:</span>
            <span className="font-mono text-indigo-300">{timelineData.length} Mốc Thời Gian</span>
          </div>

          <div className="h-[380px] w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="savesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload || payload.length === 0) return null;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">Tháng: {label}</div>
                        <div className="text-sky-400">Tổng Views: <strong>{(payload[0]?.value as number)?.toLocaleString()}k</strong></div>
                        <div className="text-emerald-400">Tổng Saves: <strong>{(payload[1]?.value as number)?.toLocaleString()}</strong></div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="viewsK" name="Lượt Xem (k views)" stroke="#38bdf8" fillOpacity={1} fill="url(#viewsGradient)" />
                <Area type="monotone" dataKey="saves" name="Lượt Lưu (Saves)" stroke="#10b981" fillOpacity={1} fill="url(#savesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 3: AD ANGLES & HOOK CATEGORIES */}
      {activeChartTab === 'angles' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>So sánh tỷ lệ lưu mua hàng (Save-to-view ratio) và Lượt xem trung bình giữa các góc kịch bản:</span>
            <span className="font-mono text-emerald-400 font-bold">Góc có Save-Rate cao nhất = Dễ chốt đơn nhất</span>
          </div>

          <div className="h-[380px] w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={angleData} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="angle"
                  stroke="#94a3b8"
                  fontSize={11}
                  angle={-15}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  content={({ payload, label }) => {
                    if (!payload || payload.length === 0) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                        <div>Số video: <strong className="text-white">{d.count}</strong></div>
                        <div className="text-emerald-400">Tỷ lệ Lưu (Save-Rate): <strong>{d.avgSaveRate}%</strong></div>
                        <div className="text-sky-400">Saves Trung Bình: <strong>{d.avgSaves.toLocaleString()}</strong></div>
                        <div className="text-purple-400">Views Trung Bình: <strong>{d.avgViewsK.toLocaleString()}k</strong></div>
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="avgSaves" name="Saves Trung Bình / Video" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="avgViewsK" name="Views Trung Bình (k views)" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* CHART 4: AUDIO BENCHMARK */}
      {activeChartTab === 'audio' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Hiệu quả tương tác giữa các định dạng âm thanh (Voiceover vs Nhạc nền vs ASMR):</span>
            <span className="font-mono text-purple-400 font-bold">Benchmark Âm Thanh Toàn Ngách</span>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="h-[340px] md:col-span-2 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={audioData} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    content={({ payload, label }) => {
                      if (!payload || payload.length === 0) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                          <div className="font-bold text-white border-b border-slate-800 pb-1">{label}</div>
                          <div>Số lượng video: <strong className="text-white">{d.count}</strong></div>
                          <div className="text-emerald-400">Saves Trung Bình: <strong>{d.avgSaves.toLocaleString()}</strong></div>
                          <div className="text-sky-400">Views Trung Bình: <strong>{d.avgViewsK.toLocaleString()}k</strong></div>
                          <div className="text-amber-400">Save Rate: <strong>{d.avgSaveRate}%</strong></div>
                        </div>
                      );
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avgSaves" name="Saves Trung Bình" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avgViewsK" name="Views Trung Bình (k)" fill="#38bdf8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[340px] bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold text-white mb-2">Tỷ Trọng Số Lượng Video</h4>
              <div className="w-full h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={audioData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {audioData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] w-full pt-2">
                {audioData.map((item, idx) => (
                  <div key={item.name} className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-300 truncate">{item.name}: <strong>{item.count}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
