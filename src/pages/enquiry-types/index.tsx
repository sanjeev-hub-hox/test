import React, { useEffect, useState } from 'react'
import Grid from '@mui/material/Grid'
import { Box } from '@mui/system'
import { Button, Chip, Fab, IconButton, Tooltip } from '@mui/material'
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import {
  GridPagination,
  useGridApiContext,
  useGridSelector,
  gridRowCountSelector,
  gridPageSizeSelector
} from '@mui/x-data-grid'
import MuiPagination from '@mui/material/Pagination'
import { ThemeColor } from 'src/@core/layouts/types'
import { useRouter } from 'next/navigation'

// ** Custom Components
import CustomChip from 'src/@core/components/mui/chip'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import SuccessDialog from 'src/@core/CustomComponent/SuccessDialogBox/SuccessDialog'
import DropZoneDialog from 'src/@core/CustomComponent/UploadDialogBox/DropZoneDialog'
import DeleteDialog from 'src/@core/CustomComponent/DeleteDialogBox/DeleteDialog'
import TableDialog from 'src/@core/CustomComponent/DataGridDialogBox/TableDialog'
import SearchBox from 'src/@core/CustomComponent/CustomSearchBox/SearchBox'
import { calculateSerialNumber, generateExcelFromJson } from 'src/utils/helper'
import { deleteRequest, getRequest, postRequest } from 'src/services/apiService'
import useDebounce from 'src/utils/useDebounce'
import FilterCRMComponent from 'src/components/FilterCRMComponent'
import { DELETE_ENQUIRY_TYPE } from 'src/utils'
import Head from 'next/head'

// table for Lob Assigned Modal
const columnsLobAssign: GridColDef[] = [
  {
    field: 'stage_name',
    headerName: 'Stage Applicable',
    minWidth: 250,
    flex: 1
  },
  {
    field: 'order',
    headerName: 'Order Of Stage',
    align: 'center',
    headerAlign: 'center',
    minWidth: 150,
    flex: 1
  },
  {
    field: 'weightage',
    headerName: 'Weightage',
    align: 'center',
    headerAlign: 'center',
    minWidth: 150,
    flex: 1
  },
  {
    field: 'tat',
    headerName: 'TAT In Hrs/Days',
    minWidth: 150,
    flex: 1,
    valueGetter: params => {
      return params.row.tat.value + ' ' + params.row.tat.unit
    }
  },
  {
    field: 'workflow',
    headerName: 'Initiate Workflow',
    align: 'center',
    headerAlign: 'center',
    minWidth: 250,
    flex: 1,
    valueGetter: () => {
      return ''
    }
  }
]
interface StatusObj {
  [key: string]: {
    title: string
    color: ThemeColor
  }
}

