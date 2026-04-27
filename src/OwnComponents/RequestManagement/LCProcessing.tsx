'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Button,
  Typography,
  TextField,
  Paper,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useRouter } from 'next/router'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import dayjs, { Dayjs } from 'dayjs'
import { getRequest, putRequest } from 'src/services/apiService'
import { getLocalStorageVal } from 'src/utils/helper'
import Image from 'next/image'
import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'
import ErrorDialogBox from 'src/@core/CustomComponent/ErrorDialogBox/ErrorDialogBox'

interface LCProcessingProps {
  requestId?: string
}

const StudentHeader = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundImage: 'url(/images/Banner.png)',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  borderRadius: '12px',
  marginBottom: theme.spacing(6),
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  position: 'relative',
  overflow: 'hidden'
}))

// Checklist Interfaces
interface ChecklistItem {
  checklist_id: number
  checklist_order: number
  checklist_name: string
  checklist_display_name: string
  is_checked: number
  approved_by: string | null
  approved_date: string | null
  document_path: string | null
  comments: string | null
  created_at: string | null
  updated_at: string | null
}

interface ChecklistMaster {
  checklist_master_id: number
  checklist_master_slug: string
  checklist_master_name: string
  checklist_master_display_name: string
  can_read: boolean
  can_write: boolean
  can_view: boolean
  is_saved: boolean
  hasUnsavedChanges?: boolean
  is_completed_and_saved?: boolean
  checklists: ChecklistItem[]
}

