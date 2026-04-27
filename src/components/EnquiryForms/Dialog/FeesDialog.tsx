import React, { useState, useEffect } from 'react'
import { Box, IconButton, Button, Typography } from '@mui/material'
import { useForm } from 'react-hook-form'

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { Grid } from '@mui/material'
import { postRequest } from 'src/services/apiService'
import { useGlobalContext } from 'src/@core/global/GlobalContext'

interface FormValues {
  psa_sub_type: number | null
  psa_category: number | null
  psa_sub_category: number | null
  period_of_service: number | null
  psa_batch: number | null
}

const defaultValues: FormValues = {
  psa_sub_type: null,
  psa_category: null,
  psa_sub_category: null,
  period_of_service: null,
  psa_batch: null
}

type SchoolTour = {
  openDialog: boolean
  handleClose?: () => void
  title?: string
  setPsaDialog?: any
  minimized?: boolean
  setMinimized?: any
  enquiryID?: any
  setRefresh?: any
  refresh?: any
  details?: any
  viewMode?: boolean
  setViewMode?: any
  enquiryDetails?: any
  academic_year?: any
}

const FeesDialog = ({
  openDialog,
  title,
  setPsaDialog,
  minimized,
  setMinimized,

  viewMode,
  setViewMode
}: SchoolTour) => {
  const {
    formState: {}
  } = useForm<FormValues>({
    defaultValues
  })

  const handleMinimize = () => {
    setMinimized(true)
  }

  const [defaultFees, setDefaultFees] = useState<any[]>([])

  const [vasAmount] = useState<number>(0)
  const [isFinalSubmit] = useState<boolean>(false)
  const { setGlobalState } = useGlobalContext()

  const fetchAllDefaultfees = async () => {
    setGlobalState({ isLoading: true })
    const requestparam =
      'school_id = 26 AND academic_year_id= 25 AND grade_id=1 AND board_id=3  AND  shift_id= 3 AND publish_start_date <= current_date AND publish_end_date >= current_date'

    try {
      const concessionResponse = await postRequest({
        url: `/api/ac-schools/search-school-fees`,
        serviceURL: 'mdm',
        data: {
          operator: requestparam
        }
      })
      setDefaultFees(concessionResponse?.data?.schoolFees)
    } catch (error) {
    } finally {
      setGlobalState({ isLoading: false })
    }
  }

  useEffect(() => {
    fetchAllDefaultfees()
  }, [])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div>
        {openDialog && !minimized && (
          <Box
            sx={{
              position: 'fixed',
              bottom: '0',
              right: '0',
              width: '100%',
              height: '100vh',
              backgroundColor: 'white',
              boxShadow: 24,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1300,
              overflowY: 'auto',
              borderRadius: '10px',
              maxWidth: '450px'
            }}
            className='fixedModal'
          >
            <Box
              sx={{
                position: 'sticky',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                zIndex: 1400,
                width: '100%',
                p: 2
              }}
              display='flex'
              justifyContent='space-between'
              alignItems='center'
            >
              <div
                style={{
                  padding: '10px 20px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant='subtitle1' color={'text.primary'} sx={{ lineHeight: '24px' }}>
                    {title}
                  </Typography>
                </Box>
                <Box>
                  <IconButton disableFocusRipple disableRipple onClick={handleMinimize}>
                    <span className='icon-minus'></span>
                  </IconButton>
                </Box>
              </div>
            </Box>
            <div style={{ padding: '20px' }}>
              <Box>
                <Grid container spacing={5}>
                  <Box
                    sx={{
                      margin: '10px auto',
                      borderRadius: '16px',
                      padding: '10px',
                      height: '80px',
                      width: '90%',
                      boxShadow: '0px 2px 10px 0px #4C4E6438'
                    }}
                  >
                    <Box sx={{ ml: 2 }}>
                      <Typography
                        variant='caption'
                        color='customColors.text3'
                        sx={{ mt: 2, textTransform: 'capitalize', lineHeight: '16px', letterSpacing: '0.4px' }}
                      >
                        Amount
                      </Typography>
                      <Typography
                        variant='h5'
                        color='primary.dark'
                        sx={{
                          mt: 1,
                          fontSize: '22px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                          lineHeight: '28px',
                          letterSpacing: '0.4px'
                        }}
                      >
                        ₹ {vasAmount}
                      </Typography>
                    </Box>
                  </Box>
                  <Grid item xs={12} sm={12}>
                    {defaultFees?.map((fees: any) => (
                      <>
                        <p>
                          {fees?.display_name} - {fees?.fee_type_name} - {fees?.fee_amount_for_period}{' '}
                        </p>
                      </>
                    ))}
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: '15px' }}>
                  <Button
                    onClick={() => {
                      setPsaDialog(false)
                      setViewMode(false)
                    }}
                    sx={{ width: 'auto', mr: '5px' }}
                    variant='outlined'
                    color='inherit'
                    fullWidth
                  >
                    {'Cancel'}
                  </Button>

                  {!viewMode ? (
                    <Button type='submit' sx={{ width: 'auto' }} variant='contained' color='secondary' fullWidth>
                      {isFinalSubmit ? 'Confirm' : 'Calculate'}
                    </Button>
                  ) : null}
                </Box>
              </Box>
            </div>
          </Box>
        )}
        {minimized && (
          <Box
            style={{
              position: 'fixed',
              bottom: 0,
              right: 0,
              width: '300px',
              height: '50px',
              backgroundColor: '#fff',
              boxShadow: '0px -2px 5px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 10px',
              zIndex: 1300,
              cursor: 'pointer'
            }}
            onClick={() => setMinimized(false)}
          >
            <Typography variant='subtitle1' color={'text.primary'} sx={{ lineHeight: '21px' }}>
              {title}
            </Typography>
            <IconButton onClick={() => setMinimized(false)}>
              <span className='icon-add'></span>
            </IconButton>
          </Box>
        )}
      </div>
    </LocalizationProvider>
  )
}

export default FeesDialog
