from pathlib import Path

p = Path("src/components/Sidebar/Sidebar.jsx")
s = p.read_text(errors="ignore")

# 1) Add Audit link after Dashboard block (simple insertion)
if "/admin/audit" not in s:
    target = '</Link>\n              </li>'
    insert = target + '\n              <li className="items-center">\n                <Link\n                  className={"text-xs uppercase py-3 font-bold block " + (window.location.href.indexOf("/admin/audit") !== -1 ? "text-sky-500 hover:text-sky-600" : "text-slate-700 hover:text-slate-500")}\n                  to={"/admin/audit"}\n                >\n                  <i className={"fas fa-search mr-2 text-sm " + (window.location.href.indexOf("/admin/audit") !== -1 ? "opacity-75" : "text-slate-300")}></i>{" "}\n                  Audit\n                </Link>\n              </li>'
    s = s.replace(target, insert, 1)

# 2) Hide template docs section (if present) by commenting it out
s = s.replace(
    '/* Divider */\n          <hr className="my-4 md:min-w-full" />\n\n          {/* Heading */}\n          <h6',
    '{/* Divider */}\n          <hr className="my-4 md:min-w-full" />\n\n          {/* Hidden template docs section */}\n          {/* <h6'
)
s = s.replace(
    '</ul>\n\n          {/* Divider */}',
    '</ul> */}\n\n          {/* Divider */}'
)

p.write_text(s)
print("✅ Sidebar patched: added /admin/audit + attempted to hide template docs section.")
