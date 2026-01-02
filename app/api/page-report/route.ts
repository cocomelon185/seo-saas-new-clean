import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const response = {
    score: 72,
    quick_wins: [
      "Add your primary keyword to the H1.",
      "Include the target keyword in the first 100 words.",
      "Add 2–3 internal links to related pages.",
      "Improve meta title to include a benefit-driven phrase."
    ],
    content_brief: "Create a clear, benefit-focused page targeting SaaS founders. Use one primary keyword in the H1, answer 2–3 main user questions, and end with a strong CTA.",
    keyword_ideas: [
      "saas seo checklist",
      "seo for saas landing pages",
      "on-page seo for startups",
      "content brief for saas pages"
    ]
  };

  return NextResponse.json(response, { status: 200 });
}
