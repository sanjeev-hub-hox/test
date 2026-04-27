import { Fragment, useEffect, useState, useCallback } from 'react'
import Dialog from '@mui/material/Dialog'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import DialogContent from '@mui/material/DialogContent'
import {
  Button,
  DialogActions,
  DialogTitle,
  Grid,
  IconButton,
  Typography,
  Autocomplete,
  TextField,
  Chip,
  Box,
  CircularProgress
} from '@mui/material'
import HighlightOffIcon from '@mui/icons-material/HighlightOff'
import DownArrow from 'src/@core/CustomComponent/DownArrow/DownArrow'
import { getRequest, postRequest, patchRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'
import ErrorDialogBox from 'src/@core/CustomComponent/ErrorDialogBox/ErrorDialogBox'

const getDestinationKeyFromTarget = (target: string) => {
  switch (target) {
    case 'schools':
      return 'school_location'
    case 'grades':
      return 'grade'
    case 'brands':
      return 'brand'
    case 'boards':
      return 'board'
    case 'courses':
      return 'course'
    case 'streams':
      return 'stream'
    case 'shifts':
      return 'shift'
    default:
      return ''
  }
}

type customModal = {
  openModal: boolean
  closeModal?: () => void
  header?: string
  handleReassignClose?: any
  transferColumns?: any
  enquiryId?: any
  enquiryIds?: any
  mode?: any
  refresh?: any
  setRefresh?: any
  year?: any
  admissionListing?: any
}

const CommonAutocomplete = ({
  label,
  value,
  onChange,
  options = [],
  loading,
  getOptionLabel,
  error,
  disabled
}: any) => {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={getOptionLabel || (option => option?.name || '')}
      value={options.find((option: any) => option.id === value?.id) || value || null}
      onChange={(_, newValue) => onChange(newValue)}
      loading={loading}
      disabled={disabled}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {option.name}
        </li>
      )}
      renderInput={params => (
        <TextField
          {...params}
          label={label}
          variant='outlined'
          error={error}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color='inherit' size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
          required={!disabled}
        />
      )}
      popupIcon={<DownArrow />}
    />
  )
}

