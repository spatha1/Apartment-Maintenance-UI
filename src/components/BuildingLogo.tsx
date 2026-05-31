import { useState } from 'react'

interface Props {
  className?: string
}

export default function BuildingLogo({ className = 'w-8 h-8 rounded-lg' }: Props) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`${className} bg-gradient-to-br from-green-700 to-red-600 flex items-center justify-center shadow-sm`}>
        <span className="text-white font-black text-xs tracking-tight">SNM</span>
      </div>
    )
  }

  return (
    <img
      src="/building.jpg"
      alt="Sai Nirmans Modulus"
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  )
}
