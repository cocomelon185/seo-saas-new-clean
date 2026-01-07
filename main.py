
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests, json, re, uvicorn
from bs4 import BeautifulSoup
from collections import Counter
from datetime import datetime
from pathlib import Path
from slowapi import Limiter
from slowapi.util import get_remote_address
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import inch
from io import BytesIO
from fastapi.responses import StreamingResponse

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
@app.get("/health")
def health():
    return {"status": "ok"}

app.state.limiter = limiter
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
@limiter.limit("10/minute")
async def analyze(request: Request, url: str):
    r = requests.get(url, headers={"User-Agent": "Bot"}, timeout=10)
    soup = BeautifulSoup(r.text, "html.parser")
    s, i = calculate_score(soup, soup.get_text())
    log_analytics("analyzed", {"url": url, "score": s})
    return {"score": s, "issues": i, "keywords": extract_keywords(soup.get_text())}

@app.post("/api/export/pdf")
@limiter.limit("5/minute")
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

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)
