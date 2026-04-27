// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { Button, DialogActions, DialogTitle, IconButton } from '@mui/material'
import { Box } from '@mui/material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'

type customModal = {
  openModal: boolean
  closeModal?: () => void
  header?: string
  mode?: string
  message?: any
}

function StudentExists({ openModal, closeModal, header, mode, message }: customModal) {
  // ** Hooks
  const [maxWidths] = useState<any>('lg')

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
              Ok
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default StudentExists
