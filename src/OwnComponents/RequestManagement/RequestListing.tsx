'use client'

import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Tooltip,
  IconButton,
  MenuItem,
  Menu,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Badge,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
} from '@mui/material'
import toast from 'react-hot-toast'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import {
  DataGrid,
  GridColDef,
  GridPaginationModel,
  GridRenderCellParams,
  useGridApiContext,
  useGridSelector,
  gridRowCountSelector,
  gridPageSizeSelector,
  GridPagination,
  GridSortModel
} from '@mui/x-data-grid'
import MuiPagination from '@mui/material/Pagination'
import { useRouter } from 'next/router'
import { getRequest, postRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import SearchBox from 'src/@core/CustomComponent/CustomSearchBox/SearchBox'
import DynamicFilterComponent from 'src/@core/CustomComponent/FilterComponent/DynamicFilterComponent'
import { getCurrentYearObject, getLocalStorageVal } from 'src/utils/helper'
import useDebounce from 'src/utils/useDebounce'
import { Can } from 'src/components/Can'
import { PERMISSIONS } from 'src/utils/constants'
import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'
import ErrorDialogBox from 'src/@core/CustomComponent/ErrorDialogBox/ErrorDialogBox'

function Pagination(props: any) {
  const { page, onPageChange, className } = props
  const apiRef = useGridApiContext()
  const rowCount = useGridSelector(apiRef, gridRowCountSelector)
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector)
  const pageCounts = Math.ceil(rowCount / pageSize)

  return (
    <MuiPagination
      color='primary'
      className={className}
      count={pageCounts}
      page={page + 1}
      shape='rounded'
      onChange={(event, newPage) => {
        onPageChange(event, newPage - 1)
      }}
    />
  )
}

function CustomPagination(props: any) {
  return <GridPagination ActionsComponent={Pagination} {...props} />
}

enum sortColoum {
  request_type = 'request_type',
  created_at = 'created_at',
  status_id = 'status_id',
  process_on = 'process_on'
}

enum sortOrder {
  asc = 'asc',
  desc = 'desc'
}

