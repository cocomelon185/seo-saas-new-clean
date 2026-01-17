from pathlib import Path

p = Path("src/layouts/Admin.jsx")
s = p.read_text(errors="ignore")

if 'import Audit from "../views/Audit.jsx";' not in s:
    s = s.replace('import React from "react";', 'import React from "react";\nimport Audit from "../views/Audit.jsx";')

needle = '<Redirect from="/admin" to="/admin/dashboard" />'
if needle in s and 'path="/admin/audit"' not in s:
    s = s.replace(needle, '        <Route path="/admin/audit" exact component={Audit} />\n        ' + needle)

p.write_text(s)
print("✅ Added /admin/audit route into src/layouts/Admin.jsx")
