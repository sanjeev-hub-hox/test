'use client'

import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select
} from '@mui/material'
import { Box } from '@mui/system'
import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { postRequest } from 'src/services/apiService'
import { getObjectByKeyVal, removeDuplicatesAndNullByKey } from 'src/utils/helper'
import { FEETYPES, FEETYPES_SLUGS } from 'src/utils/constants'

export default function TransportFees({
  school,
  payload,
  setCalculatedList,
  selectedFees,
  setSelectedFees,
  calculatedList,
  setTotalAmmount,
  scrollToBottom
}: any) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<any>({
    defaultValues: {
      oneWayType: 'pickup'
    }
  })

  const formDatVal = watch()
  const { setGlobalState, setApiResponseType } = useGlobalContext()
  const [formData, setFormata] = useState<any>([])

  //

  const [subTypeOptions, setSubTypeOptions] = useState<any[]>([])
  const [categoryOptions, setCategoryOptions] = useState<any[]>([])
  const [subCategoryOptions, setSubCategoryOptions] = useState<any[]>([])
  const [periodOfServiceOptions, setPeriodOfServiceOptions] = useState<any[]>([])

  const [stopList, setStopList] = useState<any[]>([])

  //

  const DownArrow = () => <span style={{ color: '#666666' }} className='icon-arrow-down-1'></span>

  const getFormData = async () => {
    setGlobalState({ isLoading: true })

    const params = {
      url: `/api/fc-fees-masters/transport-details`,
      serviceURL: 'mdm'
    }

    const response = await postRequest(params)
    if (response?.data) {
      setFormata(response?.data)
      setSubTypeOptions(response?.data?.feeSubType)
      //setPeriodOfServiceOptions(response?.data?.periodOfService)
    }
    setGlobalState({ isLoading: false })
  }

  const getPickupDropRoutes = async (obj: any, type: string) => {
    setGlobalState({ isLoading: true })

    const params = {
      url: `/transport-service/route/fetch-stops`,
      serviceURL: 'transport',
      data: {
        ...obj
      }
    }

    const response = await postRequest(params)
    if (response?.data) {
      if (type == 'pickup') {
      } else {
      }
      setStopList(response?.data)
    }
    setGlobalState({ isLoading: false })
  }

  useEffect(() => {
    getFormData()
    const pickupPayload = {
      school_id: school,
      route_type: '1',
      bus_type: formDatVal?.busType == 'AC' ? '1' : '2'
    }
    const dropPayload = {
      school_id: school,
      route_type: '2',
      bus_type: formDatVal?.busType == 'AC' ? '1' : '2'
    }
    getPickupDropRoutes(pickupPayload, 'pickup')
    getPickupDropRoutes(dropPayload, 'drop')
  }, [formDatVal?.busType, school])

  const getObjectKeyValSlug: any = (object: any, value: any, key: any) => {
    return object?.find((o: any) => o[key] == value)
  }

  const calculateAmmount = async () => {
    setGlobalState({ isLoading: true })

    // const pp =
    //   formDatVal?.serviceType == 'One way'
    //     ? formDatVal?.route == 'school'
    //       ? { fee_subcategory_start: 'Zone 1' }
    //       : { fee_subcategory_end: 'Zone 2' }
    //     : { fee_subcategory_start: 'Zone 1', fee_subcategory_end: 'Zone 2' }

    const startValue = getObjectByKeyVal(stopList, 'id', formDatVal?.zoneStart)?.zone_name
    const endValue = getObjectByKeyVal(stopList, 'id', formDatVal?.zoneEnd)?.zone_name
    const pp =
      formDatVal?.serviceType == 'One way'
        ? { fee_subcategory_start: startValue }
        : formDatVal?.serviceType == 'Both way'
        ? { fee_subcategory_start: startValue, fee_subcategory_end: endValue }
        : null
    const params4 = {
      url: `/fee_payment/finance/calculate`,
      serviceURL: 'finance',
      data: {
        academic_year_id: payload?.academic_year_id ? parseInt(payload?.academic_year_id) : 0,
        ...(payload?.board && { board_id: payload?.board }),
        ...(payload?.course && { course_id: payload?.course }),
        ...(payload?.shift && { shift_id: payload?.shift }),
        ...(payload?.stream && { stream_id: payload?.stream }),
        ...(payload?.grade && { grade_id: payload?.grade }),
        ...(payload?.school && { school_id: payload?.school }),
        batch_id: formDatVal?.psa_batch,
        fee_type_id: FEETYPES?.transportFees,
        fee_sub_type_id: getObjectKeyValSlug(formData?.feeSubType, formDatVal?.busType, 'fee_sub_type')
          ?.fee_sub_type_id, // formDatVal?.busType ? parseInt(formDatVal?.busType): null,
        fee_category_id: getObjectKeyValSlug(formData?.feeCategory, formDatVal?.serviceType, 'fee_category')
          ?.fee_category_id, //formDatVal?.psa_category, formDatVal?.busType ? parseInt(formDatVal?.serviceType): null,
        //fee_subcategory_start: formDatVal?.zone, //formDatVal?.psa_sub_category,
        ...pp,
        period_of_service_id: formDatVal?.periodOfService ? parseInt(formDatVal?.periodOfService) : null
      }
    }
    try {
      const data = await postRequest(params4)

      if (data?.data) {
        if (scrollToBottom) {
          scrollToBottom()
        }
        const newObj = {
          id: FEETYPES?.transportFees,
          fee_type_id: FEETYPES?.transportFees,
          fee_sub_type_id: getObjectKeyValSlug(formData?.feeSubType, formDatVal?.busType, 'fee_sub_type')
            ?.fee_sub_type_id, // formDatVal?.busType ? parseInt(formDatVal?.busType): null,
          fee_category_id: getObjectKeyValSlug(formData?.feeCategory, formDatVal?.serviceType, 'fee_category')
            ?.fee_category_id, //formDatVal?.psa_category, formDatVal?.busType ? parseInt(formDatVal?.serviceType): null,
          ...pp,
          period_of_service_id: formDatVal?.periodOfService ? parseInt(formDatVal?.periodOfService) : null,
          student_id: payload?.id,
          fee_type_val: FEETYPES_SLUGS.TRANSPORT,
          ...data?.data
        }

        const dd = getObjectByKeyVal(calculatedList, 'id', newObj?.id)
        if (!dd) {
          setCalculatedList((prevState: any) => {
            return [...prevState, newObj]
          })
        } else {
          const newList = [...calculatedList]
          const index = newList.findIndex((item: any) => item.id === FEETYPES?.transportFees)
          if (index !== -1) {
            newList.splice(index, 1)
          }
          const newSelectedFees = [...selectedFees]
          const selectedIndex = newSelectedFees.findIndex((item: any) => item.id === FEETYPES?.transportFees)
          if (selectedIndex !== -1) {
            newSelectedFees.splice(index, 1)
            const obj = [...newSelectedFees, newObj]
            setSelectedFees(obj)
            const totalAmountC = obj.reduce((sum: any, item: any) => sum + item.amount, 0)
            setTotalAmmount(totalAmountC)
          }
          setCalculatedList([...newList, newObj])
        }
        if (data?.data?.amount == 0) {
          setApiResponseType({ status: true, message: 'Transport fees not eligible for the particular student' })
        }
      } else {
        setApiResponseType({ status: true, message: 'Fees Not Found' })
      }
    } catch (error) {
      setApiResponseType({ status: true, message: 'Fees Not Found' })
    }
    setGlobalState({ isLoading: false })
  }

  // new changes

  const handleOptions = async (event: any, value: any, name: any) => {
    if (name === 'busType') {
      if (value) {
        value = [value]
        const selectedIds = value?.map((name: any) => {
          const item: any = subTypeOptions.find((item: any) => item.fee_sub_type == name)

          return item ? item.fee_sub_type_id : undefined // Return item.id if found, otherwise undefined
        })
        const categoryOptions = formData.feeCategory.filter((element: any) => {
          return selectedIds.includes(element.fee_sub_type_id)
        })
        setCategoryOptions(categoryOptions)
      } else {
        setCategoryOptions([])
      }
    }

    if (name === 'serviceType') {
      if (value) {
        value = [value]
        const selectedIds = value?.map((val: any) => {
          const item: any = categoryOptions.find((item: any) => item.fee_category == val)

          return item ? item.fee_category_id : undefined // Return item.id if found, otherwise undefined
        })
        const subcategoryOptions = formData.feeSubCategory.filter((element: any) => {
          return selectedIds.includes(element.fee_category_id)
        })
        setSubCategoryOptions(subcategoryOptions)

        const periodOfServiceOptions = formData.periodOfService.filter((element: any) => {
          return selectedIds.includes(element.fee_category_id)
        })

        setPeriodOfServiceOptions(removeDuplicatesAndNullByKey(periodOfServiceOptions, 'period_of_service_id'))
      } else {
        setSubCategoryOptions([])
      }
    }

    if (name === 'zone') {
      if (value) {
        value = [value]
        const selectedIds = value?.map((name: any) => {
          const item: any = subCategoryOptions.find((item: any) => item.fee_subcategory == name)

          return item ? item.fee_subcategory_id : undefined // Return item.id if found, otherwise undefined
        })
        const periodOfServiceOptions = formData.periodOfService.filter((element: any) => {
          return selectedIds.includes(element.fee_subcategory_id)
        })

        // const batchOptions = psaDetails.batches.filter((element: any) => {
        //   return selectedIds.includes(element.fee_subcategory_id)
        // })
        // setPsaBatchOptions(batchOptions)

        setPeriodOfServiceOptions(periodOfServiceOptions)
      } else {
        setPeriodOfServiceOptions([])
      }
    }

    // if (name === "period_of_service") {
    //     if (value) {
    //         value = value.split(',');
    //         const selectedIds = value?.map((name: any) => {
    //             const item: any = periodOfServiceOptions.find(
    //                 (item: any) =>
    //                     item.period_of_service === name
    //             );
    //             return item ? item.period_of_service_id : undefined; // Return item.id if found, otherwise undefined
    //         });
    //         let batchOptions = psaDetails.batches.filter((element: any) => {
    //             return selectedIds.includes(element.period_of_service_id)
    //         })
    //         setPsaBatchOptions(batchOptions)

    //     } else {
    //         setPsaBatchOptions([]);
    //     }

    // }
  }

  return (
    <>
      <>
        <Box
          sx={{
            background: '#fff',
            padding: '24px',
            borderRadius: '10px',
            width: '100%'
          }}
        >
          <form onSubmit={handleSubmit(calculateAmmount)} noValidate>
            <Box sx={{ mt: 3, mb: 4 }}>
              <Grid container xs={12} spacing={4}>
                <Grid item xs={12} md={6}>
                  <FormControl required error={!!errors.busType}>
                    <FormLabel
                      sx={{ fontSize: '14px', lineHeight: '15.4px', color: 'text.primary' }}
                      id='demo-row-radio-buttons-group-label'
                    >
                      Select Bus Type
                    </FormLabel>
                    <Controller
                      name='busType'
                      control={control}
                      rules={{ required: 'Bus Type Is Required' }}
                      render={({ field }) => (
                        <RadioGroup
                          {...field}
                          row
                          aria-labelledby='demo-row-radio-buttons-group-label'
                          onChange={(e, value) => {
                            field.onChange(value)
                            handleOptions(e, value, 'busType')
                          }}
                        >
                          {subTypeOptions && subTypeOptions?.length
                            ? subTypeOptions?.map((val: any, index: number) => {
                                return (
                                  <FormControlLabel
                                    key={index}
                                    value={val?.fee_sub_type}
                                    sx={{
                                      '&.MuiFormControlLabel-labelPlacementEnd .MuiTypography-root': {
                                        color: 'customColors.text3'
                                      }
                                    }}
                                    control={
                                      <Radio sx={{ '&.MuiRadio-colorPrimary': { color: 'customColors.text3' } }} />
                                    }
                                    label={val?.fee_sub_type}
                                  />
                                )
                              })
                            : null}
                        </RadioGroup>
                      )}
                    />
                    {errors?.busType?.message && <span className={'errorField'}>{`${errors?.busType?.message}`}</span>}
                  </FormControl>
                </Grid>
                {categoryOptions && categoryOptions?.length ? (
                  <Grid item xs={12} md={6}>
                    <FormControl required error={!!errors.serviceType}>
                      <FormLabel
                        sx={{ fontSize: '14px', lineHeight: '15.4px', color: 'text.primary' }}
                        id='demo-row-radio-buttons-group-label'
                      >
                        Select The Service Type
                      </FormLabel>
                      <Controller
                        name='serviceType'
                        control={control}
                        rules={{ required: 'Service Type Is Required' }}
                        render={({ field }) => (
                          <RadioGroup
                            {...field}
                            row
                            aria-labelledby='demo-row-radio-buttons-group-label'
                            onChange={(e, value) => {
                              field.onChange(value)
                              handleOptions(e, value, 'serviceType')
                            }}
                          >
                            {categoryOptions && categoryOptions?.length
                              ? categoryOptions?.map((val: any, index: number) => {
                                  return (
                                    <FormControlLabel
                                      key={index}
                                      value={val?.fee_category}
                                      sx={{
                                        '&.MuiFormControlLabel-labelPlacementEnd .MuiTypography-root': {
                                          color: 'customColors.text3'
                                        }
                                      }}
                                      control={
                                        <Radio sx={{ '&.MuiRadio-colorPrimary': { color: 'customColors.text3' } }} />
                                      }
                                      label={val?.fee_category}
                                    />
                                  )
                                })
                              : null}
                          </RadioGroup>
                        )}
                      />
                      {errors?.serviceType?.message && (
                        <span className={'errorField'}>{`${errors?.serviceType?.message}`}</span>
                      )}
                    </FormControl>
                  </Grid>
                ) : null}

                {formDatVal?.serviceType === 'One way' && (
                  <>
                    <Grid item xs={12} md={12}>
                      <FormControl>
                        <FormLabel
                          sx={{ fontSize: '14px', lineHeight: '15.4px', color: 'text.primary' }}
                          id='demo-row-radio-buttons-group-label'
                        >
                          Select The Stop Type
                        </FormLabel>
                        <Controller
                          name='oneWayType'
                          control={control}
                          render={({ field }) => (
                            <RadioGroup
                              {...field}
                              row
                              aria-labelledby='demo-row-radio-buttons-group-label'
                              onChange={(e, value) => {
                                field.onChange(value)
                                //handleOptions(e, value, 'serviceType')
                              }}
                            >
                              <FormControlLabel
                                value={'pickup'}
                                sx={{
                                  '&.MuiFormControlLabel-labelPlacementEnd .MuiTypography-root': {
                                    color: 'customColors.text3'
                                  }
                                }}
                                control={<Radio sx={{ '&.MuiRadio-colorPrimary': { color: 'customColors.text3' } }} />}
                                label={'Pickup'}
                              />
                              <FormControlLabel
                                value={'drop'}
                                sx={{
                                  '&.MuiFormControlLabel-labelPlacementEnd .MuiTypography-root': {
                                    color: 'customColors.text3'
                                  }
                                }}
                                control={<Radio sx={{ '&.MuiRadio-colorPrimary': { color: 'customColors.text3' } }} />}
                                label={'Drop'}
                              />
                            </RadioGroup>
                          )}
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      {stopList && stopList?.length ? (
                        <FormControl fullWidth required>
                          <InputLabel id='drop-point-label'>Select Stop</InputLabel>
                          <Controller
                            name='zoneStart'
                            rules={{ required: 'Please select stop' }}
                            control={control}
                            render={({ field }) => (
                              <Select
                                {...field}
                                IconComponent={DownArrow}
                                label='Select Stop'
                                labelId='drop-point-label'
                                error={!!errors.zoneStart}
                                onChange={e => {
                                  field.onChange(e?.target?.value)

                                  //handleOptions(e, e?.target?.value, 'zoneStart')
                                }}
                              >
                                {stopList?.map((val: any, ind: number) => {
                                  return (
                                    <MenuItem key={ind} value={val?.id}>
                                      {val?.stop_name}
                                    </MenuItem>
                                  )
                                })}
                              </Select>
                            )}
                          />
                          {errors?.zoneStart?.message && (
                            <span className={'errorField'}>{`${errors?.zoneStart?.message}`}</span>
                          )}
                        </FormControl>
                      ) : (
                        <FormControl fullWidth>
                          <InputLabel id='demo-simple-select-outlined-label'>Select Stop</InputLabel>
                          <Controller
                            name='zoneStart'
                            rules={{ required: 'Please select stop' }}
                            control={control}
                            render={({}) => (
                              <Select
                                IconComponent={DownArrow}
                                label='Select Stop'
                                // defaultValue={pickup}
                                error={!!errors.zoneStart}
                                id='demo-simple-select-outlined'
                                labelId='demo-simple-select-outlined-label'

                                // onChange={handlePickup}
                              >
                                <MenuItem value='selectOption'>-Select Option-</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.zoneStart?.message && (
                            <span className={'errorField'}>{`${errors?.zoneStart?.message}`}</span>
                          )}
                        </FormControl>
                      )}
                    </Grid>
                  </>
                )}

                {formDatVal?.serviceType === 'Both way' && (
                  <>
                    <Grid item xs={12} md={6}>
                      {stopList && stopList?.length ? (
                        <FormControl fullWidth required>
                          <InputLabel id='drop-point-label'>Select Pickup Stop</InputLabel>
                          <Controller
                            name='zoneStart'
                            control={control}
                            rules={{ required: 'Please select stop' }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                IconComponent={DownArrow}
                                label='Select Pickup Stop'
                                error={!!errors.zoneStart}
                                labelId='drop-point-label'
                                onChange={e => {
                                  field.onChange(e?.target?.value)

                                  //handleOptions(e, e?.target?.value, 'zone')
                                }}
                              >
                                {stopList?.map((val: any, ind: number) => {
                                  return (
                                    <MenuItem key={ind} value={val?.id}>
                                      {val?.stop_name}
                                    </MenuItem>
                                  )
                                })}
                              </Select>
                            )}
                          />
                          {errors?.zoneStart?.message && (
                            <span className={'errorField'}>{`${errors?.zoneStart?.message}`}</span>
                          )}
                        </FormControl>
                      ) : (
                        <FormControl fullWidth>
                          <InputLabel id='demo-simple-select-outlined-label'>Select Pickup Stop</InputLabel>
                          <Controller
                            name='zoneStart'
                            rules={{ required: 'Please select stop' }}
                            control={control}
                            render={({}) => (
                              <Select
                                IconComponent={DownArrow}
                                label='Select Stop'
                                // defaultValue={pickup}
                                error={!!errors.zoneStart}
                                id='demo-simple-select-outlined'
                                labelId='demo-simple-select-outlined-label'

                                // onChange={handlePickup}
                              >
                                <MenuItem value='selectOption'>-Select Option-</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.zoneStart?.message && (
                            <span className={'errorField'}>{`${errors?.zoneStart?.message}`}</span>
                          )}
                        </FormControl>
                      )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                      {stopList && stopList?.length ? (
                        <FormControl fullWidth required>
                          <InputLabel id='drop-point-label'>Select Drop Stop</InputLabel>
                          <Controller
                            name='zoneEnd'
                            control={control}
                            rules={{ required: 'Please select stop' }}
                            render={({ field }) => (
                              <Select
                                {...field}
                                IconComponent={DownArrow}
                                label='Select Drop Stop'
                                error={!!errors.zoneEnd}
                                labelId='drop-point-label'
                                onChange={e => {
                                  field.onChange(e?.target?.value)

                                  // handleOptions(e, e?.target?.value, 'zone')
                                }}
                              >
                                {stopList?.map((val: any, ind: number) => {
                                  return (
                                    <MenuItem key={ind} value={val?.id}>
                                      {val?.stop_name}
                                    </MenuItem>
                                  )
                                })}
                              </Select>
                            )}
                          />
                          {errors?.zoneEnd?.message && (
                            <span className={'errorField'}>{`${errors?.zoneEnd?.message}`}</span>
                          )}
                        </FormControl>
                      ) : (
                        <FormControl fullWidth>
                          <InputLabel id='demo-simple-select-outlined-label'>Select Drop Stop</InputLabel>
                          <Controller
                            name='zoneEnd'
                            rules={{ required: 'Please select stop' }}
                            control={control}
                            render={({}) => (
                              <Select
                                IconComponent={DownArrow}
                                label='Select Stop'
                                // defaultValue={pickup}
                                error={!!errors.zoneEnd}
                                id='demo-simple-select-outlined'
                                labelId='demo-simple-select-outlined-label'

                                // onChange={handlePickup}
                              >
                                <MenuItem value='selectOption'>-Select Option-</MenuItem>
                              </Select>
                            )}
                          />
                          {errors?.zoneEnd?.message && (
                            <span className={'errorField'}>{`${errors?.zoneEnd?.message}`}</span>
                          )}
                        </FormControl>
                      )}
                    </Grid>
                  </>
                )}
                {periodOfServiceOptions && periodOfServiceOptions?.length ? (
                  <Grid item xs={12} md={6}>
                    {periodOfServiceOptions && periodOfServiceOptions?.length ? (
                      <FormControl fullWidth required>
                        <InputLabel id='drop-point-label'>Period of service</InputLabel>
                        <Controller
                          name='periodOfService'
                          control={control}
                          rules={{ required: 'Please select period of service' }}
                          render={({ field }) => (
                            <Select
                              {...field}
                              IconComponent={DownArrow}
                              label='Period of service'
                              labelId='drop-point-label'
                              error={!!errors.periodOfService}
                            >
                              {periodOfServiceOptions?.map((val: any, ind: number) => {
                                return (
                                  <MenuItem key={ind} value={val?.period_of_service_id}>
                                    {val?.period_of_service}
                                  </MenuItem>
                                )
                              })}
                            </Select>
                          )}
                        />
                        {errors?.periodOfService?.message && (
                          <span className={'errorField'}>{`${errors?.periodOfService?.message}`}</span>
                        )}
                      </FormControl>
                    ) : (
                      <FormControl fullWidth required>
                        <InputLabel id='demo-simple-select-outlined-label'>Period of service</InputLabel>
                        <Select
                          IconComponent={DownArrow}
                          label='Select Drop Point'
                          // defaultValue={pickup}
                          id='demo-simple-select-outlined'
                          labelId='demo-simple-select-outlined-label'

                          // onChange={handlePickup}
                        >
                          <MenuItem value='selectOption'>-Select Option-</MenuItem>
                        </Select>
                      </FormControl>
                    )}
                  </Grid>
                ) : null}
              </Grid>
            </Box>
            <Box sx={{ mt: 4, mb: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
              <Button type={'submit'} variant='contained' color='primary'>
                Calculate
              </Button>
            </Box>
          </form>
        </Box>
      </>
    </>
  )
}