const RequestListing = () => {
  const { setPagePaths } = useGlobalContext()
  const router = useRouter()

  // State
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [rowCount, setRowCount] = useState(0)
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  })
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'activityDate', sort: 'desc' }])

  const [academicYear, setAcademicYear] = useState('')
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText, 500)
  const [isSearchInput, setIsSearchInput] = useState(false)
  const [filterOpen, setFilterOpen] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [filterOptions, setFilterOptions] = useState<any[]>([])
  const [filterValue, setFilterValue] = useState<any>('')
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [requestTypesData, setRequestTypesData] = useState<any[]>([])
  const [loadingRequestTypes, setLoadingRequestTypes] = useState(false)
  // Dialog for status details
  const [statusDetailOpen, setStatusDetailOpen] = useState(false)
  const [selectedDeptStatus, setSelectedDeptStatus] = useState<any>(null)

  // Cancel Request Dialog
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [cancelRemark, setCancelRemark] = useState('')

  const [anchorElNewRequest, setAnchorElNewRequest] = useState<null | HTMLElement>(null)
  const [cancelSuccessOpen, setCancelSuccessOpen] = useState(false)
  const [loadingCancel, setLoadingCancel] = useState(false)
  const [selectedMaster, setSelectedMaster] = useState<any>(null)
  const [loadingChecklists, setLoadingChecklists] = useState(false)
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false)
  const [loadingException, setLoadingException] = useState(false)
  const [exceptionSuccessOpen, setExceptionSuccessOpen] = useState(false)
  const [exceptionErrorOpen, setExceptionErrorOpen] = useState(false)
  const [exceptionErrorMessage, setExceptionErrorMessage] = useState('')
  const [loadingDownload, setLoadingDownload] = useState<string | number | null>(null)
  const [exceptionRemark, setExceptionRemark] = useState('')

  // General Error Dialog for API failures
  const [errorDialogOpen, setErrorDialogOpen] = useState(false)
  const [errorDialogMessage, setErrorDialogMessage] = useState('')

  const handleNewRequestClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorElNewRequest(event.currentTarget)
    if (requestTypesData.length === 0) {
      fetchRequestTypes()
    }
  }

  const handleNewRequestClose = () => {
    setAnchorElNewRequest(null)
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
  }

  const handleClearSearch = () => {
    setSearchText('')
    setIsSearchInput(false)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleSearchBar = () => {
    setIsSearchInput(!isSearchInput)
  }

  const toggleDrawer = (open: boolean) => (event: any) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return
    }
    setIsDrawerOpen(open)
  }

  const applysetFilteredColumns = () => {
    //
  }
  const handleDeptStatusClick = async (dept: string, row: any) => {
    setSelectedDeptStatus({ dept, status: row[dept.toLowerCase()], row })
    setStatusDetailOpen(true)
    setSelectedMaster(null)
    setLoadingChecklists(true)

    try {
      const userInfoStr = getLocalStorageVal('userInfo')
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null
      const userId = userInfo?.userInfo?.id

      const processId = row.requestId || row.id
      const reqType = row.requestType
      const typeSlug = reqType?.toLowerCase().includes('fac') ? 'fac_request' : 'lc_request'

      const apiRequest = {
        url: `/student-process-requests/check-list?process_id=${processId}&process_slug=${typeSlug}&user_id=${userId}`,
        serviceURL: 'admin'
      }
      const response: any = await getRequest(apiRequest)
      if (response && response.status === 200 && response.data) {
        // Find the master section that matches the department name
        const master = response.data.find(
          (m: any) =>
            m.checklist_master_name.toLowerCase().includes(dept.toLowerCase()) ||
            m.checklist_master_display_name.toLowerCase().includes(dept.toLowerCase())
        )
        if (master) {
          setSelectedMaster(master)
        }
      } else {
        setErrorDialogMessage(response?.message || 'Failed to fetch department checklists')
        setErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorDialogMessage('An error occurred while fetching department checklists')
      setErrorDialogOpen(true)
    } finally {
      setLoadingChecklists(false)
    }
  }
  // Cancel Request Handlers
  const handleCancelClick = (request: any) => {
    setSelectedRequest(request)
    setCancelRemark('')
    setCancelDialogOpen(true)
  }

  const handleRaiseExceptionClick = (request: any) => {
    setSelectedRequest(request)
    setExceptionRemark('')
    setExceptionDialogOpen(true)
  }

  const handleConfirmException = async () => {
    if (!selectedRequest) return

    setLoadingException(true)
    try {
      const processId = selectedRequest.requestId || selectedRequest.id

      const userInfoStr = getLocalStorageVal('userInfo')
      const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null
      const userId = userInfo?.userInfo?.id

      const apiRequest = {
        url: `/student-process-requests/trigger-workflow`,
        serviceURL: 'admin',
        data: {
          process_id: Number(processId),
          user_id: Number(userId),
          remark: exceptionRemark
        }
      }

      const response: any = await postRequest(apiRequest)
      if (response?.success) {
        setExceptionDialogOpen(false)
        setExceptionSuccessOpen(true)
        fetchRequests()
      } else {
        setExceptionErrorMessage(response?.message || 'Failed to raise exception')
        setExceptionErrorOpen(true)
      }
    } catch (error) {
      setExceptionErrorMessage('An error occurred while triggering the workflow')
      setExceptionErrorOpen(true)
    } finally {
      setLoadingException(false)
    }
  }

  const handleCancelDialogClose = () => {
    setCancelDialogOpen(false)
    setSelectedRequest(null)
    setCancelRemark('')
  }

  const handleSuccessDialogClose = () => {
    setCancelSuccessOpen(false)
  }

  const handleConfirmCancel = async () => {
    if (!cancelRemark.trim()) {
      return
    }

    setLoadingCancel(true)
    const idToCancel = selectedRequest?.requestId || selectedRequest?.id

    try {
      const apiRequest = {
        url: `/student-process-requests/cancel-lc-request?id=${idToCancel}`,
        serviceURL: 'admin',
        data: { remark: cancelRemark }
      }

      const response: any = await postRequest(apiRequest)

      if (response?.success) {
        fetchRequests()
        handleCancelDialogClose()
        setCancelSuccessOpen(true)
      } else {
        setErrorDialogMessage(response?.message || 'Failed to cancel request')
        setErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorDialogMessage('An error occurred while cancelling the request')
      setErrorDialogOpen(true)
    } finally {
      setLoadingCancel(false)
    }
  }

  const handleDownload = async (row: any) => {
    const idToDownload = row.requestId || row.id
    const lcNo = row.lcNumber || row.enrollmentNumber

    if (!lcNo) {
      toast.error('LC Number not found')
      return
    }

    const reqType = row.requestType
    const typeSlug = reqType?.toLowerCase().includes('fac') ? 'fac_request' : 'lc_request'

    setLoadingDownload(idToDownload)
    try {
      const apiRequest = {
        url: `/student-process-requests/generate-lc-pdf/${lcNo}`,
        serviceURL: 'admin',
        data: {
          uniqueRequestId: idToDownload,
          requestType: typeSlug,
          notificationType: 'new_request_created'
        },
        responseType: 'blob'
      }

      const response: any = await postRequest(apiRequest)

      if (response && !response.error) {
        const url = window.URL.createObjectURL(new Blob([response]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `LC_${lcNo}.pdf`)
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
        toast.success('Download started')
      } else {
        toast.error('Failed to download PDF')
      }
    } catch (error) {
      toast.error('An error occurred while downloading the PDF')
    } finally {
      setLoadingDownload(null)
    }
  }

  // DownArrow component for Select
  const DownArrow = () => <span style={{ color: '#666666', fontSize: '18px' }} className='icon-arrow-down-1'></span>

  const fetchRequests = useCallback(async () => {
    if (!academicYears.length) return

    setLoading(true)
    try {
      const selectedYearName = academicYear
      const selectedYear = academicYears.find((year: any) => year.attributes.name === selectedYearName)
      const short_name_two_digit = selectedYear?.attributes?.short_name_two_digit

      const payload: any = {}

      if (short_name_two_digit) payload.academic_year_id = Number(short_name_two_digit)
      if (debouncedSearchText) payload.search = debouncedSearchText

      const getFilterData = (field: string) => {
        return filterOptions.find((f: any) => f.field === field || f.name === field)
      }

      const brandFilter = getFilterData('brand')
      if (brandFilter?.itemID) payload.brand_id = Number(brandFilter.itemID)

      const boardFilter = getFilterData('board')
      if (boardFilter?.itemID) payload.board_id = Number(boardFilter.itemID)

      const gradeFilter = getFilterData('grade')
      if (gradeFilter?.itemID) payload.grade_id = Number(gradeFilter.itemID)

      const requestTypeFilter = getFilterData('requestType')
      if (requestTypeFilter) {
        const val = requestTypeFilter.itemID || requestTypeFilter.value
        if (val) {
          const typeObj = requestTypesData.find((t: any) => t.slug === val || t.name === val)
          payload.request_type = typeObj ? `'${typeObj.slug}'` : `'${val}'`
        }
      }

      // Sorting logic
      if (sortModel.length > 0) {
        const { field, sort } = sortModel[0]
        const fieldMap: any = {
          requestType: sortColoum.request_type,
          activityDate: sortColoum.created_at,
          status: sortColoum.status_id
        }

        if (fieldMap[field]) {
          payload.sort_coloum = fieldMap[field]
          payload.sort_order = sort === 'asc' ? sortOrder.asc : sortOrder.desc
        }
      }

      const apiRequest = {
        url: `/student-process-requests/process-request-list?page=${paginationModel.page + 1}&size=${
          paginationModel.pageSize
        }`,
        serviceURL: 'admin',
        data: payload
      }

      const response: any = await postRequest(apiRequest)
      if (response?.success && response?.data && Array.isArray(response.data.data)) {
        const mappedData = response.data.data.map((item: any, index: number) => ({
          id: item.id || index + paginationModel.page * paginationModel.pageSize, // Safe ID for DataGrid
          requestId: item.process_request_id || item.id,
          studentName: item.name,
          enrollmentNumber: item.enrollment_number,
          brandBoardGrade: item.brand_board_grade,
          requestType: item.request_type,
          activityDate: item.activity_date ? new Date(item.activity_date).toLocaleDateString('en-GB') : '',
          status: item.status,

          academic: item.academic_request,
          finance: item.finance_request,
          library: item.library_request,
          sales: item.sales_request,
          // transport: item.transport_status || item.transport_request,
          principal: item.principal_request,

          // Action Permissions
          canEdit: item.edit,
          canCancel: item.request_cancel,
          canDownload: item.download,
          canProcess: !!item.process_request_id,
          canList: item.list,
          workflow: item.workflow,
          lcNumber: item.lc_number
        }))
        setRequests(mappedData)
        setRowCount(response.data.pagination?.totalRecords || 0)
      } else {
        setRequests([])
        setRowCount(0)
        if (response?.message) {
          setErrorDialogMessage(response.message)
          setErrorDialogOpen(true)
        } else if (!response?.success) {
          setErrorDialogMessage('Failed to fetch requests')
          setErrorDialogOpen(true)
        }
      }
    } catch (error) {
      setErrorDialogMessage('An error occurred while fetching requests')
      setErrorDialogOpen(true)
      setRequests([])
      setRowCount(0)
    } finally {
      setLoading(false)
    }
  }, [paginationModel, sortModel, debouncedSearchText, academicYear, filterOptions, academicYears, requestTypesData])

  useEffect(() => {
    const saved = sessionStorage.getItem('requestFilters')
    const filters = saved ? JSON.parse(saved) : []

    setFilterOptions(filters)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [])

  useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }, [filterOptions, academicYear, debouncedSearchText])

  useEffect(() => {
    const fetchAcademicYears = async () => {
      try {
        const apiRequest = {
          url: `/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc&filters[is_active][$eq]=true`,
          serviceURL: 'mdm',
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}`
          }
        }
        const response: any = await getRequest(apiRequest)
        if (response?.data && response?.data?.length) {
          setAcademicYears(response.data)

          const currentYear = getCurrentYearObject(response?.data)
          if (currentYear && currentYear?.length) {
            setAcademicYear(currentYear[0]?.attributes?.name)
          } else if (response.data.length > 0) {
            setAcademicYear(response.data[0]?.attributes?.name)
          }
        }
      } catch (error) {}
    }
    fetchAcademicYears()
    fetchRequestTypes()
    setPagePaths([{ title: 'Request Listing', path: '/request-listing' }])
  }, [])

  const fetchRequestTypes = async () => {
    setLoadingRequestTypes(true)
    try {
      const apiRequest = {
        url: `/student-process-requests/request-types?status=1`,
        serviceURL: 'admin'
      }
      const response: any = await postRequest(apiRequest)
      if (response?.success && response?.data) {
        setRequestTypesData(response.data)
      } else {
        setErrorDialogMessage(response?.message || 'Failed to fetch request types')
        setErrorDialogOpen(true)
      }
    } catch (error) {
      setErrorDialogMessage('An error occurred while fetching request types')
      setErrorDialogOpen(true)
    } finally {
      setLoadingRequestTypes(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const renderDeptStatus = (dept: string, params: GridRenderCellParams) => {
    const rawValue = params.row[dept.toLowerCase()]
    const statusStr = rawValue ? rawValue.toString() : 'pending'

    const isCompleted = statusStr.toLowerCase() === 'completed'
    const label = statusStr.charAt(0).toUpperCase() + statusStr.slice(1)

    const bgColor = isCompleted ? '#cdf3e2' : '#e2e3e5'
    const textColor = isCompleted ? '#06c270' : '#383d41'

    return (
      <Box
        onClick={() => handleDeptStatusClick(dept, params.row)}
        sx={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', width: '100%', alignItems: 'center' }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: '16px',
            px: 2.5,
            py: 1.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: bgColor,
            color: textColor,
            textAlign: 'center',
            width: 'fit-content',
            minWidth: '85px',
            textTransform: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {label}
        </Typography>
      </Box>
    )
  }

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'studentName',
        headerName: 'Student Name',
        minWidth: 180,
        flex: 1.5,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(58, 53, 65, 0.87)' }}>{params.value}</Typography>
        )
      },
      {
        field: 'enrollmentNumber',
        headerName: 'Enrollment Number',
        minWidth: 150,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(58, 53, 65, 0.87)' }}>{params.value}</Typography>
        )
      },
      {
        field: 'brandBoardGrade',
        headerName: 'Brand - Board - Grade',
        minWidth: 250,
        flex: 2,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(58, 53, 65, 0.87)' }}>{params.value}</Typography>
        )
      },
      {
        field: 'requestType',
        headerName: 'Request Type',
        minWidth: 150,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(58, 53, 65, 0.87)' }}>{params.value}</Typography>
        )
      },
      {
        field: 'activityDate',
        headerName: 'Activity Date',
        minWidth: 120,
        flex: 1,
        renderCell: (params: GridRenderCellParams) => (
          <Typography sx={{ fontSize: '0.8125rem', color: 'rgba(58, 53, 65, 0.87)' }}>{params.value}</Typography>
        )
      },
      {
        field: 'status',
        headerName: 'Status',
        minWidth: 180,
        flex: 1.2,
        renderCell: (params: GridRenderCellParams) => {
          const status = params.value as string
          let color = '#383d41'
          const icon = null

          if (status === 'Completed') color = '#1E40AF'
          if (status === 'In Progress' || status === 'Pending') color = '#7b818eff'
          if (status === 'Exception Raised') {
            color = '#EAB308'
          }
          if (status === 'Exception approved' || status === 'exception approved') color = '#06c270'
          if (status === 'Exception Rejected') color = '#EF4444'
          if (status === 'cancelled') color = '#EF4444'
          if (status === 'New Request') color = '#ef44ecff'

          return (
            <Typography sx={{ fontSize: '0.8125rem', color: color, display: 'flex', alignItems: 'center' }}>
              {icon}
              {status}
            </Typography>
          )
        }
      },
      // Combined Department Status Headers
      {
        field: 'academic',
        headerName: 'Academic',
        minWidth: 110,
        flex: 1,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: params => renderDeptStatus('Academic', params)
      },
      {
        field: 'finance',
        headerName: 'Finance',
        minWidth: 110,
        flex: 1,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: params => renderDeptStatus('Finance', params)
      },
      {
        field: 'library',
        headerName: 'Library',
        minWidth: 110,
        flex: 1,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: params => renderDeptStatus('Library', params)
      },
      {
        field: 'sales',
        headerName: 'Sales',
        minWidth: 110,
        flex: 1,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: params => renderDeptStatus('Sales', params)
      },
      {
        field: 'principal',
        headerName: 'Principal',
        minWidth: 110,
        flex: 1,
        headerAlign: 'center',
        align: 'center',
        sortable: false,
        renderCell: params => renderDeptStatus('Principal', params)
      },
      {
        field: 'actions',
        headerName: 'Actions',
        sortable: false,
        minWidth: 220,
        flex: 1.5,
        headerAlign: 'center',
        align: 'center',
        renderCell: (params: GridRenderCellParams) => {
          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Edit */}
              <Can pagePermission={[PERMISSIONS?.EDIT_BUTTON]} action={'HIDE'}>
                <Tooltip title='Edit Request'>
                  <span>
                    <IconButton
                      size='small'
                      color='info'
                      disabled={!params.row.canEdit}
                      onClick={() => {
                        const reqType = params.row.requestType
                        const editId = params.row.requestId || params.row.id

                        if (editId) {
                          if (reqType === 'FAC Request' || reqType?.toLowerCase() === 'fac request') {
                            router.push(`/request-listing/edit-lc-request/${editId}?type=fac_request`)
                          } else {
                            router.push(`/request-listing/edit-lc-request/${editId}`)
                          }
                        }
                      }}
                    >
                      <span className='icon-edit' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Can>

              {/* Process */}
              <Can pagePermission={[PERMISSIONS?.PROCESS_BUTTON]} action={'HIDE'}>
                <Tooltip title='LC Processing'>
                  <span>
                    <IconButton
                      size='small'
                      color='primary'
                      disabled={!params.row.canList}
                      onClick={() => {
                        const processId = params.row.requestId || params.row.id
                        if (processId) {
                          const reqType = params.row.requestType
                          const typeSlug = reqType?.toLowerCase().includes('fac') ? 'fac_request' : 'lc_request'
                          router.push(`/request-listing/lc-processing/${processId}?type=${typeSlug}`)
                        }
                      }}
                    >
                      <span className='icon-document' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Can>

              {/* Cancel */}
              <Can pagePermission={[PERMISSIONS?.CANCEL_BUTTON]} action={'HIDE'}>
                <Tooltip title='Cancel Request'>
                  <span>
                    <IconButton
                      size='small'
                      color='error'
                      disabled={!params.row.canCancel}
                      onClick={() => handleCancelClick(params.row)}
                    >
                      <span className='icon-close-circle' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Can>

              {/* Raise Exception */}
              <Can pagePermission={[PERMISSIONS?.RAISE_EXCEPTION_BUTTON]} action={'HIDE'}>
                <Tooltip title='Raise Exception'>
                  <span>
                    <IconButton
                      size='small'
                      disabled={!params.row.workflow}
                      sx={{
                        color: () => {
                          const status = (params.row.status?.toString() || '').toLowerCase()
                          if (status.includes('exception raised')) return '#EAB308 !important'
                          if (status.includes('exception approved')) return '#06c270 !important'
                          if (status.includes('exception rejected')) return '#EF4444 !important'
                          return '#718096'
                        }
                      }}
                      onClick={() => handleRaiseExceptionClick(params.row)}
                    >
                      <span className='icon-code-pull-request' />
                    </IconButton>
                  </span>
                </Tooltip>
              </Can>

              {/* Download */}
              <Can pagePermission={[PERMISSIONS?.DOWNLOAD_BUTTON]} action={'HIDE'}>
                <Tooltip title='Download'>
                  <span>
                    <IconButton
                      size='small'
                      color='secondary'
                      disabled={!params.row.canDownload || loadingDownload === (params.row.requestId || params.row.id)}
                      onClick={() => handleDownload(params.row)}
                    >
                      {loadingDownload === (params.row.requestId || params.row.id) ? (
                        <CircularProgress size={16} sx={{ color: '#0026ff' }} />
                      ) : (
                        <span className='icon-document-download' />
                      )}
                    </IconButton>
                  </span>
                </Tooltip>
              </Can>
            </Box>
          )
        }
      }
    ],
    [loadingDownload]
  )

  const filterSectionData = [
    {
      name: 'Brand',
      value: 'brand',
      operators: [{ name: 'Equals', value: 'equals' }]
    },
    {
      name: 'Board',
      value: 'board',
      operators: [{ name: 'Equals', value: 'equals' }]
    },
    {
      name: 'Grade',
      value: 'grade',
      operators: [{ name: 'Equals', value: 'equals' }]
    },
    {
      name: 'Request Type',
      value: 'requestType',
      operators: [{ name: 'Equals', value: 'equals' }]
    }
  ]

  const handleApplyFilterUrl = (filters: any) => {
    sessionStorage.setItem('requestFilters', JSON.stringify(filters))
    setFilterOptions(filters)
  }

  const filtersSelected = () => {
    // Handle specific filter selections
  }

  const selectedFilterData = (status: any) => {
    if (status === 'requestType') {
      const formattedTypes = requestTypesData.map(type => ({ id: type.slug, attributes: { name: type.name } }))
      setFilterValue(formattedTypes)
    } else if (['board', 'course', 'stream', 'grade', 'brand', 'requestType'].includes(status)) {
      const fetchFilters = async () => {
        try {
          const apiRequest = {
            url: `/board/ac-filters?type=${status}`,
            serviceURL: 'admin'
          }
          const response: any = await getRequest(apiRequest)
          if (response?.success && response?.data) {
            const formatted = response.data.map((item: any) => ({
              id: item.id,
              attributes: { name: item.name }
            }))
            setFilterValue(formatted)
          } else if (status === 'brand') {
            setFilterValue([])
          }
        } catch (error) {}
      }
      fetchFilters()
    }
  }

  return (
    <>
      <Can pagePermission={[PERMISSIONS?.REQUEST_LISTING_PAGE]} action={'HIDE'}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'nowrap' }}>
          <Box sx={{ background: '#fff', borderRadius: '10px', width: '100%', height: '100%' }}>
            <Grid container>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', mt: 3 }}>
                    <FormControl sx={{ ml: 0, minWidth: 150 }} size='small'>
                      <InputLabel>Academic Year</InputLabel>
                      <Select
                        value={academicYear}
                        label='Academic Year'
                        onChange={e => {
                          setAcademicYear(e.target.value)
                          setPaginationModel(prev => ({ ...prev, page: 0 }))
                        }}
                        sx={{ height: '48px' }}
                        IconComponent={DownArrow}
                      >
                        {academicYears.map((year: any) => (
                          <MenuItem key={year.id} value={year.attributes.name}>
                            {year.attributes.name}
                          </MenuItem>
                        ))}
                        {!academicYears.length && <MenuItem value='2024 - 25'>2024 - 25</MenuItem>}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ mt: 3, ml: 3, display: 'flex', alignItems: 'center' }}>
                    {isSearchInput ? (
                      <Box sx={{ mr: 2 }}>
                        <SearchBox
                          placeHolderTitle='Search by Student Name, Enrollment Number, or Request Type'
                          searchText={searchText}
                          handleClearSearch={handleClearSearch}
                          handleInputChange={handleInputChange}
                        />
                      </Box>
                    ) : null}
                    {!isSearchInput ? (
                      <Tooltip title='Search'>
                        <Fab size='small' sx={{ mr: 3, borderRadius: '100%', zIndex: 1 }} onClick={handleSearchBar}>
                          <span className='icon-search-normal-1'></span>
                        </Fab>
                      </Tooltip>
                    ) : null}

                    <Badge
                      color='error'
                      badgeContent={filterCount}
                      sx={{
                        '& .MuiBadge-badge': {
                          width: '20px',
                          height: '20px',
                          top: 7,
                          right: 20,
                          zIndex: 1
                        }
                      }}
                    >
                      <Button
                        variant='contained'
                        color='inherit'
                        sx={{ mr: 3 }}
                        startIcon={<span className='icon-filter-search'></span>}
                        onClick={toggleDrawer(true)}
                      >
                        Filter
                      </Button>
                    </Badge>

                    <Can pagePermission={[PERMISSIONS?.NEW_REQUEST_BUTTON]} action={'HIDE'}>
                      <Button
                        variant='contained'
                        color='secondary'
                        startIcon={<span className='icon-add'></span>}
                        onClick={handleNewRequestClick}
                        sx={{ mr: -1 }}
                      >
                        New Request
                      </Button>
                    </Can>
                    <Menu
                      anchorEl={anchorElNewRequest}
                      open={Boolean(anchorElNewRequest)}
                      onClose={handleNewRequestClose}
                    >
                      {loadingRequestTypes ? (
                        <MenuItem disabled>Loading...</MenuItem>
                      ) : requestTypesData.length > 0 ? (
                        requestTypesData.map((type: any) => (
                          <MenuItem
                            key={type.slug}
                            onClick={() => {
                              handleNewRequestClose()
                              if (
                                type.slug === 'lc_reasons' ||
                                type.slug === 'lc_request' ||
                                type.name?.toLowerCase() === 'lc request'
                              ) {
                                router.push('/request-listing/new-lc-request')
                              } else if (type.slug === 'fac_request') {
                                router.push('/request-listing/new-lc-request?type=fac_request')
                              } else {
                              }
                            }}
                          >
                            {type.name}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem disabled>No request types found</MenuItem>
                      )}
                    </Menu>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sx={{ mt: 3 }}>
                <DataGrid
                  rows={requests}
                  columns={columns}
                  rowCount={rowCount}
                  loading={loading}
                  paginationModel={paginationModel}
                  onPaginationModelChange={setPaginationModel}
                  paginationMode='server'
                  sortModel={sortModel}
                  onSortModelChange={setSortModel}
                  sortingMode='server'
                  pageSizeOptions={[10, 20, 50]}
                  slots={{ pagination: CustomPagination }}
                  disableRowSelectionOnClick
                  autoHeight
                  sx={{
                    '& .MuiDataGrid-columnHeader': {
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600,
                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                      borderBottom: '1px solid rgba(224, 224, 224, 1)'
                    },
                    '& .MuiDataGrid-cell': {
                      display: 'flex',
                      alignItems: 'center',
                      py: 1,
                      borderRight: '1px solid rgba(224, 224, 224, 1)',
                      borderBottom: '1px solid rgba(224, 224, 224, 1)'
                    },
                    '& .MuiDataGrid-row': {
                      '&:hover': {
                        backgroundColor: '#fafafa'
                      }
                    },
                    '& .MuiDataGrid-virtualScroller': {
                      overflowX: 'auto !important'
                    },
                    border: '1px solid rgba(224, 224, 224, 1)',
                    '& .MuiDataGrid-columnSeparator': {
                      visibility: 'visible',
                      color: 'rgba(224, 224, 224, 1)'
                    },
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>

        <DynamicFilterComponent
          filterOpen={filterOpen}
          setFilterOpen={setFilterOpen}
          isDrawerOpen={isDrawerOpen}
          setDrawerOpen={setIsDrawerOpen}
          toggleDrawer={toggleDrawer}
          isFilterSection={true}
          filterSectionData={filterSectionData}
          selectedFilterData={selectedFilterData}
          filterValue={filterValue}
          filtersSelected={filtersSelected}
          filterSelectedSentData={filterOptions}
          isColumnSection={false}
          columnSectionData={[]}
          isStickyColumnSection={false}
          stickyColumnSectionData={[]}
          filterCount={setFilterCount}
          setfilterOptionsProps={handleApplyFilterUrl}
          setFilteredColumns={applysetFilteredColumns}
          clearFilter={() => {
            setFilterOptions([])
            setPaginationModel(prev => ({ ...prev, page: 0 }))
            setFilterCount(0)
            sessionStorage.removeItem('requestFilters')
          }}
          setDisplayEarlierFilter={filterOptions}
          pageName='requestFilters'
        />

        <Dialog
          open={statusDetailOpen}
          onClose={() => setStatusDetailOpen(false)}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              p: 2,
              position: 'relative'
            }
          }}
        >
          <IconButton
            onClick={() => setStatusDetailOpen(false)}
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: '#718096'
            }}
          >
            <CloseIcon />
          </IconButton>

          <DialogTitle sx={{ pb: 2, pt: 3, fontWeight: 600, fontSize: '1.5rem', color: '#2D3748' }}>
            {selectedDeptStatus?.dept}
          </DialogTitle>

          <DialogContent sx={{ p: 4, pt: 1 }}>
            {loadingChecklists ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={40} />
              </Box>
            ) : selectedMaster?.checklists?.length > 0 ? (
              <Box>
                {selectedMaster.checklists.map((item: any) => (
                  <Box
                    key={item.checklist_id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2.5,
                      mb: 2,
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      backgroundColor: '#FFFFFF',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: '0px 2px 4px rgba(0,0,0,0.05)',
                        borderColor: '#CBD5E0'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ ml: 1 }}>
                        <Typography sx={{ fontWeight: 500, color: '#4A5568', fontSize: '0.95rem' }}>
                          {item.checklist_display_name}
                        </Typography>
                      </Box>
                    </Box>
                    {item.is_checked === 1 ? (
                      <CheckCircleIcon sx={{ color: '#10B981', fontSize: '1.25rem' }} />
                    ) : (
                      <WarningAmberIcon sx={{ color: '#EF4444', fontSize: '1.25rem' }} />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <Typography color='textSecondary'>No verification items found for this department.</Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 4, pb: 4, justifyContent: 'center' }}>
            <Button
              variant='contained'
              onClick={() => setStatusDetailOpen(false)}
              sx={{
                borderRadius: '30px',
                px: 8,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#3F51B5',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#303F9F'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Cancel Request Dialog */}
        <Dialog
          open={cancelDialogOpen}
          onClose={handleCancelDialogClose}
          PaperProps={{
            sx: {
              borderRadius: '20px',
              p: 4,
              width: '100%',
              maxWidth: '500px',
              boxShadow: '0px 10px 40px rgba(0, 0, 0, 0.1)'
            }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant='h6' sx={{ fontWeight: 600, color: '#2D3748', fontSize: '1.75rem' }}>
              Cancel Request
            </Typography>
            <IconButton onClick={handleCancelDialogClose} size='small' sx={{ color: '#718096' }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <DialogContent sx={{ p: 0, mb: 10 }}>
            <Typography sx={{ color: '#718096', mb: 3, fontSize: '1.15rem' }}>
              Do You Want To Cancel The Request?
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              value={cancelRemark}
              onChange={e => setCancelRemark(e.target.value)}
              placeholder='Enter your reason here...'
              label={
                <Typography component='span' sx={{ fontSize: '0.9rem' }}>
                  Enter Remark<span style={{ color: '#E53E3E' }}>*</span>
                </Typography>
              }
              InputProps={{
                sx: {
                  opacity: 1,
                  '& textarea': {
                    color: '#2D3748 !important',
                    caretColor: '#2D3748 !important',
                    WebkitTextFillColor: '#2D3748 !important',
                    opacity: '1 !important'
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: 'auto !important',
                  padding: '12px 14px',
                  '& fieldset': { borderColor: '#CBD5E0' },
                  '&:hover fieldset': { borderColor: '#A0AEC0' },
                  '&.Mui-focused fieldset': { borderColor: '#4A5568' }
                },
                '& .MuiInputLabel-root': {
                  color: '#718096',
                  '&.Mui-focused': { color: '#4A5568' }
                }
              }}
            />
          </DialogContent>

          <DialogActions sx={{ p: 0, justifyContent: 'flex-end', gap: 3 }}>
            <Button
              variant='outlined'
              onClick={handleCancelDialogClose}
              sx={{
                borderRadius: '30px',
                px: 8,
                py: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#4A5568',
                borderColor: '#4A5568',
                minWidth: '100px',
                '&:hover': {
                  borderColor: '#2D3748',
                  backgroundColor: '#F7FAFC'
                }
              }}
            >
              No
            </Button>
            <Button
              variant='contained'
              onClick={handleConfirmCancel}
              disabled={!cancelRemark.trim() || loadingCancel}
              sx={{
                borderRadius: '30px',
                px: 8,
                py: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                backgroundColor: '#3F51B5',
                minWidth: '100px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#303F9F',
                  boxShadow: '0px 4px 12px rgba(63, 81, 181, 0.4)'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#C5CAE9',
                  color: '#FFFFFF'
                }
              }}
            >
              {loadingCancel ? <CircularProgress size={24} color='inherit' /> : 'Yes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Dialog */}
        <Dialog
          open={cancelSuccessOpen}
          onClose={handleSuccessDialogClose}
          PaperProps={{
            sx: {
              borderRadius: '15px',
              p: 2,
              minWidth: '300px'
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold' }}>Success</DialogTitle>
          <DialogContent>
            <Typography sx={{ textAlign: 'center' }}>Request cancelled successfully</Typography>
          </DialogContent>
          <DialogActions sx={{ justifyContent: 'center' }}>
            <Button onClick={handleSuccessDialogClose} variant='contained' color='primary'>
              OK
            </Button>
          </DialogActions>
        </Dialog>
        {/* Raise Exception Request Dialog */}
        <Dialog
          open={exceptionDialogOpen}
          onClose={() => !loadingException && setExceptionDialogOpen(false)}
          maxWidth='sm'
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '20px',
              padding: '24px',
              maxWidth: '500px'
            }
          }}
        >
          <DialogTitle sx={{ p: 0, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h5' sx={{ fontWeight: 700, color: '#1A202C' }}>
              Raise Exception Request
            </Typography>
            <IconButton
              onClick={() => setExceptionDialogOpen(false)}
              sx={{ color: '#718096' }}
              disabled={loadingException}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ p: 0, mb: 4 }}>
            <Typography sx={{ color: '#4A5568', fontSize: '1.125rem', lineHeight: 1.6, mb: 4 }}>
              An exception workflow will be raised for this request. Would you like to proceed?
            </Typography>

            <TextField
              fullWidth
              multiline
              rows={4}
              value={exceptionRemark}
              onChange={e => setExceptionRemark(e.target.value)}
              placeholder='Enter your remark here...'
              label={
                <Typography component='span' sx={{ fontSize: '0.9rem' }}>
                  Enter Remark<span style={{ color: '#E53E3E' }}>*</span>
                </Typography>
              }
              InputProps={{
                sx: {
                  opacity: 1,
                  '& textarea': {
                    color: '#2D3748 !important',
                    caretColor: '#2D3748 !important',
                    WebkitTextFillColor: '#2D3748 !important',
                    opacity: '1 !important'
                  }
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  height: 'auto !important',
                  padding: '12px 14px',
                  '& fieldset': { borderColor: '#CBD5E0' },
                  '&:hover fieldset': { borderColor: '#A0AEC0' },
                  '&.Mui-focused fieldset': { borderColor: '#4A5568' }
                },
                '& .MuiInputLabel-root': {
                  color: '#718096',
                  '&.Mui-focused': { color: '#4A5568' }
                }
              }}
            />
          </DialogContent>

          <DialogActions sx={{ p: 0, justifyContent: 'flex-end', gap: 3 }}>
            <Button
              variant='outlined'
              onClick={() => setExceptionDialogOpen(false)}
              disabled={loadingException}
              sx={{
                borderRadius: '30px',
                px: 8,
                py: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                color: '#4A5568',
                borderColor: '#CBD5E0',
                minWidth: '100px',
                '&:hover': {
                  borderColor: '#A0AEC0',
                  backgroundColor: '#F7FAFC'
                }
              }}
            >
              No
            </Button>
            <Button
              variant='contained'
              onClick={handleConfirmException}
              disabled={loadingException || !exceptionRemark.trim()}
              sx={{
                borderRadius: '30px',
                px: 8,
                py: 2.5,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                backgroundColor: '#3F51B5',
                minWidth: '100px',
                boxShadow: 'none',
                '&:hover': {
                  backgroundColor: '#303F9F',
                  boxShadow: '0px 4px 12px rgba(63, 81, 181, 0.4)'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#C5CAE9',
                  color: '#FFFFFF'
                }
              }}
            >
              {loadingException ? <CircularProgress size={24} color='inherit' /> : 'Yes'}
            </Button>
          </DialogActions>
        </Dialog>

        <SuccessDialog
          openDialog={exceptionSuccessOpen}
          handleClose={() => setExceptionSuccessOpen(false)}
          title='Exception Raised Successfully'
        />

        <ErrorDialogBox
          openDialog={exceptionErrorOpen}
          handleClose={() => setExceptionErrorOpen(false)}
          title={exceptionErrorMessage}
        />

        {/* General Error Dialog for API Failures */}
        <ErrorDialogBox
          openDialog={errorDialogOpen}
          handleClose={() => setErrorDialogOpen(false)}
          title={errorDialogMessage}
        />
      </Can>
    </>
  )
}

export default RequestListing
