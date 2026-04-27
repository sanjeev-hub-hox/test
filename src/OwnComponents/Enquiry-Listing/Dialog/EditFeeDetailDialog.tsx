import { useCallback, useEffect, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close'
import Dialog from '@mui/material/Dialog'
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import DialogContent from '@mui/material/DialogContent'
import {
  Autocomplete,
  Button,
  DialogActions,
  Divider,
  Grid,
  InputAdornment,
  TextField,
  Tooltip,
  tooltipClasses,
  TooltipProps,
  Typography,
  CircularProgress,
  Box
} from '@mui/material'
import { debounce } from 'lodash'
import { DataGrid, GridRowSelectionModel } from '@mui/x-data-grid'
import { useGlobalContext } from 'src/@core/global/GlobalContext'
import { styled } from '@mui/system'
import DownArrow from 'src/@core/CustomComponent/DownArrow/DownArrow'
import { getLocalStorageVal, getObjectByKeyVal } from 'src/utils/helper'
import InfoIcon from '@mui/icons-material/Info'
import { checkValidationsZod } from 'src/utils/formValidations'
import { getRequest, postRequest } from 'src/services/apiService'
import toast from 'react-hot-toast'

// ─── API URLs ────────────────────────────────────────────────────────────────

const ACADEMIC_YEAR_API_URL =
  '/api/ac-academic-years?fields[1]=name&fields[2]=short_name&fields[3]=short_name_two_digit&fields[4]=is_visible&filters[is_visible][$eq]=1&sort[0]=id:asc'

const SCHOOL_SEARCH_API_URL = '/api/ac-schools/search-school'

// ─── Dropdown cascade order ───────────────────────────────────────────────────
// When a field changes, every field listed after it must be cleared.
const DOWNSTREAM_FIELDS: Record<string, string[]> = {
  academic_year:  ['school_location', 'grade', 'brand', 'board', 'course', 'stream', 'shift'],
  school_location:['grade', 'brand', 'board', 'course', 'stream', 'shift'],
  grade:          ['brand', 'board', 'course', 'stream', 'shift'],
  brand:          ['board', 'course', 'stream', 'shift'],
  board:          ['course', 'stream', 'shift'],
  course:         ['stream', 'shift'],
  stream:         ['shift'],
}

// Required fields that must all be set before we can fetch the fee table
const FEE_REQUIRED_FIELDS = [
  'academic_year.id',
  'school_location.id',
  'grade.id',
  'board.id',
  'course.id',
  'shift.id',
]

// ─── Validation rules (all fields use the same "required only" rule here) ────
const GUEST_SCHOOL_REQUIRED_FIELDS = ['academic_year', 'school_location', 'grade', 'course', 'board', 'stream']

const REQUIRED_VALIDATION = [
  { type: 'is_required',        validation: true,  error_message: 'Field is required' },
  { type: 'numeric',            validation: false, error_message: '' },
  { type: 'alphanumeric',       validation: false, error_message: '' },
  { type: 'email',              validation: false, error_message: '' },
  { type: 'mobile_no',          validation: false, error_message: '' },
  { type: 'range',              validation: false, error_message: '', min: 0, max: 0 },
  { type: 'is_repeatable',      validation: false, error_message: '' },
  { type: 'is_group_repeatable',validation: false, error_message: '' },
  { type: 'is_hidden',          validation: false, error_message: '' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface StudentSearchOption {
  id: number
  name: string
  enrollment_no: string
  type: string
}

// ─── Tooltip without max-width cap ───────────────────────────────────────────

const NoMaxWidthTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: { maxWidth: 'none' },
})

// ─── Reusable Autocomplete wrapper ───────────────────────────────────────────

const CommonAutocomplete = ({
  id, label, value, onChange, options = [], loading,
  getOptionLabel, error, note, infoDialog, disabled,
}: any) => (
  <Autocomplete
    id={id}
    options={options}
    disabled={disabled}
    loading={loading}
    getOptionLabel={getOptionLabel || ((option: any) => option?.name || '')}
    // Match selected value by id so MUI knows which option to highlight
    value={options.find((o: any) => o.id === value) || null}
    onChange={(_, newValue) => onChange(newValue ? newValue.id : null)}
    renderOption={(props, option) => (
      <li {...props} key={option.id}>{option.name}</li>
    )}
    renderInput={params => (
      <TextField
        {...params}
        required
        variant='outlined'
        error={error}
        label={
          <Box sx={{ display: 'flex', alignItems: 'normal' }}>
            {label}
            {infoDialog && note && (
              <Tooltip title={note}>
                <InfoIcon style={{ color: '#a3a3a3' }} />
              </Tooltip>
            )}
          </Box>
        }
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {loading && <CircularProgress color='inherit' size={20} />}
              {params.InputProps.endAdornment}
            </>
          ),
        }}
      />
    )}
    popupIcon={<DownArrow />}
  />
)

// ─── Main component ───────────────────────────────────────────────────────────

