import logging
import sqlite3
import re
import urllib.request
import json
import urllib.error
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict

from backend.db import get_db

logger = logging.getLogger('tiktok.voice_corpus')

STOPWORDS = {
    "the", "and", "a", "an", "in", "on", "at", "to", "for", "of", "with", "is", "are", "was",
    "it", "this", "that", "you", "i", "my", "your", "so", "but", "not", "have", "from", "be",
    "me", "we", "they", "them", "what", "how", "all", "just", "can", "get", "do", "if", "or",
    "like", "one", "its", "has", "had", "up", "out", "about", "been", "would", "will",
    "và", "là", "của", "cho", "trong", "với", "có", "này", "đó", "thì", "mà", "nhưng",
    "rồi", "lại", "được", "các", "những", "cái", "con", "người", "tôi", "mình", "bạn"
}

def extract_voice_phrases(transcripts: List[Dict[str, Any]], top_n: int = 30) -> List[Dict[str, Any]]:
    """
    Extract n-gram phrases from voice transcripts.
    Tracks which video_ids each phrase appears in and sorts by unique video count.
    """
    phrase_videos = defaultdict(set)
    
    for item in transcripts:
        transcript = item.get('transcript', '')
        video_id = item.get('video_id')
        if not transcript or not video_id:
            continue
            
        # Tokenize (Unicode-aware regex)
        words = [w.lower() for w in re.findall(r'\b\w+\b', transcript, re.UNICODE)]
        
        # Extract 2-grams, 3-grams, 4-grams
        n_gram_sizes = [2, 3, 4]
        for n in n_gram_sizes:
            for i in range(len(words) - n + 1):
                ngram_words = words[i:i+n]
                
                # Filter out ngrams that start or end with a stopword
                # This ensures we get meaningful phrases rather than fragments like "in the"
                if ngram_words[0] in STOPWORDS or ngram_words[-1] in STOPWORDS:
                    continue
                    
                phrase = " ".join(ngram_words)
                phrase_videos[phrase].add(video_id)
                
    total_videos = len(transcripts)
    
    # Sort by number of unique videos
    sorted_phrases = sorted(phrase_videos.items(), key=lambda x: len(x[1]), reverse=True)
    
    results = []
    for phrase, v_ids in sorted_phrases[:top_n]:
        v_count = len(v_ids)
        percentage = round((v_count / total_videos) * 100, 1) if total_videos > 0 else 0.0
        results.append({
            "phrase": phrase,
            "video_count": v_count,
            "percentage": percentage
        })
        
    return results

def analyze_voice_corpus(keyword: str, engine: str = 'gemini', api_key: Optional[str] = None) -> Dict[str, Any]:
    """
    Query ALL transcripts for the keyword, extract common phrases using n-gram analysis,
    and send aggregated data to LLM for semantic clustering.
    """
    logger.info(f"Starting voice corpus analysis for keyword: {keyword}")
    
    conn = get_db()
    # Connection returned by get_db is expected to have row_factory = sqlite3.Row
    
    # 1. Count total_transcribed for this keyword
    try:
        cur = conn.cursor()
        cur.execute('''
            SELECT COUNT(*) as cnt
            FROM videos v
            JOIN analysis_reviews ar ON v.video_id = ar.video_id
            WHERE v.keyword = ? AND ar.transcript IS NOT NULL AND ar.transcript != ''
        ''', (keyword,))
        total_transcribed_row = cur.fetchone()
        total_transcribed = total_transcribed_row['cnt'] if total_transcribed_row else 0
    except Exception as e:
        logger.error(f"Error querying total transcribed: {e}")
        total_transcribed = 0
        
    # 2. Query the transcripts with actual speech
    query = '''
        SELECT v.video_id, v.creator, v.views, v.saves, v.sound_type, v.caption,
               ar.transcript, ar.spoken_hook
        FROM videos v
        JOIN analysis_reviews ar ON v.video_id = ar.video_id
        WHERE v.keyword = ? AND ar.transcript IS NOT NULL AND ar.transcript != ''
          AND ar.transcript NOT LIKE '%Không có lời thoại%'
          AND ar.transcript NOT LIKE '%Background Music Only%'
        ORDER BY v.views DESC
    '''
    
    try:
        cur = conn.cursor()
        cur.execute(query, (keyword,))
        rows = cur.fetchall()
    except Exception as e:
        logger.error(f"Error querying transcripts: {e}")
        rows = []
    finally:
        conn.close()
        
    total_with_speech = len(rows)
    
    transcripts_list = []
    for row in rows:
        transcripts_list.append(dict(row))
        
    # 3. Extract common phrases using n-gram analysis
    # We extract top 50 for the prompt, but will return top 30 in the final response
    common_phrases_top_50 = extract_voice_phrases(transcripts_list, top_n=50)
    
    voice_themes = []
    
    # 4. Send aggregated data to Gemini/Ollama for semantic clustering
    if total_with_speech > 0 and common_phrases_top_50:
        phrases_list = "\n".join([f"- {p['phrase']} ({p['video_count']} videos)" for p in common_phrases_top_50])
        
        sample_transcripts = "\n\n".join([
            f"Video {t['video_id']} (Views: {t['views']}): {t['transcript']}" 
            for t in transcripts_list[:20]
        ])
        
        prompt = f"""You are analyzing voice transcripts from {total_with_speech} TikTok videos about "{keyword}".
Here are the top 50 most common spoken phrases/sentences across all videos:
{phrases_list}

And here is a sample of 20 full transcripts:
{sample_transcripts}

Group the voice content into THEMES based on what creators commonly say.
Each theme should represent a distinct messaging strategy or talking point.

Return JSON:
{{
  "voice_themes": [
    {{
      "theme": "theme name",
      "description": "what creators say in this theme",
      "frequency_pct": 32.5,
      "sample_phrases": ["exact phrase 1", "exact phrase 2"]
    }}
  ]
}}"""

        if engine == 'gemini':
            if not api_key:
                logger.warning("No API key provided for Gemini")
            else:
                model_name = "gemini-1.5-flash"  # Defaulting to 1.5 flash
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.3, "maxOutputTokens": 4096, "responseMimeType": "application/json"}
                }
                
                try:
                    req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"}, method="POST")
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        result = json.loads(resp.read())
                        text = result["candidates"][0]["content"]["parts"][0]["text"]
                        parsed = json.loads(text)
                        voice_themes = parsed.get("voice_themes", [])
                except Exception as e:
                    logger.error(f"Error calling Gemini API: {e}")
        elif engine == 'ollama':
            logger.warning("Ollama engine not yet fully implemented for voice corpus, returning empty themes")
    
    # 5. Return result dict
    return {
        "keyword": keyword,
        "total_transcribed": total_transcribed,
        "total_with_speech": total_with_speech,
        "common_phrases": common_phrases_top_50[:30],
        "voice_themes": voice_themes,
        "generated_at": datetime.now().isoformat()
    }
