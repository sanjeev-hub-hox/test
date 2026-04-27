import React, { useState, useEffect } from 'react'
import { MenuItem, Select, Typography, Box, Button, FormControl, InputLabel, Divider } from '@mui/material'
import Grid from '@mui/material/Grid'
import { getObjectByKeyVal } from 'src/utils/helper'
import { Controller, useForm } from 'react-hook-form'
import { getRequest } from 'src/services/apiService'

interface SubjectSelectionComponentProps {
  allsubjects: any[] // Adjust the type according to your data structure
  classDetails: any[]
  hanldeFinalData?: any
  handleCancel?: any
  optionalSubjectCount?: any
  isSubjectApiLoading: boolean
  enquiryID?: any
}

const SubjectSelectionComponent: React.FC<SubjectSelectionComponentProps> = ({
  allsubjects,
  classDetails,
  hanldeFinalData,
  handleCancel,
  optionalSubjectCount,
  isSubjectApiLoading,
  enquiryID = null
}) => {
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: string }>({})
  const [compSubjects, setCompSubjects] = useState<any[]>([])

  type subejctSelectionDetails = {
    optional_subject: {
      [rowId: string | number]: {
        [index: number]: string | undefined // Subject ID or undefined
      }
    }
  }

  const {
    control: subjectSelectionControl,
    handleSubmit: subjectSelectionSubmit,
    reset: resetForm
  } = useForm<subejctSelectionDetails>({
    defaultValues: {
      optional_subject: {}
    }
  })

  useEffect(() => {
    // This effect runs when `allsubjects` changes
    if (allsubjects.length > 0) {
      const dd = allsubjects?.filter((item: any) => item.is_compulsory === 1)
      setCompSubjects(dd)
    }
  }, [allsubjects])

  const handleOptionalSubjectChange = (event: any, index: number) => {
    const selectedValue = event.target.value as string
    setSelectedOptions(prevSelectedOptions => ({
      ...prevSelectedOptions,
      [index]: selectedValue
    }))
  }

  const getFilteredSubjects = (optionNumber: number): any => {
    const tempSelectedOptions = Object.entries(selectedOptions)
      .filter(([key]) => Number(key) !== optionNumber)
      ?.map(([, value]) => value)
    const optionalSubjects = allsubjects.filter((item: any) => item.is_compulsory != 1)
    const selectedSubjectGroups = optionalSubjects
      .filter((element: any) => tempSelectedOptions.includes(element.ac_subject_id) && element.group_name)
      ?.map(item => item.group_name)
    const result = optionalSubjects.filter(
      subject =>
        subject.option_number === optionNumber &&
        !tempSelectedOptions.includes(subject.ac_subject_id) &&
        !selectedSubjectGroups.includes(subject.group_name)
    )

    return result
  }

  const saveSubjectDetails = async () => {
    const resultArray: any = []
    Object.keys(selectedOptions).forEach((key: any) => {
      resultArray.push(getObjectByKeyVal(allsubjects, 'ac_subject_id', selectedOptions[key]))
    })

    const fnData = [...compSubjects, ...resultArray]
    hanldeFinalData(fnData)
  }

  useEffect(() => {
    const fetchAndPopulateSelectedSubjects = async () => {
      if (enquiryID) {
        try {
          const params = {
            url: `marketing/admission/${enquiryID}`,
            serviceURL: 'marketing'
          }
          const response: any = await getRequest(params)

          // Extract selected optional subjects from the response
          const subjects = response?.data?.subject_details || []
          const optionalSubjects = subjects.filter((item: any) => item.is_compulsory !== 1)

          // Pre-populate selectedOptions state
          const preSelectedOptions: { [key: number]: string } = {}
          const formValues: any = { optional_subject: {} }

          optionalSubjects.forEach((subject: any) => {
            if (subject?.option_number && subject?.ac_subject_id) {
              preSelectedOptions[subject.option_number] = subject.ac_subject_id

              // Populate form values - assuming rowId is 1 (adjust if needed)
              const rowId = 1 // default to 1 as per previous logic
              if (!formValues.optional_subject[rowId]) {
                formValues.optional_subject[rowId] = {}
              }
              formValues.optional_subject[rowId][subject.option_number - 1] = subject.ac_subject_id
            }
          })

          setSelectedOptions(preSelectedOptions)
          resetForm(formValues) // This will populate the form
        } catch (error) {}
      }
    }

    // Only fetch if we have enquiryID and subjects are loaded
    if (enquiryID && allsubjects.length > 0 && classDetails.length > 0) {
      fetchAndPopulateSelectedSubjects()
    }
  }, [enquiryID, allsubjects, classDetails, resetForm])

  return (
    <Box sx={{ mt: 6, mb: 4 }}>
      {isSubjectApiLoading ? (
        <Typography variant='h6' align='center' sx={{ py: 10 }}>
          Loading subjects...
        </Typography>
      ) : (
        <form onSubmit={subjectSelectionSubmit(saveSubjectDetails)}>
          {classDetails.map((classItem, idx) => {
            const rowId = idx + 1
            return (
              <Box key={rowId} sx={{ mb: 4 }}>
                <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
                  Subject Selection ({classItem.className})
                </Typography>
                <Typography variant='subtitle1' sx={{ mb: 2, color: 'secondary', fontWeight: 500 }}>
                  Compulsory Subjects
                </Typography>
                <Grid container spacing={4} sx={{ mb: 4 }}>
                  {compSubjects.map((sub, i) => (
                    <Grid item xs={12} sm={6} md={4} key={sub.subject_id || i}>
                      <Typography
                        variant='caption'
                        display='block'
                        color='text.secondary'
                        sx={{ mb: 0.5, fontWeight: 500 }}
                      >
                        Compulsory {i + 1}
                      </Typography>
                      <Typography variant='body2' color='text.primary' sx={{ fontWeight: 400 }}>
                        {sub.subject_name}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 4 }} />
                <Typography variant='subtitle1' sx={{ mb: 6, color: 'text.primary', fontWeight: 500 }}>
                  Optional Subjects
                </Typography>
                {optionalSubjectCount && optionalSubjectCount.length > 0 ? (
                  <Grid container spacing={4}>
                    {optionalSubjectCount.map((groupId: any, index: number) => (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <Controller
                          name={`optional_subject.${rowId}.${index}`}
                          control={subjectSelectionControl}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel id={`select-label-${rowId}-${index}`}>
                                Optional Subject {index + 1}
                              </InputLabel>
                              <Select
                                labelId={`select-label-${rowId}-${index}`}
                                label={`Optional Subject ${index + 1}`}
                                {...field}
                                value={field.value || ''}
                                onChange={event => {
                                  field.onChange(event.target.value)
                                  handleOptionalSubjectChange(event, groupId)
                                }}
                              >
                                {getFilteredSubjects(groupId)?.map((option: any) => (
                                  <MenuItem key={option.ac_subject_id} value={option.ac_subject_id}>
                                    {option.subject_name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant='body1' color='text.secondary'>
                    No optional subjects
                  </Typography>
                )}
              </Box>
            )
          })}

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: '20px' }}>
            <Button onClick={handleCancel} variant='outlined' sx={{ mr: 4 }} color='inherit'>
              Cancel
            </Button>
            <Button type='submit' variant='contained' color='secondary'>
              Save & Next
            </Button>
          </Box>
        </form>
      )}
    </Box>
  )
}

export default SubjectSelectionComponent
