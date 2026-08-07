/** 演示用组织邀请链接 */
export function buildOrgInviteLink(
  departmentId: string,
  publicId?: string,
  token?: string,
): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://demo.company.com'
  const deptKey = publicId || departmentId
  const params = new URLSearchParams({ dept: deptKey })
  if (token) params.set('token', token)
  return `${origin}/org/join?${params.toString()}`
}

export function createOrgInviteToken(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** 演示用部门邀请码（与 token 同步刷新 / 失效） */
export function createOrgInviteCode(departmentPublicId: string, token: string): string {
  const deptPart = departmentPublicId
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4)
    .padEnd(4, 'X')
  const tokenPart = token
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(-4)
    .padStart(4, '0')
  return `${deptPart}-${tokenPart}`
}

export function buildOrgInviteQrCodeUrl(inviteLink: string, size = 200): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(inviteLink)}`
}
