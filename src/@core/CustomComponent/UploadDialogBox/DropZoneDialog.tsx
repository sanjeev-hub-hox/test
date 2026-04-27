// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import { Button, DialogActions, DialogTitle } from '@mui/material'
import { Box } from '@mui/material'
import FileUploaderMultiple from './FileUploaderMultiple'

type customModal = {
  title: string
  subTitle?: string
  openModal: boolean
  closeModal?: () => void
  handleSubmitClose?: any
  allowedTypes?: any
}

function DropZoneDialog({ title, subTitle, openModal, closeModal, handleSubmitClose, allowedTypes }: customModal) {
  // ** Hooks
  const [maxWidths] = useState<any>('md')
  const [files, setFiles] = useState<File[]>([])

  const handleSetFiles = (files: any) => {
    setFiles(files)
  }

  return (
    <>
      <Dialog maxWidth={maxWidths} open={openModal} onClose={closeModal} aria-labelledby='customized-dialog-title'>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <DialogTitle sx={{ color: '#313030', lineHeight: '20px' }} id='customized-dialog-title'>
            {title} <br />
            <span>{subTitle}</span>
          </DialogTitle>
          {/* <IconButton disableFocusRipple disableRipple onClick={closeModal}>
            <HighlightOffIcon sx={{ marginTop: '-25px' }} />
          </IconButton> */}
        </Box>
        <DialogContent>
          <FileUploaderMultiple handleSetFiles={handleSetFiles} allowedTypes={allowedTypes} />
        </DialogContent>
        <DialogActions
          className='dialog-actions-dense'
          sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '50px' }}>
            {/* <InsertDriveFileIcon sx={{ color: '#292D32' }} /> */}

            {/* <Typography sx={{ textTransform: 'capitalize' }} variant='button' color='primary.main'>
              Download Template
            </Typography> */}
            {/* <Button
              variant='text'
              color='primary'
              disableRipple
              disableFocusRipple
              disableTouchRipple
              startIcon={<span className='icon-import-1' style={{ marginRight: '5px' }}></span>}
            >
              Download Template
            </Button> */}
          </Box>
          <Box>
            <Button variant='outlined' color='inherit' onClick={closeModal}>
              Cancel
            </Button>
            <Button
              disabled={files && files.length == 0}
              sx={{ ml: 3 }}
              variant='contained'
              color='primary'
              onClick={() => handleSubmitClose(files)}
            >
              Submit
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default DropZoneDialog