function EditFeeDetailDialog({ dialogOpen, setDialogOpen }: any) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('lg'))
  const { setGlobalState } = useGlobalContext()

  // ── Search bar state ───────────────────────────────────────────────────────
  const [searchInput, setSearchInput]           = useState('')
  const [searchOpen, setSearchOpen]             = useState(false)
  const [studentList, setStudentList]           = useState<StudentSearchOption[]>([])
  const [selectedStudent, setSelectedStudent]   = useState<StudentSearchOption | null>(null)
  const [isTyping, setIsTyping]                 = useState(true)   // prevents re-triggering search on programmatic input change
  const [enquiryNumber, setEnquiryNumber]       = useState('')

  // ── Form state ─────────────────────────────────────────────────────────────
  // All field values live in one flat object using dot-notation keys:
  //   'grade.id', 'grade.value', 'school_location.id', etc.
  const [formData, setFormData] = useState<Record<string, any>>({})

  // These mirror the .id values in formData so useEffects have simple deps to watch.
  // When a dropdown changes we update BOTH formData AND the matching state var.
  const [academicYear, setAcademicYear]     = useState<any>(null)
  const [schoolLocation, setSchoolLocation] = useState<any>(null)
  const [grade, setGrade]                   = useState<any>(null)
  const [brand, setBrand]                   = useState<any>(null)
  const [board, setBoard]                   = useState<any>(null)
  const [course, setCourse]                 = useState<any>(null)
  const [stream, setStream]                 = useState<any>(null)
  const [, setShift]                        = useState<any>(null)

  // ── Option lists ───────────────────────────────────────────────────────────
  const [academicYearOptions, setAcademicYearOptions] = useState<any[]>([])
  const [schoolOptions,       setSchoolOptions]       = useState<any[]>([])
  const [gradeOptions,        setGradeOptions]        = useState<any[]>([])
  const [brandOptions,        setBrandOptions]        = useState<any[]>([])
  const [boardOptions,        setBoardOptions]        = useState<any[]>([])
  const [courseOptions,       setCourseOptions]       = useState<any[]>([])
  const [streamOptions,       setStreamOptions]       = useState<any[]>([])
  const [shiftOptions,        setShiftOptions]        = useState<any[]>([])

  // ── Guest school state ─────────────────────────────────────────────────────
  const [guestSchoolOptions,    setGuestSchoolOptions]    = useState<any[]>([])
  const [isGuestStudent,        setIsGuestStudent]        = useState(false)
  const [isGuestSchoolLoading,  setIsGuestSchoolLoading]  = useState(false)

  // ── Fee table state ────────────────────────────────────────────────────────
  const [feeRows,          setFeeRows]          = useState<any[]>([])
  const [isFeeLoading,     setIsFeeLoading]     = useState(false)
  const [selectionModel,   setSelectionModel]   = useState<GridRowSelectionModel>([])
  const [paginationModel,  setPaginationModel]  = useState({ page: 0, pageSize: 100 })

  // ==========================================================================
  // SMALL HELPERS
  // ==========================================================================

  /** True when every field required for the fee API has a value. */
  const hasAllFeeFields = (fd: Record<string, any>) =>
    FEE_REQUIRED_FIELDS.every(key => Boolean(fd[key]))

  /** Builds a single { id, name } option from saved form values (used as
   *  a fallback when the options list hasn't loaded yet). */
  const makeDefaultOption = (id: any, name: any) =>
    id && name ? { id, name } : null

  /** Runs all field validations and returns the first error message. */
  const runValidations = (validations: any[], value: any, fieldName?: string): string => {
    return checkValidationsZod(validations, value, fieldName)
  }

  // ==========================================================================
  // RESET HELPERS
  // ==========================================================================

  /**
   * Clears the option list AND the mirror state variable for a field.
   * Uses fall-through so clearing 'grade' also clears everything below it.
   */
  const clearField = (field: string) => {
    // eslint-disable-next-line default-case
    switch (field) {
      case 'school_location': setSchoolLocation(null); setSchoolOptions([]);  // falls through
      case 'grade':           setGrade(null);           setGradeOptions([]);  // falls through
      case 'brand':           setBrand(null);           setBrandOptions([]);  // falls through
      case 'board':           setBoard(null);           setBoardOptions([]);  // falls through
      case 'course':          setCourse(null);          setCourseOptions([]); // falls through
      case 'stream':          setStream(null);          setStreamOptions([]); // falls through
      case 'shift':           setShift(null);           setShiftOptions([]);
    }
  }

  /**
   * Returns a formData patch that sets all downstream fields to null/empty,
   * and also calls clearField() so the dropdowns visually empty right away.
   */
  const buildDownstreamResetPatch = (changedField: string): Record<string, any> => {
    const patch: Record<string, any> = {}
    ;(DOWNSTREAM_FIELDS[changedField] || []).forEach(field => {
      patch[`${field}.id`]    = null
      patch[`${field}.value`] = ''
      patch[`student_details.${field}.id`]    = null
      patch[`student_details.${field}.value`] = ''
      clearField(field)
    })
    return patch
  }

  /**
   * Clears guest school state — called whenever its upstream dependencies change
   * or when no results come back from the host-school API.
   */
  const clearGuestSchool = (patch: Record<string, any> = {}): Record<string, any> => {
    setGuestSchoolOptions([])
    setIsGuestStudent(false)
    return {
      ...patch,
      'guest_student_details.location.id':    null,
      'guest_student_details.location.value': '',
      'other_details.is_guest_student':       false,
    }
  }

  const resetAll = () => {
    setFormData({})
    setFeeRows([])
    setAcademicYear(null)
    clearField('school_location')
    setGuestSchoolOptions([])
    setIsGuestStudent(false)
  }

  // ==========================================================================
  // API CALLS
  // ==========================================================================

  const fetchAcademicYears = async () => {
    try {
      const response = await getRequest({ url: ACADEMIC_YEAR_API_URL, serviceURL: 'mdm' })
      setAcademicYearOptions(
        response.data.map((item: any) => ({
          id:                   item.id,
          name:                 item.attributes.name,
          value:                item.id,
          short_name_two_digit: item.attributes?.short_name_two_digit,
        }))
      )
    } catch (e) {
      // console.error('Failed to fetch academic years', e)
    }
  }

  // ==========================================================================
  // API — CASCADE DROPDOWNS
  // ==========================================================================

  const fetchCascadeOptions = async (
    operator: string,
    setOptions: (opts: any[]) => void,
    optionSet: { id: string; name: string; key: string; dedupeKey: string },
    autoSelect?: (id: any) => void
  ) => {
    if (operator.includes('undefined')) return  // upstream value not ready yet

    try {
      setGlobalState({ isLoading: true })
      const response = await postRequest({
        url: SCHOOL_SEARCH_API_URL, serviceURL: 'mdm', data: { operator },
      })
      let data: any[] = response?.data?.schools || []

      // Remove duplicates by the field's own id (e.g. grade_id)
      const seen: Record<string, boolean> = {}
      data = data.filter(item => {
        if (seen[item[optionSet.dedupeKey]]) return false
        seen[item[optionSet.dedupeKey]] = true
        return true
      })

      // Normalise to { id, name }
      const options = data.map((item: any) => ({
        id:   item[optionSet.id]   ?? item.id,
        name: item[optionSet.name] ?? item.name,
      }))

      // Grade is sorted numerically; all others keep API order
      const sorted = optionSet.key === 'grade'
        ? [...options].sort((a, b) => a.id - b.id)
        : options

      setOptions(sorted)

      // Auto-select when there is only one option
      if (sorted.length === 1 && autoSelect) {
        autoSelect(sorted[0].id)
        setFormData(prev => {
          const updated = {
            ...prev,
            [`${optionSet.key}.id`]:    sorted[0].id,
            [`${optionSet.key}.value`]: sorted[0].name,
          }
          if (hasAllFeeFields(updated)) setTimeout(() => fetchFees(undefined, updated), 0)
          return updated
        })
      }
    } catch (e) {
      // console.error(`Failed to fetch ${optionSet.key} options`, e)
    } finally {
      setGlobalState({ isLoading: false })
    }
  }

  // ==========================================================================
  // API — FEES
  // ==========================================================================

  const fetchFees = async (overrideSchoolId?: any, snapshot?: Record<string, any>) => {
    const fd = snapshot ?? formData
    if (!hasAllFeeFields(fd)) return
    const isGuest       = fd['other_details.is_guest_student']
    const guestSchoolId = fd['guest_student_details.location.id']

    if (isGuest && !guestSchoolId) return

    const schoolId = overrideSchoolId ?? (isGuest ? guestSchoolId : fd['school_location.id'])

    const academicYearPart =
      fd['academic_year.value']?.split(' - ')?.[1] ?? fd['academic_year.id']

    const operator =
      `school_id = ${schoolId}` +
      ` AND academic_year_id= ${academicYearPart}` +
      ` AND grade_id=${fd['grade.id']}` +
      ` AND board_id=${fd['board.id']}` +
      ` AND shift_id= ${fd['shift.id']}` +
      ` AND course_id= ${fd['course.id']}` +
      ` AND fee_type_id IN (12,1,17,9)` +
      ` AND publish_start_date <= current_date` +
      ` AND publish_end_date >= current_date` +
      ` AND (admission_type_id = 1 OR admission_type_id = null)`

    try {
      setIsFeeLoading(true)
      const response = await postRequest({
        url: '/api/ac-schools/search-school-fees',
        serviceURL: 'mdm',
        data: { operator },
      })

      const fees: any[] = response?.data?.schoolFees ?? []
      if (fees.length > 0) {
        setFeeRows(fees.map((row, i) => ({
          id:           i + 1,
          academicYear: row.academic_year         || 'NA',
          school:       row.school_name           || 'NA',
          grade:        row.grade_name            || 'NA',
          board:        row.board_name            || 'NA',
          course:       row.course_name           || 'NA',
          brand:        row.brand_name            || 'NA',
          shift:        row.shift_name            || 'NA',
          feeType:      row.fee_type_name         || 'NA',
          feeSubType:   row.fee_sub_type_name     || 'NA',
          fees:         row.fee_amount_for_period || 0,
        })))
      } else {
        setFeeRows([])
        toast.error('No fee data found for the selected combination', { duration: 2000 })
      }
    } catch {
      setFeeRows([])
      toast.error('Failed to fetch fee data', { duration: 2000 })
    } finally {
      setIsFeeLoading(false)
    }
  }

  // ==========================================================================
  // API — GUEST / HOST SCHOOL LIST
  // ==========================================================================

  /**
   * Fetches the guest/host school list once all required upstream fields are set.
   *
   * Corner cases handled:
   *   1. Any upstream dependency is null/empty  → clear guest school, mark non-guest
   *   2. API returns empty list                 → clear guest school, mark non-guest
   *   3. API returns exactly one option         → auto-select it, re-fetch fees
   *   4. API returns multiple options           → populate dropdown, let user choose
   *   5. Guest school dropdown becomes stale    → cleared whenever deps change (via useEffect)
   */
  const fetchHostSchools = async () => {
    // const fd = currentFormData ?? formData

    // Validate all required upstream fields exist
    const allDepsReady =
      academicYear && schoolLocation && grade && course && board && stream &&
      academicYearOptions.length > 0

    if (!allDepsReady) {
      setFormData(prev => clearGuestSchool({ ...prev }))
      return
    }

    // If enquiry details already loaded a saved guest school, don't overwrite it
    const savedGuestSchoolId = formData['guest_student_details.location.id']
    if (savedGuestSchoolId && formData['other_details.is_guest_student']) return

    const selectedYear = academicYearOptions.find((opt: any) => opt.id === academicYear)
    const yearShort = selectedYear?.short_name_two_digit

    if (!yearShort) {
      setFormData(prev => clearGuestSchool({ ...prev }))
      return
    }

    try {
      setIsGuestSchoolLoading(true)

      const response: any = await postRequest({
        url: '/studentProfile/get-guest-school-list',
        serviceURL: 'admin',
        data: {
          academic_year_id: Number(yearShort),
          school_id:  schoolLocation,
          grade_id:   grade,
          course_id:  course,
          board_id:   board,
          stream_id:  stream,
        },
      })

      const list: any[] = response?.status && response?.data?.data?.length > 0 ? response.data.data : []

      if (list.length === 0) {
        // No guest schools available — disable the field and mark non-guest
        setFormData(prev => clearGuestSchool({ ...prev }))
        return
      }

      const mappedOptions = list.map((item: any) => ({
        id:   item.host_school_id,
        name: item.host_school_name,
      }))

      setGuestSchoolOptions(mappedOptions)
      setIsGuestStudent(true)

      if (mappedOptions.length === 1) {
        // Auto-select the single option and immediately re-fetch fees with it
        const savedId   = formData['guest_student_details.location.id']
        const savedName = formData['guest_student_details.location.value']
        const autoId    = savedId   || mappedOptions[0].id
        const autoName  = savedName || mappedOptions[0].name

        setFormData(prev => {
          const updated = {
            ...prev,
            'other_details.is_guest_student':       true,
            'guest_student_details.location.id':    autoId,
            'guest_student_details.location.value': autoName,
            error: { ...prev.error, 'guest_student_details.location': null },
          }
          if (hasAllFeeFields(updated)) setTimeout(() => fetchFees(autoId, updated), 0)
          return updated
        })
      } else {
        // Multiple options — just mark as guest student, user must pick
        setFormData(prev => ({
          ...prev,
          'other_details.is_guest_student':       true,
          // Clear any previously auto-selected guest school so user picks fresh
          'guest_student_details.location.id':    null,
          'guest_student_details.location.value': '',
        }))
        setFeeRows([]) // No fees until guest school is chosen
      }
    } catch {
      setFormData(prev => clearGuestSchool({ ...prev }))
    } finally {
      setIsGuestSchoolLoading(false)
    }
  }

  // ==========================================================================
  // DROPDOWN CHANGE HANDLER
  // ==========================================================================

  const handleDropdownChange = (
    fieldName: string,
    newValue: any,
    options: any[],
  ) => {
    const error    = runValidations(REQUIRED_VALIDATION, newValue)
    const fieldKey = fieldName.split('.').pop()!
    const label    = options.find((o: any) => o.id === newValue)?.name ?? ''

    const resetPatch = fieldKey in DOWNSTREAM_FIELDS
      ? buildDownstreamResetPatch(fieldKey)
      : {}

    // When any upstream guest-school dependency changes, clear the guest school too
    const guestResetPatch: Record<string, any> =
      GUEST_SCHOOL_REQUIRED_FIELDS.includes(fieldKey)
        ? {
            'guest_student_details.location.id':    null,
            'guest_student_details.location.value': '',
            'other_details.is_guest_student':       false,
          }
        : {}

    if (GUEST_SCHOOL_REQUIRED_FIELDS.includes(fieldKey)) {
      setGuestSchoolOptions([])
      setIsGuestStudent(false)
    }

    const mirrorSetters: Record<string, (v: any) => void> = {
      academic_year: setAcademicYear, school_location: setSchoolLocation,
      grade: setGrade, brand: setBrand, board: setBoard,
      course: setCourse, stream: setStream, shift: setShift,
    }
    mirrorSetters[fieldKey]?.(newValue)

    setFormData(prev => {
      const updated: Record<string, any> = {
        ...prev,
        ...resetPatch,
        ...guestResetPatch,
        [`${fieldName}.id`]:    newValue,
        [`${fieldName}.value`]: label,
        error: { ...prev.error, [fieldName]: error },
      }

      // For the guest school field itself — re-fetch fees when it changes
      if (fieldKey === 'location' && fieldName.includes('guest_student_details')) {
        if (newValue && hasAllFeeFields(updated)) {
          setTimeout(() => fetchFees(newValue, updated), 0)
        } else {
          setFeeRows([])
        }
      } else if (hasAllFeeFields(updated) && newValue && !updated['other_details.is_guest_student']) {
        // Non-guest path: fetch fees whenever all required fields are set
        setTimeout(() => fetchFees(undefined, updated), 0)
      } else {
        setFeeRows([])
      }

      return updated
    })
  }

  // ==========================================================================
  // STUDENT SEARCH
  // ==========================================================================

  const searchStudents = async (query: string) => {
    try {
      setGlobalState({ isLoading: true })
      let schoolIds: number[] = []
      if (process.env.NODE_ENV !== 'development') {
        const userInfo = JSON.parse(getLocalStorageVal('userInfo') || '{}')
        schoolIds = userInfo?.userInfo?.schoolIds ?? []
      }

      const response = await postRequest({
        url: 'marketing/enquiry/finance/enquiry-list/search',
        serviceURL: 'marketing',
        data: { search: query, school_id: schoolIds },
      })

      if (response?.status === 200 && response?.data?.length > 0) {
        setStudentList(
          response.data.map((item: any) => ({
            id: item.id, name: item.display_name, enrollment_no: item.enr_on, type: 'f',
          }))
        )
        setEnquiryNumber(query.trim())
      }
    } catch { /* silent */ } finally {
      setGlobalState({ isLoading: false })
    }
  }

  const debouncedSearch = useCallback(debounce(searchStudents, 500), [])

  const handleSearchInput = (_: any, newValue: string) => {
    if (newValue === '') {
      setSearchInput(''); setIsTyping(false); setSelectedStudent(null)
      return
    }
    if (isTyping && newValue.length > 2) {
      debouncedSearch(newValue)
      setSearchOpen(true)
    }
    setSearchInput(newValue)
    setIsTyping(true)
  }

  const handleStudentSelect = (_: any, student: StudentSearchOption | null) => {
    if (student) {
      setIsTyping(false)
      setSelectedStudent(student)
      loadEnquiryDetails(student)
    } else {
      resetAll()
    }
  }

  // ==========================================================================
  // LOAD ENQUIRY DETAILS  (called once a student is picked from search)
  // ==========================================================================

  const loadEnquiryDetails = async (student: StudentSearchOption) => {
    setGlobalState({ isLoading: true })
    try {
      const response = await getRequest({
        url: `marketing/enquiry/finance/enquiry-details?enquiryId=${student.id}`,
        serviceURL: 'marketing',
      })

      if (response?.status !== 200) return

      const d = response.data

      // Update mirror state vars so cascade useEffects fire and populate dropdowns
      setAcademicYear(d.academic_year_id || null)
      setSchoolLocation(d.school_id      || null)
      setGrade(d.grade_id                || null)
      setBrand(d.brand_id                || null)
      setBoard(d.board_id                || null)
      setCourse(d.course_id              || null)
      setStream(d.stream_id              || null)
      setShift(d.shift_id                || null)
      setIsGuestStudent(d.is_guest_student || false)
      if (d.is_guest_student && d.guest_student_details?.location?.id) {
        setGuestSchoolOptions([{
          id:   d.guest_student_details.location.id,
          name: d.guest_student_details.location.value,
        }])
      }

      const newFormData: Record<string, any> = {
        'academic_year.id':    d.academic_year_id || null,
        'academic_year.value': d.academic_year    || '',
        'school_location.id':    d.school_id || null,
        'school_location.value': d.school    || '',
        'grade.id':    d.grade_id || null,
        'grade.value': d.grade    || '',
        'brand.id':    d.brand_id || null,
        'brand.value': d.brand    || '',
        'board.id':    d.board_id || null,
        'board.value': d.board    || '',
        'course.id':    d.course_id || null,
        'course.value': d.course    || '',
        'stream.id':    d.stream_id || null,
        'stream.value': d.stream    || '',
        'shift.id':    d.shift_id || null,
        'shift.value': d.shift    || '',
        'other_details.is_guest_student':          d.is_guest_student || false,
        'guest_student_details.location.id':    d.guest_student_details?.location?.id    || null,
        'guest_student_details.location.value': d.guest_student_details?.location?.value || '',
      }

      setFormData(newFormData)

      // Immediately populate the fee table if all data came back from the API
      if (d.shift_id) fetchFees(undefined, newFormData)

    } catch { /* silent */ } finally {
      setGlobalState({ isLoading: false })
    }
  }

  // ==========================================================================
  // CONFIRM / SUBMIT
  // ==========================================================================

  const handleConfirm = async () => {
    setGlobalState({ isLoading: true })

    const requiredFields = ['school_location', 'brand', 'board', 'grade', 'course', 'shift', 'academic_year', 'stream']
    const allFilled = requiredFields.every(f => formData[`${f}.id`] && formData[`${f}.value`])

    if (!allFilled) {
      toast.error('Please select all the fields', { duration: 2000 })
      setGlobalState({ isLoading: false })
      return
    }

    // For guest students, a guest school must also be selected
    if (formData['other_details.is_guest_student'] && !formData['guest_student_details.location.id']) {
      toast.error('Please select a guest school location', { duration: 2000 })
      setGlobalState({ isLoading: false })
      return
    }

    if (feeRows.length === 0) {
      toast.error('No fees to edit', { duration: 2000 })
      setGlobalState({ isLoading: false })
      return
    }

    try {
      const isGuest = formData['other_details.is_guest_student']

      const payload: any = {
        enquiry_number: enquiryNumber,
        // Guest students are billed under a different school
        school: {
          id:    isGuest ? formData['guest_student_details.location.id']    : formData['school_location.id'],
          value: isGuest ? formData['guest_student_details.location.value'] : formData['school_location.value'],
        },
        brand:          { id: formData['brand.id'],         value: formData['brand.value'] },
        board:          { id: formData['board.id'],         value: formData['board.value'] },
        grade:          { id: formData['grade.id'],         value: formData['grade.value'] },
        course:         { id: formData['course.id'],        value: formData['course.value'] },
        shift:          { id: formData['shift.id'],         value: formData['shift.value'] },
        academicYearId: { id: formData['academic_year.id'], value: formData['academic_year.value'] },
        stream:         { id: formData['stream.id'],        value: formData['stream.value'] },
      }

      if (isGuest) {
        payload.guest_school = {
          id:    formData['guest_student_details.location.id'],
          value: formData['guest_student_details.location.value'],
        }
      }

      const response = await postRequest({
        url: 'marketing/enquiry/edit-fee-attached',
        serviceURL: 'marketing',
        data: payload,
      })

      if (response?.status === 200) {
        toast.success('Fees edited successfully', { duration: 2000 })
        setDialogOpen(true)
      } else {
        toast.error(response?.error?.error?.message || 'Something went wrong', { duration: 2000 })
      }
    } catch { /* silent */ } finally {
      setGlobalState({ isLoading: false })
    }
  }

  // ==========================================================================
  // DIALOG CLOSE
  // ==========================================================================

  const handleClose = () => {
    setDialogOpen(false)
    resetAll()
    setSelectedStudent(null)
    setSearchInput('')
    setIsTyping(true)
    setFeeRows([])
    setSelectionModel([])
    setStudentList([])
  }

  // ==========================================================================
  // CASCADE useEffects
  // ==========================================================================

  useEffect(() => { fetchAcademicYears() }, [])

  useEffect(() => {
    if (!academicYear || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr}`,
      setSchoolOptions,
      { id: 'school_id', name: 'name', key: 'school', dedupeKey: 'school_id' }
    )
  }, [academicYear, academicYearOptions])

  useEffect(() => {
    if (!academicYear || !schoolLocation || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr} and school_id = ${schoolLocation}`,
      setGradeOptions,
      { id: 'grade_id', name: 'grade_name', key: 'grade', dedupeKey: 'grade_id' },
      setGrade
    )
  }, [academicYear, schoolLocation, academicYearOptions])

  useEffect(() => {
    if (!academicYear || !schoolLocation || !grade || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr} and school_id = ${schoolLocation} and grade_id = ${grade}`,
      setBrandOptions,
      { id: 'brand_id', name: 'brand_name', key: 'brand', dedupeKey: 'brand_id' },
      setBrand
    )
  }, [academicYear, schoolLocation, grade, academicYearOptions])

  useEffect(() => {
    if (!academicYear || !schoolLocation || !grade || !brand || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr} and school_id = ${schoolLocation} and brand_id = ${brand} and grade_id = ${grade}`,
      setBoardOptions,
      { id: 'board_id', name: 'board_name', key: 'board', dedupeKey: 'board_id' },
      setBoard
    )
  }, [academicYear, schoolLocation, grade, brand, academicYearOptions])

  useEffect(() => {
    if (!academicYear || !schoolLocation || !grade || !brand || !board || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr} and school_id = ${schoolLocation} and brand_id = ${brand} and board_id = ${board} and grade_id = ${grade}`,
      setCourseOptions,
      { id: 'course_id', name: 'course_name', key: 'course', dedupeKey: 'course_id' },
      setCourse
    )
  }, [academicYear, schoolLocation, grade, brand, board, academicYearOptions])

  useEffect(() => {
    if (!academicYear || !schoolLocation || !grade || !brand || !board || !course || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr} and school_id = ${schoolLocation} and brand_id = ${brand} and board_id = ${board} and course_id = ${course} and grade_id = ${grade}`,
      setStreamOptions,
      { id: 'stream_id', name: 'stream_name', key: 'stream', dedupeKey: 'stream_id' },
      setStream
    )
  }, [academicYear, schoolLocation, grade, brand, board, course, academicYearOptions])

  useEffect(() => {
    if (!academicYear || !schoolLocation || !grade || !brand || !board || !course || !stream || !academicYearOptions.length) return
    const yr = getObjectByKeyVal(academicYearOptions, 'id', academicYear)?.short_name_two_digit
    fetchCascadeOptions(
      `academic_year_id = ${yr} and school_id = ${schoolLocation} and brand_id = ${brand} and board_id = ${board} and course_id = ${course} and stream_id = ${stream} and grade_id = ${grade}`,
      setShiftOptions,
      { id: 'shift_id', name: 'shift_name', key: 'shift', dedupeKey: 'shift_id' },
      setShift
    )
  }, [academicYear, schoolLocation, grade, brand, board, course, stream, academicYearOptions])

  /**
   * Guest school effect — fires whenever any of the 6 required upstream fields change.
   * Clearing any one of them will cause fetchHostSchools to clear the guest state too.
   */
  useEffect(() => {
    fetchHostSchools()
  }, [academicYear, schoolLocation, grade, course, board, stream, academicYearOptions])

  // ==========================================================================
  // FEE TABLE COLUMNS
  // ==========================================================================

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN').format(amount)

  const feeColumns = [
    { field: 'academicYear', headerName: 'Academic Year', width: 120 },
    { field: 'school',       headerName: 'School',        width: 300 },
    { field: 'grade',        headerName: 'Grade',         width: 100 },
    { field: 'board',        headerName: 'Board',         width: 100 },
    { field: 'course',       headerName: 'Course',        width: 100 },
    { field: 'brand',        headerName: 'Brand',         width: 150 },
    { field: 'shift',        headerName: 'Shift',         width: 100 },
    { field: 'feeType',      headerName: 'Fee Type',      width: 150 },
    { field: 'feeSubType',   headerName: 'Fee Sub Type',  width: 150 },
    {
      field: 'fees',
      headerName: 'Fees (₹)',
      width: 120,
      renderCell: (params: any) => (
        <div className='text-right'>{formatCurrency(Math.round(params.row.fees))}</div>
      ),
    },
  ]

  // ==========================================================================
  // DERIVED UI FLAGS
  // ==========================================================================

  /**
   * Show the guest school dropdown only when the API returned options.
   * Disable it while loading or when there are no options.
   */
  const showGuestSchoolDropdown = isGuestStudent || guestSchoolOptions.length > 0
  const guestSchoolDisabled     = isGuestSchoolLoading || guestSchoolOptions.length === 0

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <Dialog open={dialogOpen} fullScreen={fullScreen} fullWidth maxWidth='xl' onClose={handleClose}>
      <DialogContent>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Grid item xs={12} sx={{ mb: '30px', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant='h6' color='text.primary'>Enquiry Details</Typography>
          <div onClick={handleClose} className='text-gray-400 hover:text-gray-600 cursor-pointer'>
            <CloseIcon />
          </div>
        </Grid>
        <Grid item xs={12} sx={{ mb: '30px' }}><Divider /></Grid>

        {/* ── Student search ──────────────────────────────────────────────── */}
        <Grid item md={5} sx={{ width: '40%' }}>
          <Autocomplete
            id='student-search'
            options={studentList}
            value={selectedStudent}
            inputValue={searchInput}
            open={searchOpen}
            onOpen={() => setSearchOpen(true)}
            onClose={() => setSearchOpen(false)}
            getOptionLabel={(o: StudentSearchOption) => o.name}
            filterOptions={opts => opts.filter(o => o.name)}
            onInputChange={handleSearchInput}
            onChange={handleStudentSelect}
            renderInput={params => (
              <TextField
                {...params}
                placeholder='Search by student name, enrolment or mobile number'
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='icon-search-normal-1' />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <>
                      <InputAdornment position='end' sx={{ position: 'absolute', right: '15px' }}>
                        <NoMaxWidthTooltip title='Student Name | Enrolment No | Enquiry No | Parent Mobile'>
                          <i className='icon-info-circle' />
                        </NoMaxWidthTooltip>
                      </InputAdornment>
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            sx={{
              '.MuiInputBase-root.MuiOutlinedInput-root': { borderRadius: '30px', pt: '12px', pl: '15px', height: '50px' },
              '.MuiInputBase-root.MuiOutlinedInput-root .MuiAutocomplete-popupIndicator': { display: 'none' },
              '.MuiInputBase-root.MuiOutlinedInput-root .MuiAutocomplete-clearIndicator': { mt: '5px' },
              '.MuiOutlinedInput-root .MuiAutocomplete-endAdornment': { right: '40px' },
              '& input': { color: t => t.palette.getContrastText(t.palette.customColors.bodyBg) },
            }}
          />
        </Grid>

        {/* ── Cascade dropdowns ───────────────────────────────────────────── */}
        <Grid item container xs={12} spacing={5} sx={{ mt: '15px' }}>

          <Grid item xs={4}>
            <CommonAutocomplete id='academic_year' label='Academic Year'
              value={formData['academic_year.id']}
              options={academicYearOptions.length ? academicYearOptions : [makeDefaultOption(formData['academic_year.id'], formData['academic_year.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('academic_year', v, academicYearOptions)}
              error={Boolean(formData?.error?.academic_year)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='school_location' label='School Location'
              value={formData['school_location.id']}
              options={schoolOptions.length ? schoolOptions : [makeDefaultOption(formData['school_location.id'], formData['school_location.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('school_location', v, schoolOptions)}
              error={Boolean(formData?.error?.school_location)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='grade' label='Grade'
              value={formData['grade.id']}
              options={gradeOptions.length ? gradeOptions : [makeDefaultOption(formData['grade.id'], formData['grade.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('grade', v, gradeOptions)}
              error={Boolean(formData?.error?.grade)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='brand' label='Brand'
              value={formData['brand.id']}
              options={brandOptions.length ? brandOptions : [makeDefaultOption(formData['brand.id'], formData['brand.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('brand', v, brandOptions)}
              error={Boolean(formData?.error?.brand)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='board' label='Board'
              value={formData['board.id']}
              options={boardOptions.length ? boardOptions : [makeDefaultOption(formData['board.id'], formData['board.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('board', v, boardOptions)}
              error={Boolean(formData?.error?.board)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='course' label='Course'
              value={formData['course.id']}
              options={courseOptions.length ? courseOptions : [makeDefaultOption(formData['course.id'], formData['course.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('course', v, courseOptions)}
              error={Boolean(formData?.error?.course)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='stream' label='Stream'
              value={formData['stream.id']}
              options={streamOptions.length ? streamOptions : [makeDefaultOption(formData['stream.id'], formData['stream.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('stream', v, streamOptions)}
              error={Boolean(formData?.error?.stream)}
            />
          </Grid>

          <Grid item xs={4}>
            <CommonAutocomplete id='shift' label='Shift'
              value={formData['shift.id']}
              options={shiftOptions.length ? shiftOptions : [makeDefaultOption(formData['shift.id'], formData['shift.value'])].filter(Boolean)}
              onChange={(v: any) => handleDropdownChange('shift', v, shiftOptions)}
              error={Boolean(formData?.error?.shift)}
            />
          </Grid>

          {/*
            Guest School Location
            ─────────────────────
            Visibility : shown only when the host-school API returned results
                         OR the student already has a saved guest school (loaded from API)
            Disabled   : while loading, or when no options are available
          */}
          {showGuestSchoolDropdown && (
            <Grid item xs={4}>
              <CommonAutocomplete
                id='guest_student_details.location'
                label='Guest School Location'
                value={formData['guest_student_details.location.id']}
                options={
                  guestSchoolOptions.length
                    ? guestSchoolOptions
                    : [makeDefaultOption(
                        formData['guest_student_details.location.id'],
                        formData['guest_student_details.location.value']
                      )].filter(Boolean)
                }
                onChange={(v: any) =>
                  handleDropdownChange('guest_student_details.location', v, guestSchoolOptions)
                }
                error={Boolean(formData?.error?.['guest_student_details.location'])}
                disabled={guestSchoolDisabled}
                loading={isGuestSchoolLoading}
              />
            </Grid>
          )}
        </Grid>

        {/* ── Fee table ───────────────────────────────────────────────────── */}
        <Grid container sx={{ mt: '15px' }}>
          <Grid item xs={12}>
            <Box sx={{ position: 'relative', borderRadius: '12px', height: 250, border: '1px solid #c4c4c4' }}>

              {/* Spinner overlay while fees are loading */}
              {isFeeLoading && (
                <Box sx={{
                  position: 'absolute', inset: 0, zIndex: 10, borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                }}>
                  <CircularProgress size={32} />
                </Box>
              )}

              <DataGrid
                rows={feeRows}
                columns={feeColumns}
                getRowId={row => row.id}
                rowSelectionModel={selectionModel}
                onRowSelectionModelChange={setSelectionModel}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[25, 50, 100]}
                disableRowSelectionOnClick
                sx={{
                  '& .MuiDataGrid-cell':           { borderBottom: 'none' },
                  '& .MuiDataGrid-columnHeaders':   { backgroundColor: '#f5f5f5', color: '#000', fontSize: '14px' },
                  '& .MuiDataGrid-virtualScroller': { backgroundColor: '#fff' },
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* ── Confirm button ──────────────────────────────────────────────── */}
        <Grid container sx={{ mt: '15px', justifyContent: 'flex-end' }}>
          <Button variant='contained' color='info' sx={{ mr: 3 }} onClick={handleConfirm}>
            Confirm
          </Button>
        </Grid>

      </DialogContent>
      <DialogActions />
    </Dialog>
  )
}

export default EditFeeDetailDialog