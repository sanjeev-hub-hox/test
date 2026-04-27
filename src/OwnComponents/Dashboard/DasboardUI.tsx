import React, { useEffect, useState } from 'react'
import { Box } from '@mui/system'
import { Chip, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@mui/material'
import SampleChart from './ChartsMarquee/PieChart'
import FunnelChart from './ChartsMarquee/FunnelChart'
import { useRouter } from 'next/router'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { getRequest } from 'src/services/apiService'
import { getCurrentYearObject } from 'src/utils/helper'

//Chips Styled

function DasboardUI() {
  const router = useRouter()
  const { setPagePaths } = useGlobalContext()
  const DownArrow = () => <span style={{ color: '#666666' }} className='icon-arrow-down-1'></span>
  const [year, setYear] = useState<any>('')
  const [academicYears, setacademicYears] = useState<any[]>([])
  const [enquiryManaagementDetails, setEnquiryManaagementDetails] = useState<any>([])
  const [enquiryRowData, setEnquiryRowData] = useState<any>([])

  const [admissionManaagementDetails, setAdmissionManaagementDetails] = useState<any>([])
  const [admissionRowData, setAdmissionRowData] = useState<any>([])

  const [targetRowData, setTargetRowData] = useState<any>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiRequest = {
          url: `/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc`,
          serviceURL: 'mdm',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
          }
        }
        const response: any = await getRequest(apiRequest)
        // Handle the response here, e.g., set the state with the data
        if (response?.data && response?.data?.length) {
          setacademicYears(response.data)
          const currentYear = getCurrentYearObject(response?.data)
          if (currentYear && currentYear?.length) {
            setYear(currentYear[0]?.attributes?.short_name_two_digit)
          } else {
            setYear(response?.data[0]?.attributes?.short_name_two_digit)
          }
        }
      } catch (error) {}
    }

    fetchData()
  }, [])

  const getEnquiryManagementDetails = async () => {
    const params = {
      url: `marketing/dashboard/enquiry-management-summary`,
      params: {
        academic_year_ids: year
      }
    }

    const response = await getRequest(params)
    if (response?.status) {
      const gData = [
        {
          value: response?.data?.currentYearEnqCount,
          name: `${response?.data?.currentYearEnqCount} This Year`,
          centerLabel: 'Total'
        },
        {
          value: response?.data?.nextYearEnqCount,
          name: `${response?.data?.nextYearEnqCount} Next Year`,
          centerLabel: 'Total'
        }
      ]

      setEnquiryRowData(gData)
      setEnquiryManaagementDetails(response?.data)
    }
  }

  const getAdmissionManagementDetails = async () => {
    const params = {
      url: `marketing/dashboard/admission-management-summary`,
      params: {
        academic_year_ids: year
      }
    }

    const response = await getRequest(params)
    if (response?.status) {
      const gData = [
        {
          value: response?.data?.currentYearEnqCount,
          name: `${response?.data?.currentYearEnqCount} This Year`,
          centerLabel: 'Total'
        },
        {
          value: response?.data?.nextYearEnqCount,
          name: `${response?.data?.nextYearEnqCount} Next Year`,
          centerLabel: 'Total'
        }
      ]

      setAdmissionRowData(gData)
      setAdmissionManaagementDetails(response?.data)
    }
  }

  const getTargetDetails = async () => {
    const params = {
      url: `marketing/dashboard/target-achievement-summary`,
      params: {
        academic_year_ids: year
      }
    }

    const response = await getRequest(params)
    if (response?.status) {
      const funnelData = [
        { value: response?.data?.enquiryCount, name: 'Enquiry' },
        { value: response?.data?.walkinCount, name: 'Walking' },
        { value: response?.data?.registeredCount, name: 'Registered' },
        { value: response?.data?.admittedCount, name: 'Admitted' }
      ]

      setTargetRowData(funnelData)
    }
  }

  useEffect(() => {
    if (year) {
      getEnquiryManagementDetails()
      getAdmissionManagementDetails()
      getTargetDetails()
    }
  }, [year])
  const handleYearChange = (event: any) => {
    setYear(event.target.value as string)
  }

  //Handler for Calender Dialog

  //Passing Breadcrumbs
  useEffect(() => {
    setPagePaths([
      {
        title: 'Dashboard',
        path: '/dashboard'
      }
    ])
  }, [])

  //Handler for Tab

  //Handle Clickable Chips Handler

  //Below Data fro graphs

  //Date FOR PSR DATA Summury

  //Data FOR ISR DATA Summury

  // //Data for PSR DATA SUMMURY
  // const categories = ['Response', 'Resolved', 'Total PSR']

  // const responseData = [
  //   { value: 600, name: 'Happy' },
  //   { value: 800, name: 'Within TAT' },
  //   { value: 300, name: 'Open' }
  // ]

  // const resolvedData = [
  //   { value: 300, name: 'Sad' },
  //   { value: 200, name: 'Outside..' },
  //   { value: 500, name: 'VIP' }
  // ]

  // const totalPSRData = [
  //   { value: null, name: 'Mon Affiliate Ad within TAT' },
  //   { value: null, name: 'Tue Affiliate Ad within TAT' },
  //   { value: 100, name: 'Resolved' }
  // ]

  //Funnel Chart Data

  //My Performance Data

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
        <Box sx={{ width: '97%' }}>
          {/* <Box>
            <MarqueeText
              title='Latest News'
              texts={[
                'Lorem ipsum dolor sit amet consectetur. Nec enim tristique eu faucibus libero sit vitae tellus. Pellentesque pellentesque  Lorem ipsum dolor sit amet consectetur. '
              ]}
            />
          </Box> */}
          <Box
            sx={{
              mt: 4,
              mb: 4,
              background: '#fff',
              padding: '12px 24px',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center'
            }}
          >
            {academicYears && academicYears?.length ? (
              <FormControl sx={{ ml: 4 }}>
                <InputLabel id='demo-simple-select-outlined-label'>Academic Year</InputLabel>
                <Select
                  IconComponent={DownArrow}
                  label='Academic Year'
                  value={year}
                  id='demo-simple-select-outlined'
                  labelId='demo-simple-select-outlined-label'
                  onChange={handleYearChange}
                  sx={{ height: '48px' }}
                >
                  <MenuItem value=''>Select Academic Year</MenuItem>
                  {academicYears && academicYears?.length
                    ? academicYears?.map((val: any, index: number) => {
                        return (
                          <MenuItem key={index} value={val?.attributes?.short_name_two_digit}>
                            AY {val?.attributes?.name}
                          </MenuItem>
                        )
                      })
                    : null}
                </Select>
              </FormControl>
            ) : null}
          </Box>

          <Box sx={{ padding: '24px', borderRadius: '10px', background: '#fff' }}>
            <Grid container xs={12} spacing={2}>
              {enquiryRowData && enquiryRowData?.length ? (
                <Grid item xs={12} sm={12} md={6} lg={4}>
                  <Box
                    sx={{ padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}
                    onClick={() => router.push('/enquiry-listing')}
                  >
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                      >
                        enquiry management
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <SampleChart rowData={enquiryRowData} />

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <Chip
                          label={`${enquiryManaagementDetails?.walkinCount} Registered`}
                          color='primary'
                          variant='outlined'
                          onClick={() => router.push('/enquiry-listing')}
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                        <Chip
                          label={`${enquiryManaagementDetails?.hotCount} Hot`}
                          color='success'
                          variant='outlined'
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                        <Chip
                          label={`${enquiryManaagementDetails?.warmCount} Warm`}
                          color='warning'
                          variant='outlined'
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                        <Chip
                          label={`${enquiryManaagementDetails?.coldCount} Cold`}
                          color='error'
                          variant='outlined'
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ) : null}
              {admissionRowData && admissionRowData?.length ? (
                <Grid item xs={12} sm={12} md={6} lg={4}>
                  <Box
                    sx={{ padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}
                    onClick={() => router.push('/registered-student-listing')}
                  >
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                      >
                        Admission management
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                      <SampleChart rowData={admissionRowData} />

                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}
                      >
                        <Chip
                          label={`${admissionManaagementDetails?.admittedCount} Admitted`}
                          color='primary'
                          variant='outlined'
                          onClick={() => router.push('/registered-student-listing')}
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                        <Chip
                          label={`${admissionManaagementDetails?.wipCount} WIP`}
                          color='success'
                          variant='outlined'
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                        <Chip
                          label={`${admissionManaagementDetails?.waitListCount} Wait List`}
                          color='warning'
                          variant='outlined'
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                        <Chip
                          label={`${admissionManaagementDetails?.lostCount} Lost`}
                          color='error'
                          variant='outlined'
                          sx={{
                            width: 110,
                            mb: 2,
                            '& .MuiChip-label': {
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            },
                            '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                              ml: -3
                            }
                          }}
                          onDelete={() => {
                            //
                          }}
                          deleteIcon={
                            <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                          }
                        />
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              ) : null}
              {/* <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      Student management
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <PieChartTwo rowData={rowData1} />

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <Chip
                        label='10 Registered'
                        color='primary'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                      <Chip
                        label='10 Registered'
                        color='success'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                      <Chip
                        label='10 Registered'
                        color='warning'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                      <Chip
                        label='10 Registered'
                        color='error'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid> */}
              {/* <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      VAS student management
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <SampleChart rowData={rowData} />

                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}
                    >
                      <Chip
                        label='10 Registered'
                        color='primary'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                      <Chip
                        label='10 Registered'
                        color='success'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                      <Chip
                        label='10 Registered'
                        color='warning'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                      <Chip
                        label='10 Registered'
                        color='error'
                        variant='outlined'
                        sx={{
                          width: 110,
                          mb: 2,
                          '& .MuiChip-label': {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          },
                          '&.MuiButtonBase-root.MuiChip-root .MuiChip-deleteIcon': {
                            ml: -3
                          }
                        }}
                        onDelete={() => {
                          //
                        }}
                        deleteIcon={
                          <span style={{ fontSize: '17px !important' }} className='icon-arrow-right-3'></span>
                        }
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid> */}
              {/* <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      Create Discount group
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        height: '300px'
                      }}
                    >
                      {' '}
                      <Typography
                        color={'customColors.text3'}
                        sx={{
                          fontSize: '10px',
                          lineHeight: '11px',
                          fontWeight: '400',
                          letterSpacing: '0.25px'
                        }}
                      >
                        No Data
                      </Typography>{' '}
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      placeholder
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        height: '300px'
                      }}
                    >
                      {' '}
                      <Typography
                        color={'customColors.text3'}
                        sx={{
                          fontSize: '10px',
                          lineHeight: '11px',
                          fontWeight: '400',
                          letterSpacing: '0.25px'
                        }}
                      >
                        No Data
                      </Typography>{' '}
                    </Box>
                  </Box>
                </Box>
              </Grid> */}
              {targetRowData && targetRowData?.length ? (
                <Grid item xs={12} sm={12} md={4} lg={4}>
                  <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                    <Box>
                      <Typography
                        variant='subtitle2'
                        color={'text.primary'}
                        sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                      >
                        Target Vs Achievement
                      </Typography>
                    </Box>
                    <Box sx={{ ml: -10 }}>
                      <FunnelChart data={targetRowData} />
                    </Box>
                  </Box>
                </Grid>
              ) : null}
              {/* <Grid item xs={12} sm={12} md={8} lg={8}>
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    padding: '16px',
                    borderRadius: '10px',
                    border: `1px solid #e0e0e0`
                  }}
                >
                  {chipsLabel.map((label, index) => (
                    <StyledChipProps
                      key={index}
                      label={label}
                      onClick={() => handleToggle(label)}
                      color={selectedOptions?.includes(label) ? 'primary' : 'default'}
                      variant='filled'
                      sx={{
                        mr: 4

                        // '&.Muichip-label': {
                        //   fontSize: '10px',
                        //   lineHeight: '11px',
                        //   letterSpacing: '0.25px',
                        //   textAlign: 'center'
                        // }
                      }}
                    />
                  ))}
                  {selectedOptions === 'PSR Data Summary' && (
                    <Box>
                      <PSRISRChart data={PSRData} />
                    </Box>
                  )}
                  {selectedOptions === 'ISR Data Summary' && (
                    <Box>
                      <PSRISRChart data={ISRData} />
                    </Box>
                  )}
                </Box>
              </Grid> */}
              {/* <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      PSR Data Summary
                    </Typography>
                  </Box>
                  <Box>
                    <HorizontalBarChart
                      id='horizontalBar'
                      categories={categories}
                      responseData={responseData}
                      resolvedData={resolvedData}
                      totalPSRData={totalPSRData}
                    />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      ISR Data Summary
                    </Typography>
                  </Box>
                  <Box>
                    <HorizontalBarChart
                      id='horizontalBar1'
                      categories={categories}
                      responseData={responseData}
                      resolvedData={resolvedData}
                      totalPSRData={totalPSRData}
                    />
                  </Box>
                </Box>
              </Grid> */}
              {/* <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      My Performance
                    </Typography>
                  </Box>
                  <Box>
                    <PerformancePieChart data={performanceData} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      My Department
                    </Typography>
                  </Box>
                  <Box>
                    <DepartmentPieChart data={departMentData} />
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={12} md={6} lg={4}>
                <Box sx={{ height: '100%', padding: '16px', borderRadius: '10px', border: `1px solid #e0e0e0` }}>
                  <Box>
                    <Typography
                      variant='subtitle2'
                      color={'text.primary'}
                      sx={{ lineHeight: '15.4px', textTransform: 'capitalize' }}
                    >
                      My School
                    </Typography>
                  </Box>
                  <Box>
                    <BarChart barData={barData} />
                  </Box>
                </Box>
              </Grid> */}
            </Grid>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default DasboardUI
