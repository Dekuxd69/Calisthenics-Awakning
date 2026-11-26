// Positions for the radial skill map: a hub in the middle and one branch per direction.
import { BRANCHES, SKILLS, SKILL_BY_ID, skillDepth, type BranchId } from './skills';

export const WORLD = 1500;
export const CENTER = WORLD / 2;
const FIRST_RING = 175;
const RING_GAP = 135;
/** Arc distance between sibling nodes on the same ring. */
const SIBLING_GAP = 128;

export const BRANCH_ANGLE: Record<BranchId, number> = { push: -90, pull: 30, core: 150 };

export interface NodePos {
  id: string;
  x: number;
  y: number;
  angle: number;
  depth: number;
}

export interface Edge {
  from: string;
  to: string;
  /** Requirement from another branch. */
  cross: boolean;
}

const rad = (deg: number) => (deg * Math.PI) / 180;

export function layoutTree(): { nodes: Record<string, NodePos>; edges: Edge[] } {
  const nodes: Record<string, NodePos> = {};
  for (const b of BRANCHES) {
    const skills = SKILLS.filter((k) => k.branch === b.id);
    const maxDepth = Math.max(...skills.map((k) => skillDepth(k.id)));
    for (let d = 0; d <= maxDepth; d++) {
      const ring = skills.filter((k) => skillDepth(k.id) === d);
      // Order siblings by the average angle of their parents to keep lines from crossing.
      const parentAngle = (id: string) => {
        const ps = SKILL_BY_ID[id].requires.filter((r) => nodes[r] && SKILL_BY_ID[r].branch === b.id);
        return ps.length ? ps.reduce((t, r) => t + nodes[r].angle, 0) / ps.length : BRANCH_ANGLE[b.id];
      };
      ring.sort((x, y) => parentAngle(x.id) - parentAngle(y.id));
      const r = FIRST_RING + d * RING_GAP;
      const step = (SIBLING_GAP / r) * (180 / Math.PI);
      ring.forEach((k, i) => {
        const angle = BRANCH_ANGLE[b.id] + (i - (ring.length - 1) / 2) * step;
        nodes[k.id] = { id: k.id, x: CENTER + r * Math.cos(rad(angle)), y: CENTER + r * Math.sin(rad(angle)), angle, depth: d };
      });
    }
  }
  const edges: Edge[] = [];
  for (const k of SKILLS) {
    for (const r of k.requires) edges.push({ from: r, to: k.id, cross: SKILL_BY_ID[r].branch !== k.branch });
  }
  return { nodes, edges };
}

/** Where the branch's first ring starts, for the hub spokes. */
export function branchAnchor(b: BranchId, r = FIRST_RING - 60) {
  return { x: CENTER + r * Math.cos(rad(BRANCH_ANGLE[b])), y: CENTER + r * Math.sin(rad(BRANCH_ANGLE[b])) };
}
