import React, { useState, useEffect } from 'react'
import { Box, Button, Typography } from '@mui/material'
import { getRequest } from 'src/services/apiService'
import dayjs from 'dayjs'

interface ParentInteractionProps {
  handleCancel: () => void
  setParentInteractionDialog: (open: boolean) => void
  setIsInteractionStart: (start: boolean) => void
  setIsInteractionReschedule: (reschedule: boolean) => void
  setIsInteractionCancel: (cancel: boolean) => void
  refreshData: any
  enquiryId: any
  enquiryDetails: any
  handleNext: (status?: string) => void
}

const ParentInteraction = ({
  handleCancel,
  setParentInteractionDialog,
  setIsInteractionStart,
  setIsInteractionReschedule,
  setIsInteractionCancel,
  refreshData,
  enquiryId,
  enquiryDetails,
  handleNext
}: ParentInteractionProps) => {
  const [bookingData, setBookingData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchBookingData = async () => {
    if (!enquiryId) return
    setIsLoading(true)
    try {
      const response = await getRequest({
        url: `marketing/kids-club-visit/${enquiryId}`,
        serviceURL: 'marketing'
      })
      if (response?.data) {
        setBookingData(response.data)
      } else {
        setBookingData(null)
      }
    } catch (error: any) {
      setBookingData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBookingData()
  }, [enquiryId, refreshData])
  const isVibgyor = enquiryDetails?.student_type === 'Vibgyor Student' || enquiryDetails?.other_details?.student_type === 'Vibgyor Student'

  const isBooked = !!bookingData?.date

  const handleSchedule = () => {
    setIsInteractionStart(false)
    setIsInteractionReschedule(false)
    setIsInteractionCancel(false)
    setParentInteractionDialog(true)
  }

  const handleReschedule = () => {
    setIsInteractionStart(false)
    setIsInteractionReschedule(true)
    setIsInteractionCancel(false)
    setParentInteractionDialog(true)
  }

  const handleCancelInteraction = () => {
    setIsInteractionStart(false)
    setIsInteractionReschedule(false)
    setIsInteractionCancel(true)
    setParentInteractionDialog(true)
  }

  const handleStartInteraction = () => {
    setIsInteractionStart(true)
    setIsInteractionReschedule(false)
    setIsInteractionCancel(false)
    setParentInteractionDialog(true)
  }

  if (isLoading) {
    return <Box sx={{ p: 4 }}>Loading...</Box>
  }

  return (
    <Box sx={{ p: 4, minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
      <Typography variant='h5' sx={{ fontWeight: 600, mb: 2, color: '#212121' }}>
        Schedule Parent Interaction
      </Typography>

      {isBooked ? (
        <>
          <Typography sx={{ mb: 3, color: '#666' }}>
            Parent Interaction Is Scheduled For{' '}
            <span style={{ textDecoration: 'underline', fontWeight: 500, color: '#333' }}>
              {dayjs(bookingData.date).isValid()
                ? dayjs(bookingData.date).format('dddd, DD MMMM YYYY')
                : dayjs(bookingData.date, 'DD-MM-YYYY').format('dddd, DD MMMM YYYY')}
              , {bookingData.slot}
            </span>
          </Typography>

          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 4 }}>
            <Button
              variant='outlined'
              onClick={handleReschedule}
              sx={{
                borderRadius: '25px',
                px: 3,
                borderColor: '#E594A5',
                color: '#E594A5',
                textTransform: 'none',
                '&:hover': { borderColor: '#d48394', backgroundColor: 'rgba(229, 148, 165, 0.04)' }
              }}
            >
              Re-Schedule
            </Button>
            <Typography
              onClick={handleCancelInteraction}
              sx={{
                color: '#E594A5',
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '0.875rem'
              }}
            >
              Cancel Interaction
            </Typography>
          </Box>
        </>
      ) : null}

      <Box sx={{ flexGrow: 1 }} />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 3, mt: 4 }}>
        <Button
          variant='outlined'
          onClick={handleCancel}
          sx={{
            borderRadius: '25px',
            px: 8,
            borderColor: '#9e9e9e',
            color: '#9e9e9e',
            textTransform: 'none',
            fontWeight: 500
          }}
        >
          Cancel
        </Button>
        {isVibgyor && (
          <Button
            variant='outlined'
            onClick={() => {
              localStorage.setItem(`skipped_interaction_${enquiryId}`, 'true')
              handleNext('Open')
            }}
            sx={{
              borderRadius: '25px',
              px: 4,
              borderColor: '#4849DA',
              color: '#4849DA',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { borderColor: '#3f40c2', backgroundColor: 'rgba(72, 73, 218, 0.04)' }
            }}
          >
            Skip Parent Interaction
          </Button>
        )}
        <Button
          variant='contained'
          color='secondary'
          onClick={isBooked ? handleStartInteraction : handleSchedule}
          sx={{
            borderRadius: '25px',
            px: 8,
            textTransform: 'none',
            fontWeight: 500,
            boxShadow: 'none',
            backgroundColor: isBooked ? '#E594A5' : undefined,
            '&:hover': { backgroundColor: isBooked ? '#d48394' : undefined }
          }}
        >
          {isBooked ? 'Start Interaction' : 'Schedule'}
        </Button>
      </Box>
    </Box>
  )
}

export default ParentInteraction
