from pathlib import Path

p = Path("src/views/Audit.jsx")
s = p.read_text(errors="ignore")

# 1) Make button show + align nicer (small UX polish)
s = s.replace(
  'placeholder="example.com"',
  'placeholder="example.com (or https://example.com)"'
)

# 2) Add quick examples + helper copy under the input (only once)
if "Try:" not in s:
    s = s.replace(
      'Enter a domain, start a job, and we’ll poll until results are ready.',
      'Enter a domain, start a job, and we’ll poll until results are ready.\\n            Try: example.com, https://news.ycombinator.com'
    )

# 3) Show a nicer “running” status block (only once)
if "Checking robots" not in s:
    s = s.replace(
      '(polling…)',
      '(polling… Checking homepage, title, H1, bytes…)'
    )

p.write_text(s)
print("✅ Audit UI copy polish applied")
