from pathlib import Path
import re

root = Path(__file__).parent
source = Path('C:/Git/CYOADEV/cyoaftw-engine-CORE.html').read_text(encoding='utf-8')
assert 'END SHARED DARK UI FINISH' not in source, 'UI cleanup is already installed'
html = source.replace('2026-10-17-008', '2026-10-17-009', 2)
html = html.replace('Latest: Standalone save confirmation popup over the save manager.', 'Latest: Consistent dark panels and controls, thicker status bars and themed scrollbars.', 1)
html = html.replace('</style>', '\n' + (root / 'ui-cleanup.css').read_text(encoding='utf-8') + '\n</style>', 1)
start = html.index('<div id="leftPanel">')
end = html.index('<div id="locationLabelEl">', start)
sidebar = html[start:end]
sidebar, count = re.subn(r'<button\b([^>]+)>', lambda m: '<button class="sidebar-action"' + re.sub(r' style="[^"]*"', '', m[1]) + '>', sidebar)
assert count == 5, f'Expected 5 sidebar controls, found {count}'
html = html[:start] + sidebar + html[end:]
html = html.replace('<div id="equipmentManager">', '<div id="equipmentManager" role="dialog" aria-labelledby="equipmentTitleEl">', 1)
html = html.replace('<h3>Equipment</h3>', '<h3 id="equipmentTitleEl">Equipment</h3>', 1)
html = html.replace('onclick="toggleEquipment()" aria-label="Close"', 'onclick="toggleEquipment()" aria-label="Close equipment"', 1)
html = html.replace('<div id="mapManager">', '<div id="mapManager" role="dialog" aria-labelledby="mapTitleEl">', 1)
html = html.replace('<h3>Map</h3>', '<h3 id="mapTitleEl">Map</h3>', 1)
html = html.replace('onclick="toggleMap()" aria-label="Close"', 'onclick="toggleMap()" aria-label="Close map"', 1)
html = html.replace('<div id="mapScroll">', '<div id="mapScroll" role="region" aria-label="Explored map" tabindex="0">', 1)
html = html.replace('id="npcPlaceholderEl" style="color:#444; font-size:12px;"', 'id="npcPlaceholderEl" style="font-size:12px;"', 1)
scripts = lambda text: re.findall(r'<script src="[^"]+"></script>', text)
assert scripts(source) == scripts(html), 'Script tags changed'
inline_scripts = lambda text: re.findall(r'<script>(.*?)</script>', text, re.S)
before = inline_scripts(source)
after = inline_scripts(html)
assert len(before) == len(after)
assert all(a.replace('2026-10-17-008', '2026-10-17-009', 1) == b for a, b in zip(before, after)), 'Inline behavior changed'
ids = re.findall(r'\bid="([^"]+)"', html)
assert len(ids) == len(set(ids)), 'Duplicate HTML IDs'
(root / 'cyoaftw-engine-CORE.html').write_text(html, encoding='utf-8', newline='\r\n')
print('Updated shell; script tags, inline behavior and unique IDs verified.')
