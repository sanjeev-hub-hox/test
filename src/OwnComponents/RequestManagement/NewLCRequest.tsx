'use client'

import React from 'react'
import { useRouter } from 'next/router'
import LCRequestForm from './LCRequestForm'

const NewLCRequest = () => {
  const router = useRouter()
  const { type } = router.query

  return <LCRequestForm mode='create' requestTypeSlug={type as string} />
}

export default NewLCRequest