function Pagination(props: any) {
  const { page, onPageChange, className } = props
  const apiRef = useGridApiContext()
  const rowCount = useGridSelector(apiRef, gridRowCountSelector)
  const pageSize = useGridSelector(apiRef, gridPageSizeSelector) // Get the page size
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

function EnquiryTypeListing() {
  const [searchText, setSearchText] = useState('')
  const router = useRouter()
  // const [pageSize, setPageSize] = useState(10)
  // const [page, setPage] = useState<number>(0)
  const [listData, setListData] = useState([])
  // const [stageData, setStageData] = useState([])
  const debouncedSearchTerm = useDebounce(searchText, 900)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 })
  const [openLobModal, setOpenLobModal] = useState(false)
  const { setPagePaths, setGlobalState, setListingMode, listingMode } = useGlobalContext()
  const [deleteDialog, setDeleteDialog] = useState<boolean>(false)
  const [deleteRoleDialog, setDeleteRoleDialog] = useState<boolean>(false)
  const [openDropzone, setOpenDropzone] = useState<boolean>(false)
  const [openDropzoneSuccess, setOpenDropzoneSuccess] = useState<boolean>(false)
  const [filterOpen, setFilterOpen] = React.useState<any>(null)
  const [mappedStages, setMappedStages] = React.useState<any>([])
  const [filters, setFilter] = React.useState<any>({
    coloumns: [],
    operators: ['contains', 'equals', 'notequals'],
    text: ''
  })
  const [deleteId, setDeleteId] = useState(null)
  const [refresh, setRefresh] = useState(false)
  const [activeType, setActiveTypeName] = useState('')

  // const [listDataPagination, setListDataPagination] = useState<any>({})
  // const [filterOptions, setfilterOptions] = useState<any>([])
  const [totalRows, setTotalRows] = useState<any>(0)

  const getData = async (filterData?: any) => {
    setGlobalState({
      isLoading: true
    })
    const params = {
      url: `marketing/enquiry-type/list/?pageNumber=${paginationModel?.page + 1}&pageSize=${paginationModel?.pageSize}`,
      data: { ...(filterData && { filters: filterData }) }
      // params: {
      //   pageNumber: page + 1,
      //   pageSize: pageSize,
      //   search: debouncedSearchTerm
      // }
    }
    const resp: any = await postRequest(params)
    if (resp.status) {
      const rowsWithSerialNumber = resp?.data?.content?.map((row: any, index: any) => ({
        ...row,
        id: row?._id,
        serialNumber: calculateSerialNumber(index, paginationModel.page, paginationModel.pageSize)
      }))
      setFilter({
        ...filters,
        coloumns: resp?.data?.columns
      })
      setListData(rowsWithSerialNumber)
      setTotalRows(resp?.data?.pagination?.totalCount)
    }
    setGlobalState({
      isLoading: false
    })
  }

  const getSearchData = async () => {
    setGlobalState({
      isLoading: true
    })
    const params = {
      url: `marketing/enquiry-type/list/global-search`,
      params: {
        pageNumber: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        search: debouncedSearchTerm
      }
    }
    const resp: any = await getRequest(params)
    if (resp.status) {
      const rowsWithSerialNumber = resp?.data?.content?.map((row: any, index: any) => ({
        ...row,
        id: row?._id,
        serialNumber: calculateSerialNumber(index, paginationModel.page, paginationModel.pageSize)
      }))
      setFilter({
        ...filters,
        coloumns: resp?.data?.columns
      })
      setListData(rowsWithSerialNumber)
      setTotalRows(resp?.data?.pagination?.totalCount)
    }
    setGlobalState({
      isLoading: false
    })
  }

  useEffect(() => {
    getData()
  }, [paginationModel])

  useEffect(() => {
    if (debouncedSearchTerm) {
      getSearchData()
    } else {
      getData()
    }
  }, [paginationModel.page, debouncedSearchTerm, refresh])

  const statusObj: StatusObj = {
    true: { title: 'Active', color: 'success' },
    false: { title: 'In-active', color: 'error' }
  }

  const columns: GridColDef[] = [
    {
      flex: 1,
      minWidth: 150,
      field: 'name',
      headerName: 'Enquiry Type Name'
    },
    {
      flex: 1,
      minWidth: 120,
      field: 'order',
      headerName: 'Order Number',
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: 'stages',
      headerName: 'Stages Mapped',
      sortable: true,
      flex: 1,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: any) => {
        const stageCount = params?.row.stages.length

        return (
          <>
            {stageCount > 0 ? (
              <div
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
                onClick={() => {
                  handleOpenLob(params.row.stages, params?.row?.name)
                }}
              >
                {stageCount}
              </div>
            ) : (
              <div style={{ textDecoration: 'underline', cursor: 'pointer' }}>{stageCount}</div>
            )}
          </>
        )
      }
    },

    {
      flex: 1,
      minWidth: 100,
      field: 'is_active',
      headerAlign: 'center',
      align: 'center',
      headerName: 'Status',
      renderCell: (params: GridRenderCellParams) => {
        const status = statusObj[params.row.is_active]

        return (
          <CustomChip
            size='small'
            skin='light'
            color={status.color}
            label={status.title}
            sx={{ '& .MuiChip-label': { textTransform: 'capitalize' } }}
          />
        )
      }
    },
    {
      flex: 1,
      minWidth: 100,
      field: 'action',
      headerAlign: 'center',
      align: 'center',
      headerName: 'Action',
      renderCell: (params: GridRenderCellParams) => {
        return (
          <>
            <Tooltip title='View'>
              <IconButton disableFocusRipple disableRipple onClick={() => handleView(params)}>
                {/* <EditIcon /> */}
                <span className='icon-eye'></span>
              </IconButton>
            </Tooltip>
            <Tooltip title='Edit'>
              <IconButton disableFocusRipple disableRipple onClick={() => handleEdit(params)}>
                <span className='icon-edit-2'></span>
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete'>
              <IconButton disableFocusRipple disableRipple onClick={() => handleDelete(params)}>
                <span className='icon-trash'></span>
              </IconButton>
            </Tooltip>
          </>
        )
      }
    }
  ]

  const handleEdit = (params: GridRenderCellParams) => {
    router.push(`/enquiry-types/edit/${params.row._id}`)
  }

  const handleView = (params: GridRenderCellParams) => {
    router.push(`/enquiry-types/view/${params.row._id}`)
  }

  //Handling Search Functionality
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value)
  }

  const handleClearSearch = () => {
    setSearchText('')
  }

  //Delete dialog funactionality
  //enable delete dialog
  const handleDelete = (params: GridRenderCellParams) => {
    setDeleteId(params.row._id)
    setDeleteDialog(true)
  }

  //disable Delet Dialog
  const handleDeleteDialog = () => {
    setDeleteDialog(false)
  }

  //close delete and enable succes dialog
  const handleDeleteCloseDialog = async () => {
    const params = {
      url: `${DELETE_ENQUIRY_TYPE}/${deleteId}`
    }
    const response = await deleteRequest(params)
    if (response.status) {
      setDeleteDialog(false)
      setDeleteRoleDialog(true)
      setDeleteId(null)
      setRefresh(!refresh)
    }
  }

  //close success dialog
  const handleDeleteRoleDialog = () => {
    setDeleteRoleDialog(false)
  }

  const handleChange = () => {
    // handleRoleDialog(true)
    router.push('/enquiry-types/create')

    // setAnchorEl(event?.currentTarget)
  }

  //Hanlder for dialog box in mui datagrid

  const handleOpenLob = (row: any, name: any) => {
    setMappedStages(row)
    setActiveTypeName(name)
    setOpenLobModal(true)
  }
  const handleCloseLob = () => setOpenLobModal(false)

  //Passing Breadcrumbs
  useEffect(() => {
    setPagePaths([
      {
        title: 'Enquiry Type Listing',
        path: '/enquiry-type-listing'
      }
    ])
  }, [])

  //handler for Menu Collapse create role button

  // const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  //   setAnchorEl(event.currentTarget)
  // }

  //Handler for dropxzone
  const handleCloseDropzone = () => {
    setOpenDropzone(false)
  }

  const handleSubmitDropzone = () => {
    setOpenDropzone(false)
    setOpenDropzoneSuccess(true)
  }

  const handleSuccessClose = () => {
    setOpenDropzoneSuccess(false)
  }

  //Handler For Filer Popover
  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterOpen(event.currentTarget)
  }

  const handleDownload = () => {
    generateExcelFromJson(listData, 'EnquiryTypeList')
  }

  const clearAllFilters = () => {
    setPaginationModel({ page: 0, pageSize: paginationModel.pageSize })
    // fetchData(1, paginationModel.pageSize, filterOption);
  }

  const applyFilter = async (options: any[]) => {
    const filterOption: any[] = options

    await getData(filterOption)
  }

  useEffect(() => {
    if (listingMode.isDraft === 1) {
      setListingMode({ isDraft: 1 })
      setListingMode('drafts')
      getData([{ column: 'saved_as_draft', operation: 'equals', search: true }])
    } else {
      setListingMode('All')
    }
  }, [])

  const handleRecordListingMode = (mode: any) => {
    // let data = [{
    //   isDraft: mode == "All" ? 0 : 1,
    // }];
    let data = []
    if (mode == 'All') {
      data = [{ column: 'saved_as_draft', operation: 'equals', search: false }]
    } else {
      data = [{ column: 'saved_as_draft', operation: 'equals', search: true }]
    }
    setListingMode(mode)
    getData(data)
  }

  const options = [
    {
      name: 'Enquiry Type Name',
      value: 'name'
    }
  ]

  const optionColumns = ['Enquiry Type Name']

  return (
    <>
      <Head>
        <title>Enquiry Type Listing - CRM</title>
        <meta name='description' content={`This is the Enquiry Type Listing page`} />
      </Head>
      <Box sx={{ background: '#fff', borderRadius: '10px' }}>
        <Grid container>
          {/* {!openRoleDialog && (
            <Grid item xs={12} className='breadcrumb-container'>
              <CommonHeader
                buttonTitle='Create Role'
                onPush={handleRoleDialog}
                title='Permanent Role'
                isButton={true}
                infoIcon={false}
              />
            </Grid>
          )} */}

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: { sm: 'flex-start', lg: 'space-around' },
                  mt: 3
                }}
              >
                <Chip
                  variant='filled'
                  color={listingMode === 'All' ? 'primary' : 'default'}
                  label='All'
                  sx={{ ml: 2, mr: 2 }}
                  onClick={() => handleRecordListingMode('All')}
                />
                <Chip
                  color={listingMode === 'drafts' ? 'primary' : 'default'}
                  variant='outlined'
                  label='Drafts'
                  onClick={() => handleRecordListingMode('drafts')}
                />
              </Box>
              <Box
                sx={{
                  mt: 3,
                  ml: 3,
                  padding: '0px 10px',
                  display: 'flex',
                  justifyContent: { sm: 'flex-start', lg: 'flex-end' },
                  alignItems: 'center'
                }}
              >
                {/* <TextField
                className='custom-textfield'
                value={searhInvoice}
                placeholder='Search Invoice'
                onChange={e => setSearchInvoice(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <UserIcon icon='mdi:magnify' />
                    </InputAdornment>
                  )
                }}
              /> */}
                <Box sx={{ mr: 2 }}>
                  <SearchBox
                    placeHolderTitle='Search Enquiry Type'
                    searchText={searchText}
                    handleClearSearch={handleClearSearch}
                    handleInputChange={handleInputChange}
                  />
                </Box>
                <Tooltip onClick={handleDownload} title='Download Enquiry Type List'>
                  <Fab
                    size='small'
                    sx={{
                      mr: 3,
                      '@media (max-width: 910px)': {
                        ml: 3
                      }
                    }}
                  >
                    <span className='icon-import-1'></span>
                  </Fab>
                </Tooltip>
                <Button
                  variant='contained'
                  color='inherit'
                  sx={{
                    mr: 3,
                    '@media (max-width: 910px)': {
                      ml: 3
                    }
                  }}
                  startIcon={<span className='icon-filter-search'></span>}
                  onClick={handleFilterClick}
                >
                  filter
                </Button>
                <FilterCRMComponent
                  filterOpen={filterOpen}
                  setFilterOpen={setFilterOpen}
                  applyFilterOptions={applyFilter}
                  title='Enquiry Types'
                  clearFilter={clearAllFilters}
                  options={options}
                  optionColumns={optionColumns}
                />
                <Button
                  variant='contained'
                  color='secondary'
                  onClick={handleChange}
                  disableFocusRipple
                  disableTouchRipple
                  startIcon={<span className='icon-add'></span>}
                >
                  Create Enquiry Type
                </Button>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sx={{ marginTop: '25px' }}>
            {/* <TableFilter /> */}

            {/* <DataGrid
              autoHeight
              columns={columns}
              pagination
              pageSizeOptions={[10, 25, 50]}
              paginationModel={paginationModel}
              slots={{ pagination: CustomPagination }}
              onPaginationModelChange={setPaginationModel}
              rows={listData}
              className='dataTable'
              getRowId={row => row._id}
            /> */}
            <DataGrid
              checkboxSelection
              autoHeight
              columns={columns} // Define your columns
              rows={listData} // Use the rows state
              pagination
              pageSizeOptions={[10, 25, 50, 100]}
              paginationMode='server'
              paginationModel={paginationModel}
              onPaginationModelChange={newModel => setPaginationModel(newModel)}
              rowCount={totalRows} // Total number of rows
              slots={{ pagination: CustomPagination }}
              disableRowSelectionOnClick
              className='dataTable'
              getRowId={row => row._id}
            />
          </Grid>
        </Grid>

        {openLobModal && (
          <TableDialog
            openModal={openLobModal}
            closeModal={handleCloseLob}
            header={`Stages Mapped To Enquiry Type - ${activeType}`}
            columnsRolCode={columnsLobAssign}
            rowsRoleCode={mappedStages}
          />
        )}
        {deleteDialog && (
          <DeleteDialog
            openModal={deleteDialog}
            handleSubmitClose={handleDeleteCloseDialog}
            closeModal={handleDeleteDialog}
            title='Delete Enquiry Type'
            content='Are You Sure You Want To Delete This Enquiry Type?'
          />
        )}
        {deleteRoleDialog && (
          <SuccessDialog
            openDialog={deleteRoleDialog}
            title='Deleted Successfully'
            handleClose={handleDeleteRoleDialog}
          />
        )}
        {openDropzone && (
          <DropZoneDialog
            title='Bulk Upload Data'
            subTitle='Upload your data through csv or xls. file'
            openModal={openDropzone}
            closeModal={handleCloseDropzone}
            handleSubmitClose={handleSubmitDropzone}
          />
        )}
        {openDropzoneSuccess && (
          <SuccessDialog
            openDialog={openDropzoneSuccess}
            title='File Uploaded Successfully'
            handleClose={handleSuccessClose}
          />
        )}
      </Box>
    </>
  )
}

export default EnquiryTypeListing
