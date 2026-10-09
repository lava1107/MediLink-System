export function isBranchAll(branch) {
  return !branch || branch === "All" || branch === "All Branches";
}

export function cleanBranchName(name) {
  if (!name) return "";
  return String(name).toLowerCase().replace(/\s+(branch|hq|main branch)$/i, "").trim();
}

export function matchBranch(targetBranch, currentBranch) {
  if (isBranchAll(currentBranch)) return true;
  if (!targetBranch) return false;
  const c = cleanBranchName(currentBranch);
  const t = cleanBranchName(targetBranch);
  if (!c) return true;
  return t === c || t.includes(c) || c.includes(t);
}

export function getBranchCity(branchName) {
  if (!branchName || isBranchAll(branchName)) return "All Cities";
  const cleaned = cleanBranchName(branchName);
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}
