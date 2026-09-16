import { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Search,
  Play,
  Lightbulb,
  FileText,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Brain,
  ChevronRight,
  Eye,
  Heart,
  Bookmark,
  MessageCircle,
  RefreshCw,
  Download,
  Copy,
  Check,
  BarChart3,
  Flame,
  MessageSquare,
  HelpCircle,
  ShieldAlert,
  Zap,
  Cpu,
  Target,
} from "lucide-react";

interface VideoItem {
  id: number;
  video_id: string;
  url: string;
  creator: string;
  caption: string;
  upload_date: string;
  duration_sec: number;
  views: number;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  engagement_rate: number;
  score: number;
}

interface ReviewItem {
  id: number;
  video_id: string;
  hook: string;
  viral: string;
  buyer_psychology: string;
  winning_formula: string;
  viral_score: number;
  hook_score: number;
  conversion_score: number;
  strengths?: string[];
  weaknesses?: string[];
}

interface CommentInsight {
  video_id: string;
  keyword: string;
  total_crawled: number;
  buying_intent: { username: string; text: string; likes: number }[];
  objections: { username: string; text: string; likes: number }[];
  top_faqs: { username: string; text: string; likes: number }[];
  social_proof: { username: string; text: string; likes: number }[];
  summary: string;
}

interface MasterAnalysis {
  keyword: string;
  summary: string;
  viral_triggers: string[];
  friction_solutions: string[];
  winning_blueprint: string;
}

interface ConceptItem {
  title: string;
  hook: string;
  angle: string;
  shot_list: string[];
}

interface BriefItem {
  title: string;
  objective: string;
  target_audience: string;
  script: string;
  guidelines: string[];
}

interface MacroPatterns {
  keyword: string;
  total_videos: number;
  metrics_summary: {
    total_views: number;
    avg_views: number;
    max_views: number;
    total_likes: number;
    avg_likes: number;
    total_comments: number;
    avg_comments: number;
    total_saves: number;
    avg_saves: number;
    avg_engagement_rate: number;
    save_to_view_ratio: number;
    comment_to_view_ratio: number;
  };
  top_performing_video: any;
  hook_patterns: Record<string, number>;
  buyer_psychology_patterns: Record<string, number>;
}

