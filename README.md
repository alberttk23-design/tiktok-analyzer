# 🚀 TikTok Creative AI & Intelligence Pipeline

An end-to-end AI-powered TikTok intelligence suite designed for DTC brands, growth marketers, and content creators.

## 🌟 Key Features

1. **Smart Stream Crawler (Network Interception)**:
   - Built with Playwright using persistent real-browser sessions.
   - Intercepts TikTok's internal search API (`/api/search/item/full/`) directly from the network layer.
   - Eliminates DOM scrolling freezes and virtual DOM recycling bugs.
   - 10x faster metadata collection (views, likes, saves, comments, shares, upload date) with zero subprocess bottlenecks.
   - Intelligent deduplication: Automatically skips existing videos in history and scrolls continuously until the target count of brand-new videos is collected.

2. **Voice of Customer (Comments Intelligence)**:
   - High-speed direct API crawling for up to 1,000 comments per video.
   - Filters out creator self-replies (`is_author == False`).
   - NLP categorization:
     - **Buying Intent**: Pinpoints questions regarding product links, pricing, and accessories.
     - **Customer Objections**: Detects doubts about realism, material quality, and pricing.
     - **Social Proof**: Highlights community praise with high engagement.

3. **Multi-Tier AI Analysis**:
   - **Local Inference (Zero Cost)**: Integrated with Ollama (`qwen3-vl:4b`) for fast offline 4-pillar creative breakdowns.
   - **Gemini Antigravity Master Analysis**: Exports raw data directly into `exports/` for macro synthesis by high-intelligence models.
   - **Strategic CSV Export**: Excel-ready UTF-8 BOM CSV including the dedicated `ai_phan_tich_tong_the` column.

4. **Modern Interactive Dashboard**:
   - Built with React, Vite, Tailwind CSS, and Lucide icons.
   - Real-time job status polling, 4-pillar review cards, expandable Customer Voice accordions, and one-click deep comment crawlers.

---

## 🛠️ Quickstart

### 1. Requirements
- Python 3.10+
- Node.js 18+
- (Optional) [Ollama](https://ollama.com/) with `qwen3-vl:4b` for offline local synthesis.

### 2. Setup & Run
```bash
# Clone the repository
git clone https://github.com/<your-username>/tiktok-analyzer.git
cd tiktok-analyzer

# Setup Python Virtual Environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Setup Frontend
cd frontend
npm install
cd ..

# Launch Application (Backend + Frontend)
chmod +x start_app.sh
./start_app.sh
```

- **Dashboard**: [http://localhost:5173](http://localhost:5173)
- **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
