'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton
} from '@mui/material'
import { DataGrid } from '@mui/x-data-grid'
import { getRequest, postRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined'
import CloseIcon from '@mui/icons-material/Close'


interface ReferralRow {
  id: string
  enquiryid: string
  student_name: string
  enquiry_number: string
  enrollment_number: string
  parent_name: string
  parent_number: string
  academic_year: string
  school: string
  grade: string
  board: string
  leadOwner: string
  enquirySource: string
  enquirySubSource: string
  sourceName: string
  status: string
  referrerPhone?: string
  referralPhone?: string
  referrerVerified?: boolean
  referralVerified?: boolean
  referrerManuallyVerified?: boolean
  referralManuallyVerified?: boolean
  referrerManuallyRejected?: boolean      
  referralManuallyRejected?: boolean      
  referrerRejectionReason?: string        
  referralRejectionReason?: string        
}

const ReferralListing = () => {
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [filteredReferrals, setFilteredReferrals] = useState<ReferralRow[]>([])
  // const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [verifyDialog, setVerifyDialog] = useState<{ open: boolean; row: ReferralRow | null }>({
    open: false,
    row: null
  })
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; row: ReferralRow | null }>({
    open: false,
    row: null
  })
  const [verifying, setVerifying] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState('')
  const { setGlobalState, setPagePaths } = useGlobalContext()

  // Function to determine status based on verification flags
  const determineStatus = (row: ReferralRow): string => {
    // Check if manually rejected
    if (row.referrerManuallyRejected || row.referralManuallyRejected) {
      return 'Rejected'
    }

    const referrerVerified = row.referrerVerified || row.referrerManuallyVerified
    const referralVerified = row.referralVerified || row.referralManuallyVerified

    // Both verified
    if (referrerVerified && referralVerified) {
      return 'Both Verified'
    }

    // Only referrer verified
    if (referrerVerified && !referralVerified) {
      return 'Referrer Verified'
    }

    // Only referral verified
    if (!referrerVerified && referralVerified) {
      return 'Referral Verified'
    }

    // Check for phone mismatch
    if (row.referrerPhone && row.referralPhone) {
      const normalizePhone = (phone: string) => phone.replace(/\D/g, '').slice(-10)
      const referrerNormalized = normalizePhone(row.referrerPhone)
      const referralNormalized = normalizePhone(row.referralPhone)
      
      if (referrerNormalized !== referralNormalized) {
        return 'Phone Mismatch'
      }
    }

    // Default to pending
    return 'Pending'
  }

  const handleVerify = async (row: ReferralRow) => {
    setVerifyDialog({ open: true, row })
    setError('')
  }

  const handleRejectClick = (row: ReferralRow) => {
    setVerifyDialog({ open: false, row: null })
    setRejectDialog({ open: true, row })
    setRejectReason('')
    setError('')
  }

  const handleCloseVerifyDialog = () => {
    if (verifying) return
    setVerifyDialog({ open: false, row: null })
    setError('')
  }

  const handleCloseRejectDialog = () => {
    if (rejecting) return
    setRejectDialog({ open: false, row: null })
    setRejectReason('')
    setError('')
  }

  const confirmVerification = async () => {
    if (!verifyDialog.row) return

    setVerifying(true)
    setError('')

    try {
      const params = {
        url: `marketing/enquiry/verifyReferralManually`,
        data: {
          enquiryId: verifyDialog.row.enquiryid,
          verificationType: 'both',
          verifiedBy: 'Admin',
          action: 'verify'
        }
      }
      
      const response = await postRequest(params)

      if (response?.success) {
        // Refresh the data to get updated status
        await fetchReferrals()
        handleCloseVerifyDialog()
      }
    } catch (err: any) {
      console.error('Error verifying referral:', err)
      setError(err?.response?.data?.message || 'Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const confirmRejection = async () => {
    if (!rejectDialog.row) return
    
    if (!rejectReason.trim()) {
      setError('Please provide a reason for rejection')

      return
    }

    setRejecting(true)
    setError('')

    try {
      const params = {
        url: `marketing/enquiry/rejectReferralManually`,
        data: {
          enquiryId: rejectDialog.row.enquiryid,
          rejectedBy: 'Admin',
          rejectionReason: rejectReason
        }
      }
      
      const response = await postRequest(params)

      if (response?.success) {
        // Refresh the data to get updated status
        await fetchReferrals()
        handleCloseRejectDialog()
      }
    } catch (err: any) {
      console.error('Error rejecting referral:', err)
      setError(err?.response?.data?.message || 'Rejection failed. Please try again.')
    } finally {
      setRejecting(false)
    }
  }

  const columns = useMemo(
    () => [
      { 
        field: 'student_name', 
        headerName: 'Name of the Student', 
        width: 180,
        pinned: 'left'
      },
      { 
        field: 'enquiry_number', 
        headerName: 'Enrollment Number', 
        width: 150,
        pinned: 'left'
      },
      { field: 'parent_name', headerName: 'Parent Name', width: 160 },
      { field: 'parent_number', headerName: 'Parent Phone Number', width: 180 },
      { field: 'academic_year', headerName: 'Admission - Academic Year', width: 200 },
      { field: 'school', headerName: 'School', width: 160 },
      { field: 'grade', headerName: 'Grade', width: 120 },
      { field: 'board', headerName: 'Board', width: 120 },
      { field: 'leadOwner', headerName: 'Lead Owner', width: 160 },
      { field: 'enquirySource', headerName: 'Enquiry Source', width: 160 },
      { field: 'enquirySubSource', headerName: 'Enquiry Sub-source', width: 180 },
      { field: 'sourceName', headerName: 'Source Name', width: 160 },
      {
        field: 'status',
        headerName: 'Status',
        width: 180,
        renderCell: (params: { row: ReferralRow }) => {
          const status = determineStatus(params.row)
          
          const statusMap: Record<string, { bg: string; color: string; label: string }> = {
            'Both Verified': { 
              bg: '#d4edda', 
              color: '#155724', 
              label: 'Both Verified' 
            },
            'Referrer Verified': { 
              bg: '#d1ecf1', 
              color: '#0c5460', 
              label: 'Referrer Verified' 
            },
            'Referral Verified': { 
              bg: '#fff3cd', 
              color: '#856404', 
              label: 'Referral Verified' 
            },
            'Phone Mismatch': { 
              bg: '#f8d7da', 
              color: '#721c24', 
              label: 'Phone Mismatch' 
            },
            'Pending': { 
              bg: '#e2e3e5', 
              color: '#383d41', 
              label: 'Pending' 
            },
            'Rejected': {
              bg: '#f8d7da',
              color: '#721c24',
              label: 'Rejected'
            }
          }

          const style = statusMap[status] || { 
            bg: '#f0f0f0', 
            color: '#000', 
            label: status 
          }

          return (
            <Tooltip
              arrow
              componentsProps={{
                tooltip: {
                  sx: {
                    backgroundColor: '#000000', 
                    color: '#ffffff !important', 
                    fontSize: '13px',
                    p: 1.5,
                    borderRadius: '6px'
                  }
                }
              }}
              title={
                <Box sx={{ color: '#ffffff !important' }}>
                  <Typography
                    variant='caption'
                    display='block'
                    sx={{ color: '#ffffff !important', opacity: 1, fontWeight: 500 }}
                  >
                    Referrer: {params.row.referrerPhone || 'N/A'}
                    {params.row.referrerVerified && ' ✓'}
                    {params.row.referrerManuallyVerified && ' (Manual)'}
                    {params.row.referrerManuallyRejected && ' ✗ Rejected'}
                  </Typography>
                  <Typography
                    variant='caption'
                    display='block'
                    sx={{ color: '#ffffff !important', opacity: 1, fontWeight: 500 }}
                  >
                    Referral: {params.row.referralPhone || 'N/A'}
                    {params.row.referralVerified && ' ✓'}
                    {params.row.referralManuallyVerified && ' (Manual)'}
                    {params.row.referralManuallyRejected && ' ✗ Rejected'}
                  </Typography>
                  {(params.row.referrerManuallyRejected || params.row.referralManuallyRejected) && (
                    <Typography
                      variant='caption'
                      display='block'
                      sx={{ color: '#ff6b6b !important', opacity: 1, fontWeight: 600, mt: 0.5 }}
                    >
                      Reason: {params.row.referrerRejectionReason || params.row.referralRejectionReason || 'N/A'}
                    </Typography>
                  )}
                </Box>
              }
            >
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderRadius: '45px',
                  px: 3,
                  py: 1.5,
                  display: 'inline-block',
                  backgroundColor: style.bg,
                  color: style.color,
                  textAlign: 'center',
                  textTransform: 'none',
                  cursor: 'help'
                }}
              >
                {style.label}
              </Typography>
            </Tooltip>
          )
        }
      },
      {
        field: 'action',
        headerName: 'Action',
        width: 120,
        sortable: false,
        pinned: 'right',
        renderCell: (params: { row: ReferralRow }) => {
          const status = determineStatus(params.row)

          if (status === 'Both Verified') {
            return (
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid green',
                  color: 'green',
                  backgroundColor: 'rgba(0,128,0,0.10)',
                  px: 4.5,
                  py: 2.5,
                  borderRadius: '45px',
                  display: 'inline-block',
                  textTransform: 'none'
                }}
              >
                Verified
              </Typography>
            )
          }

          if (status === 'Rejected') {
            return (
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  border: '1px solid #dc3545',
                  color: '#dc3545',
                  backgroundColor: 'rgba(220,53,69,0.10)',
                  px: 4.5,
                  py: 2.5,
                  borderRadius: '45px',
                  display: 'inline-block',
                  textTransform: 'none'
                }}
              >
                Rejected
              </Typography>
            )
          }

          const isPhoneMismatch = status === 'Phone Mismatch'

          return (
            <Button
              variant='outlined'
              size='small'
              sx={{
                borderColor: isPhoneMismatch ? 'grey' : 'green',
                color: isPhoneMismatch ? 'grey' : 'green',
                textTransform: 'none',
                borderRadius: '20px',
                px: 1.5,
                fontSize: '0.70rem',
                '&:hover': {
                  borderColor: isPhoneMismatch ? 'grey' : 'darkgreen',
                  backgroundColor: isPhoneMismatch ? 'transparent' : 'rgba(0,128,0,0.1)'
                }
              }}
              onClick={() => handleVerify(params.row)}
            >
              Verify
            </Button>
          )
        }

      }
    ],
    []
  )

  const fetchReferrals = async () => {
    // setLoading(true)
    setGlobalState({ isLoading: true })

    try {
      // Changed endpoint to get ALL referrals, not just successful ones
      const params = { url: `marketing/enquiry/getAllReferrals` }
      const response = await getRequest(params)

      if (Array.isArray(response?.data)) {
        const formatted = response.data.map((item: any, index: number) => ({
          id: item.enquiryid || index + 1,
          ...item
        })).reverse()

        console.log('Formatted referrals:', formatted)
        setReferrals(formatted)
        setFilteredReferrals(formatted)
      } else {
        setReferrals([])
        setFilteredReferrals([])
      }
    } catch (err) {
      console.error('Error fetching referrals:', err)
      // If getAllReferrals doesn't exist, fallback to original endpoint test
      try {
        const params = { url: `marketing/enquiry/getAllReferrals` }
        const response = await getRequest(params)

        if (Array.isArray(response?.data)) {
          const formatted = response.data.map((item: any, index: number) => ({
            id: item.enquiryid || index + 1,
            ...item
          })).reverse()

          setReferrals(formatted)
          setFilteredReferrals(formatted)
        }
      } catch (fallbackErr) {
        console.error('Error with fallback fetch:', fallbackErr)
      }
    } finally {
      // setLoading(false)
      setGlobalState({ isLoading: false })
    }
  }

  useEffect(() => {
    setPagePaths([{ title: 'Referral Listing', path: '/referral-listing' }])
  }, [])

  useEffect(() => {
    fetchReferrals()
  }, [])

  const handleSearchChange = (value: string) => {
    setSearch(value)
    const filtered = referrals.filter(r =>
      r.student_name?.toLowerCase().includes(value.toLowerCase()) ||
      r.enquiry_number?.toLowerCase().includes(value.toLowerCase()) ||
      r.parent_name?.toLowerCase().includes(value.toLowerCase())
    )
    setFilteredReferrals(filtered)
  }

  const handleExportCSV = () => {
    if (!filteredReferrals.length) return

    const headers = columns
      .filter((col: any) => col.field !== 'action')
      .map((col: any) => col.headerName)

    const rows = filteredReferrals.map(row => {
      return columns
        .filter((col: any) => col.field !== 'action')
        .map((col: any) => {
          if (col.field === 'status') {
            return `"${determineStatus(row)}"`
          }
          const value = row[col.field as keyof ReferralRow]
          if (value === null || value === undefined) return ''
          const stringValue = String(value).replace(/"/g, '""')

          return `"${stringValue}"`
        })
        .join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `referral_list_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const normalizePhoneDisplay = (phone: string) => {
    if (!phone) return 'N/A'

    return phone.replace(/\D/g, '').slice(-10)
  }

  return (
    <Box
      sx={{
        maxWidth: '100%',
        mx: 'auto',
        mt: 4,
        p: 3,
        backgroundColor: '#fff',
        borderRadius: 2,
        boxShadow: 3
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}
      >
        <TextField
          size="small"
          placeholder="Search by Student Name, Enquiry Number, or Parent Name"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{
            minWidth: '55%',
            width: { xs: '100%', sm: '250px', md: '300px' },
            '& .MuiOutlinedInput-root': {
              borderRadius: '30px'
            }
          }}
        />
        <Tooltip title='Export CSV' arrow>
          <Button
            variant='text'
            sx={{
              minWidth: '20px',
              marginRight: '20px',
              borderRadius: '30%',
              border: '1px solid gray',
              padding: 2,
              color: 'gray'
            }}
            onClick={handleExportCSV}
          >
            <FileDownloadOutlinedIcon />
          </Button>
        </Tooltip>
      </Box>

      {/* {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : ( */}
        <DataGrid
          rows={filteredReferrals}
          columns={columns}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } }
          }}
          sx={{
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: '#f5f5f5',
              fontWeight: 600
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              py: 1
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: '#fafafa'
              }
            },
            '& .MuiDataGrid-virtualScroller': {
              overflowX: 'auto !important'
            }
          }}
        />
      {/* )} */}

      {/* Verification Dialog */}
      <Dialog 
        open={verifyDialog.open} 
        onClose={handleCloseVerifyDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 1,
            pt: 2,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            Verify Referral
          </Typography>
          <IconButton
            onClick={handleCloseVerifyDialog}
            disabled={verifying}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {error && (
          <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
            {error}
          </Alert>
        )}

        <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            Student Information
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Enrollment Number
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {verifyDialog.row?.enrollment_number || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Student Name
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {verifyDialog.row?.student_name || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Academic Year
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {verifyDialog.row?.academic_year || '-'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 3, mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                School
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {verifyDialog.row?.school || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Board
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {verifyDialog.row?.board || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                Grade
              </Typography>
              <Typography sx={{ fontSize: '0.95rem' }}>
                {verifyDialog.row?.grade || '-'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Parent Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Name
                </Typography>
                <Typography sx={{ fontSize: '0.95rem' }}>
                  {verifyDialog.row?.parent_name || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Phone Number
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {normalizePhoneDisplay(verifyDialog.row?.parent_number || '')}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderTop: '1px solid #e0e0e0', pt: 2, mt: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Referrer Information
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Name
                </Typography>
                <Typography sx={{ fontSize: '0.95rem' }}>
                  {verifyDialog.row?.sourceName || '-'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 600, display: 'block', mb: 0.5 }}>
                  Phone Number
                </Typography>
                <Typography sx={{ fontSize: '0.95rem', fontWeight: 600 }}>
                  {normalizePhoneDisplay(verifyDialog.row?.referrerPhone || '')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #e0e0e0', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button 
            onClick={() => handleRejectClick(verifyDialog.row!)} 
            variant="outlined" 
            color="error" 
            disabled={verifying}
            sx={{ 
              textTransform: 'none',
              px: 4,
              py: 1,
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            Reject
          </Button>
          <Button 
            onClick={confirmVerification} 
            variant="contained" 
            color="primary"
            disabled={verifying}
            sx={{ 
              textTransform: 'none',
              px: 4,
              py: 1,
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            {verifying ? <CircularProgress size={20} color="inherit" /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog 
        open={rejectDialog.open} 
        onClose={handleCloseRejectDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            pb: 1,
            pt: 2,
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#d32f2f' }}>
            Add Reason
          </Typography>
          <IconButton
            onClick={handleCloseRejectDialog}
            disabled={rejecting}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {error && (
          <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
            {error}
          </Alert>
        )}

        <DialogContent sx={{ pt: 3, px: 3, pb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1.5, color: '#666', fontWeight: 500 }}>
            Please provide a reason for rejecting this referral:
          </Typography>
          <TextField
            placeholder="Enter rejection reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            fullWidth
            multiline
            rows={4}
            autoFocus
            variant="outlined"
            InputProps={{
              sx: {
                alignItems: 'flex-start',
                '& textarea': {
                  paddingTop: '12px'
                }
              }
            }}
            sx={{ 
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#d32f2f',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#d32f2f',
                }
              }
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid #e0e0e0', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleCloseRejectDialog} 
            variant="outlined"
            disabled={rejecting}
            sx={{ 
              textTransform: 'none',
              px: 4,
              py: 1,
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmRejection} 
            variant="contained"
            color="error"
            disabled={rejecting || !rejectReason.trim()}
            sx={{ 
              textTransform: 'none',
              px: 4,
              py: 1,
              borderRadius: '8px',
              fontWeight: 500
            }}
          >
            {rejecting ? <CircularProgress size={20} color="inherit" /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ReferralListing