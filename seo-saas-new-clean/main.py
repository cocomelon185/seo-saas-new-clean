from fastapi import FastAPI, Depends
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlmodel import Session

from db import create_db_and_tables, get_session, OptimizationLog

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables on startup
@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Request/Response Models
class OptimizeRequest(BaseModel):
    content: str
    focus_keyword: Optional[str] = None
    tone: Optional[str] = None

class OptimizeResponse(BaseModel):
    seo_score: int
    issues: List[str]
    optimized_title: str
    optimized_meta_description: str
    optimized_headings: List[str]
    optimized_body: str

def dummy_analyze_and_optimize(req: OptimizeRequest) -> OptimizeResponse:
    text = req.content
    keyword = req.focus_keyword.strip().lower() if req.focus_keyword else ""

    issues: List[str] = []

    # Check word count
    word_count = len(text.split())
    if word_count < 400:
        issues.append(f"Content is short ({word_count} words). Aim for at least 400–800 words for many topics.")

    # Check keyword usage
    if keyword:
        keyword_lower = text.lower()
        if keyword not in keyword_lower:
            issues.append(f"Focus keyword '{keyword}' not found in content. Include it in the first 100 words.")
        else:
            keyword_count = keyword_lower.count(keyword)
            if keyword_count < 3:
                issues.append(f"Focus keyword appears only {keyword_count} time(s). Aim for 3-5 mentions naturally distributed.")

    # Check for meta description length
    first_sentence = text.split('.')[0] if '.' in text else text[:160]
    if len(first_sentence) > 160:
        issues.append("Meta description candidate is too long. Keep it under 160 characters.")

    # Calculate SEO score
    seo_score = 100
    seo_score -= len(issues) * 10
    seo_score = max(0, seo_score)

    # Generate optimized title
    if keyword:
        optimized_title = f"{keyword} – Simple SEO Analysis"
    else:
        optimized_title = "Content Optimization – Simple SEO Analysis"

    # Generate meta description
    optimized_meta_description = f"Learn how to improve your content for '{keyword}' with basic on-page SEO suggestions." if keyword else "Optimize your content with basic on-page SEO suggestions."

    # Generate headings
    optimized_headings = [
        f"Introduction to {keyword}" if keyword else "Introduction",
        f"How to optimize content for {keyword}" if keyword else "How to optimize your content",
        "Key takeaways"
    ]

    # Return optimized body (unchanged for now, but you could enhance this)
    optimized_body = text

    return OptimizeResponse(
        seo_score=seo_score,
        issues=issues,
        optimized_title=optimized_title,
        optimized_meta_description=optimized_meta_description,
        optimized_headings=optimized_headings,
        optimized_body=optimized_body,
    )

@app.post("/api/optimize-content")
def optimize_content(
    request: OptimizeRequest,
    session: Session = Depends(get_session)
):
    # Call the analysis function with the request object
    result = dummy_analyze_and_optimize(request)  # Pass request object directly [web:302]
    
    # Log the optimization usage to the database
    log = OptimizationLog(
        user_id=1,  # Placeholder for now; will be user's ID after auth is added
        seo_score=result.seo_score,
        content_length=len(request.content),
    )
    session.add(log)
    session.commit()

    return result

# Health check endpoint
@app.get("/")
def read_root():
    return {"message": "SEO Optimizer API is running"}
