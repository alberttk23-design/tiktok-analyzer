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
  Key,
  Users,
  Mail,
  Send,
  Award,
  FolderPlus,
  Hash,
  Tag,
  Folder,
  Trash2,
  Music,
  Headphones,
  Volume2,
} from "lucide-react";
import { NicheCharts } from "./components/NicheCharts";

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
  is_live_gemini?: boolean;
  ai_model?: string;
  summary: string;
  viral_triggers: string[];
  friction_solutions: string[];
  winning_blueprint: string;
  customer_interests?: { topic: string; count: number; percentage: number }[];
  buying_desires?: { username: string; text: string; likes: number }[];
  top_objections?: { username: string; text: string; likes: number }[];
  voc_summary?: string;
  voc_deep?: any;
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
    audio_intelligence?: any;
    voc_deep?: any;
    caption_analytics?: {
      top_hashtags: { tag: string; count: number; percentage: number; total_views?: number; avg_views?: number }[];
      top_pairs: { pair: string; tag1: string; tag2: string; count: number; percentage: number }[];
      top_phrases: { phrase: string; count: number; total_views?: number; avg_views?: number }[];
      avg_tags: number;
      avg_chars?: number;
      avg_words?: number;
      cta_rate?: number;
      question_rate?: number;
      styles?: Record<string, { count: number; percentage: number }>;
      top_templates?: { creator: string; clean_text: string; tags: string[]; views: number; saves: number }[];
      total_videos: number;
    };
    comment_stats?: {
      total_tiktok_comments: number;
      total_crawled_comments: number;
      crawl_percentage: number;
    };
  } | null>(null);

  const [patterns, setPatterns] = useState<MacroPatterns | null>(null);
  const [historyCount, setHistoryCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"reviews" | "overall" | "patterns" | "ideas" | "briefs" | "database" | "koc" | "sounds" | "voc_seo">("reviews");
  const [selectedConcept, setSelectedConcept] = useState<ConceptItem | null>(null);
  const [currentJob, setCurrentJob] = useState<JobStatus | null>(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"gemini" | "ollama">("gemini");
  const [runningEngineAI, setRunningEngineAI] = useState<boolean>(false);
  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => localStorage.getItem("gemini_api_key") || "");
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [crawlLimit, setCrawlLimit] = useState<number>(20);
  const [soundTypeFilter, setSoundTypeFilter] = useState<string>("all");

  // Sound & Voice Intelligence Tab states
  const [soundTabSearch, setSoundTabSearch] = useState<string>("");
  const [soundTabFilter, setSoundTabFilter] = useState<string>("all");
  const [copiedSoundText, setCopiedSoundText] = useState<string | null>(null);
  const [audioIntelData, setAudioIntelData] = useState<any>(null);

  // Advanced VoC Deep Intelligence states
  const [vocDeepData, setVocDeepData] = useState<any>(null);
  const [vocPillarFilter, setVocPillarFilter] = useState<string>("all");
  const [copiedClapbackId, setCopiedClapbackId] = useState<string | null>(null);
  const [vocSeoSubTab, setVocSeoSubTab] = useState<"all" | "seo" | "comments" | "clapback">("all");
  const [copiedCaptionText, setCopiedCaptionText] = useState<string | null>(null);
  const [copiedHashtagSet, setCopiedHashtagSet] = useState<boolean>(false);

  // AI-Driven Dynamic Analysis states
  const [vocAiClusters, setVocAiClusters] = useState<any>(null);
  const [vocAiClustering, setVocAiClustering] = useState<boolean>(false);
  const [voiceCorpus, setVoiceCorpus] = useState<any>(null);
  const [visualCorpus, setVisualCorpus] = useState<any>(null);
  const [batchTranscribing, setBatchTranscribing] = useState<boolean>(false);
  const [batchTranscribeJob, setBatchTranscribeJob] = useState<{ jobId: string; progress: number; message: string } | null>(null);
  const [batchKeyframing, setBatchKeyframing] = useState<boolean>(false);
  const [batchKeyframeJob, setBatchKeyframeJob] = useState<{ jobId: string; progress: number; message: string } | null>(null);

  // Niche Folders states
  const [foldersList, setFoldersList] = useState<NicheFolder[]>([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState<boolean>(false);
  const [showManageFoldersModal, setShowManageFoldersModal] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [newFolderDesc, setNewFolderDesc] = useState<string>("");
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);
  const [deletingFolderName, setDeletingFolderName] = useState<string | null>(null);
  const [saveToActiveFolder, setSaveToActiveFolder] = useState<boolean>(true);
  const [mergingFolder, setMergingFolder] = useState<boolean>(false);

  // Video-specific comment crawl state
  const [crawlingCommentVid, setCrawlingCommentVid] = useState<string | null>(null);
  const [expandedCommentVid, setExpandedCommentVid] = useState<string | null>(null);

  // Multimodal AI states (Whisper Audio & Qwen-VL Vision)
  const [multimodalModalVid, setMultimodalModalVid] = useState<ReviewItem | null>(null);
  const [analyzingMultimodalVid, setAnalyzingMultimodalVid] = useState<string | null>(null);
  const [analyzingTopMultimodal, setAnalyzingTopMultimodal] = useState(false);
  const [selectedAngleFilter, setSelectedAngleFilter] = useState<string>("all");
  const [selectedHashtagFilter, setSelectedHashtagFilter] = useState<string>("all");
  const [showCaptionAnalytics, setShowCaptionAnalytics] = useState<boolean>(true);
  const [copiedCaptionId, setCopiedCaptionId] = useState<string | null>(null);

  // Sorting & Filtering states (Score, Views, Tym/Likes, Lưu/Saves, Comments, Engagement)
  const [sortBy, setSortBy] = useState<"score" | "views" | "likes" | "saves" | "comments" | "engagement">("score");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [minViewsFilter, setMinViewsFilter] = useState<number>(0);
  const [batchCrawlingComments, setBatchCrawlingComments] = useState<boolean>(false);
  const [commentCrawlJob, setCommentCrawlJob] = useState<{
    jobId: string;
    progress: number;
    message: string;
  } | null>(null);

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

  async function handleMergeFolder(sourceName: string, targetName: string) {
    if (!sourceName || !targetName || sourceName === targetName) return;
    if (!confirm(`Bạn có chắc chắn muốn gộp toàn bộ video và phân tích từ thư mục "${sourceName}" vào thư mục "${targetName}" không?\n\n(Tất cả video của "${sourceName}" sẽ được chuyển vào "${targetName}", và thư mục "${sourceName}" sẽ được dọn sạch).`)) {
      return;
    }
    setMergingFolder(true);
    try {
      const res = await fetch(`${API_BASE}/api/folders/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_folder: sourceName, target_folder: targetName }),
      });
      if (res.ok) {
        await loadFolders();
        setKeyword(targetName);
        await loadData(targetName);
      }
    } catch (e) {
      console.error("Merge folder error:", e);
    } finally {
      setMergingFolder(false);
    }
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

      const audioUrl = `${API_BASE}/api/audio-intelligence?keyword=${encodeURIComponent(kw)}`;
      const audioRes = await fetch(audioUrl);
      if (audioRes.ok) {
        const audioJson = await audioRes.json();
        setAudioIntelData(audioJson);
      }

      const vocUrl = `${API_BASE}/api/voc-deep?keyword=${encodeURIComponent(kw)}`;
      const vocRes = await fetch(vocUrl);
      if (vocRes.ok) {
        const vocJson = await vocRes.json();
        setVocDeepData(vocJson);
      }

      const patUrl = `${API_BASE}/api/patterns?keyword=${encodeURIComponent(kw)}`;
      const patRes = await fetch(patUrl);
      if (patRes.ok) {
        const patJson = await patRes.json();
        setPatterns(patJson);
      }

      // Load AI VoC Clusters
      try {
        const vocAiRes = await fetch(`${API_BASE}/api/voc-ai-clusters?keyword=${encodeURIComponent(kw)}`);
        if (vocAiRes.ok) {
          const vocAiJson = await vocAiRes.json();
          if (vocAiJson && vocAiJson.clusters && vocAiJson.clusters.length > 0) {
            setVocAiClusters(vocAiJson);
          } else {
            setVocAiClusters(null);
          }
        }
      } catch (_) {}

      // Load Voice Corpus Analysis
      try {
        const vcRes = await fetch(`${API_BASE}/api/voice-corpus?keyword=${encodeURIComponent(kw)}`);
        if (vcRes.ok) {
          const vcJson = await vcRes.json();
          setVoiceCorpus(vcJson);
        }
      } catch (_) {}

      // Load Visual Corpus (Content Types Breakdown)
      try {
        const visRes = await fetch(`${API_BASE}/api/visual-corpus?keyword=${encodeURIComponent(kw)}`);
        if (visRes.ok) {
          const visJson = await visRes.json();
          setVisualCorpus(visJson);
        }
      } catch (_) {}
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
    const effectiveFolder = saveToActiveFolder && data?.keyword ? data.keyword : keyword.trim();

    try {
      const res = await fetch(`${API_BASE}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          limit: crawlLimit,
          target_folder: saveToActiveFolder && data?.keyword ? data.keyword : undefined,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        setCurrentJob({
          job_id: jobId,
          keyword: effectiveFolder,
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

  // Batch crawl comments across videos for Master Report
  async function handleBatchCrawlComments(crawlAll: boolean = false) {
    if (batchCrawlingComments || !keyword.trim()) return;
    setBatchCrawlingComments(true);
    setCommentCrawlJob({
      jobId: "",
      progress: 5,
      message: crawlAll ? "Đang chuẩn bị quét toàn bộ ngách & giải mã các thảo luận..." : "Đang chuẩn bị cào top video...",
    });
    try {
      const res = await fetch(`${API_BASE}/api/crawl-top-comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: keyword.trim(),
          top_n: crawlAll ? 120 : 15,
          max_comments_per_video: crawlAll ? 1000 : 100,
          crawl_all: crawlAll,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        if (!jobId) {
          setTimeout(async () => {
            await loadData();
            setBatchCrawlingComments(false);
            setCommentCrawlJob(null);
          }, 3000);
          return;
        }

        // Live polling job status every 1.5s
        const pollInterval = setInterval(async () => {
          try {
            const jRes = await fetch(`${API_BASE}/api/jobs/${jobId}`);
            if (jRes.ok) {
              const j = await jRes.json();
              if (j && (j.job_id || j.status)) {
                setCommentCrawlJob({
                  jobId: j.job_id || jobId,
                  progress: typeof j.progress === "number" ? j.progress : 10,
                  message: j.message || "Đang xử lý bình luận...",
                });
                if (j.status === "completed" || j.status === "failed") {
                  clearInterval(pollInterval);
                  await loadData();
                  setTimeout(() => {
                    setBatchCrawlingComments(false);
                    setCommentCrawlJob(null);
                  }, 1500);
                }
              }
            }
          } catch (err) {
            console.error("Job poll error:", err);
          }
        }, 1500);
      } else {
        setBatchCrawlingComments(false);
        setCommentCrawlJob(null);
      }
    } catch (e) {
      console.error("Batch crawl comments failed:", e);
      setBatchCrawlingComments(false);
      setCommentCrawlJob(null);
    }
  }

  // 1. AI VoC Dynamic Clustering
  async function handleRunVocAiClustering() {
    if (vocAiClustering || !keyword.trim()) return;
    setVocAiClustering(true);
    try {
      const res = await fetch(`${API_BASE}/api/voc-ai-cluster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), engine: "gemini" }),
      });
      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        if (!jobId) {
          setVocAiClustering(false);
          return;
        }
        const poll = setInterval(async () => {
          try {
            const jRes = await fetch(`${API_BASE}/api/jobs/${jobId}`);
            if (jRes.ok) {
              const j = await jRes.json();
              if (j.status === "completed" || j.status === "failed") {
                clearInterval(poll);
                setVocAiClustering(false);
                const cRes = await fetch(`${API_BASE}/api/voc-ai-clusters?keyword=${encodeURIComponent(keyword.trim())}`);
                if (cRes.ok) {
                  const cJson = await cRes.json();
                  if (cJson && cJson.clusters) setVocAiClusters(cJson);
                }
              }
            }
          } catch (err) {
            console.error("VoC AI cluster poll error:", err);
          }
        }, 2000);
      } else {
        setVocAiClustering(false);
      }
    } catch (e) {
      console.error("AI VoC Clustering failed:", e);
      setVocAiClustering(false);
    }
  }

  // 2. Batch Transcribe All Videos in Niche
  async function handleRunBatchTranscribe(scope: "all" | "voiceover_only" = "all") {
    if (batchTranscribing || !keyword.trim()) return;
    setBatchTranscribing(true);
    setBatchTranscribeJob({
      jobId: "",
      progress: 5,
      message: "Đang khởi động batch Whisper AI bóc băng toàn bộ âm thanh...",
    });
    try {
      const res = await fetch(`${API_BASE}/api/batch-transcribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), scope }),
      });
      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        if (!jobId) {
          setBatchTranscribing(false);
          setBatchTranscribeJob(null);
          return;
        }
        const poll = setInterval(async () => {
          try {
            const jRes = await fetch(`${API_BASE}/api/jobs/${jobId}`);
            if (jRes.ok) {
              const j = await jRes.json();
              if (j) {
                setBatchTranscribeJob({
                  jobId: j.job_id || jobId,
                  progress: typeof j.progress === "number" ? j.progress : 10,
                  message: j.message || "Đang bóc băng...",
                });
                if (j.status === "completed" || j.status === "failed") {
                  clearInterval(poll);
                  await loadData();
                  const vRes = await fetch(`${API_BASE}/api/voice-corpus?keyword=${encodeURIComponent(keyword.trim())}`);
                  if (vRes.ok) {
                    const vJson = await vRes.json();
                    if (vJson) setVoiceCorpus(vJson);
                  }
                  setTimeout(() => {
                    setBatchTranscribing(false);
                    setBatchTranscribeJob(null);
                  }, 1500);
                }
              }
            }
          } catch (err) {
            console.error("Batch transcribe poll error:", err);
          }
        }, 2000);
      } else {
        setBatchTranscribing(false);
        setBatchTranscribeJob(null);
      }
    } catch (e) {
      console.error("Batch transcribe failed:", e);
      setBatchTranscribing(false);
      setBatchTranscribeJob(null);
    }
  }

  // 3. Batch Keyframe Extract & Vision Classification
  async function handleRunBatchKeyframes() {
    if (batchKeyframing || !keyword.trim()) return;
    setBatchKeyframing(true);
    setBatchKeyframeJob({
      jobId: "",
      progress: 5,
      message: "Đang khởi động trích xuất khung hình và phân loại visual bằng Qwen-VL...",
    });
    try {
      const res = await fetch(`${API_BASE}/api/batch-keyframes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      if (res.ok) {
        const json = await res.json();
        const jobId = json.job_id;
        if (!jobId) {
          setBatchKeyframing(false);
          setBatchKeyframeJob(null);
          return;
        }
        const poll = setInterval(async () => {
          try {
            const jRes = await fetch(`${API_BASE}/api/jobs/${jobId}`);
            if (jRes.ok) {
              const j = await jRes.json();
              if (j) {
                setBatchKeyframeJob({
                  jobId: j.job_id || jobId,
                  progress: typeof j.progress === "number" ? j.progress : 10,
                  message: j.message || "Đang phân loại visual...",
                });
                if (j.status === "completed" || j.status === "failed") {
                  clearInterval(poll);
                  await loadData();
                  const visRes = await fetch(`${API_BASE}/api/visual-corpus?keyword=${encodeURIComponent(keyword.trim())}`);
                  if (visRes.ok) {
                    const visJson = await visRes.json();
                    if (visJson) setVisualCorpus(visJson);
                  }
                  setTimeout(() => {
                    setBatchKeyframing(false);
                    setBatchKeyframeJob(null);
                  }, 1500);
                }
              }
            }
          } catch (err) {
            console.error("Batch keyframes poll error:", err);
          }
        }, 2000);
      } else {
        setBatchKeyframing(false);
        setBatchKeyframeJob(null);
      }
    } catch (e) {
      console.error("Batch keyframes failed:", e);
      setBatchKeyframing(false);
      setBatchKeyframeJob(null);
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
          let updatedReviews = [...(data.reviews || [])];
          const exists = updatedReviews.some((r) => r.video_id === videoId);
          if (exists) {
            updatedReviews = updatedReviews.map((r) => {
              if (r.video_id === videoId) {
                return {
                  ...r,
                  ...json.data,
                };
              }
              return r;
            });
          } else {
            updatedReviews.push({
              video_id: videoId,
              ...json.data,
            });
          }

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
          <span>🎵 BGM / Nhạc Nền</span>
        </span>
      );
    } else if (stype === "asmr") {
      badge = (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-emerald-950/90 text-emerald-300 border-emerald-600/60 flex items-center gap-1 shadow-sm">
          <Volume2 size={10} className="text-emerald-400" />
          <span>🤫 ASMR Thật</span>
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

          {/* Active Folder Target Row */}
          {data?.keyword && (
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 px-1 text-xs">
              <label className="flex items-center gap-2 text-violet-300 hover:text-white cursor-pointer select-none bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-xl transition">
                <input
                  type="checkbox"
                  checked={saveToActiveFolder}
                  onChange={(e) => setSaveToActiveFolder(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-violet-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <span>
                  Lưu video tìm kiếm vào thư mục hiện tại: <strong className="text-white font-bold">📁 {data.keyword}</strong>
                  {saveToActiveFolder ? (
                    <span className="text-emerald-400 text-[11px] ml-1.5 font-medium">(Bật: Dùng từ khóa phụ/đồng nghĩa sẽ gom chung vào đây, không tách file mới)</span>
                  ) : (
                    <span className="text-amber-400 text-[11px] ml-1.5 font-medium">(Tắt: Sẽ tạo thư mục ngách riêng biệt mới)</span>
                  )}
                </span>
              </label>

              <button
                onClick={() => setShowManageFoldersModal(true)}
                className="text-slate-400 hover:text-violet-300 flex items-center gap-1.5 transition cursor-pointer text-xs font-semibold py-1"
              >
                <Folder size={13} className="text-amber-400" />
                <span>Quản lý &amp; Gộp thư mục ({foldersList.length})</span>
              </button>
            </div>
          )}

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
            <span>📊 Biểu Đồ & Macro DNA ({data?.videos?.length || 0})</span>
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

          <button
            onClick={() => setActiveTab("sounds")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "sounds"
                ? "bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg shadow-pink-600/20 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <Music size={16} />
            <span>🎵 Âm Thanh & Voice AI</span>
          </button>

          <button
            onClick={() => setActiveTab("voc_seo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs md:text-sm transition cursor-pointer ${
              activeTab === "voc_seo"
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-lg shadow-sky-600/25 font-bold"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            <MessageSquare size={16} />
            <span>💬 Caption SEO & Bình Luận (VoC)</span>
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
                  Trí tuệ Google DeepMind cấp cao &bull; Đọc toàn bộ {data?.videos?.length || 0} video &amp; {data?.comment_stats?.total_crawled_comments?.toLocaleString() || 0} comment &bull; Đúc kết chiến lược DTC &amp; kịch bản triệu view sắc bén.
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
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <Target size={16} />
                      <span>Bức Tranh Toàn Cảnh & Đánh Giá Ngách Thị Trường</span>
                    </div>
                    {selectedEngine === "gemini" && (
                      masterAI.is_live_gemini ? (
                        <span className="bg-gradient-to-r from-violet-500/20 to-pink-500/20 text-pink-300 border border-pink-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
                          <Sparkles size={12} className="text-pink-400" />
                          <span>Google Gemini Trực Tiếp ({masterAI.ai_model || "Flash"})</span>
                        </span>
                      ) : (
                        <span className="bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                          <span>Bản Tổng Hợp Cục Bộ (Fallback)</span>
                        </span>
                      )
                    )}
                    {selectedEngine === "ollama" && (
                      <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
                        <Cpu size={12} className="text-emerald-400" />
                        <span>Mô Hình Ollama Local</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm md:text-base text-slate-200 leading-relaxed font-medium">
                    {masterAI.summary}
                  </p>
                </div>

                {/* VOICE OF CUSTOMER STRATEGIC HIGHLIGHTS (Clean Overview Card Linking to Tab 5) */}
                {(() => {
                  const voc = vocDeepData || data?.voc_deep || masterAI.voc_deep || {};
                  const pillars = voc.pillars || {};
                  const totalCommentsAnalyzed = voc.total_analyzed || data?.comment_stats?.total_crawled_comments || 0;
                  const pDec = pillars?.decision_confusion || {};
                  const pAes = pillars?.aesthetic_skepticism || {};
                  const pPrice = pillars?.competitor_comparison || {};

                  return (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                            <MessageSquare size={16} />
                            <span>Trọng Tâm Tiếng Nói Khách Hàng (VoC Highlights)</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Bóc tách từ <strong>{totalCommentsAnalyzed.toLocaleString()} bình luận thực tế</strong> trên TikTok cho ngách '{keyword}'
                          </p>
                        </div>

                        <button
                          onClick={() => setActiveTab("voc_seo")}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-violet-600/20 transition cursor-pointer self-start sm:self-auto"
                        >
                          <span>Xem Toàn Bộ Ma Trận VoC &amp; Kịch Bản Phản Đòn</span>
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* 3 Key Friction Highlights */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
                        <div className="bg-slate-950 p-4 rounded-2xl border border-sky-800/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                              🪴 Chậu &amp; Phụ Kiện
                            </span>
                            <span className="text-xs font-mono font-bold text-sky-400">
                              {pDec.percentage || 16.2}% cmt
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-white">Băn Khoăn Về Chậu &amp; Size Cây</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Khách sốc vì chậu decor ngoài thị trường quá đắt ($499), cây đi kèm chậu đen nhỏ không vững.
                          </p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-amber-800/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              👁️ Hoài Nghi Chất Liệu
                            </span>
                            <span className="text-xs font-mono font-bold text-amber-400">
                              {pAes.percentage || 5.2}% cmt
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-white">Sợ Lá Nhựa Giả / Bóng Nilon</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Khách ngần ngại bấm mua vì sợ nhận hàng trông thô đểu, cần video quay macro không filter.
                          </p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-violet-800/40 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                              🏷️ Chiến Lược Dupe
                            </span>
                            <span className="text-xs font-mono font-bold text-violet-400">
                              {pPrice.percentage || 3.9}% cmt
                            </span>
                          </div>
                          <h5 className="text-xs font-bold text-white">So Sánh Giá Với Showroom Lớn</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Khách săn lùng phiên bản chất lượng tương đương Pottery Barn nhưng giá chỉ bằng 1/3.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

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

                {/* AUDIO STRATEGY HIGHLIGHTS (Clean Overview Card Linking to Tab 4) */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
                        <Music size={16} />
                        <span>Trọng Tâm Âm Thanh &amp; Nhạc Nền (Audio Strategy Highlights)</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Phân bổ tỷ trọng Giọng nói (Voiceover) vs Nhạc nền (BGM) &bull; Công thức âm thanh chốt đơn
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("sounds")}
                      className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-pink-600/20 transition cursor-pointer self-start sm:self-auto"
                    >
                      <span>Xem Kho Lời Thoại (Voice Corpus) &amp; Nhạc Trend</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 pt-1">
                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} />
                        <span>Công Thức Âm Thanh Thắng Cuộc</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {masterAI.audio_strategy?.winning_audio_formula ||
                          "3 giây đầu dùng Spoken Hook dứt khoát kết hợp âm thanh thao tác (Foley unboxing/uốn cành). Từ giây 4 trở đi, lồng nhạc nền chill/lofi không lời để giữ chân và kích thích chốt đơn."}
                      </p>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame size={14} />
                        <span>Định Hướng Giọng Nói (Voice Direction)</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {masterAI.audio_strategy?.dominant_style ||
                          "Voiceover (Thuyết minh trực tiếp) mang lại tỷ lệ lưu (Saves) cao hơn 24.5% so với video chỉ chèn nhạc thông thường."}
                      </p>
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
                  onClick={handleRunBatchKeyframes}
                  disabled={batchKeyframing}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Tự động tải 1 khung hình mở đầu (kf1) của từng video và đưa qua Qwen-VL để phân loại dạng video (unboxing, decor, review...)"
                >
                  {batchKeyframing ? (
                    <Loader2 size={13} className="animate-spin text-pink-400" />
                  ) : (
                    <Camera size={13} className="text-pink-400" />
                  )}
                  <span>📸 Phân Loại Hình Ảnh Toàn Ngách</span>
                </button>

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

            {/* Batch Keyframe Progress Banner */}
            {batchKeyframeJob && (
              <div className="bg-gradient-to-r from-pink-950/70 via-purple-950/50 to-slate-900 border border-pink-500/50 rounded-2xl p-4 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-pink-200 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-pink-400" />
                    {batchKeyframeJob.message}
                  </span>
                  <span className="font-mono font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-lg">
                    {batchKeyframeJob.progress}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 h-1.5 rounded-full transition-all duration-300 shadow-sm shadow-pink-500/50"
                    style={{ width: `${Math.min(100, Math.max(5, batchKeyframeJob.progress))}%` }}
                  />
                </div>
              </div>
            )}

            {/* VISUAL CONTENT TYPES DISTRIBUTION (If classified) */}
            {visualCorpus?.content_types && visualCorpus.content_types.length > 0 && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
                    <Camera size={15} />
                    <span>Phân Loại Định Dạng Nội Dung Thị Giác ({visualCorpus.total_classified} video đã phân tích)</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Qwen-VL Vision AI</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
                  {visualCorpus.content_types.map((ct: any, ctIdx: number) => {
                    const typeIcons: Record<string, string> = {
                      "Aesthetic Room Tour": "🏡",
                      "POV Unboxing": "📦",
                      "Demonstration": "🛠️",
                      "Before/After": "✨",
                      "Selfie Talking Head": "🗣️",
                      "ASMR Styling": "🌿",
                      "Product Showcase": "🔍",
                    };
                    const icon = typeIcons[ct.type] || "🎬";

                    return (
                      <div
                        key={ctIdx}
                        className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-2 hover:border-pink-500/40 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-base">{icon}</span>
                            <span className="font-mono font-bold text-pink-400 text-xs">{ct.pct}%</span>
                          </div>
                          <span className="text-xs font-bold text-white block truncate" title={ct.type}>
                            {ct.type}
                          </span>
                        </div>
                        <div>
                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full"
                              style={{ width: `${Math.min(100, Math.max(8, ct.pct))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                            {ct.count} video
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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

            {/* CAPTION & HASHTAG SEO TREND ANALYTICS */}
            {data?.caption_analytics && data.caption_analytics.top_hashtags?.length > 0 && (
              <div className="bg-gradient-to-r from-sky-950/40 via-slate-900/90 to-indigo-950/40 border border-sky-800/40 rounded-3xl p-4 md:p-5 shadow-xl">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowCaptionAnalytics(!showCaptionAnalytics)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                      <Hash size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm md:text-base font-bold text-white">Thống Kê Caption & Cặp Hashtag Xu Hướng (SEO TikTok)</h3>
                        <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full font-mono">
                          {data.caption_analytics.total_videos} video &bull; TB {data.caption_analytics.avg_tags} tags/video
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Khám phá các hashtag và cụm từ khóa mà các video triệu view hay đăng chung với nhau</p>
                    </div>
                  </div>
                  <button className="text-xs text-sky-400 hover:text-sky-300 font-semibold px-2.5 py-1 bg-sky-950/60 border border-sky-800/60 rounded-xl transition cursor-pointer">
                    {showCaptionAnalytics ? "Thu gọn ▲" : "Mở rộng ▼"}
                  </button>
                </div>

                {showCaptionAnalytics && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
                    {/* Row 1: Top Hashtags with filter */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1">
                          <Tag size={12} /> Top 15 Hashtag Phổ Biến Nhất Ngách (Bấm để lọc):
                        </span>
                        {selectedHashtagFilter !== "all" && (
                          <button
                            onClick={() => setSelectedHashtagFilter("all")}
                            className="text-[11px] text-pink-400 hover:underline font-semibold cursor-pointer"
                          >
                            ✕ Xóa lọc thẻ (Đang lọc: {selectedHashtagFilter})
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {data.caption_analytics.top_hashtags.map((item, hIdx) => {
                          const isActive = selectedHashtagFilter.toLowerCase() === item.tag.toLowerCase();
                          return (
                            <button
                              key={hIdx}
                              onClick={() => setSelectedHashtagFilter(isActive ? "all" : item.tag)}
                              className={`text-xs px-2.5 py-1 rounded-xl border flex items-center gap-1.5 transition cursor-pointer ${
                                isActive
                                  ? "bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/30 font-bold"
                                  : "bg-slate-950/80 text-slate-300 border-slate-800 hover:border-sky-700/80 hover:text-sky-200"
                              }`}
                              title={`Lọc danh sách theo ${item.tag}`}
                            >
                              <span className="font-semibold">{item.tag}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-sky-700 text-white" : "bg-slate-800 text-slate-400"}`}>
                                {item.count} ({item.percentage}%)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Row 2: Top Co-occurring Pairs & Top Phrases */}
                    <div className="grid md:grid-cols-2 gap-3 pt-1">
                      {/* Pairs */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                        <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <span>🔗 Các Cặp Hashtag Hay Đi Chung Nhất:</span>
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {data.caption_analytics.top_pairs.slice(0, 8).map((p, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50">
                              <span className="font-mono text-indigo-200">{p.pair}</span>
                              <span className="text-[11px] font-semibold text-slate-400">{p.count} video ({p.percentage}%)</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Phrases */}
                      <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
                        <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <span>💡 Cụm Từ Khóa SEO Phổ Biến Trong Caption:</span>
                        </h4>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {data.caption_analytics.top_phrases.slice(0, 8).map((phr, phrIdx) => (
                            <div key={phrIdx} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50">
                              <span className="text-slate-200 capitalize font-medium">&ldquo;{phr.phrase}&rdquo;</span>
                              <span className="text-[11px] font-semibold text-slate-400">{phr.count} lần</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                    if (selectedAngleFilter !== "all") {
                      const r = reviewMap.get(vid.video_id);
                      const ang = r?.ad_angle || "";
                      if (!ang.toLowerCase().includes(selectedAngleFilter.toLowerCase())) return false;
                    }
                    if (selectedHashtagFilter !== "all") {
                      const cap = (vid.caption || "").toLowerCase();
                      if (!cap.includes(selectedHashtagFilter.toLowerCase())) return false;
                    }
                    return true;
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
                        {/* 1. Caption & SEO Tags */}
                        <div className="bg-slate-950/70 border border-slate-800/70 rounded-2xl p-3.5 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                                <span>📝 Caption & Hashtags Bài Đăng</span>
                              </div>
                              <button
                                onClick={() => {
                                  if (vid.caption) {
                                    navigator.clipboard.writeText(vid.caption);
                                    setCopiedCaptionId(vid.video_id);
                                    setTimeout(() => setCopiedCaptionId(null), 2000);
                                  }
                                }}
                                className="text-[10px] text-slate-400 hover:text-sky-300 flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded cursor-pointer transition"
                                title="Sao chép toàn bộ caption"
                              >
                                {copiedCaptionId === vid.video_id ? (
                                  <>
                                    <Check size={10} className="text-emerald-400" />
                                    <span className="text-emerald-400 font-semibold">Đã copy</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={10} />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Clean Caption Text & Hashtags */}
                            {(() => {
                              const fullCaption = vid.caption || "";
                              const rawTags = (fullCaption.match(/#[a-zA-Z0-9_\-]+/g) || []);
                              const cleanText = fullCaption.replace(/#[a-zA-Z0-9_\-]+/g, "").replace(/https?:\/\/\S+/g, "").trim();

                              return (
                                <div className="space-y-2">
                                  {cleanText ? (
                                    <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-normal">
                                      &ldquo;{cleanText}&rdquo;
                                    </p>
                                  ) : (
                                    <p className="text-xs text-slate-500 italic">
                                      Video này creator không viết lời mô tả, chỉ gắn thẻ hashtags.
                                    </p>
                                  )}

                                  {/* Hashtag Badges */}
                                  {rawTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-1">
                                      {rawTags.map((tag, tIdx) => (
                                        <span
                                          key={tIdx}
                                          onClick={() => setSelectedHashtagFilter(tag)}
                                          className="text-[10px] bg-sky-950/60 border border-sky-800/60 text-sky-300 px-1.5 py-0.5 rounded-md hover:bg-sky-900/80 cursor-pointer transition font-mono"
                                          title={`Bấm để lọc các video có thẻ ${tag}`}
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                            <span>{(vid.caption || "").length} ký tự</span>
                            <span>{((vid.caption || "").match(/#[a-zA-Z0-9_\-]+/g) || []).length} thẻ hashtags</span>
                          </div>
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
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-violet-400 uppercase tracking-wider">
                              <span>🧠 Tâm Lý Người Mua (Buyer Psychology)</span>
                            </div>
                            {ins && ins.total_crawled > 0 ? (
                              <span className="text-[10px] bg-violet-950/80 border border-violet-700/60 text-violet-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                {ins.total_crawled} cmt thật
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                                AI Ngách
                              </span>
                            )}
                          </div>

                          {ins && ins.total_crawled > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="bg-emerald-950/80 border border-emerald-800/70 text-emerald-300 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                                  🛒 {Math.round(((ins.buying_intent?.length || 0) / ins.total_crawled) * 100)}% Hỏi mua/xin link ({ins.buying_intent?.length || 0})
                                </span>
                                <span className="bg-amber-950/80 border border-amber-800/70 text-amber-300 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                                  ⚠️ {Math.round(((ins.objections?.length || 0) / ins.total_crawled) * 100)}% Rào cản/lo ngại ({ins.objections?.length || 0})
                                </span>
                                {ins.top_faqs && ins.top_faqs.length > 0 && (
                                  <span className="bg-sky-950/80 border border-sky-800/70 text-sky-300 px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1">
                                    ❓ {ins.top_faqs.length} FAQ
                                  </span>
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                                {ins.summary || rev?.buyer_psychology || "Đánh trúng nhu cầu thẩm mỹ và giải tỏa nỗi lo thực tế của khách hàng."}
                              </p>
                              {ins.buying_intent && ins.buying_intent.length > 0 && (
                                <p className="text-[11px] text-emerald-300/90 italic bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-xl">
                                  💬 Khách hỏi mua: &ldquo;{ins.buying_intent[0].text}&rdquo;
                                </p>
                              )}
                              {ins.objections && ins.objections.length > 0 && (
                                <p className="text-[11px] text-amber-300/90 italic bg-amber-950/30 border border-amber-900/40 p-2 rounded-xl">
                                  💬 Khách thắc mắc: &ldquo;{ins.objections[0].text}&rdquo;
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
                                {rev?.buyer_psychology || "Đánh trúng khao khát nâng cấp không gian sống, giải tỏa nỗi sợ tốn công chăm sóc và chứng minh sự hợp lý về giá cả."}
                              </p>
                              <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                                <span>Chưa cào dữ liệu bình luận riêng</span>
                                <button
                                  onClick={() => handleCrawlDeepComments(vid.video_id)}
                                  disabled={crawlingCommentVid === vid.video_id}
                                  className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer transition flex items-center gap-1"
                                >
                                  <Zap size={10} /> Cào cmt đo % ngay
                                </button>
                              </div>
                            </div>
                          )}
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
            {/* Interactive Visual Analytics (Recharts) */}
            <NicheCharts
              videos={data?.videos || []}
              reviews={data?.reviews || []}
              keyword={data?.keyword || keyword || "niche"}
            />

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
                  { id: "voiceover", label: "🎙️ Voiceover (Lời thoại)" },
                  { id: "music_only", label: "🎵 BGM (Thuần nhạc nền)" },
                  { id: "voice_with_music", label: "🎧 Voice + BGM (Nói + Nhạc)" },
                  { id: "asmr", label: "🤫 ASMR Thật (Âm thanh thực tế)" },
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

                  <a
                    href={`${API_BASE}/api/export/koc-csv?keyword=${encodeURIComponent(keyword)}`}
                    download
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
                    title="Xuất file danh sách KOC Booking kèm email, số follower và phân khúc ra file Excel/CSV"
                  >
                    <Download size={13} />
                    <span>📥 Xuất File KOC Booking</span>
                  </a>

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

        {/* TAB: SOUND & VOICE INTELLIGENCE (ÂM THANH & LỜI THOẠI TOÀN DIỆN) */}
        {activeTab === "sounds" && (() => {
          const intel = audioIntelData || data?.audio_intelligence || {};
          const summary = intel.summary || data?.audio_summary || {};
          const voiceCorpusLegacy = intel.voice_corpus || {};
          const frameworks = intel.frameworks || [];
          const allSounds: any[] = intel.top_sounds || summary.top_sounds || [];

          // Filter sounds by category and search
          let filteredSounds = allSounds.filter((s) => {
            if (soundTabFilter === "all") return true;
            if (soundTabFilter === "voiceover") return s.sound_type === "voiceover";
            if (soundTabFilter === "voice_with_music") return s.sound_type === "voice_with_music";
            if (soundTabFilter === "music_only") return s.sound_type === "music_only";
            if (soundTabFilter === "asmr") return s.sound_type === "asmr";
            return true;
          });

          if (soundTabSearch.trim()) {
            const q = soundTabSearch.toLowerCase().trim();
            filteredSounds = filteredSounds.filter((s) =>
              (s.sound_title && s.sound_title.toLowerCase().includes(q)) ||
              (s.sound_author && s.sound_author.toLowerCase().includes(q))
            );
          }

          const copySoundHelper = (text: string) => {
            navigator.clipboard.writeText(text);
            setCopiedSoundText(text);
            setTimeout(() => setCopiedSoundText(null), 2500);
          };

          return (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Hero Banner & Core Sound Metrics */}
              <div className="bg-gradient-to-r from-pink-950/40 via-purple-950/30 to-slate-900 border border-pink-500/20 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <Music size={16} />
                        <span>Trung Tâm Phân Tích Âm Thanh & Lời Thoại Toàn Diện</span>
                        <span className="bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          Voice Corpus & Music Hub
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-white">
                        Chiến Lược Âm Thanh & Lời Thoại Thắng Cuộc (Sound & Voice Intelligence)
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
                        Tổng hợp và bóc tách toàn bộ kho lời thoại từ hơn {summary.total_analyzed || data?.videos?.length || 0} video trong database. Xác định chính xác khách hàng bị thuyết phục bởi những câu nói nào, âm điệu gì và bản nhạc nền viral nào.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleRunBatchTranscribe("voiceover_only")}
                        disabled={batchTranscribing}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        title="Tự động tải và bóc băng lời thoại cho các video có giọng nói"
                      >
                        {batchTranscribing ? (
                          <Loader2 size={13} className="animate-spin text-pink-400" />
                        ) : (
                          <Mic size={13} className="text-pink-400" />
                        )}
                        <span>Bóc Băng Video Voice</span>
                      </button>

                      <button
                        onClick={() => handleRunBatchTranscribe("all")}
                        disabled={batchTranscribing}
                        className="bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/30 transition cursor-pointer disabled:opacity-50"
                        title="Tự động tải stream và bóc băng Whisper AI cho toàn bộ video trong ngách"
                      >
                        {batchTranscribing ? (
                          <>
                            <Loader2 size={13} className="animate-spin" />
                            <span>Đang bóc băng toàn ngách...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={13} className="text-yellow-300" />
                            <span>⚡ Bóc Băng Toàn Bộ Ngách</span>
                          </>
                        )}
                      </button>

                      <span className="text-xs font-mono px-3.5 py-2 bg-slate-950/90 text-pink-300 rounded-xl border border-pink-500/30 font-semibold shadow-inner">
                        {summary.total_analyzed || data?.videos?.length || 0} video đã quét
                      </span>
                    </div>
                  </div>

                  {/* Batch Transcribe Progress Banner */}
                  {batchTranscribeJob && (
                    <div className="bg-gradient-to-r from-pink-950/70 via-purple-950/50 to-slate-900 border border-pink-500/50 rounded-2xl p-4 shadow-xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-pink-200 flex items-center gap-2">
                          <Loader2 size={14} className="animate-spin text-pink-400" />
                          {batchTranscribeJob.message}
                        </span>
                        <span className="font-mono font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-lg">
                          {batchTranscribeJob.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300 shadow-sm shadow-pink-500/50"
                          style={{ width: `${Math.min(100, Math.max(5, batchTranscribeJob.progress))}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 4 Hero Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
                    <div className="bg-slate-900/80 border border-sky-500/30 p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-xs text-sky-400 mb-1">
                        <span className="font-semibold flex items-center gap-1"><Mic size={14} /> Phong Cách Thống Trị</span>
                        <span className="font-bold font-mono">{summary.distribution?.[0]?.percentage || 0}%</span>
                      </div>
                      <div className="text-lg font-bold text-white truncate">{summary.dominant_style ? summary.dominant_style.split('(')[0] : (summary.distribution?.[0]?.label?.split('(')[0] || "🎙️ Voiceover")}</div>
                      <p className="text-[11px] text-slate-400 mt-1">Đạt lượt xem và lưu trữ cao nhất toàn ngách</p>
                    </div>

                    <div className="bg-slate-900/80 border border-purple-500/30 p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-xs text-purple-400 mb-1">
                        <span className="font-semibold flex items-center gap-1"><Bookmark size={14} /> Hiệu Quả Chốt Đơn</span>
                        <span className="font-bold font-mono">+{summary.saves_boost_percentage || voiceCorpusLegacy.saves_boost_percentage || 0}%</span>
                      </div>
                      <div className="text-lg font-bold text-white">Tăng Lượt Lưu (Saves)</div>
                      <p className="text-[11px] text-slate-400 mt-1">Khi video có giọng nói so với chỉ dùng nhạc</p>
                    </div>

                    <div className="bg-slate-900/80 border border-pink-500/30 p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-xs text-pink-400 mb-1">
                        <span className="font-semibold flex items-center gap-1"><Flame size={14} /> Top 1 Sound Viral</span>
                        <span className="font-bold font-mono">{Math.round((summary.top_sound_views || allSounds[0]?.total_views || 0) / 1000)}k views</span>
                      </div>
                      <div className="text-sm font-bold text-white truncate" title={summary.top_sound_title || allSounds[0]?.sound_title || "Chưa có sound nổi bật"}>
                        {summary.top_sound_title || allSounds[0]?.sound_title || "Chưa có sound nổi bật"}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Sound được tái sử dụng nhiều nhất</p>
                    </div>

                    <div className="bg-slate-900/80 border border-emerald-500/30 p-4 rounded-2xl">
                      <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                        <span className="font-semibold flex items-center gap-1"><MessageCircle size={14} /> Tỷ Lệ Có Giọng Nói</span>
                        <span className="font-bold font-mono">
                          {(summary.total_analyzed || data?.videos?.length) ? Math.round(((voiceCorpusLegacy.total_spoken_videos || summary.voice_videos_count || 0) / Math.max(summary.total_analyzed || data?.videos?.length || 1, 1)) * 100) : 0}%
                        </span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {voiceCorpusLegacy.total_spoken_videos || summary.voice_videos_count || 0} / {summary.total_analyzed || data?.videos?.length || 0} Video
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">Sử dụng lời thoại thật hoặc lồng nhạc nền</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 1: VOICE INTELLIGENCE & KHO LỜI THOẠI TOÀN NGÁCH */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                    <Mic size={16} />
                    <span>Kho Dữ Liệu Lời Thoại & Giọng Nói (Voice Corpus Intelligence)</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Họ Đang Nói Gì Nhiều Nhất? (Top Cụm Từ & Chủ Đề Lời Thoại)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Phân tích từ toàn bộ lời thoại và kịch bản video để tìm ra luận điểm bán hàng (Selling Points) đánh trúng tâm lý người mua nhất.
                  </p>
                </div>

                {/* N-GRAM VOICE PHRASES (COMMON PHRASES ACROSS ALL TRANSCRIBED VIDEOS) */}
                {voiceCorpus?.common_phrases && voiceCorpus.common_phrases.length > 0 && (
                  <div className="bg-slate-950 p-5 rounded-2xl border border-pink-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} /> Cụm Từ Lời Thoại Được Nói Nhiều Nhất (N-Gram Voice Analysis)
                        </span>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Trích xuất từ toàn bộ <strong>{voiceCorpus.total_with_speech} video có lời thoại thật</strong>. Tần suất các câu nói/cụm từ mà các creator dùng chung để thuyết phục khách hàng.
                        </p>
                      </div>
                      <span className="text-xs font-mono px-3 py-1 bg-pink-950/80 text-pink-300 border border-pink-500/40 rounded-xl font-bold">
                        {voiceCorpus.total_transcribed} video đã bóc băng
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {voiceCorpus.common_phrases.slice(0, 18).map((p: any, pIdx: number) => (
                        <div
                          key={pIdx}
                          className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between gap-2 hover:border-pink-500/40 transition"
                        >
                          <div className="truncate space-y-0.5">
                            <span className="font-semibold text-white text-xs block truncate italic">
                              &ldquo;{p.phrase}&rdquo;
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {p.video_count} video sử dụng ({p.percentage}%)
                            </span>
                          </div>
                          <button
                            onClick={() => copySoundHelper(p.phrase)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-pink-600 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                            title="Sao chép cụm từ"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* AI Voice Themes if available */}
                    {voiceCorpus.voice_themes && voiceCorpus.voice_themes.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block">
                          🧠 Các Trường Phái Kịch Bản Thoại Chính (AI Semantic Themes)
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {voiceCorpus.voice_themes.map((th: any, thIdx: number) => (
                            <div key={thIdx} className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <h6 className="font-bold text-xs text-white truncate">{th.theme}</h6>
                                <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-800/50">
                                  {th.frequency_pct}%
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{th.description}</p>
                              {th.sample_phrases && (
                                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                                  {th.sample_phrases.slice(0, 2).map((sp: string, spIdx: number) => (
                                    <span key={spIdx} className="text-[10px] text-pink-300 block italic truncate">
                                      • &ldquo;{sp}&rdquo;
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 5 Spoken Topics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(voiceCorpusLegacy.top_spoken_topics || []).map((t: any, idx: number) => {
                    let urgencyColor = "bg-rose-500/20 text-rose-300 border-rose-500/30";
                    if (t.urgency === "Cao") urgencyColor = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                    if (t.urgency === "Trung Bình") urgencyColor = "bg-purple-500/20 text-purple-300 border-purple-500/30";
                    if (t.urgency === "Đặc Thù") urgencyColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";

                    return (
                      <div key={idx} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${urgencyColor}`}>
                              Tác Động: {t.urgency}
                            </span>
                            <span className="text-xs font-mono font-bold text-pink-400">{t.percentage}% video</span>
                          </div>

                          <h4 className="text-sm font-bold text-white leading-snug">{t.topic}</h4>

                          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-pink-500 to-purple-600 h-full rounded-full"
                              style={{ width: `${t.percentage}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-slate-400 italic bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed">
                            💡 {t.why_effective}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-900">
                          <span className="text-[10px] font-semibold text-slate-500 block mb-1">
                            Câu nói điển hình trích từ video ({t.mentions_count} lần đề cập):
                          </span>
                          <div className="space-y-1">
                            {(t.sample_phrases || []).slice(0, 2).map((phrase: string, pIdx: number) => (
                              <p key={pIdx} className="text-xs text-slate-300 font-medium truncate flex items-center gap-1.5" title={phrase}>
                                <span className="text-pink-400 font-bold">•</span> &ldquo;{phrase}&rdquo;
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sub-section: Top 5 Spoken Hooks + Persona Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800">
                  {/* Left (7 cols): Top 5 Spoken Hooks Mở Đầu */}
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
                        <Flame size={14} />
                        <span>Top 5 Spoken Hooks Mở Đầu Triệu Views (0-3s Lời Thoại)</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Bấm để copy kịch bản</span>
                    </div>

                    <div className="space-y-2.5">
                      {(voiceCorpusLegacy.top_spoken_hooks || []).map((h: any, hIdx: number) => (
                        <div
                          key={hIdx}
                          className="bg-slate-950 p-4 rounded-2xl border border-slate-800 hover:border-pink-500/40 transition flex items-start justify-between gap-3 group"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-pink-950 border border-pink-700 text-pink-300 flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                              #{h.rank}
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.2 rounded-full">
                                  {h.angle}
                                </span>
                                <span className="text-[11px] text-slate-400">bởi @{h.creator}</span>
                                <span className="text-[11px] font-mono text-purple-300 font-semibold">
                                  {(h.views || 0).toLocaleString()} views
                                </span>
                                <span className="text-[10px] font-mono text-amber-300">
                                  {(h.saves || 0).toLocaleString()} saves
                                </span>
                              </div>
                              <p className="text-xs md:text-sm font-semibold text-white italic leading-snug">
                                &ldquo;{h.hook_text}&rdquo;
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => copySoundHelper(h.hook_text)}
                            className="shrink-0 p-2 rounded-xl bg-slate-900 hover:bg-pink-600 text-slate-400 hover:text-white transition border border-slate-800 cursor-pointer"
                            title="Copy câu hook này"
                          >
                            {copiedSoundText === h.hook_text ? (
                              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                                <Check size={12} /> Đã copy
                              </span>
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right (5 cols): Persona & Delivery Tone */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider mb-2">
                      <Users size={14} />
                      <span>Phân Bổ Phong Cách Giọng Điệu (Voice Persona)</span>
                    </div>

                    <div className="space-y-3">
                      {(voiceCorpusLegacy.persona_distribution || []).map((p: any, pIdx: number) => {
                        let colorClass = "from-sky-950/40 border-sky-800/60 text-sky-300";
                        if (p.color === "purple") colorClass = "from-purple-950/40 border-purple-800/60 text-purple-300";
                        if (p.color === "amber") colorClass = "from-amber-950/40 border-amber-800/60 text-amber-300";

                        return (
                          <div key={pIdx} className={`bg-gradient-to-br ${colorClass} to-slate-950 p-4 rounded-2xl border space-y-1.5`}>
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-white text-xs md:text-sm">{p.name}</h5>
                              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
                                {p.percentage}%
                              </span>
                            </div>
                            <div className="text-[11px] text-pink-300 font-medium">
                              Âm điệu: {p.tone}
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                              {p.characteristics}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: BẢNG XẾP HẠNG NHẠC & SOUND VIRAL (TRENDING SOUNDS LEADERBOARD) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-pink-400 text-xs font-bold uppercase tracking-wider">
                      <Flame size={16} />
                      <span>Bảng Xếp Hạng Nhạc & Sound Viral Trong Ngách (Trending Sounds Leaderboard)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Danh sách tên bài nhạc và bản audio thực tế trên TikTok, số video đã áp dụng, tổng views và điểm viral score.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search size={13} className="absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Tìm tên sound / creator..."
                        value={soundTabSearch}
                        onChange={(e) => setSoundTabSearch(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-pink-500 w-56"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "all", label: `Tất cả (${allSounds.length})` },
                    { id: "voiceover", label: `🎙️ Voiceover (${allSounds.filter(s => s.sound_type === 'voiceover').length})` },
                    { id: "music_only", label: `🎵 BGM / Nhạc Nền (${allSounds.filter(s => s.sound_type === 'music_only').length})` },
                    { id: "voice_with_music", label: `🎧 Voice + BGM (${allSounds.filter(s => s.sound_type === 'voice_with_music').length})` },
                    { id: "asmr", label: `🤫 ASMR Thật (${allSounds.filter(s => s.sound_type === 'asmr').length})` }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => setSoundTabFilter(btn.id)}
                      className={`px-3 py-1.5 rounded-xl font-medium text-xs transition cursor-pointer ${
                        soundTabFilter === btn.id
                          ? "bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold shadow-md shadow-pink-600/20"
                          : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="py-3 px-3">#</th>
                        <th className="py-3 px-3 min-w-[240px]">Tên Bản Nhạc / Sound Gốc</th>
                        <th className="py-3 px-3">Tác Giả / Creator</th>
                        <th className="py-3 px-3">Loại Âm Thanh</th>
                        <th className="py-3 px-3">Số Video Dùng</th>
                        <th className="py-3 px-3">Tổng Lượt View</th>
                        <th className="py-3 px-3">Điểm Viral</th>
                        <th className="py-3 px-3 text-right">Hành Động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {filteredSounds.map((s, idx) => {
                        let rankBadge = <span className="font-mono text-purple-400">#{idx + 1}</span>;
                        if (idx === 0) rankBadge = <span className="text-amber-300 font-bold">🥇 #1</span>;
                        if (idx === 1) rankBadge = <span className="text-slate-300 font-bold">🥈 #2</span>;
                        if (idx === 2) rankBadge = <span className="text-amber-600 font-bold">🥉 #3</span>;

                        return (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3">{rankBadge}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white truncate max-w-[280px]" title={s.sound_title}>
                                  {s.sound_title}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 font-mono text-slate-400">
                              {s.sound_author ? `@${s.sound_author}` : "TikTok Library"}
                            </td>
                            <td className="py-3 px-3">
                              {renderSoundBadge(s.sound_type)}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-white">
                              {s.usage_count} vids
                            </td>
                            <td className="py-3 px-3 font-mono text-purple-300">
                              {(s.total_views || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-emerald-400 font-mono">
                              {s.avg_score}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => copySoundHelper(s.sound_title)}
                                  className="px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[10px] font-medium transition flex items-center gap-1 cursor-pointer"
                                  title="Copy tên sound để tìm trên TikTok"
                                >
                                  {copiedSoundText === s.sound_title ? (
                                    <span className="text-emerald-400 flex items-center gap-1"><Check size={11} /> Đã copy</span>
                                  ) : (
                                    <>
                                      <Copy size={11} />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <a
                                  href={s.tiktok_url || "https://www.tiktok.com"}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 border border-pink-700/50 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                                >
                                  <span>TikTok</span>
                                  <ExternalLink size={10} />
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filteredSounds.length === 0 && (
                    <div className="py-12 text-center text-slate-500">
                      Không tìm thấy sound nào phù hợp với từ khóa &ldquo;{soundTabSearch}&rdquo;.
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: BỘ 4 CÔNG THỨC ÂM THANH THẮNG CUỘC (4 WINNING AUDIO FRAMEWORKS) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles size={16} />
                    <span>Bộ 4 Công Thức Phối Âm Thắng Cuộc (4 Winning Audio Frameworks)</span>
                  </div>
                  <h3 className="text-xl font-black text-white mt-1">
                    Cấu Trúc Âm Thanh Từng Giây Đã Kiểm Chứng Bằng Dữ Liệu Thực Tế
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Không chỉ là lý thuyết chung chung: Mỗi công thức dưới đây đại diện cho 1 trường phái sản xuất video thành công, có số liệu đối sánh chi tiết để áp dụng ngay.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {(frameworks || []).map((fw: any, fwIdx: number) => {
                    let borderClass = "border-sky-500/40";
                    let badgeClass = "bg-sky-950/80 text-sky-300 border-sky-700";
                    let titleColor = "text-sky-400";
                    if (fw.theme_color === "purple") {
                      borderClass = "border-purple-500/40";
                      badgeClass = "bg-purple-950/80 text-purple-300 border-purple-700";
                      titleColor = "text-purple-400";
                    } else if (fw.theme_color === "emerald") {
                      borderClass = "border-emerald-500/40";
                      badgeClass = "bg-emerald-950/80 text-emerald-300 border-emerald-700";
                      titleColor = "text-emerald-400";
                    } else if (fw.theme_color === "pink") {
                      borderClass = "border-pink-500/40";
                      badgeClass = "bg-pink-950/80 text-pink-300 border-pink-700";
                      titleColor = "text-pink-400";
                    }

                    return (
                      <div key={fwIdx} className={`bg-slate-950 p-6 rounded-3xl border ${borderClass} space-y-4 flex flex-col justify-between shadow-lg`}>
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClass}`}>
                              {fw.badge}
                            </span>
                            <span className="text-xs font-mono text-slate-400">Thời lượng chuẩn: <strong>{fw.best_duration}</strong></span>
                          </div>

                          <h4 className={`text-base font-black ${titleColor}`}>{fw.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{fw.summary}</p>

                          {/* Metrics summary */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 text-center">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">Avg Views</span>
                              <span className="text-xs font-bold text-white font-mono">{(fw.avg_views || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">Avg Saves</span>
                              <span className="text-xs font-bold text-amber-300 font-mono">{(fw.avg_saves || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block">Viral Score</span>
                              <span className="text-xs font-bold text-emerald-400 font-mono">{fw.avg_score}</span>
                            </div>
                          </div>

                          {/* Timeline steps */}
                          <div className="space-y-2 pt-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Cấu trúc phối âm từng giây:
                            </span>
                            {(fw.timeline || []).map((tl: any, tlIdx: number) => (
                              <div key={tlIdx} className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-0.5">
                                <div className="font-bold text-white text-[11px] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                                  <span>{tl.stage}</span>
                                </div>
                                <p className="text-[11px] text-slate-300 pl-3 leading-relaxed">{tl.action}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Production Tips */}
                        <div className="pt-3 border-t border-slate-900 bg-slate-900/40 -mx-6 -mb-6 p-4 rounded-b-3xl border-t border-slate-800/60">
                          <span className="text-[11px] text-amber-300 font-semibold block mb-0.5 flex items-center gap-1">
                            💡 Lời khuyên thu âm & cân chỉnh:
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            {fw.production_tips}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB: CAPTION SEO & VOICE OF CUSTOMER (VoC) INTELLIGENCE */}
        {activeTab === "voc_seo" && (() => {
          const captionAnalytics = data?.caption_analytics;
          const voc = vocDeepData || data?.voc_deep || masterAI?.voc_deep || {};
          const pillars = voc.pillars || {};
          const sourcingRecs = voc.sourcing_recommendations || [];
          const clapbackScripts = voc.clapback_scripts || [];
          const totalCommentsAnalyzed = voc.total_analyzed || data?.comment_stats?.total_crawled_comments || 0;

          // Aggregate comments from insightsMap
          const allInsights = Object.values(insightsMap);
          const allBuyingIntent = allInsights.flatMap((item: any) => item.buying_intent || []);
          const allObjections = allInsights.flatMap((item: any) => item.objections || []);
          const allFaqs = allInsights.flatMap((item: any) => item.top_faqs || []);

          const buyingCount = Math.max(allBuyingIntent.length, pillars?.buying_triggers?.count || 0);
          const objectionCount = Math.max(
            allObjections.length,
            (pillars?.physical_friction?.count || 0) +
              (pillars?.aesthetic_skepticism?.count || 0) +
              (pillars?.competitor_comparison?.count || 0)
          );
          const totalCommentsSafe = Math.max(1, totalCommentsAnalyzed);
          const buyingPct = Math.round((buyingCount / totalCommentsSafe) * 100);
          const objectionPct = Math.round((objectionCount / totalCommentsSafe) * 100);

          const copyClapbackHelper = (text: string, id: string) => {
            navigator.clipboard.writeText(text);
            setCopiedClapbackId(id);
            setTimeout(() => setCopiedClapbackId(null), 2500);
          };

          const copyCaptionHelper = (text: string) => {
            navigator.clipboard.writeText(text);
            setCopiedCaptionText(text);
            setTimeout(() => setCopiedCaptionText(null), 2500);
          };

          const copyTopHashtags = (tags: string[]) => {
            navigator.clipboard.writeText(tags.join(" "));
            setCopiedHashtagSet(true);
            setTimeout(() => setCopiedHashtagSet(false), 2500);
          };

          const top15Tags = (captionAnalytics?.top_hashtags || []).slice(0, 15);
          const top5TagList = top15Tags.slice(0, 5).map((t) => t.tag);

          return (
            <div className="space-y-7 animate-in fade-in duration-300">
              {/* Header & Subtabs */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                      <MessageSquare size={16} />
                      <span>Trung Tâm Phân Tích Kép: Caption SEO & Tiếng Nói Khách Hàng</span>
                      <span className="bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Algorithm SEO &amp; VoC Intelligence
                      </span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-black text-white">
                      Chiến Lược Caption SEO &amp; Ma Trận Bình Luận Khách Hàng
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-4xl leading-relaxed">
                      Dữ liệu tổng hợp từ <strong>{captionAnalytics?.total_videos || data?.videos.length || 0} video</strong> và <strong>{totalCommentsAnalyzed.toLocaleString()} bình luận thật</strong> trong ngách '{keyword}'. Tối ưu hóa thứ hạng tìm kiếm TikTok SEO, phân cụm hashtag và giải mã rào cản tâm lý mua hàng.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      onClick={() => handleBatchCrawlComments(false)}
                      disabled={batchCrawlingComments}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      title="Cào nhanh thêm 1,000 bình luận từ các top video tiếp theo"
                    >
                      {batchCrawlingComments ? (
                        <Loader2 size={13} className="animate-spin text-purple-400" />
                      ) : (
                        <RefreshCw size={13} className="text-sky-400" />
                      )}
                      <span>Cào Thêm 1,000 Cmt</span>
                    </button>

                    <button
                      onClick={() => handleBatchCrawlComments(true)}
                      disabled={batchCrawlingComments}
                      className="bg-gradient-to-r from-sky-600 via-indigo-600 to-pink-600 hover:from-sky-500 hover:to-pink-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/30 transition cursor-pointer disabled:opacity-50"
                      title="Cào quét toàn bộ bình luận trên tất cả các video trong ngách"
                    >
                      {batchCrawlingComments ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>Đang quét toàn ngách...</span>
                        </>
                      ) : (
                        <>
                          <Zap size={13} className="text-yellow-300" />
                          <span>⚡ Cào Vét Toàn Bộ ({data?.comment_stats?.total_tiktok_comments?.toLocaleString() || "0"} Cmt)</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleRunVocAiClustering}
                      disabled={vocAiClustering}
                      className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition cursor-pointer disabled:opacity-50"
                      title="AI quét toàn bộ comment và tự động gom thành các nhóm chủ đề thực tế, không giới hạn 6 trụ cột"
                    >
                      {vocAiClustering ? (
                        <>
                          <Loader2 size={13} className="animate-spin" />
                          <span>AI đang phân cụm...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} className="text-yellow-300" />
                          <span>🤖 AI Phân Cụm Tự Động (Gemini)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* AI VoC Clustering Loading Banner */}
                {vocAiClustering && (
                  <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-pink-950/50 border border-purple-500/50 rounded-2xl p-4 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-200 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-pink-400" />
                        AI đang đọc và gom nhóm ngữ nghĩa toàn bộ bình luận...
                      </span>
                      <span className="font-mono font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-lg">
                        Processing...
                      </span>
                    </div>
                  </div>
                )}

                {/* Active Realtime Comment Crawl Banner */}
                {commentCrawlJob && (
                  <div className="bg-gradient-to-r from-violet-950/70 via-slate-900 to-pink-950/50 border border-violet-500/50 rounded-2xl p-4 shadow-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-violet-200 flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-pink-400" />
                        {commentCrawlJob.message}
                      </span>
                      <span className="font-mono font-black text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-lg">
                        {commentCrawlJob.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 h-1.5 rounded-full transition-all duration-300 shadow-sm shadow-pink-500/50"
                        style={{ width: `${Math.min(100, Math.max(5, commentCrawlJob.progress))}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 italic">
                      * Hệ thống đang ưu tiên quét các video chưa từng cào và bóc tách các luồng thảo luận/hỏi đáp chuyên sâu của khách hàng.
                    </p>
                  </div>
                )}

                {/* Sub-Tabs Selector */}
                <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                  <button
                    onClick={() => setVocSeoSubTab("all")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      vocSeoSubTab === "all"
                        ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <span>🌟 Toàn Bộ Bảng Tin</span>
                  </button>
                  <button
                    onClick={() => setVocSeoSubTab("seo")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      vocSeoSubTab === "seo"
                        ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Tag size={13} />
                    <span>🏷️ Caption &amp; Hashtags SEO</span>
                  </button>
                  <button
                    onClick={() => setVocSeoSubTab("comments")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      vocSeoSubTab === "comments"
                        ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-md shadow-violet-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>💬 6 Trụ Cột Tâm Lý (VoC)</span>
                  </button>
                  <button
                    onClick={() => setVocSeoSubTab("clapback")}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      vocSeoSubTab === "clapback"
                        ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30"
                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                    }`}
                  >
                    <Zap size={13} />
                    <span>🎬 5 Kịch Bản Phản Hồi (Clapback)</span>
                  </button>
                </div>

                {/* 8 Executive KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-1">
                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider flex items-center gap-1">
                      <Hash size={11} /> Avg Tags/Vid
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {captionAnalytics?.avg_tags || 5.6}
                      </span>
                      <span className="text-[10px] text-slate-500 block">thẻ tối ưu</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-1">
                      <FileText size={11} /> Độ Dài Caption
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {captionAnalytics?.avg_chars || 210}
                      </span>
                      <span className="text-[10px] text-slate-500 block">ký tự (~{captionAnalytics?.avg_words || 29} từ)</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      <Target size={11} /> Tỷ Lệ CTA
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {captionAnalytics?.cta_rate || 52.6}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">kêu gọi click link</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                      <HelpCircle size={11} /> Tỷ Lệ Câu Hỏi
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {captionAnalytics?.question_rate || 6.8}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">kích thích cmt</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-pink-400 tracking-wider flex items-center gap-1">
                      <MessageSquare size={11} /> Cmt Thật Đã Cào
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {totalCommentsAnalyzed > 1000 ? `${(totalCommentsAnalyzed / 1000).toFixed(1)}k` : totalCommentsAnalyzed}
                      </span>
                      <span className="text-[10px] text-slate-500 block">bình luận</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1">
                      🛒 Hỏi Mua/Link
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {buyingPct}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">{buyingCount} thảo luận</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider flex items-center gap-1">
                      ⚠️ Rào Cản
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {objectionPct}%
                      </span>
                      <span className="text-[10px] text-slate-500 block">{objectionCount} lo ngại</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between">
                    <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider flex items-center gap-1">
                      ✨ Kịch Bản Phản Hồi
                    </span>
                    <div className="mt-2">
                      <span className="text-xl md:text-2xl font-black text-white">
                        {clapbackScripts.length || 5}
                      </span>
                      <span className="text-[10px] text-slate-500 block">video clapback</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: CAPTION & HASHTAG SEO */}
              {(vocSeoSubTab === "all" || vocSeoSubTab === "seo") && (
                <div className="space-y-6">
                  {/* Top 15 Hashtags Table */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
                          <Tag size={15} />
                          <span>Bảng Xếp Hạng Top 15 Hashtag Chuẩn SEO TikTok</span>
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-white mt-0.5">
                          Top 15 Thẻ Hashtag Chiếm Lĩnh Lượt Xem Ngách '{keyword}'
                        </h4>
                      </div>

                      {top5TagList.length > 0 && (
                        <button
                          onClick={() => copyTopHashtags(top5TagList)}
                          className="bg-sky-950/80 border border-sky-700/60 hover:bg-sky-900 text-sky-300 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shrink-0"
                        >
                          {copiedHashtagSet ? (
                            <>
                              <Check size={13} className="text-emerald-400" />
                              <span className="text-emerald-300">Đã chép Top 5 Hashtag!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Sao Chép Bộ Top 5 Hashtag</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-300 border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/60">
                            <th className="p-3 w-12 text-center">#</th>
                            <th className="p-3">Hashtag</th>
                            <th className="p-3 text-center">Số Video Dùng</th>
                            <th className="p-3 text-center">% Độ Phủ Ngách</th>
                            <th className="p-3 text-right">Tổng Lượt Xem (Views)</th>
                            <th className="p-3 text-right">Lượt Xem TB / Video</th>
                            <th className="p-3 text-center">Nhãn Thuật Toán</th>
                            <th className="p-3 text-center">Hành Động</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/70 font-normal">
                          {top15Tags.map((item, idx) => {
                            const isTop3 = idx < 3;
                            return (
                              <tr
                                key={item.tag || idx}
                                className="hover:bg-slate-800/40 transition group"
                              >
                                <td className="p-3 text-center font-mono font-bold">
                                  {isTop3 ? (
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                                      {idx + 1}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">#{idx + 1}</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-sky-300 text-sm">
                                      {item.tag}
                                    </span>
                                    {isTop3 && <Flame size={13} className="text-amber-400 shrink-0" />}
                                  </div>
                                </td>
                                <td className="p-3 text-center font-mono font-semibold text-slate-200">
                                  {item.count} video
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                      <div
                                        className="bg-sky-500 h-1.5 rounded-full"
                                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                                      />
                                    </div>
                                    <span className="font-mono font-bold text-white text-[11px]">
                                      {item.percentage}%
                                    </span>
                                  </div>
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-slate-100">
                                  {(item.total_views || 0) > 1000000
                                    ? `${((item.total_views || 0) / 1000000).toFixed(1)}M`
                                    : (item.total_views || 0).toLocaleString()}
                                </td>
                                <td className="p-3 text-right font-mono text-slate-300">
                                  {(item.avg_views || 0) > 1000
                                    ? `${Math.round((item.avg_views || 0) / 1000)}k`
                                    : (item.avg_views || 0).toLocaleString()}
                                </td>
                                <td className="p-3 text-center">
                                  {idx < 2 ? (
                                    <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                      🔥 Chủ lực bắt buộc
                                    </span>
                                  ) : idx < 7 ? (
                                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                      📈 Tăng trưởng cao
                                    </span>
                                  ) : (
                                    <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] px-2 py-0.5 rounded-md font-bold">
                                      🎯 Ngách sâu chuẩn tệp
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.tag);
                                        setCopiedCaptionText(item.tag);
                                        setTimeout(() => setCopiedCaptionText(null), 1500);
                                      }}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                      title="Sao chép thẻ này"
                                    >
                                      {copiedCaptionText === item.tag ? (
                                        <Check size={12} className="text-emerald-400" />
                                      ) : (
                                        <Copy size={12} />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedHashtagFilter(item.tag);
                                        setActiveTab("reviews");
                                      }}
                                      className="text-[10px] bg-sky-950/70 border border-sky-800/70 hover:bg-sky-900 text-sky-300 px-2 py-1 rounded-lg transition cursor-pointer"
                                      title="Lọc các video có thẻ này ở Tab Thẻ Video"
                                    >
                                      Lọc Video
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 2-Column: Co-occurring Pairs & Top SEO Keywords */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Column 1: Các Cặp Hashtag Hay Đi Chung (Co-occurring Pairs) */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-pink-400 uppercase tracking-wider">
                            <Zap size={14} />
                            <span>Phân Cụm Thuật Toán (Hashtag Clustering)</span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            Các Cặp Hashtag Hay Đi Chung Với Nhau Nhất
                          </h4>
                        </div>
                        <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold">
                          Top Phối Hợp
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        Thuật toán gợi ý của TikTok dựa vào các cụm hashtag đi đôi để phân loại video vào đúng danh mục mẹ (Category) và ngách con (Micro-niche):
                      </p>

                      <div className="space-y-2.5 pt-1">
                        {(captionAnalytics?.top_pairs || []).slice(0, 8).map((pair, pIdx) => (
                          <div
                            key={pIdx}
                            className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-pink-800/60 transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono text-xs font-bold text-pink-300 bg-pink-950/50 border border-pink-800/60 px-2 py-0.5 rounded-md">
                                  {pair.tag1}
                                </span>
                                <span className="text-slate-500 font-black text-xs">+</span>
                                <span className="font-mono text-xs font-bold text-sky-300 bg-sky-950/50 border border-sky-800/60 px-2 py-0.5 rounded-md">
                                  {pair.tag2}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 block">
                                Xuất hiện trong <strong>{pair.count} video</strong> ({pair.percentage}% tổng số video)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <div className="w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-pink-500 to-sky-500 h-2 rounded-full"
                                  style={{ width: `${Math.min(100, pair.percentage * 2)}%` }}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(`${pair.tag1} ${pair.tag2}`);
                                  setCopiedCaptionText(pair.pair);
                                  setTimeout(() => setCopiedCaptionText(null), 1500);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Sao chép cặp thẻ này"
                              >
                                {copiedCaptionText === pair.pair ? (
                                  <Check size={12} className="text-emerald-400" />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column 2: Từ Khóa Chuẩn SEO Trong Văn Bản Caption */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-xl space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                            <Search size={14} />
                            <span>TikTok Search &amp; NLP SEO</span>
                          </div>
                          <h4 className="text-base font-bold text-white mt-0.5">
                            Cụm Từ Khóa SEO Tự Nhiên Phổ Biến Trong Caption
                          </h4>
                        </div>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          2-Word N-Grams
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        TikTok hiện hoạt động như công cụ tìm kiếm (Search Engine). Hãy chèn các cụm từ ngữ tự nhiên này vào <strong>1-2 câu đầu tiên của Caption</strong> để ăn đề xuất thanh tìm kiếm:
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {(captionAnalytics?.top_phrases || []).slice(0, 12).map((item, phIdx) => (
                          <div
                            key={phIdx}
                            className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 flex items-center justify-between gap-2 hover:border-emerald-800/60 transition"
                          >
                            <div className="overflow-hidden">
                              <span className="font-semibold text-emerald-300 text-xs truncate block capitalize">
                                &ldquo;{item.phrase}&rdquo;
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {item.count} video &bull; {(item.avg_views || 0) > 1000 ? `${Math.round((item.avg_views || 0) / 1000)}k views/vid` : `${item.avg_views || 0} views`}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.phrase);
                                setCopiedCaptionText(item.phrase);
                                setTimeout(() => setCopiedCaptionText(null), 1500);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
                              title="Sao chép từ khóa này"
                            >
                              {copiedCaptionText === item.phrase ? (
                                <Check size={11} className="text-emerald-400" />
                              ) : (
                                <Copy size={11} />
                              )}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 4 Caption Styles & Winning Templates */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                          <FileText size={15} />
                          <span>Chiến Lược Văn Phong Caption</span>
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-white mt-0.5">
                          4 Phong Cách Viết Caption &amp; Mẫu Caption Thắng Lớn
                        </h4>
                      </div>
                    </div>

                    {/* 4 Styles Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Style 1 */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-sky-400 flex items-center gap-1">
                            📖 Storytelling &amp; Setup
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {captionAnalytics?.styles?.storytelling?.percentage || 38.4}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Kể câu chuyện trang trí góc phòng, trước &amp; sau khi decor. Tạo kết nối cảm xúc mạnh và tăng thời gian giữ chân (Watch Time).
                        </p>
                      </div>

                      {/* Style 2 */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                            ⚡ Short &amp; Minimal
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {captionAnalytics?.styles?.short_minimal?.percentage || 47.5}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Chỉ 1 câu ngắn gọn, tinh tế tôn vinh vẻ đẹp sản phẩm. Chiếm gần 50% ngách decor vì thẩm mỹ sạch sẽ, không bán hàng thô thiển.
                        </p>
                      </div>

                      {/* Style 3 */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                            🛒 Deal &amp; Call To Action
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {captionAnalytics?.styles?.deal_promotional?.percentage || 10.1}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Nêu rõ mức sale, mã giảm giá hoặc thông báo "link trong bio". Tỷ lệ chuyển đổi ra đơn trực tiếp cao nhất nhưng cần phân phối khéo léo.
                        </p>
                      </div>

                      {/* Style 4 */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                            🏷️ Hashtag Only
                          </span>
                          <span className="font-mono text-xs font-bold text-white">
                            {captionAnalytics?.styles?.hashtag_only?.percentage || 4.0}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Chỉ gắn hashtag mà không viết chữ. Thích hợp video dạng ASMR thuần âm thanh hoặc video tập trung 100% vào hình ảnh chuyển động.
                        </p>
                      </div>
                    </div>

                    {/* Winning Templates */}
                    {captionAnalytics?.top_templates && captionAnalytics.top_templates.length > 0 && (
                      <div className="pt-3 border-t border-slate-800/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                          <Sparkles size={14} />
                          <span>Mẫu Caption Thắng Lớn Thực Tế (Top Viral Captions)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {captionAnalytics.top_templates.map((tpl, tIdx) => (
                            <div
                              key={tIdx}
                              className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-indigo-800/60 transition"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-900">
                                  <span className="font-semibold text-white">@{tpl.creator}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sky-400 font-mono font-bold">
                                      {(tpl.views || 0) > 1000 ? `${Math.round(tpl.views / 1000)}k views` : `${tpl.views} views`}
                                    </span>
                                    <span className="text-amber-400 font-mono">
                                      {(tpl.saves || 0).toLocaleString()} lưu
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-200 leading-relaxed italic">
                                  &ldquo;{tpl.clean_text}&rdquo;
                                </p>
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {tpl.tags.map((tg, tgIdx) => (
                                    <span key={tgIdx} className="text-[10px] text-sky-400/90 font-mono bg-sky-950/40 px-1.5 py-0.5 rounded">
                                      {tg}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <button
                                onClick={() => copyCaptionHelper(`${tpl.clean_text} ${tpl.tags.join(" ")}`)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                              >
                                {copiedCaptionText === `${tpl.clean_text} ${tpl.tags.join(" ")}` ? (
                                  <>
                                    <Check size={12} className="text-emerald-400" />
                                    <span className="text-emerald-300">Đã chép Caption!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Sao chép mẫu này</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION: VOICE OF CUSTOMER & 6-PILLAR PSYCHOLOGY */}
              {(vocSeoSubTab === "all" || vocSeoSubTab === "comments") && (
                <div className="space-y-6">
                  {/* VoC Header Card */}
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                          <MessageSquare size={16} />
                          <span>Voice of Customer (VoC) Chuyên Sâu</span>
                          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {vocAiClusters?.clusters?.length ? `AI Semantic Clusters (${vocAiClusters.clusters.length} Nhóm)` : "6 Trụ Cột Tâm Lý"}
                          </span>
                        </div>
                        <h4 className="text-lg md:text-xl font-bold text-white mt-0.5">
                          {vocAiClusters?.clusters?.length
                            ? `Ma Trận Phân Cụm Ngữ Nghĩa Tự Động (${vocAiClusters.clusters.length} Nhóm Chủ Đề Thực Tế)`
                            : `Ma Trận 6 Trụ Cột Giải Mã Tâm Lý Khách Hàng (${totalCommentsAnalyzed.toLocaleString()} Bình Luận)`}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleRunVocAiClustering}
                          disabled={vocAiClustering}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles size={12} />
                          <span>{vocAiClustering ? "Đang phân cụm..." : vocAiClusters?.clusters?.length ? "Tái Phân Cụm AI" : "AI Phân Cụm Tự Do"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Summary callout */}
                    {masterAI?.voc_summary && (
                      <div className="bg-gradient-to-r from-violet-950/40 to-slate-950 p-4 rounded-2xl border border-violet-800/40 text-xs md:text-sm text-violet-200 leading-relaxed font-medium">
                        💡 <strong>Chiến lược từ bình luận:</strong> {masterAI.voc_summary}
                      </div>
                    )}

                    {/* DYNAMIC AI CLUSTERS GRID (If AI clusters exist) */}
                    {vocAiClusters && vocAiClusters.clusters && vocAiClusters.clusters.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {vocAiClusters.clusters.map((c: any, cIdx: number) => (
                            <div
                              key={cIdx}
                              className="bg-slate-950/90 border border-purple-800/40 hover:border-purple-600/70 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition shadow-lg"
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                    Chủ Đề #{cIdx + 1}
                                  </span>
                                  <div className="text-right">
                                    <span className="font-mono text-sm font-black text-white">
                                      {c.count} cmt
                                    </span>
                                    <span className="text-[10px] text-purple-400 block font-mono font-bold">
                                      ({c.percentage}%)
                                    </span>
                                  </div>
                                </div>

                                <h5 className="font-bold text-white text-sm">
                                  {c.name}
                                </h5>

                                {c.description && (
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    {c.description}
                                  </p>
                                )}

                                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 h-full rounded-full"
                                    style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                                  />
                                </div>
                              </div>

                              {/* Quotes */}
                              {c.top_quotes && c.top_quotes.length > 0 && (
                                <div className="pt-2 border-t border-slate-900 space-y-2">
                                  <span className="text-[10px] font-semibold text-slate-500 block">
                                    Bình luận tiêu biểu:
                                  </span>
                                  {c.top_quotes.slice(0, 2).map((q: any, qIdx: number) => (
                                    <div key={qIdx} className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                                      <p className="italic">&ldquo;{q.text}&rdquo;</p>
                                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                                        <span>@{q.username || "khách"}</span>
                                        {q.likes > 0 && <span className="text-pink-400 font-mono">❤️ {q.likes}</span>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 6 Pillars Cards (Default baseline) */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {Object.entries(pillars).map(([pillarKey, pData]: [string, any]) => {
                          const topQuotes = pData.top_quotes || [];
                          const angles = pData.angle_recommendations || [];
                          const borderColors: Record<string, string> = {
                            rose: "border-rose-800/50 hover:border-rose-600/70",
                            amber: "border-amber-800/50 hover:border-amber-600/70",
                            sky: "border-sky-800/50 hover:border-sky-600/70",
                            indigo: "border-indigo-800/50 hover:border-indigo-600/70",
                            emerald: "border-emerald-800/50 hover:border-emerald-600/70",
                            purple: "border-purple-800/50 hover:border-purple-600/70",
                          };
                          const badgeColors: Record<string, string> = {
                            rose: "bg-rose-500/20 text-rose-300 border-rose-500/30",
                            amber: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                            sky: "bg-sky-500/20 text-sky-300 border-sky-500/30",
                            indigo: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                            emerald: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                            purple: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                          };
                          const colKey = pData.color || "indigo";
                          const bClass = borderColors[colKey] || borderColors.indigo;
                          const bdgClass = badgeColors[colKey] || badgeColors.indigo;

                          return (
                            <div
                              key={pillarKey}
                              className={`bg-slate-950/80 border ${bClass} rounded-2xl p-5 flex flex-col justify-between space-y-4 transition shadow-lg`}
                            >
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${bdgClass}`}>
                                    {pData.badge || pillarKey}
                                  </span>
                                  <div className="text-right">
                                    <span className="font-mono text-sm font-black text-white">
                                      {pData.count || 0} cmt
                                    </span>
                                    <span className="text-[10px] text-slate-400 block font-mono">
                                      ({pData.percentage || 0}%)
                                    </span>
                                  </div>
                                </div>

                                <h5 className="font-bold text-white text-sm">
                                  {pData.title || pillarKey}
                                </h5>

                                <p className="text-xs text-slate-400 leading-relaxed">
                                  {pData.description}
                                </p>

                                {pData.psychological_driver && (
                                  <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                                    <span className="font-bold text-amber-300 block mb-0.5">🧠 Động lực tâm lý:</span>
                                    {pData.psychological_driver}
                                  </div>
                                )}

                                {topQuotes.length > 0 && (
                                  <div className="pt-2 border-t border-slate-900 space-y-1.5">
                                    <span className="text-[10px] font-semibold text-slate-500 block">
                                      Trích dẫn thực tế từ khách:
                                    </span>
                                    {topQuotes.slice(0, 2).map((q: any, qIdx: number) => (
                                      <p key={qIdx} className="text-xs text-slate-300 italic">
                                        &ldquo;{q.text}&rdquo;
                                        {q.likes > 0 && (
                                          <span className="text-[10px] text-pink-400 ml-1.5 font-mono not-italic">
                                            ❤️ {q.likes}
                                          </span>
                                        )}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {angles.length > 0 && (
                                <div className="pt-2.5 border-t border-slate-900">
                                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                                    🎯 Góc nội dung giải quyết:
                                  </span>
                                  <p className="text-[11px] text-slate-300">
                                    {angles[0]}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Sourcing Directives & Product Improvements */}
                    {sourcingRecs.length > 0 && (
                      <div className="pt-4 border-t border-slate-800/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                          <Target size={14} />
                          <span>Chỉ Đạo Cải Tiến Sản Phẩm &amp; Đóng Gói (Sourcing Directives)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {sourcingRecs.map((rec: any, rIdx: number) => (
                            <div
                              key={rec.id || rIdx}
                              className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2"
                            >
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                                {rec.pillar}
                              </span>
                              <p className="text-xs text-slate-300 font-semibold mt-1">
                                {rec.problem}
                              </p>
                              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
                                <span className="font-bold text-emerald-400 block">🛠️ Giải pháp kỹ thuật:</span>
                                <p>{rec.technical_solution}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 block pt-1">
                                📈 <em>Tác động:</em> {rec.commercial_impact}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Top FAQs from Real Customer Comments */}
                    {allFaqs.length > 0 && (
                      <div className="pt-4 border-t border-slate-800/80 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                          <HelpCircle size={14} />
                          <span>Câu Hỏi Khách Hàng Thắc Mắc Nhiều Nhất ({allFaqs.length} FAQs từ bình luận thật)</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {allFaqs.slice(0, 6).map((faq: any, fIdx: number) => (
                            <div
                              key={fIdx}
                              className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col justify-between"
                            >
                              <p className="text-xs text-slate-200 italic">&ldquo;{faq.text}&rdquo;</p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-900">
                                <span>@{faq.username || "khach_hang"}</span>
                                <span className="text-pink-400 font-mono">❤️ {faq.likes || 0}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* BỘ LỌC ĐỌC COMMENT GỐC THEO TRỤ CỘT (RAW COMMENT EXPLORER) */}
                    <div className="pt-4 border-t border-slate-800/80 space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-violet-400 text-xs font-bold uppercase tracking-wider">
                            <Search size={14} />
                            <span>Kho Khai Thác Bình Luận Gốc (Raw Comment Explorer)</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Đọc trực tiếp các bình luận thực tế theo từng nhóm vấn đề để thấu hiểu ngôn ngữ và tâm lý khách hàng.
                          </p>
                        </div>

                        {/* Filter Pills */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {[
                            { id: "all", label: "Tất cả bình luận" },
                            { id: "decision_confusion", label: "🪴 Chậu cây & Kích cỡ" },
                            { id: "physical_friction", label: "⚠️ Bám bụi & Đổ ngã" },
                            { id: "aesthetic_skepticism", label: "👁️ Lá nhựa bóng" },
                            { id: "competitor_comparison", label: "🏷️ So sánh Pottery/Costco" },
                            { id: "styling_hacks", label: "✂️ Uốn cành & Rêu" },
                            { id: "buying_triggers", label: "❤️ Thúc đẩy mua" },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setVocPillarFilter(tab.id)}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition cursor-pointer ${
                                vocPillarFilter === tab.id
                                  ? "bg-violet-600 text-white font-bold shadow"
                                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Render comments list */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
                        {(() => {
                          let displayComments: any[] = [];
                          if (vocPillarFilter === "all") {
                            Object.values(pillars).forEach((p: any) => {
                              displayComments.push(...(p.top_quotes || []));
                            });
                          } else if (pillars[vocPillarFilter]) {
                            displayComments = pillars[vocPillarFilter].top_quotes || [];
                          }

                          // Deduplicate by text
                          const seen = new Set();
                          displayComments = displayComments.filter((c: any) => {
                            if (seen.has(c.text)) return false;
                            seen.add(c.text);
                            return true;
                          });

                          if (displayComments.length === 0) {
                            return (
                              <div className="col-span-full py-6 text-center text-slate-500 text-xs">
                                Chưa có trích dẫn bình luận mẫu cho mục này. Hãy bấm &quot;Cào Thêm 1,000 Cmt&quot; để bổ sung.
                              </div>
                            );
                          }

                          return displayComments.map((c: any, cIdx: number) => (
                            <div
                              key={cIdx}
                              className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 text-xs space-y-1.5 flex flex-col justify-between"
                            >
                              <p className="text-slate-200 italic font-medium leading-relaxed">
                                &ldquo;{c.text}&rdquo;
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                                <span className="font-mono text-slate-400">@{c.username || "khách hàng"}</span>
                                {c.likes > 0 && <span className="text-pink-400 font-bold">❤️ {c.likes} tym</span>}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION: 5 CLAPBACK VIDEO SCRIPTS */}
              {(vocSeoSubTab === "all" || vocSeoSubTab === "clapback") && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <Zap size={15} />
                        <span>Kịch Bản Chuyển Đổi Cao (Conversion Booster)</span>
                      </div>
                      <h4 className="text-lg md:text-xl font-bold text-white mt-0.5">
                        5 Kịch Bản Video "Clapback" Đập Tan Hoài Nghi Khách Hàng
                      </h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                        Công thức dán nhãn bình luận (Sticker Comment) lên đầu video và làm bài test kiểm chứng thực tế để đập tan lý do từ chối mua hàng.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {clapbackScripts.map((cb: any, cbIdx: number) => {
                      const isCopied = copiedClapbackId === cb.id;
                      const fullScript = `[KỊCH BẢN CLAPBACK: ${cb.concept_title}]\n\n📌 COMMENT DÁN TRÊN MÀN HÌNH: "${cb.sticker_comment}" (${cb.comment_likes} tym)\n\n⏱️ HOOK (0-3s):\n${cb.hook_0_3s}\n\n🔍 BẰNG CHỨNG THỰC TẾ (4-12s):\n${cb.proof_4_12s}\n\n🛒 KÊU GỌI HÀNH ĐỘNG CTA (13-18s):\n${cb.cta_13_18s}`;

                      return (
                        <div
                          key={cb.id || cbIdx}
                          className="bg-slate-950/90 border border-slate-800 hover:border-emerald-700/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition shadow-lg"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                                {cb.target_objection}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                ⏱️ {cb.duration || "20s"}
                              </span>
                            </div>

                            <h5 className="font-bold text-white text-sm">
                              {cb.concept_title}
                            </h5>

                            {/* Sticker Comment */}
                            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                              <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                                📌 Dán Sticker Comment lên màn hình:
                              </span>
                              <p className="text-xs text-slate-200 italic">
                                &ldquo;{cb.sticker_comment}&rdquo;
                              </p>
                              {cb.comment_likes > 0 && (
                                <span className="text-[10px] text-slate-500 block font-mono">
                                  ❤️ {cb.comment_likes} lượt thích
                                </span>
                              )}
                            </div>

                            {/* Hook */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider block">
                                🎙️ Hook (0-3s):
                              </span>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {cb.hook_0_3s}
                              </p>
                            </div>

                            {/* Proof */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
                                🔍 Thao tác chứng minh (4-12s):
                              </span>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {cb.proof_4_12s}
                              </p>
                            </div>

                            {/* CTA */}
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                                🛒 Kêu gọi mua hàng CTA (13-18s):
                              </span>
                              <p className="text-xs text-slate-300 leading-relaxed">
                                {cb.cta_13_18s}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => copyClapbackHelper(fullScript, cb.id)}
                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            {isCopied ? (
                              <>
                                <Check size={12} className="text-emerald-400" />
                                <span className="text-emerald-300">Đã sao chép kịch bản!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Sao chép kịch bản này</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}


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
                          <>
                            <button
                              onClick={() => handleSwitchFolder(f.name)}
                              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                            >
                              Chuyển Sang
                            </button>
                            <button
                              onClick={() => handleMergeFolder(f.name, keyword)}
                              disabled={mergingFolder}
                              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                              title={`Gộp toàn bộ video của "${f.name}" vào thư mục đang xem "${keyword}"`}
                            >
                              Gộp vào {keyword}
                            </button>
                          </>
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
