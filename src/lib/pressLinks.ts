export type PressLinkFields = {
  title: string;
  publication: string;
  url: string;
};

export type StoredPressLink = PressLinkFields & {
  _key: string;
  _type: 'pressLink';
};

type Span = {
  text?: unknown;
  marks?: unknown;
};

type MarkDef = {
  _key?: unknown;
  _type?: unknown;
  href?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function pressLinkHtml(link: PressLinkFields): string {
  const publication = link.publication.trim();
  return `<li><p><a href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.title)}<br><em>${escapeHtml(publication)} </em>→</a></p></li>`;
}

export function pressListHtml(links: PressLinkFields[]): string {
  return `<ul>${links.map(pressLinkHtml).join('')}</ul>`;
}

export function isPressLink(value: unknown): value is StoredPressLink {
  if (!isRecord(value) || value._type !== 'pressLink') return false;
  return (
    typeof value._key === 'string' &&
    value._key.length > 0 &&
    typeof value.title === 'string' &&
    value.title.length > 0 &&
    typeof value.publication === 'string' &&
    value.publication.trim().length > 0 &&
    typeof value.url === 'string' &&
    value.url.length > 0
  );
}

function linkHref(children: Span[], markDefs: MarkDef[]): string | null {
  for (const child of children) {
    if (!Array.isArray(child.marks)) continue;
    for (const mark of child.marks) {
      if (typeof mark !== 'string' || mark === 'em') continue;
      const def = markDefs.find((item) => item._key === mark && item._type === 'link');
      if (def && typeof def.href === 'string' && def.href.length > 0) return def.href;
    }
  }
  return null;
}

function titleFromChildren(children: Span[]): string | null {
  for (const child of children) {
    if (typeof child.text !== 'string') continue;
    if (Array.isArray(child.marks) && child.marks.includes('em')) continue;
    const trimmed = child.text.trim();
    if (trimmed === '' || trimmed === '→') continue;
    const title = child.text.split('\n')[0]?.trim() ?? '';
    if (title) return title;
  }
  return null;
}

export function pressLinkFromListItem(block: unknown): StoredPressLink | null {
  if (!isRecord(block) || block.listItem !== 'bullet' || !Array.isArray(block.children)) return null;
  if (typeof block._key !== 'string' || block._key.length === 0) return null;

  const children = block.children.filter(isRecord) as Span[];
  const markDefs = (Array.isArray(block.markDefs) ? block.markDefs.filter(isRecord) : []) as MarkDef[];
  const url = linkHref(children, markDefs);
  const title = titleFromChildren(children);
  const publicationSpan = children.find(
    (child) => Array.isArray(child.marks) && child.marks.includes('em') && typeof child.text === 'string',
  );
  const publication = typeof publicationSpan?.text === 'string' ? publicationSpan.text.trim() : '';

  if (!url || !title || !publication) return null;

  return {
    _key: block._key,
    _type: 'pressLink',
    title,
    publication,
    url,
  };
}

function pressLinksFromTextBlock(block: unknown): StoredPressLink[] | null {
  if (!isRecord(block) || !Array.isArray(block.content) || block.content.length === 0) return null;

  const links: StoredPressLink[] = [];
  for (const item of block.content) {
    const link = pressLinkFromListItem(item);
    if (!link) return null;
    links.push(link);
  }
  return links;
}

export function migrateMainText(mainText: unknown): unknown {
  if (!Array.isArray(mainText)) return mainText;

  let changed = false;
  const next: unknown[] = [];
  for (const block of mainText) {
    const links = pressLinksFromTextBlock(block);
    if (!links) {
      next.push(block);
      continue;
    }
    changed = true;
    next.push(...links);
  }

  return changed ? next : mainText;
}
