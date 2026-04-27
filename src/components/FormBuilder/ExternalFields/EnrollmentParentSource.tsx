import { useState, useEffect, useMemo } from 'react'
import { Autocomplete, TextField, Box, Typography, Chip } from '@mui/material'
import { getRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import debounce from 'lodash.debounce'
import { useRouter } from 'next/router'

interface ParentDetails {
  global_id?: string
  first_name?: string
  last_name?: string
  mobile?: string
  email?: string
  country_code?: number
}

interface EnrollmentOption {
  id: string
  enrollment_number: string
  parent_phone: string
  parent_name?: string
  academic_year?: string
  student_name?: string
  parent_details?: {
    father?: ParentDetails
    mother?: ParentDetails
    guardian?: ParentDetails
  }
}

interface ParentOption {
  id: string
  enrollment_number: string
  academic_year?: string
  student_name?: string
  parent_type: 'Father' | 'Mother' | 'Guardian'
  parent_name: string
  parent_phone: string
  parent_email?: string
  original_data: EnrollmentOption
}

const EnrollmentParentSource = ({ EnrollmentParentSource, handleChange, formData, setFormData }: any) => {
  const [flatOptions, setFlatOptions] = useState<ParentOption[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedOption, setSelectedOption] = useState<ParentOption | null>(null)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { setGlobalState } = useGlobalContext()

  const buildParentName = (enq?: EnrollmentOption): string => {
    if (!enq) return ''
    if (enq.parent_name?.trim()) return enq.parent_name.trim()
    const nameFrom = (p?: { first_name?: string; last_name?: string }) =>
      p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() : ''
    return (
      nameFrom(enq.parent_details?.father_details) ||
      nameFrom(enq.parent_details?.mother_details) ||
      nameFrom(enq.parent_details?.guardian_details) ||
      ''
    )
  }

  // Pre-load when editing an existing record — read from formData.referral_source directly
  useEffect(() => {
    const referral = formData?.referral_source
    if (referral?.type === 'parent' && referral?.id && !selectedOption) {
      const fetchById = async () => {
        try {
          setGlobalState({ isLoading: true })
          const params = {
            url: `marketing/enquiry/getEnrollmentAndParentNumber?search=${encodeURIComponent(referral.meta?.enrollment_number || referral.id)}`
          }
          const res = await getRequest(params)
          const data = Array.isArray(res?.data) ? res.data : []
          const found = data.find((p: any) => String(p.id) === String(referral.id))
          if (found) {
            setSelectedOption(found)
            setInputValue(found.parent_phone || '')
            setOptions([found])
          }
        } catch (err) {
          // console.error('Error pre-loading parent:', err)
        } finally {
          setGlobalState({ isLoading: false })
        }
      }
      fetchById()
    }
  }, [])

  // Reset when sub-source type is changed away from Parent
  useEffect(() => {
    if (!EnrollmentParentSource) {
      setSelectedOption(null)
      setInputValue('')
      setOptions([])
    }
  }, [EnrollmentParentSource])

  const fetchOptions = async (search: string) => {
    if (!EnrollmentParentSource) return
    try {
      setGlobalState({ isLoading: true })
      const encoded = encodeURIComponent(search)
      const params = { url: `marketing/enquiry/getEnrollmentAndParentNumber?search=${encoded}` }
      const res = await getRequest(params)
      const data = Array.isArray(res?.data) ? res.data : []
      const flattened = flattenToParentOptions(data)
      setFlatOptions(flattened)
      return flattened
    } catch (err) {
      // console.error('Error fetching parent source:', err)
      setOptions([])
    } finally {
      setGlobalState({ isLoading: false })
    }
  }

  const debouncedFetch = useMemo(() => debounce(fetchOptions, 300), [EnrollmentParentSource])

  useEffect(() => {
    return () => debouncedFetch.cancel()
  }, [debouncedFetch])

  // **NEW: Fetch enquiry details and populate parent source**
  useEffect(() => {
    const fetchEnquiryDetails = async () => {
      // Wait for router to be ready and enquiryId to be available
      if (!router.isReady || !isInitialLoad || !enquiryId || typeof enquiryId !== 'string') return

      try {
        setGlobalState({ isLoading: true })

        // Fetch the enquiry details using the enquiry ID from URL
        const params = { url: `marketing/enquiry/${enquiryId}` }
        const res = await getRequest(params)

        if (res?.data?.enquiry_parent_source) {
          const parentSource = res.data.enquiry_parent_source

          // Extract parent source details
          const parentSourceId = parentSource.id
          const parentSourcePhone = parentSource.value
          const parentSourceName = parentSource.name
          const parentSourceEnrollment = parentSource.enquirynumber
          const parentType = res.data.parent_type // From root level of response

          // Try to fetch full details from search API
          if (parentSourceEnrollment) {
            const encoded = encodeURIComponent(parentSourceEnrollment)
            const searchParams = { url: `marketing/enquiry/getEnrollmentAndParentNumber?search=${encoded}` }
            const searchRes = await getRequest(searchParams)
            const searchData = Array.isArray(searchRes?.data) ? searchRes.data : []

            if (searchData.length > 0) {
              const flattened = flattenToParentOptions(searchData)
              setFlatOptions(flattened)

              // Find the matching option based on enrollment number and parent type
              const found = flattened.find(opt => {
                const matchesEnrollment = opt.enrollment_number === parentSourceEnrollment
                const matchesPhone = opt.parent_phone === parentSourcePhone
                const matchesType = parentType ? opt.parent_type === parentType : true

                return matchesEnrollment && matchesPhone && matchesType
              })

              if (found) {
                setSelectedOption(found)
                setInputValue(`${found.enrollment_number} | ${found.parent_phone}`)

                // Update formData with full details
                setFormData((prev: any) => ({
                  ...prev,
                  'enquiry_parent_source.id': parentSourceId,
                  'enquiry_parent_source.value': parentSourcePhone,
                  'enquiry_parent_source.enquirynumber': parentSourceEnrollment,
                  'enquiry_parent_source.name': parentSourceName,
                  'enquiry_parent_source.parent_type': found.parent_type,
                  'enquiry_parent_source.parent_email': found.parent_email || ''
                }))

                setIsInitialLoad(false)
                setGlobalState({ isLoading: false })
                return
              }
            }
          }

          // If not found in search API, create manual option from enquiry data
          if (parentSourcePhone && parentSourceEnrollment && parentSourceName) {
            const manualOption: ParentOption = {
              id: `${parentSourceId}-${parentType?.toLowerCase() || 'parent'}`,
              enrollment_number: parentSourceEnrollment,
              academic_year: undefined,
              student_name: undefined,
              parent_type: (parentType as 'Father' | 'Mother' | 'Guardian') || 'Father',
              parent_name: parentSourceName,
              parent_phone: parentSourcePhone,
              parent_email: undefined,
              original_data: {
                id: parentSourceId,
                enrollment_number: parentSourceEnrollment,
                parent_phone: parentSourcePhone,
                parent_name: parentSourceName
              } as EnrollmentOption
            }

            setFlatOptions([manualOption])
            setSelectedOption(manualOption)
            setInputValue(`${manualOption.enrollment_number} | ${manualOption.parent_phone}`)

            // Update formData
            setFormData((prev: any) => ({
              ...prev,
              'enquiry_parent_source.id': parentSourceId,
              'enquiry_parent_source.value': parentSourcePhone,
              'enquiry_parent_source.enquirynumber': parentSourceEnrollment,
              'enquiry_parent_source.name': parentSourceName,
              'enquiry_parent_source.parent_type': parentType || 'Father',
              'enquiry_parent_source.parent_email': ''
            }))
          }
        }
      } catch (err) {
      } finally {
        setGlobalState({ isLoading: false })
        setIsInitialLoad(false)
      }
    }

    fetchEnquiryDetails()
  }, [router.isReady, enquiryId])

  const selectedDisplay = selectedOption ? `${selectedOption.enrollment_number} | ${selectedOption.parent_phone}` : ''

  return (
    <Autocomplete
      options={flatOptions}
      getOptionLabel={option => `${option.enrollment_number || ''} | ${option.parent_phone || ''}`}
      value={selectedOption}
      inputValue={inputValue}
      onInputChange={(e, newInputValue, reason) => {
        if (reason === 'input') {
          setInputValue(newInputValue)
          const trimmed = (newInputValue || '').trim()
          if (trimmed && trimmed !== selectedDisplay) {
            debouncedFetch(trimmed)
          } else if (!trimmed) {
            setFlatOptions([])
          }
        } else if (reason === 'clear') {
          setInputValue('')
          setSelectedOption(null)
          setFormData((prev: any) => ({
            ...prev,
            'enquiry_parent_source.id': '',
            'enquiry_parent_source.value': '',
            'enquiry_parent_source.parent_type': '',
            'enquiry_parent_source.enquirynumber': '',
            'enquiry_parent_source.name': '',
            'enquiry_parent_source.parent_email': ''
          }))
        }
      }}
      onChange={(e, newValue) => {
        if (!newValue) {
          setSelectedOption(null)
          setInputValue('')
          setFormData((prev: any) => ({
            ...prev,
            'enquiry_parent_source.id': '',
            'enquiry_parent_source.value': '',
            'enquiry_parent_source.parent_type': '',
            'enquiry_parent_source.enquirynumber': '',
            'enquiry_parent_source.name': '',
            'enquiry_parent_source.parent_email': ''
          }))
          return
        }

        setSelectedOption(newValue)
        setInputValue(`${newValue.enrollment_number} | ${newValue.parent_phone}`)

        handleChange('enquiry_parent_source', newValue.id, [], false, null, {
          name: 'enquiry_parent_source',
          input_type: 'masterDropdownExternal',
          masterOptions: flatOptions,
          type: 'extFields',
          keyMap: 'id'
        })

        setFormData((prev: any) => ({
          ...prev,
          'enquiry_parent_source.id': newValue.original_data.id,
          'enquiry_parent_source.value': newValue.parent_phone,
          'enquiry_parent_source.enquirynumber': newValue.enrollment_number,
          'enquiry_parent_source.name': newValue.parent_name,
          'enquiry_parent_source.parent_type': newValue.parent_type,
          'enquiry_parent_source.parent_email': newValue.parent_email || ''
        }))
      }}
      renderOption={(props, option) => {
        const year = option.academic_year || '—'
        const chipColor =
          option.parent_type === 'Father'
            ? { bg: '#e3f2fd', color: '#1565c0' }
            : option.parent_type === 'Mother'
            ? { bg: '#fce4ec', color: '#c2185b' }
            : { bg: '#f3e5f5', color: '#7b1fa2' }

        return (
          <Box
            component='li'
            {...props}
            key={option.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              py: 1,
              px: 1.25,
              borderBottom: '1px solid #f0f0f0'
            }}
          >
            <Box display='flex' justifyContent='space-between' alignItems='center'>
              <Box display='flex' alignItems='center' gap={1}>
                <Chip
                  label={option.parent_type}
                  size='small'
                  sx={{
                    height: '22px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    backgroundColor: chipColor.bg,
                    color: chipColor.color
                  }}
                />
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'black' }}>
                  {option.parent_name || '—'}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.85rem', color: '#1565c0', flexShrink: 0 }}>({year})</Typography>
            </Box>

            <Typography sx={{ fontSize: '0.9rem', color: '#424242', mt: 0.5 }}>
              <strong>Contact:</strong> {option.parent_phone || '—'}
            </Typography>
            {option.parent_email && (
              <Typography sx={{ fontSize: '0.85rem', color: '#666', mt: 0.25 }}>
                <strong>Email:</strong> {option.parent_email}
              </Typography>
            )}
            <Typography sx={{ fontSize: '0.85rem', color: '#757575', mt: 0.25 }}>
              Enrollment: {option.enrollment_number || '—'}
            </Typography>
          </Box>
        )
      }}
      renderInput={params => {
        const selectedAdornment = selectedOption ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              overflow: 'hidden',
              lineHeight: 1.05,
              scale: '0.85'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
              <Box display='flex' alignItems='center' gap={0.5}>
                <Chip
                  label={selectedOption.parent_type}
                  size='small'
                  sx={{
                    height: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor:
                      selectedOption.parent_type === 'Father'
                        ? '#e3f2fd'
                        : selectedOption.parent_type === 'Mother'
                        ? '#fce4ec'
                        : '#f3e5f5',
                    color:
                      selectedOption.parent_type === 'Father'
                        ? '#1565c0'
                        : selectedOption.parent_type === 'Mother'
                        ? '#c2185b'
                        : '#7b1fa2'
                  }}
                />
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'black',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {selectedOption.parent_name || '—'}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.95rem', color: '#1565c0', flexShrink: 0 }}>
                ({selectedOption.academic_year || '—'})
              </Typography>
            </Box>

            <Typography
              sx={{ fontSize: '0.9rem', color: '#424242', mt: 0.4, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              <strong>Contact:</strong> {selectedOption.parent_phone || '—'}
            </Typography>
            <Typography
              sx={{ fontSize: '0.85rem', color: '#757575', mt: 0.15, overflow: 'hidden', textOverflow: 'ellipsis' }}
            >
              Enrollment: {selectedOption.enrollment_number || '—'}
            </Typography>
          </Box>
        ) : null

        return (
          <TextField
            {...params}
            label='Search Parent No. / Enrollment Number'
            variant='outlined'
            required
            error={Boolean(formData?.error?.['enquiry_parent_source'])}
            helperText={formData?.error?.['enquiry_parent_source']}
            InputProps={{
              ...params.InputProps,
              startAdornment: selectedAdornment ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    pl: 1,
                    pr: 1,
                    py: 0.5,
                    overflow: 'hidden',
                    height: '50px'
                  }}
                >
                  {selectedAdornment}
                </Box>
              ) : (
                params.InputProps.startAdornment
              )
            }}
            sx={{
              '& .MuiInputBase-root': {
                alignItems: 'flex-start',
                maxHeight: '56px',
                height: '56px'
              },
              '& .MuiInputBase-input': {
                display: selectedOption ? 'none' : 'block'
              }
            }}
          />
        )
      }}
      clearOnEscape
      disableClearable={false}
      fullWidth
      sx={{ '& .MuiAutocomplete-inputRoot': { alignItems: 'flex-start' } }}
    />
  )
}

export default EnrollmentParentSource
