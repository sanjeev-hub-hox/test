import React, { useState, useEffect, useMemo } from 'react'
import { Autocomplete, TextField, Box, Typography } from '@mui/material'
import { getRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import debounce from 'lodash.debounce'

interface EmployeeOption {
  id: number
  attributes: {
    First_Name: string
    Last_Name: string
    Full_Name: string
    Mobile: string
    Official_Email_ID: string
    Group_Employee_Code?: string
    Designation?: { data?: { attributes?: { Designation?: string } } }
    Business_Sub_Sub_Vertical?: { data?: { attributes?: { description?: string } } }
  }
}

interface Props {
  enquiryEmployeeSource: boolean
  formData: any
  setFormData: (updater: (prev: any) => any) => void
}

const EnquiryEmployeeSource = ({ enquiryEmployeeSource, formData, setFormData }: Props) => {
  const [options, setOptions] = useState<EmployeeOption[]>([])
  const [inputValue, setInputValue] = useState('')
  const [selectedOption, setSelectedOption] = useState<EmployeeOption | null>(null)
  const { setGlobalState } = useGlobalContext()

  // Pre-load when editing an existing record — read from formData.referral_source directly
  useEffect(() => {
    const referral = formData?.referral_source
    const hasExistingSource = formData?.['enquiry_employee_source.id'] || (referral?.type === 'employee' && referral?.id)
    if (hasExistingSource && !selectedOption) {
      const sourceId = formData?.['enquiry_employee_source.id'] || referral?.id
      const fetchById = async () => {
        try {
          setGlobalState({ isLoading: true })
          const params = {
            url: `/api/hr-employee-masters/${sourceId}?populate=*`,
            serviceURL: 'mdm',
            headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
          }
          const response = await getRequest(params)
          const emp: EmployeeOption = response?.data
          if (emp) {
            setSelectedOption(emp)
            setOptions([emp])
            setInputValue(getFullName(emp))
          }
        } catch (err) {
        } finally {
          setGlobalState({ isLoading: false })
        }
      }
      fetchById()
    }
  }, [formData?.['enquiry_employee_source.id'], formData?.referral_source?.id])

  // Reset when sub-source type is changed away from Employee
  useEffect(() => {
    if (!enquiryEmployeeSource) {
      setSelectedOption(null)
      setInputValue('')
      setOptions([])
    }
  }, [enquiryEmployeeSource])

  const fetchOptions = async (search: string) => {
    try {
      setGlobalState({ isLoading: true })
      const encoded = encodeURIComponent(search)
      const query = `filters[$or][0][First_Name][$containsi]=${encoded}&filters[$or][1][Last_Name][$containsi]=${encoded}&pagination[limit]=50&populate=*`
      const params = {
        url: `/api/hr-employee-masters?${query}`,
        serviceURL: 'mdm',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
        }
      }
      const response = await getRequest(params)
      setOptions(Array.isArray(response?.data) ? response.data : [])
    } catch (err) {
      // console.error('Error fetching employees:', err)
      setOptions([])
    } finally {
      setGlobalState({ isLoading: false })
    }
  }

  const debouncedFetch = useMemo(() => debounce(fetchOptions, 400), [])
  useEffect(() => () => debouncedFetch.cancel(), [debouncedFetch])

  const getFullName = (opt: EmployeeOption) =>
    opt.attributes.Full_Name?.trim() ||
    `${opt.attributes.First_Name} ${opt.attributes.Last_Name}`.trim()

  const applySelection = (emp: EmployeeOption | null) => {
    setSelectedOption(emp)
    setInputValue(emp ? getFullName(emp) : '')
    setFormData((prev: any) => ({
      ...prev,
      referral_source: emp
        ? {
            type: 'employee',
            id: emp.id,
            name: getFullName(emp),
            email: emp.attributes.Official_Email_ID || '',
            phone: emp.attributes.Mobile || '',
            meta: {
              employee_code: emp.attributes.Group_Employee_Code || '',
              designation: emp.attributes?.Designation?.data?.attributes?.Designation || '',
              location: emp.attributes?.Business_Sub_Sub_Vertical?.data?.attributes?.description || ''
            }
          }
        : null
    }))
  }

  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => getFullName(option)}
      value={selectedOption}
      inputValue={inputValue}
      onInputChange={(_, value, reason) => {
        if (reason === 'input') {
          setInputValue(value)
          if (value.trim()) debouncedFetch(value.trim())
        } else if (reason === 'clear') {
          setInputValue('')
          applySelection(null)
        }
      }}
      onChange={(_, newValue) => applySelection(newValue)}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.id} sx={{ display: 'flex', flexDirection: 'column', width: '100%', py: 1.2, px: 1.5 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'black' }}>
              {getFullName(option)}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', color: '#1565c0' }}>
              ({option.attributes.Group_Employee_Code || '—'})
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.9rem', color: '#424242', fontWeight: 500 }}>
            {option.attributes?.Designation?.data?.attributes?.Designation || '—'}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: '#757575' }}>
            {option.attributes?.Business_Sub_Sub_Vertical?.data?.attributes?.description || '—'}
          </Typography>
        </Box>
      )}
      renderInput={(params) => {
        const adornment = selectedOption ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', overflow: 'hidden', scale: '0.85' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: 'black', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {getFullName(selectedOption)}
              </Typography>
              <Typography sx={{ fontSize: '0.95rem', color: '#1565c0', flexShrink: 0 }}>
                ({selectedOption.attributes.Group_Employee_Code || '—'})
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '0.9rem', color: '#424242', fontWeight: 500 }}>
              {selectedOption.attributes?.Designation?.data?.attributes?.Designation || '—'}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#757575' }}>
              {selectedOption.attributes?.Business_Sub_Sub_Vertical?.data?.attributes?.description || '—'}
            </Typography>
          </Box>
        ) : null

        return (
          <TextField
            {...params}
            label={selectedOption ? 'Employee Details' : 'Search Employee'}
            variant='outlined'
            required
            error={Boolean(formData?.error?.['referral_source'])}
            InputProps={{
              ...params.InputProps,
              startAdornment: adornment ? (
                <Box sx={{ pl: 1, pr: 1, py: 0.5, width: '100%', overflow: 'hidden' }}>{adornment}</Box>
              ) : params.InputProps.startAdornment
            }}
            sx={{
              '& .MuiInputBase-root': { alignItems: 'flex-start', height: '56px' },
              '& .MuiInputBase-input': { display: selectedOption ? 'none' : 'block' }
            }}
          />
        )
      }}
      clearOnEscape
      disableClearable={false}
      fullWidth
    />
  )
}

export default EnquiryEmployeeSource
