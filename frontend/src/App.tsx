import { useEffect, useState, useRef, useMemo } from "react";
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
  Mic,
  Camera,
  Film,
  SlidersHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ShoppingCart,
  Key,
  Users,
  Mail,
  Send,
  Award,
  FolderPlus,
  Folder,
  Trash2,
  Music,
  Headphones,
  Volume2,
} from "lucide-react";

interface NicheFolder {
  id?: number;
  name: string;
  keyword: string;
  description?: string;
  video_count: number;
  total_views: number;
  created_at: string;
  updated_at: string;
}

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
  creator_followers?: number;
  sound_title?: string;
  sound_author?: string;
  sound_original?: boolean | number;
  sound_type?: string;
  sound_id?: string;
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
  ad_angle?: string;
  transcript?: string;
  spoken_hook?: string;
  visual_hook?: string;
  setting?: string;
  on_screen_text?: string;
  visual_style?: string;
  keyframes?: string[];
}

interface CommentInsight {
  video_id: string;
  keyword: string;
  total_crawled: number;
  buying_intent: { username: string; text: string; likes: number }[];
  objections: { username: string; text: string; likes: number }[];
  top_faqs: { username: string; text: string; likes: number }[];
  social_proof: { username: string; text: string; likes: number }[];
  top_topics?: { topic: string; count: number; percentage: number }[];
  summary: string;
}

interface MasterAnalysis {
  keyword: string;
  engine?: string;
  summary: string;
  viral_triggers: string[];
  friction_solutions: string[];
  winning_blueprint: string;
  customer_interests?: { topic: string; count: number; percentage: number }[];
  buying_desires?: { username: string; text: string; likes: number }[];
  top_objections?: { username: string; text: string; likes: number }[];
  voc_summary?: string;
  audio_strategy?: {
    dominant_style?: string;
    winning_audio_formula?: string;
    recommendation?: string;
    distribution?: {
      sound_type: string;
      label: string;
      count: number;
      percentage: number;
      total_views: number;
      avg_views: number;
      avg_saves: number;
      avg_score: number;
    }[];
    top_sounds?: {
      sound_title: string;
      sound_author: string;
      sound_original: number;
      sound_type: string;
      usage_count: number;
      total_views: number;
      avg_score: number;
      max_views: number;
    }[];
  };
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

interface CreatorTopVideo {
  video_id: string;
  creator: string;
  views: number;
  likes: number;
  saves: number;
  score: number;
  caption: string;
  url: string;
}

interface CreatorItem {
  creator: string;
  nickname: string;
  avatar_url: string;
  follower_count: number;
  video_count: number;
  heart_count: number;
  signature: string;
  email: string;
  verified: boolean;
  booking_status: string;
  booking_notes: string;
  booking_price: number;
  videos_in_niche: number;
  total_views: number;
  max_views: number;
  avg_views: number;
  max_likes: number;
  max_saves: number;
  max_comments: number;
  max_score: number;
  viral_multiplier: number;
  tier: string;
  tier_label: string;
  tier_badge_color: string;
  tier_desc: string;
  recommendation: string;
  top_videos: CreatorTopVideo[];
  profile_url: string;
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
    master_analyses?: Record<string, MasterAnalysis>;
    audio_summary?: {
      total_analyzed: number;
      distribution: {
        sound_type: string;
        label: string;
        count: number;
        percentage: number;
        total_views: number;
        avg_views: number;
        avg_saves: number;
        avg_score: number;
      }[];
      top_sounds: {
        sound_title: string;
        sound_author: string;
        sound_original: number;
        sound_type: string;
        usage_count: number;
        total_views: number;
        avg_score: number;
        max_views: number;
      }[];
    };
  } | null>(null);

  const [patterns, setPatterns] = useState<MacroPatterns | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "overall" | "patterns" | "ideas" | "briefs" | "database" | "koc">("reviews");
  const [selectedConcept, setSelectedConcept] = useState<ConceptItem | null>(null);
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "ollama">("gemini");
  const [runningEngineAI, setRunningEngineAI] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [crawlLimit, setCrawlLimit] = useState<number>(20);
  const [soundTypeFilter, setSoundTypeFilter] = useState<string>("all");

