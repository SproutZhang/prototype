import { useLocale } from '../../i18n/LocaleContext'
import { TeamCollaborationSpaceProvider } from './context/TeamCollaborationSpaceContext'
import { TeamCollaborationSpaceRouterInner } from './TeamCollaborationSpaceRouterInner'
import '../access-control/access-control.css'
import '../knowledge-base/knowledge-base.css'
import './team-collaboration-space.css'

export function TeamCollaborationSpacePage() {
  const { locale } = useLocale()
  return (
    <TeamCollaborationSpaceProvider locale={locale}>
      <TeamCollaborationSpaceRouterInner />
    </TeamCollaborationSpaceProvider>
  )
}
