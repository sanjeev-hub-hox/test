'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Button,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Checkbox,
  IconButton,
  Paper,
  Autocomplete,
  CircularProgress,
  Alert
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs, { Dayjs } from 'dayjs'
import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'
import ErrorDialogBox from 'src/@core/CustomComponent/ErrorDialogBox/ErrorDialogBox'
import { getRequest, postRequest, putRequest } from 'src/services/apiService'
import toast from 'react-hot-toast'
import { getCurrentYearObject } from 'src/utils/helper'

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '1rem',
  marginBottom: theme.spacing(6),
  marginTop: theme.spacing(0),
  color: '#6B7280',
  paddingBottom: theme.spacing(4),
  borderBottom: '1px solid #E5E7EB'
}))

const FormSection = styled(Box)(({ theme }) => ({
  backgroundColor: '#fff',
  padding: theme.spacing(8),
  borderRadius: '12px',
  marginBottom: theme.spacing(6),
  border: '1px solid #F3F4F6'
}))

interface LCRequestFormProps {
  mode: 'create' | 'edit'
  requestId?: string
  requestTypeSlug?: string
}

const LCRequestForm = ({ mode, requestId, requestTypeSlug }: LCRequestFormProps) => {
  const router = useRouter()
  const { setPagePaths } = useGlobalContext()
  const CalendarIcon = () => <span className='icon-calendar-1'></span>
  const DownArrow = () => <span style={{ color: '#666666' }} className='icon-arrow-down-1'></span>

  // Common States
  const [loading, setLoading] = useState(mode === 'edit')
  const [submitting, setSubmitting] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successDialogTitle, setSuccessDialogTitle] = useState('')

  // Error Dialog State
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState('')

  // Create Mode Specific States
  const [enrollmentNumber, setEnrollmentNumber] = useState('')
  const [studentOptions, setStudentOptions] = useState<any[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [enrollmentError, setEnrollmentError] = useState('')
  const [showNoResults, setShowNoResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // Edit Mode Specific States
  const [canEdit, setCanEdit] = useState(true)
  const [editRestrictionMessage, setEditRestrictionMessage] = useState('')

  // Shared Data States
  const [studentDetails, setStudentDetails] = useState({
    studentId: null as number | null,
    enrollmentNumber: '', // Added for display in edit mode
    firstName: '',
    lastName: '',
    gender: '',
    dob: null as Dayjs | null,
    grade: '',
    board: '',
    course: '',
    stream: ''
  })

  const [academicYear, setAcademicYear] = useState('')
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [lcEffectiveDate, setLcEffectiveDate] = useState<Dayjs | null>(dayjs())
  const [reason, setReason] = useState('')
  const [reasons, setReasons] = useState<any[]>([])
  const [remarks, setRemarks] = useState('')
  const [udiseNo, setUdiseNo] = useState('')
  const isFacRequest = requestTypeSlug === 'fac_request'
  const [noLcNumber, setNoLcNumber] = useState(isFacRequest)
  const [academicDetails, setAcademicDetails] = useState<any>()

  useEffect(() => {
    if (isFacRequest) {
      setNoLcNumber(true)
    }
  }, [isFacRequest])

  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    ifscCode: '',
    branchName: '',
    accountHolderName: '',
    accountType: '',
    accountNumber: '',
    cancelledCheque: null as File | null,
    existingChequeUrl: '' // For edit mode
  })

  const [isDragging, setIsDragging] = useState(false)
  const [enquiryDetails, setEnquiryDetails] = useState({
    enquiryId: '',
    enquiryNumber: ''
  })

  const [formErrors, setFormErrors] = useState<any>({})

  useEffect(() => {
    const paths = [
      { title: 'Request Management', path: '/request-listing' },
      mode === 'create'
        ? { title: isFacRequest ? 'New FAC Request' : 'New LC Request', path: '/request-listing/new-lc-request' }
        : {
            title: isFacRequest ? 'Edit FAC Request' : 'Edit LC Request',
            path: `/request-listing/edit-lc-request/${requestId}`
          }
    ]
    setPagePaths(paths)
  }, [setPagePaths, mode, requestId, isFacRequest])

  // Fetch Academic Years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const apiRequest = {
          url: `/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc&filters[is_active][$eq]=true`,
          serviceURL: 'mdm',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
          }
        }
        const response: any = await getRequest(apiRequest)
        if (response?.data && response?.data?.length) {
          setAcademicYears(response.data)

          if (mode === 'create') {
            // Set current academic year as default for create mode using the common helper
            const currentYearObj = getCurrentYearObject(response.data)

            if (currentYearObj && currentYearObj.length > 0) {
              setAcademicYear(currentYearObj[0]?.attributes?.name)
            } else if (response.data.length > 0) {
              setAcademicYear(response.data[0]?.attributes?.name)
            }
          }
        }
      } catch (error) {}
    }
    fetchAcademicYears()
  }, [mode])

  // Fetch Reasons based on request type
  useEffect(() => {
    const fetchReasons = async () => {
      try {
        const reasonSlug = isFacRequest ? 'fac_reasons' : 'lc_reasons'
        const response: any = await getRequest({
          url: `/student-process-requests/get-co-reasons/${reasonSlug}`,
          serviceURL: 'admin'
        })
        if (response?.data && Array.isArray(response.data)) {
          setReasons(response.data)
        }
      } catch (error) {}
    }
    fetchReasons()
  }, [isFacRequest])

  // Fetch Data for Edit Mode
  useEffect(() => {
    const fetchEditData = async () => {
      if (mode !== 'edit' || !requestId) return

      setLoading(true)

      try {
        const response = await getRequest({
          url: `/student-process-requests/student-details/${requestId}`,
          serviceURL: 'admin'
        })

        const rawData = response?.data
        const data = Array.isArray(rawData) ? rawData[0] : rawData

        if (data) {
          const getValue = (field: any) => field?.value || field || ''
          const getName = (field: any) => field?.name || field || ''

          setStudentDetails({
            studentId: data.student_id,
            enrollmentNumber: getValue(data.enrollment_number),
            firstName: getValue(data.first_name),
            lastName: getValue(data.last_name),
            gender: getName(data.gender) || data.gender_name || '',
            dob: getValue(data.dob) ? dayjs(getValue(data.dob)) : null,
            grade: getName(data.grade) || data.grade_name || '',
            board: getName(data.board) || data.board_name || '',
            course: getName(data.course) || data.course_name || '',
            stream: getName(data.stream) || data.stream_name || ''
          })

          setEnrollmentNumber(getValue(data.enrollment_number))

          // Populate Enquiry Details
          setEnquiryDetails({
            enquiryId: getValue(data.enquiry_id),
            enquiryNumber: getValue(data.enquiry_number)
          })

          // Populate LC Details
          // Check both root and lc_details object
          const lcSource = data.lc_details || data

          setAcademicYear(getName(data.acadmin_year) || data.academic_year_name || '')

          const lcDateRaw =
            lcSource.lc_effect_date ||
            lcSource['LC Effective Date'] ||
            lcSource.lc_effective_date ||
            lcSource.effective_date
          const lcDate = lcDateRaw ? dayjs(lcDateRaw) : null
          setLcEffectiveDate(lcDate)
          const reasonMatch = reasons.find(el => el?.name === lcSource?.reason_name)
          setReason(reasonMatch?.id || getValue(lcSource.reason) || lcSource.reason || '')
          setRemarks(lcSource.comment || lcSource.remarks || '')
          setNoLcNumber(
            !!(lcSource.future_admission_cancellation_request || data.future_admission_cancellation_request)
          )
          setUdiseNo(getValue(lcSource.udise_no) || getValue(data.udise_no) || '')

          // Populate Bank Details
          const bankSource = data.bank_details || {}

          const findValue = (keys: string[]) => {
            for (const key of keys) {
              const val = getValue(bankSource[key])
              if (val) return val
            }
            for (const key of keys) {
              const val = getValue(data[key])
              if (val) return val
            }
            return ''
          }

          setBankDetails({
            bankName: findValue(['bank_name', 'Bank Name', 'Bank_Name', 'Bank_name']),
            ifscCode: findValue(['ifsc', 'IFSC Code', 'IFSC_Code', 'ifsc_code', 'IFSC_code']),
            branchName: findValue(['branch_name', 'Branch Name', 'Branch_ Name', 'Branch_Name']),
            accountHolderName: findValue([
              'account_holder_name',
              'Account Holder Name',
              'Account_Holder_Name',
              'Account_holder_name'
            ]),
            accountType: findValue(['account_type', 'Account Type', 'Account_Type']),
            accountNumber: findValue(['account_number', 'Account Number', 'Account_Number']),
            cancelledCheque: null,
            existingChequeUrl:
              data.document_url ||
              data['Document Cancel Cheque'] ||
              data['document_cancel_cheque'] ||
              data.document ||
              ''
          })

          // Check Edit Restrictions
          if (lcDate) {
            const oneDayBeforeLcDate = lcDate.subtract(1, 'day')
            const today = dayjs()

            if (today.isAfter(oneDayBeforeLcDate, 'day')) {
              setCanEdit(false)
              setEditRestrictionMessage(
                `Editing is not allowed. The LC Effective Date is ${lcDate.format('DD/MM/YYYY')}. ` +
                  `Editing is only permitted until ${oneDayBeforeLcDate.format('DD/MM/YYYY')}.`
              )
            }
          }
        }
      } catch (error: any) {
        setErrorDialogMessage(error?.message || 'Failed to fetch request details')
        setErrorDialogOpen(true)
      } finally {
        setLoading(false)
      }
    }

    fetchEditData()
  }, [mode, requestId, reasons])

  // Create Mode: Student Search
  const fetchStudentDetails = async (searchTerm: string) => {
    setEnrollmentError('')
    setShowNoResults(false)

    if (searchTerm.length < 7) {
      setStudentOptions([])
      if (searchTerm.length > 0) {
        setEnrollmentError('Enter at least 7 characters')
      }

      return
    }

    setLoadingStudents(true)

    try {
      const url = {
        url: `/student-process-requests/student-list?enr=${searchTerm}&status=1&process_type=${
          requestTypeSlug || 'lc_request'
        }`,
        serviceURL: 'admin'
      }
      const response = await getRequest(url)

      if (response?.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          setShowNoResults(true)
          setEnrollmentError(`Student not eligible for ${isFacRequest ? 'FAC' : 'LC'} request`)
        }
        setStudentOptions(response.data)
        getAcademicDetails(response?.data?.[0]?.student_id || '')
      } else {
        setStudentOptions([])
        setEnrollmentError('Failed to fetch student details')
      }
    } catch (error: any) {
      setStudentOptions([])
      if (error?.response?.data?.message) {
        setEnrollmentError(error.response.data.message)
      } else if (error?.message) {
        setEnrollmentError(error.message)
      }
    } finally {
      setLoadingStudents(false)
    }
  }

  // Debounce search
  useEffect(() => {
    if (mode !== 'create') return

    const timer = setTimeout(() => {
      if (enrollmentNumber) {
        fetchStudentDetails(enrollmentNumber)
      } else {
        setStudentOptions([])
        setEnrollmentError('')
        setShowNoResults(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [enrollmentNumber, mode])

  const handleStudentSelect = (student: any) => {
    setFormErrors((prev: any) => ({ ...prev, student: false }))
    setEnrollmentError('')
    setShowNoResults(false)

    if (!student) {
      setSelectedStudent(null)
      setStudentDetails({
        studentId: null,
        enrollmentNumber: '',
        firstName: '',
        lastName: '',
        gender: '',
        dob: null,
        grade: '',
        board: '',
        course: '',
        stream: ''
      })
      setEnquiryDetails({
        enquiryId: '',
        enquiryNumber: ''
      })
      setBankDetails({
        bankName: '',
        ifscCode: '',
        branchName: '',
        accountHolderName: '',
        accountType: '',
        accountNumber: '',
        cancelledCheque: null,
        existingChequeUrl: ''
      })
      setUdiseNo('')

      return
    }

    setSelectedStudent(student)
    setEnrollmentNumber(student.enrollment_number?.value || '')

    setStudentDetails({
      studentId: student.student_id,
      enrollmentNumber: student.enrollment_number?.value || '',
      firstName: student.first_name?.value || '',
      lastName: student.last_name?.value || '',
      gender: student.gender?.name || '',
      dob: student.dob?.value ? dayjs(student.dob.value) : null,
      grade: student.grade?.name || '',
      board: student.board?.name || '',
      course: student.course?.name || '',
      stream: student.stream?.name || ''
    })

    setEnquiryDetails({
      enquiryId: student?.enquiry_id?.value || student?.enquiry_id || '',
      enquiryNumber: student?.enquiry_number?.value || student?.enquiry_number || ''
    })
    setUdiseNo(student?.udise_no?.value || student?.udise_no || '')

    if (student.bank_details) {
      setBankDetails(prev => ({
        ...prev,
        bankName: student.bank_details.bank_name || '',
        ifscCode: student.bank_details.ifsc || '',
        branchName: student.bank_details.branch_name || '',
        accountHolderName: student.bank_details.account_holder_name || '',
        accountType: student.bank_details.account_type || '',
        accountNumber: student.bank_details.account_number || ''
      }))
    }

    if (student.acadmin_year?.name) {
      setAcademicYear(student.acadmin_year.name)
    }
  }

  // File Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBankDetails(prev => ({ ...prev, cancelledCheque: e.target.files![0] }))
      setFormErrors((prev: any) => ({ ...prev, cancelledCheque: false }))
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setBankDetails(prev => ({ ...prev, cancelledCheque: e.dataTransfer.files[0] }))
      setFormErrors((prev: any) => ({ ...prev, cancelledCheque: false }))
    }
  }

  const handleDeleteFile = () => {
    setBankDetails(prev => ({ ...prev, cancelledCheque: null }))
  }

  const getAcademicDetails = async (student_id: string) => {
    try {
      const url = {
        url: `/student-process-requests/student-academic-details?student_id=${student_id}`,
        serviceURL: 'admin'
      }
      const response = await getRequest(url)
      setAcademicDetails(response?.data?.[0])
    } catch (error: any) {}
  }

  const handleSubmit = async () => {
    const errors: any = {}

    if (mode === 'create' && !selectedStudent) {
      errors.student = true
    }
    if (!academicYear) errors.academicYear = true
    if (!lcEffectiveDate) {
      errors.lcEffectiveDate = true
    } else if (lcEffectiveDate.isBefore(dayjs(), 'day')) {
      errors.lcEffectiveDate = 'past'
    }
    if (!reason || String(reason).trim() === '') errors.reason = true
    if (!remarks || remarks.trim() === '') errors.remarks = true

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fill mandatory data')

      const priority = ['student', 'academicYear', 'lcEffectiveDate', 'reason', 'remarks']
      const firstError = priority.find(field => errors[field])
      if (firstError) {
        const element = document.getElementById(firstError)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      } else {
        window.scrollTo({ top: 10, behavior: 'smooth' })
      }

      return
    }

    setFormErrors({})

    if (mode === 'edit' && !canEdit) {
      toast.error(editRestrictionMessage)

      return
    }

    setSubmitting(true)

    try {
      const selectedYear = academicYears.find(year => year.attributes.name === academicYear)
      const shortNameTwoDigit = selectedYear?.attributes?.short_name_two_digit

      const payload = new FormData()

      payload.append('academic_year_id', String(shortNameTwoDigit || 0))
      payload.append('student_id', String(studentDetails.studentId || 0))
      payload.append('request_type', isFacRequest ? 'fac_request' : 'lc_request')
      const selectedReasonObj = reasons.find(r => String(r.id) === String(reason))
      payload.append('reason', selectedReasonObj ? selectedReasonObj.name : reason)
      payload.append('reason_id', String(reason))
      payload.append('comment', remarks)
      payload.append('enquiry_id', enquiryDetails.enquiryId)
      payload.append('enquiry_number', enquiryDetails.enquiryNumber)
      payload.append('applied_on', dayjs().toISOString())
      payload.append('lc_effective_date', lcEffectiveDate ? lcEffectiveDate.format('YYYY-MM-DD') : '')
      payload.append('udise_no', udiseNo)

      // Bank details
      payload.append('bank_name', bankDetails.bankName)
      payload.append('IFSC_code', bankDetails.ifscCode)
      payload.append('branch_name', bankDetails.branchName)
      payload.append('account_holder_name', bankDetails.accountHolderName)
      payload.append('account_type', bankDetails.accountType)
      payload.append('account_number', bankDetails.accountNumber)

      payload.append('future_admission_cancellation_request', noLcNumber ? '1' : '0')

      if (bankDetails.cancelledCheque) {
        payload.append('document', bankDetails.cancelledCheque)
      }

      let response: any
      if (mode === 'create') {
        response = await postRequest({
          url: '/student-process-requests/create/process-request',
          serviceURL: 'admin',
          data: payload
        })

        if (response?.success && response?.status === 200) {
          const reqLabel = isFacRequest ? 'FAC Request' : 'LC Request'
          setSuccessDialogTitle(`${reqLabel} Submitted Successfully`)
          setSuccessDialogOpen(true)
        } else {
          const errorMsg =
            response?.data?.message ||
            response?.message ||
            response?.error?.data?.message ||
            response?.error?.message ||
            'Failed to create request'
          setErrorDialogMessage(errorMsg)
          setErrorDialogOpen(true)
        }
      } else {
        const updatePayload = new FormData()
        updatePayload.append('process_request_id', String(requestId))
        updatePayload.append('remarks', remarks)
        updatePayload.append('lc_effective_date', lcEffectiveDate ? lcEffectiveDate.format('YYYY-MM-DD') : '')
        updatePayload.append('reason_id', String(reason))
        updatePayload.append('udise_no', udiseNo)
        updatePayload.append('IFSC_Code', bankDetails.ifscCode)
        updatePayload.append('Bank_Name', bankDetails.bankName)
        updatePayload.append('Branch_ Name', bankDetails.branchName)
        updatePayload.append('Account_Holder_Name', bankDetails.accountHolderName)
        updatePayload.append('Account_Type', bankDetails.accountType)
        updatePayload.append('Account_Number', bankDetails.accountNumber)

        if (bankDetails.cancelledCheque) {
          updatePayload.append('document', bankDetails.cancelledCheque)
        }

        response = await putRequest({
          url: '/student-process-requests/update/process-request',
          serviceURL: 'admin',
          data: updatePayload
        })

        if (response?.success && response?.status === 200) {
          const reqLabel = isFacRequest ? 'FAC Request' : 'LC Request'
          setSuccessDialogTitle(`${reqLabel} updated successfully`)
          setSuccessDialogOpen(true)
        } else {
          const errorMsg =
            response?.data?.message ||
            response?.message ||
            response?.error?.data?.message ||
            response?.error?.message ||
            'Failed to update request'
          setErrorDialogMessage(errorMsg)
          setErrorDialogOpen(true)
        }
      }
    } catch (error: any) {
      setErrorDialogMessage(error?.message || 'An error occurred while submitting the request')
      setErrorDialogOpen(true)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/request-listing')
  }

  if (loading && mode === 'edit') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  const computedMaxDate = (() => {
    if (academicYear === studentOptions?.[0]?.acadmin_year?.name) {
      return dayjs(academicDetails?.academic_year_end_date)
    } else {
      const year = `20${academicYear.split(' - ')?.[1]}-04-30T18:29:59.999Z`
      return dayjs(year)
    }
  })()

  // console.log('computedMaxDate :>> ', computedMaxDate, academicYear)

  return (
    <Box sx={{ p: 6 }}>
      {mode === 'edit' && !canEdit && (
        <Alert severity='warning' sx={{ mb: 4 }}>
          {editRestrictionMessage}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 0, backgroundColor: 'transparent' }}>
        {/* Student Details Section */}
        <FormSection>
          <SectionTitle>Student Details {mode === 'edit' && '(Read Only)'}</SectionTitle>
          <Grid container spacing={6}>
            <Grid item xs={12} md={4} id='student'>
              {mode === 'create' ? (
                <Autocomplete
                  freeSolo
                  options={studentOptions}
                  loading={loadingStudents}
                  value={selectedStudent}
                  inputValue={enrollmentNumber}
                  onInputChange={(event, newValue) => {
                    setEnrollmentNumber(newValue)
                  }}
                  onChange={(event, newValue) => {
                    handleStudentSelect(newValue)
                  }}
                  getOptionLabel={option => {
                    if (typeof option === 'string') return option

                    return option.enrollment_number?.value || ''
                  }}
                  noOptionsText={
                    loadingStudents
                      ? 'Searching...'
                      : enrollmentNumber.length < 7
                      ? 'Enter at least 7 characters'
                      : showNoResults
                      ? 'No student found'
                      : 'Start typing to search'
                  }
                  renderOption={(props, option) => (
                    <Box
                      component='li'
                      {...props}
                      key={option.student_id}
                      sx={{
                        display: 'flex !important',
                        flexDirection: 'column',
                        alignItems: 'flex-start !important',
                        py: 2,
                        borderBottom: '1px solid #F3F4F6',
                        '&:last-child': {
                          borderBottom: 'none'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                        <Typography
                          variant='body2'
                          sx={{
                            fontWeight: 400,
                            color: '#000000ff',
                            fontSize: '1rem',
                            minWidth: '140px',
                            fontFamily: 'monospace'
                          }}
                        >
                          {option.enrollment_number?.value}
                        </Typography>
                        <Divider orientation='vertical' flexItem sx={{ mx: 2 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='body2' sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {option.first_name?.value} {option.last_name?.value}
                          </Typography>
                          <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                            {option.grade?.name} • {option.board?.name}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label='Enrollment Number'
                      placeholder='Enter Enrollment Number'
                      required
                      error={!!enrollmentError || !!formErrors.student}
                      helperText={enrollmentError || (formErrors.student ? 'Please select a student' : '')}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingStudents ? <CircularProgress color='inherit' size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        )
                      }}
                    />
                  )}
                />
              ) : (
                <TextField fullWidth label='Enrollment Number' value={studentDetails.enrollmentNumber} disabled />
              )}
            </Grid>

            {mode === 'create' && <Grid item xs={12} md={8} />}

            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Student First Name' value={studentDetails.firstName} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Student Last Name' value={studentDetails.lastName} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Gender' value={studentDetails.gender} disabled />
            </Grid>

            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Date Of Birth'
                  value={studentDetails.dob}
                  disabled
                  format='DD/MM/YYYY'
                  sx={{ width: '100%' }}
                  slots={{ openPickerIcon: CalendarIcon }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Grade' value={studentDetails.grade} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Board' value={studentDetails.board} disabled />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Course' value={studentDetails.course} disabled />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label='Stream' value={studentDetails.stream} disabled />
            </Grid>
          </Grid>
        </FormSection>

        {/* LC Details Section */}
        <FormSection>
          <SectionTitle>LC Details</SectionTitle>
          <Grid container spacing={6}>
            <Grid item xs={12} md={4} id='academicYear'>
              <FormControl fullWidth required error={!!formErrors.academicYear}>
                <InputLabel>Academic Year</InputLabel>
                <Select
                  value={academicYear}
                  defaultChecked={academicDetails?.academic_year}
                  label='Academic Year'
                  onChange={e => {
                    setAcademicYear(e.target.value)
                    setFormErrors((prev: any) => ({ ...prev, academicYear: false }))
                  }}
                  IconComponent={DownArrow}
                  required
                  disabled={true}
                >
                  {academicYears.map((year: any) => (
                    <MenuItem key={year.id} value={year?.attributes?.name}>
                      {year?.attributes?.name}
                    </MenuItem>
                  ))}
                  {!academicYears.length && <MenuItem value=''>Loading...</MenuItem>}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4} id='lcEffectiveDate'>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='LC Effective Date'
                  value={lcEffectiveDate}
                  onChange={newValue => {
                    setLcEffectiveDate(newValue)
                    setFormErrors((prev: any) => ({ ...prev, lcEffectiveDate: false }))
                  }}
                  format='DD/MM/YYYY'
                  minDate={dayjs()}
                  maxDate={computedMaxDate}
                  disabled={mode === 'edit' && !canEdit}
                  sx={{
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderColor: formErrors.lcEffectiveDate ? 'error.main' : 'inherit'
                    }
                  }}
                  slots={{ openPickerIcon: CalendarIcon }}
                  slotProps={{
                    textField: {
                      error: !!formErrors.lcEffectiveDate,
                      helperText:
                        formErrors.lcEffectiveDate === 'past'
                          ? 'LC Effective Date cannot be a past date'
                          : formErrors.lcEffectiveDate
                          ? 'Required'
                          : ''
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={4} id='reason'>
              <FormControl fullWidth required error={!!formErrors.reason} disabled={mode === 'edit' && !canEdit}>
                <InputLabel>Reason</InputLabel>
                <Select
                  value={reason}
                  label='Reason'
                  onChange={e => {
                    setReason(e.target.value)
                    setFormErrors((prev: any) => ({ ...prev, reason: false }))
                  }}
                  IconComponent={DownArrow}
                >
                  <MenuItem value='' disabled>
                    {reasons.length > 0 ? 'Select Reason' : 'Loading...'}
                  </MenuItem>
                  {reasons.map((r: any) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.reason && (
                  <Typography variant='caption' sx={{ color: '#d32f2f', mt: 1, ml: 3.5 }}>
                    Reason is required
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='UDISE No.'
                value={udiseNo}
                onChange={e => setUdiseNo(e.target.value)}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>
            <Grid item xs={12} id='remarks'>
              <TextField
                fullWidth
                multiline
                rows={4}
                label='Remarks'
                value={remarks}
                onChange={e => {
                  setRemarks(e.target.value.slice(0, 5000))
                  setFormErrors((prev: any) => ({ ...prev, remarks: false }))
                }}
                placeholder='Enter Remarks (Approx 500 words)'
                required
                error={!!formErrors.remarks}
                disabled={mode === 'edit' && !canEdit}
                helperText={
                  formErrors.remarks ? (
                    'Remarks are mandatory'
                  ) : remarks.length >= 5000 ? (
                    <Typography variant='caption' sx={{ color: '#d32f2f', fontWeight: 600 }}>
                      Maximum limit of 5000 characters reached
                    </Typography>
                  ) : (
                    `${remarks.length}/5000`
                  )
                }
                InputLabelProps={{
                  shrink: true
                }}
                sx={{
                  '& .MuiInputBase-root': {
                    padding: '12px 15px',
                    alignItems: 'flex-start',
                    height: '120px',
                    overflow: 'hidden',
                    position: 'relative'
                  },
                  '& .MuiInputBase-input': {
                    padding: '0px',
                    height: '100% !important',
                    overflowY: 'auto !important',
                    wordBreak: 'break-all'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: !!formErrors.remarks ? 'error.main' : 'inherit'
                  }
                }}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Bank Details Section */}
        <FormSection>
          <SectionTitle>Bank Details</SectionTitle>
          <Grid container spacing={6}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Bank Name'
                value={bankDetails.bankName}
                onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='IFSC Code'
                value={bankDetails.ifscCode}
                onChange={e => setBankDetails({ ...bankDetails, ifscCode: e.target.value })}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Branch Name'
                value={bankDetails.branchName}
                onChange={e => setBankDetails({ ...bankDetails, branchName: e.target.value })}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Account Holder Name'
                value={bankDetails.accountHolderName}
                onChange={e => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth disabled={mode === 'edit' && !canEdit}>
                <InputLabel>Account Type</InputLabel>
                <Select
                  value={bankDetails.accountType}
                  label='Account Type'
                  onChange={e => setBankDetails({ ...bankDetails, accountType: e.target.value })}
                  IconComponent={DownArrow}
                >
                  <MenuItem value='' disabled>
                    Select Account Type
                  </MenuItem>
                  <MenuItem value='Saving'>Savings</MenuItem>
                  <MenuItem value='Current'>Current</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Account Number'
                value={bankDetails.accountNumber}
                onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                disabled={mode === 'edit' && !canEdit}
              />
            </Grid>
            <Grid item xs={12} id='cancelledCheque'>
              <Typography
                variant='body2'
                sx={{
                  mb: 2,
                  fontWeight: 500,
                  color: formErrors.cancelledCheque ? 'error.main' : 'text.secondary',
                  fontSize: '0.75rem'
                }}
              >
                Upload Cancelled Cheque {mode === 'edit' && bankDetails.existingChequeUrl && '(Replace existing)'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Upload Container */}
                <Box
                  onDragEnter={handleDragOver}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  sx={{
                    border: '1px dashed',
                    borderRadius: '8px',
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    width: '320px',
                    height: '80px',
                    justifyContent: 'center',
                    backgroundColor: isDragging ? '#F3F4F6' : 'transparent',
                    borderColor: formErrors.cancelledCheque ? '#d32f2f' : isDragging ? '#4849DA' : '#D1D5DB',
                    borderWidth: formErrors.cancelledCheque ? '2px' : '1px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Button
                    variant='outlined'
                    component='label'
                    disabled={mode === 'edit' && !canEdit}
                    startIcon={<span className='icon-export-1' style={{ fontSize: '18px' }}></span>}
                    sx={{
                      borderRadius: '45px',
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 6,
                      py: 2,
                      border: '1px solid #4849DA',
                      color: '#4849DA'
                    }}
                  >
                    Upload
                    <input type='file' hidden onChange={handleFileUpload} accept='image/*,application/pdf' />
                  </Button>
                  <Typography variant='body2' sx={{ color: formErrors.cancelledCheque ? '#d32f2f' : '#9CA3AF' }}>
                    {formErrors.cancelledCheque ? 'File Required' : 'Or Drag Your File Here'}
                  </Typography>
                </Box>

                {/* File Info */}
                {bankDetails.cancelledCheque && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box>
                      <Typography variant='body2' sx={{ color: '#4849DA', fontWeight: 600 }}>
                        {bankDetails.cancelledCheque.name}
                      </Typography>
                      <Typography variant='caption' sx={{ color: '#9CA3AF' }}>
                        {(bankDetails.cancelledCheque.size / (1024 * 1024)).toFixed(2)}mb
                      </Typography>
                    </Box>
                    <IconButton size='small' onClick={handleDeleteFile} sx={{ color: '#9CA3AF' }}>
                      <span className='icon-trash' style={{ fontSize: '20px' }}></span>
                    </IconButton>
                  </Box>
                )}

                {/* Existing Cheque Info */}
                {mode === 'edit' && !bankDetails.cancelledCheque && bankDetails.existingChequeUrl && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ maxWidth: '100%' }}>
                      <Typography variant='caption' sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                        Existing Document Path:
                      </Typography>
                      {typeof bankDetails.existingChequeUrl === 'string' &&
                      bankDetails.existingChequeUrl.startsWith('http') ? (
                        <Typography
                          variant='body2'
                          component='a'
                          href={bankDetails.existingChequeUrl}
                          target='_blank'
                          sx={{
                            color: '#4849DA',
                            fontWeight: 600,
                            textDecoration: 'underline',
                            wordBreak: 'break-all',
                            cursor: 'pointer'
                          }}
                        >
                          {bankDetails.existingChequeUrl.split('/').pop()?.split('?')[0]}
                        </Typography>
                      ) : (
                        <Typography variant='body2' sx={{ color: '#6B7280', wordBreak: 'break-all' }}>
                          {bankDetails.existingChequeUrl
                            ? `/${bankDetails.existingChequeUrl.split('/').pop()?.split('?')[0]}`
                            : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Checkbox Section */}
            {isFacRequest && (
              <Grid item xs={12}>
                <Divider sx={{ my: 4 }} />
                <Box
                  sx={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    p: 4,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Checkbox
                    checked={isFacRequest || noLcNumber}
                    onChange={e => {
                      if (!isFacRequest) {
                        setNoLcNumber(e.target.checked)
                      }
                    }}
                    disabled={isFacRequest || (mode === 'edit' && !canEdit)}
                    sx={{ p: 0, mr: 3 }}
                  />
                  <Box>
                    <Typography variant='body2' sx={{ fontWeight: 500, color: 'text.primary' }}>
                      For Future Admission Cancellation Request <span style={{ color: 'red' }}>*</span>
                    </Typography>
                    <Typography variant='caption' sx={{ color: 'text.secondary' }}>
                      No LC Number Will Be Generated
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </FormSection>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mb: 10 }}>
          <Button variant='outlined' color='primary' onClick={handleCancel} sx={{ minWidth: 100 }}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='secondary'
            onClick={handleSubmit}
            sx={{ minWidth: 100 }}
            disabled={submitting || (mode === 'edit' && !canEdit)}
          >
            {submitting ? <CircularProgress size={24} color='inherit' /> : 'Submit'}
          </Button>
        </Box>
      </Paper>

      <SuccessDialog
        openDialog={successDialogOpen}
        handleClose={() => {
          setSuccessDialogOpen(false)
          router.push('/request-listing')
        }}
        title={successDialogTitle}
      />

      <ErrorDialogBox
        openDialog={errorDialogOpen}
        handleClose={() => setErrorDialogOpen(false)}
        title={errorDialogMessage}
      />
    </Box>
  )
}

export default LCRequestForm
