import sqlite3
import json
import urllib.request
import urllib.error
import logging
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
from collections import defaultdict

logger = logging.getLogger('tiktok.voc_ai')

def _normalize_name(name: str) -> str:
    """Normalize cluster name for merging"""
    return name.lower().strip()

def _merge_cluster_results(all_batch_results: List[Dict], all_comments: List[Dict]) -> Dict:
    """Internal function to merge cluster results across batches."""
    merged_clusters = defaultdict(lambda: {"description": "", "comment_indices": set()})
    
    for batch_res in all_batch_results:
        for cluster in batch_res.get("clusters", []):
            raw_name = cluster.get("name", "Khác / Không phân loại")
            norm_name = _normalize_name(raw_name)
            
            if not merged_clusters[norm_name]["description"]:
                merged_clusters[norm_name]["description"] = cluster.get("description", "")
            
            for idx in cluster.get("comment_indices", []):
                merged_clusters[norm_name]["comment_indices"].add(idx)
    
    final_clusters = []
    classified_count = 0
    total_comments = len(all_comments)
    
    for norm_name, data in merged_clusters.items():
        indices = list(data["comment_indices"])
        count = len(indices)
        
        # Format the name for display
        display_name = norm_name.title() if norm_name != "khác / không phân loại" else "Khác / Không phân loại"
        
        # Get quotes for this cluster
        quotes = []
        for idx in indices:
            if 0 <= idx < total_comments:
                c = all_comments[idx]
                quotes.append({
                    "text": c.get("text", ""),
                    "username": c.get("username", ""),
                    "likes": c.get("digg_count", 0),
                    "video_id": c.get("video_id", "")
                })
        
        # Sort quotes by likes DESC and take top 8
        quotes.sort(key=lambda x: x["likes"], reverse=True)
        top_quotes = quotes[:8]
        
        if norm_name != "khác / không phân loại":
            classified_count += count
            
        final_clusters.append({
            "name": display_name,
            "description": data["description"],
            "count": count,
            "percentage": round((count / total_comments * 100) if total_comments > 0 else 0, 1),
            "top_quotes": top_quotes
        })
    
    # Sort clusters by count DESC
    final_clusters.sort(key=lambda x: x["count"], reverse=True)
    
    return {
        "clusters": final_clusters,
        "classified_count": classified_count,
        "classification_rate": round((classified_count / total_comments * 100) if total_comments > 0 else 0, 1)
    }

def cluster_comments_with_ai(keyword: str, engine: str = 'gemini', api_key: Optional[str] = None, progress_callback=None) -> Dict:
    db_path = "data/tiktok.db"
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        
        # Query comments
        query = """
        SELECT c.id, c.video_id, c.cid, c.username, c.text, c.digg_count, c.reply_count, c.created_time
        FROM video_comments c
        JOIN videos v ON c.video_id = v.video_id
        WHERE v.keyword = ? AND length(c.text) > 3
        ORDER BY c.digg_count DESC
        """
        cur.execute(query, (keyword,))
        rows = cur.fetchall()
        all_comments = [dict(row) for row in rows]
        
        conn.close()
    except Exception as e:
        logger.error(f"Database error: {e}")
        return {"error": str(e)}

    total_comments = len(all_comments)
    if total_comments == 0:
        return {
            "keyword": keyword,
            "total_analyzed": 0,
            "engine": engine,
            "clusters": [],
            "classified_count": 0,
            "classification_rate": 0.0,
            "generated_at": datetime.now().isoformat()
        }
        
    batch_size = 150
    batches = [all_comments[i:i + batch_size] for i in range(0, total_comments, batch_size)]
    
    all_batch_results = []
    
    for batch_idx, batch in enumerate(batches):
        if progress_callback:
            progress_callback(batch_idx + 1, len(batches))
            
        # Format comments for prompt
        comments_text = ""
        for i, comment in enumerate(batch):
            local_idx = i + 1
            # Clean up the text to avoid prompt injection or formatting issues
            safe_text = comment['text'].replace('"', "'").replace('\\', '')
            comments_text += f"[{local_idx}] \"{safe_text}\" (likes: {comment['digg_count']})\n"
            
        prompt = f"""You are analyzing TikTok comments about the product/niche: "{keyword}".
Below are {len(batch)} real customer comments. Classify each comment into one or more TOPIC CLUSTERS based on what the customer is discussing.

Rules:
- Create as many clusters as naturally emerge from the data. Do NOT limit to a fixed number.
- Cluster names should be SHORT and descriptive (e.g., "Hỏi link mua", "Sợ chất liệu nhựa", "So sánh giá", "Khen đẹp", "Hỏi size/chiều cao", "Tag bạn bè")
- A comment can belong to multiple clusters
- Comments that are just emojis, @mentions, or meaningless should go into "Khác / Không phân loại"

Comments:
{comments_text}

Return strict JSON:
{{
  "clusters": [
    {{
      "name": "cluster name",
      "description": "1 sentence describing what customers in this group are saying",
      "comment_indices": [1, 5, 12]
    }}
  ]
}}"""
        
        batch_result = None
        
        if engine == 'gemini':
            if not api_key:
                logger.error("API key required for Gemini engine")
                continue
                
            models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
            for model_name in models:
                try:
                    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                    payload = {
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 4096, "responseMimeType": "application/json"}
                    }
                    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        result = json.loads(resp.read())
                        text = result["candidates"][0]["content"]["parts"][0]["text"]
                        batch_result = json.loads(text)
                        break
                except Exception as e:
                    logger.warning(f"Error with {model_name}: {e}")
                    continue
                    
        elif engine == 'ollama':
            try:
                url = "http://localhost:11434/api/generate"
                payload = {
                    "model": "qwen3:8b",
                    "prompt": prompt,
                    "stream": False,
                    "format": "json",
                    "options": {"temperature": 0.3}
                }
                response = requests.post(url, json=payload, timeout=300)
                response.raise_for_status()
                result = response.json()
                text = result.get("response", "{}")
                batch_result = json.loads(text)
            except Exception as e:
                logger.error(f"Ollama error: {e}")
                
        if batch_result and "clusters" in batch_result:
            global_offset = batch_idx * batch_size
            for cluster in batch_result["clusters"]:
                global_indices = []
                for idx in cluster.get("comment_indices", []):
                    if isinstance(idx, int) and 1 <= idx <= len(batch):
                        global_indices.append(global_offset + (idx - 1))
                cluster["comment_indices"] = global_indices
            
            all_batch_results.append(batch_result)

    # Merge results
    merged_data = _merge_cluster_results(all_batch_results, all_comments)
    
    return {
        "keyword": keyword,
        "total_analyzed": total_comments,
        "engine": engine,
        "clusters": merged_data["clusters"],
        "classified_count": merged_data["classified_count"],
        "classification_rate": merged_data["classification_rate"],
        "generated_at": datetime.now().isoformat()
    }
