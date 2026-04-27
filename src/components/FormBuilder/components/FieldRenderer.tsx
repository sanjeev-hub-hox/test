import React, { Fragment } from 'react'
import {
  TextField,
  Checkbox,
  Select,
  RadioGroup,
  FormControl,
  InputLabel,
  FormHelperText,
  MenuItem,
  FormControlLabel,
  Radio,
  Box,
  List,
  Grid,
  Tooltip,
  Button
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'
import AddIcon from '@mui/icons-material/Add'
import Remove from '@mui/icons-material/Remove'
import InfoIcon from '@mui/icons-material/Info'
import Link from 'next/link'
import dayjs from 'dayjs'
import MultiSelectDropdown from '../MultiSelect'
import MasterDropDown from '../MasterDropDown'
import PhoneNumberField from '../../PhoneNumberField'
import PhoneNumberInput from 'src/@core/CustomComponent/PhoneNumberInput/PhoneNumberInput'
import DropzoneWrapper from 'src/@core/styles/libs/react-dropzone'
import DownArrow from 'src/@core/CustomComponent/DownArrow/DownArrow'
import style from '../../../pages/stages/stage.module.css'
import { convertDate } from 'src/utils/helper'

const CalendarIcon = () => <span className='icon-calendar-1'></span>

const Img = styled('img')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    marginRight: theme.spacing(10)
  },
  [theme.breakpoints.down('md')]: {
    marginBottom: theme.spacing(4)
  },
  [theme.breakpoints.down('sm')]: {
    width: 250
  }
}))

const HeadingTypography = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(5),
  fontSize: '1.5rem',
  fontWeight: 600,
  lineHeight: 1.2,
  [theme.breakpoints.down('sm')]: {
    marginBottom: theme.spacing(4)
  }
}))

interface FieldRendererProps {
  item: any
  formData: any
  setFormData: React.Dispatch<React.SetStateAction<any>>
  handleChange: (name: string, value: any, validations: any, isRepeatable: boolean, id?: any, item?: any) => void
  handleCheckbox: (value: any, name: any, isRepeatable: boolean, id?: any, index?: any, item?: any) => void
  handleMultiDropdown: (id: any, options: any, name: any, isRepeatable: boolean) => void
  handleRadioChange: (value: any, name: any) => void
  handleAddMore: (name: string, item: any) => void
  handleRemove: (name: string, id: any) => void
  isFieldVisible: (item: any) => boolean
  masterDropDownOptions: any
  setMasterDropDownOptions: React.Dispatch<React.SetStateAction<any>>
  infoDialog: boolean
  files: File[]
  getRootProps: any
  getInputProps: any
  fileList: any
  handleRemoveAllFiles: () => void
  formfields: any
}

