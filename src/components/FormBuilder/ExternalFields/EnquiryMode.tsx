import React, { useState, useEffect } from 'react'
import { FormControl, FormHelperText, InputLabel, Select, MenuItem, Box, Tooltip } from '@mui/material'
import { getRequest } from 'src/services/apiService'
import InfoIcon from '@mui/icons-material/Info'

const EnquiryMode = ({ handleChange, val, formData, infoDialog, enquiryType }: any) => {
  const [options, setOptions] = useState([])
  useEffect(() => {
    let url = '/api/ad-enquiry-modes?fields=mode&short=order'
    switch (enquiryType) {
      case 'readmission_10_11':
        url = '/api/ad-enquiry-modes?fields=mode&short=order&filters[id]=8'
        break
      default:
        url = '/api/ad-enquiry-modes?fields=mode&short=order'
        break
    }
    // url = "/api/ad-enquiry-modes?fields=mode&short=order&filters[id]=8"

    const fetchOptions = async () => {
      const params = {
        url: url,
        serviceURL: 'mdm',
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
        }
      }

      const response = await getRequest(params)
      if (response) {
        setOptions(response?.data)
      }
    }

    setTimeout(() => {
      fetchOptions()
    }, 1000)
  }, [val, enquiryType])

  // Auto-select if only one option and no value is already set
  useEffect(() => {
    if (options.length === 1 && !val) {
      const singleOption: any = options[0]
      handleChange('enquiry_mode', singleOption.id, [], false, null, {
        name: 'enquiry_mode',
        input_type: 'masterDropdownExternal',
        msterOptions: options,
        key: ['attributes', 'mode']
      })
    }
  }, [options, val])

  const DownArrow = () => <span style={{ color: '#666666' }} className='icon-arrow-down-1'></span>

  return options?.length ? (
    <FormControl fullWidth required error={Boolean(formData?.error?.['enquiry_mode'])}>
      <InputLabel id='dependent-option-label'>Enquiry Mode</InputLabel>
      <Select
        name={'enquiry_mode'}
        IconComponent={DownArrow}
        label={
          <Box sx={{ display: 'flex', alignItems: 'normal' }}>
            Enquiry Mode
            {infoDialog && (
              <span>
                <Tooltip title={'Enquiry Mode'}>
                  <InfoIcon style={{ color: '#a3a3a3' }} />
                </Tooltip>
              </span>
            )}
          </Box>
        }
        defaultValue={''}
        value={val || ''}
        error={Boolean(formData?.error?.['enquiry_mode'])}
        onChange={e => {
          handleChange('enquiry_mode', e.target.value, [], false, null, {
            name: 'enquiry_mode',
            input_type: 'masterDropdownExternal',
            msterOptions: options,
            key: ['attributes', 'mode']
          })
        }}
      >
        {options.map((item: any) => (
          <MenuItem key={item.id} value={item.id}>
            {item?.attributes?.mode}
          </MenuItem>
        ))}
      </Select>
      {formData?.error?.['enquiry_mode'] ? (
        <FormHelperText error>{formData?.error?.['enquiry_mode']}</FormHelperText>
      ) : null}
    </FormControl>
  ) : null
}

export default EnquiryMode