interface JobStatus {
  job_id: string;
  keyword: string;
  status: "started" | "crawling" | "fetching_metadata" | "analyzing_ai" | "completed" | "failed";
  progress: number;
  message: string;
  new_videos_count: number;
}

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [keyword, setKeyword] = useState("faux olive tree");
  const [data, setData] = useState<{
    keyword: string;
    videos: VideoItem[];
    reviews: ReviewItem[];
    ideas: ConceptItem[];
    briefs: BriefItem[];
    comment_insights?: Record<string, CommentInsight>;
    master_analysis?: MasterAnalysis;
  } | null>(null);

  const [patterns, setPatterns] = useState<MacroPatterns | null>(null);
  const [keywordsList, setKeywordsList] = useState<{ keyword: string; video_count: number }[]>([]);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "overall" | "patterns" | "ideas" | "briefs" | "database">("reviews");
  const [selectedConcept, setSelectedConcept] = useState<ConceptItem | null>(null);
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [runningMasterAI, setRunningMasterAI] = useState(false);
  const [crawlLimit, setCrawlLimit] = useState<number>(20);

  // Video-specific comment crawl state
  const [crawlingCommentVid, setCrawlingCommentVid] = useState<string | null>(null);
  const [expandedCommentVid, setExpandedCommentVid] = useState<string | null>(null);

  const pollingRef = useRef<any>(null);

  async function loadData(targetKeyword?: string) {
    try {
      const kw = targetKeyword || keyword;
      const url = targetKeyword
        ? `${API_BASE}/api/results?keyword=${encodeURIComponent(targetKeyword)}`
        : `${API_BASE}/api/results`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.keyword) {
          setKeyword(json.keyword);
        }
      }

      const patUrl = `${API_BASE}/api/patterns?keyword=${encodeURIComponent(kw)}`;
      const patRes = await fetch(patUrl);
      if (patRes.ok) {
        const patJson = await patRes.json();
        setPatterns(patJson);
      }
    } catch (e) {
      console.error("Failed to load results:", e);
    }
  }

  async function loadKeywords() {
    try {
      const res = await fetch(`${API_BASE}/api/keywords`);
      if (res.ok) {
        const list = await res.json();
        setKeywordsList(list);
      }
      const histRes = await fetch(`${API_BASE}/api/history`);
      if (histRes.ok) {
        const hist = await histRes.json();
        setHistoryCount(hist.total_crawled_videos || 0);
      }
    } catch (e) {
      console.error("Failed to load keywords:", e);
    }
  }

  useEffect(() => {
    loadData();
    loadKeywords();
  }, []);

  async function pollJob(jobId: string) {
    try {
      const res = await fetch(`${API_BASE}/api/jobs/${jobId}`);
      if (!res.ok) return;
      const job: JobStatus = await res.json();
      setCurrentJob(job);

      if (job.status === "completed") {
        clearInterval(pollingRef.current);
        setLoading(false);
        await loadData(job.keyword);
        await loadKeywords();
      } else if (job.status === "failed") {
        clearInterval(pollingRef.current);
        setLoading(false);
      }
    } catch (e) {
      console.error("Polling error:", e);
    }
  }

  async function handleAnalyze() {
    if (!keyword.trim() || loading) return;
    setLoading(true);
    setCurrentJob(null);

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), limit: crawlLimit }),
      });

      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        setCurrentJob({
          job_id: jobId,
          keyword: keyword.trim(),
          status: "started",
          progress: 5,
          message: `Kiểm tra lịch sử SQLite & cào ${crawlLimit} video mới (Multi-Vector)...`,
          new_videos_count: 0,
        });

        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(() => pollJob(jobId), 1500);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error("Analyze request failed:", e);
      setLoading(false);
    }
  }

  // Trigger 100% Local Master AI Analysis
  async function handleRunMasterAI() {
    if (runningMasterAI || !keyword.trim()) return;
    setRunningMasterAI(true);
    try {
      const res = await fetch(`${API_BASE}/api/analyze-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.master_analysis && data) {
          setData({
            ...data,
            master_analysis: json.master_analysis,
          });
          setActiveTab("overall");
        }
      }
    } catch (e) {
      console.error("Master AI run error:", e);
    } finally {
      setRunningMasterAI(false);
    }
  }

  // On-demand crawl 1000 comments for a specific video
  async function handleCrawlDeepComments(videoId: string) {
    if (crawlingCommentVid) return;
    setCrawlingCommentVid(videoId);

    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_comments: 1000 }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.insights && data) {
          setData({
            ...data,
            comment_insights: {
              ...(data.comment_insights || {}),
              [videoId]: {
                video_id: videoId,
                keyword: keyword,
                total_crawled: json.total_crawled,
                ...json.insights,
              },
            },
          });
          setExpandedCommentVid(videoId);
        }
      }
    } catch (e) {
      console.error("Failed to crawl 1000 comments:", e);
    } finally {
      setCrawlingCommentVid(null);
    }
  }

  // Copy Master Prompt for external AI including comments
  function handleCopyPrompt() {
    if (!data || !data.videos) return;

    let promptText = `I have scraped and analyzed ${data.videos.length} top-performing TikTok videos for the ecommerce keyword: "${data.keyword}".\n\n`;
    promptText += `VIDEO DATASET WITH METRICS, VOICE-OF-CUSTOMER COMMENTS & CREATIVE BREAKDOWNS:\n`;

    const rMap = new Map<string, ReviewItem>();
    data.reviews?.forEach((r) => r.video_id && rMap.set(r.video_id, r));
    const insMap = data.comment_insights || {};

    data.videos.forEach((v, i) => {
      const rev = rMap.get(v.video_id);
      const ins = insMap[v.video_id];

      const intentSamples = ins?.buying_intent?.slice(0, 3).map((q) => `"${q.text}"`).join(", ") || "None";
      const objSamples = ins?.objections?.slice(0, 3).map((o) => `"${o.text}"`).join(", ") || "None";

      promptText += `\n--- Video #${i + 1} ---
Creator: @${v.creator}
URL: ${v.url}
Views: ${v.views.toLocaleString()} | Likes: ${v.likes.toLocaleString()} | Saves: ${v.saves.toLocaleString()} | Comments: ${v.comments.toLocaleString()} | Score: ${v.score}/100
Caption: "${v.caption}"
Hook (0-3s): ${rev?.hook || "N/A"}
Viral Trigger: ${rev?.viral || "N/A"}
Buyer Psychology: ${rev?.buyer_psychology || "N/A"}
Winning Formula: ${rev?.winning_formula || "N/A"}
Voice of Customer (Comments Analyzed: ${ins?.total_crawled || 0}):
- Real Buying Intent Questions: ${intentSamples}
- Real Customer Doubts/Objections: ${objSamples}\n`;
    });

    if (data.master_analysis) {
      promptText += `\nLOCAL AI MASTER STRATEGY SUMMARY:
${data.master_analysis.summary}\n`;
    }

    promptText += `\nTASK FOR AI STRATEGIST:
1. Identify the top 5 macro commonalities across all videos that drove them to viral scale.
2. Based on real comments, what is the #1 objection preventing viewers from buying, and how should an ecommerce brand neutralize it in the first 5 seconds?
3. What is the most requested feature or accessory in the comments (e.g. planter, size, discount)?
4. Write 3 brand new high-converting DTC ad scripts tailored to scale our brand in this niche.`;

    navigator.clipboard.writeText(promptText);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  }

  const reviewMap = new Map<string, ReviewItem>();
  if (data?.reviews) {
    data.reviews.forEach((r) => {
      if (r.video_id) reviewMap.set(r.video_id, r);
    });
  }

  const insightsMap = data?.comment_insights || {};
  const masterAI = data?.master_analysis;

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 p-5 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-2xl shadow-xl shadow-pink-500/25">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  TikTok Creative AI v2.0
                </h1>
                <span className="bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cpu size={11} /> 100% Local AI (No Paid API)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Auto-Skipping Duplicate URLs &bull; 20 New Videos &bull; 1,000 Comments &bull; Master Local Synthesis
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs text-slate-300">
              <Database size={15} className="text-emerald-400" />
              <span>
                Total Stored Videos: <strong className="text-white">{historyCount}</strong>
              </span>
            </div>

            {keywordsList.length > 0 && (
              <select
                className="bg-slate-900/90 border border-slate-800 text-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-violet-500 cursor-pointer"
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  loadData(e.target.value);
                }}
              >
                {keywordsList.map((k) => (
                  <option key={k.keyword} value={k.keyword}>
                    📁 {k.keyword} ({k.video_count} videos)
                  </option>
                ))}
              </select>
            )}
          </div>
        </header>

        {/* Search & Action Box */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-4 md:p-6 shadow-2xl mb-6 backdrop-blur-md">
          <div className="flex flex-col md:flex-row gap-3 items-stretch">
            <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3.5 flex items-center gap-3 focus-within:border-violet-500 transition">
              <Search className="text-slate-400" size={20} />
              <input
                className="bg-transparent outline-none w-full text-white placeholder-slate-500 text-sm md:text-base"
                placeholder="Nhập từ khóa TikTok (ví dụ: faux olive tree, led face mask, portable blender)..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
                disabled={loading}
              />
            </div>

            {/* Target Count Selector */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 flex items-center gap-2 justify-between">
              <span className="text-xs text-slate-400 font-medium px-1 whitespace-nowrap">Mục tiêu:</span>
              <select
                value={crawlLimit}
                onChange={(e) => setCrawlLimit(Number(e.target.value))}
                disabled={loading}
                aria-label="Target crawl count"
                className="bg-slate-900 border border-slate-700 text-violet-300 font-semibold text-xs md:text-sm rounded-xl px-3 py-2 outline-none cursor-pointer hover:border-violet-500 transition"
              >
                <option value={20}>+20 video (Sprint)</option>
                <option value={50}>+50 video (Sâu)</option>
                <option value={100}>+100 video (Toàn diện)</option>
                <option value={200}>+200 video (Đại quy mô)</option>
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 hover:opacity-95 text-white font-semibold px-7 py-3.5 rounded-2xl flex items-center justify-center gap-2.5 transition shadow-lg shadow-purple-600/25 disabled:opacity-50 cursor-pointer text-sm md:text-base whitespace-nowrap"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Đang cào & phân tích...</span>
                </>
              ) : (
                <>
                  <Play size={18} />
                  <span>Cào Tiếp {crawlLimit} Video Mới (Né Trùng)</span>
                </>
              )}
            </button>
          </div>

          {/* Action Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mt-3 text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>
                <strong>Smart URL Filter:</strong> Lọc bỏ link trùng & tích hợp sẵn cột <em>AI Phân Tích Tổng Thể (Local)</em> khi xuất file.
              </span>
            </span>

            <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0">
              <button
                onClick={handleRunMasterAI}
                disabled={runningMasterAI}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Chạy mô hình local Ollama phân tích bức tranh tổng thể toàn bộ ngách (0 đồng, không cần API)"
              >
                {runningMasterAI ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Đang tổng hợp local...</span>
                  </>
                ) : (
                  <>
                    <Cpu size={13} />
                    <span>⚡ Chạy Phân Tích Tổng Thể (Local)</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCopyPrompt}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition cursor-pointer"
                title="Copy toàn bộ dataset kèm phân tích cấu trúc và comments"
              >
                {copiedPrompt ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Đã copy Master AI Prompt!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy Master AI Prompt</span>
                  </>
                )}
              </button>

              <a
                href={`${API_BASE}/api/export/csv?keyword=${encodeURIComponent(keyword)}`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
                title="Xuất file CSV chuẩn Excel kèm cột AI Phân Tích Tổng Thể"
              >
                <Download size={13} />
                <span>Xuất CSV (Kèm Cột AI)</span>
              </a>

              <a
                href={`${API_BASE}/api/export/json?keyword=${encodeURIComponent(keyword)}`}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition"
                title="Xuất dữ liệu JSON đầy đủ"
              >
                <Download size={13} />
                <span>Xuất JSON</span>
              </a>
            </div>
          </div>

          {/* Live Progress Bar */}
          {currentJob && (
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium flex items-center gap-2">
                  {currentJob.status === "completed" ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : currentJob.status === "failed" ? (
                    <AlertCircle size={16} className="text-rose-400" />
                  ) : (
                    <RefreshCw size={16} className="animate-spin text-purple-400" />
                  )}
                  <span className="text-slate-300">{currentJob.message}</span>
                </span>
                <span className="font-mono text-purple-400 font-bold">{currentJob.progress}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-400 h-full transition-all duration-500 rounded-full"
                  style={{ width: `${currentJob.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Lượt Xem (Views)</p>
              <h3 className="text-lg md:text-xl font-bold font-mono">
                {patterns?.metrics_summary?.total_views ? patterns.metrics_summary.total_views.toLocaleString() : (data?.videos?.length || 0)}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-pink-500/10 text-pink-400 rounded-xl">
              <Heart size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Thả Tim (Likes)</p>
              <h3 className="text-lg md:text-xl font-bold font-mono">
                {patterns?.metrics_summary?.total_likes ? patterns.metrics_summary.total_likes.toLocaleString() : (data?.reviews?.length || 0)}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Bookmark size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Lượt Lưu (Saves)</p>
              <h3 className="text-lg md:text-xl font-bold font-mono">
                {patterns?.metrics_summary?.total_saves ? patterns.metrics_summary.total_saves.toLocaleString() : 0}
              </h3>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <MessageCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Bình Luận (Comments)</p>
              <h3 className="text-lg md:text-xl font-bold font-mono">
                {patterns?.metrics_summary?.total_comments ? patterns.metrics_summary.total_comments.toLocaleString() : 0}
              </h3>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 mb-6 pb-2">
          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "reviews"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Brain size={16} />
            <span>Phân Tích 4 Trụ Cột & Khán Giả ({data?.reviews?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("overall")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "overall"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Cpu size={16} />
            <span>Báo Cáo AI Tổng Thể (Local) {masterAI ? "✓" : ""}</span>
          </button>

          <button
            onClick={() => setActiveTab("patterns")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "patterns"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <BarChart3 size={16} />
            <span>Điểm Chung Viral & Macro DNA</span>
          </button>

          <button
            onClick={() => setActiveTab("ideas")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "ideas"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Lightbulb size={16} />
            <span>Ý Tưởng Sáng Tạo ({data?.ideas?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("briefs")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "briefs"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <FileText size={16} />
            <span>Production Briefs ({data?.briefs?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab("database")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "database"
                ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Database size={16} />
            <span>Bảng Dữ Liệu (Kèm Cột AI) ({data?.videos?.length || 0})</span>
          </button>
        </div>

        {/* TAB: MASTER LOCAL AI OVERALL ANALYSIS */}
        {activeTab === "overall" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                  <Cpu className="text-emerald-400" size={24} />
                  Báo Cáo Chiến Lược AI Tổng Thể (Chạy 100% Local Trên Máy Của Bạn)
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Mô hình Ollama địa phương đọc toàn bộ database, chỉ số view/tym/comment và phân tích bức tranh vĩ mô.
                </p>
              </div>

              <button
                onClick={handleRunMasterAI}
                disabled={runningMasterAI}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-auto disabled:opacity-50"
              >
                {runningMasterAI ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Đang tổng hợp local...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Cập Nhật Phân Tích Local Mới</span>
                  </>
                )}
              </button>
            </div>

            {!masterAI ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Cpu size={40} className="mx-auto mb-3 text-slate-600" />
                <p className="text-base font-semibold">Chưa có báo cáo AI tổng thể cho từ khóa này.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Bấm nút "⚡ Chạy Phân Tích Tổng Thể (Local)" ở trên để kích hoạt Ollama chạy phân tích 100% nội bộ.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Executive Summary */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Target size={16} />
                    <span>Bức Tranh Toàn Cảnh & Đánh Giá Ngách Thị Trường</span>
                  </div>
                  <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                    {masterAI.summary}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Non-Negotiable Viral Triggers */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                    <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider mb-3">
                      <Flame size={16} />
                      <span>3 Yếu Tố Viral Sống Còn Bắt Buộc Phải Có</span>
                    </div>
                    <ul className="space-y-2.5 text-xs md:text-sm text-slate-200">
                      {masterAI.viral_triggers?.map((item, idx) => (
                        <li key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="text-pink-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Friction Solutions */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                      <ShieldAlert size={16} />
                      <span>Cách Bẻ Gãy Rào Cản Lớn Nhất Từ Comments</span>
                    </div>
                    <ul className="space-y-2.5 text-xs md:text-sm text-slate-200">
                      {masterAI.friction_solutions?.map((item, idx) => (
                        <li key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-start gap-2.5">
                          <CheckCircle2 size={16} className="text-amber-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Winning Blueprint */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-3">
                    <Sparkles size={16} />
                    <span>Kịch Bản Vàng Khuyến Nghị Cho Brand (Winning Blueprint)</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
                    {masterAI.winning_blueprint}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 1: REVIEWS WITH COMMENTS & 4 PILLARS */}
        {activeTab === "reviews" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
                <Sparkles className="text-pink-400" size={20} />
                Video Creative Breakdown &bull; Tiếng Nói Khách Hàng (Customer Comments)
              </h2>
              <span className="text-xs text-slate-400">
                Từ khóa: <strong className="text-slate-200">{data?.keyword}</strong>
              </span>
            </div>

            {(!data?.videos || data.videos.length === 0) ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Brain size={40} className="mx-auto mb-3 text-slate-600" />
                <p>Chưa có dữ liệu video cho từ khóa này.</p>
                <p className="text-xs text-slate-500 mt-1">Nhập từ khóa và nhấn "Cào Tiếp 20 Video Mới".</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {data.videos.map((vid, idx) => {
                  const rev = reviewMap.get(vid.video_id);
                  const ins = insightsMap[vid.video_id];
                  const isExpanded = expandedCommentVid === vid.video_id;
                  const isCrawlingDeep = crawlingCommentVid === vid.video_id;

                  return (
                    <div
                      key={vid.video_id || idx}
                      className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-5 md:p-6 shadow-xl hover:border-slate-700 transition"
                    >
                      {/* Video Header & Metrics */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-purple-400">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white">@{vid.creator || "unknown"}</span>
                              <a
                                href={vid.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-pink-400 transition"
                              >
                                <ExternalLink size={13} />
                              </a>
                              <span className="text-[11px] text-slate-500">({vid.upload_date || "gần đây"})</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-xl mt-0.5">
                              {vid.caption || "Không có mô tả"}
                            </p>
                          </div>
                        </div>

                        {/* Badges: Views, Likes, Saves, Comments, Score */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5 text-slate-300">
                            <Eye size={12} className="text-blue-400" />
                            <span>{(vid.views || 0).toLocaleString()} views</span>
                          </div>
                          <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5 text-slate-300">
                            <Heart size={12} className="text-pink-400" />
                            <span>{(vid.likes || 0).toLocaleString()} tym</span>
                          </div>
                          <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5 text-slate-300">
                            <Bookmark size={12} className="text-amber-400" />
                            <span>{(vid.saves || 0).toLocaleString()} lưu</span>
                          </div>
                          <div className="bg-slate-950 px-2.5 py-1 rounded-xl border border-slate-800 flex items-center gap-1.5 text-slate-300">
                            <MessageCircle size={12} className="text-emerald-400" />
                            <span>{(vid.comments || 0).toLocaleString()} cmt</span>
                          </div>
                          <div className="bg-purple-950/60 border border-purple-800/80 px-2.5 py-1 rounded-xl flex items-center gap-1 text-purple-300 font-bold">
                            <TrendingUp size={12} />
                            <span>Score: {vid.score || 75}</span>
                          </div>
                        </div>
                      </div>

                      {/* 4 Pillars Grid */}
                      <div className="grid md:grid-cols-2 gap-3.5 mt-4">
                        {/* 1. Hook */}
                        <div className="bg-slate-950/70 border border-slate-800/70 rounded-2xl p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-pink-400 uppercase tracking-wider mb-1.5">
                            <span>🎣 Hook Mở Đầu (0-3 giây)</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                            {rev?.hook || "Hook trực quan mở đầu bằng demo thực tế sản phẩm để giữ chân người xem."}
                          </p>
                        </div>

                        {/* 2. Viral Mechanics */}
                        <div className="bg-slate-950/70 border border-slate-800/70 rounded-2xl p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5">
                            <span>🚀 Động Lực Viral & Tương Tác</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                            {rev?.viral || `Đạt ${(vid.views || 0).toLocaleString()} views và ${(vid.saves || 0).toLocaleString()} lượt lưu nhờ tính thẩm mỹ và giá trị tham khảo cao.`}
                          </p>
                        </div>

                        {/* 3. Buyer Psychology */}
                        <div className="bg-slate-950/70 border border-slate-800/70 rounded-2xl p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-1.5">
                            <span>🧠 Tâm Lý Người Mua (Buyer Psychology)</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                            {rev?.buyer_psychology || "Đánh trúng khao khát nâng cấp không gian sống, giải tỏa nỗi sợ tốn công chăm sóc và chứng minh sự hợp lý về giá cả."}
                          </p>
                        </div>

                        {/* 4. Winning Formula */}
                        <div className="bg-slate-950/70 border border-slate-800/70 rounded-2xl p-3.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1.5">
                            <span>🏆 Công Thức Thắng (Winning Formula)</span>
                          </div>
                          <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                            {rev?.winning_formula || "3s tò mò mở đầu -> cận cảnh kiểm tra độ chân thực -> toàn cảnh không gian -> kêu gọi nhấp link giỏ hàng/bio."}
                          </p>
                        </div>
                      </div>

                      {/* VOICE OF CUSTOMER / COMMENTS ACCORDION */}
                      <div className="mt-4 pt-3.5 border-t border-slate-800/70">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                              <MessageSquare size={14} className="text-pink-400" />
                              <span>Tiếng Nói Khách Hàng (Comments):</span>
                            </span>

                            {ins && ins.total_crawled > 0 ? (
                              <div className="flex items-center gap-1.5 text-[11px]">
                                <span className="bg-blue-950/70 border border-blue-800/60 text-blue-300 px-2 py-0.5 rounded-lg">
                                  {ins.total_crawled} cmt đã lọc
                                </span>
                                {ins.buying_intent?.length > 0 && (
                                  <span className="bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 px-2 py-0.5 rounded-lg">
                                    {ins.buying_intent.length} hỏi mua/xin link
                                  </span>
                                )}
                                {ins.objections?.length > 0 && (
                                  <span className="bg-amber-950/70 border border-amber-800/60 text-amber-300 px-2 py-0.5 rounded-lg">
                                    {ins.objections.length} rào cản/thắc mắc
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500">Chưa cào comments sâu</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCrawlDeepComments(vid.video_id)}
                              disabled={isCrawlingDeep}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                              title="Cào tối đa 1,000 comments không có rep của tác giả cho video này"
                            >
                              {isCrawlingDeep ? (
                                <>
                                  <Loader2 size={12} className="animate-spin text-purple-400" />
                                  <span>Đang cào 1,000 cmt...</span>
                                </>
                              ) : (
                                <>
                                  <Zap size={12} className="text-amber-400" />
                                  <span>⚡ Cào 1,000 Comments</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => setExpandedCommentVid(isExpanded ? null : vid.video_id)}
                              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1 transition cursor-pointer"
                            >
                              <span>{isExpanded ? "Thu gọn" : "Xem chi tiết ý kiến"}</span>
                              <ChevronRight size={14} className={`transform transition ${isExpanded ? "rotate-90" : ""}`} />
                            </button>
                          </div>
                        </div>

                        {/* Expanded Voice-of-Customer Details */}
                        {isExpanded && (
                          <div className="mt-3.5 grid md:grid-cols-2 gap-3.5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs animate-in fade-in duration-200">
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-emerald-400 mb-2">
                                <HelpCircle size={14} />
                                <span>Ý Định Mua & Câu Hỏi Xin Link/Giá ({ins?.buying_intent?.length || 0})</span>
                              </div>
                              {(!ins?.buying_intent || ins.buying_intent.length === 0) ? (
                                <p className="text-slate-500 italic">Chưa phát hiện câu hỏi mua hàng nổi bật.</p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {ins.buying_intent.slice(0, 5).map((item, qIdx) => (
                                    <li key={qIdx} className="bg-slate-900 p-2 rounded-xl border border-slate-800/80 text-slate-300">
                                      <span className="font-semibold text-white">@{item.username}:</span> "{item.text}"
                                      {item.likes > 0 && <span className="text-[10px] text-pink-400 ml-2 font-mono">({item.likes} tym)</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-2">
                                <ShieldAlert size={14} />
                                <span>Rào Cản & Nghi Ngại Của Khách ({ins?.objections?.length || 0})</span>
                              </div>
                              {(!ins?.objections || ins.objections.length === 0) ? (
                                <p className="text-slate-500 italic">Khán giả không chê bai hoặc chưa phát hiện rào cản lớn.</p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {ins.objections.slice(0, 5).map((item, oIdx) => (
                                    <li key={oIdx} className="bg-slate-900 p-2 rounded-xl border border-slate-800/80 text-slate-300">
                                      <span className="font-semibold text-white">@{item.username}:</span> "{item.text}"
                                      {item.likes > 0 && <span className="text-[10px] text-pink-400 ml-2 font-mono">({item.likes} tym)</span>}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MACRO PATTERNS & VIRAL DNA */}
        {activeTab === "patterns" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                <BarChart3 className="text-purple-400" size={22} />
                Điểm Chung Của 20-1,000 Video Viral (Macro Pattern Analysis)
              </h2>
              <span className="text-xs text-slate-400">
                Tổng hợp từ: <strong className="text-white">{patterns?.total_videos || 0} videos</strong>
              </span>
            </div>

            {patterns?.top_performing_video && (
              <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-pink-950/30 border border-purple-800/60 rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <Flame size={16} />
                  <span>Video Đột Biến Lớn Nhất (#1 Top Viral Outlier)</span>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      @{patterns.top_performing_video.creator} &bull; {(patterns.top_performing_video.views || 0).toLocaleString()} Lượt Xem
                    </h3>
                    <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                      "{patterns.top_performing_video.caption}"
                    </p>
                  </div>
                  <a
                    href={patterns.top_performing_video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-pink-600 hover:bg-pink-500 text-white font-medium px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition self-start md:self-auto shrink-0"
                  >
                    <span>Xem Trên TikTok</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span>🎣 Phân Bố Các Loại Hook Thắng Cuộc</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(patterns?.hook_patterns || {}).map(([name, count]) => {
                    const total = patterns?.total_videos || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-200 font-medium">{name}</span>
                          <span className="text-purple-400 font-mono font-bold">{count} videos ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                  <span>🧠 Tâm Lý Thúc Đẩy Mua Hàng Phổ Biến Nhất</span>
                </h3>
                <div className="space-y-3">
                  {Object.entries(patterns?.buyer_psychology_patterns || {}).map(([name, count]) => {
                    const total = patterns?.total_videos || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-200 font-medium">{name}</span>
                          <span className="text-emerald-400 font-mono font-bold">{count} videos ({pct}%)</span>
                        </div>
                        <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-base font-bold text-white mb-4">
                📊 Chỉ Số Benchmark Để Video Của Bạn Dễ Viral
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Save-to-View Ratio (Lưu/Xem)</p>
                  <p className="text-xl font-bold font-mono text-amber-400">
                    {patterns?.metrics_summary?.save_to_view_ratio || 0}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Dấu hiệu mua hàng cao nhất</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Comment-to-View Ratio</p>
                  <p className="text-xl font-bold font-mono text-blue-400">
                    {patterns?.metrics_summary?.comment_to_view_ratio || 0}%
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Độ tranh luận & tò mò</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Average Views / Video</p>
                  <p className="text-xl font-bold font-mono text-emerald-400">
                    {(patterns?.metrics_summary?.avg_views || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Mức tiếp cận trung bình</p>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">Average Likes / Video</p>
                  <p className="text-xl font-bold font-mono text-pink-400">
                    {(patterns?.metrics_summary?.avg_likes || 0).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">Mức độ yêu thích trung bình</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CREATIVE CONCEPTS */}
        {activeTab === "ideas" && (
          <div>
            <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
              <Lightbulb className="text-violet-400" size={22} />
              Ý Tưởng Concept Được Tổng Hợp Từ Dữ Liệu Thị Trường & Comments
            </h2>

            {(!data?.ideas || data.ideas.length === 0) ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Lightbulb size={40} className="mx-auto mb-3 text-slate-600" />
                <p>Chưa có ý tưởng nào được sinh ra cho từ khóa này.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-5">
                {data.ideas.map((concept, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedConcept(concept)}
                    className="bg-slate-900/80 border border-slate-800/90 rounded-3xl p-6 shadow-xl hover:border-violet-500/60 hover:-translate-y-1 transition cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-violet-400 font-semibold mb-3">
                        <span>Concept #{idx + 1}</span>
                        <span className="bg-violet-950/80 border border-violet-800/60 px-2.5 py-0.5 rounded-full">
                          {concept.angle || "Ecom Angle"}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mb-3">{concept.title}</h3>
                      <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/60 text-xs text-slate-300 italic mb-4">
                        &ldquo;{concept.hook}&rdquo;
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span>{concept.shot_list?.length || 4} Cảnh Quay (Shots)</span>
                      <span className="text-violet-400 font-medium flex items-center gap-1">
                        Xem Shot List <ChevronRight size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRODUCTION BRIEFS */}
        {activeTab === "briefs" && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-emerald-400" size={22} />
              Production Briefs Sẵn Sàng Giao Cho Creator (Bẻ Gãy Mọi Rào Cản Mua Hàng)
            </h2>

            {(!data?.briefs || data.briefs.length === 0) ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <FileText size={40} className="mx-auto mb-3 text-slate-600" />
                <p>Chưa có production brief nào.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {data.briefs.map((brief, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800 mb-5">
                      <div>
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                          Brief #{idx + 1}
                        </span>
                        <h3 className="text-xl font-bold text-white">{brief.title}</h3>
                      </div>
                      <div className="bg-emerald-950/50 border border-emerald-800/60 px-4 py-1.5 rounded-xl text-xs text-emerald-300 font-medium">
                        Mục tiêu: {brief.objective}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Chân Dung Khách Hàng Mục Tiêu
                          </h4>
                          <p className="text-sm text-slate-200">{brief.target_audience}</p>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Kịch Bản Chi Tiết & Hướng Dẫn Quay
                          </h4>
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs md:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-mono">
                            {brief.script}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                          Quy Chuẩn Khi Quay
                        </h4>
                        <ul className="space-y-2 text-xs text-slate-300">
                          {brief.guidelines?.map((g, gi) => (
                            <li
                              key={gi}
                              className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2"
                            >
                              <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                              <span>{g}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: DATABASE RAW TABLE WITH AI OVERALL COLUMN */}
        {activeTab === "database" && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-purple-400" />
                  Bảng Dữ Liệu Chi Tiết Kèm Cột AI Phân Tích Tổng Thể ({data?.videos?.length || 0} Videos)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cột <strong>AI Phân Tích Tổng Thể</strong> tích hợp sẵn trong file CSV khi tải về.
                </p>
              </div>
              <span className="text-xs text-slate-400">File: data/tiktok.db</span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Creator</th>
                  <th className="py-3 px-3">Views</th>
                  <th className="py-3 px-3">Tym</th>
                  <th className="py-3 px-3">Lưu</th>
                  <th className="py-3 px-3">Bình Luận</th>
                  <th className="py-3 px-3">Score</th>
                  <th className="py-3 px-3 min-w-[280px]">AI Phân Tích Tổng Thể (Local)</th>
                  <th className="py-3 px-3">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data?.videos?.map((v, i) => {
                  const rev = reviewMap.get(v.video_id);
                  return (
                    <tr key={v.video_id || i} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono text-purple-400">{i + 1}</td>
                      <td className="py-3 px-3 font-semibold text-white">@{v.creator || "unknown"}</td>
                      <td className="py-3 px-3 font-mono">{(v.views || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono">{(v.likes || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono">{(v.saves || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono">{(v.comments || 0).toLocaleString()}</td>
                      <td className="py-3 px-3 font-bold text-emerald-400">{v.score}</td>
                      <td className="py-3 px-3 text-slate-300">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px] leading-relaxed line-clamp-2">
                          {rev?.winning_formula ? (
                            <span>{rev.winning_formula}</span>
                          ) : (
                            <span className="text-slate-500 italic">Đang cập nhật phân tích</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-pink-400 hover:underline flex items-center gap-1"
                        >
                          TikTok <ExternalLink size={12} />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Shot List Modal */}
        {selectedConcept && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
                  {selectedConcept.angle}
                </span>
                <button
                  onClick={() => setSelectedConcept(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <h2 className="text-2xl font-bold text-white mb-3">{selectedConcept.title}</h2>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Hook Mở Đầu (0-3s)
                </h4>
                <p className="text-sm text-slate-200 italic">&ldquo;{selectedConcept.hook}&rdquo;</p>
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                Kịch Bản Phân Cảnh (Shot-by-Shot)
              </h4>

              <div className="space-y-2.5 mb-6">
                {selectedConcept.shot_list?.map((shot, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-violet-950 border border-violet-800 text-violet-300 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-xs md:text-sm text-slate-300">{shot}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedConcept(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
