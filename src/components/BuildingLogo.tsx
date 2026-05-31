import { useEffect, useState } from 'react'
import { api, staticUrl } from '../api/client'

interface Props {
  className?: string
}

let cachedLogoUrl: string | null = null

export default function BuildingLogo({ className = 'w-8 h-8 rounded-lg' }: Props) {
  const [logoUrl, setLogoUrl] = useState<string>(cachedLogoUrl ?? '')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (cachedLogoUrl !== null) return
    api.get<{ logo_url?: string }>('/settings/qr')
      .then(r => {
        const url = r.logo_url ?? ''
        cachedLogoUrl = url
        setLogoUrl(url)
      })
      .catch(() => {})
  }, [])

  if (!logoUrl || failed) {
    return (
      <div className={`${className} bg-gradient-to-br from-green-700 to-red-600 flex items-center justify-center shadow-sm`}>
        <span className="text-white font-black text-xs tracking-tight leading-none">SNM</span>
      </div>
    )
  }

  return (
    <img
      src={staticUrl(logoUrl)}
      alt="Sai Nirmans Modulus"
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  )
}
