# 🚀 TikTok Market & DTC Creative Intelligence Suite

An end-to-end, local-first AI intelligence suite designed for DTC e-commerce brands, TikTok Shop sellers, growth marketers, and media buyers. 

Transforms unstructured TikTok video feeds and customer comments into actionable sourcing directives, high-converting ad angles, viral hooks, and data-driven product decisions.

---

## 🌟 Key Capabilities & Architecture

### 1. Multi-Niche Folder Management
- **Complete Niche Isolation**: Organize research into dedicated folders (e.g., *Faux Olive Tree*, *Portable Blender*, *Cozy Decor*).
- **Folder Merging & Migration**: Safely merge duplicate niches without data loss or duplicate entries.
- **Persistent SQLite with WAL Mode**: High-concurrency database supporting background crawls, simultaneous reads, and instant data persistence.

### 2. Stealth Video Crawler (Network Packet Sniffing)
- **Playwright Network Layer Interception**: Intercepts internal TikTok API streams (`/api/search/general/full/`) with zero DOM lag or scraping blocks.
- **Intelligent Search Vectors**: Generates 21+ search variations (*unboxing, review, honest thoughts, styling, budget, aesthetic...*) for deep niche penetration.
- **Deduplication & Anti-Saturation**: Automatically detects existing videos by `video_id` and continues collecting brand-new videos until quotas are reached.

### 3. Voice of Customer (VoC 6-Pillar Framework)
- **Deep Comment Scraper**: Sweeps up to 1,000+ comments per video, including threaded replies (`/api/comment/list/reply/`).
- **Non-Author Filtering**: Strips creator self-replies to focus 100% on genuine consumer feedback.
- **6-Pillar Classification**:
  1. **Pain Points**: Frustrations with traditional alternatives or missing solutions.
  2. **Quality Objections**: Concerns regarding plastic texture, durability, size, and packaging.
  3. **Buying Triggers**: Direct purchase signals (asking for links, dimensions, planters, price).
  4. **Price & Value Friction**: Perceived value vs cost hesitations.
  5. **Aesthetic & Styling**: Desired home decor vibes and pairing ideas.
  6. **Product Improvement Requests**: Suggestions for upcoming product batches.
- **Factory Sourcing Directives**: Auto-generated technical checklist to negotiate directly with suppliers/manufacturers.
- **5 Dynamic Clapback Scripts**: Battle-tested comment-reply video scripts quoting real user objections to drive viral sales.

### 4. Multimodal 360° Video & Audio Intelligence
- **Faster-Whisper (int8 Apple Silicon / CPU)**: Transcribes spoken speech in 1-2s with zero cloud dependency.
- **Spoken Hook Extraction**: Isolates the critical 0-4s spoken opening line.
- **3-Stage Keyframe Extraction**: Extracts frame 1 (Visual Hook), frame 2 (Product Demo), and frame 3 (CTA).
- **Qwen-VL Vision AI (Ollama Local)**: Inspects opening visual frames for setting, on-screen text, visual style, and scroll-stopping triggers.

### 5. Sound & Music Intelligence Hub
- **4-Type Audio Classification**: Categorizes audio into *Voiceover*, *Voice with Music*, *ASMR Styling*, and *Music Only*.
- **Trending Sound Leaderboard**: Ranks top sounds by total views, usage count, and average viral performance.
- **Spoken Voice Corpus**: Curated library of high-performing spoken hooks from viral videos.
- **Winning Audio Formulas**: Step-by-step recipes for pairing spoken hooks with sound effects and background music.

### 6. Creator Intelligence & CRM Booking Hub
- **4-Tier Classification**: Categorizes creators into *Mega* (>1M avg views), *Macro* (300k-1M), *Mid-Tier* (50k-300k), and *Micro/Nano* (<50k).
- **Embedded Booking CRM**: Track outreach status (*Not Contacted*, *DM Sent*, *Quote Received*, *Sample Sent*, *Video Live*), notes, and agreed rates.
- **Viral Multiplier Metrics**: Benchmark creator performance against niche averages.

### 7. Interactive Recharts Dashboard
- **Views vs Saves Matrix (Scatter Plot)**: Quadrant analysis identifying *Goldmine Winners* (Save rate $\ge 1.2\%$), *Mega Outliers*, *Viral Spread*, and *Standard Performers*.
- **Cohort Timeline Trend (Area Chart)**: Tracks total views, saves, and video counts grouped by release month to identify seasonality and evergreen demand.
- **Ad Angles Benchmark (Bar Chart)**: Compares save rates and average views across creative angles (*Problem-Solution*, *Curiosity/FOMO*, *Transformation*, *Cost Comparison*).
- **Audio Distribution Benchmark**: Visualizes view share across audio categories.

### 8. Dual Master AI Engine
- **Engine 1: Ollama Local (M4 Hardware)**: Fully offline Qwen 4B synthesis, $0 API cost, complete privacy.
- **Engine 2: Google Gemini (3.6 Flash / 2.0 Flash / 1.5 Flash)**: High-level DTC creative strategy, macro trends, objection killers, and winning blueprint scripts.
- **Live AI Status Badging**: Full transparency showing whether results are generated live via Gemini or synthesized locally.

### 9. Export & Master Prompt Integration
- **Excel-Ready UTF-8 BOM CSV**: 15+ rich columns exported to `exports/tiktok_analysis_<keyword>.csv`.
- **One-Click Master Prompt**: Formats full niche metrics into an optimized prompt for external LLMs (Claude 3.5 Sonnet, ChatGPT, DeepSeek).

---

## 🛠️ Quickstart Guide

### 1. Prerequisites
- **Python**: 3.10+ (tested on Python 3.12)
- **Node.js**: 18+ (tested on Node 20+)
- **FFmpeg**: Required for keyframe extraction (`brew install ffmpeg`)
- **Ollama** *(Optional for local AI)*: [Download Ollama](https://ollama.com/) and pull `qwen3-vl:4b`:
  ```bash
  ollama pull qwen3-vl:4b
  ```

### 2. Installation & Run
```bash
# Clone the repository
git clone https://github.com/alberttk23-design/tiktok-analyzer.git
cd tiktok-analyzer

# Setup Python Virtual Environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Setup Frontend Dependencies
cd frontend
npm install
cd ..

# Launch Both Backend & Frontend
chmod +x start_app.sh
./start_app.sh
```

- **Web Dashboard**: `http://localhost:5173`
- **Backend API Docs**: `http://localhost:8000/docs`

---

## 🔒 Security & Privacy
- **Local-First Architecture**: Database (`data/tiktok.db`), browser sessions, and keyframes remain strictly on your local machine.
- **Safe .gitignore**: Sensitive databases, WAL journals, media caches, and API credentials are fundamentally excluded from Git tracking.
- **Sanitized Paths**: Strict endpoint validation to prevent directory traversal vulnerabilities.
