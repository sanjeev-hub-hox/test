import { Divider, Grid, Popover, Typography, useTheme } from '@mui/material'
import { Box } from '@mui/system'
import React, { useCallback, useEffect, useState } from 'react'

import StudentIcon from '../../../public/images/avatars/studentIcon.svg'
import Image from 'next/image'
import Link from 'next/link'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { getRequest } from 'src/services/apiService'
import { calculateSerialNumber } from 'src/utils/helper'
import useDebounce from 'src/utils/useDebounce'
import { useRouter } from 'next/router'

//Chips Styled

function EnquiriesLayout() {
  const theme = useTheme()
  const router = useRouter()
  const { setPagePaths, setGlobalState } = useGlobalContext()
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [searchText] = useState('')
  const [enquiryListing, setEnquiryListing] = useState([])
  const debouncedSearchTerm = useDebounce(searchText, 700)
  const [refresh] = useState(false)
  const [filterOptions] = useState<any>([])
  const [paginationModel] = useState({ page: 0, pageSize: 10 })
  const [pageSize] = useState(10)
  const [page] = useState<number>(0)

  //Handle Popover here
  const handlePopOver = (event: any) => {
    setAnchorEl(event.currentTarget)
  }

  const handlePopOverClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  const fetchData = useCallback(async (page: number, pageSize: number, filterData?: any) => {
    setGlobalState({
      isLoading: true
    })
    try {
      const apiRequest = {
        url: `marketing/app/enquiry/enquiry-list?phone=9820507115&pageNumber=${page}&pageSize=${pageSize}&status=Open`,
        serviceURL: 'marketing',
        data: { filters: filterData }
      }
      const response: any = await getRequest(apiRequest)
      if (response?.status) {
        const rowsWithSerialNumber = response?.data?.data?.map((row: any, index: any) => ({
          ...row,
          id: Math.random(),
          serialNumber: calculateSerialNumber(index, page, pageSize)
        }))
        setEnquiryListing(rowsWithSerialNumber)
        // if (!academicYears?.length) {
        //   setacademicYears(data?.academicYears)
        //   if (data?.academicYears && data?.academicYears?.length) {
        //     setYear(data?.academicYears[0])
        //   }
        // }
      }
    } catch (error) {
    } finally {
      setGlobalState({ isLoading: false }) // Stop loading
    }
  }, [])

  useEffect(() => {
    const modifyPayload = filterOptions?.map((val: any) => {
      return {
        column: val?.name,
        operation: val?.operation,
        search: val?.value
      }
    })
    fetchData(paginationModel?.page + 1, paginationModel.pageSize, modifyPayload)
  }, [fetchData, paginationModel, filterOptions])

  useEffect(() => {
    if (debouncedSearchTerm == '') {
      fetchData(page + 1, pageSize, filterOptions)
    }
  }, [page, debouncedSearchTerm, refresh])

  useEffect(() => {
    // const fetchUsersData = async () => {
    //   try {
    //     const apiRequest = {
    //       url: `/api/rbac-role-permissions/role-permissions-for-user`,
    //       serviceURL: 'mdm',
    //       data: {
    //         user_email: userDetails?.email ? userDetails.email : 'danik.shera@ampersandgroup.in',
    //         application_id: 1,
    //         service: 'marketing_service'
    //       },
    //       headers: {
    //         Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
    //       }
    //     }
    //     const response: any = await postRequest(apiRequest)
    //     // Handle the response here, e.g., set the state with the data
    //     if (response.success) {
    //       console.log(response?.data?.userInfo)
    //       fetchEmployeesList(response?.data)
    //     }
    //   } catch (error) {
    //     console.error('Error fetching data:', error)
    //   }
    // }
    // const fetchEmployeesList = async (userDetails: any) => {
    //   try {
    //     // const apiRequest = {
    //     //   url: `/api/hr-employee-masters?[$or][Base_Location][Base_Location][parent_1_id][$eq]=1012&[$or][Base_Location][Base_Sub_Location][segment_id][$eq]=${userDetails.lobs}`,
    //     //   serviceURL: 'mdm',
    //     //   headers: {
    //     //     Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
    //     //   }
    //     // }
    //     // const response: any = await getRequest(apiRequest)
    //     const apiRequest = {
    //       url: 'marketing/enquiry/reassign',
    //       data: {
    //         "school_code": userDetails?.schoolCode,
    //         "hris_code": userDetails?.hrisCodes?.length ? userDetails?.hrisCodes[0] : null
    //       }
    //     }
    //     const response: any = await postRequest(apiRequest)
    //     const filteredData = response?.data.filter((item: any) => item.attributes?.Official_Email_ID != userDetails?.userInfo?.email)
    //     // Handle the response here, e.g., set the state with the data
    //     setEmployeesList(filteredData)
    //   } catch (error) {
    //     console.error('Error fetching data:', error)
    //   }
    // }
  }, [])

  useEffect(() => {
    const searchRequest = async () => {
      setGlobalState({
        isLoading: true
      })
      try {
        const apiRequest = {
          url: `marketing/enquiry/list/global-search`,
          serviceURL: 'marketing',
          params: { page: page + 1, size: pageSize, search: debouncedSearchTerm }
        }
        const response: any = await getRequest(apiRequest)
        if (response?.status) {
          const rowsWithSerialNumber = response?.data?.content?.map((row: any, index: any) => ({
            ...row,
            serialNumber: calculateSerialNumber(index, page, pageSize)
          }))
          setEnquiryListing(rowsWithSerialNumber)
          // setacademicYears(data?.academicYears)
        }
      } catch (error) {
      } finally {
        setGlobalState({ isLoading: false }) // Stop loading
      }
    }
    if (debouncedSearchTerm && debouncedSearchTerm.length > 3) {
      searchRequest()
    }
  }, [debouncedSearchTerm])

  const handleStudentDetails = (params: any) => {
    router.push('/enquiries/view/' + params?.enquiryId)
  }

  //Passing Breadcrumbs
  useEffect(() => {
    setPagePaths([
      {
        title: 'Enquiries',
        path: '/enquiries'
      }
    ])
  }, [])

  return (
    <>
      <Box sx={{ background: '#fff', borderRadius: '10px', padding: '16px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            {/* {chipsLabel.map((label, index) => (
              <StyledChipProps
                key={index}
                label={label}
                onClick={() => handleToggle(label)}
                color={selectedOptions?.includes(label) ? 'primary' : 'default'}
                variant='filled'
                sx={{ mr: 4 }}
              />
            ))} */}
          </Box>
          <Box>
            {/* <SearchBox
              placeHolderTitle='Search Enquiry'
              searchText={searchText}
              handleClearSearch={handleClearSearch}
              handleInputChange={handleInputChange}
            /> */}
          </Box>
        </Box>
      </Box>
      <Box sx={{ background: '#fff', borderRadius: '10px', padding: '16px', mt: 6 }}>
        <Grid container spacing={7} xs={12} sx={{ pt: 0, mt: 2, ml: -3.5 }}>
          {enquiryListing?.map((student: any) => (
            <Grid
              item
              xs={12}
              md={6}
              lg={6}
              key={student.id}
              sx={{ '&.MuiGrid-item': { paddingTop: '0px !important' } }}
            >
              <Box
                sx={{
                  mb: 8,
                  padding: '24px',
                  borderRadius: '10px',
                  background:
                    student?.tagName === 'Registered'
                      ? theme.palette.customColors.text6
                      : theme.palette.customColors.surface2,
                  boxShadow: '0px 2px 10px 0px #4C4E6438'
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                    <Image src={StudentIcon} alt='student_icon' width={60} height={60} />
                    <Box sx={{ ml: 2, display: 'flex', justifyContent: 'flex-start', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        <Typography
                          variant='subtitle2'
                          color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                          sx={{ textTransform: 'capitalize', lineHeight: '18px' }}
                          onClick={() => handleStudentDetails(student)}
                        >
                          {student.studentName}
                        </Typography>
                        <Typography
                          variant='overline'
                          color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                          sx={{ textTransform: 'capitalize', ml: 1, letterSpacing: '0.25px', lineHeight: '18px' }}
                        >
                          {student.academicYear}
                        </Typography>
                      </Box>
                      <Typography
                        variant='overline'
                        color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                        sx={{ textTransform: 'capitalize', letterSpacing: '0.25px', lineHeight: '18px' }}
                      >
                        {student.enquiryNumber}
                      </Typography>
                      <Typography
                        variant='overline'
                        color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                        sx={{ textTransform: 'capitalize', letterSpacing: '0.25px', lineHeight: '18px' }}
                      >
                        {student.school}
                      </Typography>
                      <Typography
                        variant='overline'
                        color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                        sx={{ textTransform: 'capitalize', letterSpacing: '0.25px', lineHeight: '18px' }}
                      >
                        {student.grade} | {student.board} | {student.admission} | {student.shift}
                      </Typography>
                      <Typography
                        variant='overline'
                        color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                        sx={{ textTransform: 'capitalize', letterSpacing: '0.25px', lineHeight: '18px' }}
                      >
                        {student.stream}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                    <Box
                      sx={{
                        borderRadius: '8px',
                        backgroundColor:
                          student?.tagName === 'Registered'
                            ? theme.palette.customColors.text6
                            : theme.palette.customColors.primaryLightest,

                        padding: '10px 10px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        mr: 3
                      }}
                    >
                      <Typography
                        variant='body2'
                        color={student?.tagName === 'Registered' ? 'customColors.text3' : 'primary'}
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {student.status}
                      </Typography>
                    </Box>
                    <Box>
                      <span
                        onClick={handlePopOver}
                        className='icon-Menu-Dots-1'
                        style={{
                          color:
                            student?.tagName === 'Registered'
                              ? theme.palette.customColors.text3
                              : theme.palette.customColors.mainText,
                          cursor: 'pointer'
                        }}
                      ></span>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ mt: 3, mb: 3 }}>
                  <Divider />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <Typography
                    variant='caption'
                    color={student?.tagName === 'Registered' ? 'customColors.text3' : 'text.primary'}
                    sx={{ textTransform: 'capitalize', fontWeight: 500, lineHeight: '13.2px' }}
                  >
                    Important Note :
                  </Typography>
                  <Typography variant='caption' sx={{ textTransform: 'capitalize', lineHeight: '13.2px', ml: 2 }}>
                    <Link
                      href='#'
                      style={{
                        textDecoration: 'none',
                        color:
                          student?.tagName === 'Registered'
                            ? theme.palette.customColors.text3
                            : theme.palette.primary.dark
                      }}
                    >
                      {student.comment}
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handlePopOverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
      >
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          {' '}
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            Registration
          </Link>
        </Typography>
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          {' '}
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            Email
          </Link>
        </Typography>
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            School Tour
          </Link>
        </Typography>
        <Typography variant='subtitle1' sx={{ textTransform: 'capitalize', mb: 2 }}>
          {' '}
          <Link style={{ color: theme.palette.customColors.mainText, fontSize: '16px', lineHeight: '17.6px' }} href='#'>
            Timeline
          </Link>
        </Typography>
      </Popover>
    </>
  )
}

export default EnquiriesLayout
