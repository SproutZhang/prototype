import {
  filterRecruitPassedCandidatesForHm,
  RECRUIT_PASSED_CANDIDATES_SEED,
  type RecruitPassedCandidate,
} from '../data/recruitPassedCandidatesSeed'

export const ONBOARDING_CANDIDATES_CHANGED_EVENT = 'tcs-onboarding-candidates-changed'

const STORAGE_KEY = 'tcs-onboarding-candidate-overrides'
/** 演示种子变更时递增，自动丢弃过期的本地确认记录 */
const STORAGE_VERSION = 2

type CandidateOverride = {
  status: 'confirmed'
  hmConfirmedAt: string
}

type CandidateOverrideMap = Record<string, CandidateOverride>

type PersistedPayload = {
  v: number
  overrides: CandidateOverrideMap
}

function isOverrideMap(value: unknown): value is CandidateOverrideMap {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function sanitizeOverrides(overrides: CandidateOverrideMap): CandidateOverrideMap {
  const validIds = new Set(RECRUIT_PASSED_CANDIDATES_SEED.map((item) => item.id))
  const next: CandidateOverrideMap = {}
  for (const [id, override] of Object.entries(overrides)) {
    if (validIds.has(id)) next[id] = override
  }
  return next
}

function readOverrides(): CandidateOverrideMap {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as PersistedPayload | CandidateOverrideMap
    if (
      parsed &&
      typeof parsed === 'object' &&
      'v' in parsed &&
      parsed.v === STORAGE_VERSION &&
      isOverrideMap(parsed.overrides)
    ) {
      return sanitizeOverrides(parsed.overrides)
    }

    // 旧版纯 map 或版本不匹配：重置为种子数据，避免「我的待办」长期为空
    localStorage.removeItem(STORAGE_KEY)
    return {}
  } catch {
    return {}
  }
}

function writeOverrides(overrides: CandidateOverrideMap): void {
  if (typeof localStorage === 'undefined') return
  const payload: PersistedPayload = { v: STORAGE_VERSION, overrides }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent(ONBOARDING_CANDIDATES_CHANGED_EVENT))
}

function applyOverrides(candidates: RecruitPassedCandidate[]): RecruitPassedCandidate[] {
  const overrides = readOverrides()
  return candidates.map((item) => {
    const override = overrides[item.id]
    if (!override) return item
    return { ...item, ...override }
  })
}

export function listRecruitPassedCandidatesForHm(hmMemberId: string): RecruitPassedCandidate[] {
  const base = filterRecruitPassedCandidatesForHm(RECRUIT_PASSED_CANDIDATES_SEED, hmMemberId)
  return applyOverrides(base)
}

export function confirmOnboardingCandidate(candidateId: string): void {
  const overrides = readOverrides()
  overrides[candidateId] = {
    status: 'confirmed',
    hmConfirmedAt: new Date().toISOString().slice(0, 10),
  }
  writeOverrides(overrides)
}

export function subscribeOnboardingCandidatesSync(listener: () => void): () => void {
  const handler = () => listener()
  window.addEventListener(ONBOARDING_CANDIDATES_CHANGED_EVENT, handler)
  return () => window.removeEventListener(ONBOARDING_CANDIDATES_CHANGED_EVENT, handler)
}
