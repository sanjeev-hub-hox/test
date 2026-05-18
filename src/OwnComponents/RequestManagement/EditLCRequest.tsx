import React from 'react'
import { useRouter } from 'next/router'
import { Box, CircularProgress } from '@mui/material'
import LCRequestForm from './LCRequestForm'

const EditLCRequest = ({ isNormal = true }: { isNormal?: boolean }) => {
  const router = useRouter()
  const { id, type } = router.query
  const requestId = id as string
  if (!router.isReady) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  return <LCRequestForm mode='edit' requestId={requestId} requestTypeSlug={type as string} isNormal={isNormal} />
}

export default EditLCRequest
