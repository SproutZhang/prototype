export type RecordManagerProviderId = 'mysql' | 'postgres'

export type RecordManagerProviderOption = {
  id: RecordManagerProviderId
  logoSrc: string
  labelKey: 'recordManagerProviderMysql' | 'recordManagerProviderPostgres'
}

const logo = (file: string) => `/logos/record-managers/${file}`

export const RECORD_MANAGER_PROVIDER_OPTIONS: RecordManagerProviderOption[] = [
  { id: 'mysql', logoSrc: logo('mysql.svg'), labelKey: 'recordManagerProviderMysql' },
  { id: 'postgres', logoSrc: logo('postgres.svg'), labelKey: 'recordManagerProviderPostgres' },
]

export function findRecordManagerProviderOption(id: RecordManagerProviderId) {
  return RECORD_MANAGER_PROVIDER_OPTIONS.find((option) => option.id === id)
}
