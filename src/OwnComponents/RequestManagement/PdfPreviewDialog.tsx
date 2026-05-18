import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import { Box } from '@mui/material'

type PdfDialogProps = {
  open: boolean
  onClose: () => void
  pdfUrl: string | null
}

function PdfPreviewDialog({ open, onClose, pdfUrl }: PdfDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog fullScreen={fullScreen} open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogContent sx={{ height: '80vh', p: 1 }}>
        <Box sx={{ height: '100%' }}>
          {pdfUrl && <iframe src={pdfUrl} width='100%' height='100%' style={{ border: 'none' }} />}
        </Box>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Button
          variant='outlined'
          onClick={() => {
            if (pdfUrl) window.open(pdfUrl)
          }}
        >
          Open in New Tab
        </Button>

        <Button variant='contained' onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default PdfPreviewDialog
