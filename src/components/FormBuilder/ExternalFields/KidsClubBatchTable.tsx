import React, { useEffect, useRef, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,

  Box,
  Grid,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
  FormControl,
  Checkbox,
  ListItemText
} from '@mui/material'
import { postRequest } from 'src/services/apiService'
import dayjs from 'dayjs'
import ErrorDialogBox from 'src/@core/CustomComponent/ErrorDialogBox/ErrorDialogBox'

interface KidsClubBatchTableProps {
  formData: any
  masterDropDownOptions: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  setRegDisabled?: React.Dispatch<React.SetStateAction<any>>
  slug?: string
}

const KidsClubBatchTable = ({ formData, masterDropDownOptions, setFormData, setRegDisabled, slug }: KidsClubBatchTableProps) => {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedBatches, setSelectedBatches] = useState<Record<string, any[]>>(() => {
    const existing = formData?.batch_selection || formData?.other_details?.batch_selection
    if (Array.isArray(existing) && existing.length > 0) {
      const grouped: Record<string, any[]> = {}
      existing.forEach((batch: any) => {
        const key = String(batch.term_master_id || batch.term_master_name)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(batch)
      })
      return grouped
    }
    return {}
  })
  const [showNoBatchError, setShowNoBatchError] = useState(false)

  const isManualChange = useRef(false)

  useEffect(() => {
    if (rows.length > 0 && !isManualChange.current) {
      const grouped: Record<string, any[]> = {}
      rows.forEach(row => {
        const key = row.term_master_id || row.term_master_name
        if (!grouped[key]) grouped[key] = []
        grouped[key].push(row)
      })

      const initialSelected: Record<string, any[]> = { ...selectedBatches }
      Object.keys(grouped).forEach(key => {
        const stringKey = String(key)
        const existingSelections = (formData?.batch_selection || formData?.other_details?.batch_selection)?.filter(
          (s: any) => String(s.term_master_id || s.term_master_name) === stringKey
        )
        
        if (existingSelections && existingSelections.length > 0) {
          initialSelected[stringKey] = grouped[key].filter((row: any) =>
            existingSelections.some((s: any) => String(s.batch_set_id) === String(row.batch_set_id))
          )
        } else if (!initialSelected[stringKey] || initialSelected[stringKey].length === 0) {
          if (grouped[key].length === 1) {
            initialSelected[stringKey] = [...grouped[key]]
          } else {
            initialSelected[stringKey] = []
          }
        }
      })
      setSelectedBatches(initialSelected)
    }
  }, [rows, formData?.batch_selection, formData?.other_details?.batch_selection])

  useEffect(() => {
    const allSelectedBatches = Object.values(selectedBatches).flat()
    setFormData((prev: any) => {
      const newError = { ...prev.error }
      if (allSelectedBatches.length === 0 && (isManualChange.current || prev.error?.batch_selection)) {
        newError.batch_selection = 'Batch selection is required'
      } else if (allSelectedBatches.length > 0) {
        delete newError.batch_selection
      }

      return {
        ...prev,
        batch_selection: allSelectedBatches,
        error: newError,
        other_details: prev.other_details ? {
          ...prev.other_details,
          batch_selection: allSelectedBatches
        } : prev.other_details
      }
    })
    if (setRegDisabled) {
      setRegDisabled(allSelectedBatches.length === 0)
    }
  }, [selectedBatches, setFormData])

  const getCleanId = (val: any) => {
    if (typeof val === 'string' && val.includes('api/')) return null
    return val
  }

  const rawAcademicYearId = getCleanId(formData?.['academic_year.id'] || formData?.['academic_year'] || formData?.academic_year?.id)
  const rawSchoolId = getCleanId(formData?.['school_location.id'] || formData?.['kidsclub_location.id'] || formData?.['school_location'] || formData?.['kidsclub_location'] || formData?.school_location?.id || formData?.kidsclub_location?.id)
  
  const startDate: any = formData?.['start_date'] || formData?.other_details?.start_date
  const endDate: any = formData?.['end_date'] || formData?.other_details?.end_date
  
  const academicYearObj = masterDropDownOptions?.['academic_year']?.find((opt: any) => Number(opt.id) === Number(rawAcademicYearId))
  let resolvedAcademicYearId = academicYearObj?.attributes?.short_name_two_digit || academicYearObj?.short_name_two_digit || rawAcademicYearId

  if (resolvedAcademicYearId && String(resolvedAcademicYearId).length < 2) {
    const ayValue = formData?.['academic_year.value'] || formData?.academic_year?.value
    if (ayValue && String(ayValue).includes('-')) {
      const parts = String(ayValue).split('-')
      if (parts.length === 2) {
        resolvedAcademicYearId = parts[1].trim() 
      }
    }
  }

  const schoolObj = masterDropDownOptions?.['school_location']?.find((opt: any) => Number(opt.id) === Number(rawSchoolId)) || 
                    masterDropDownOptions?.['kidsclub_location']?.find((opt: any) => Number(opt.id) === Number(rawSchoolId))
  
  const resolvedSchoolId = schoolObj?.attributes?.erp_id || 
                           schoolObj?.attributes?.school_erp_id || 
                           schoolObj?.attributes?.id_erp || 
                           rawSchoolId

  useEffect(() => {
    const isStartValid = startDate && dayjs(startDate).isValid()
    const isEndValid = endDate && dayjs(endDate).isValid()
    const isRangeValid = isStartValid && isEndValid && (dayjs(endDate).isAfter(dayjs(startDate)) || dayjs(endDate).isSame(dayjs(startDate)))

    if (rawAcademicYearId && rawSchoolId && isRangeValid) {
      const fetchBatches = async () => {
        setLoading(true)
        try {
          const params = {
            url: '/batches/kids-club-batches-by-school-id',
            serviceURL: 'academicsBE',
            data: {
              academic_year_id: Number(resolvedAcademicYearId),
              school_id: Number(resolvedSchoolId),
              start_date: startDate ? dayjs(startDate).format('YYYY-MM-DD') : null,
              end_date: endDate ? dayjs(endDate).format('YYYY-MM-DD') : null
            }
          }
          const response: any = await postRequest(params)
          if (response?.success && Array.isArray(response?.data)) {
            setRows(response.data)
            setFormData((prev: any) => ({ ...prev, is_batch_available: response.data.length > 0 }))
            if (setRegDisabled) setRegDisabled(response.data.length === 0)
            const hasExistingSelections = (formData?.batch_selection && formData.batch_selection.length > 0) || 
                                           (formData?.other_details?.batch_selection && formData.other_details.batch_selection.length > 0)
            const isRegistrationStage = slug?.toLowerCase().includes('registration')
            const isExistingEnquiry = !!(formData?.enquiry_number || formData?.id || formData?._id)
            if (response.data.length === 0 && !hasExistingSelections && !isExistingEnquiry && !isRegistrationStage) {
              setShowNoBatchError(true)
            }
          } else {
            setRows([])
            setFormData((prev: any) => ({ ...prev, is_batch_available: false }))
            if (setRegDisabled) setRegDisabled(true)
            const hasExistingSelections = (formData?.batch_selection && formData.batch_selection.length > 0) || 
                                           (formData?.other_details?.batch_selection && formData.other_details.batch_selection.length > 0)
            const isExistingEnquiry = !!(formData?.enquiry_number || formData?.id || formData?._id)
            if (!hasExistingSelections && !isExistingEnquiry) {
              setShowNoBatchError(true)
            }
          }
          
        } catch (error) {
          setRows([])
          setFormData((prev: any) => ({ ...prev, is_batch_available: false }))
          if (setRegDisabled) setRegDisabled(true)
          const hasExistingSelections = (formData?.batch_selection && formData.batch_selection.length > 0) || 
                                         (formData?.other_details?.batch_selection && formData.other_details.batch_selection.length > 0)
          const isExistingEnquiry = !!(formData?.enquiry_number || formData?.id || formData?._id)
          if (!hasExistingSelections && !isExistingEnquiry) {
            setShowNoBatchError(true)
          }
        } finally {
          setLoading(false)
        }
      }
      fetchBatches()
    } else {
      if (rows.length > 0) setRows([])
    }
  }, [rawAcademicYearId, rawSchoolId, startDate, endDate])

  const renderContent = () => {
    if (!rawAcademicYearId || !rawSchoolId || !startDate || !endDate) {
      return (
        <TableRow>
          <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
            <Typography variant='body1' sx={{ color: '#999', fontWeight: 500 }}>
              Select School, Academic Year, Start and End Date to see batches
            </Typography>
          </TableCell>
        </TableRow>
      )
    }

    if (loading) {
      return (
        <TableRow>
          <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
            <CircularProgress size={30} thickness={4} sx={{ color: '#666' }} />
            <Typography variant='body2' sx={{ mt: 1, color: '#666' }}>
              Fetching batches...
            </Typography>
          </TableCell>
        </TableRow>
      )
    }

    if (rows.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} align='center' sx={{ py: 8 }}>
            <Typography variant='body1' sx={{ color: '#999', fontWeight: 500 }}>
              No batches found for the selected criteria
            </Typography>
          </TableCell>
        </TableRow>
      )
    }

    const groupedData: Record<string, any> = {}
    rows.forEach(row => {
      const key = row.term_master_id || row.term_master_name
      if (!groupedData[key]) {
        groupedData[key] = {
          term_master_name: row.term_master_name,
          start_date: row.start_date,
          end_date: row.end_date,
          batches: []
        }
      }
      groupedData[key].batches.push(row)
    })

    return Object.keys(groupedData).map((termKey, index) => {
      const termData = groupedData[termKey]
      const selectedTermBatches = selectedBatches[termKey] || []

      const safeBatches = Array.isArray(selectedTermBatches) ? selectedTermBatches : []

      const totalHours = safeBatches
        .reduce((sum, batch) => sum + parseFloat(batch?.total_hours || '0'), 0)
        .toFixed(2)

      return (
        <TableRow
          key={index}
          sx={{
            '&:last-child td, &:last-child th': { border: 0 },
            '& td': { py: 2, verticalAlign: 'middle' }
          }}
        >
          <TableCell component='th' scope='row' sx={{ color: '#666', fontWeight: 500 }}>
            {termData.term_master_name || 'N/A'}
          </TableCell>
          <TableCell sx={{ color: '#666' }}>
            {termData.start_date ? dayjs(termData.start_date).format('DD/MM/YY') : 'N/A'}
          </TableCell>
          <TableCell sx={{ color: '#666' }}>
            {termData.end_date ? dayjs(termData.end_date).format('DD/MM/YY') : 'N/A'}
          </TableCell>
          <TableCell>
            <TextField
              size='small'
              label='No. Of Hours'
              value={totalHours}
              InputProps={{ readOnly: true }}
              sx={{
                width: '120px',
                '& .MuiInputLabel-root': { fontSize: '0.875rem' },
                '& .MuiOutlinedInput-root': { borderRadius: '8px', backgroundColor: '#f9f9f9' }
              }}
            />
          </TableCell>
          <TableCell>
            <FormControl fullWidth size='small' sx={{ minWidth: '300px' }}>
              <Select
                multiple
                displayEmpty
                value={safeBatches.map(b => b.batch_set_id)}
                onChange={e => {
                  isManualChange.current = true
                  const val = e.target.value as any[]
                  const selected = termData.batches.filter((b: any) => val.includes(b.batch_set_id))
                  setSelectedBatches(prev => ({ ...prev, [termKey]: selected }))
                }}
                renderValue={selectedIds => {
                  if ((selectedIds as any[]).length === 0) {
                    return (
                      <Typography variant='body2' sx={{ color: '#aaa' }}>
                        Select Batch
                      </Typography>
                    )
                  }
                  return (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {(selectedIds as any[]).map(id => {
                        const batch = termData.batches.find((b: any) => b.batch_set_id === id)
                        if (!batch) return null
                        return (
                          <Box
                            key={id}
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              backgroundColor: '#f0f4ff',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: '6px',
                              border: '1px solid #d0d9ff',
                              minWidth: 'fit-content'
                            }}
                          >
                            <Typography
                              variant='body2'
                              sx={{ fontWeight: 600, color: '#3f51b5', fontSize: '0.8125rem', lineHeight: 1.2 }}
                            >
                              {`${batch.start_time} To ${batch.end_time}`}
                            </Typography>
                            <Typography variant='caption' sx={{ color: '#666', fontSize: '0.75rem', lineHeight: 1.2 }}>
                              {batch.batch_name}
                            </Typography>
                          </Box>
                        )
                      })}
                    </Box>
                  )
                }}
                sx={{
                  borderRadius: '8px',
                  backgroundColor: '#fff',
                  '& .MuiSelect-select': { py: 1.5 }
                }}
              >
                {termData.batches.map((batch: any) => (
                  <MenuItem key={batch.batch_set_id} value={batch.batch_set_id}>
                    <Checkbox checked={safeBatches.some(b => b.batch_set_id === batch.batch_set_id)} />
                    <ListItemText
                      primary={`${batch.start_time} To ${batch.end_time}`}
                      secondary={batch.batch_name}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </TableCell>
        </TableRow>
      )
    })
  }

  return (
    <Grid item xs={12}>
      <Box sx={{ mt: 2, mb: 4, width: '100%' }}>
        <TableContainer
          component={Paper}
          elevation={0}
          sx={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#fff'
          }}
        >
          <Table sx={{ minWidth: 800 }} aria-label='kids club batch table'>
            <TableHead sx={{ backgroundColor: '#f0f2f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#555', py: 1.5 }}>Academic Term</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#555', py: 1.5 }}>Start Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#555', py: 1.5 }}>End Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#555', py: 1.5 }}>No. Of Hours</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#555', py: 1.5 }}>Batch</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{renderContent()}</TableBody>
          </Table>
        </TableContainer>
      </Box>
      <ErrorDialogBox
        openDialog={showNoBatchError}
        handleClose={() => {
          setShowNoBatchError(false)
          setRows([])
          setFormData((prev: any) => ({
            ...prev,
            'academic_year.id': null,
            'academic_year': null,
            'school_location.id': null,
            'school_location': null,
            'kidsclub_location.id': null,
            'kidsclub_location': null,
            'start_date': null,
            'end_date': null,
            'batch_selection': [],
            'is_batch_available': false
          }))
        }}
        title='Batches not available'
      />
      {formData?.error?.['batch_selection'] && (
        <Typography color='error' variant='caption' sx={{ ml: 1, mt: 1, display: 'block' }}>
          {formData?.error?.['batch_selection']}
        </Typography>
      )}
    </Grid>
  )
}

export default KidsClubBatchTable
