from pathlib import Path
import re

root = Path(__file__).parent
live = Path('C:/Git/CYOADEV')
js = (live / 'cyoaftw-engine-CORE.js').read_text(encoding='utf-8')
html = (live / 'cyoaftw-engine-CORE.html').read_text(encoding='utf-8')
start = js.index('// ── SAVE MANAGEMENT MENU')
end = js.index('// ── END SAVE MANAGEMENT MENU', start)
end = js.index('\n', end) + 1
js = js[:start] + (root / 'save-menu.js').read_text(encoding='utf-8') + js[end:]
js = js.replace('2026-10-17-006', '2026-10-17-007', 2)
js = js.replace('// Latest: Named manual saves, disk export/import and a save manager available in-game and at setup.', '// Latest: Standalone save confirmation popup over the save manager.', 1)
start = html.index('/* Save manager:')
end = html.index('/* Preferences modal', start)
html = html[:start] + (root / 'save-menu.css').read_text(encoding='utf-8') + '\n\n' + html[end:]
start = html.index('<!-- ── SAVE MANAGEMENT ── -->')
end = html.index('<!-- ── PREFERENCES ── -->', start)
html = html[:start] + (root / 'save-menu.html').read_text(encoding='utf-8') + '\n' + html[end:]
html = html.replace('2026-10-17-007', '2026-10-17-008', 2)
html = html.replace('Latest: Save manager with named manual saves and disk export/import.', 'Latest: Standalone save confirmation popup over the save manager.', 1)
for name, content in [('cyoaftw-engine-CORE.js', js), ('cyoaftw-engine-CORE.html', html)]:
    (root / name).write_text(content, encoding='utf-8', newline='\r\n')
scripts = lambda value: re.findall(r'<script src="[^"]+"></script>', value)
assert scripts(html) == scripts((live / 'cyoaftw-engine-CORE.html').read_text(encoding='utf-8'))