  // Niche Folders states
  const [foldersList, setFoldersList] = useState<NicheFolder[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [showManageFoldersModal, setShowManageFoldersModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderDesc, setNewFolderDesc] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [deletingFolderName, setDeletingFolderName] = useState<string | null>(null);

  // Video-specific comment crawl state
  const [crawlingCommentVid, setCrawlingCommentVid] = useState<string | null>(null);
  const [expandedCommentVid, setExpandedCommentVid] = useState<string | null>(null);

  // Multimodal AI states (Whisper Audio & Qwen-VL Vision)
  const [multimodalModalVid, setMultimodalModalVid] = useState<ReviewItem | null>(null);
  const [analyzingMultimodalVid, setAnalyzingMultimodalVid] = useState<string | null>(null);
  const [analyzingTopMultimodal, setAnalyzingTopMultimodal] = useState(false);
  const [selectedAngleFilter, setSelectedAngleFilter] = useState<string>("all");

  // Sorting & Filtering states (Score, Views, Tym/Likes, Lưu/Saves, Comments, Engagement)
  const [sortBy, setSortBy] = useState<"score" | "views" | "likes" | "saves" | "comments" | "engagement">("score");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [minViewsFilter, setMinViewsFilter] = useState<number>(0);
  const [batchCrawlingComments, setBatchCrawlingComments] = useState<boolean>(false);

  // Creator Intelligence & Booking states
  const [creatorsList, setCreatorsList] = useState<CreatorItem[]>([]);
  const [loadingCreators, setLoadingCreators] = useState<boolean>(false);
  const [enrichingCreator, setEnrichingCreator] = useState<string | null>(null);
  const [batchEnriching, setBatchEnriching] = useState<boolean>(false);
  const [kocTierFilter, setKocTierFilter] = useState<string>("all");
  const [kocBookingFilter, setKocBookingFilter] = useState<string>("all");
  const [kocSearchQuery, setKocSearchQuery] = useState<string>("");
  const [kocSortBy, setKocSortBy] = useState<"multiplier" | "views" | "followers" | "videos">("multiplier");
  const [kocSortOrder, setKocSortOrder] = useState<"desc" | "asc">("desc");

  const pollingRef = useRef<any>(null);

  async function loadFolders() {
    try {
      const res = await fetch(`${API_BASE}/api/folders`);
      if (res.ok) {
        const json = await res.json();
        const fList: NicheFolder[] = json.folders || [];
        setFoldersList(fList);
      }
    } catch (e) {
      console.error("Failed to load folders:", e);
    }
  }

  async function handleCreateNewFolder() {
    const trimmed = newFolderName.trim();
    if (!trimmed || creatingFolder) return;
    setCreatingFolder(true);
    try {
      const res = await fetch(`${API_BASE}/api/folders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, description: newFolderDesc.trim() }),
      });
      if (res.ok) {
        setNewFolderName("");
        setNewFolderDesc("");
        setShowCreateFolderModal(false);
        await loadFolders();
        setKeyword(trimmed);
        await loadData(trimmed);
      }
    } catch (e) {
      console.error("Create folder error:", e);
    } finally {
      setCreatingFolder(false);
    }
  }

  async function handleDeleteFolder(folderName: string) {
    if (!confirm(`Bạn có chắc chắn muốn xóa thư mục ngách "${folderName}" cùng toàn bộ video & phân tích liên quan?`)) {
      return;
    }
    setDeletingFolderName(folderName);
    try {
      const res = await fetch(`${API_BASE}/api/folders/${encodeURIComponent(folderName)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await loadFolders();
        if (keyword === folderName) {
          const remaining = foldersList.filter((f) => f.name !== folderName);
          const nextKw = remaining.length > 0 ? remaining[0].name : "faux olive tree";
          setKeyword(nextKw);
          await loadData(nextKw);
        }
      }
    } catch (e) {
      console.error("Delete folder error:", e);
    } finally {
      setDeletingFolderName(null);
    }
  }

  async function handleSwitchFolder(folderName: string) {
    setKeyword(folderName);
    await loadData(folderName);
    setShowManageFoldersModal(false);
  }

  async function loadCreators(targetKeyword?: string) {
    const kw = targetKeyword || keyword;
    if (!kw) return;
    setLoadingCreators(true);
    try {
      const res = await fetch(`${API_BASE}/api/creators?keyword=${encodeURIComponent(kw)}`);
      if (res.ok) {
        const json = await res.json();
        setCreatorsList(json.creators || []);
      }
    } catch (e) {
      console.error("Failed to load creators:", e);
    } finally {
      setLoadingCreators(false);
    }
  }

  async function handleEnrichSingleCreator(creatorName: string) {
    setEnrichingCreator(creatorName);
    try {
      const res = await fetch(`${API_BASE}/api/creators/${encodeURIComponent(creatorName)}/enrich`, {
        method: "POST",
      });
      if (res.ok) {
        await loadCreators();
      }
    } catch (e) {
      console.error("Error enriching creator:", e);
    } finally {
      setEnrichingCreator(null);
    }
  }

  async function handleBatchEnrichCreators() {
    if (batchEnriching) return;
    setBatchEnriching(true);
    try {
      const res = await fetch(`${API_BASE}/api/creators/batch-enrich`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword, max_count: 20 }),
      });
      if (res.ok) {
        setTimeout(() => {
          loadCreators();
          setBatchEnriching(false);
        }, 10000);
      } else {
        setBatchEnriching(false);
      }
    } catch (e) {
      console.error("Batch enrich error:", e);
      setBatchEnriching(false);
    }
  }

  async function handleUpdateBooking(creatorName: string, status: string, notes: string, price: number) {
    try {
      const res = await fetch(`${API_BASE}/api/creators/${encodeURIComponent(creatorName)}/booking`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_status: status,
          booking_notes: notes,
          booking_price: price,
        }),
      });
      if (res.ok) {
        setCreatorsList((prev) =>
          prev.map((c) =>
            c.creator === creatorName
              ? { ...c, booking_status: status, booking_notes: notes, booking_price: price }
              : c
          )
        );
      }
    } catch (e) {
      console.error("Booking update error:", e);
    }
  }

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

      loadCreators(kw);
      loadFolders();

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
      await loadFolders();
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

  // Trigger Master AI Analysis (Ollama Local or Gemini Antigravity)
  async function handleRunMasterEngineAI(engine: "gemini" | "ollama") {
    if (runningEngineAI || !keyword.trim()) return;
    setRunningEngineAI(true);
    try {
      const res = await fetch(`${API_BASE}/api/analyze-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          engine: engine,
          api_key: geminiApiKey.trim() || undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.master_analysis && data) {
          setData({
            ...data,
            master_analysis: json.master_analysis,
            master_analyses: {
              ...(data.master_analyses || {}),
              [engine]: json.master_analysis,
            },
          });
          setSelectedEngine(engine);
          setActiveTab("overall");
        }
      }
    } catch (e) {
      console.error("Master Engine AI run error:", e);
    } finally {
      setRunningEngineAI(false);
    }
  }

  async function handleRunMasterAI() {
    await handleRunMasterEngineAI(selectedEngine);
  }

  function handleSaveApiKey(key: string) {
    setGeminiApiKey(key);
    localStorage.setItem("gemini_api_key", key);
    setShowApiKeyModal(false);
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

  // Batch crawl 1000 comments across top videos for Master Report
  async function handleBatchCrawlComments() {
    if (batchCrawlingComments || !keyword.trim()) return;
    setBatchCrawlingComments(true);
    try {
      const res = await fetch(`${API_BASE}/api/crawl-top-comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          top_n: 10,
          max_comments_per_video: 100,
        }),
      });
      if (res.ok) {
        setTimeout(async () => {
          await loadData();
          setBatchCrawlingComments(false);
        }, 3500);
      } else {
        setBatchCrawlingComments(false);
      }
    } catch (e) {
      console.error("Batch crawl comments failed:", e);
      setBatchCrawlingComments(false);
    }
  }

  function handleToggleSort(column: "score" | "views" | "likes" | "saves" | "comments" | "engagement") {
    if (sortBy === column) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
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

  // On-demand deep multimodal analysis (Whisper + Qwen-VL)
  async function handleRunMultimodal(videoId: string) {
    if (analyzingMultimodalVid) return;
    setAnalyzingMultimodalVid(videoId);

    try {
      const res = await fetch(`${API_BASE}/api/analyze-multimodal/${videoId}`, {
        method: "POST",
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data && data) {
          const updatedReviews = data.reviews.map((r) => {
            if (r.video_id === videoId) {
              return {
                ...r,
                ...json.data,
              };
            }
            return r;
          });

          setData({
            ...data,
            reviews: updatedReviews,
          });

          const currentRev = updatedReviews.find((r) => r.video_id === videoId);
          if (currentRev) {
            setMultimodalModalVid(currentRev);
          }
        }
      }
    } catch (e) {
      console.error("Multimodal analysis error:", e);
    } finally {
      setAnalyzingMultimodalVid(null);
    }
  }

  // Batch deep multimodal analysis for top N viral videos
  async function handleRunTopMultimodal(topN = 5) {
    if (analyzingTopMultimodal || !keyword.trim()) return;
    setAnalyzingTopMultimodal(true);

    try {
      const res = await fetch(`${API_BASE}/api/analyze-multimodal-top`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), top_n: topN }),
      });

      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        setCurrentJob({
          job_id: jobId,
          keyword: keyword,
          status: "started",
          progress: 15,
          message: `Đang bóc băng Whisper & soi góc quay Qwen-VL cho Top ${topN} video viral...`,
          new_videos_count: 0,
        });

        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(() => pollJob(jobId), 2000);
      }
    } catch (e) {
      console.error("Top multimodal error:", e);
    } finally {
      setAnalyzingTopMultimodal(false);
    }
  }

  function renderAdAngleBadge(angle?: string) {
    if (!angle) return null;
    let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
    if (angle.includes("Problem")) {
      badgeColor = "bg-amber-950/80 text-amber-300 border-amber-700/80";
    } else if (angle.includes("Us vs Them")) {
      badgeColor = "bg-purple-950/80 text-purple-300 border-purple-700/80";
    } else if (angle.includes("Objection")) {
      badgeColor = "bg-rose-950/80 text-rose-300 border-rose-700/80";
    } else if (angle.includes("Smart Shopper") || angle.includes("Bargain")) {
      badgeColor = "bg-blue-950/80 text-blue-300 border-blue-700/80";
    } else if (angle.includes("ASMR")) {
      badgeColor = "bg-cyan-950/80 text-cyan-300 border-cyan-700/80";
    } else if (angle.includes("Transformation")) {
      badgeColor = "bg-emerald-950/80 text-emerald-300 border-emerald-700/80";
    }

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badgeColor} flex items-center gap-1 shadow-sm`}>
        <Target size={11} />
        {angle}
      </span>
    );
  }

  function renderSoundBadge(soundType?: string, soundTitle?: string, soundAuthor?: string) {
    const stype = soundType || "unknown";
    let badge = (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-slate-800 text-slate-300 border-slate-700 flex items-center gap-1">
        <Music size={10} />
        <span>Âm thanh</span>
      </span>
    );

    if (stype === "voiceover") {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-sky-950/90 text-sky-300 border-sky-600/60 flex items-center gap-1 shadow-sm">
          <Mic size={10} className="text-sky-400" />
          <span>🎙️ Voiceover</span>
        </span>
      );
    } else if (stype === "voice_with_music") {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-purple-950/90 text-purple-300 border-purple-600/60 flex items-center gap-1 shadow-sm">
          <Headphones size={10} className="text-purple-400" />
          <span>🎧 Voice + BGM</span>
        </span>
      );
    } else if (stype === "music_only") {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-pink-950/90 text-pink-300 border-pink-600/60 flex items-center gap-1 shadow-sm">
          <Music size={10} className="text-pink-400" />
          <span>🎵 Nhạc Trend</span>
        </span>
      );
    } else if (stype === "asmr") {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-950/90 text-emerald-300 border-emerald-600/60 flex items-center gap-1 shadow-sm">
          <Volume2 size={10} className="text-emerald-400" />
          <span>🤫 ASMR</span>
        </span>
      );
    }

    if (!soundTitle) return badge;

    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {badge}
        <span className="text-[10px] text-slate-300 truncate max-w-[170px] font-medium" title={`${soundTitle}${soundAuthor ? ` by @${soundAuthor}` : ''}`}>
          {soundTitle}
        </span>
      </div>
    );
  }

  const reviewMap = new Map<string, ReviewItem>();
  if (data?.reviews) {
    data.reviews.forEach((r) => {
      if (r.video_id) reviewMap.set(r.video_id, r);
    });
  }

  const insightsMap = data?.comment_insights || {};
  const masterAI = useMemo(() => {
    if (data?.master_analyses && data.master_analyses[selectedEngine]) {
      return data.master_analyses[selectedEngine];
    }
    if (data?.master_analysis?.engine === selectedEngine) {
      return data.master_analysis;
    }
    return data?.master_analysis || null;
  }, [data?.master_analyses, data?.master_analysis, selectedEngine]);

  const sortedFilteredVideos = useMemo(() => {
    if (!data?.videos) return [];
    let list = [...data.videos];

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase();
      list = list.filter(
        (v) =>
          (v.creator && v.creator.toLowerCase().includes(q)) ||
          (v.caption && v.caption.toLowerCase().includes(q)) ||
          (v.sound_title && v.sound_title.toLowerCase().includes(q)) ||
          (v.sound_author && v.sound_author.toLowerCase().includes(q))
      );
    }

    if (minViewsFilter > 0) {
      list = list.filter((v) => (v.views || 0) >= minViewsFilter);
    }

    if (soundTypeFilter !== "all") {
      list = list.filter((v) => v.sound_type === soundTypeFilter);
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortBy === "score") {
        valA = a.score ?? 0;
        valB = b.score ?? 0;
      } else if (sortBy === "views") {
        valA = a.views ?? 0;
        valB = b.views ?? 0;
      } else if (sortBy === "likes") {
        valA = a.likes ?? 0;
        valB = b.likes ?? 0;
      } else if (sortBy === "saves") {
        valA = a.saves ?? 0;
        valB = b.saves ?? 0;
      } else if (sortBy === "comments") {
        valA = a.comments ?? 0;
        valB = b.comments ?? 0;
      } else if (sortBy === "engagement") {
        valA = a.engagement_rate ?? 0;
        valB = b.engagement_rate ?? 0;
      }
      return sortOrder === "desc" ? valB - valA : valA - valB;
    });

    return list;
  }, [data?.videos, sortBy, sortOrder, tableSearch, minViewsFilter]);

  const creatorMap = useMemo(() => {
    const map = new Map<string, CreatorItem>();
    for (const c of creatorsList) {
      map.set(c.creator, c);
    }
    return map;
  }, [creatorsList]);

  const filteredCreators = useMemo(() => {
    let list = [...creatorsList];

    if (kocSearchQuery.trim()) {
      const q = kocSearchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.creator.toLowerCase().includes(q) ||
          c.nickname.toLowerCase().includes(q) ||
          c.signature.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    if (kocTierFilter !== "all") {
      list = list.filter((c) => c.tier === kocTierFilter);
    }

    if (kocBookingFilter !== "all") {
      list = list.filter((c) => c.booking_status === kocBookingFilter);
    }

    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (kocSortBy === "multiplier") {
        valA = a.viral_multiplier;
        valB = b.viral_multiplier;
      } else if (kocSortBy === "views") {
        valA = a.max_views;
        valB = b.max_views;
      } else if (kocSortBy === "followers") {
        valA = a.follower_count;
        valB = b.follower_count;
      } else if (kocSortBy === "videos") {
        valA = a.videos_in_niche;
        valB = b.videos_in_niche;
      }
      return kocSortOrder === "desc" ? valB - valA : valA - valB;
    });

    return list;
  }, [creatorsList, kocSearchQuery, kocTierFilter, kocBookingFilter, kocSortBy, kocSortOrder]);

  const kocKPIs = useMemo(() => {
    const total = creatorsList.length;
    const hiddenGems = creatorsList.filter((c) => c.tier === "hidden_gem" || c.viral_multiplier >= 10).length;
    const realTraffic = creatorsList.filter((c) => c.tier === "real_traffic").length;
    const hasEmail = creatorsList.filter((c) => c.email && c.email.length > 0).length;
    const activeDeals = creatorsList.filter((c) =>
      ["contacted", "negotiating", "sent_sample", "published"].includes(c.booking_status)
    ).length;
    return { total, hiddenGems, realTraffic, hasEmail, activeDeals };
  }, [creatorsList]);

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

            {/* Niche Folder Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
              <select
                className="bg-transparent text-slate-200 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer font-semibold max-w-[200px] truncate"
                value={keyword}
                onChange={(e) => {
                  if (e.target.value === "__NEW_FOLDER__") {
                    setShowCreateFolderModal(true);
                  } else {
                    handleSwitchFolder(e.target.value);
                  }
                }}
              >
                {foldersList.map((f) => (
                  <option key={f.name} value={f.name} className="bg-slate-900 text-slate-100">
                    📁 {f.name} ({f.video_count} videos)
                  </option>
                ))}
                <option value="__NEW_FOLDER__" className="bg-slate-900 text-violet-400 font-bold">
                  ➕ Tạo Thư Mục Ngách Mới...
                </option>
              </select>

              <button
                onClick={() => setShowCreateFolderModal(true)}
                className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-600/20"
                title="Tạo Thư Mục / Ngách Mới Để Phân Tích Riêng"
              >
                <FolderPlus size={13} />
                <span className="hidden sm:inline">+ Thư Mục Mới</span>
              </button>

              <button
                onClick={() => setShowManageFoldersModal(true)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                title="Quản Lý Danh Sách Các Thư Mục Ngách"
              >
                <Folder size={13} className="text-amber-400" />
                <span className="hidden md:inline">Quản Lý ({foldersList.length})</span>
              </button>
            </div>
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
                disabled={runningEngineAI}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Chạy mô hình local Ollama phân tích bức tranh tổng thể toàn bộ ngách (0 đồng, không cần API)"
              >
                {runningEngineAI ? (
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

        {/* Empty State Banner For Freshly Created Niche Folder */}
        {data && data.videos && data.videos.length === 0 && !loading && (
          <div className="bg-gradient-to-r from-violet-950/30 via-slate-900 to-slate-950 border border-violet-500/30 rounded-3xl p-6 md:p-8 text-center mb-6 shadow-xl animate-in fade-in duration-300">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mx-auto mb-3 text-violet-400 shadow-lg shadow-violet-600/10">
              <FolderPlus size={28} />
            </div>
            <h3 className="text-xl md:text-2xl font-black text-white mb-2">
              Thư Mục Ngách: <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400 font-extrabold">{keyword}</span>
            </h3>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-5">
              Thư mục này chưa có video nào được cào. Toàn bộ video, dữ liệu bình luận và phân tích của ngách này sẽ được lưu trữ độc lập hoàn toàn với các ngách khác. Hãy bấm nút cào dữ liệu ở trên để bắt đầu phân tích!
            </p>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-gradient-to-r from-violet-600 via-pink-600 to-purple-600 hover:opacity-90 text-white font-bold px-6 py-3 rounded-2xl text-xs md:text-sm inline-flex items-center gap-2 shadow-xl shadow-violet-600/30 transition cursor-pointer"
            >
              <Play size={16} />
              <span>Bắt Đầu Cào {crawlLimit} Video Đầu Tiên Cho Ngách Này</span>
            </button>
          </div>
        )}

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

          <button
            onClick={() => setActiveTab("koc")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "koc"
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Users size={16} />
            <span>🎯 Booking & KOC Discovery ({creatorsList.length})</span>
          </button>
        </div>

        {/* TAB: MASTER AI OVERALL ANALYSIS (DUAL ENGINE: OLLAMA LOCAL & GEMINI ANTIGRAVITY) */}
        {activeTab === "overall" && (
          <div className="space-y-6">
            {/* Dual Engine Switcher */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-slate-950 p-2.5 rounded-3xl border border-slate-800">
              {/* Option 2: Gemini 3.8 Flash High */}
              <button
                onClick={() => setSelectedEngine("gemini")}
                className={`p-4 rounded-2xl text-left transition cursor-pointer relative overflow-hidden border ${
                  selectedEngine === "gemini"
                    ? "bg-gradient-to-r from-violet-950/90 via-purple-900/60 to-pink-950/90 border-violet-500 shadow-xl shadow-violet-900/30 text-white"
                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm md:text-base text-white">
                    <Sparkles size={18} className="text-pink-400" />
                    <span>Option 2: Gemini 3.8 Flash High (Antigravity AI)</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-violet-900/80 border border-violet-600 text-violet-200 font-bold">
                    SOTA Strategic
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trí tuệ Google DeepMind cấp cao &bull; Đọc toàn bộ 442 video &amp; 3,800+ comment &bull; Đúc kết chiến lược DTC &amp; kịch bản triệu view sắc bén.
                </p>
              </button>

              {/* Option 1: Ollama Local */}
              <button
                onClick={() => setSelectedEngine("ollama")}
                className={`p-4 rounded-2xl text-left transition cursor-pointer relative overflow-hidden border ${
                  selectedEngine === "ollama"
                    ? "bg-gradient-to-r from-emerald-950/90 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-900/20 text-white"
                    : "bg-slate-900/40 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 font-bold text-sm md:text-base text-white">
                    <Cpu size={18} className="text-emerald-400" />
                    <span>Option 1: Ollama Local (M4 Hardware)</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-600 text-emerald-200 font-bold">
                    $0 Cục Bộ M4
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Mô hình Qwen 4B chạy 100% Cục Bộ M4 &bull; Hoàn toàn offline không cần internet &bull; $0 chi phí &bull; Bảo mật dữ liệu nội bộ.
                </p>
              </button>
            </div>

            {/* Action Toolbar for the Selected Engine */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
                    {selectedEngine === "gemini" ? (
                      <>
                        <Sparkles className="text-pink-400" size={22} />
                        <span>Báo Cáo Chiến Lược Gemini 3.8 Flash High (Antigravity AI)</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="text-emerald-400" size={22} />
                        <span>Báo Cáo Chiến Lược Ollama Local (M4 Hardware)</span>
                      </>
                    )}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedEngine === "gemini"
                    ? "Phân tích chiến lược thương mại điện tử DTC bởi Google DeepMind Gemini từ dữ liệu SQLite."
                    : "Mô hình Ollama địa phương đọc toàn bộ database, chỉ số view/tym/comment và phân tích cục bộ."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedEngine === "gemini" && (
                  <button
                    onClick={() => setShowApiKeyModal(true)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-700"
                    title="Cấu hình Gemini API Key tùy chọn"
                  >
                    <Key size={13} className="text-amber-400" />
                    <span>{geminiApiKey ? "Đã có API Key" : "Cấu Hình API Key"}</span>
                  </button>
                )}

                <button
                  onClick={() => handleRunMasterEngineAI(selectedEngine)}
                  disabled={runningEngineAI}
                  className={`font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer disabled:opacity-50 text-white shadow-lg ${
                    selectedEngine === "gemini"
                      ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 shadow-violet-600/30"
                      : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
                  }`}
                >
                  {runningEngineAI ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Đang phân tích {selectedEngine === "gemini" ? "Gemini..." : "Ollama..."}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      <span>
                        {selectedEngine === "gemini"
                          ? "⚡ Cập Nhật Bằng Gemini 3.8 Flash High"
                          : "🔄 Chạy Lại Ollama Local (M4)"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!masterAI ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                {selectedEngine === "gemini" ? (
                  <Sparkles size={40} className="mx-auto mb-3 text-violet-400" />
                ) : (
                  <Cpu size={40} className="mx-auto mb-3 text-emerald-400" />
                )}
                <p className="text-base font-semibold">
                  Chưa có báo cáo {selectedEngine === "gemini" ? "Gemini 3.8 Flash High" : "Ollama Local"} cho từ khóa này.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Bấm nút bên trên để kích hoạt phân tích tự động.
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

                {/* Voice of Customer (Tiếng Nói Khách Hàng Từ 1,000+ Bình Luận) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                        <MessageSquare size={16} />
                        <span>Tiếng Nói Khách Hàng (Voice of Customer) &bull; Phân Tích 1,000+ Bình Luận</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Thống kê chủ đề bàn luận nhiều nhất &amp; trích xuất nhu cầu mua sắm thực tế từ comment TikTok.
                      </p>
                    </div>

                    <button
                      onClick={handleBatchCrawlComments}
                      disabled={batchCrawlingComments}
                      className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer self-start md:self-auto disabled:opacity-50"
                    >
                      {batchCrawlingComments ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Đang cào 1,000 cmt...</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          <span>🔄 Cào &amp; Cập Nhật 1,000 Bình Luận</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* VOC Summary Quote */}
                  {masterAI.voc_summary && (
                    <div className="bg-slate-950 p-4 rounded-2xl border border-violet-900/40 text-xs md:text-sm text-violet-200 leading-relaxed font-medium">
                      💡 <strong>Đúc kết từ bình luận:</strong> {masterAI.voc_summary}
                    </div>
                  )}

                  {/* Topic Clusters Distribution */}
                  {masterAI.customer_interests && masterAI.customer_interests.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        📊 Mức Độ Quan Tâm Theo Chủ Đề (Top Comment Themes)
                      </h4>
                      <div className="grid gap-2.5">
                        {masterAI.customer_interests.map((t, idx) => (
                          <div key={idx} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="font-semibold text-slate-200">{t.topic}</span>
                              <span className="font-mono text-purple-400 font-bold">{t.percentage}% ({t.count} cmt)</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, Math.max(5, t.percentage * 2))}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Two Columns: Buying Desires vs Top Objections */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {/* Buying Desires */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <ShoppingCart size={15} />
                        <span>Khán Giả Muốn Mua Gì Nhiều Nhất (Buying Desires &amp; Links)</span>
                      </div>
                      <div className="space-y-2">
                        {masterAI.buying_desires && masterAI.buying_desires.length > 0 ? (
                          masterAI.buying_desires.slice(0, 5).map((b, idx) => (
                            <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span className="font-semibold text-emerald-400">@{b.username || "khách hàng"}</span>
                                {b.likes > 0 && <span className="text-pink-400">❤️ {b.likes} tym</span>}
                              </div>
                              <p className="italic text-slate-200">"{b.text}"</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">Chưa có câu hỏi mua hàng trích xuất.</p>
                        )}
                      </div>
                    </div>

                    {/* Top Objections */}
                    <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
                        <ShieldAlert size={15} />
                        <span>Rào Cản &amp; Nghi Ngại Lớn Nhất (Objections / Doubts)</span>
                      </div>
                      <div className="space-y-2">
                        {masterAI.top_objections && masterAI.top_objections.length > 0 ? (
                          masterAI.top_objections.slice(0, 5).map((o, idx) => (
                            <div key={idx} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                                <span className="font-semibold text-amber-400">@{o.username || "khách hàng"}</span>
                                {o.likes > 0 && <span className="text-pink-400">❤️ {o.likes} tym</span>}
                              </div>
                              <p className="italic text-slate-200">"{o.text}"</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-500 italic">Chưa có rào cản phản đối trích xuất.</p>
                        )}
                      </div>
                    </div>
                  </div>
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

                {/* Audio Intelligence & Sound Strategy Section */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
                        <Music size={16} />
                        <span>Chiến Lược Âm Thanh & Nhạc Nền (Sound & Audio Intelligence)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Phân bổ tỷ trọng Giọng nói (Voiceover) vs Nhạc Trend (BGM) &bull; Top Sound viral nhất trong ngách
                      </p>
                    </div>
                    {data?.audio_summary && (
                      <span className="text-xs font-mono px-3 py-1 bg-slate-950 text-slate-300 rounded-xl border border-slate-800">
                        {data.audio_summary.total_analyzed} videos phân tích âm thanh
                      </span>
                    )}
                  </div>

                  {/* 4 Sound Distribution Cards */}
                  {data?.audio_summary?.distribution && data.audio_summary.distribution.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {data.audio_summary.distribution.map((d: any, idx: number) => {
                        let icon = <Mic size={14} className="text-sky-400" />;
                        let colorClass = "from-sky-950/60 to-slate-900 border-sky-800/60 text-sky-300";
                        if (d.sound_type === "voice_with_music") {
                          icon = <Headphones size={14} className="text-purple-400" />;
                          colorClass = "from-purple-950/60 to-slate-900 border-purple-800/60 text-purple-300";
                        } else if (d.sound_type === "music_only") {
                          icon = <Music size={14} className="text-pink-400" />;
                          colorClass = "from-pink-950/60 to-slate-900 border-pink-800/60 text-pink-300";
                        } else if (d.sound_type === "asmr") {
                          icon = <Volume2 size={14} className="text-emerald-400" />;
                          colorClass = "from-emerald-950/60 to-slate-900 border-emerald-800/60 text-emerald-300";
                        }

                        return (
                          <div key={idx} className={`bg-gradient-to-br ${colorClass} p-3.5 rounded-2xl border`}>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold flex items-center gap-1.5">{icon} {d.label.split('(')[0]}</span>
                              <span className="font-bold font-mono">{d.percentage}%</span>
                            </div>
                            <div className="text-lg font-bold text-white font-mono">{d.count} vids</div>
                            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                              <span>{(d.total_views || 0).toLocaleString()} views</span>
                              <span className="text-amber-300 font-mono">avg {d.avg_saves} saves</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Audio Insights & Winning Formula */}
                  <div className="grid md:grid-cols-2 gap-4 pt-1">
                    {/* Winning Audio Formula */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>Công Thức Âm Thanh Thắng Cuộc (Winning Audio Formula)</span>
                      </div>
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                        {masterAI.audio_strategy?.winning_audio_formula ||
                          "3 giây đầu dùng Spoken Hook dứt khoát ('Chiếc cây giả cứu rỗi căn phòng...') kết hợp âm thanh thao tác (Foley unboxing/uốn cành). Từ giây 4 trở đi, lồng nhạc nền chill/lofi không lời để giữ chân và kích thích chốt đơn."}
                      </p>
                      {masterAI.audio_strategy?.recommendation && (
                        <div className="text-xs text-amber-300/90 bg-amber-950/30 p-2.5 rounded-xl border border-amber-800/40 mt-2">
                          💡 <strong>Lời khuyên sản xuất:</strong> {masterAI.audio_strategy.recommendation}
                        </div>
                      )}
                    </div>

                    {/* Top Trending Sounds in Niche */}
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-2">
                      <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame size={14} />
                        <span>Top Bài Nhạc / Sound Được Dùng Nhiều Nhất</span>
                      </div>
                      <div className="space-y-1.5">
                        {(data?.audio_summary?.top_sounds || masterAI.audio_strategy?.top_sounds || []).slice(0, 4).map((s: any, sIdx: number) => (
                          <div key={sIdx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 truncate max-w-[240px]">
                              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-pink-400">
                                #{sIdx + 1}
                              </span>
                              <div className="truncate">
                                <p className="font-semibold text-white truncate" title={s.sound_title}>
                                  {s.sound_title}
                                </p>
                                {s.sound_author && (
                                  <p className="text-[10px] text-slate-500 truncate">@{s.sound_author}</p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] font-mono text-purple-300 font-semibold">{s.usage_count} videos</span>
                              <p className="text-[10px] text-slate-500 font-mono">{(s.total_views || 0).toLocaleString()} views</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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

        {/* TAB 1: REVIEWS WITH COMMENTS & 4 PILLARS & MULTIMODAL */}
        {activeTab === "reviews" && (
          <div className="space-y-5">
            {/* Header & Angle Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 p-4 rounded-3xl border border-slate-800">
              <div>
                <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-white">
                  <Sparkles className="text-pink-400" size={20} />
                  Creative Intelligence &bull; Tiếng Nói Khách Hàng &bull; Multimodal AI
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Phân loại trường phái DTC &bull; Bóc băng Whisper &bull; Soi góc quay Qwen-VL (100% Cục Bộ M4)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleRunTopMultimodal(5)}
                  disabled={analyzingTopMultimodal}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition cursor-pointer disabled:opacity-50"
                  title="Tự động tải stream, bóc băng và soi 3 khung hình cho Top 5 video viral nhất"
                >
                  {analyzingTopMultimodal ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang phân tích Top 5...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={13} className="text-yellow-300" />
                      <span>🚀 Bóc Băng & Soi Góc Quay Top 5 Winners</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Chips by DTC Angle */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 flex items-center gap-1 mr-1 text-[11px] font-semibold">
                <SlidersHorizontal size={12} /> Lọc Trường Phái DTC:
              </span>
              {[
                { id: "all", label: "Tất cả" },
                { id: "Transformation", label: "✨ Room Transformation" },
                { id: "Problem", label: "🎯 Problem-Solution (PAS)" },
                { id: "Objection", label: "🛡️ Objection Buster" },
                { id: "Smart Shopper", label: "💰 Smart Shopper / Find" },
                { id: "ASMR", label: "🌿 ASMR / Styling" },
                { id: "Us vs Them", label: "⚔️ Us vs Them" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedAngleFilter(chip.id)}
                  className={`px-3 py-1 rounded-full font-medium transition cursor-pointer text-xs ${
                    selectedAngleFilter === chip.id
                      ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 font-bold"
                      : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Sorting & Filter Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <ArrowUpDown size={13} className="text-purple-400" /> Sắp xếp:
                </span>
                {[
                  { id: "score", label: "🏆 Điểm Score" },
                  { id: "views", label: "👁️ Views" },
                  { id: "likes", label: "❤️ Tym" },
                  { id: "saves", label: "📌 Lưu" },
                  { id: "comments", label: "💬 Cmt" },
                  { id: "engagement", label: "⚡ Tương tác" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleToggleSort(s.id as any)}
                    className={`px-2.5 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 font-medium ${
                      sortBy === s.id
                        ? "bg-purple-600 text-white shadow font-bold"
                        : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    <span>{s.label}</span>
                    {sortBy === s.id && (sortOrder === "desc" ? <ArrowDown size={11} /> : <ArrowUp size={11} />)}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Lọc creator / caption..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-44"
                  />
                </div>
              </div>
            </div>

            {(!data?.videos || data.videos.length === 0) ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <Brain size={40} className="mx-auto mb-3 text-slate-600" />
                <p>Chưa có dữ liệu video cho từ khóa này.</p>
                <p className="text-xs text-slate-500 mt-1">Nhập từ khóa và nhấn "Cào Tiếp 20 Video Mới".</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedFilteredVideos
                  .filter((vid) => {
                    if (selectedAngleFilter === "all") return true;
                    const r = reviewMap.get(vid.video_id);
                    const ang = r?.ad_angle || "";
                    return ang.toLowerCase().includes(selectedAngleFilter.toLowerCase());
                  })
                  .map((vid, idx) => {
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
                              {creatorMap.get(vid.creator)?.viral_multiplier ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-full border border-amber-500/40 font-bold flex items-center gap-0.5">
                                  <Zap size={9} /> x{creatorMap.get(vid.creator)!.viral_multiplier}
                                </span>
                              ) : null}
                              {creatorMap.get(vid.creator)?.follower_count ? (
                                <span className="text-[10px] bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded-full border border-emerald-800/60 font-mono">
                                  {creatorMap.get(vid.creator)!.follower_count.toLocaleString()} flw
                                </span>
                              ) : vid.creator_followers && vid.creator_followers > 0 ? (
                                <span className="text-[10px] bg-slate-800 text-purple-300 px-1.5 py-0.5 rounded-full border border-purple-800/60 font-mono">
                                  {vid.creator_followers.toLocaleString()} flw
                                </span>
                              ) : null}
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
                          {renderAdAngleBadge(rev?.ad_angle)}
                          {renderSoundBadge(vid.sound_type, vid.sound_title, vid.sound_author)}
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

                      {/* MULTIMODAL INTELLIGENCE 360 (Whisper Audio + Qwen-VL Vision) */}
                      {rev?.spoken_hook || rev?.visual_hook || (rev?.keyframes && rev.keyframes.length > 0) ? (
                        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-violet-950/40 via-slate-950 to-pink-950/30 border border-violet-800/40">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
                            <div className="flex items-center gap-2">
                              <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                                <Mic size={11} /> Whisper Audio
                              </span>
                              <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                                <Camera size={11} /> Qwen-VL Vision
                              </span>
                              <span className="text-xs font-bold text-slate-200">Multimodal Intelligence (100% M4)</span>
                            </div>
                            <button
                              onClick={() => setMultimodalModalVid(rev)}
                              className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center gap-1 cursor-pointer transition"
                            >
                              <span>Xem toàn văn lời thoại & 3 khung hình</span>
                              <ChevronRight size={13} />
                            </button>
                          </div>

                          <div className="grid md:grid-cols-12 gap-3 items-center">
                            {rev?.keyframes && rev.keyframes.length > 0 && (
                              <div className="md:col-span-4 flex items-center gap-2">
                                {rev.keyframes.slice(0, 3).map((kf, kfIdx) => (
                                  <img
                                    key={kfIdx}
                                    src={`${API_BASE}${kf}`}
                                    alt={`Keyframe ${kfIdx + 1}`}
                                    className="w-20 h-24 object-cover rounded-xl border border-slate-700 hover:scale-105 transition cursor-pointer shadow-md"
                                    onClick={() => setMultimodalModalVid(rev)}
                                    title="Bấm để phóng to và xem phân tích"
                                  />
                                ))}
                              </div>
                            )}

                            <div className={rev?.keyframes && rev.keyframes.length > 0 ? "md:col-span-8 space-y-2" : "md:col-span-12 space-y-2"}>
                              {(vid.sound_title || vid.sound_type) && (
                                <p className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap">
                                  <strong className="text-pink-400 font-semibold flex items-center gap-1">
                                    <Music size={11} /> Nhạc / Âm thanh:
                                  </strong>
                                  {renderSoundBadge(vid.sound_type)}
                                  {vid.sound_title && (
                                    <span className="text-slate-200 font-medium">"{vid.sound_title}"</span>
                                  )}
                                  {vid.sound_author && (
                                    <span className="text-slate-500 text-[11px]">bởi @{vid.sound_author}</span>
                                  )}
                                </p>
                              )}
                              {rev?.spoken_hook && (
                                <p className="text-xs text-slate-300">
                                  <strong className="text-pink-400 font-semibold">🎙️ Lời thoại mở đầu (0-3s): </strong>
                                  <span className="italic text-slate-100">&ldquo;{rev.spoken_hook}&rdquo;</span>
                                </p>
                              )}
                              {rev?.visual_hook && (
                                <p className="text-xs text-slate-300">
                                  <strong className="text-violet-400 font-semibold">👁️ Hook thị giác: </strong>
                                  <span className="text-slate-200">{rev.visual_hook}</span>
                                </p>
                              )}
                              {rev?.on_screen_text && rev.on_screen_text !== "None" && rev.on_screen_text !== "Không có" && (
                                <p className="text-xs text-slate-400">
                                  <strong className="text-amber-400 font-semibold">🔤 Chữ trên màn hình: </strong>
                                  <span className="font-mono text-slate-200">{rev.on_screen_text}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Film size={14} className="text-purple-400" />
                            <span>Chưa bóc băng lời nói KOC & soi góc quay thị giác cho video này.</span>
                          </div>
                          <button
                            onClick={() => handleRunMultimodal(vid.video_id)}
                            disabled={analyzingMultimodalVid === vid.video_id}
                            className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-pink-600/20 transition cursor-pointer disabled:opacity-50"
                          >
                            {analyzingMultimodalVid === vid.video_id ? (
                              <>
                                <Loader2 size={12} className="animate-spin text-white" />
                                <span>Đang bóc băng Whisper & Qwen-VL...</span>
                              </>
                            ) : (
                              <>
                                <Zap size={12} className="text-yellow-300" />
                                <span>⚡ Bóc Băng & Soi Góc Quay</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

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
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-purple-400" />
                  Bảng Dữ Liệu Chi Tiết ({sortedFilteredVideos.length} / {data?.videos?.length || 0} Videos)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nhấp vào tiêu đề cột để sắp xếp &bull; Tích hợp cột AI Phân Tích Tổng Thể &bull; Hỗ trợ xuất CSV.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                SQLite: data/tiktok.db
              </span>
            </div>

            {/* Filter Toolbar for Database */}
            <div className="flex flex-col gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-semibold flex items-center gap-1">
                    <Filter size={13} className="text-violet-400" /> Lọc nhanh Views:
                  </span>
                  {[
                    { label: "Tất cả", val: 0 },
                    { label: ">50K", val: 50000 },
                    { label: ">100K", val: 100000 },
                    { label: ">500K", val: 500000 },
                    { label: ">1M", val: 1000000 },
                  ].map((f) => (
                    <button
                      key={f.val}
                      onClick={() => setMinViewsFilter(f.val)}
                      className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-medium ${
                        minViewsFilter === f.val
                          ? "bg-purple-600 text-white font-bold shadow"
                          : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Tìm creator / caption / sound..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl pl-7 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 w-56"
                    />
                  </div>
                </div>
              </div>

              {/* Sound Type Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-900">
                <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
                  <Music size={12} className="text-pink-400" /> Loại Âm Thanh:
                </span>
                {[
                  { id: "all", label: "Tất cả âm thanh" },
                  { id: "voiceover", label: "🎙️ Voiceover" },
                  { id: "voice_with_music", label: "🎧 Voice + BGM" },
                  { id: "music_only", label: "🎵 Nhạc Trend" },
                  { id: "asmr", label: "🤫 ASMR" },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setSoundTypeFilter(st.id)}
                    className={`px-2.5 py-1 rounded-xl transition cursor-pointer font-medium text-[11px] ${
                      soundTypeFilter === st.id
                        ? "bg-pink-600 text-white font-bold shadow"
                        : "bg-slate-900/90 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-3 px-3">#</th>
                    <th className="py-3 px-3">
                      <span>Creator</span>
                    </th>
                    <th
                      onClick={() => handleToggleSort("views")}
                      className="py-3 px-3 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Views</span>
                        {sortBy === "views" ? (
                          sortOrder === "desc" ? <ArrowDown size={12} className="text-purple-400" /> : <ArrowUp size={12} className="text-purple-400" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort("likes")}
                      className="py-3 px-3 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Tym</span>
                        {sortBy === "likes" ? (
                          sortOrder === "desc" ? <ArrowDown size={12} className="text-purple-400" /> : <ArrowUp size={12} className="text-purple-400" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort("saves")}
                      className="py-3 px-3 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Lưu</span>
                        {sortBy === "saves" ? (
                          sortOrder === "desc" ? <ArrowDown size={12} className="text-purple-400" /> : <ArrowUp size={12} className="text-purple-400" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort("comments")}
                      className="py-3 px-3 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Bình Luận</span>
                        {sortBy === "comments" ? (
                          sortOrder === "desc" ? <ArrowDown size={12} className="text-purple-400" /> : <ArrowUp size={12} className="text-purple-400" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleToggleSort("score")}
                      className="py-3 px-3 cursor-pointer hover:text-white transition select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>Score</span>
                        {sortBy === "score" ? (
                          sortOrder === "desc" ? <ArrowDown size={12} className="text-purple-400" /> : <ArrowUp size={12} className="text-purple-400" />
                        ) : (
                          <ArrowUpDown size={11} className="text-slate-600" />
                        )}
                      </div>
                    </th>
                    <th className="py-3 px-3 min-w-[200px]">Âm Thanh & Nhạc</th>
                    <th className="py-3 px-3 min-w-[280px]">AI Phân Tích Tổng Thể (Local)</th>
                    <th className="py-3 px-3">Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {sortedFilteredVideos.map((v, i) => {
                    const rev = reviewMap.get(v.video_id);
                    return (
                      <tr key={v.video_id || i} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono text-purple-400">{i + 1}</td>
                        <td className="py-3 px-3 font-semibold text-white">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span>@{v.creator || "unknown"}</span>
                              {creatorMap.get(v.creator)?.viral_multiplier ? (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 py-0.2 rounded font-bold">
                                  x{creatorMap.get(v.creator)!.viral_multiplier}
                                </span>
                              ) : null}
                            </div>
                            {creatorMap.get(v.creator)?.follower_count ? (
                              <span className="text-[10px] text-emerald-400 font-mono">
                                {(creatorMap.get(v.creator)!.follower_count).toLocaleString()} flw
                              </span>
                            ) : v.creator_followers && v.creator_followers > 0 ? (
                              <span className="text-[10px] text-purple-400 font-mono">
                                {(v.creator_followers).toLocaleString()} flw
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono">{(v.views || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono">{(v.likes || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono">{(v.saves || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-mono">{(v.comments || 0).toLocaleString()}</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{v.score}</td>
                        <td className="py-3 px-3">
                          {renderSoundBadge(v.sound_type, v.sound_title, v.sound_author)}
                        </td>
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
          </div>
        )}

        {/* TAB: BOOKING & KOC DISCOVERY */}
        {activeTab === "koc" && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/20 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-widest flex items-center gap-1">
                      <Users size={11} /> Creator Intelligence & Booking CRM
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      Playwright Live Profile Scraper
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    🎯 KOC Discovery & Booking Pipeline
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Phân tích tỷ lệ đòn bẩy <strong className="text-amber-400">Viral Multiplier (Views / Follower)</strong> để tìm ra những <strong>💎 Hidden Gems (ít follow nhưng view x10, x20+ lần)</strong> để học kịch bản hoặc booking giá hời, kết hợp với các <strong>🌿 KOC uy tín ngách (20K-120K follow)</strong> sở hữu tệp người xem thật chuyển đổi cao.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleBatchEnrichCreators}
                    disabled={batchEnriching}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs shadow-lg shadow-orange-500/20 transition cursor-pointer disabled:opacity-50"
                    title="Chạy Playwright bóc tách Followers, Video Count, Bio & Email của Top 20 KOC"
                  >
                    {batchEnriching ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Đang quét Top 20 Live Profile...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>⚡ Quét Live Profile Top 20 KOC</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => loadCreators()}
                    disabled={loadingCreators}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                  >
                    <RefreshCw size={13} className={loadingCreators ? "animate-spin" : ""} />
                    <span>Tải lại</span>
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Cards Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="text-[11px] text-slate-400 font-medium">Tổng KOC Trong Ngách</div>
                <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
                  {kocKPIs.total}
                  <span className="text-xs font-normal text-slate-500">creators</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Từ các video đã cào</div>
              </div>

              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-2xl p-4">
                <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                  💎 Hidden Gems
                </div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {kocKPIs.hiddenGems}
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-1">Đòn bẩy view &ge; 10x - 20x+</div>
              </div>

              <div className="bg-gradient-to-br from-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-4">
                <div className="text-[11px] text-teal-300 font-medium flex items-center gap-1">
                  🌿 Real Niche Traffic
                </div>
                <div className="text-2xl font-black text-teal-300 mt-1">
                  {kocKPIs.realTraffic}
                </div>
                <div className="text-[10px] text-teal-400/80 mt-1">20K - 120K flw uy tín ngách</div>
              </div>

              <div className="bg-gradient-to-br from-violet-950/40 to-slate-900 border border-violet-500/30 rounded-2xl p-4">
                <div className="text-[11px] text-violet-300 font-medium flex items-center gap-1">
                  <Mail size={12} /> Có Sẵn Email
                </div>
                <div className="text-2xl font-black text-violet-300 mt-1">
                  {kocKPIs.hasEmail}
                </div>
                <div className="text-[10px] text-violet-400/80 mt-1">Trích xuất tự động từ Bio</div>
              </div>

              <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-4">
                <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                  <Award size={12} /> Tiến Độ Booking
                </div>
                <div className="text-2xl font-black text-amber-300 mt-1">
                  {kocKPIs.activeDeals}
                </div>
                <div className="text-[10px] text-amber-400/80 mt-1">Đang đàm phán / Đã chốt</div>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo @username, nickname, bio hoặc email..."
                    value={kocSearchQuery}
                    onChange={(e) => setKocSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Trạng thái:</span>
                  <select
                    value={kocBookingFilter}
                    onChange={(e) => setKocBookingFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="new">🆕 Mới (Chưa liên hệ)</option>
                    <option value="contacted">✉️ Đã gửi DM / Email</option>
                    <option value="negotiating">💬 Đang thương lượng giá</option>
                    <option value="sent_sample">📦 Đã gửi hàng mẫu</option>
                    <option value="published">🎉 Đã lên video</option>
                    <option value="rejected">❌ Tạm hoãn / Từ chối</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">Sắp xếp:</span>
                  <select
                    value={kocSortBy}
                    onChange={(e) => setKocSortBy(e.target.value as any)}
                    className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="multiplier">⚡ Đòn bẩy (Multiplier x cao nhất)</option>
                    <option value="views">👁️ Lượt xem cao nhất (Max Views)</option>
                    <option value="followers">👥 Số Follower cao nhất</option>
                    <option value="videos">📹 Số video trong ngách</option>
                  </select>
                  <button
                    onClick={() => setKocSortOrder(kocSortOrder === "desc" ? "asc" : "desc")}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-xl text-xs flex items-center justify-center cursor-pointer"
                    title={kocSortOrder === "desc" ? "Đang xếp: Cao xuống thấp" : "Đang xếp: Thấp lên cao"}
                  >
                    <ArrowUpDown size={14} />
                  </button>
                </div>
              </div>

              {/* Tier Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
                <span className="text-[11px] text-slate-400 mr-1 font-medium">Phân tầng KOC:</span>
                {[
                  { id: "all", label: `Tất cả (${kocKPIs.total})` },
                  { id: "hidden_gem", label: `💎 Hidden Gems (${kocKPIs.hiddenGems})` },
                  { id: "real_traffic", label: `🌿 Real Niche Traffic (${kocKPIs.realTraffic})` },
                  { id: "rising_star", label: "🚀 Rising Stars" },
                  { id: "macro_authority", label: "👑 Macro Brand" },
                  { id: "unverified", label: "🔍 Cần quét Profile" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setKocTierFilter(t.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      kocTierFilter === t.id
                        ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Creators List Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredCreators.map((c) => (
                <div
                  key={c.creator}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-5 transition shadow-xl flex flex-col justify-between gap-3.5"
                >
                  <div className="space-y-3">
                    {/* Top Row: Info & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {c.avatar_url ? (
                          <img
                            src={c.avatar_url}
                            alt={c.creator}
                            className="w-12 h-12 rounded-full object-cover border border-slate-700 shadow"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-orange-600 flex items-center justify-center text-white font-bold text-base shadow">
                            {c.creator.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={c.profile_url}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold text-white hover:text-amber-400 text-sm flex items-center gap-1 transition"
                            >
                              @{c.creator}
                              <ExternalLink size={11} className="text-slate-500" />
                            </a>
                            {c.verified && (
                              <CheckCircle2 size={13} className="text-blue-400 fill-blue-400/20" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{c.nickname}</p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                            c.tier === "hidden_gem"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : c.tier === "real_traffic"
                              ? "bg-teal-500/20 text-teal-300 border-teal-500/40"
                              : c.tier === "rising_star"
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                              : c.tier === "macro_authority"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {c.tier_label}
                        </span>

                        {c.viral_multiplier > 0 && (
                          <span className="text-xs font-black text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Zap size={11} /> x{c.viral_multiplier} Đòn bẩy
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics 4-Box Strip */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 text-center">
                      <div>
                        <div className="text-[10px] text-slate-500">Followers</div>
                        <div className="text-xs font-bold text-white">
                          {c.follower_count > 0 ? (
                            c.follower_count.toLocaleString()
                          ) : (
                            <button
                              onClick={() => handleEnrichSingleCreator(c.creator)}
                              className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                            >
                              Quét ngay
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Max Views</div>
                        <div className="text-xs font-bold text-emerald-400">
                          {c.max_views.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Max Saves</div>
                        <div className="text-xs font-bold text-blue-400">
                          {c.max_saves.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Video ngách</div>
                        <div className="text-xs font-bold text-purple-400">
                          {c.videos_in_niche} clips
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Box */}
                    <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-2.5 space-y-1">
                      <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                        <Sparkles size={12} /> {c.recommendation}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-relaxed">
                        {c.tier_desc}
                      </div>
                    </div>

                    {/* Bio & Contact Strip */}
                    <div className="space-y-2">
                      {c.signature && (
                        <p className="text-[11px] text-slate-300 bg-slate-950/30 p-2 rounded-lg border border-slate-800/40 italic line-clamp-2">
                          &ldquo;{c.signature}&rdquo;
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}?subject=Đề xuất hợp tác tài trợ sản phẩm Decor TikTok Shop&body=Chào ${c.nickname}, bên mình xem video của bạn thấy rất chất lượng và muốn gửi mẫu sản phẩm decor hợp tác làm video...`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold shadow-md shadow-violet-600/20 transition"
                          >
                            <Mail size={12} />
                            <span>Gửi Email: {c.email}</span>
                          </a>
                        ) : (
                          <a
                            href={c.profile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                          >
                            <Send size={12} />
                            <span>Nhắn tin DM TikTok</span>
                          </a>
                        )}

                        <button
                          onClick={() => handleEnrichSingleCreator(c.creator)}
                          disabled={enrichingCreator === c.creator}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 transition"
                          title="Quét lại live follower, bio và email của KOC này"
                        >
                          <RefreshCw
                            size={11}
                            className={enrichingCreator === c.creator ? "animate-spin" : ""}
                          />
                          <span>{enrichingCreator === c.creator ? "Đang quét..." : "Quét Live"}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Booking CRM Section */}
                  <div className="space-y-2.5 pt-2.5 border-t border-slate-800/80">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                          Tiến độ hợp tác:
                        </label>
                        <select
                          value={c.booking_status}
                          onChange={(e) =>
                            handleUpdateBooking(c.creator, e.target.value, c.booking_notes, c.booking_price)
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="new">🆕 Mới (Chưa liên hệ)</option>
                          <option value="contacted">✉️ Đã gửi DM / Email</option>
                          <option value="negotiating">💬 Đang thương lượng giá</option>
                          <option value="sent_sample">📦 Đã gửi hàng mẫu</option>
                          <option value="published">🎉 Đã lên video</option>
                          <option value="rejected">❌ Tạm hoãn / Từ chối</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                          Giá deal dự kiến ($):
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          defaultValue={c.booking_price || ""}
                          onBlur={(e) =>
                            handleUpdateBooking(
                              c.creator,
                              c.booking_status,
                              c.booking_notes,
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5 font-medium">
                          Ghi chú deal:
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Gửi mẫu cây 7ft..."
                          defaultValue={c.booking_notes || ""}
                          onBlur={(e) =>
                            handleUpdateBooking(
                              c.creator,
                              c.booking_status,
                              e.target.value,
                              c.booking_price
                            )
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Top Performing Videos in Niche */}
                    {c.top_videos && c.top_videos.length > 0 && (
                      <div className="pt-1.5 border-t border-slate-800/50 space-y-1">
                        <div className="text-[10px] text-slate-500 font-medium">
                          Video tiêu biểu trong ngách:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.top_videos.map((tv) => (
                            <a
                              key={tv.video_id}
                              href={tv.url}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-md px-2 py-1 text-[10px] text-slate-300 flex items-center gap-1.5 transition"
                              title={tv.caption}
                            >
                              <Play size={9} className="text-emerald-400 fill-emerald-400" />
                              <span className="font-semibold text-emerald-400">
                                {tv.views.toLocaleString()} views
                              </span>
                              <span className="text-slate-500 truncate max-w-[120px]">
                                {tv.caption || "Video"}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredCreators.length === 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 space-y-3">
                <Users size={36} className="mx-auto text-slate-600" />
                <p className="text-sm font-semibold">Không tìm thấy KOC nào phù hợp với bộ lọc hiện tại.</p>
                <p className="text-xs text-slate-600">Hãy thử đổi từ khóa tìm kiếm hoặc chọn lại phân tầng KOC.</p>
              </div>
            )}
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

        {/* Multimodal Deep Analysis Modal */}
        {multimodalModalVid && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-gradient-to-tr from-pink-500 to-violet-600 rounded-2xl shadow-lg shadow-pink-500/20">
                    <Film size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white flex items-center gap-2">
                      <span>Bản Bóc Băng & Soi Góc Quay Multimodal 360°</span>
                      <span className="bg-pink-950/80 border border-pink-700 text-pink-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Mac Mini M4 Local AI
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Video ID: {multimodalModalVid.video_id} &bull; Phân tích bởi Whisper AI + Qwen-VL Vision
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setMultimodalModalVid(null)}
                  className="text-slate-400 hover:text-white text-xl font-bold p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* 3 Keyframes Preview Gallery */}
              {multimodalModalVid.keyframes && multimodalModalVid.keyframes.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">
                    <Camera size={14} />
                    <span>3 Khung Hình Chủ Chốt Được Trích Xuất (Keyframes)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {multimodalModalVid.keyframes.map((kf, kfIdx) => {
                      const labels = ["0-1s: Hook Thị Giác (Scroll-Stopper)", "Giữa: Trình Diễn / Góc Phòng", "Cuối: Kêu Gọi Hành Động (CTA)"];
                      return (
                        <div key={kfIdx} className="bg-slate-950 p-2.5 rounded-2xl border border-slate-800 flex flex-col items-center">
                          <img
                            src={`${API_BASE}${kf}`}
                            alt={labels[kfIdx] || `Keyframe ${kfIdx + 1}`}
                            className="w-full h-44 object-cover rounded-xl border border-slate-800 mb-2 shadow-md"
                          />
                          <span className="text-[11px] font-medium text-slate-400 text-center">
                            {labels[kfIdx] || `Khung hình ${kfIdx + 1}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Grid 2 Columns: Spoken Audio & Visual Breakdown */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Audio Column */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-wider">
                        <Mic size={14} />
                        <span>Lời Thoại Bóc Băng (Whisper AI)</span>
                      </div>
                      <button
                        onClick={() => {
                          if (multimodalModalVid.transcript) {
                            navigator.clipboard.writeText(multimodalModalVid.transcript);
                            alert("Đã sao chép toàn văn lời thoại!");
                          }
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-900 px-2 py-1 rounded-lg border border-slate-800"
                      >
                        <Copy size={11} /> Sao chép
                      </button>
                    </div>

                    {/* Spoken Hook Highlight */}
                    <div className="bg-pink-950/30 border border-pink-800/40 p-3 rounded-xl mb-3">
                      <span className="text-[10px] font-bold text-pink-400 uppercase block mb-1">
                        🎣 Lời Thoại Mở Đầu 3 Giây (Spoken Hook)
                      </span>
                      <p className="text-sm font-semibold text-white italic">
                        &ldquo;{multimodalModalVid.spoken_hook || "Không phát hiện lời nói trong 3s đầu"}&rdquo;
                      </p>
                    </div>

                    {/* Full Transcript */}
                    <div className="mt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                        Toàn Văn Lời Thoại KOC:
                      </span>
                      <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-2 bg-slate-900/50 p-3 rounded-xl border border-slate-800/60 font-sans">
                        {multimodalModalVid.transcript || "Âm thanh nền nhạc (Không có lời thoại)"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Vision Column */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider">
                    <Camera size={14} />
                    <span>Phân Tích Thị Giác (Qwen-VL Vision)</span>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-violet-400 uppercase block mb-0.5">
                      👁️ Điểm Dừng Mắt (Visual Hook)
                    </span>
                    <p className="text-xs text-slate-200">
                      {multimodalModalVid.visual_hook || "Góc quay cận cảnh sản phẩm"}
                    </p>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-blue-400 uppercase block mb-0.5">
                      🏠 Bối Cảnh / Không Gian (Setting)
                    </span>
                    <p className="text-xs text-slate-200">
                      {multimodalModalVid.setting || "Không gian phòng thực tế"}
                    </p>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-amber-400 uppercase block mb-0.5">
                      🔤 Chữ Nổi Trên Màn Hình (On-Screen Text OCR)
                    </span>
                    <p className="text-xs text-slate-200 font-mono">
                      {multimodalModalVid.on_screen_text || "Không có chữ nổi"}
                    </p>
                  </div>

                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">
                      🎨 Phong Cách Khung Hình:
                    </span>
                    <span className="text-xs font-semibold text-emerald-300">
                      {multimodalModalVid.visual_style || "Aesthetic Room Tour"}
                    </span>
                  </div>
                </div>
              </div>

              {/* DTC Angle & Winning Formula */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/90 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Target size={14} />
                    <span>Trường Phái DTC & Công Thức Đề Xuất (Ad Angle & Brief)</span>
                  </div>
                  {renderAdAngleBadge(multimodalModalVid.ad_angle)}
                </div>

                <div className="bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white block mb-1">💡 Công thức chuyển hóa (Winning Formula):</strong>
                  {multimodalModalVid.winning_formula}
                </div>
              </div>

              <button
                onClick={() => setMultimodalModalVid(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Gemini API Key Configuration Modal */}
        {showApiKeyModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-tr from-violet-500 to-pink-500 rounded-xl shadow-md">
                    <Key size={16} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Cấu Hình Google Gemini API Key</h3>
                </div>
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Bạn có thể nhập Google Gemini API Key để backend gọi trực tiếp Gemini Cloud API bất cứ lúc nào. Nếu không nhập, Antigravity AI sẽ tiếp tục tổng hợp dữ liệu chiến lược cho bạn.
              </p>

              <div className="space-y-2.5 mb-5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Gemini API Key:
                </label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Key được lưu an toàn trong LocalStorage của trình duyệt và gửi qua kết nối cục bộ.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowApiKeyModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleSaveApiKey(geminiApiKey)}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-violet-600/30"
                >
                  Lưu Cấu Hình
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Tạo Thư Mục Ngách Mới */}
        {showCreateFolderModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-gradient-to-tr from-violet-600 to-pink-600 rounded-xl shadow-md text-white">
                    <FolderPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Tạo Thư Mục Ngách Mới</h3>
                    <p className="text-xs text-slate-400">Tách biệt hoàn toàn dữ liệu & phân tích cho từng sản phẩm</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Tên từ khóa ngách (Keyword / Folder Name) <span className="text-pink-400">*</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="VD: sunset lamp, led face mask, portable blender..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateNewFolder()}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    autoFocus
                  />
                </div>

                {/* Quick suggestions */}
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
                    Gợi ý ngách TikTok Shop tiềm năng:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "sunset lamp",
                      "portable blender",
                      "led face mask",
                      "creatine gummies",
                      "wireless car charger",
                      "ice roller",
                      "galaxy projector",
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewFolderName(s)}
                        className="text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-violet-500/50 px-2.5 py-1 rounded-lg transition cursor-pointer"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Mô tả hoặc mục tiêu nghiên cứu (Tùy chọn):
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Test sản phẩm Q3, clone kịch bản viral, tìm KOC review..."
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setShowCreateFolderModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateNewFolder}
                  disabled={!newFolderName.trim() || creatingFolder}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-violet-600/30 transition cursor-pointer disabled:opacity-50"
                >
                  {creatingFolder ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <FolderPlus size={14} />
                      <span>Tạo Thư Mục & Phân Tích Riêng</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Quản Lý Thư Mục Ngách */}
        {showManageFoldersModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-xl shadow-md text-white">
                    <Folder size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      Quản Lý Thư Mục Ngách ({foldersList.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Chuyển đổi phân tích giữa các ngách hoặc xóa làm sạch dữ liệu
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManageFoldersModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded-lg cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 mb-6">
                {foldersList.map((f) => {
                  const isActive = f.name === keyword;
                  return (
                    <div
                      key={f.name}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isActive
                          ? "bg-slate-950/90 border-violet-500/50 shadow-md shadow-violet-500/10"
                          : "bg-slate-950/40 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">📁 {f.name}</span>
                          {isActive && (
                            <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Đang xem
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>
                            Video: <strong className="text-emerald-400">{f.video_count}</strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Views: <strong className="text-blue-400">{(f.total_views || 0).toLocaleString()}</strong>
                          </span>
                          {f.description && (
                            <>
                              <span>&bull;</span>
                              <span className="italic text-slate-500 line-clamp-1">{f.description}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {!isActive ? (
                          <button
                            onClick={() => handleSwitchFolder(f.name)}
                            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                          >
                            Chuyển Sang
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500 font-medium px-2 py-1">Hiện tại</span>
                        )}

                        <button
                          onClick={() => handleDeleteFolder(f.name)}
                          disabled={deletingFolderName === f.name}
                          className="bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 p-2 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                          title="Xóa thư mục ngách và toàn bộ dữ liệu video liên quan"
                        >
                          {deletingFolderName === f.name ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <Trash2 size={13} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {foldersList.length === 0 && (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    Chưa có thư mục ngách nào được tạo.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                <button
                  onClick={() => {
                    setShowManageFoldersModal(false);
                    setShowCreateFolderModal(true);
                  }}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-violet-600/20 cursor-pointer"
                >
                  <FolderPlus size={13} />
                  <span>+ Tạo Thư Mục Mới</span>
                </button>

                <button
                  onClick={() => setShowManageFoldersModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
