import React, { useState, useEffect } from 'react'
import {
  Box,
  IconButton,
  Button,
  TextField,
  Typography,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Badge
} from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker'
import dayjs, { Dayjs } from 'dayjs'
import { styled } from '@mui/system'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { getRequest, postRequest, patchRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { useForm, Controller } from 'react-hook-form'
import style from '../../../pages/enquiry-types/enquiryTypes.module.css'
import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'
import { convertDate, formatDateShort } from 'src/utils/helper'
import toast from 'react-hot-toast'
import { ENQUIRY_STAGES } from 'src/utils/constants'

const CalendarIcon = () => <span className='icon-calendar-1'></span>
const DownArrow = () => <span style={{ color: '#666666' }} className='icon-arrow-down-1'></span>

//Chips Styled
const StyledChipProps = styled(Chip)(({ theme }) => ({
  '&.MuiChip-colorPrimary': {
    border: `1px solid ${theme.palette.primary.dark}`,
    borderRadius: '8px',
    height: '36px',
    padding: '6px 10px',
    background: '#4849DA14 !important',
    color: '#4849DA !important',
    minWidth: '120px'
  },
  '&.MuiChip-colorDefault': {
    border: `1px solid ${theme.palette.grey[300]} !important`,
    borderRadius: '8px',
    height: '36px',
    padding: '6px 10px',
    background: `${theme.palette.common.white} !important`,
    color: `${theme.palette.customColors.mainText} `,
    minWidth: '120px'
  }
}))

type SchoolTour = {
  openDialog: boolean
  handleClose?: () => void
  title?: string
  setSchoolTourDialog?: any
  minimized?: boolean
  setMinimized?: any
  enquiryId?: any
  mode?: any
  enquiryType?: string
  stageType?: string
  defaultIsStart?: boolean
  defaultIsReschedule?: boolean
  defaultIsCancel?: boolean
  setRefresh?: any
}
interface SlotTiming {
  _id: string
  slot_for: string
  slot: string
  day: string
  school_id: number
  bookedCount?: number
}
const SchoolTourDialog = ({
  openDialog,
  handleClose,
  title,
  setSchoolTourDialog,
  minimized,
  setMinimized,
  enquiryId,
  enquiryType,
  stageType,
  defaultIsStart,
  defaultIsReschedule,
  defaultIsCancel,
  setRefresh
}: SchoolTour) => {
  interface schoolTourForm {
    comment: string
    visitTime: string
    visitDate: Dayjs | null | Date
  }

  const {
    handleSubmit,
    formState: { errors },
    watch,
    control
  } = useForm<schoolTourForm>({
    defaultValues: {
      visitDate: dayjs().toDate() // Initialize visitDate with the current date
    }
  })
  const formDataVal = watch()

  const [selectedDate] = useState<Dayjs | null>(dayjs())
  const [visitTime, setVisitTime] = useState<string>('')

  const [isBooked, setIsBooked] = useState<boolean>(false)
  const [isCancel, setIsCancel] = useState<boolean>(false)
  const [isStart, setIsStart] = useState<boolean>(false)
  const [isRescheduled, setIsRescheduled] = useState<boolean>(false)
  const { setGlobalState, userInfo } = useGlobalContext()
  const [loadingCount] = useState(0)
  const [schooltourSuccessDialog, setschooltourSuccessDialog] = useState<boolean>(false)
  const [slotTiming, setSlotTiming] = useState<SlotTiming[]>([])

  // State variables for API data
  const [apiVisitDate, setApiVisitDate] = useState<any>(dayjs())
  const [apiVisitTime, setApiVisitTime] = useState('')
  const [apiComment, setApiComment] = useState('')

  //cancel tour
  const [reason, setReason] = useState<string>('Personal Reason')
  const [reComment, setReComment] = useState<string>('')

  const [options, setOptions] = useState<string[]>([])
  const [activities, setActivities] = useState<string[]>([])

  const isKidsClub = enquiryType?.toLowerCase()?.includes('kids club')
  const isParentInteraction = stageType === ENQUIRY_STAGES.PARENT_INTERACTION
  const apiBase = isKidsClub ? 'marketing/kids-club-visit' : 'marketing/school-visit'

  useEffect(() => {
    setGlobalState({ isLoading: loadingCount > 0 })
    handleView()
    const formattedDate = dayjs(apiVisitDate).format('DD-MM-YYYY')
    slotVisitApi(formattedDate)
  }, [loadingCount, enquiryId, apiVisitDate, enquiryType, defaultIsStart, defaultIsReschedule, defaultIsCancel])

  const handleMinimize = () => {
    setMinimized(true)
  }

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target

    if (checked) {
      // Add the value to the activities array
      setActivities(prevActivities => [...prevActivities, value])
    } else {
      // Remove the value from the activities array
      setActivities(prevActivities => prevActivities.filter(activity => activity !== value))
    }
  }

  const handleCancel = () => {
    // Logic for Cancel button
    setIsBooked(true)
    setIsRescheduled(false)
    setIsCancel(false)
    setIsStart(false)
  }

  const optionForSubmition = async () => {
    try {
      // Set loading state to true
      setGlobalState({
        isLoading: true
      })

      // Define parameters for the API request
      const params = {
        url: `/api/co-checklists?filters[parent_id]=1`,
        serviceURL: 'mdm',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
        }
      }

      // Make the API request

      const responseData = await getRequest(params)
      // Set loading state to false
      setGlobalState({
        isLoading: false
      })
      // Check if the response contains data
      if (responseData?.data) {
        // Update the state based on the response
        setOptions(responseData?.data)
        // Set state with API data
      }
    } catch (error: any) {
      // Handle any errors that occur during the request
      setGlobalState({ isLoading: false })
      toast.error(error?.response?.data?.message || 'Failed to fetch checklist options')
    }
  }

  const SubmitApi = async () => {
    if (!isStart) return

    try {
      // Set loading state to true
      setGlobalState({
        isLoading: true
      })

      const payloadData = {
        activities: activities,
        comment: reComment,
        created_by: {
          user_id: userInfo?.userInfo?.id,
          user_name: userInfo?.userInfo?.name,
          email: userInfo?.userInfo?.email
        }
      }

      // Define parameters for the API request
      const completeParams = {
        url: `${apiBase}/${enquiryId}/complete`,
        serviceURL: 'marketing',
        data: payloadData
      }

      const responseData = await postRequest(completeParams)

      if (responseData?.data) {
        const stageUpdateParams = {
          url: `marketing/enquiry/${enquiryId}/move-to-next-stage`,
          serviceURL: 'marketing',
          data: {
            currentStage: stageType || ENQUIRY_STAGES.SCHOOL_VISIT,
            status: 'Completed'
          }
        }
        await patchRequest(stageUpdateParams)

        setGlobalState({ isLoading: false })
        setIsBooked(true)
        setIsRescheduled(false)
        setIsCancel(false)
        setIsStart(false)
        localStorage.removeItem(`force_active_stage_${enquiryId}`)
        setschooltourSuccessDialog(true)
      } else {
        setGlobalState({ isLoading: false })
        toast.error(responseData?.message || 'Failed to complete visit')
      }
    } catch (error: any) {
      // Handle any errors that occur during the request
      setGlobalState({ isLoading: false })
      toast.error(error?.response?.data?.message || 'An error occurred')
    }
  }

  const slotVisitApi = async (date: any) => {
    // Set loading state to true
    setGlobalState({
      isLoading: true
    })

    // Define the parameters for the API request

    const params = {
      url: isKidsClub
        ? `${apiBase}/slots/${encodeURIComponent(
            isParentInteraction ? 'Parent Interaction' : 'Kids Club Visit'
          )}?enquiryId=${enquiryId}&date=${date}`
        : `${apiBase}/slots?enquiryId=${enquiryId}&date=${date}`,
      serviceURL: 'marketing'
    }

    try {
      const responseData = await getRequest(params)

      if (responseData?.data) {
        setGlobalState({
          isLoading: false
        })
        setSlotTiming(responseData.data)
      } else {
        setGlobalState({
          isLoading: false
        })
      }
    } catch (error: any) {
      setGlobalState({
        isLoading: false
      })
      toast.error(error?.response?.data?.message || 'Failed to fetch slots')
    }
  }
  const RescheduleApi = async () => {
    const payloadData = {
      date: formDataVal.visitDate ? dayjs(formDataVal.visitDate).format('DD-MM-YYYY') : '',
      new_slot_id: formDataVal.visitTime,
      comment: formDataVal.comment
    }

    setGlobalState({ isLoading: true })

    try {
      // Configure the API request
      const eventName = isParentInteraction ? 'Parent Interaction' : 'Kids Club Visit'
      const params = {
        url: `${apiBase}/${enquiryId}/reschedule`,
        serviceURL: 'marketing',
        data: isKidsClub ? { ...payloadData, event: eventName } : payloadData
      }

      // Make the API request
      const responseData = await postRequest(params)

      // Check if response data is valid and perform necessary actions
      if (responseData?.data) {
        setGlobalState({ isLoading: false })
        setschooltourSuccessDialog(true)
        handleView()
      } else {
        setGlobalState({ isLoading: false })
        toast.error(responseData?.message || 'Failed to reschedule')
      }
    } catch (error: any) {
      setGlobalState({ isLoading: false })
      toast.error(error?.response?.data?.message || 'An error occurred during reschedule')
    }
  }

  const CancelTourApi = async () => {
    try {
      // Set loading state to true
      setGlobalState({
        isLoading: true
      })

      const payloadData = {
        reason: reason,
        comment: reComment
      }

      // Define parameters for the API request
      const params = {
        url: `${apiBase}/${enquiryId}/cancel`,
        serviceURL: 'marketing',
        data: payloadData
      }

      // Make the API request

      const responseData = await postRequest(params)
      // Set loading state to false
      setGlobalState({
        isLoading: false
      })

      // Check if the response contains data
      if (responseData?.data) {
        // Update the state based on the response
        setIsBooked(false)
        setIsRescheduled(false)
        setIsCancel(false)
        setSchoolTourDialog(false)
        if (setRefresh) {
          setRefresh((prev: any) => !prev)
        }
        toast.success(`${isParentInteraction ? 'Interaction' : 'Tour'} cancelled successfully`)
      } else {
        toast.error(responseData?.message || 'Failed to cancel')
      }
    } catch (error: any) {
      // Handle any errors that occur during the request
      setGlobalState({ isLoading: false })
      toast.error(error?.response?.data?.message || 'An error occurred during cancellation')
    }
  }

  const handleView = async () => {
    try {
      // Set loading state to true
      setGlobalState({
        isLoading: true
      })

      // Define parameters for the API request
      const params = {
        url: `${apiBase}/${enquiryId}`,
        serviceURL: 'marketing'
      }

      // Make the API request

      const responseData = await getRequest(params)
      // Set loading state to false
      setGlobalState({
        isLoading: false
      })

      // Check if the response contains data
      if (responseData?.data) {
        // Update the state based on the response
        const { date, slot, comment } = responseData.data
        // Set state with API data
        setApiVisitDate(date) // Assuming date is in ISO format
        setApiVisitTime(slot) // Slot time as a string
        setApiComment(comment || '') // Comment might be null

        setIsBooked(!defaultIsReschedule && !defaultIsStart && !defaultIsCancel)
        setIsRescheduled(!!defaultIsReschedule)
        setIsCancel(!!defaultIsCancel)
        setIsStart(!!defaultIsStart)

        if (defaultIsStart) {
          optionForSubmition()
        }
      }
    } catch (error: any) {
      // Handle any errors that occur during the request
      setGlobalState({ isLoading: false })
      toast.error(error?.response?.data?.message || 'Failed to fetch visit details')
    }
  }

  const handleBook = async () => {
    const payloadData = {
      date: formDataVal.visitDate ? dayjs(formDataVal.visitDate).format('DD-MM-YYYY') : '',
      slot_id: formDataVal.visitTime,
      comment: formDataVal.comment
    }
    // Set loading state before making the request
    setGlobalState({ isLoading: true })

    try {
      // Configure the API request
      const eventName = isParentInteraction ? 'Parent Interaction' : 'Kids Club Visit'
      const params = {
        url: isKidsClub ? `${apiBase}/${enquiryId}/create` : `${apiBase}/${enquiryId}/schedule`,
        serviceURL: 'marketing',
        data: isKidsClub ? { ...payloadData, mode: 'Offline', event: eventName } : payloadData // Adding 'mode' and 'event' as requested for Kids Club
      }

      // Make the API request
      const responseData = await postRequest(params)

      // Check if response data is valid and perform necessary actions
      if (responseData?.data) {
        setGlobalState({ isLoading: false })
        setschooltourSuccessDialog(true)
        //setSchoolTourDialog(false)
        handleView()
      } else {
        setGlobalState({ isLoading: false })
        toast.error(responseData?.message || 'Failed to book visit')
      }
    } catch (error: any) {
      setGlobalState({ isLoading: false })
      toast.error(error?.response?.data?.message || 'An error occurred during booking')
    }
  }

  const handleSchoolTourSuccessClose = () => {
    setschooltourSuccessDialog(false)
    setIsRescheduled(false)
    setIsCancel(false)
    setIsStart(false)
    if (setRefresh) {
      setRefresh((prev: any) => !prev)
    }
    if (isParentInteraction) {
      localStorage.removeItem(`skipped_interaction_${enquiryId}`)
    }
    setSchoolTourDialog(false)
    window.location.reload()
  }

  const handleCancelTour = () => {
    setIsCancel(true)
    setIsBooked(false)
    setIsRescheduled(false)
  }

  const handleReason = (event: any) => {
    setReason(event.target.value as string)
  }
  const handleReschedule = () => {
    setIsRescheduled(true)
    setIsBooked(false)
  }
  const handleRescheduleCancel = () => {
    setIsRescheduled(false)
    setIsBooked(true)
  }

  const handleCancelBackButton = () => {
    setIsCancel(false)
    setIsRescheduled(false)
    setIsBooked(true)
  }
  const handleCancelClose = () => {
    setSchoolTourDialog(false)
    setIsBooked(false)
    setIsRescheduled(false)
    setIsCancel(false)
    setIsStart(false)
  }

  const handleStartTour = () => {
    optionForSubmition()
    setIsStart(true)
    setIsBooked(false)
    setIsRescheduled(false)
    setIsCancel(false)
  }

  const handleDateChange = (newDate: Dayjs | Date | null) => {
    //setSelectedDate(newDate)
    //setApiVisitDate(newDate)
    const date = dayjs(newDate).format('DD-MM-YYYY')
    slotVisitApi(date)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        {openDialog && !minimized && !schooltourSuccessDialog && (
          <Box
            sx={{
              position: 'fixed',
              bottom: '0',
              right: '0',
              width: '450px',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: 24,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1300,
              overflowY: 'auto',
              borderRadius: '10px'
            }}
            className='fixedModal'
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                zIndex: 1400,
                width: '100%',
                p: 2
              }}
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <div
                style={{
                  padding: '10px 20px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant='subtitle1' color={'text.primary'} sx={{ lineHeight: '24px' }}>
                    {isRescheduled
                      ? `Re-Scheduled ${isParentInteraction ? 'Parent Interaction' : 'School Tour'}`
                      : isCancel
                      ? `Cancel ${isParentInteraction ? 'Interaction' : 'Tour'}`
                      : isStart
                      ? `On-Going ${isParentInteraction ? 'Parent Interaction' : 'School Tour'}`
                      : isBooked
                      ? `View ${isParentInteraction ? 'Parent Interaction' : 'School Tour'}`
                      : title}
                  </Typography>
                </Box>
                <Box>
                  <IconButton disableFocusRipple disableRipple onClick={handleMinimize}>
                    <span className='icon-minus'></span>
                  </IconButton>
                  <IconButton onClick={() => handleCancelClose()}>
                    <span className='icon-trailing-icon'></span>
                  </IconButton>
                </Box>
              </div>
            </Box>
            <div style={{ padding: '20px' }}>
              <Box>
                {!isBooked && !isCancel && !isRescheduled && !isStart && (
                  <>
                    <form onSubmit={handleSubmit(handleBook)} noValidate>
                      <Box>
                        <Box sx={{ mb: 5 }}>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Controller
                              name='visitDate'
                              control={control}
                              rules={{ required: 'Visit Date is required' }}
                              render={({ field }) => (
                                <StaticDatePicker
                                  {...field}
                                  className='desktopDate'
                                  value={dayjs(convertDate(dayjs().toDate()))}
                                  // value={field.value || dayjs().toDate()} // Ensure the value is set
                                  minDate={dayjs(new Date())} // Restrict selection to current date and future dates
                                  onChange={newDate => {
                                    handleDateChange(newDate)
                                    field.onChange(newDate)
                                  }}
                                />
                              )}
                            />
                          </LocalizationProvider>

                          <FormControl>
                            {errors?.visitDate?.message && (
                              <span className={style.errorField}>{`${errors?.visitDate?.message}`}</span>
                            )}
                          </FormControl>
                        </Box>
                        {/* time slot  */}
                        <Controller
                          name='visitTime'
                          control={control}
                          rules={{ required: 'Visit time is required' }}
                          defaultValue={slotTiming[0]?._id || ''}
                          render={({ field }) => (
                            <Box
                              sx={{
                                mt: 7,
                                mb: 7,
                                display: 'flex',
                                justifyContent: 'flex-start',
                                alignItems: 'center',
                                flexWrap: 'wrap'
                              }}
                            >
                              {slotTiming.map(item => (
                                <Badge
                                  key={item._id}
                                  badgeContent={item.bookedCount ?? 0}
                                  overlap='rectangular'
                                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                  sx={{
                                    display: 'inline-flex',
                                    '& .MuiBadge-badge': {
                                      fontSize: '10px',
                                      minWidth: 18,
                                      height: 18,
                                      borderRadius: '50%',
                                      transform: 'translate(35%, -35%)'
                                    }
                                  }}
                                >
                                  <StyledChipProps
                                    sx={{ ml: 2, mb: 4, display: 'inline-flex' }}
                                    label={item.slot}
                                    onClick={() => {
                                      setVisitTime(item._id)
                                      field.onChange(item._id)
                                    }}
                                    color={visitTime === item._id ? 'primary' : 'default'}
                                    variant='outlined'
                                  />
                                </Badge>
                              ))}
                            </Box>
                          )}
                        />
                        <FormControl>
                          {!errors?.visitDate
                            ? errors?.visitTime?.message && (
                                <span className={style.errorField}>{`${errors?.visitTime?.message}`}</span>
                              )
                            : null}
                        </FormControl>

                        <Box
                          sx={{
                            mt: 7,
                            mb: 7
                          }}
                        >
                          <Controller
                            name='comment' // Specify the name for the form control
                            control={control}
                            defaultValue=''
                            rules={{ required: 'Comment  is required' }}
                            render={({ field, fieldState: { error } }) => (
                              <TextField
                                {...field}
                                fullWidth
                                label='Comment'
                                placeholder='Add Comment'
                                error={!!error}
                                helperText={error ? error.message : ''}
                                required
                              />
                            )}
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {!isBooked || isCancel ? (
                          <Button
                            sx={{ width: 'auto', mr: 2 }}
                            variant='outlined'
                            color='inherit'
                            onClick={
                              isRescheduled ? handleRescheduleCancel : isCancel ? handleCancelBackButton : handleClose
                            }
                            fullWidth
                          >
                            {isCancel ? 'Back' : 'Cancel'}
                          </Button>
                        ) : null}
                        {isBooked && !isCancel ? (
                          <Button
                            onClick={handleCancelTour}
                            sx={{ width: 'auto', mr: 2 }}
                            variant='outlined'
                            color='inherit'
                            fullWidth
                          >
                            {isParentInteraction ? 'Cancel Interaction' : 'Cancel Tour'}
                          </Button>
                        ) : null}
                        {isBooked && !isCancel && !isStart ? (
                          <Button
                            onClick={handleReschedule}
                            size='large'
                            variant='contained'
                            color='inherit'
                            sx={{ mr: 2, width: 'auto' }}
                          >
                            Reschedule
                          </Button>
                        ) : null}

                        <Button type='submit' sx={{ width: 'auto' }} variant='contained' color='secondary' fullWidth>
                          {isBooked && !isCancel
                            ? isParentInteraction ? 'Start Interaction' : 'Start Tour'
                            : isCancel
                            ? isParentInteraction ? 'Cancel Interaction' : 'Cancel Tour'
                            : isStart
                            ? 'Submit'
                            : isParentInteraction ? 'Book Interaction' : 'Book Tour'}
                        </Button>
                      </Box>
                    </form>
                  </>
                )}
                {isBooked && !isStart && !isCancel && !isRescheduled && (
                  <Box>
                    <Box sx={{ mb: 5 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Controller
                          name='visitDate'
                          control={control}
                          render={({ field }) => (
                            <StaticDatePicker
                              {...field}
                              className='desktopDate'
                              value={dayjs(convertDate(apiVisitDate))} //your state value
                              minDate={dayjs(new Date())}
                            />
                          )}
                        />
                      </LocalizationProvider>
                    </Box>

                    <Box sx={{ mt: 7, mb: 7 }}>
                      <Typography variant='caption' color={'customColors.text3'} sx={{ lineHeight: '14px' }}>
                        {isParentInteraction ? 'Interaction Date' : 'Visit Date'}
                      </Typography>
                      <Typography
                        variant='subtitle1'
                        color={'customColors.text3'}
                        sx={{ lineHeight: '24px', letterSpacing: '0.5px' }}
                      >
                        {formatDateShort(apiVisitDate)}
                      </Typography>
                    </Box>

                    <Box sx={{ mt: 7, mb: 7 }}>
                      <Typography variant='caption' color={'customColors.text3'} sx={{ lineHeight: '14px' }}>
                        {isParentInteraction ? 'Interaction Time' : 'Visit Time'}
                      </Typography>
                      <Typography
                        variant='subtitle1'
                        color={'customColors.text3'}
                        sx={{ lineHeight: '24px', letterSpacing: '0.5px' }}
                      >
                        {apiVisitTime}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        mt: 7,
                        mb: 7
                      }}
                    >
                      <TextField
                        fullWidth
                        label='Comment'
                        value={apiComment} // Set value from the API
                        placeholder='Add Comment'
                        disabled // Disable editing
                      />
                    </Box>

                    {/* Buttons Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                      {/* Conditional rendering of Cancel Tour button */}
                      {isBooked && !isCancel && (
                        <Button
                          onClick={handleCancelTour}
                          sx={{ width: 'auto' }}
                          variant='outlined'
                          color='inherit'
                          fullWidth
                        >
                          {isParentInteraction ? 'Cancel Interaction' : 'Cancel Tour'}
                        </Button>
                      )}

                      {/* Conditional rendering of Reschedule button */}
                      {isBooked && !isCancel && !isStart && (
                        <Button
                          onClick={handleReschedule}
                          size='large'
                          variant='contained'
                          color='inherit'
                          sx={{ width: 'auto' }}
                        >
                          Reschedule
                        </Button>
                      )}

                      {/* Conditional rendering of Start Tour button */}
                      {isBooked && !isCancel && !isStart && (
                        <Button
                          onClick={handleStartTour}
                          size='large'
                          variant='contained'
                          color='secondary'
                          sx={{ width: 'auto' }}
                        >
                          {isParentInteraction ? 'Start Interaction' : 'Start Tour'}
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}

                {isCancel && !isStart && !isBooked && !isRescheduled && (
                  <Box>
                    <Box sx={{ mb: 7 }}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          sx={{ width: '100%' }}
                          slots={{
                            openPickerIcon: CalendarIcon
                          }}
                          defaultValue={dayjs(convertDate(apiVisitDate))}
                          format='DD/MM/YYYY'
                          label={isParentInteraction ? 'Interaction Date' : 'Visit Date'}
                          disabled
                        />
                      </LocalizationProvider>
                    </Box>
                    <Box sx={{ mb: 7 }}>
                      <TextField
                        fullWidth
                        label={isParentInteraction ? 'Interaction Time' : 'Visit Time'}
                        value={apiVisitTime}
                        placeholder='Visit Time'
                        //  onChange={e => setVisitTime(e.target.value)}
                        //  defaultValue={}
                        disabled
                      />
                    </Box>

                    <Box sx={{ mb: 7 }}>
                      <TextField
                        fullWidth
                        label='Last Remark'
                        value={apiComment}
                        placeholder='Last Remark'
                        //onChange={e => setReMark(e.target.value)}
                        //defaultValue={}
                        disabled
                      />
                    </Box>
                    <Box sx={{ mb: 7 }}>
                      <FormControl fullWidth>
                        <InputLabel id='demo-simple-select-outlined-label'>Reason For Cancellation</InputLabel>
                        <Select
                          IconComponent={DownArrow}
                          label='Reason For Cancellation'
                          defaultValue={reason}
                          id='demo-simple-select-outlined'
                          labelId='demo-simple-select-outlined-label'
                          onChange={handleReason}
                        >
                          <MenuItem value=''>Select Reason</MenuItem>
                          <MenuItem value='Personal Reason'>Personal Reason</MenuItem>
                          <MenuItem value='Travelling'>Travelling</MenuItem>
                          <MenuItem value='Not Required Anymore'>Not Required Anymore</MenuItem>
                          <MenuItem value='Took Admission Somewhere Else'>Took Admission Somewhere Else</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ mb: 7 }}>
                      <TextField
                        fullWidth
                        label='Comment'
                        value={reComment}
                        placeholder='Add Comment'
                        onChange={e => setReComment(e.target.value)}
                        // defaultValue={reComment}
                      />
                    </Box>

                    {/* Back and Cancel Tour Buttons */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button
                        onClick={handleCancelBackButton}
                        sx={{ width: 'auto' }}
                        variant='outlined'
                        color='inherit'
                        fullWidth
                      >
                        Back
                      </Button>

                      <Button
                        onClick={CancelTourApi}
                        sx={{ width: 'auto' }}
                        variant='contained'
                        color='secondary'
                        fullWidth
                      >
                        {isParentInteraction ? 'Cancel Interaction' : 'Cancel Tour'}
                      </Button>
                    </Box>
                  </Box>
                )}

                {isRescheduled && !isStart && !isCancel && !isBooked && (
                  <Box>
                    <Box sx={{ mt: 2, mb: 5 }}>
                      <Box sx={{ mb: 7 }}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            sx={{ width: '100%' }}
                            slots={{
                              openPickerIcon: CalendarIcon
                            }}
                            value={dayjs(apiVisitDate)}
                            format='DD/MM/YYYY'
                            label={isParentInteraction ? 'Interaction Date' : 'Visit Date'}
                            disabled
                          />
                        </LocalizationProvider>
                      </Box>
                      <Box sx={{ mb: 7 }}>
                        <TextField
                          fullWidth
                          label={isParentInteraction ? 'Interaction Time' : 'Visit Time'}
                          value={apiVisitTime}
                          placeholder='Time'
                          disabled
                        />
                      </Box>

                      <Box sx={{ mb: 7 }}>
                        <TextField fullWidth label='Comment' value={apiComment} placeholder='Add Comment' disabled />
                      </Box>
                      <Box>
                        <Divider />
                      </Box>
                    </Box>

                    {/* Reschedule Form */}
                    <form onSubmit={handleSubmit(RescheduleApi)} noValidate>
                      <Box sx={{ mt: 2, mb: 7 }}>
                        <Box sx={{ mt: 3, mb: 5 }}>
                          <Typography variant='subtitle1' color={'text.primary'} sx={{ lineHeight: '24px' }}>
                            Change Date
                          </Typography>
                        </Box>
                        <Box>
                          <Box sx={{ mb: 5 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                              <Controller
                                name='visitDate'
                                control={control}
                                rules={{ required: 'Date is required' }}
                                render={({ field }) => (
                                  <StaticDatePicker
                                    {...field}
                                    className='desktopDate'
                                    value={selectedDate}
                                    defaultValue={dayjs()}
                                    minDate={dayjs()}
                                    onChange={newDate => {
                                      handleDateChange(newDate)
                                      field.onChange(newDate)
                                    }}
                                  />
                                )}
                              />
                            </LocalizationProvider>

                            <FormControl>
                              {errors?.visitDate?.message && (
                                <span className={style.errorField}>{`${errors?.visitDate?.message}`}</span>
                              )}
                            </FormControl>
                          </Box>
                        </Box>
                      </Box>

                      {/* time slot  */}
                      <Controller
                        name='visitTime'
                        control={control}
                        rules={{ required: 'Time is required' }}
                        defaultValue={''}
                        render={({ field }) => (
                          <Box
                            sx={{
                              mt: 7,
                              mb: 7,
                              display: 'flex',
                              justifyContent: 'flex-start',
                              alignItems: 'center',
                              flexWrap: 'wrap'
                            }}
                          >
                            {slotTiming.map(item => (
                              <Badge
                                key={item._id}
                                badgeContent={item.bookedCount ?? 0}
                                overlap='rectangular'
                                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                                sx={{
                                  display: 'inline-flex',
                                  '& .MuiBadge-badge': {
                                    fontSize: '10px',
                                    minWidth: 18,
                                    height: 18,
                                    borderRadius: '50%',
                                    transform: 'translate(35%, -35%)'
                                  }
                                }}
                              >
                                <StyledChipProps
                                  sx={{ ml: 2, mb: 4, display: 'inline-flex' }}
                                  label={item.slot}
                                  onClick={() => {
                                    setVisitTime(item._id)
                                    field.onChange(item._id)
                                  }}
                                  color={visitTime === item._id ? 'primary' : 'default'}
                                  variant='filled'
                                />
                              </Badge>
                            ))}
                          </Box>
                        )}
                      />
                      <FormControl>
                        {!errors?.visitDate
                          ? errors?.visitTime?.message && (
                              <span className={style.errorField}>{`${errors?.visitTime?.message}`}</span>
                            )
                          : null}
                      </FormControl>

                      <Box
                        sx={{
                          mt: 7,
                          mb: 7
                        }}
                      >
                        <Controller
                          name='comment'
                          control={control}
                          defaultValue=''
                          rules={{ required: 'Comment is required' }}
                          render={({ field, fieldState: { error } }) => (
                            <TextField
                              {...field}
                              fullWidth
                              label='Comment'
                              placeholder='Add Comment'
                              error={!!error}
                              helperText={error ? error.message : ''}
                              required
                            />
                          )}
                        />
                      </Box>

                      {/* Cancel and Book Buttons */}
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button
                          onClick={handleCancel}
                          sx={{ width: 'auto' }}
                          variant='outlined'
                          color='inherit'
                          fullWidth
                        >
                          Cancel
                        </Button>

                        <Button type='submit' sx={{ width: 'auto' }} variant='contained' color='secondary' fullWidth>
                          {isParentInteraction ? 'Book Interaction' : 'Book Tour'}
                        </Button>
                      </Box>
                    </form>
                  </Box>
                )}

                {isStart && !isRescheduled && !isCancel && !isBooked && (
                  <Box>
                    <Box sx={{ mt: 2, mb: 5 }}>
                      <Box sx={{ mb: 7 }}>
                        <FormGroup>
                          {options.map((option: any) => (
                            <FormControlLabel
                              key={option.id}
                              control={
                                <Checkbox
                                  value={option.attributes.name}
                                  onChange={handleCheckboxChange}
                                  checked={activities.includes(option.attributes?.name)}
                                />
                              }
                              label={option?.attributes.name}
                            />
                          ))}
                        </FormGroup>
                      </Box>
                      <Box sx={{ mb: 7 }}>
                        <TextField
                          fullWidth
                          label='Comment'
                          value={reComment}
                          placeholder='Add Comment'
                          onChange={e => setReComment(e.target.value)}
                          defaultValue={reComment}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                      <Button
                        onClick={handleCancel}
                        sx={{ width: 'auto' }}
                        variant='outlined'
                        color='inherit'
                        fullWidth
                      >
                        Cancel
                      </Button>

                      <Button
                        onClick={SubmitApi}
                        sx={{ width: 'auto' }}
                        variant='contained'
                        color='secondary'
                        fullWidth
                      >
                        Submit
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            </div>
          </Box>
        )}
        {minimized && (
          <Box
            style={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: '300px',
              height: '50px',
              backgroundColor: '#fff',
              boxShadow: '0px -2px 5px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              zIndex: 1300,
              cursor: 'pointer'
            }}
            onClick={() => setMinimized(false)}
          >
            <Typography variant='subtitle1' color={'text.primary'} sx={{ lineHeight: '21px' }}>
              {isRescheduled
                ? (isParentInteraction ? 'ReScheduled Interaction' : 'ReScheduled Tour')
                : isCancel
                ? (isParentInteraction ? 'Cancel Interaction' : 'Cancel Tour')
                : isStart
                ? (isParentInteraction ? 'On-Going Interaction' : 'On-Going Tour')
                : title}
            </Typography>
            <IconButton onClick={() => setMinimized(false)}>
              <span className='icon-add'></span>
            </IconButton>

            <IconButton onClick={() => handleCancelClose()}>
              <span className='icon-trailing-icon'></span>
            </IconButton>
          </Box>
        )}

        {schooltourSuccessDialog && (
          <SuccessDialog
            openDialog={schooltourSuccessDialog}
            title={`${isParentInteraction ? 'Parent Interaction' : 'School Tour'} Has been ${
              isRescheduled ? 'Re-Scheduled' : isCancel ? 'Cancelled' : 'Registered'
            } Successfully`}
            handleClose={handleSchoolTourSuccessClose}
          />
        )}
      </div>
    </LocalizationProvider>
  )
}

export default SchoolTourDialog
