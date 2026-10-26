const minimumVersions = { 22: [23, 4], 24: [22, 1], 26: [12, 1] };

export function assertPatchedNode(version = process.versions.node) {
  const [major, minor, patch] = version.split('.').map(Number);
  const minimum = minimumVersions[major];
  if (!minimum || ![major, minor, patch].every(n => Number.isInteger(n) && n >= 0) || minor < minimum[0] || (minor === minimum[0] && patch < minimum[1])) {
    throw new Error(`지원하지 않는 Node.js ${version}. Node.js 22.23.4 이상(22.x), 24.22.1 이상(24.x), 26.12.1 이상(26.x)이 필요합니다.`);
  }
}

assertPatchedNode();
