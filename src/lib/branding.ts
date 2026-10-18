import branding from '../../branding.json';

export const PRODUCT_NAME = branding.productName;
export const LEGACY_PRODUCT_NAME = branding.legacyProductName;
export const ATTRIBUTION_NAME = branding.attributionName;
export const REPO_OWNER = branding.repoOwner;
export const REPO_NAME = branding.repoName;
export const REPO_BRANCH = branding.repoBranch;
export const GHCR_IMAGE_NAME = branding.ghcrImageName;

export const REPO_SLUG = `${REPO_OWNER}/${REPO_NAME}`;
export const REPO_URL = `https://github.com/${REPO_SLUG}`;
export const REPO_RAW_BASE_URL = `https://raw.githubusercontent.com/${REPO_SLUG}/refs/heads/${REPO_BRANCH}`;
export const REPO_RAW_VERSION_URL = `${REPO_RAW_BASE_URL}/VERSION.txt`;
export const REPO_RAW_CHANGELOG_URL = `${REPO_RAW_BASE_URL}/CHANGELOG`;
