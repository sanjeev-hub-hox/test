import { Card, Typography, Button, TextField, Avatar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material'
import { useEffect, useState } from 'react'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

type ReferralCardProps = {
  studentName: string
  academicYear: string
  enrollmentId: string
  enquiryId: string
  schoolLocation: string
  grade: string
  stream: string
  referrerName: string
  inputLabel: string
  phoneNumberHelperText: string
  phoneNumber: string
  onPhoneChange: (value: string) => void
  errorMessage?: string
  successMessage?: string
  onSubmit: () => void
  onCancel?: () => void
  isSubmitDisabled?: boolean
  actionType: string
  isSubmitting?: boolean
}

export default function ReferralCard({
  studentName,
  academicYear,
  enrollmentId,
  schoolLocation,
  grade,
  stream,
  referrerName,
  inputLabel,
  phoneNumberHelperText,
  phoneNumber,
  onPhoneChange,
  errorMessage,
  successMessage,
  onSubmit,
  onCancel,
  isSubmitDisabled = false,
  actionType,
  isSubmitting = false
}: ReferralCardProps) {

  const [finalAvatar, setFinalAvatar] = useState('/images/default-avatar.png')
  const [openSuccessDialog, setOpenSuccessDialog] = useState(false)
  const [openErrorDialog, setOpenErrorDialog] = useState(false)

  useEffect(() => {
    setFinalAvatar('/images/default-avatar.png')
  }, [])

  useEffect(() => {
    if (successMessage) {
      setOpenSuccessDialog(true)
    }
  }, [successMessage])

  useEffect(() => {
    if (errorMessage && (
      errorMessage.includes('Already Submitted') || 
      errorMessage.includes('Incorrect Referral Details') ||
      errorMessage.includes('locked') ||
      errorMessage.includes('expired')
    )) {
      setOpenErrorDialog(true)
    }
  }, [errorMessage])

  const handleCloseSuccessDialog = () => {
    setOpenSuccessDialog(false)
  }

  const handleCloseErrorDialog = () => {
    setOpenErrorDialog(false)
  }

  return (
    <>
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          margin: '0 auto',
          padding: '0 16px'
        }}
      >
        <Card
          variant='outlined'
          style={{
            backgroundColor: '#ebebfa',
            padding: '40px 24px 60px',
            borderRadius: '12px 12px 0 0',
            textAlign: 'center',
          }}
        >
          <img
            src='/images/vibgyor-logo.png'
            alt='logo'
            style={{
              width: '100%',
              maxWidth: 350,
              height: 'auto',
              marginBottom: 20
            }}
          />

          <Typography variant='subtitle1'>
            <h2 style={{ fontWeight: 500, margin: 0 }}>Verification Message</h2>
          </Typography>

          <Typography variant='body2' style={{ marginTop: 10 }}>
            <h3 style={{ fontWeight: 400, margin: 0, color: '#9a9595ff' }}>
              {`Verify The ${actionType==='referral' ? 'Referrer' : 'Referral'} Phone Number`}
            </h3>
          </Typography>
        </Card>

        <Card
          variant='outlined'
          style={{
            backgroundColor: '#fff',
            padding: '24px',
            borderRadius: 0
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            <Avatar
              src={finalAvatar}
              alt='avatar'
              sx={{
                width: 150,
                height: 150,
                margin: '0 auto',
              }}
            />
          </div>

          <Typography
            variant='h6'
            align='center'
            style={{
              fontWeight: 'bold',
              fontSize: 25
            }}
          >
            {studentName}
            <span
              style={{
                fontWeight: 'normal',
                fontSize: '0.7em',
                color: 'gray',
                marginLeft: '4px'
              }}
            >
              (AY {academicYear})
            </span>
          </Typography>

          <Typography
            variant='body2'
            align='center'
            style={{
              color: 'gray',
              maxWidth: 380,
              margin: '8px auto 0',
              wordBreak: 'break-word'
            }}
          >
            {enrollmentId} | {schoolLocation} | {grade} | {stream}
          </Typography>

          <div
            style={{
              marginTop: 20,
              backgroundColor: '#f4f4f4',
              padding: '12px 16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderRadius: 14,
              flexWrap: 'wrap',
              gap: 8
            }}
          >
            <Typography
              variant='caption'
              style={{
                fontSize: 14,
                color: '#333',
                fontWeight: 500,
                minWidth: 120
              }}
            >
              {inputLabel}
            </Typography>

            <Typography
              variant='body1'
              style={{
                fontSize: 14,
                color: '#333',
                wordBreak: 'break-word',
                flex: 1,
                textAlign: 'right'
              }}
              title={referrerName}
            >
              {referrerName}
            </Typography>
          </div>

          <Typography 
            style={{ 
              marginTop: 25,
              color: '#8a8787ff'
            }} 
            variant='body2'
          >
            Please enter the{' '}
            <b>{phoneNumberHelperText}</b> phone number.
          </Typography>

          <TextField
            fullWidth
            placeholder="Enter Phone Number"
            variant='outlined'
            size='small'
            style={{ marginTop: 14 }}
            value={phoneNumber}
            onChange={(e) => onPhoneChange(e.target.value)}
            type="tel"
            inputProps={{
              maxLength: 10,
              pattern: '[0-9]*'
            }}
            disabled={isSubmitDisabled || isSubmitting}
            required
          />

          {successMessage && (
            <Alert 
              severity="success" 
              style={{ 
                marginTop: 16,
                backgroundColor: '#d4edda',
                color: '#155724'
              }}
            >
              {successMessage}
            </Alert>
          )}

          {errorMessage && !(
            errorMessage.includes('Already Submitted') || 
            errorMessage.includes('Incorrect Referral Details') ||
            errorMessage.includes('locked') ||
            errorMessage.includes('expired')
          ) && (
            <Alert 
              severity="error" 
              style={{ 
                marginTop: 16,
                backgroundColor: '#ffe6e6',
                color: '#b00000'
              }}
            >
              {errorMessage}
            </Alert>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: typeof window !== 'undefined' && window.innerWidth < 480 ? 'column' : 'row',
              justifyContent: 'space-between',
              marginTop: 30,
              paddingTop: 20,
              borderTop: '1px solid #bdbdbd',
              marginLeft: -24,
              marginRight: -24,
              paddingLeft: 24,
              paddingRight: 24,
              gap: 12
            }}
          >
            <Button
              variant='outlined'
              fullWidth
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                borderColor: '#bdbdbd',
                color: '#757575',
                borderRadius: 25
              }}
            >
              Cancel
            </Button>

            <Button
              variant='contained'
              onClick={onSubmit}
              fullWidth
              disabled={isSubmitDisabled}
              style={{
                backgroundColor: isSubmitDisabled ? '#cccccc' : '#006eceff',
                borderRadius: 25,
                cursor: isSubmitDisabled ? 'not-allowed' : 'pointer',
                opacity: isSubmitDisabled ? 0.6 : 1,
                position: 'relative'
              }}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress 
                    size={20} 
                    style={{ 
                      color: 'white',
                      marginRight: 8
                    }} 
                  />
                  Verifying...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </div>
        </Card>
      </div>

      <Dialog 
        open={openSuccessDialog} 
        onClose={handleCloseSuccessDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: 16,
            padding: '10px'
          }
        }}
      >
        <DialogTitle style={{ textAlign: 'center', paddingTop: 30 }}>
          <CheckCircleOutlineIcon 
            style={{ 
              fontSize: 80, 
              color: '#4caf50',
              marginBottom: 10
            }} 
          />
          <Typography variant="h5" style={{ fontWeight: 600, color: '#4caf50' }}>
            Success!
          </Typography>
        </DialogTitle>
        <DialogContent style={{ textAlign: 'center', paddingBottom: 20 }}>
          <Typography variant="body1" style={{ color: '#555', lineHeight: 1.6 }}>
            {successMessage}
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center', paddingBottom: 20 }}>
          <Button 
            onClick={handleCloseSuccessDialog} 
            variant="contained"
            style={{
              backgroundColor: '#4caf50',
              color: 'white',
              borderRadius: 25,
              padding: '8px 40px',
              textTransform: 'none',
              fontSize: 16
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog 
        open={openErrorDialog} 
        onClose={handleCloseErrorDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: 16,
            padding: '10px'
          }
        }}
      >
        <DialogTitle style={{ textAlign: 'center', paddingTop: 30 }}>
          <ErrorOutlineIcon 
            style={{ 
              fontSize: 80, 
              color: '#f44336',
              marginBottom: 10
            }} 
          />
          <Typography variant="h5" style={{ fontWeight: 600, color: '#f44336' }}>
            Error!
          </Typography>
        </DialogTitle>
        <DialogContent style={{ textAlign: 'center', paddingBottom: 20 }}>
          <Typography variant="body1" style={{ color: '#555', lineHeight: 1.6 }}>
            {errorMessage}
          </Typography>
        </DialogContent>
        <DialogActions style={{ justifyContent: 'center', paddingBottom: 20 }}>
          <Button 
            onClick={handleCloseErrorDialog} 
            variant="contained"
            style={{
              backgroundColor: '#f44336',
              color: 'white',
              borderRadius: 25,
              padding: '8px 40px',
              textTransform: 'none',
              fontSize: 16
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}