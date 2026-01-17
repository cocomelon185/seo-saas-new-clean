from pathlib import Path
import re

p = Path("src/components/Sidebar/Sidebar.jsx")
s = p.read_text(errors="ignore")

# Keep file structure, but replace nav <ul> content with a clean RankyPulse menu.
# This is robust enough for Notus Sidebar.jsx variants.
ul_pat = re.compile(r'(<ul[^>]*className="md:flex-col[^"]*"[^>]*>)([\s\S]*?)(</ul>)', re.M)

m = ul_pat.search(s)
if not m:
    raise SystemExit("❌ Could not find the main sidebar <ul ... md:flex-col ...> block")

new_ul = m.group(1) + r"""
  <li className="items-center">
    <Link
      className={
        "text-xs uppercase py-3 font-bold block " +
        (window.location.href.indexOf("/admin/dashboard") !== -1
          ? "text-sky-500 hover:text-sky-600"
          : "text-slate-700 hover:text-slate-500")
      }
      to={"/admin/dashboard"}
    >
      <i
        className={
          "fas fa-chart-pie mr-2 text-sm " +
          (window.location.href.indexOf("/admin/dashboard") !== -1
            ? "opacity-75"
            : "text-slate-300")
        }
      ></i>{" "}
      Dashboard
    </Link>
  </li>

  <li className="items-center">
    <Link
      className={
        "text-xs uppercase py-3 font-bold block " +
        (window.location.href.indexOf("/admin/audit") !== -1
          ? "text-sky-500 hover:text-sky-600"
          : "text-slate-700 hover:text-slate-500")
      }
      to={"/admin/audit"}
    >
      <i
        className={
          "fas fa-search mr-2 text-sm " +
          (window.location.href.indexOf("/admin/audit") !== -1
            ? "opacity-75"
            : "text-slate-300")
        }
      ></i>{" "}
      Audit
    </Link>
  </li>

  <li className="items-center">
    <Link
      className={
        "text-xs uppercase py-3 font-bold block " +
        (window.location.href.indexOf("/admin/settings") !== -1
          ? "text-sky-500 hover:text-sky-600"
          : "text-slate-700 hover:text-slate-500")
      }
      to={"/admin/settings"}
    >
      <i
        className={
          "fas fa-cog mr-2 text-sm " +
          (window.location.href.indexOf("/admin/settings") !== -1
            ? "opacity-75"
            : "text-slate-300")
        }
      ></i>{" "}
      Settings
    </Link>
  </li>
""" + m.group(3)

s2 = s[:m.start()] + new_ul + s[m.end():]
p.write_text(s2)
print("✅ Sidebar cleaned: Dashboard / Audit / Settings only")
