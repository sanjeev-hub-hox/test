// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { Button, DialogActions, DialogTitle, IconButton } from '@mui/material'
import { Box } from '@mui/material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import { patchRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { getLocalStorageVal } from 'src/utils/helper'
import { useRouter } from 'next/router'

type customModal = {
  openModal: boolean
  closeModal?: () => void
  header?: string
  mode?: string
  message?: any
  enquiryId?: any
}

function EnquiryMessage({ openModal, closeModal, header, mode, message, enquiryId }: customModal) {
  // ** Hooks
  const [maxWidths] = useState<any>('lg')
  const { setGlobalState } = useGlobalContext()
  const router = useRouter()

  const handleContinue = async () => {
    setGlobalState({ isLoading: true })
    const userDetailsJsonDt = getLocalStorageVal('userInfo')
    const userDetailsDt = userDetailsJsonDt ? JSON.parse(userDetailsJsonDt) : {}
    const params = {
      url: `marketing/enquiry/reassign`,
      data: {
        enquiryIds: [enquiryId],
        assigned_to: userDetailsDt?.userInfo?.name,
        assigned_to_id: userDetailsDt?.userInfo?.id
      }
    }
    const response = await patchRequest(params)
    if (response?.status) {
      router?.push(`/enquiries/view/${enquiryId}`)
    }
    setGlobalState({ isLoading: false })
  }

  return (
    <>
      <Dialog
        // fullScreen={fullScreen}
        open={openModal}
        onClose={closeModal}
        maxWidth={maxWidths}
        aria-labelledby='responsive-dialog-title'
        sx={{
          '& .MuiPaper-root': {
            maxWidth: '600px',
            width: '600px'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <DialogTitle id='responsive-dialog-title'>{header}</DialogTitle>
          <IconButton disableFocusRipple disableRipple onClick={closeModal}>
            <HighlightOffIcon style={{ color: '#666666' }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ overflowY: mode ? 'initial' : 'auto' }}>
          <Box sx={{ mb: 5 }}>
            <p>{message}</p>
          </Box>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            <Button onClick={closeModal} size='large' variant='outlined' color='inherit' sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button onClick={handleContinue} size='large' variant='contained' color='secondary'>
              Continue
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default EnquiryMessage