const LCProcessing = ({ requestId }: LCProcessingProps) => {
  const router = useRouter()
  const { setPagePaths } = useGlobalContext()
  const [loading, setLoading] = useState(true)
  const [studentDetails, setStudentDetails] = useState<any>(null)

  // Tab State
  const [activeTab, setActiveTab] = useState<string>('')

  // Form State
  const [lcEffectiveDate, setLcEffectiveDate] = useState<Dayjs | null>(null)

  // Checklist States
  const [checklistData, setChecklistData] = useState<ChecklistMaster[]>([])
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successDialogTitle, setSuccessDialogTitle] = useState('')

  // Error Dialog State
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState('')
  const [unsavedChangesDialogOpen, setUnsavedChangesDialogOpen] = useState(false)
  const [pendingTabChange, setPendingTabChange] = useState<string | null>(null)

  const isTabCompleted = (master: ChecklistMaster) => {
    if (master.checklists.length === 0) return true
    return master.checklists.every(item => item.is_checked === 1)
  }

  const lastDeptName = checklistData.length > 0 ? checklistData[checklistData.length - 1].checklist_master_name : ''
  const pendingDepts = checklistData
    .filter(m => m.checklist_master_name !== lastDeptName && (!m.is_completed_and_saved || m.hasUnsavedChanges))
    .map(m => m.checklist_master_display_name)

  const isAllCompleted = pendingDepts.length === 0

  useEffect(() => {
    const isFac = router.query.type === 'fac_request'
    setPagePaths([
      { title: 'Request Listing', path: '/request-listing' },
      {
        title: isFac ? 'FAC Processing' : 'LC Processing',
        path: `/request-listing/lc-processing/${requestId}${isFac ? '?type=fac_request' : ''}`
      }
    ])
  }, [setPagePaths, requestId, router.query.type])

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!requestId) return
      setLoading(true)
      try {
        const response = await getRequest({
          url: `/student-process-requests/student-details/${requestId}`,
          serviceURL: 'admin'
        })

        if (response?.success && response?.data) {
          const data = Array.isArray(response.data) ? response.data[0] : response.data
          setStudentDetails(data)

          const lcDate = data?.lc_details?.lc_effect_date || data?.lc_effective_date
          if (lcDate) {
            setLcEffectiveDate(dayjs(lcDate))
          }
        }
      } catch (error) {
        setErrorDialogMessage('Failed to load student details')
        setErrorDialogOpen(true)
      } finally {
        setLoading(false)
      }
    }

    fetchStudentData()
  }, [requestId])

  useEffect(() => {
    const fetchChecklists = async () => {
      if (!requestId) return

      setChecklistLoading(true)

      try {
        const userInfoStr = getLocalStorageVal('userInfo')
        const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

        const userId = userInfo?.userInfo?.id
        const processSlug = router.query.type || 'lc_request'

        const response = await getRequest({
          url: `/student-process-requests/check-list?process_id=${requestId}&process_slug=${processSlug}&user_id=${userId}`,
          serviceURL: 'admin'
        })

        if (response?.status === 200 && response.data) {
          const visibleChecklists = response.data
            .filter((item: any) => item.can_view !== false)
            .map((m: any) => {
              const completed = isTabCompleted(m)
              return {
                ...m,
                is_saved: completed,
                hasUnsavedChanges: false,
                is_completed_and_saved: completed
              }
            })

          setChecklistData(visibleChecklists)

          if (visibleChecklists.length > 0) {
            setActiveTab(visibleChecklists[0].checklist_master_name)
          }
        }
      } catch (error) {
        setErrorDialogMessage('Failed to load checklists')
        setErrorDialogOpen(true)
      } finally {
        setChecklistLoading(false)
      }
    }

    if (router.isReady) {
      fetchChecklists()
    }
  }, [requestId, router.isReady, router.query.type])

  const handleChecklistChange = (
    masterId: number,
    checklistId: number,
    field: 'is_checked' | 'comments',
    value: any
  ) => {
    setChecklistData(prevData => {
      return prevData.map(master => {
        if (Number(master.checklist_master_id) === Number(masterId)) {
          return {
            ...master,
            is_saved: false,
            hasUnsavedChanges: true,
            checklists: master.checklists.map(item => {
              if (Number(item.checklist_id) === Number(checklistId)) {
                return { ...item, [field]: value }
              }
              return item
            })
          }
        }
        return master
      })
    })
  }

  const currentIndex = checklistData.findIndex(m => m.checklist_master_name === activeTab)

  const handleTabChange = (targetTabName: string) => {
    const currentMaster = checklistData[currentIndex]
    if (currentMaster && currentMaster.hasUnsavedChanges) {
      setPendingTabChange(targetTabName)
      setUnsavedChangesDialogOpen(true)
    } else {
      setActiveTab(targetTabName)
    }
  }

  const handleNext = () => {
    if (currentIndex < checklistData.length - 1) {
      handleTabChange(checklistData[currentIndex + 1].checklist_master_name)
    }
  }

  const handleProceedWithoutSaving = () => {
    if (pendingTabChange === 'EXIT') {
      router.push('/request-listing')
    } else if (pendingTabChange) {
      setActiveTab(pendingTabChange)
    }
    setPendingTabChange(null)
    setUnsavedChangesDialogOpen(false)
  }

  const handleSubmit = async () => {
    const currentMaster = checklistData[currentIndex]
    if (!currentMaster) return

    if (currentIndex === checklistData.length - 1) {
      setConfirmDialogOpen(true)
      return
    }

    setUpdating(true)
    try {
      const itemsToUpdate = currentMaster.checklists.map(item => ({
        checklist_master_id: currentMaster.checklist_master_id,
        checklist_id: item.checklist_id,
        is_checked: item.is_checked,
        comments: item.comments || '',
        document_path: item.document_path || ''
      }))

      const userInfoStr = getLocalStorageVal('userInfo')
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null
      const userType = userInfo?.userInfo?.role || 'Employee'
      const userId = userInfo?.userInfo?.id

      const processSlug = router.query.type || 'lc_request'

      const apiRequest = {
        url: `/student-process-requests/check-list`,
        serviceURL: 'admin',
        data: {
          process_id: Number(requestId),
          process_slug: processSlug,
          user_id: Number(userId),
          user_type: userType,
          items: itemsToUpdate,
          is_last_department: false
        }
      }

      const response = await putRequest(apiRequest)

      if (response?.status === 200 || response?.success) {
        setChecklistData(prev =>
          prev.map(m =>
            m.checklist_master_id === currentMaster.checklist_master_id
              ? { ...m, is_saved: true, hasUnsavedChanges: false, is_completed_and_saved: isTabCompleted(m) }
              : m
          )
        )
        setSuccessDialogTitle(response?.message || 'Checklist updated successfully')
        setSuccessDialogOpen(true)
      } else {
        const errorMsg = response?.error?.message || response?.message || 'Failed to update checklist'
        setErrorDialogMessage(errorMsg)
        setErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorDialogMessage('An error occurred while updating the checklist')
      setErrorDialogOpen(true)
    } finally {
      setUpdating(false)
    }
  }

  const handleFinalSubmit = async () => {
    const currentMaster = checklistData[currentIndex]
    if (!currentMaster || !currentMaster.can_write) return

    setUpdating(true)
    setConfirmDialogOpen(false)
    try {
      const itemsToUpdate = currentMaster.checklists.map(item => ({
        checklist_master_id: currentMaster.checklist_master_id,
        checklist_id: item.checklist_id,
        is_checked: item.is_checked,
        comments: item.comments || '',
        document_path: item.document_path || ''
      }))

      const userInfoStr = getLocalStorageVal('userInfo')
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null

      const userId = userInfo?.userInfo?.id
      const userType = userInfo?.userInfo?.role || 'Employee'
      const processSlug = router.query.type || 'lc_request'
      const apiRequest = {
        url: `/student-process-requests/check-list`,
        serviceURL: 'admin',
        data: {
          process_id: Number(requestId),
          process_slug: processSlug,
          user_id: Number(userId),
          user_type: userType,
          items: itemsToUpdate,
          is_last_department: true // True for the last tab
        }
      }

      const response = await putRequest(apiRequest)

      if (response && (response.success || response.status === 200 || !response.error)) {
        setChecklistData(prev =>
          prev.map(m =>
            m.checklist_master_id === currentMaster.checklist_master_id
              ? { ...m, is_saved: true, hasUnsavedChanges: false, is_completed_and_saved: isTabCompleted(m) }
              : m
          )
        )
        setSuccessDialogTitle(response?.message || 'Details submitted successfully')
        setSuccessDialogOpen(true)
      } else {
        const errorMsg = response?.error?.message || response?.message || 'Failed to submit LC Request'
        setErrorDialogMessage(errorMsg)
        setErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorDialogMessage('Failed to submit LC Request')
      setErrorDialogOpen(true)
    } finally {
      setUpdating(false)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setActiveTab(checklistData[currentIndex - 1].checklist_master_name)
    }
  }

  const handleCancel = () => {
    const currentMaster = checklistData[currentIndex]
    if (currentMaster && currentMaster.hasUnsavedChanges) {
      setPendingTabChange('EXIT')
      setUnsavedChangesDialogOpen(true)
    } else {
      router.push('/request-listing')
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (!studentDetails) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>No student details found.</Typography>
      </Box>
    )
  }

  const schoolDetails = studentDetails.school_details || {}
  const studentName = `${studentDetails.first_name?.value || ''} ${studentDetails.last_name?.value || ''}`

  return (
    <Box sx={{ p: 6 }}>
      <StudentHeader elevation={0}>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ mr: 2 }}>
              <Image src='/images/studentBlue.png' alt='Student Logo' width={64} height={54} />
            </Box>
            <Box>
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                {studentName} ({studentDetails.acadmin_year?.name || 'N/A'})
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Box
                sx={{
                  backgroundColor: '#fff',
                  borderRadius: '20px',
                  px: 3,
                  py: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0px 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <Typography sx={{ color: '#6A6AFB', fontWeight: 600, fontSize: '0.875rem' }}>Active</Typography>
              </Box>
            </Box>
          </Box>

          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant='body2' color='textSecondary'>
                Enrollment Number :{' '}
                <span style={{ color: 'black', fontWeight: 500 }}>{studentDetails.enrollment_number?.value}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant='body2' color='textSecondary'>
                School :{' '}
                <span style={{ color: 'black', fontWeight: 500 }}>
                  {schoolDetails.school_name || studentDetails.brand?.name}
                </span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant='body2' color='textSecondary'>
                Grade : <span style={{ color: 'black', fontWeight: 500 }}>{studentDetails.grade?.name}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant='body2' color='textSecondary'>
                Board : <span style={{ color: 'black', fontWeight: 500 }}>{studentDetails.board?.name}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant='body2' color='textSecondary'>
                Division : <span style={{ color: 'black', fontWeight: 500 }}>{schoolDetails.division || ''}</span>
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Typography variant='body2' color='textSecondary'>
                School Start Time :{' '}
                <span style={{ color: 'black', fontWeight: 500 }}>{schoolDetails.start_time || ''}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant='body2' color='textSecondary'>
                School End Time :{' '}
                <span style={{ color: 'black', fontWeight: 500 }}>{schoolDetails.end_time || ''}</span>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant='body2' color='textSecondary'>
                Shift : <span style={{ color: 'black', fontWeight: 500 }}>{schoolDetails.shift || ''}</span>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </StudentHeader>

      <Dialog open={unsavedChangesDialogOpen} onClose={() => setUnsavedChangesDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Unsaved Changes</DialogTitle>
        <DialogContent>
          <Typography>You have unsaved changes in this department. Do you want to proceed without saving?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setUnsavedChangesDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Stay and Save
          </Button>
          <Button
            onClick={handleProceedWithoutSaving}
            variant='contained'
            color='error'
            sx={{
              borderRadius: '20px',
              textTransform: 'none'
            }}
          >
            Discard & Proceed
          </Button>
        </DialogActions>
      </Dialog>

      <Card sx={{ borderRadius: '12px', boxShadow: 'none', border: '1px solid #E0E0E0', backgroundColor: '#ffffff' }}>
        <CardContent sx={{ p: 6, backgroundColor: '#ffffff' }}>
          {/* LC Field */}
          <Box sx={{ mb: 6, maxWidth: '400px' }}>
            <TextField
              label={router.query.type === 'fac_request' ? 'FAC Effective Date' : 'LC Effective Date'}
              value={lcEffectiveDate ? lcEffectiveDate.format('DD/MM/YYYY') : ''}
              fullWidth
              size='small'
              InputProps={{
                readOnly: true
              }}
              sx={{ backgroundColor: '#ffffff' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 6 }}>
            {checklistData.map(master => (
              <Button
                key={master.checklist_master_id}
                onClick={() => handleTabChange(master.checklist_master_name)}
                variant='outlined'
                sx={{
                  textTransform: 'none',
                  borderRadius: '8px',
                  minWidth: '100px',
                  height: '40px',
                  fontWeight: 600,
                  borderColor: activeTab === master.checklist_master_name ? '#6A6AFB' : '#E0E0E0',
                  backgroundColor: activeTab === master.checklist_master_name ? '#EEEEFF' : '#ffffff',
                  color: activeTab === master.checklist_master_name ? '#6A6AFB' : '#666',
                  borderWidth: activeTab === master.checklist_master_name ? '1.5px' : '1px',
                  '&:hover': {
                    backgroundColor: activeTab === master.checklist_master_name ? '#E0E0FF' : '#F9F9F9',
                    borderColor: '#6A6AFB'
                  }
                }}
              >
                {master.checklist_master_display_name}
              </Button>
            ))}
          </Box>

          {checklistLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : checklistData.length === 0 ? (
            <Box
              sx={{
                py: 10,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2
              }}
            >
              <Typography variant='h6' sx={{ color: '#444', fontWeight: 600 }}>
                No departments found
              </Typography>
              <Typography color='textSecondary' sx={{ maxWidth: '400px' }}>
                There are no departments available for this request processing.
              </Typography>
            </Box>
          ) : (
            checklistData.map(master => {
              if (master.checklist_master_name === activeTab) {
                return (
                  // <Can key={master.checklist_master_id} action="HIDE" pagePermission={master.checklist_master_name}>
                  <Box key={master.checklist_master_id} sx={{ display: 'flex', flexDirection: 'column' }}>
                    {master.checklists.map(item => (
                      <Box key={item.checklist_id} sx={{ borderBottom: '1px solid #F0F0F0', pb: 4, mb: 2 }}>
                        <Box
                          sx={{
                            py: 2,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: 2
                          }}
                        >
                          <Tooltip
                            title={!master.can_write ? 'You are not authorized for this dept.' : ''}
                            arrow
                            placement='top-start'
                          >
                            <Box sx={{ width: 'fit-content' }}>
                              <FormControlLabel
                                sx={{ m: 0 }}
                                control={
                                  <Checkbox
                                    checked={Boolean(item.is_checked)}
                                    disabled={!master.can_write || master.is_completed_and_saved}
                                    onChange={e =>
                                      handleChecklistChange(
                                        master.checklist_master_id,
                                        item.checklist_id,
                                        'is_checked',
                                        e.target.checked ? 1 : 0
                                      )
                                    }
                                    sx={{
                                      color: '#CCC',
                                      '&.Mui-checked': {
                                        color: '#6A6AFB'
                                      }
                                    }}
                                  />
                                }
                                label={
                                  <Typography sx={{ fontSize: '0.95rem', color: '#666', fontWeight: 500, ml: 2 }}>
                                    {item.checklist_display_name}
                                  </Typography>
                                }
                              />
                            </Box>
                          </Tooltip>
                        </Box>
                      </Box>
                    ))}
                    {master.checklists.length === 0 && (
                      <Box
                        sx={{
                          py: 10,
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 2
                        }}
                      >
                        <Typography variant='h6' sx={{ color: '#444', fontWeight: 600 }}>
                          No checklist items found
                        </Typography>
                        <Typography color='textSecondary' sx={{ maxWidth: '400px' }}>
                          There are no specific checklist items to display for this department.
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  // </Can>
                )
              }
              return null
            })
          )}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6, gap: 2 }}>
            <Button
              variant='outlined'
              color='inherit'
              onClick={handleCancel}
              sx={{ px: 4, borderRadius: '25px', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant='outlined'
              color='primary'
              onClick={handlePrevious}
              disabled={currentIndex === 0 || checklistData.length === 0}
              sx={{ px: 4, borderRadius: '25px', textTransform: 'none', borderColor: '#6A6AFB', color: '#6A6AFB' }}
            >
              Previous
            </Button>
            <Button
              variant='outlined'
              color='primary'
              onClick={handleNext}
              disabled={currentIndex === checklistData.length - 1 || checklistData.length === 0}
              sx={{ px: 4, borderRadius: '25px', textTransform: 'none', borderColor: '#6A6AFB', color: '#6A6AFB' }}
            >
              Next
            </Button>
            <Tooltip
              title={
                checklistData[currentIndex] && !checklistData[currentIndex].can_write
                  ? 'You are not authorized for this dept'
                  : currentIndex === checklistData.length - 1 &&
                    !isAllCompleted &&
                    studentDetails?.process_status !== 'exception_approved'
                  ? `Pending Departments: ${pendingDepts.join(', ')}`
                  : checklistData[currentIndex] &&
                    checklistData[currentIndex].is_completed_and_saved
                  ? 'Department completed and saved'
                  : 'To save the response click Submit'
              }
              arrow
              placement='top'
            >
              <span>
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={handleSubmit}
                  disabled={
                    updating ||
                    checklistData.length === 0 ||
                    (checklistData[currentIndex] && !checklistData[currentIndex].can_write) ||
                    (checklistData[currentIndex] && checklistData[currentIndex].is_completed_and_saved) ||
                    (currentIndex === checklistData.length - 1 &&
                      (pendingDepts.length > 0 || !isTabCompleted(checklistData[currentIndex])) &&
                      studentDetails?.process_status !== 'exception_approved')
                  }
                  sx={{
                    px: 6,
                    py: 1,
                    borderRadius: '25px',
                    textTransform: 'none'
                  }}
                >
                  {updating ? <CircularProgress size={24} color='inherit' /> : 'Submit'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>Do you want to really submit LC?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button onClick={() => setConfirmDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleFinalSubmit}
            variant='contained'
            color='secondary'
            sx={{
              borderRadius: '20px',
              textTransform: 'none'
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <SuccessDialog
        openDialog={successDialogOpen}
        handleClose={() => {
          setSuccessDialogOpen(false)
          if (currentIndex === checklistData.length - 1) {
            router.push('/request-listing')
          } else {
            setActiveTab(checklistData[currentIndex + 1].checklist_master_name)
          }
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

export default LCProcessing
