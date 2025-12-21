import { useState, useEffect } from 'react'
import { FormControl, InputLabel, MenuItem, Select, Typography, Box, Button } from '@mui/material'
import { SelectChangeEvent } from '@mui/material/Select'
import {
  DataGrid,
  GridColDef,
  GridValidRowModel,
  GridCellParams,
  GridRenderCellParams,
  useGridApiRef
} from '@mui/x-data-grid'
import Grid from '@mui/material/Grid'
import { formatAmount } from 'src/utils/helper'
import { postRequest } from 'src/services/apiService'

interface DefaultFeesProps {
  enquiryDetails: any
  dynamicFormData?: any
  hanldeFinalData?: any
  authToken?: string
  handleNext?: any
  handleCancel?: any
  academicYear?: any
  schoolParentId?: any
  guestStudentSchoolId?: any
}

function DefaultFees({
  enquiryDetails,
  dynamicFormData,
  hanldeFinalData,
  authToken,
  handleNext,
  handleCancel,
  academicYear,
  schoolParentId,
  guestStudentSchoolId
}: DefaultFeesProps) {
  const [screenWidth, setScreenWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0)
  const [defaultfees, setDefaultFees] = useState<any[]>([])

  const subjectColumns: GridColDef[] = [
    {
      flex: 1,
      field: 'academic_year',
      headerName: 'Academic Year',
      align: 'center',
      headerAlign: 'center',
      minWidth: 150
    },
    {
      flex: 1,
      field: 'fee_type_name',
      headerName: 'Fee Type',
      align: 'center',
      headerAlign: 'center',
      minWidth: 150
    },
    {
      flex: 1,
      field: 'fee_sub_type_name',
      headerName: 'Fee Sub Type',
      align: 'center',
      headerAlign: 'center',
      minWidth: 150
    },
    {
      flex: 1,
      field: 'fee_amount_for_period',
      headerName: 'Amount',
      headerAlign: 'center',
      align: 'center',
      minWidth: 250,
      renderCell: (params: any) => {
        return `₹ ${formatAmount(Math.round(params?.value))}`
      }
    }
  ]

  const fetchAllDefaultfees = async () => {
    const conditions = []

    if (schoolParentId !== undefined) conditions.push(`school_parent_id = ${schoolParentId}`)
    if (academicYear !== undefined) conditions.push(`academic_year_id = ${parseInt(academicYear)}`)
    if (dynamicFormData?.student_details?.grade?.id !== undefined)
      conditions.push(`grade_id = ${dynamicFormData?.student_details?.grade?.id}`)
    if (dynamicFormData?.board?.id !== undefined) conditions.push(`board_id = ${dynamicFormData?.board?.id}`)
    if (dynamicFormData?.course?.id !== undefined) conditions.push(`course_id = ${dynamicFormData?.course?.id}`)
    if (dynamicFormData?.shift?.id !== undefined) conditions.push(`shift_id = ${dynamicFormData?.shift?.id}`)
    if (dynamicFormData?.stream?.id !== undefined) conditions.push(`stream_id = ${dynamicFormData?.stream?.id}`)

    if (enquiryDetails?.is_guest_student) {
      conditions.push(`guest_school_id = ${guestStudentSchoolId}`)
    } else {
      conditions.push(`guest_school_id IS NULL AND guest_lob_id IS NULL`)
    }

    const operator = conditions.join(' AND ')

    const concessionResponse = await postRequest({
      url: `/api/ac-schools/search-school-fees`,
      serviceURL: 'mdm',
      data: {
        operator:
          operator +
          ' AND fee_type_id IN (1,17,9) AND publish_start_date <= current_date AND publish_end_date >= current_date AND (admission_type_id = 1 OR admission_type_id IS NULL)'
      }
    })

    let rows = concessionResponse?.data?.schoolFees || []

    // Sort rows for correct display order
    rows = rows.sort((a: any, b: any) => a.fee_type_name.localeCompare(b.fee_type_name))

    setDefaultFees(rows)
  }

  useEffect(() => {
    if (!dynamicFormData) return

    fetchAllDefaultfees()
  }, [schoolParentId,
  academicYear,
  guestStudentSchoolId,
  dynamicFormData?.student_details?.grade?.id,
  dynamicFormData?.board?.id,
  dynamicFormData?.course?.id,
  dynamicFormData?.shift?.id,
  dynamicFormData?.stream?.id,
  enquiryDetails?.is_guest_student]) 

  const saveDefaultFees = async () => {
    await postRequest({
      url: `/marketing/admission/${enquiryDetails?._id}/add-default-fees`,
      serviceURL: 'marketing',
      data: {
        default_fees: defaultfees
      },
      authToken: authToken
    })

    if (handleNext) handleNext()
  }

  return (
    <>
      <Box sx={{ mt: 6, mb: 4 }}>
        <Grid container xs={12} spacing={6}>
          <Grid item xs={12}>
            <DataGrid
              autoHeight
              columns={subjectColumns}
              rows={defaultfees}
              rowHeight={80}
              className={screenWidth < 1520 ? 'datatabaleWShadow' : 'dataTable'}
              sx={{ boxShadow: 0 }}
              hideFooter
            />
          </Grid>

          <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel} variant='outlined' sx={{ mr: 4 }} color='inherit'>
              Cancel
            </Button>
            <Button disabled={!defaultfees?.length} variant='contained' color='secondary' onClick={saveDefaultFees}>
              Save & Next
            </Button>
          </Grid>
        </Grid>
      </Box>
    </>
  )
}

export default DefaultFees
