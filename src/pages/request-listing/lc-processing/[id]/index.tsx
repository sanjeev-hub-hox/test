import React from 'react'
import { useRouter } from 'next/router'
import LCProcessing from 'src/OwnComponents/RequestManagement/LCProcessing'

export default function LCProcessingPage() {
  const router = useRouter()
  const { id } = router.query

  if (!id) return null

  return <LCProcessing requestId={id as string} />
}
