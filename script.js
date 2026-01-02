document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, wiring Analyze button");

  const analyzeButton = document.getElementById("analyze-button");
  const analysisResult = document.getElementById("analysis-result");

  if (!analyzeButton || !analysisResult) {
    console.error("Analyze button or analysis result container not found");
    return;
  }

  analyzeButton.addEventListener("click", async () => {
    console.log("Analyze clicked");

    const urlInput = document.getElementById("url-input");
    const contentInput = document.getElementById("content-input");

    const url = urlInput ? urlInput.value.trim() : "";
    const content = contentInput ? contentInput.value.trim() : "";

    if (!url) {
      alert("Please enter a URL to analyze.");
      return;
    }

    analysisResult.innerHTML = "Loading...";

    try {
      const response = await fetch("/api/page-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, content }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("API error response:", text);
        throw new Error(`Failed to fetch analysis (status ${response.status})`);
      }

      const data = await response.json();
      console.log("API data:", data);

      const {
        score,
        quick_wins = [],
        content_brief = "",
        keyword_ideas = [],
      } = data || {};

      analysisResult.style.display = 'block';
      analysisResult.innerHTML = `
        <h3>Analysis Results</h3>
        <p><strong>Score:</strong> ${score ?? "N/A"}</p>

        <h4>Quick Wins</h4>
        ${
          quick_wins.length
            ? `<ul>${quick_wins.map((win) => `<li>${win}</li>`).join("")}</ul>`
            : "<p>No quick wins returned.</p>"
        }

        <h4>Content Brief</h4>
        <p>${content_brief || "No brief returned."}</p>

        <h4>Keyword Ideas</h4>
        ${
          keyword_ideas.length
            ? `<ul>${keyword_ideas
                .map((idea) => `<li>${idea}</li>`)
                .join("")}</ul>`
            : "<p>No keyword ideas returned.</p>"
        }
      `;
    } catch (error) {
      console.error("Frontend error:", error);
      analysisResult.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
  });
});
