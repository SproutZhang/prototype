import type { AppLocale } from '../../../i18n/homeStrings'

import {

  buildUserInitiatedRecruitRequest,

  type RecruitRequirements,

} from '../../../features/recruit-jd/userRecruitJdChat'

import {

  filterUserInitiatedRequestsForMember,

  USER_INITIATED_REQUESTS_SEED,

  type UserInitiatedRequest,

  type UserInitiatedRequestStatus,

} from '../data/userInitiatedRequestsSeed'



export const USER_INITIATED_REQUESTS_CHANGED_EVENT = 'tcs-user-initiated-requests-changed'



const STORAGE_KEY = 'tcs-user-initiated-dynamic-v2'

const STATUS_OVERRIDE_KEY = 'tcs-user-initiated-status-overrides-v1'



const SEED_REQUEST_IDS = new Set(USER_INITIATED_REQUESTS_SEED.map((item) => item.id))



type RequestStatusOverride = Pick<UserInitiatedRequest, 'status' | 'progressZh' | 'progressEn' | 'rejectReason'>



function dedupeUserInitiatedRequests(requests: UserInitiatedRequest[]): UserInitiatedRequest[] {

  const seenIds = new Set<string>()

  const seenTicketIds = new Set<string>()

  const next: UserInitiatedRequest[] = []



  for (const item of requests) {

    if (seenIds.has(item.id)) continue

    if (item.ticketId && seenTicketIds.has(item.ticketId)) continue

    seenIds.add(item.id)

    if (item.ticketId) seenTicketIds.add(item.ticketId)

    next.push(item)

  }



  return next

}



function readStatusOverrides(): Record<string, RequestStatusOverride> {

  if (typeof localStorage === 'undefined') return {}

  try {

    const raw = localStorage.getItem(STATUS_OVERRIDE_KEY)

    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<string, RequestStatusOverride>

    return parsed && typeof parsed === 'object' ? parsed : {}

  } catch {

    return {}

  }

}



function writeStatusOverrides(overrides: Record<string, RequestStatusOverride>): void {

  if (typeof localStorage === 'undefined') return

  localStorage.setItem(STATUS_OVERRIDE_KEY, JSON.stringify(overrides))

  window.dispatchEvent(new CustomEvent(USER_INITIATED_REQUESTS_CHANGED_EVENT))

}



function buildReviewProgress(
  status: Exclude<UserInitiatedRequestStatus, 'pending'>,
  rejectReason?: string,
): RequestStatusOverride {
  if (status === 'approved') {
    return {
      status,
      progressZh: '已通过 · HR 审核完成',
      progressEn: 'Approved · HR review completed',
    }
  }

  return {
    status,
    progressZh: '已驳回 · 请发起人修改后重新提交',
    progressEn: 'Rejected · Please revise and resubmit',
    rejectReason: rejectReason?.trim() || undefined,
  }
}



function applyStatusOverride(request: UserInitiatedRequest): UserInitiatedRequest {

  const override = readStatusOverrides()[request.id]

  if (!override) return request

  return { ...request, ...override }

}



function applyStatusOverrides(requests: UserInitiatedRequest[]): UserInitiatedRequest[] {

  return requests.map(applyStatusOverride)

}



function readDynamicRequests(): UserInitiatedRequest[] {

  if (typeof localStorage === 'undefined') return []

  try {

    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) return []

    const parsed = JSON.parse(raw) as UserInitiatedRequest[]

    if (!Array.isArray(parsed)) return []

    return dedupeUserInitiatedRequests(parsed.filter((item) => !SEED_REQUEST_IDS.has(item.id)))

  } catch {

    return []

  }

}



function writeDynamicRequests(requests: UserInitiatedRequest[]): void {

  if (typeof localStorage === 'undefined') return

  localStorage.setItem(STORAGE_KEY, JSON.stringify(dedupeUserInitiatedRequests(requests)))

  window.dispatchEvent(new CustomEvent(USER_INITIATED_REQUESTS_CHANGED_EVENT))

}



function listAllRecruitJdRequests(): UserInitiatedRequest[] {

  const dynamic = readDynamicRequests().filter((item) => item.kind === 'recruit')

  const dynamicIds = new Set(dynamic.map((item) => item.id))

  const seed = USER_INITIATED_REQUESTS_SEED.filter(

    (item) => item.kind === 'recruit' && !dynamicIds.has(item.id),

  )

  return applyStatusOverrides(dedupeUserInitiatedRequests([...dynamic, ...seed]))

}



export function appendUserRecruitJdRequest(

  memberId: string,

  locale: AppLocale,

  req: RecruitRequirements,

  ticketId: string,

): UserInitiatedRequest {

  const request = buildUserInitiatedRecruitRequest(locale, req, ticketId, memberId)

  const next = dedupeUserInitiatedRequests([

    request,

    ...readDynamicRequests().filter(

      (item) => item.ticketId !== ticketId && item.id !== request.id,

    ),

  ])

  writeDynamicRequests(next)

  return request

}



export function listUserInitiatedRequestsForMember(memberId: string): UserInitiatedRequest[] {

  const dynamic = readDynamicRequests().filter((item) => item.initiatorMemberId === memberId)

  const dynamicIds = new Set(dynamic.map((item) => item.id))

  const dynamicTicketIds = new Set(dynamic.map((item) => item.ticketId).filter(Boolean))

  const seed = filterUserInitiatedRequestsForMember(USER_INITIATED_REQUESTS_SEED, memberId).filter(

    (item) =>

      !dynamicIds.has(item.id) && (!item.ticketId || !dynamicTicketIds.has(item.ticketId)),

  )

  return applyStatusOverrides(dedupeUserInitiatedRequests([...dynamic, ...seed])).sort((a, b) =>

    b.submittedAt.localeCompare(a.submittedAt),

  )

}



/** User 提交、待 Manager/HR 审核的招聘 JD */

export function listPendingRecruitJdReviewTasks(): UserInitiatedRequest[] {

  return listAllRecruitJdRequests()

    .filter((item) => item.status === 'pending')

    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))

}



export function findRecruitJdRequestById(requestId: string): UserInitiatedRequest | undefined {

  return listAllRecruitJdRequests().find((item) => item.id === requestId)

}



export function reviewRecruitJdRequest(
  requestId: string,
  decision: Exclude<UserInitiatedRequestStatus, 'pending'>,
  rejectReason?: string,
): void {
  const progress = buildReviewProgress(decision, rejectReason)

  const dynamic = readDynamicRequests()

  const inDynamic = dynamic.find((item) => item.id === requestId)



  if (inDynamic) {

    writeDynamicRequests(

      dynamic.map((item) => (item.id === requestId ? { ...item, ...progress } : item)),

    )

    return

  }



  const overrides = readStatusOverrides()

  overrides[requestId] = progress

  writeStatusOverrides(overrides)

}



export function subscribeUserInitiatedRequestsSync(listener: () => void): () => void {

  const handler = () => listener()

  window.addEventListener(USER_INITIATED_REQUESTS_CHANGED_EVENT, handler)

  return () => window.removeEventListener(USER_INITIATED_REQUESTS_CHANGED_EVENT, handler)

}