function TransferEnquiriesDialog({
  openModal,
  closeModal,
  enquiryId,
  enquiryIds,
  setRefresh,
  refresh,
  admissionListing
}: customModal) {
  // ** Hooks
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('lg'))
  const { setGlobalState } = useGlobalContext()
  const [transferSuccessDialog, setTransferSuccessDialog] = useState<boolean>(false)

  // ** Data States
  const [leadDetails, setLeadDetails] = useState<any>(null)
  const [fullEnquiryDetails, setFullEnquiryDetails] = useState<any>(null)
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false)
  const [schoolLoading, setSchoolLoading] = useState<boolean>(false)

  const [destinationData, setDestinationData] = useState<any>({
    academic_year: null,
    school_location: null,
    grade: null,
    brand: null,
    board: null,
    course: null,
    stream: null,
    shift: null
  })

  const [options, setOptions] = useState<any>({
    academicYears: [],
    schools: [],
    brands: [],
    boards: [],
    grades: [],
    shifts: [],
    courses: [],
    streams: []
  })

  const [isSameSchool, setIsSameSchool] = useState<boolean>(false)
  const [hostSchoolsList, setHostSchoolsList] = useState<any[]>([])
  const [selectedHostSchool, setSelectedHostSchool] = useState<any>(null)
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)

  useEffect(() => {
    if (leadDetails?.school_id && destinationData.school_location?.id) {
      if (leadDetails.school_id === destinationData.school_location.id) {
        setErrorMessage('Same school transfer is not allowed.')
        setErrorDialog(true)
        setIsSameSchool(true)
        setDestinationData((prev: any) => ({
          ...prev,
          school_location: null,
          grade: null,
          brand: null,
          board: null,
          course: null,
          stream: null,
          shift: null
        }))
      } else {
        setIsSameSchool(false)
      }
    } else {
      setIsSameSchool(false)
    }
  }, [leadDetails, destinationData.school_location])

  const [isTransferable, setIsTransferable] = useState<boolean>(true)
  const [errorDialog, setErrorDialog] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleApiError = (errorObj: any) => {
    const getMsg = (obj: any): string | null => {
      if (!obj) return null
      if (typeof obj === 'string') return obj
      return (
        obj.errorMessage ||
        obj.error_message ||
        obj?.error?.errorMessage ||
        obj?.error?.error_message ||
        obj.message ||
        obj?.error?.message ||
        null
      )
    }

    const msg =
      getMsg(errorObj?.response?.data) ||
      getMsg(errorObj?.data) ||
      getMsg(errorObj?.error) ||
      getMsg(errorObj) ||
      'Transfer Failed'

    setErrorMessage(msg)
    setErrorDialog(true)
  }

  const getLeadDetails = useCallback(async () => {
    const idToUse = enquiryId || (enquiryIds && enquiryIds.length > 0 ? enquiryIds[0] : null)
    if (!idToUse) {
      setLoadingDetails(false)
      return
    }

    setLoadingDetails(true)
    setLeadDetails(null)
    setFullEnquiryDetails(null)

    if (admissionListing) {
      setErrorMessage('Lead is in Admitted/Payment stage. Transfer is not allowed.')
      setIsTransferable(false)
      setErrorDialog(true)
      setLoadingDetails(false)
      return
    }

    setIsTransferable(true)
    try {
      const response = await getRequest({
        url: `/marketing/enquiry/finance/enquiry-details?enquiryId=${idToUse}`,
        serviceURL: 'marketing'
      })
      if (response?.data) {
        setLeadDetails(response.data)

        try {
          const stageResponse = await getRequest({
            url: `/marketing/enquiry/${idToUse}`,
            serviceURL: 'marketing'
          })

          if (stageResponse?.data) {
            setFullEnquiryDetails(stageResponse.data)
          }

          if (stageResponse?.data?.enquiry_stages && Array.isArray(stageResponse.data.enquiry_stages)) {
            const isBlocked = stageResponse.data.enquiry_stages.some((stage: any) => {
              const nameRes = stage?.stage_name || ''
              const statusRes = stage?.status || ''

              const isPaymentStage = nameRes === 'Payment' || nameRes.toLowerCase().includes('payment')
              const isAdmittedStage =
                nameRes.toLowerCase().includes('admitted') ||
                nameRes === 'Final Admission' ||
                nameRes === 'Admission Status'

              if (isPaymentStage) {
                return statusRes === 'Completed'
              }

              if (isAdmittedStage) {
                return statusRes === 'In Progress' || statusRes === 'Completed'
              }

              return false
            })

            if (isBlocked) {
              setErrorMessage('Lead is in Admitted/Payment stage. Transfer is not allowed.')
              setErrorDialog(true)
              setIsTransferable(false)
            }
          }
        } catch (stageError) {}
      }
    } catch (error) {
    } finally {
      setLoadingDetails(false)
    }
  }, [enquiryId, enquiryIds, admissionListing, setGlobalState])

  const fetchAcademicYears = useCallback(async () => {
    try {
      const params = {
        url: '/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc',
        serviceURL: 'mdm'
      }
      const response = await getRequest(params)
      if (response?.data) {
        const formattedData = response.data.map((item: any) => ({
          id: item.id,
          name: item.attributes.name,
          short_name_two_digit: item.attributes?.short_name_two_digit,
          is_current: item.attributes?.is_current
        }))
        setOptions((prev: any) => ({ ...prev, academicYears: formattedData }))

        // try {
        //   const currentYearResponse = await postRequest({
        //     url: `/marketing/enquiry/academic-year-by-school-brand`,
        //     serviceURL: 'marketing',
        //     data: {
        //       school_id: leadDetails?.school_id,
        //       brand_id: leadDetails?.brand_id,
        //       course_id: leadDetails?.course_id,
        //       board_id: leadDetails?.board_id
        //     }
        //   })

        //   if (
        //     currentYearResponse?.status === 200 &&
        //     currentYearResponse?.data?.academic_year_start_date &&
        //     currentYearResponse?.data?.academic_year_end_date &&
        //     leadDetails?.academic_year
        //   ) {
        //     const studentAYText = leadDetails.academic_year.trim()
        //     const yearMatch = studentAYText.match(/(\d{4})\s*-\s*(\d{2,4})/)

        //     if (yearMatch) {
        //       const startYear = parseInt(yearMatch[1], 10)
        //       let endYear = parseInt(yearMatch[2], 10)

        //       if (endYear < 100) {
        //         endYear = Math.floor(startYear / 100) * 100 + endYear
        //       }

        //       const apiStartDate = new Date(currentYearResponse.data.academic_year_start_date)
        //       const apiEndDate = new Date(currentYearResponse.data.academic_year_end_date)
        //       const apiStartYear = apiStartDate.getFullYear()
        //       const apiEndYear = apiEndDate.getFullYear()

        //       if (startYear !== apiStartYear || endYear !== apiEndYear) {
        //         setErrorMessage(
        //           `Student academic year ${studentAYText} does not match the current academic year period (${apiStartYear}-${apiEndYear}). Lead cannot be transferred.`
        //         )
        //         setErrorDialog(true)
        //         setIsTransferable(false)
        //       } else {
        //         setIsTransferable(true)
        //       }
        //     } else {
        //       setIsTransferable(true)
        //     }
        //   } else {
        //     setIsTransferable(true)
        //   }
        // } catch (error) {
        //   setIsTransferable(true)
        // }

        if (leadDetails?.academic_year_id || leadDetails?.academic_year) {
          const found = formattedData.find(
            (ay: any) =>
              ay.id == leadDetails.academic_year_id ||
              ay.name == leadDetails.academic_year ||
              ay.name == leadDetails.academic_year?.trim()
          )
          if (found) {
            setDestinationData((prev: any) => ({
              ...prev,
              academic_year: found
            }))
          }
        }
        setSchoolLoading(false)
      }
    } catch (e) {
      setSchoolLoading(false)
    }
  }, [leadDetails])

  useEffect(() => {
    if (openModal && (enquiryId || (enquiryIds && enquiryIds.length > 0))) {
      getLeadDetails()
    } else if (!openModal) {
      setIsTransferable(true)
      setIsSubmitted(false)
      setLeadDetails(null)
      setFullEnquiryDetails(null)
    }
  }, [openModal, enquiryId, enquiryIds, getLeadDetails])

  useEffect(() => {
    if (leadDetails) {
      fetchAcademicYears()
    }
  }, [leadDetails, fetchAcademicYears])

  const fetchGenericOptions = useCallback(async (operator: string, targetKey: string, keyMappings: any) => {
    try {
      const response = await postRequest({
        url: '/api/ac-schools/search-school',
        serviceURL: 'mdm',
        data: { operator }
      })
      if (response?.success && response?.data?.schools) {
        const uniqueItems = response.data.schools.reduce((acc: any[], item: any) => {
          if (!acc.some((existing: any) => existing.id === item[keyMappings.id])) {
            acc.push({
              id: item[keyMappings.id],
              name: item[keyMappings.name],
              value: item[keyMappings.id]
            })
          }
          return acc
        }, [])

        if (keyMappings.id === 'grade_id') {
          uniqueItems.sort((a: any, b: any) => a.id - b.id)
        }

        setOptions((prev: any) => ({ ...prev, [targetKey]: uniqueItems }))

        if (uniqueItems.length === 1) {
          setDestinationData((prev: any) => ({
            ...prev,
            [getDestinationKeyFromTarget(targetKey)]: uniqueItems[0]
          }))
        }
      } else {
        setOptions((prev: any) => ({ ...prev, [targetKey]: [] }))
      }
    } catch (e) {}
  }, [])

  useEffect(() => {
    if (destinationData.academic_year?.short_name_two_digit) {
      fetchGenericOptions(`academic_year_id = ${destinationData.academic_year.short_name_two_digit}`, 'schools', {
        id: 'school_id',
        name: 'name'
      }).finally(() => {
        setSchoolLoading(false)
      })
    } else {
      setOptions((prev: any) => ({ ...prev, schools: [] }))
    }
  }, [destinationData.academic_year, fetchGenericOptions])

  useEffect(() => {
    if (destinationData.academic_year?.short_name_two_digit && destinationData.school_location?.id) {
      fetchGenericOptions(
        `academic_year_id = ${destinationData.academic_year.short_name_two_digit} and school_id = ${destinationData.school_location.id}`,
        'grades',
        { id: 'grade_id', name: 'grade_name' }
      )
    } else {
      setOptions((prev: any) => ({ ...prev, grades: [] }))
    }
  }, [destinationData.academic_year, destinationData.school_location, fetchGenericOptions])

  useEffect(() => {
    if (
      destinationData.academic_year?.short_name_two_digit &&
      destinationData.school_location?.id &&
      destinationData.grade?.id
    ) {
      fetchGenericOptions(
        `academic_year_id = ${destinationData.academic_year.short_name_two_digit} and school_id = ${destinationData.school_location.id} and grade_id = ${destinationData.grade.id}`,
        'brands',
        { id: 'brand_id', name: 'brand_name' }
      )
    } else {
      setOptions((prev: any) => ({ ...prev, brands: [] }))
    }
  }, [destinationData.academic_year, destinationData.school_location, destinationData.grade, fetchGenericOptions])

  useEffect(() => {
    if (
      destinationData.academic_year?.short_name_two_digit &&
      destinationData.school_location?.id &&
      destinationData.brand?.id &&
      destinationData.grade?.id
    ) {
      fetchGenericOptions(
        `academic_year_id = ${destinationData.academic_year.short_name_two_digit} and school_id = ${destinationData.school_location.id} and brand_id = ${destinationData.brand.id} and grade_id = ${destinationData.grade.id}`,
        'boards',
        { id: 'board_id', name: 'board_name' }
      )
    } else {
      setOptions((prev: any) => ({ ...prev, boards: [] }))
    }
  }, [
    destinationData.academic_year,
    destinationData.school_location,
    destinationData.brand,
    destinationData.grade,
    fetchGenericOptions
  ])

  useEffect(() => {
    if (
      destinationData.academic_year?.short_name_two_digit &&
      destinationData.school_location?.id &&
      destinationData.brand?.id &&
      destinationData.board?.id &&
      destinationData.grade?.id
    ) {
      fetchGenericOptions(
        `academic_year_id = ${destinationData.academic_year.short_name_two_digit} and school_id = ${destinationData.school_location.id} and brand_id = ${destinationData.brand.id} and board_id = ${destinationData.board.id} and grade_id = ${destinationData.grade.id}`,
        'courses',
        { id: 'course_id', name: 'course_name' }
      )
    } else {
      setOptions((prev: any) => ({ ...prev, courses: [] }))
    }
  }, [
    destinationData.academic_year,
    destinationData.school_location,
    destinationData.brand,
    destinationData.board,
    destinationData.grade,
    fetchGenericOptions
  ])

  useEffect(() => {
    if (
      destinationData.academic_year?.short_name_two_digit &&
      destinationData.school_location?.id &&
      destinationData.brand?.id &&
      destinationData.board?.id &&
      destinationData.course?.id &&
      destinationData.grade?.id
    ) {
      fetchGenericOptions(
        `academic_year_id = ${destinationData.academic_year.short_name_two_digit} and school_id = ${destinationData.school_location.id} and brand_id = ${destinationData.brand.id} and board_id = ${destinationData.board.id} and course_id = ${destinationData.course.id} and grade_id = ${destinationData.grade.id}`,
        'streams',
        { id: 'stream_id', name: 'stream_name' }
      )
    } else {
      setOptions((prev: any) => ({ ...prev, streams: [] }))
    }
  }, [
    destinationData.academic_year,
    destinationData.school_location,
    destinationData.brand,
    destinationData.board,
    destinationData.course,
    destinationData.grade,
    fetchGenericOptions
  ])

  useEffect(() => {
    if (
      destinationData.academic_year?.short_name_two_digit &&
      destinationData.school_location?.id &&
      destinationData.brand?.id &&
      destinationData.board?.id &&
      destinationData.course?.id &&
      destinationData.stream?.id &&
      destinationData.grade?.id
    ) {
      fetchGenericOptions(
        `academic_year_id = ${destinationData.academic_year.short_name_two_digit} and school_id = ${destinationData.school_location.id} and brand_id = ${destinationData.brand.id} and board_id = ${destinationData.board.id} and course_id = ${destinationData.course.id} and stream_id = ${destinationData.stream.id} and grade_id = ${destinationData.grade.id}`,
        'shifts',
        { id: 'shift_id', name: 'shift_name' }
      )
    } else {
      setOptions((prev: any) => ({ ...prev, shifts: [] }))
    }
  }, [
    destinationData.academic_year,
    destinationData.school_location,
    destinationData.brand,
    destinationData.board,
    destinationData.course,
    destinationData.stream,
    destinationData.grade,
    fetchGenericOptions
  ])

  useEffect(() => {
    const fetchGuestSchool = async () => {
      try {
        const payload = {
          academic_year_id: Number(destinationData.academic_year?.short_name_two_digit),
          school_id: destinationData.school_location?.id,
          grade_id: destinationData.grade?.id,
          brand_id: destinationData.brand?.id,
          course_id: destinationData.course?.id,
          board_id: destinationData.board?.id,
          stream_id: destinationData.stream?.id
        }

        const response = await postRequest({
          url: `/studentProfile/get-guest-school-list`,
          serviceURL: 'admin',
          data: payload
        })

        let guestData: any[] = []
        if (Array.isArray(response?.data)) {
          guestData = response.data
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          guestData = response.data.data
        }

        if (guestData.length > 0) {
          const formattedHostSchools = guestData.map((item: any) => ({
            ...item,
            id: item.host_school_id,
            name: item.host_school_name
          }))

          const uniqueHostSchools = formattedHostSchools.filter(
            (v: any, i: number, a: any[]) => a.findIndex((v2: any) => v2.id === v.id) === i
          )

          setHostSchoolsList(uniqueHostSchools)

          if (uniqueHostSchools.length === 1) {
            const current = uniqueHostSchools[0]
            setSelectedHostSchool(current)

            if (current?.shift_id && options.shifts?.length > 0) {
              const matchedShift = options.shifts.find((s: any) => s.id == current.shift_id)
              if (matchedShift) {
                setDestinationData((prev: any) => ({
                  ...prev,
                  shift: matchedShift
                }))
              }
            }
          } else {
            setSelectedHostSchool(null)
          }
        } else {
          setHostSchoolsList([])
          setSelectedHostSchool(null)
        }
      } catch (e) {}
    }

    if (
      destinationData.academic_year?.id &&
      destinationData.school_location?.id &&
      destinationData.grade?.id &&
      destinationData.brand?.id &&
      destinationData.course?.id &&
      destinationData.board?.id &&
      destinationData.stream?.id &&
      options.shifts?.length > 0
    ) {
      fetchGuestSchool()
    } else {
      setHostSchoolsList([])
      setSelectedHostSchool(null)
    }
  }, [
    destinationData.academic_year,
    destinationData.school_location,
    destinationData.grade,
    destinationData.brand,
    destinationData.course,
    destinationData.board,
    destinationData.stream,
    options.shifts
  ])

  const handleTransfer = async () => {
    if (!isTransferable) return

    setIsSubmitted(true)

    if (
      !destinationData.school_location ||
      !destinationData.grade ||
      !destinationData.brand ||
      !destinationData.board ||
      !destinationData.course ||
      (options.streams?.length > 0 && !destinationData.stream) ||
      (options.shifts?.length > 0 && !destinationData.shift) ||
      (hostSchoolsList.length > 0 && !selectedHostSchool)
    ) {
      return
    }

    setGlobalState({ isLoading: true })
    try {
      const params = {
        url: `marketing/enquiry/transfer`,
        data: {
          enquiryIds: enquiryIds || [enquiryId],
          school_location: {
            id: destinationData.school_location?.id,
            value: destinationData.school_location?.name
          },
          enquiry_number: leadDetails?.enquiry_number,
          brand: {
            id: destinationData.brand?.id,
            value: destinationData.brand?.name
          },
          board: {
            id: destinationData.board?.id,
            value: destinationData.board?.name
          },
          grade: {
            id: destinationData.grade?.id,
            value: destinationData.grade?.name
          },
          course: {
            id: destinationData.course?.id,
            value: destinationData.course?.name
          },
          shift: {
            id: destinationData.shift?.id,
            value: destinationData.shift?.name
          },
          academicYearId: {
            id: destinationData.academic_year?.id,
            value: destinationData.academic_year?.name
          },
          stream: {
            id: destinationData.stream?.id,
            value: destinationData.stream?.name
          },
          ...(selectedHostSchool && {
            guestHostSchool: {
              id: selectedHostSchool.id,
              value: selectedHostSchool.name
            }
          })
        }
      }
      const response = await patchRequest(params)
      const resData = response?.data || response
      const nestedError = response?.error

      const status =
        resData?.status || resData?.errorCode || nestedError?.status || nestedError?.errorCode || response?.status

      if (status === 200 || response?.success || resData?.success) {
        setTransferSuccessDialog(true)
        if (setRefresh) {
          setRefresh(!refresh)
        }
      } else {
        handleApiError(response)
      }
    } catch (error: any) {
      handleApiError(error)
    } finally {
      setGlobalState({ isLoading: false })
    }
  }

  const handleTransferSuccessClose = () => {
    setTransferSuccessDialog(false)
    if (closeModal) closeModal()
  }

  return (
    <>
      <Dialog
        fullScreen={fullScreen}
        open={openModal && isTransferable}
        onClose={closeModal}
        maxWidth={'lg'}
        fullWidth
        aria-labelledby='responsive-dialog-title'
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <DialogTitle id='responsive-dialog-title'>Lead Transfer</DialogTitle>
          <IconButton disableFocusRipple disableRipple onClick={closeModal}>
            <HighlightOffIcon style={{ color: '#666666' }} />
          </IconButton>
        </Box>

        <DialogContent dividers>
          {loadingDetails || schoolLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '20vh' }}>
              <CircularProgress />
            </Box>
          ) : leadDetails ? (
            <Box sx={{ width: '100%' }}>
              <Box sx={{ mb: 4 }}>
                <TextField
                  sx={{ width: '40%' }}
                  disabled
                  label='Student Name'
                  value={`${leadDetails.student_name || ''} - ${leadDetails.enquiry_number || ''}`}
                  InputLabelProps={{ shrink: true }}
                  size='small'
                />
              </Box>

              <Box sx={{ mb: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                  Current School Selection
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label={`Academic Year: ${leadDetails.academic_year || 'NA'}`} variant='outlined' />
                  <Chip label={`School Location: ${leadDetails.school || 'NA'}`} variant='outlined' />
                  <Chip label={`Grade: ${leadDetails.grade || 'NA'}`} variant='outlined' />
                  {fullEnquiryDetails?.guest_student_details?.location?.value ? (
                    <Chip
                      label={`Guest School: ${fullEnquiryDetails?.guest_student_details?.location?.value}`}
                      variant='outlined'
                    />
                  ) : null}
                  <Chip label={`Brand: ${leadDetails.brand || 'NA'}`} variant='outlined' />
                  <Chip label={`Board: ${leadDetails.board || 'NA'}`} variant='outlined' />
                  <Chip label={`Course: ${leadDetails.course || 'NA'}`} variant='outlined' />
                  <Chip label={`Stream: ${leadDetails.stream || 'NA'}`} variant='outlined' />
                  <Chip label={`Shift: ${leadDetails.shift || 'NA'}`} variant='outlined' />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 2, fontWeight: 600 }}>
                  Destination School Selection
                </Typography>
                <Grid container spacing={6}>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={options.academicYears}
                      getOptionLabel={(option: any) => option.name || ''}
                      value={destinationData.academic_year}
                      disabled
                      renderInput={params => <TextField {...params} label='AY' variant='outlined' />}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='School Location'
                      options={options.schools}
                      value={destinationData.school_location}
                      error={isSubmitted && !destinationData.school_location}
                      helperText={isSubmitted && !destinationData.school_location ? 'Required' : ''}
                      onChange={(val: any) =>
                        setDestinationData({
                          ...destinationData,
                          school_location: val,
                          grade: null,
                          brand: null,
                          board: null,
                          course: null,
                          stream: null,
                          shift: null
                        })
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='Grade'
                      options={options.grades}
                      value={destinationData.grade}
                      error={isSubmitted && !destinationData.grade}
                      helperText={isSubmitted && !destinationData.grade ? 'Required' : ''}
                      onChange={(val: any) =>
                        setDestinationData({
                          ...destinationData,
                          grade: val,
                          brand: null,
                          board: null,
                          course: null,
                          stream: null,
                          shift: null
                        })
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='Brand'
                      options={options.brands}
                      value={destinationData.brand}
                      error={isSubmitted && !destinationData.brand}
                      helperText={isSubmitted && !destinationData.brand ? 'Required' : ''}
                      onChange={(val: any) =>
                        setDestinationData({
                          ...destinationData,
                          brand: val,
                          board: null,
                          course: null,
                          stream: null,
                          shift: null
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='Board'
                      options={options.boards}
                      value={destinationData.board}
                      error={isSubmitted && !destinationData.board}
                      helperText={isSubmitted && !destinationData.board ? 'Required' : ''}
                      onChange={(val: any) =>
                        setDestinationData({ ...destinationData, board: val, course: null, stream: null, shift: null })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='Course'
                      options={options.courses}
                      value={destinationData.course}
                      error={isSubmitted && !destinationData.course}
                      helperText={isSubmitted && !destinationData.course ? 'Required' : ''}
                      onChange={(val: any) =>
                        setDestinationData({ ...destinationData, course: val, stream: null, shift: null })
                      }
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='Stream'
                      options={options.streams}
                      value={destinationData.stream}
                      error={isSubmitted && options.streams?.length > 0 && !destinationData.stream}
                      helperText={
                        isSubmitted && options.streams?.length > 0 && !destinationData.stream ? 'Required' : ''
                      }
                      onChange={(val: any) => setDestinationData({ ...destinationData, stream: val, shift: null })}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <CommonAutocomplete
                      label='Shift'
                      options={options.shifts}
                      value={destinationData.shift}
                      error={isSubmitted && options.shifts?.length > 0 && !destinationData.shift}
                      helperText={isSubmitted && options.shifts?.length > 0 && !destinationData.shift ? 'Required' : ''}
                      onChange={(val: any) => setDestinationData({ ...destinationData, shift: val })}
                    />
                  </Grid>
                  {hostSchoolsList.length > 0 && (
                    <Grid item xs={12} md={4}>
                      <CommonAutocomplete
                        label='Host School Location'
                        options={hostSchoolsList}
                        value={selectedHostSchool}
                        error={isSubmitted && !selectedHostSchool}
                        helperText={isSubmitted && !selectedHostSchool ? 'Required' : ''}
                        onChange={(val: any) => {
                          setSelectedHostSchool(val)
                          if (val?.shift_id && options.shifts?.length > 0) {
                            const matchedShift = options.shifts.find((s: any) => s.id == val.shift_id)
                            if (matchedShift) {
                              setDestinationData((prev: any) => ({
                                ...prev,
                                shift: matchedShift
                              }))
                            }
                          }
                        }}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ mt: 2, px: 4, pb: 4, pt: 6 }}>
          <Button onClick={closeModal} size='large' variant='outlined' color='inherit' sx={{ mr: 2 }}>
            Cancel
          </Button>

          <Button
            onClick={handleTransfer}
            size='large'
            variant='contained'
            color='primary'
            disabled={!isTransferable || isSameSchool || loadingDetails || schoolLoading || !leadDetails}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      {transferSuccessDialog && (
        <SuccessDialog
          openDialog={transferSuccessDialog}
          title='Leads Transferred Successfully'
          handleClose={handleTransferSuccessClose}
        />
      )}
      <ErrorDialogBox
        openDialog={errorDialog}
        handleClose={() => {
          setErrorDialog(false)
          if (!isTransferable) {
            if (closeModal) closeModal()
          }
        }}
        title={errorMessage}
      />
    </>
  )
}

export default TransferEnquiriesDialog
