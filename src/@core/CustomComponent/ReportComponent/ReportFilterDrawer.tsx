
import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  TextField,
  Autocomplete,
  Checkbox,
  Chip
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { getRequest } from 'src/services/apiService'

const CalendarIcon = () => <span className='icon-calendar-1'></span>

interface FilterConfig {
  name: string
  label: string
  type: 'text' | 'date' | 'select' | 'multiselect' | 'dateRange'
  key: string
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  apiEndpoint?: string
  defaultValue?: any
  autoFetch?: boolean
}

interface ReportFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (reportType: string, filters: any) => void
  reportConfigs: any[]
}
interface OptionItem {
  value: any
  label: string
}

const DIMENSION_TO_MDM_ENDPOINT: Record<string, string> = {
  cluster: '/api/ac-clusters',
  school: '/api/ac-schools',
  course: '/api/ac-courses',
  board: '/api/ac-boards',
  grade: '/api/ac-grades',
  stream: '/api/ac-streams',
  source: '/api/ad-enquiry-sources',
  subSource: '/api/ad-enquiry-sub-sources'
}

export default function ReportFilterDrawer({
  isOpen,
  onClose,
  onDownload,
  reportConfigs
}: ReportFilterDrawerProps) {
  const [selectedReport, setSelectedReport] = useState('')
  const [filterValues, setFilterValues] = useState<any>({})
  const [dynamicOptions, setDynamicOptions] = useState<any>({})

  const currentConfig = reportConfigs.find((config) => config.value === selectedReport)

  const handleReportChange = (event: any) => {
    setSelectedReport(event.target.value)
    setFilterValues({})
  }

  // Load static options for filters that declare apiEndpoint (existing behaviour)
  useEffect(() => {
    if (!currentConfig?.filters) return

    currentConfig.filters.forEach(async (filter: FilterConfig) => {
      // Only auto-fetch when an explicit apiEndpoint exists and autoFetch is not false
      if (!filter.apiEndpoint || filter.autoFetch === false) return

      try {
        const url = {
          url: `/api/${filter.apiEndpoint}`,
          serviceURL: 'mdm',
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
        }
        const response = await getRequest(url)
        if (response?.data?.length > 0) {
          setDynamicOptions((prev: any) => ({
            ...prev,
            [filter.key]: response.data.map((item: any) => ({
              value: item.id,
              label: item.attributes?.name ?? item.attributes?.value ?? String(item.id)
            }))
          }))
        }
      } catch (error) {
        console.error(`Error fetching options for ${filter.name}:`, error)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, currentConfig])

  useEffect(() => {
    // compute stable JSON-string deps so dependency array is static-checkable
    // (these are computed outside; the effect body uses local snapshots only)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // compute stable deps (stringified) so we can reference them in the effect deps below
  const groupByDep = JSON.stringify(filterValues['filters'] || [])
  const clusterDep = JSON.stringify(filterValues['cluster'] || [])
  const dynOptsDep = JSON.stringify(dynamicOptions || {})

  useEffect(() => {
    // snapshot reactive objects so the effect body doesn't reference them directly
    const fv = filterValues
    const dynOpts = dynamicOptions

    const groupBySelected: string[] = fv['filters'] || []
    const selectedClusters: string[] = (fv['cluster'] || []).map(String).filter(Boolean)

    if (!groupBySelected || !groupBySelected.length) return

    // helper to build encoded query pairs
    const encodePair = (key: string, value: string) =>
      `${encodeURIComponent(key)}=${encodeURIComponent(value)}`

    const fetchDimensionValues = async (dimKey: string) => {
      // skip re-fetch for non-school dims if already loaded
      if (dimKey !== 'school' && dynOpts[dimKey] && dynOpts[dimKey].length) return

      const mdmPath = DIMENSION_TO_MDM_ENDPOINT[dimKey]
      if (!mdmPath) {
        console.log(`No MDM endpoint mapped for dimension "${dimKey}".`)

        return
      }

      try {
        // base pagination params
        const baseParams = [
          encodePair('[pagination][pageSize]', '10000'),
          encodePair('[pagination][page]', '1')
        ]

        let resp: any = null

        // if school and clusters selected, try server-side filtered requests
        if (dimKey === 'school') {
          if (selectedClusters.length) {
            const csv = selectedClusters.join(',')

            // try common server filter: filters[cluster_id][$in]=1,2
            const url1 = `${mdmPath}?${baseParams.join('&')}&${encodePair(
              `filters[cluster_id][$in]`,
              csv
            )}`
            try {
              resp = await getRequest({ url: url1, serviceURL: 'mdm' })
            } catch (err1) {
              console.warn('MDM filter by cluster_id failed, trying alternate relation form', err1)
            }

            // if first attempt failed or returned no data, try relation form: filters[cluster][id][$in]=1,2
            if (!resp || !resp?.data) {
              const url2 = `${mdmPath}?${baseParams.join('&')}&${encodePair(
                `filters[cluster][id][$in]`,
                csv
              )}`
              try {
                resp = await getRequest({ url: url2, serviceURL: 'mdm' })
              } catch (err2) {
                console.warn(
                  'MDM filter by cluster[id] failed, will fall back to fetching all and filter client-side',
                  err2
                )
              }
            }

            // if still no resp (or server errored), fetch all and we'll filter client-side below
            if (!resp || !resp?.data) {
              const urlAll = `${mdmPath}?${baseParams.join('&')}`
              resp = await getRequest({ url: urlAll, serviceURL: 'mdm' })
            }
          } else {
            // no clusters selected -> fetch all schools (or skip if you prefer)
            const urlAll = `${mdmPath}?${baseParams.join('&')}`
            resp = await getRequest({ url: urlAll, serviceURL: 'mdm' })
          }
        } else {
          // non-school dims: single fetch (cached above prevents repeat)
          const url = `${mdmPath}?${baseParams.join('&')}`
          resp = await getRequest({ url, serviceURL: 'mdm' })
        }

        let items = resp?.data ?? []

        // If we fetched all schools (because server-side filter was unsupported),
        // apply client-side filtering by cluster_id when clusters are selected
        if (dimKey === 'school') {
          if (selectedClusters.length) {
            items = (items || []).filter((item: any) => {
              const clusterId =
                item.attributes?.cluster_id ??
                item.cluster_id ??
                item.attributes?.clusterId ??
                item.clusterId ??
                ''

              // only accept schools whose cluster id matches selectedClusters
              return selectedClusters.includes(String(clusterId))
            })
          }
        }

        // normalize to { value, label } and preserve stable ids when available
        const list = (items || []).map((item: any, idx: number) => {
          const label =
            item.attributes?.name ||
            item.attributes?.source ||
            item.attributes?.value ||
            item.attributes?.label ||
            item.name ||
            item.school_name ||
            String(item.id)

          const rawId = item.id ?? item.code ?? null
          const value = rawId !== null && rawId !== undefined ? String(rawId) : `${label}-${idx}`

          return { value, label }
        })

        // dedupe by value, preserve first occurrence
        const deduped = list.reduce((acc: OptionItem[], cur: OptionItem) => {
          if (!acc.some((x) => String(x.value) === String(cur.value))) acc.push(cur)

          return acc
        }, [] as OptionItem[])

        // set current results (replace, do not append old school options)
        setDynamicOptions((prev: any) => ({
          ...prev,
          [dimKey]: deduped
        }))

        // if schools were fetched and user had selections that no longer exist, trim them
        if (dimKey === 'school' && Array.isArray(fv['school']) && fv['school'].length) {
          const existingVals = (fv['school'] || []).filter((v: any) =>
            deduped.some((l: any) => String(l.value) === String(v))
          )
          if (existingVals.length !== (fv['school'] || []).length) {
            setFilterValues((prev: any) => ({ ...prev, school: existingVals }))
          }
        }
      } catch (err) {
        console.error(`Failed to load values for ${dimKey}`, err)
      }
    }

    // fetch in parallel (each dim triggers its own fetchDimensionValues)
    groupBySelected.forEach((dim) => {
      fetchDimensionValues(String(dim))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupByDep, clusterDep, dynOptsDep, currentConfig])

  const handleFilterChange = (filterKey: string, value: any) => {
    setFilterValues((prev: any) => ({
      ...prev,
      [filterKey]: value
    }))
  }

  const handleDownloadClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const formattedFilters: any = {}

    // Basic filters provided by config (dateRange, etc.)
    currentConfig?.filters.forEach((filter: FilterConfig) => {
      const value = filterValues[filter.key]

      if (filter.type === 'dateRange' && value) {
        formattedFilters.start_date = value.startDate ? dayjs(value.startDate).format('DD-MM-YYYY') : ''
        formattedFilters.end_date = value.endDate ? dayjs(value.endDate).format('DD-MM-YYYY') : ''
      } else if (filter.type === 'date' && value) {
        formattedFilters[filter.key] = dayjs(value).format('DD-MM-YYYY')
      } else if (value !== undefined && value !== null && value !== '') {
        // For multiselect group_by, keep as an array here — caller will normalize
        formattedFilters[filter.key] = value
      }
    })

    // include per-dimension selected values in payload
    const selectedGroupBy: string[] = filterValues['filters'] || []
    selectedGroupBy.forEach((dim) => {
      const selectedValues = filterValues[dim] // we store per-dimension selections in filterValues[dim]
      if (selectedValues && Array.isArray(selectedValues) && selectedValues.length) {
        formattedFilters[dim] = selectedValues
      }
    })

    // Debug
    console.log('Formatted Filters:', formattedFilters)

    await onDownload(selectedReport, formattedFilters)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setSelectedReport('')
    setFilterValues({})
    setDynamicOptions({})
  }

  const handleCancel = () => {
    handleReset()
    onClose()
  }

  const isDownloadDisabled = () => {
    if (!selectedReport) return true

    if (currentConfig?.filters) {
      return currentConfig.filters.some((filter: FilterConfig) => {
        if (!filter.required) return false

        const value = filterValues[filter.key]

        if (filter.type === 'dateRange') {
          return !value?.startDate || !value?.endDate
        }

        return !value || value === '' || (Array.isArray(value) && value.length === 0)
      })
    }

    return false
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = filterValues[filter.key]

    switch (filter.type) {
      case 'text':
        return (
          <TextField
            key={filter.key}
            fullWidth
            label={filter.label}
            placeholder={filter.placeholder}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            required={filter.required}
          />
        )

      case 'select': {
        const selectOptions = filter.options || dynamicOptions[filter.key] || []

        return (
          <FormControl key={filter.key} fullWidth required={filter.required}>
            <InputLabel>{filter.label}</InputLabel>
            <Select value={value || ''} label={filter.label} onChange={(e) => handleFilterChange(filter.key, e.target.value)}>
              {selectOptions.map((option: any) => (
                <MenuItem key={String(option.value)} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      }

      case 'multiselect': {
        const multiOptions = filter.options || dynamicOptions[filter.key] || []

        return (
          <Autocomplete
            key={filter.key}
            multiple
            options={multiOptions}
            getOptionLabel={(option: any) => option.label}
            // ensure MUI compares by value (not label)
            isOptionEqualToValue={(opt: any, val: any) => String(opt.value) === String(val.value)}
            value={multiOptions.filter((opt: any) => (value || []).includes(opt.value))}
            onChange={(_, newValue) => handleFilterChange(filter.key, newValue.map((v: any) => v.value))}
            // === Make chips wrap & truncate long labels ===
            renderTags={(tagValue: any[], getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={String(option.value)}
                  label={option.label}
                  size='small'
                  sx={{
                    maxWidth: 120,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    mr: 0.5,
                    mt: 0.5
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField {...params} label={filter.label} placeholder={filter.placeholder} required={filter.required} fullWidth />
            )}
            // set explicit renderOption so React key uses option.value
            renderOption={(props, option) => (
              <li {...props} key={String(option.value)}>
                <Checkbox checked={(value || []).indexOf(option.value) > -1} style={{ marginRight: 8 }} size='small' />
                {option.label}
              </li>
            )}
            sx={{ width: '100%' }}
          />
        )
      }

      case 'date':
        return (
          <LocalizationProvider key={filter.key} dateAdapter={AdapterDayjs}>
            <DatePicker
              label={filter.label}
              value={value || null}
              onChange={(newValue) => handleFilterChange(filter.key, newValue)}
              format='DD-MM-YYYY'
              slots={{ openPickerIcon: CalendarIcon }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: filter.required
                },
                popper: {
                  disablePortal: false,
                  placement: 'auto'
                },
                desktopPaper: {
                  sx: {
                    zIndex: 1301
                  }
                }
              }}
            />
          </LocalizationProvider>
        )

      case 'dateRange':
        return (
          <Box key={filter.key}>
            <Typography variant='subtitle2' color='text.primary' sx={{ fontWeight: 500, mb: 2 }}>
              {filter.label} {filter.required && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <Stack spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Start Date'
                  value={value?.startDate || null}
                  onChange={(newValue) => handleFilterChange(filter.key, { ...value, startDate: newValue })}
                  format='DD-MM-YYYY'
                  slots={{ openPickerIcon: CalendarIcon }}
                  slotProps={{
                    textField: { fullWidth: true },
                    popper: {
                      disablePortal: true,
                      placement: 'auto'
                    },
                    desktopPaper: {
                      sx: {
                        zIndex: 1301
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='End Date'
                  value={value?.endDate || null}
                  onChange={(newValue) => handleFilterChange(filter.key, { ...value, endDate: newValue })}
                  minDate={value?.startDate ? dayjs(value.startDate) : undefined}
                  format='DD-MM-YYYY'
                  slots={{ openPickerIcon: CalendarIcon }}
                  slotProps={{
                    textField: { fullWidth: true },
                    popper: {
                      disablePortal: true,
                      placement: 'auto'
                    }
                  }}
                />
              </LocalizationProvider>
            </Stack>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Drawer anchor='right' open={isOpen} onClose={handleCancel} sx={{ '.MuiDrawer-paper': { maxWidth: '500px', minWidth: '500px' } }}>
      <Box sx={{ p: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
          <Typography color={'customColors.mainText'} style={{ lineHeight: '30px', fontWeight: 500 }} sx={{ p: 2 }} variant='h6'>
            Download Report
          </Typography>
          <Button style={{ color: '#666' }} onClick={handleReset}>
            Reset
          </Button>
        </Stack>

        <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2, overflow: 'visible' }}>
          <Box sx={{ maxHeight: 'calc(100vh - 150px)', overflow: 'auto', overflowX: 'hidden' }}>
            <Card
              variant='outlined'
              style={{
                borderColor: '#e0e0e0',
                backgroundColor: '#fff',
                padding: '20px',
                marginBottom: '16px',
                overflow: 'visible'
              }}
            >
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel id='report-type-label'>Select Report Type</InputLabel>
                  <Select labelId='report-type-label' value={selectedReport} label='Select Report Type' onChange={handleReportChange}>
                    {reportConfigs.map((report) => (
                      <MenuItem key={report.value} value={report.value}>
                        {report.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Render the configured filters (dateRange, group_by multiselect, etc.) */}
                {currentConfig?.filters.map((filter: FilterConfig) => renderFilter(filter))}
                {/* Per-dimension selectors (stacked, full width) */}
                {(filterValues['filters'] || []).map((dim: string) => (
                  <Box key={`values-${dim}`} sx={{ mb: 2, width: '100%', display: 'block' }}>
                    <Typography
                      variant='subtitle2'
                      sx={{ mb: 1, textTransform: 'capitalize', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <span>{`Select ${dim} values (optional)`}</span>
                      <small style={{ color: '#666' }}>{(dynamicOptions[dim]?.length ?? 0) + ' entries found'}</small>
                    </Typography>

                    <Autocomplete
                      multiple
                      options={dynamicOptions[dim] || []}
                      getOptionLabel={(opt: any) => opt.label}
                      isOptionEqualToValue={(opt: any, val: any) => String(opt.value) === String(val.value)}
                      value={(dynamicOptions[dim] || []).filter((opt: any) => (filterValues[dim] || []).includes(opt.value))}
                      onChange={(_, newValue) => {
                        handleFilterChange(dim, newValue.map((v: any) => v.value))
                      }}
                      renderTags={(tagValue: any[], getTagProps) => {
                        const MAX = 6
                        if (tagValue.length <= MAX) {
                          return tagValue.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={String(option.value)}
                              label={option.label}
                              size='small'
                              sx={{
                                maxWidth: 160,
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                mr: 0.5,
                                mt: 0.5
                              }}
                            />
                          ))
                        }

                        const shown = tagValue.slice(0, MAX)
                        const hiddenCount = tagValue.length - MAX

                        // show first N chips then a "+X more" chip

                        return (
                          <>
                            {shown.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={String(option.value)}
                                label={option.label}
                                size='small'
                                sx={{
                                  maxWidth: 160,
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  mr: 0.5,
                                  mt: 0.5
                                }}
                              />
                            ))}
                            <Chip label={`+${hiddenCount} more`} size='small' sx={{ mr: 0.5, mt: 0.5 }} />
                          </>
                        )
                      }}
                      renderInput={(params) => <TextField {...params} placeholder={`Pick ${dim} values`} variant='outlined' fullWidth />}
                      sx={{
                        width: '100%',
                        '& .MuiAutocomplete-inputRoot': {
                          flexWrap: 'wrap'
                        }
                      }}
                      // PopperProps={{
                      //   style: { zIndex: 9999, minWidth: 220 },
                      //   strategy: 'fixed',
                      //   modifiers: [
                      //     { name: 'preventOverflow', options: { altBoundary: true, rootBoundary: 'viewport', padding: 8 } },
                      //     { name: 'flip', options: { fallbackPlacements: ['bottom', 'top'] } },
                      //     { name: 'computeStyles', options: { adaptive: false } }
                      //   ]
                      // }}
                      PaperComponent={(props) => <div {...props} style={{ maxHeight: 300, overflow: 'auto', minWidth: 220, background: '#fff' }} />}
                      renderOption={(props, option) => (
                        <li {...props} key={String(option.value)}>
                          {option.label}
                        </li>
                      )}
                    />
                  </Box>
                ))}

                {selectedReport && currentConfig && (
                  <Box
                    sx={{
                      backgroundColor: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '8px',
                      mt: 2
                    }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      {currentConfig.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Box>
        </Box>

        <Stack direction='row' justifyContent='end' spacing={2} mt={2} sx={{ alignSelf: 'flex-end' }}>
          <Button variant='outlined' color='inherit' onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant='contained' disabled={isDownloadDisabled()} onClick={handleDownloadClick} type='button' startIcon={<span className='icon-download'></span>}>
            Download
          </Button>
        </Stack>
      </Box>
    </Drawer>
  )
}