const FieldRenderer: React.FC<FieldRendererProps> = ({
  item,
  formData,
  setFormData,
  handleChange,
  handleCheckbox,
  handleMultiDropdown,
  handleRadioChange,
  handleAddMore,
  handleRemove,
  isFieldVisible,
  masterDropDownOptions,
  setMasterDropDownOptions,
  infoDialog,
  files,
  getRootProps,
  getInputProps,
  fileList,
  handleRemoveAllFiles,
  formfields
}) => {
  const renderLabel = (label: string, note?: string) => (
    <Box sx={{ display: 'flex', alignItems: 'normal' }}>
      {label}
      {infoDialog && note && (
        <span>
          <Tooltip title={note}>
            <InfoIcon style={{ color: '#a3a3a3', marginLeft: '4px', fontSize: '18px' }} />
          </Tooltip>
        </span>
      )}
    </Box>
  )

  if (item?.validations?.[7]?.validation || !isFieldVisible(item)) {
    return null
  }

  // Text/Mobile Fields
  if (item?.['input_type'] === 'text' || item?.['input_type'] === 'email' || item?.['input_type'] === 'number') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              {item?.['input_id'] === 'mobilenumber' || item?.['input_id'] === 'mobile' ? (
                <PhoneNumberInput
                  label={item?.['input_label']}
                  helperText={false}
                  error={Boolean(formData?.error?.[item?.['input_field_name']])}
                  required={true}
                  handleOnChange={handleChange}
                  item={item}
                />
              ) : item['input_field_name']?.includes('mobile') ? (
                <PhoneNumberField
                  required={item?.validations?.[0]?.validation}
                  countryCodeVal={formData[`${item['input_field_name']?.replace(/\.[^.]+$/, '.country_code')}`]}
                  placeholder={item?.['input_placeholder']}
                  id={item?.['input_field_name']}
                  name={item?.['input_field_name']}
                  value={formData?.[item?.['input_field_name']] || ''}
                  label={item?.['input_label']}
                  onChange={handleChange}
                  item={item}
                  setFormData={setFormData}
                  formData={formData}
                  error={Boolean(formData?.error?.[item?.['input_field_name']])}
                  helperText={formData?.error?.[item?.['input_field_name']] || ''}
                />
              ) : (
                <TextField
                  type={item?.['input_type']}
                  required={item?.validations?.[0]?.validation}
                  fullWidth
                  className={formData?.error?.[item?.['input_field_name']] ? 'field-error' : ''}
                  placeholder={item?.['input_placeholder']}
                  label={renderLabel(item?.['input_label'], item?.['input_note'])}
                  id={item?.['input_field_name']}
                  name={item?.['input_field_name']}
                  value={_text.value || ''}
                  InputProps={{
                    readOnly: item?.validations?.[10]?.validation ? true : false
                  }}
                  inputProps={{
                    maxLength: item?.validations?.[12]?.validation && item?.validations?.[12]?.maxLength ? item?.validations?.[12]?.maxLength : 200
                  }}
                  onChange={e =>
                    handleChange(
                      item?.['input_field_name'],
                      e.target.value,
                      item?.validations,
                      item?.validations?.[6]?.validation,
                      _text.id,
                      item
                    )
                  }
                  error={Boolean(formData?.error?.[item?.['input_field_name']])}
                  helperText={formData?.error?.[item?.['input_field_name']] || ''}
                />
              )}
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : item?.['input_id'] === 'mobilenumber' || item?.['input_id'] === 'mobile' ? (
          <PhoneNumberInput
            label={item?.['input_label']}
            helperText={false}
            error={Boolean(formData?.error?.[item?.['input_field_name']])}
            required={true}
            handleOnChange={handleChange}
            item={item}
          />
        ) : item['input_field_name']?.includes('mobile') ? (
          <PhoneNumberField
            required={item?.validations?.[0]?.validation}
            countryCodeVal={formData[`${item['input_field_name']?.replace(/\.[^.]+$/, '.country_code')}`]}
            placeholder={item?.['input_placeholder']}
            id={item?.['input_field_name']}
            name={item?.['input_field_name']}
            value={formData?.[item?.['input_field_name']] || ''}
            label={item?.['input_label']}
            onChange={handleChange}
            item={item}
            setFormData={setFormData}
            formData={formData}
            error={Boolean(formData?.error?.[item?.['input_field_name']])}
            helperText={formData?.error?.[item?.['input_field_name']] || ''}
          />
        ) : (
          <TextField
            type={item?.['input_type']}
            required={item?.validations?.[0]?.validation}
            fullWidth
            sx={{
              ...(item?.validations?.[8]?.validation && {
                display: 'none'
              })
            }}
            className={formData?.error?.[item?.['input_field_name']] ? 'field-error' : ''}
            placeholder={item?.['input_placeholder']}
            label={renderLabel(item?.['input_label'], item?.['input_note'])}
            id={item?.['input_field_name']}
            name={item?.['input_field_name']}
            value={formData?.[item?.['input_field_name']] || ''}
            InputProps={{
              readOnly: item?.validations?.[10]?.validation ? true : false
            }}
            inputProps={{
              maxLength: item?.validations?.[12]?.validation && item?.validations?.[12]?.maxLength ? item?.validations?.[12]?.maxLength : 200
            }}
            onChange={e =>
              handleChange(
                item?.['input_field_name'],
                e.target.value,
                item?.validations,
                item?.validations?.[6]?.validation,
                '',
                item
              )
            }
            error={Boolean(formData?.error?.[item?.['input_field_name']])}
            helperText={formData?.error?.[item?.['input_field_name']] || ''}
          />
        )}
      </Fragment>
    )
  }

  // File Upload
  if (item?.['input_type'] === 'file') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Fragment key={_text.id}>
              <DropzoneWrapper>
                <Grid container spacing={6} className='match-height'>
                  <Grid item xs={12}>
                    <Fragment>
                      <div {...getRootProps({ className: 'dropzone' })}>
                        <input {...getInputProps({ name: item?.['input_field_name'] })} />
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: ['column', 'column', 'row'],
                            alignItems: 'center'
                          }}
                        >
                          <Img width={300} alt='Upload img' src='/images/misc/upload.png' />
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              textAlign: ['center', 'center', 'inherit']
                            }}
                          >
                            <HeadingTypography>Drop files here or click to upload.</HeadingTypography>
                            <Box
                              sx={{
                                color: 'text.secondary',
                                '& a': {
                                  color: 'primary.main',
                                  textDecoration: 'none'
                                }
                              }}
                            >
                              Drop files here or click{' '}
                              <Link href='/' onClick={e => e.preventDefault()}>
                                browse
                              </Link>{' '}
                              thorough your machine
                            </Box>
                          </Box>
                        </Box>
                      </div>
                      {files.length ? (
                        <Fragment>
                          <List>{fileList}</List>
                          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                            <Button color='error' variant='outlined' onClick={handleRemoveAllFiles}>
                              Remove All
                            </Button>
                            <Button variant='contained'>Upload Files</Button>
                          </Box>
                        </Fragment>
                      ) : null}
                    </Fragment>
                  </Grid>
                </Grid>
              </DropzoneWrapper>
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                  sx={{ mt: 1 }}
                >
                  <Remove />
                </Button>
              )}
            </Fragment>
          ))
        ) : (
          <DropzoneWrapper>
            <div {...getRootProps({ className: 'dropzone' })}>
              <input {...getInputProps({ name: item?.['input_field_name'] })} />
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: ['column', 'column', 'row'],
                  alignItems: 'center'
                }}
              >
                <Img width={300} alt='Upload img' src='/images/misc/upload.png' />
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    textAlign: ['center', 'center', 'inherit']
                  }}
                >
                  <HeadingTypography>Drop files here or click to upload.</HeadingTypography>
                  <Box
                    sx={{
                      color: 'text.secondary',
                      '& a': {
                        color: 'primary.main',
                        textDecoration: 'none'
                      }
                    }}
                  >
                    Drop files here or click{' '}
                    <Link href='/' onClick={e => e.preventDefault()}>
                      browse
                    </Link>{' '}
                    thorough your machine
                  </Box>
                </Box>
              </Box>
            </div>
            {files.length ? (
              <Fragment>
                <List>{fileList}</List>
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Button color='error' variant='outlined' onClick={handleRemoveAllFiles}>
                    Remove All
                  </Button>
                  <Button variant='contained'>Upload Files</Button>
                </Box>
              </Fragment>
            ) : null}
          </DropzoneWrapper>
        )}
      </Fragment>
    )
  }

  // Master Dropdown
  if (item?.['input_type'] === 'masterDropdown') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation &&
          formData?.[item?.['input_field_name']]?.length > 0 &&
          masterDropDownOptions?.[item.input_field_name]?.length ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <MasterDropDown
                item={item}
                masterDropDownOptions={masterDropDownOptions}
                handleChange={handleChange}
                formData={formData}
                _text={_text}
                setMasterDropDownOptions={setMasterDropDownOptions}
                formFieldsInput={formfields && formfields?.length ? formfields?.[0]?.inputs : []}
                dependentFields={formfields && formfields?.length ? formfields?.[0]?.dependent_field : []}
                infoDialog={infoDialog}
              />
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <MasterDropDown
            item={item}
            masterDropDownOptions={masterDropDownOptions}
            handleChange={handleChange}
            formData={formData}
            _text={''}
            setMasterDropDownOptions={setMasterDropDownOptions}
            formFieldsInput={formfields && formfields?.length ? formfields?.[0]?.inputs : []}
            dependentFields={formfields && formfields?.length ? formfields?.[0]?.dependent_field : []}
            infoDialog={infoDialog}
          />
        )}
      </Fragment>
    )
  }

  // Textarea
  if (item?.['input_type'] === 'textarea') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                type='text'
                size='small'
                fullWidth
                placeholder={item?.['input_placeholder']}
                label={renderLabel(item?.['input_label'], item?.['input_note'])}
                id={item?.['input_field_name']}
                name={item?.['input_field_name']}
                value={_text.value || ''}
                className={formData?.error?.[item?.['input_field_name']] ? 'field-error' : ''}
                onChange={(e: any) =>
                  handleChange(
                    item?.['input_field_name'],
                    e.target.value,
                    item?.validations,
                    item?.validations?.[6]?.validation,
                    _text?.id,
                    item
                  )
                }
                multiline
                rows={2}
                maxRows={4}
                InputProps={{
                  readOnly: item?.validations?.[10]?.validation ? true : false
                }}
                error={Boolean(formData?.error?.[item?.['input_field_name']])}
                helperText={formData?.error?.[item?.['input_field_name']] || ''}
              />
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <TextField
            fullWidth
            type='text'
            placeholder={item?.['input_placeholder']}
            label={renderLabel(item?.['input_label'], item?.['input_note'])}
            id={item?.['input_field_name']}
            name={item?.['input_field_name']}
            value={formData?.[item?.['input_field_name']] || ''}
            onChange={(e: any) =>
              handleChange(
                item?.['input_field_name'],
                e.target.value,
                item?.validations,
                item?.validations?.[6]?.validation,
                '',
                item
              )
            }
            className={formData?.error?.[item?.['input_field_name']] ? 'field-error' : ''}
            multiline
            rows={2}
            maxRows={4}
            error={Boolean(formData?.error?.[item?.['input_field_name']])}
            InputProps={{
              readOnly: item?.validations?.[10]?.validation ? true : false
            }}
            helperText={formData?.error?.[item?.['input_field_name']] || ''}
          />
        )}
      </Fragment>
    )
  }

  // Dropdown (Single & Multiple)
  if (item?.['input_type'] === 'dropdown') {
    if (item?.['input_is-multiple']) {
      return (
        <Fragment>
          {item?.validations?.[6]?.validation && (
            <Button
              variant='contained'
              color='secondary'
              onClick={() => handleAddMore(item?.['input_field_name'], item)}
              disableFocusRipple
              disableTouchRipple
              sx={{ mb: 2 }}
            >
              <AddIcon />
            </Button>
          )}
          {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
            formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
              <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <MultiSelectDropdown
                  options={item?.['input_type_dropdown_options']?.map((opt: any) => ({
                    ...opt,
                    label: opt.displayValue
                  }))}
                  handleMulti={handleMultiDropdown}
                  dataField={_text.value}
                  name={item?.['input_field_name']}
                  fieldId={_text?.id}
                  isRepeatable={item?.validations?.[6]?.validation}
                />
                {inx !== 0 && (
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                    disableFocusRipple
                    disableTouchRipple
                  >
                    <Remove />
                  </Button>
                )}
              </Box>
            ))
          ) : (
            <MultiSelectDropdown
              options={item?.['input_type_dropdown_options']?.map((opt: any) => ({
                ...opt,
                label: opt.displayValue
              }))}
              handleMulti={handleMultiDropdown}
              dataField={formData?.[item?.['input_field_name']]}
              name={item?.['input_field_name']}
              fieldId=''
              isRepeatable={item?.validations?.[6]?.validation}
            />
          )}
        </Fragment>
      )
    } else {
      return (
        <Fragment>
          {item?.validations?.[6]?.validation && (
            <Button
              variant='contained'
              color='secondary'
              onClick={() => handleAddMore(item?.['input_field_name'], item)}
              disableFocusRipple
              disableTouchRipple
              sx={{ mb: 2 }}
            >
              <AddIcon />
            </Button>
          )}
          {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
            formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
              <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel required={item?.validations?.[0]?.validation} id={`${item.input_field_name}-label`}>
                    {item?.['input_label']}
                  </InputLabel>
                  <Select
                    fullWidth
                    labelId={`${item.input_field_name}-label`}
                    name={item?.['input_field_name']}
                    label={renderLabel(item?.['input_label'], item?.['input_note'])}
                    id={item?.['input_field_name']}
                    value={_text.value || item?.['input_default_value'] || ''}
                    error={Boolean(formData?.error?.[item?.['input_field_name']])}
                    IconComponent={DownArrow}
                    onChange={(e: any) =>
                      handleChange(
                        item?.['input_field_name'],
                        e.target.value,
                        item?.validations,
                        item?.validations?.[6]?.validation,
                        _text?.id,
                        item
                      )
                    }
                    required={item?.validations?.[0]?.validation}
                  >
                    {item?.['input_type_dropdown_options']?.map((opt: any, index: number) => (
                      <MenuItem key={index} value={opt.value}>
                        {opt.displayValue}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText error>{formData?.error?.[item?.['input_field_name']] || ''}</FormHelperText>
                </FormControl>
                {inx !== 0 && (
                  <Button
                    variant='contained'
                    color='secondary'
                    onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                    disableFocusRipple
                    disableTouchRipple
                  >
                    <Remove />
                  </Button>
                )}
              </Box>
            ))
          ) : (
            <FormControl fullWidth>
              <InputLabel required={item?.validations?.[0]?.validation} id={`${item.input_field_name}-label`}>
                {item?.['input_label']}
              </InputLabel>
              <Select
                fullWidth
                labelId={`${item.input_field_name}-label`}
                name={item?.['input_field_name']}
                label={renderLabel(item?.['input_label'], item?.['input_note'])}
                id={item?.['input_field_name']}
                IconComponent={DownArrow}
                value={formData?.[item?.['input_field_name']] || item?.['input_default_value'] || ''}
                error={Boolean(formData?.error?.[item?.['input_field_name']])}
                onChange={(e: any) =>
                  handleChange(
                    item?.['input_field_name'],
                    e.target.value,
                    item?.validations,
                    item?.validations?.[6]?.validation,
                    '',
                    item
                  )
                }
                required={item?.validations?.[0]?.validation}
              >
                {item?.['input_type_dropdown_options']?.map((opt: any, index: number) => (
                  <MenuItem key={index} value={opt.value}>
                    {opt.displayValue}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                <span className={style.errorField}>{formData?.error?.[item?.['input_field_name']] || ''}</span>
              </FormHelperText>
            </FormControl>
          )}
        </Fragment>
      )
    }
  }

  // Time Picker
  if (item?.['input_type'] === 'time') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label={item?.['input_label']}
                  value={_text.value ? dayjs(_text.value) : null}
                  name={item?.['input_field_name']}
                  onChange={e =>
                    handleChange(
                      item?.['input_field_name'],
                      e,
                      item?.validations,
                      item?.validations?.[6]?.validation,
                      _text?.id,
                      item
                    )
                  }
                  slotProps={{
                    textField: {
                      error: Boolean(formData?.error?.[item?.['input_field_name']]),
                      helperText: formData?.error?.[item?.['input_field_name']]
                    }
                  }}
                />
              </LocalizationProvider>
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label={item?.['input_label']}
              value={formData?.[item?.['input_field_name']] ? dayjs(formData?.[item?.['input_field_name']]) : null}
              name={item?.['input_field_name']}
              onChange={e =>
                handleChange(
                  item?.['input_field_name'],
                  e,
                  item?.validations,
                  item?.validations?.[6]?.validation,
                  '',
                  item
                )
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(formData?.error?.[item?.['input_field_name']]),
                  helperText: formData?.error?.[item?.['input_field_name']]
                }
              }}
            />
          </LocalizationProvider>
        )}
      </Fragment>
    )
  }

  // Time Range
  if (item?.['input_type'] === 'timeRange') {
    return (
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label={item?.['input_label']}
              value={formData[`${item?.['input_field_name']}_start`] ? dayjs(formData[`${item?.['input_field_name']}_start`]) : null}
              onChange={e => handleRadioChange(e, `${item?.['input_field_name']}_start`)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={6}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <TimePicker
              label={`${item?.['input_label']} - End`}
              value={formData[`${item?.['input_field_name']}_end`] ? dayjs(formData[`${item?.['input_field_name']}_end`]) : null}
              onChange={e => handleRadioChange(e, `${item?.['input_field_name']}_end`)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
    )
  }

  // Date/DateTime Picker
  if (item?.['input_type'] === 'date' || item?.['input_type'] === 'dateTime') {
    const Picker = item?.['input_type'] === 'date' ? DatePicker : DateTimePicker
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Picker
                  label={item?.['input_label']}
                  value={_text.value ? dayjs(_text.value) : null}
                  onChange={e =>
                    handleChange(
                      item?.['input_field_name'],
                      convertDate(e),
                      item?.validations,
                      item?.validations?.[6]?.validation,
                      _text?.id,
                      item
                    )
                  }
                  slots={{
                    openPickerIcon: CalendarIcon
                  }}
                  slotProps={{
                    textField: {
                      error: Boolean(formData?.error?.[item?.['input_field_name']]),
                      helperText: formData?.error?.[item?.['input_field_name']]
                    }
                  }}
                />
              </LocalizationProvider>
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Picker
              label={item?.['input_label']}
              value={formData?.[item?.['input_field_name']] ? dayjs(formData?.[item?.['input_field_name']]) : null}
              onChange={e =>
                handleChange(
                  item?.['input_field_name'],
                  convertDate(e),
                  item?.validations,
                  item?.validations?.[6]?.validation,
                  '',
                  item
                )
              }
              slots={{
                openPickerIcon: CalendarIcon
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: Boolean(formData?.error?.[item?.['input_field_name']]),
                  helperText: formData?.error?.[item?.['input_field_name']]
                }
              }}
            />
          </LocalizationProvider>
        )}
      </Fragment>
    )
  }

  // Radio Group
  if (item?.['input_type'] === 'radio') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ mb: 2 }}>
              <FormControl component='fieldset' error={Boolean(formData?.error?.[item?.['input_field_name']])}>
                <Box sx={{ mb: 1 }}>{renderLabel(`${item?.['input_label']} ${inx + 1}`, item?.['input_note'])}</Box>
                <RadioGroup
                  row
                  name={`${item?.['input_field_name']}_${_text.id}`}
                  value={_text.value || ''}
                  onChange={e =>
                    handleChange(
                      item?.['input_field_name'],
                      e.target.value,
                      item?.validations,
                      item?.validations?.[6]?.validation,
                      _text.id,
                      item
                    )
                  }
                >
                  {(item?.['input_type_radio_options'] || item?.['input_type_dropdown_options'])?.map((opt: any, index: number) => (
                    <FormControlLabel key={index} value={opt.value} control={<Radio />} label={opt.displayValue || opt.label} />
                  ))}
                </RadioGroup>
              </FormControl>
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                  sx={{ mt: 1 }}
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <FormControl component='fieldset' error={Boolean(formData?.error?.[item?.['input_field_name']])}>
            <Box sx={{ mb: 1 }}>{renderLabel(item?.['input_label'], item?.['input_note'])}</Box>
            <RadioGroup
              row
              name={item?.['input_field_name']}
              value={formData?.[item?.['input_field_name']] || ''}
              onChange={e =>
                handleChange(
                  item?.['input_field_name'],
                  e.target.value,
                  item?.validations,
                  item?.validations?.[6]?.validation,
                  '',
                  item
                )
              }
            >
              {(item?.['input_type_radio_options'] || item?.['input_type_dropdown_options'])?.map((opt: any, index: number) => (
                <FormControlLabel key={index} value={opt.value} control={<Radio />} label={opt.displayValue || opt.label} />
              ))}
            </RadioGroup>
            <FormHelperText>{formData?.error?.[item?.['input_field_name']] || ''}</FormHelperText>
          </FormControl>
        )}
      </Fragment>
    )
  }

  // Checkbox Group
  if (item?.['input_type'] === 'checkbox') {
    return (
      <Fragment>
        {item?.validations?.[6]?.validation && (
          <Button
            variant='contained'
            color='secondary'
            onClick={() => handleAddMore(item?.['input_field_name'], item)}
            disableFocusRipple
            disableTouchRipple
            sx={{ mb: 2 }}
          >
            <AddIcon />
          </Button>
        )}
        {item?.validations?.[6]?.validation && formData?.[item?.['input_field_name']]?.length > 0 ? (
          formData?.[item?.['input_field_name']]?.map((_text: any, inx: any) => (
            <Box key={_text.id} sx={{ mb: 2 }}>
              <FormControl component='fieldset' error={Boolean(formData?.error?.[item?.['input_field_name']])}>
                <Box sx={{ mb: 1 }}>{renderLabel(`${item?.['input_label']} ${inx + 1}`, item?.['input_note'])}</Box>
                <Grid container>
                  {item?.['input_type_checkbox_options']?.map((opt: any, index: number) => (
                    <Grid item key={index}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Array.isArray(_text.value) && _text.value.includes(opt.value)}
                            onChange={() =>
                              handleCheckbox(
                                opt.value,
                                item?.['input_field_name'],
                                true,
                                _text.id,
                                inx,
                                item
                              )
                            }
                          />
                        }
                        label={opt.displayValue}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormControl>
              {inx !== 0 && (
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={() => handleRemove(item?.['input_field_name'], _text?.id)}
                  disableFocusRipple
                  disableTouchRipple
                >
                  <Remove />
                </Button>
              )}
            </Box>
          ))
        ) : (
          <FormControl component='fieldset' error={Boolean(formData?.error?.[item?.['input_field_name']])}>
            <Box sx={{ mb: 1 }}>{renderLabel(item?.['input_label'], item?.['input_note'])}</Box>
            <Grid container>
              {item?.['input_type_checkbox_options']?.map((opt: any, index: number) => (
                <Grid item key={index}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Array.isArray(formData?.[item?.['input_field_name']]) && formData[item['input_field_name']].includes(opt.value)}
                        onChange={() =>
                          handleCheckbox(
                            opt.value,
                            item?.['input_field_name'],
                            false,
                            '',
                            '',
                            item
                          )
                        }
                      />
                    }
                    label={opt.displayValue}
                  />
                </Grid>
              ))}
            </Grid>
            <FormHelperText>{formData?.error?.[item?.['input_field_name']] || ''}</FormHelperText>
          </FormControl>
        )}
      </Fragment>
    )
  }

  return null
}

export default FieldRenderer
