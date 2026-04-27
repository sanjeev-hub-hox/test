import React from 'react'
import { Modal, Box, Typography, Button } from '@mui/material'
import LeadReopenedDialog from '../Dialog/ReopenRedirect'

interface FormDialogsProps {
  openReopenDialog: boolean
  setOpenReopenDialog: (open: boolean) => void
  handleLeadReopnData: any
  skipReopenCheckRef: any
  saveFormData: () => void
  openDupliacteByEmailPhone: boolean
  setOpenDupliacteByEmailPhone: (open: boolean) => void
  openDupliacteByEmailPhoneData: any[]
  handleDuplicateByEmailPhone: () => void
  open10ENRdialog: boolean
  setOpen10ENRdialog: (open: boolean) => void
  openDublicateIVTenquiry: boolean
  setOpenDublicateIVTenquiry: (open: boolean) => void
  dublicateEnquiry: string
}

const FormDialogs: React.FC<FormDialogsProps> = ({
  openReopenDialog,
  setOpenReopenDialog,
  handleLeadReopnData,
  skipReopenCheckRef,
  saveFormData,
  openDupliacteByEmailPhone,
  setOpenDupliacteByEmailPhone,
  openDupliacteByEmailPhoneData,
  handleDuplicateByEmailPhone,
  open10ENRdialog,
  setOpen10ENRdialog,
  openDublicateIVTenquiry,
  setOpenDublicateIVTenquiry,
  dublicateEnquiry
}) => {
  return (
    <>
      <LeadReopenedDialog
        openDialog={openReopenDialog}
        handleClose={() => setOpenReopenDialog(false)}
        leadData={handleLeadReopnData}
        skipReopenCheckRef={skipReopenCheckRef}
        saveFormData={saveFormData}
      />

      {/* Duplicate detection modal */}
      <Modal
        open={openDupliacteByEmailPhone}
        onClose={() => setOpenDupliacteByEmailPhone(false)}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              p: 2.5,
              bgcolor: '#fafafa'
            }}
          >
            <Typography
              id='modal-modal-title'
              variant='h6'
              component='h2'
              sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1.125rem'
              }}
            >
              Duplicate Enquiry Detected have matching email or phone number
            </Typography>
          </Box>

          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                bgcolor: '#f9fafb',
                p: 2,
                mb: 3,
                maxHeight: '180px',
                overflowY: 'auto'
              }}
            >
              {openDupliacteByEmailPhoneData.map((item: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.25,
                    px: 1.5,
                    mb: index !== openDupliacteByEmailPhoneData.length - 1 ? 1 : 0,
                    bgcolor: 'white',
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      mr: 1.5,
                      flexShrink: 0
                    }}
                  />
                  <Typography variant='body2' sx={{ fontWeight: 500, color: 'text.primary', fontSize: '0.9rem' }}>
                    {item.enquiry_number}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant='body2' sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6 }}>
              Do you want to continue creating this enquiry?
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button
                variant='outlined'
                onClick={() => setOpenDupliacteByEmailPhone(false)}
                sx={{
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  borderColor: 'divider',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'text.secondary',
                    bgcolor: 'rgba(0,0,0,0.02)'
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                variant='contained'
                onClick={() => handleDuplicateByEmailPhone()}
                sx={{
                  px: 3,
                  py: 1,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  boxShadow: 'none',
                  '&:hover': {
                    boxShadow: 'none'
                  }
                }}
              >
                Continue
              </Button>
            </Box>
          </Box>
        </Box>
      </Modal>

      {/* Grade restricted modal */}
      <Modal
        open={open10ENRdialog}
        onClose={() => setOpen10ENRdialog(false)}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
            border: 'none',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              bgcolor: 'error.light',
              p: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Typography sx={{ fontSize: '2rem', color: 'error.main' }}>⚠️</Typography>
            </Box>
          </Box>

          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography
              id='modal-modal-title'
              variant='h5'
              component='h2'
              sx={{
                fontWeight: 'bold',
                color: 'text.primary',
                mb: 2
              }}
            >
              Access Restricted
            </Typography>
            <Typography
              id='modal-modal-description'
              variant='body1'
              sx={{
                color: 'text.secondary',
                mb: 4
              }}
            >
              This form is only available for 10th grade students.
            </Typography>

            <Button
              variant='contained'
              color='primary'
              fullWidth
              onClick={() => setOpen10ENRdialog(false)}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Already exists modal */}
      <Modal
        open={openDublicateIVTenquiry}
        onClose={() => setOpenDublicateIVTenquiry(false)}
        aria-labelledby='modal-modal-title'
        aria-describedby='modal-modal-description'
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 420,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 6,
            p: 4,
            textAlign: 'center',
            border: 'none'
          }}
        >
          <Typography
            id='modal-modal-title'
            variant='h5'
            component='h2'
            sx={{ fontWeight: 'bold', color: 'error.main' }}
          >
            Enquiry Already Exists
          </Typography>

          <Typography id='modal-modal-description' sx={{ mt: 2, fontSize: '1rem', color: 'text.secondary' }}>
            Please continue with the existing enquiry {dublicateEnquiry}.
          </Typography>
        </Box>
      </Modal>
    </>
  )
}

export default FormDialogs
