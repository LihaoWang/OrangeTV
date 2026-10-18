// 此文件由 scripts/convert-changelog.js 自动生成
// 请勿手动编辑

export interface ChangelogEntry {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: '9.0.0',
    date: '2026-06-25',
    added: [
      'NovaTV product branding across app UI, docs, Docker images, and release metadata.',
      'Shared branding constants for product name, attribution, repository links, and GHCR image naming.',
      'Legacy OrangeTV default site-name migration while preserving custom site names and compatibility storage keys.',
    ],
    changed: [
      'Rebased visible attribution to “基于 OrangeTV” while pointing version and repository links at LihaoWang/OrangeTV.',
      'Published Docker references now use ghcr.io/lihaowang/novatv.',
      'Version metadata now reflects the NovaTV project rather than inherited OrangeTV release history.',
    ],
    fixed: [
      'Version information modal no longer shows inherited OrangeTV 8.x changelog entries as local release data.',
    ],
  },
];

export default changelog;
