
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests, json, re, uvicorn, os
from bs4 import BeautifulSoup
from collections import Counter
from datetime import datetime
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from io import BytesIO
from fastapi.responses import StreamingResponse


app = FastAPI()
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/test")
def test():
    return {"status": "ok", "message": "API is working"}


ANALYTICS_FILE = Path("analytics.jsonl")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

class AuditRequest(BaseModel):
    url: str

def log_analytics(et, d):
    with open(ANALYTICS_FILE, "a") as f:
        f.write(json.dumps({"ts": datetime.now().isoformat(), "et": et, "d": d}) + "\n")

def calculate_score(soup, tc):
    s, i = 100, []
    t = soup.title.string if soup.title else ""
    if not t: s -= 20; i.append({"sev": "High", "msg": "Missing title"})
    elif len(t) < 30: s -= 5; i.append({"sev": "Med", "msg": "Title short"})
    if not soup.find("meta", {"name": "description"}): s -= 20; i.append({"sev": "High", "msg": "No meta desc"})
    if not soup.find("h1"): s -= 20; i.append({"sev": "High", "msg": "No H1"})
    wc = len(tc.split())
    if wc < 300: s -= 20; i.append({"sev": "High", "msg": f"Thin ({wc} words)"})
    return max(0, s), i

def extract_keywords(text):
    words = re.findall(r"\w+", text.lower())
    return [w for w, c in Counter(words).most_common(10) if len(w) > 4]

@app.get("/api/analysis")
async def analyze(request: Request, url: str):
    import logging
    logger = logging.getLogger("seo-analyzer")
    
    logger.info(f"[ANALYZE] Received URL: {url}")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        }
        logger.info(f"[ANALYZE] Fetching with headers: {headers}")
        
        r = requests.get(url, headers=headers, timeout=10)
        logger.info(f"[ANALYZE] Status code: {r.status_code}, URL: {r.url}")
        
        r.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"[ANALYZE] RequestException: {str(e)}")
        return {"error": f"Failed to fetch URL: {str(e)}", "score": 0, "issues": [], "keywords": []}
    
    soup = BeautifulSoup(r.text, "html.parser")
    s, i = calculate_score(soup, soup.get_text())
    log_analytics("analyzed", {"url": url, "score": s})
    return {"score": s, "issues": i, "keywords": extract_keywords(soup.get_text())}


@app.post("/api/content-analysis")
async def content_analysis(request: Request, data: AuditRequest):
    try:
        text = data.url  # Frontend sends content as url field
        keywords = extract_keywords(text)
        return {"keywords": keywords, "wordCount": len(text.split())}
    except Exception as e:
        return {"error": str(e), "keywords": [], "wordCount": 0}

@app.post("/api/keyword-research")
async def keyword_research(request: Request, data: AuditRequest):
    try:
        text = data.url  # Frontend sends content as url field
        keywords = extract_keywords(text)
        return {"keywords": keywords}
    except Exception as e:
        return {"error": str(e), "keywords": []}

@app.post("/api/export/pdf")
async def pdf(request: Request, data: AuditRequest):
    r = requests.get(data.url, headers={"User-Agent": "Bot"}, timeout=10)
    soup = BeautifulSoup(r.text, "html.parser")
    s, i = calculate_score(soup, soup.get_text())
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=letter)
    styles = getSampleStyleSheet()
    story = [Paragraph("SEO Audit", styles["Heading1"]), Spacer(1, 0.2*inch), Paragraph(f"URL: {data.url}", styles["Normal"]), Paragraph(f"Score: {s}/100", styles["Normal"]), Spacer(1, 0.2*inch), Paragraph("Issues:", styles["Heading2"])]
    for issue in i:
        story.append(Paragraph(f"• {issue['sev']}: {issue['msg']}", styles["Normal"]))
    doc.build(story)
    buf.seek(0)
    log_analytics("pdf_exported", {"url": data.url})
    return StreamingResponse(buf, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=audit.pdf"})

@app.get("/api/analytics/stats")
async def stats():
    if not ANALYTICS_FILE.exists():
        return {"total_analyses": 0}
    total = errors = 0
    with open(ANALYTICS_FILE) as f:
        for line in f:
            e = json.loads(line)
            if e.get("et") == "analyzed": total += 1
    return {"total_analyses": total}
@app.get("/api/brief")
async def brief(request: Request, topic: str = "", url: str = ""):
    """Generate a content brief with outline, keywords, and checklist"""
    
    # Determine if we're using topic or URL
    is_url = bool(url)
    input_text = url if is_url else topic
    
    if not input_text:
        raise HTTPException(status_code=400, detail="Provide either 'topic' or 'url' parameter")
    
    try:
        # If URL provided, fetch and extract text
        if is_url:
            r = requests.get(input_text, headers={"User-Agent": "Bot"}, timeout=10)
            soup = BeautifulSoup(r.text, "html.parser")
            text = soup.get_text()
            brief_topic = soup.title.string if soup.title else input_text
        else:
            brief_topic = topic
            text = topic
        
        # Extract keywords
        primary_keywords = [brief_topic] + extract_keywords(text)[:4] if text else [brief_topic]
        
        # Generate secondary keywords
        secondary_keywords = [
            f"{brief_topic} guide",
            f"{brief_topic} tips",
            f"{brief_topic} best practices",
            f"{brief_topic} checklist",
            f"{brief_topic} examples"
        ]
        
        # Generate 5-point outline
        outline = [
            {
                "title": f"Introduction to {brief_topic}",
                "description": f"Define {brief_topic} and explain why it matters. Include overview of what readers will learn."
            },
            {
                "title": f"Why {brief_topic} Matters",
                "description": f"Show business impact and benefits. Include real-world examples or case studies."
            },
            {
                "title": f"Step-by-Step Implementation",
                "description": f"Provide detailed walkthrough with actionable steps, tips, and best practices."
            },
            {
                "title": f"Common Mistakes & FAQs",
                "description": f"Address misconceptions and answer frequently asked questions about {brief_topic}."
            },
            {
                "title": f"Conclusion & Call-to-Action",
                "description": f"Summarize key takeaways and include clear CTA that matches search intent."
            }
        ]
        
        # Generate SEO checklist
        checklist = [
            f"Include '{brief_topic}' in title, H1, and first 100 words",
            f"Add at least 3-5 internal links to related pages",
            f"Use clear H2/H3 headings for each section",
            f"Answer 3-5 common reader questions",
            f"Include specific CTA that matches search intent"
        ]
        
        # Word count recommendation
        word_count = {"min": 1200, "max": 1800}
        
        # Internal linking strategy
        internal_links = {
            "strategy": "Link to your main product/pricing page, 1-2 related guides, and contact page.",
            "examples": [
                "Link to pricing page for feature benefits",
                "Link to related guide or tutorial",
                "Link to case study for social proof"
            ]
        }
        
        # Log the request
        log_analytics("brief_generated", {"topic": brief_topic, "is_url": is_url})
        
        # Return the complete brief
        return {
            "topic": brief_topic,
            "intent": "informational",
            "outline": outline,
            "word_count": word_count,
            "keywords": {
                "primary": primary_keywords,
                "secondary": secondary_keywords
            },
            "checklist": checklist,
            "internal_links": internal_links
        }
    
    except Exception as e:
        log_analytics("brief_error", {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Error generating brief: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
