'use client'
import React, { useState, useEffect } from 'react'
import Grid from '@mui/material/Grid'
import { Box } from '@mui/system'
import {
  Button,
  IconButton,
  Tooltip,
  Typography,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material'
import SearchBox from 'src/OwnComponents/SharedUIComponent/SearchBox'
import DynamicFilterComponent from 'src/@core/CustomComponent/FilterComponent/DynamicFilterComponent'
import { getRequest, postRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import useDebounce from 'src/utils/useDebounce'
import { calculateSerialNumber, getCurrentYearObject, getCurrentAcademicYear } from 'src/utils/helper'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material'
import MuiPagination from '@mui/material/Pagination'



// ─── Main Component ───────────────────────────────────────────────────────────

function KidsClubListing() {
  const { setPagePaths, userInfo } = useGlobalContext()
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText, 500)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [selectedAY, setSelectedAY] = useState<any>(getCurrentAcademicYear())
  const [listMode] = useState<'all' | 'active' | 'inactive'>('all')

  // Filter States
  const [filterOpen, setFilterOpen] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [filterCount, setFilterCount] = useState(0)
  const [filterOptions, setFilterOptions] = useState<any[]>([])
  const [filterValue, setFilterValue] = useState<any>('')

  const [academicYears, setAcademicYears] = useState<any[]>([])

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
            setSelectedAY(currentYear[0]?.attributes?.short_name_two_digit)
          } else if (response.data.length > 0) {
            setSelectedAY(response.data[0]?.attributes?.short_name_two_digit)
          }
        }
      } catch (error) {}
    }
    fetchAcademicYears()
    setPagePaths([{ title: 'Kids Club Student Listing', path: '/kids-club-listing' }])
  }, [])

  useEffect(() => {
    if (selectedAY) {
      fetchKidsClubListing()
    }
  }, [debouncedSearchText, paginationModel.page, paginationModel.pageSize, filterOptions, selectedAY, listMode])

  const fetchKidsClubListing = async () => {
    setLoading(true)
    try {
      // Extract school IDs from userInfo
      const userSchoolIds = userInfo?.userInfo?.schoolIds || []

      // Collect other filters into filterName
      const payload = {
        academic_year_id: [selectedAY],
        filterName: filterOptions.map((f: any) => ({ ...f, value: Array.isArray(f.value) ? f.value : [f.value] })),
        page: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        school_id: userSchoolIds,
        status: listMode !== 'all' ? (listMode === 'active' ? 1 : 2) : null,
        search: debouncedSearchText
      }

      const apiRequest = {
        url: '/studentProfile/kids-club-list',
        serviceURL: 'admin',
        data: payload
      }

      const response: any = await postRequest(apiRequest)
      if (response && response.success) {
        const resultData = response.data?.data || []
        const total = response.data?.meta?.total || 0

        setData(
          resultData.map((item: any, index: number) => ({
            ...item,
            serialNumber: calculateSerialNumber(index, paginationModel.page, paginationModel.pageSize),
            // Map API fields to table fields based on the provided JSON structure
            studentName: item.student_name || `${item.first_name || ''} ${item.middle_name ? item.middle_name + ' ' : ''}${item.last_name || ''}`.trim(),
            schoolName: item.school_name,
            enrollmentNo: item.crt_enr_on,
            studentType: '',
            grade: item.grade_name,
            status: item.status === 1 ? 'Active' : 'Inactive'
          }))
        )
        setTotalCount(total)
      } else {
        setData([])
        setTotalCount(0)
      }
    } catch (error) {
      setData([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleAYChange = (event: SelectChangeEvent) => {
    setSelectedAY(event.target.value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleClearSearch = () => {
    setSearchText('')
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }



  const filterSectionData = [
    {
      name: 'School',
      value: 'school',
      operators: [{ name: 'Equals', value: 'equals' }]
    },
    {
      name: 'Grade',
      value: 'grade',
      operators: [{ name: 'Equals', value: 'equals' }]
    },
    {
      name: 'Student Type',
      value: 'studentType',
      operators: [{ name: 'Equals', value: 'equals' }]
    }
  ]

  const handleApplyFilterUrl = (filters: any) => {
    setFilterOptions(filters)
    setPaginationModel(prev => ({ ...prev, page: 0 }))
  }

  const handleView = (row: any) => {
    const url = `${process.env.NEXT_PUBLIC_FRONT_ACADEMICS_URL}/student-listing/student-detail/${row.id}/`
    window.location.href = url
  }

  const handleViewDetails = (row: any) => {
    const url = `${process.env.NEXT_PUBLIC_FRONT_ACADEMICS_URL}/student-listing/student-detail-view/${row.id}/`
    window.location.href = url
  }

  const selectedFilterData = (status: any) => {
    if (status === 'studentType') {
      setFilterValue([
        { id: 'vibgyor', attributes: { name: 'Vibgyor' } },
        { id: 'non-vibgyor', attributes: { name: 'Non Vibgyor' } }
      ])
    } else {
      const fetchFilters = async () => {
        try {
          let url = ''
          const serviceURL: 'admin' | 'mdm' = 'admin'
          if (status === 'school') {
            url = '/api/ac-schools/search-school'
          } else if (status === 'grade') {
            url = '/board/ac-filters?type=grade'
          }

          if (url) {
            const apiRequest = {
              url: url,
              serviceURL: serviceURL
            }
            const response: any = await getRequest(apiRequest)
            if (response?.success && response?.data) {
              const formatted = response.data.map((item: any) => ({
                id: item.id,
                attributes: { name: item.name }
              }))
              setFilterValue(formatted)
            } else if (response?.status && Array.isArray(response?.data)) {
              // Handle search-school response format if different
              const formatted = response.data.map((item: any) => ({
                id: item.id,
                attributes: { name: item.name }
              }))
              setFilterValue(formatted)
            }
          }
        } catch (error) {}
      }
      fetchFilters()
    }
  }

  const toggleDrawer = (open: boolean) => (event: any) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return
    }
    setIsDrawerOpen(open)
  }

  const columns: any[] = [
    { field: 'serialNumber', headerName: 'Sr. No.', minWidth: 80, sortable: true },
    { field: 'enrollmentNo', headerName: 'Enrolment No', minWidth: 160, sortable: true },
    { field: 'schoolName', headerName: 'School Name', minWidth: 200, sortable: true },
    { field: 'studentName', headerName: 'Student Name', minWidth: 200, sortable: true },
    { field: 'grade', headerName: 'Grade', minWidth: 100, sortable: true },
    { field: 'studentType', headerName: 'Student Type', minWidth: 140, sortable: true },
        { field: 'status', headerName: 'Status', minWidth: 140, sortable: true },

    { field: 'actions', headerName: 'Action', minWidth: 120, align: 'center' }
  ]

  return (
    <Grid container spacing={6} sx={{ p: 2, backgroundColor: '#f4f5fa', minHeight: '100vh' }}>
      <Grid item xs={12}>
        

        <Paper sx={{ p: 4, borderRadius: '15px', backgroundColor: '#fff', boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)' }}>

        {/* ── Filter Drawer ── */}
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
          filtersSelected={() => null}
          filterSelectedSentData={filterOptions}
          isColumnSection={false}
          columnSectionData={[]}
          isStickyColumnSection={false}
          stickyColumnSectionData={[]}
          filterCount={setFilterCount}
          setfilterOptionsProps={handleApplyFilterUrl}
          setFilteredColumns={() => null}
          clearFilter={() => {
            setFilterOptions([])
            setPaginationModel(prev => ({ ...prev, page: 0 }))
            setFilterCount(0)
          }}
          setDisplayEarlierFilter={filterOptions}
          pageName='kidsClubFilters'
        />

        {/* ── Controls Row ── */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, mt: 1, alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel id='ay-select-label' shrink sx={{ backgroundColor: '#fff', px: 1 }}>
                Select AY *
              </InputLabel>
              <Select
                labelId='ay-select-label'
                value={selectedAY}
                label='Select AY *'
                onChange={handleAYChange}
                notched
                sx={{
                  borderRadius: '10px',
                  backgroundColor: '#fff',
                  height: '45px',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#E0E0E0'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#3F41D1'
                  }
                }}
              >
                {academicYears.map(ay => (
                  <MenuItem key={ay.id} value={ay.attributes.short_name_two_digit}>
                    AY {ay.attributes.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: '5px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
            <Box sx={{ width: '100%', maxWidth: '1000px', '& .custom-search': { width: '100%' }, ml: 210 }}>
              <SearchBox
                placeHolderTitle='Search by student name, enrollment.'
                searchText={searchText}
                handleInputChange={handleInputChange}
                handleClearSearch={handleClearSearch}
              />
            </Box>

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
                onClick={() => setIsDrawerOpen(true)}
                startIcon={<span className='icon-filter-search'></span>}
                sx={{
                  height: '45px',
                  mr: 10,
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 500,
                  backgroundColor: '#fff',
                  border: '1px solid #E0E0E0',
                  '&:hover': {
                    backgroundColor: '#f5f5f5'
                  }
                }}
              >
                filter
              </Button>
            </Badge>
          </Box>
        </Box>

        {/* ── Table Row ── */}
        <TableContainer
          component={Paper}
          sx={{
            border: '1px solid #e0e0e0',
            boxShadow: 'none',
            borderRadius: '8px',
            height: 'calc(100vh - 370px)',
            overflowX: 'auto'
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map(col => (
                  <TableCell
                    key={col.field}
                    align={col.align || 'left'}
                    sx={{
                      backgroundColor: '#f5f5f5',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      whiteSpace: 'nowrap',
                      minWidth: col.minWidth,
                      borderBottom: 'none',
                      color: '#666'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {col.headerName}
                      {col.sortable && (
                        <span className='icon-arrow-up-down' style={{ fontSize: '0.8rem', color: '#999' }} />
                      )}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align='center' sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align='center' sx={{ py: 3 }}>
                    No results found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, index) => (
                  <TableRow key={row.id || index} hover>
                    {columns.map(col => (
                      <TableCell
                        key={col.field}
                        align={col.align || 'left'}
                        sx={{
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem',
                          color: 'rgba(58, 53, 65, 0.87)',
                          borderBottom: 'none'
                        }}
                      >
                        {col.field === 'actions' ? (
                          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', justifyContent: 'center' }}>
                            <Tooltip title='Edit'>
                              <IconButton size='small' onClick={() => handleView(row)}>
                                <span className='icon-edit' style={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='View'>
                              <IconButton size='small' onClick={() => handleViewDetails(row)}>
                                <span className='icon-eye' style={{ fontSize: '1.1rem' }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          row[col.field] || '-'
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Pagination Row ── */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', p: 2, gap: 2, mt: 1 }}>
          <Typography variant='body2' sx={{ color: 'rgba(58, 53, 65, 0.87)' }}>
            Rows per page:
          </Typography>
          <Select
            size='small'
            value={paginationModel.pageSize}
            onChange={e => setPaginationModel({ page: 0, pageSize: Number(e.target.value) })}
            sx={{ height: 32, fontSize: '0.875rem' }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
          <MuiPagination
            color='primary'
            count={Math.max(1, Math.ceil(totalCount / paginationModel.pageSize))}
            page={paginationModel.page + 1}
            onChange={(e, newPage) => setPaginationModel(prev => ({ ...prev, page: newPage - 1 }))}
            shape='rounded'
          />
        </Box>
        </Paper>
      </Grid>
    </Grid>
  )
}

export default KidsClubListing