import React, { useState, useEffect,useRef } from 'react'
import {
  Box,
  Button,
  Drawer,
  Stack,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  TextField,
  Autocomplete,
  Checkbox,
  Chip
} from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { getRequest,postRequest } from 'src/services/apiService'

const CalendarIcon = () => <span className='icon-calendar-1'></span>

interface FilterConfig {
  name: string
  label: string
  type: 'text' | 'date' | 'select' | 'multiselect' | 'dateRange'
  key: string
  required?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  apiEndpoint?: string
  defaultValue?: any
  autoFetch?: boolean
}

interface ReportFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  onDownload: (reportType: string, filters: any) => void
  selectedReportType?: string | null
  reportConfigs: any[]
}
interface OptionItem {
  value: any
  label: string
}

// --- DEFINE STRICT TYPES ---
// updated the cascadeKey as now teacher , coordinator and also the students must update the their state based on these things we provided
type CascadeKey = 'school_id' | 'brand_id' | 'board_id' | 'grade_id' | 'course_id' | 'stream_id' | 'shift_id' | 'division_id' | 'coordinator_code' | 'teacher_code'| 'student_id';

// --- CASCADING LOGIC CONFIGURATION ---
// added the coordinator , teacher and student to cascading map so that for api understanding 
const CASCADING_MAP: Record<CascadeKey, { idKey: string; nameKey: string }> = {
  school_id: { idKey: 'school_id', nameKey: 'name' },
  brand_id: { idKey: 'brand_id', nameKey: 'brand_name' },
  board_id: { idKey: 'board_id', nameKey: 'board_name' },
  grade_id: { idKey: 'grade_id', nameKey: 'grade_name' },
  course_id: { idKey: 'course_id', nameKey: 'course_name' },
  stream_id: { idKey: 'stream_id', nameKey: 'stream_name' },
  shift_id: { idKey: 'shift_id', nameKey: 'shift_name' },
  division_id: { idKey: 'division_id', nameKey: 'division' },
  coordinator_code: { idKey: 'value', nameKey: 'label' },
  teacher_code: { idKey: 'value', nameKey: 'label' },
  student_id: { idKey: 'value', nameKey: 'label' },

};

// Parent-before-child order — used by client-side cascade engine
const CASCADE_ORDER: CascadeKey[] = ['school_id', 'brand_id', 'board_id', 'grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id'];
const FULL_HIERARCHY = ['academic_year_id', 'school_id', 'brand_id', 'board_id', 'grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id'];

// now for class-wise and student-wise report
 // --- ADD TO EXISTING HIERARCHY ---
// just updated the hierrachy we use it when parent field of children changes then using this we clear the children state that is why it is so large 
 const HIERARCHY: Record<string, string[]> = {
  academic_year_id: ['school_id', 'brand_id', 'board_id', 'grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  school_id: ['brand_id', 'board_id', 'grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  brand_id: ['board_id', 'grade_id', 'course_id',  'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  board_id: ['grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  grade_id: ['course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  course_id: [ 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  stream_id: ['shift_id', 'division_id','terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  shift_id: ['division_id','terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  division_id: ['terms_id','subject_id', 'domain_id', 'subdomain_id', 'criteria_id','coordinator_code','teacher_code','student_id'],
  terms_id: [ 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id','student_id'],
  subject_id: ['domain_id', 'subdomain_id', 'criteria_id','student_id'],
  domain_id: ['subdomain_id', 'criteria_id','student_id'],
  subdomain_id: ['criteria_id','student_id'],
  criteria_id: ['student_id'],
  coordinator_code:['teacher_code','student_id'], 
  teacher_code:['student_id'], 
  status_id:['student_id']
};


const DIMENSION_TO_MDM_ENDPOINT: Record<string, string> = {
  cluster: '/api/ac-clusters',
  school: '/api/ac-schools',
  course: '/api/ac-courses',
  board: '/api/ac-boards',
  grade: '/api/ac-grades',
  stream: '/api/ac-streams',
  source: '/api/ad-enquiry-sources',
  subSource: '/api/ad-enquiry-sub-sources'
}

export default function ReportFilterDrawer({ isOpen, onClose, onDownload, reportConfigs,selectedReportType }: ReportFilterDrawerProps) {
  const [selectedReport, setSelectedReport] = useState('')
  const [filterValues, setFilterValues] = useState<any>({})
  const [dynamicOptions, setDynamicOptions] = useState<any>({})
  const [, setCascadeUpdateTick] = useState<number>(0) // this is to keep search-school api and the strapi-api of fetchAcademic in sync
  const searchSchoolAbortRef = useRef<AbortController | null>(null);
  const fetchAcademicsAbortRef = useRef<AbortController | null>(null);
  // Fix 3: per-field input values so Autocomplete search clears after each selection
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  // Raw rows from search-school API — client-side cascade engine computes per-field options from these
  const [allSchoolRows, setAllSchoolRows] = useState<any[]>([]);
  const [allStaffRows, setAllStaffRows] = useState<any[]>([]); //  Store raw staff for in-memory filtering so that we can select the co-ordinator and based on that we can directly filter out the teachers 
  // when the drawer is opend set and we have selectedReportType then set the selectedReport to the selectedReportType
  useEffect(() => {
    if (isOpen && selectedReportType) {
      setSelectedReport(selectedReportType);
    }
  }, [isOpen, selectedReportType]);

  const currentConfig = reportConfigs.find(config => config.value === selectedReport)

  const handleReportChange = (event: any) => {
    setSelectedReport(event.target.value)
    setFilterValues({})
  }
  // --- SEARCH-SCHOOL API: Fetch ALL rows for the academic year (field-selection-agnostic) ---
  // We only filter by academic_year_id here. Client-side cascade computes per-field options below.
  useEffect(() => {
    if (selectedReport !== 'class-wise' && selectedReport !== 'student-wise') return;

    const academicYear = filterValues['academic_year_id'];
    if (!academicYear) {
      setAllSchoolRows([]);
      setDynamicOptions((prev: any) => {
        const next = { ...prev };
        CASCADE_ORDER.forEach(k => { next[k] = []; });
        return next;
      });
      return;
    }

    if (searchSchoolAbortRef.current) searchSchoolAbortRef.current.abort();
    const controller = new AbortController();
    searchSchoolAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const response = await postRequest({
          url: '/api/ac-schools/search-school',
          data: { operator: `academic_year_id = ${academicYear}` },
          serviceURL: 'mdm',
        });
        if (controller.signal.aborted) return;
        if (response?.success && response?.data?.schools) {
          setAllSchoolRows(response.data.schools);
        }
      } catch (err) {

        // console.error('Failed to fetch school rows');

      }
    }, 400);
    return () => clearTimeout(timer);
  }, [filterValues['academic_year_id'], selectedReport]);
  // --- END SEARCH-SCHOOL API ---

  // --- CLIENT-SIDE CASCADE ENGINE ---
  // For each CASCADING_MAP field, options are derived from rows filtered by its ANCESTOR selections only.
  // This means every field always shows ALL options consistent with what was chosen above it,
  // without ever self-filtering (e.g. selecting grade 4 still shows grade 1,2,3,4 in the dropdown).
  useEffect(() => {
    if (allSchoolRows.length === 0) return;

    const maps: Record<CascadeKey, Map<any, OptionItem>> = {} as any;
    CASCADE_ORDER.forEach(k => { maps[k] = new Map(); });

    CASCADE_ORDER.forEach((key, index) => {
      // Filter rows using only the PARENT fields (fields before `key` in CASCADE_ORDER)
      const filteredRows = allSchoolRows.filter(row =>
        CASCADE_ORDER.slice(0, index).every(parentKey => {
          const selected = filterValues[parentKey];
          if (!selected || (Array.isArray(selected) && selected.length === 0)) return true;
          const rowValue = row[CASCADING_MAP[parentKey].idKey];
          return Array.isArray(selected)
            ? selected.some((s: any) => String(s) === String(rowValue))
            : String(selected) === String(rowValue);
        })
      );

      filteredRows.forEach(row => {
        const { idKey, nameKey } = CASCADING_MAP[key];
        const id = row[idKey];
        const name = row[nameKey];
        if (id !== null && id !== undefined && id !== '') {
          maps[key].set(id, { value: id, label: name || String(id) });
        }
      });
    });

    const newOptions: Record<string, OptionItem[]> = {};
    CASCADE_ORDER.forEach(key => {
      newOptions[key] = Array.from(maps[key].values());
    });
    if (newOptions.grade_id) newOptions.grade_id.sort((a: any, b: any) => a.value - b.value);

    setDynamicOptions((prev: any) => ({ ...prev, ...newOptions }));
    setCascadeUpdateTick((prev:any) => prev + 1);
  }, [
    allSchoolRows,
    filterValues['school_id'], filterValues['brand_id'], filterValues['board_id'],
    filterValues['grade_id'], filterValues['course_id'], filterValues['stream_id'],
    filterValues['shift_id'],
    selectedReport
  ]);
  // --- END CLIENT-SIDE CASCADE ENGINE ---
  // --- ACADEMIC CASCADING STATE ---
  const [allMappingRows, setAllMappingRows] = useState<any[]>([]);
  // subject id → label, resolved once per mapping fetch via secondary /ac-subjects call
  const [, setSubjectNameMap] = useState<Map<any, string>>(new Map());

  // --- PRE-FETCH SUBJECT NAMES ---
  useEffect(() => {
    if (selectedReport !== 'class-wise' && selectedReport !== 'student-wise') return;

    const fetchAllSubjects = async () => {
      try {
        const baseHeaders = { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` };
        const subjectRes = await getRequest({
          url: `/api/ac-subjects?pagination[pageSize]=5000&fields[0]=name`,
          serviceURL: 'mdm',
          headers: baseHeaders
        });
        if (subjectRes?.data) {
          const nameMap = new Map<any, string>();
          subjectRes.data.forEach((s: any) => {
            if (s?.id && s?.attributes?.name) nameMap.set(s.id, s.attributes.name);
          });
          setSubjectNameMap(nameMap);
        }
      } catch (err) {
        
      }
    };
    fetchAllSubjects();
  }, [selectedReport]);

// --- PHASE 1: Fetch Subject Masters & Resolve Names ---
  useEffect(() => {
    if (selectedReport !== 'class-wise' && selectedReport !== 'student-wise') return;

    const gradeId = filterValues['grade_id'];
    const courseId = filterValues['course_id'];

    // GATEKEEPER: Must select down to at least grade or course
    if ((!gradeId || (Array.isArray(gradeId) && gradeId.length === 0)) && 
        (!courseId || (Array.isArray(courseId) && courseId.length === 0))) {
      setDynamicOptions((prev: any) => ({ ...prev, subject_id: [], domain_id: [], subdomain_id: [], criteria_id: [] }));
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.append('pagination[pageSize]', '1000');
        params.append('filters[status_id][$eq]', '1'); 

        const appendFilter = (key: string, dbKey: string) => {
          const val = filterValues[key];
          if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
            const filterVal = Array.isArray(val) ? val[0] : val;
            params.append(`filters[${dbKey}][$eq]`, String(filterVal));
          }
        };

        appendFilter('brand_id', 'brand_id');
        appendFilter('board_id', 'board_id');
        appendFilter('grade_id', 'grade_id');
        appendFilter('course_id', 'course_id');
        appendFilter('stream_id', 'stream_id');
        // we have to use term_1_applicable and term_2_applicable columns here
        // --- Custom Term Boolean Logic (Phase 2) ---
        const termVal = filterValues['terms_id'];
      if (termVal !== undefined && termVal !== null && termVal !== '' && (!Array.isArray(termVal) || termVal.length > 0)) {
  const selectedTerm = String(Array.isArray(termVal) ? termVal[0] : termVal);
     if (selectedTerm === '1') {
         params.append('filters[term_1_applicable][$eq]', 'true');
    } else if (selectedTerm === '2') {
          params.append('filters[term_2_applicable][$eq]', 'true');
     }
     } 

        const apiUrl = `/api/ac-subject-masters?${params.toString()}`;
       

        // 1. Fetch the Subject Masters
        const res = await getRequest({
          url: apiUrl,
          serviceURL: 'mdm',
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
        });

        if (res?.data && Array.isArray(res.data)) {
          // Extract unique integer subject_ids (e.g., [82, 85, 90])
          const uniqueSubIds = Array.from(
            new Set(res.data.map((item: any) => item.attributes?.subject_id).filter(Boolean))
          );

          if (uniqueSubIds.length === 0) {
            setDynamicOptions((prev: any) => ({ ...prev, subject_id: [] }));
            return;
          }

          // 2. Fetch EXACT names for these specific IDs from ac-subjects
          const subParams = new URLSearchParams();
          uniqueSubIds.forEach((id, index) => {
             subParams.append(`filters[id][$in][${index}]`, String(id));
          });
          subParams.append('fields[0]', 'name');

          const nameRes = await getRequest({
            url: `/api/ac-subjects?${subParams.toString()}`,
            serviceURL: 'mdm',
            headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
          });

          // 3. Create a quick lookup dictionary for the names
          const nameDictionary = new Map();
          if (nameRes?.data) {
             nameRes.data.forEach((s: any) => {
                nameDictionary.set(s.id, s.attributes?.name);
             });
          }

          // 4. Map the final options combining the ID and the fetched Name
          const finalSubjectOptions = uniqueSubIds.map((id: any) => ({
             value: id,
             label: nameDictionary.get(id) || String(id) // Fallback to number if name is missing
          }));

          setDynamicOptions((prev: any) => ({
            ...prev,
            subject_id: finalSubjectOptions,
            terms_id: [{ value: 1, label: 'Term 1' }, { value: 2, label: 'Term 2' }]
          }));
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    filterValues['brand_id'], filterValues['board_id'], filterValues['grade_id'],
    filterValues['course_id'], filterValues['stream_id'], filterValues['terms_id'],
    selectedReport
  ]);
  // --- PHASE 2: Fetch Mappings ONLY when a Subject is selected ---
  useEffect(() => {
    if (selectedReport !== 'class-wise' && selectedReport !== 'student-wise') return;

    const subjectId = filterValues['subject_id'];
    
    // GATEKEEPER: If no subject is selected, clear mappings and lower dropdowns
    if (!subjectId || (Array.isArray(subjectId) && subjectId.length === 0)) {
      setAllMappingRows([]);
      setDynamicOptions((prev: any) => ({ ...prev, domain_id: [], subdomain_id: [], criteria_id: [] }));
      return;
    }

    if (fetchAcademicsAbortRef.current) fetchAcademicsAbortRef.current.abort();
    const controller = new AbortController();
    fetchAcademicsAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.append('pagination[pageSize]', '1000'); // Rarely > 1000 for a single subject
        params.append('populate[0]', 'domain_id');
        params.append('populate[1]', 'sub_domain_id');
        params.append('populate[2]', 'criteriaId');
        
        // Active status filters
        params.append('filters[status][$eq]', '1');
        params.append('filters[isDeleted][$eq]', 'false');

        // Filter mappings explicitly by the selected subject
        const filterSubject = Array.isArray(subjectId) ? subjectId[0] : subjectId;
        params.append('filters[subjectMasterId][subject_id][$eq]', String(filterSubject));

        // Enforce class hierarchy to prevent mixing (e.g. Grade 1 Math vs Grade 6 Math)
        const appendDeepFilter = (key: string, dbKey: string) => {
          const val = filterValues[key];
          if (val !== undefined && val !== null && val !== '' && (!Array.isArray(val) || val.length > 0)) {
            const filterVal = Array.isArray(val) ? val[0] : val;
            params.append(`filters[subjectMasterId][${dbKey}][$eq]`, String(filterVal));
          }
        };

        appendDeepFilter('brand_id', 'brand_id');
        appendDeepFilter('board_id', 'board_id');
        appendDeepFilter('grade_id', 'grade_id');
        appendDeepFilter('course_id', 'course_id');
        appendDeepFilter('stream_id', 'stream_id');
        // here too we need to use phase_1 logic for the terms 
        // --- Custom Term Boolean Logic (Phase 2) ---
        const termVal = filterValues['terms_id'];
      if (termVal !== undefined && termVal !== null && termVal !== '' && (!Array.isArray(termVal) || termVal.length > 0)) {
        const selectedTerm = String(Array.isArray(termVal) ? termVal[0] : termVal);
     if (selectedTerm === '1') {
         params.append('filters[subjectMasterId][term_1_applicable][$eq]', 'true');
    } else if (selectedTerm === '2') {
          params.append('filters[subjectMasterId][term_2_applicable][$eq]', 'true');
     }
     } 

        const mappingRes = await getRequest({
          url: `/api/ac-subject-criteria-mappings?${params.toString()}`,
          serviceURL: 'mdm',
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
        });

        if (controller.signal.aborted) return;
        
        if (mappingRes?.data) {
          setAllMappingRows(mappingRes.data);
        } else {
          setAllMappingRows([]);
        }

      } catch (err: any) {
        if (err?.name === 'AbortError') return; 
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    filterValues['subject_id'], 
    filterValues['brand_id'], filterValues['board_id'], filterValues['grade_id'],
    filterValues['course_id'], filterValues['stream_id'], filterValues['terms_id'],
    selectedReport
  ]);

  // --- PHASE 3: Compute Domain / Subdomain / Criteria Options ---
  // This is now incredibly fast because allMappingRows only contains data for ONE subject
  useEffect(() => {
    if (allMappingRows.length === 0) {
      setDynamicOptions((prev: any) => ({ ...prev, domain_id: [], subdomain_id: [], criteria_id: [] }));
      return;
    }

    const wrapToArr = (val: any) => {
      if (val === undefined || val === null || val === '') return [];
      return Array.isArray(val) ? val : [val];
    };

    const selectedDomains = wrapToArr(filterValues['domain_id']);
    const selectedSubDomains = wrapToArr(filterValues['subdomain_id']);

    const domainMap = new Map();
    const subDomMap = new Map();
    const critMap = new Map();

    allMappingRows.forEach((item: any) => {
      // 1. Domains
      const d = item.attributes?.domain_id?.data;
      if (d?.id) domainMap.set(d.id, { value: d.id, label: d.attributes?.name || String(d.id) });

      // 2. Subdomains (Only show if it belongs to the selected domain, or if no domain is selected)
      const rowDomainId = d?.id;
      const domainMatch = selectedDomains.length === 0 || selectedDomains.some((sd: any) => String(sd) === String(rowDomainId));
      
      if (domainMatch) {
        const sd = item.attributes?.sub_domain_id?.data;
        if (sd?.id) subDomMap.set(sd.id, { value: sd.id, label: sd.attributes?.name || String(sd.id) });
      }

      // 3. Criteria (Only show if it belongs to selected domain AND subdomain)
      const rowSubDomId = item.attributes?.sub_domain_id?.data?.id;
      const subDomMatch = selectedSubDomains.length === 0 || selectedSubDomains.some((ssd: any) => String(ssd) === String(rowSubDomId));

      if (domainMatch && subDomMatch) {
        const c = item.attributes?.criteriaId?.data;
        if (c?.id) critMap.set(c.id, { value: c.id, label: c.attributes?.name || String(c.id) });
      }
    });

    setDynamicOptions((prev: any) => ({
      ...prev,
      domain_id: Array.from(domainMap.values()),
      subdomain_id: Array.from(subDomMap.values()),
      criteria_id: Array.from(critMap.values()),
    }));

  }, [allMappingRows, filterValues['domain_id'], filterValues['subdomain_id']]);
  //-- 

  // HOOK 1: Staff (Coordinators and Teachers) I have added this useEffect as search-school api in itself not complete for cascading drop-down of the class-wise and student-wise reports 
  // so using this from our marketing backend we fetch the staff data and then filter it our based on the cascadeKey
  useEffect(() => {
    const year = filterValues.academic_year_id;
    const school = filterValues.school_id;

    if (!year || (Array.isArray(year) && year.length === 0) || 
      !school || (Array.isArray(school) && school.length === 0)) {
       return;
     }

    let timer:any;

    if (selectedReport === 'class-wise' || selectedReport === 'student-wise') {
      timer = setTimeout(async () => {
        try {
          const queryParams = new URLSearchParams();
          Object.entries(filterValues).forEach(([key, value]:[string,any]) => {
            if (value !== undefined && value !== null && value !== '' && ['academic_year_id', 'school_id', 'brand_id', 'board_id', 'grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id'].includes(key)) {
              // FIX: Flat Metabase param format instead of Strapi format
              queryParams.append(key, value); 
            }
          });

          const coord_teachers_response = await getRequest({
            serviceURL: 'marketing',
            url: `marketing/report-filters/staff?${queryParams.toString()}`,
          });

          if (coord_teachers_response) {
            setAllStaffRows(coord_teachers_response?.data || []); // Store raw data
            setDynamicOptions((prev:any) => ({
              ...prev,
              coordinator_code: coord_teachers_response?.data
              ?.filter((s:any) => s.role === 'Coordinator')
              .map((s:any) => ({
              value: s.value,
              label: s.label.includes(' - ') ? s.label.split(' - ').slice(1).join(' - ') : s.label
              })) || [],

             teacher_code: coord_teachers_response?.data
             ?.filter((s:any) => s.role === 'Teacher')
             .map((s:any) => ({
             value: s.value,
             label: s.label.includes(' - ') ? s.label.split(' - ').slice(1).join(' - ') : s.label
             })) || []

            }));
          }
        } catch (err) {
          
        }
      }, 500);
    }

    // 
    return () => {
      clearTimeout(timer);
      setDynamicOptions((prev:any) => ({ ...prev, coordinator_code: [], teacher_code: [] }));
      setAllStaffRows([]);
    };
  }, [selectedReport, filterValues.academic_year_id, filterValues.school_id, filterValues.brand_id, filterValues.board_id, filterValues.grade_id, filterValues.course_id, filterValues.stream_id, filterValues.shift_id, filterValues.division_id]);

  // NEW: In-memory Staff Filtering (Coordinator -> Teacher) to avoid the repeated call to backend when we select the co-ordinator we have added this
  useEffect(() => {
    if (allStaffRows.length === 0) return;
    const selectedManager = filterValues.coordinator_code;

    setDynamicOptions((prev: any) => {
      const filteredTeachers = allStaffRows
        .filter((s: any) => s.role === 'Teacher')
        .filter((s: any) => !selectedManager || s.l_1_manager_code === selectedManager) // Filter by manager if one is selected
        .map((s: any) => ({
          value: s.value,
          label: s.label.includes(' - ') ? s.label.split(' - ').slice(1).join(' - ') : s.label
        }));

      return { ...prev, teacher_code: filteredTeachers };
    });
  }, [allStaffRows, filterValues.coordinator_code]);
  
  // HOOK 2: Students to fetch the students data 
  useEffect(() => {
   // GATEKEEPER: Must have Year, School, AND Grade to fetch Students
    //const grade = filterValues.grade_id;
    const year = filterValues.academic_year_id;
    const school = filterValues.school_id;

    if (!year || (Array.isArray(year) && year.length === 0) || 
     !school || (Array.isArray(school) && school.length === 0)  ) {
     // || !grade || (Array.isArray(grade) && grade.length === 0)) {

    return;
     }

    let timer:any;

    if (selectedReport === 'student-wise') {
      timer = setTimeout(async () => {
        try {
          const queryParams = new URLSearchParams();
          Object.entries(filterValues).forEach(([key, value]:[string,any]) => {
            if (value !== undefined && value !== null && value !== '' && ['status_id','academic_year_id','school_id', 'brand_id', 'board_id', 'grade_id', 'course_id', 'stream_id', 'shift_id', 'division_id', 'terms_id', 'subject_id', 'domain_id', 'subdomain_id', 'criteria_id', 'coordinator_code', 'teacher_code'].includes(key)) {
              // FIX: Flat Metabase param format
              queryParams.append(key, value);
            }
          });

          const students_response = await getRequest({
            serviceURL: 'marketing',
            url: `marketing/report-filters/students?${queryParams.toString()}`,
          });

          if (students_response) {
            setDynamicOptions((prev:any) => ({
              ...prev,
              // FIX: Consistent key usage
               student_id: students_response?.data?.map((s:any) => ({
                value: s.value,
                label: s.label
                 })) || [] 
            }));
          }
        } catch (err) {
          
        }
      }, 500);
    }

    return () => {
      clearTimeout(timer);
      setDynamicOptions((prev:any) => ({ ...prev, student_id: [] })); // Consistent key
    };
  }, [selectedReport,filterValues.status_id, filterValues.academic_year_id, filterValues.school_id, filterValues.brand_id, filterValues.board_id, filterValues.grade_id, filterValues.course_id, filterValues.stream_id, filterValues.shift_id, filterValues.division_id, filterValues.terms_id, filterValues.subject_id, filterValues.domain_id, filterValues.subdomain_id, filterValues.criteria_id, filterValues.coordinator_code, filterValues.teacher_code]);
  // Load static options for filters that declare apiEndpoint (existing behaviour)
  useEffect(() => {
    if (!currentConfig?.filters) return

    currentConfig.filters.forEach(async (filter: FilterConfig) => {
      // Only auto-fetch when an explicit apiEndpoint exists and autoFetch is not false
      if (!filter.apiEndpoint || filter.autoFetch === false) return

      try {
        const url = {
          url: `/api/${filter.apiEndpoint}`,
          serviceURL: 'mdm',
          headers: { Authorization: `Bearer ${process.env.NEXT_PUBLIC_MDM_TOKEN}` }
        }
        const response = await getRequest(url)
        if (response?.data?.length > 0) {
          setDynamicOptions((prev: any) => ({
            ...prev,
            [filter.key]: response.data.map((item: any) => ({
              value: item.id,
              label: item.attributes?.name ?? item.attributes?.value ?? String(item.id)
            }))
          }))
        }
      } catch (error) {}
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport, currentConfig])

  useEffect(() => {
    // compute stable JSON-string deps so dependency array is static-checkable
    // (these are computed outside; the effect body uses local snapshots only)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

   // auto-select single options , this is for to implement the typical cascading behaviour that if after parent field selection child has only 1 thing in option 
   // to display then automatically select that option
   useEffect(()=>{

    if(selectedReport==='class-wise'|| selectedReport==='student-wise') {
         setFilterValues((prev: any) => {
      let isChanged = false;
      const nextFilters = { ...prev };
      // Iterate through all currently available dynamic options
      Object.keys(dynamicOptions).forEach(key => {
        if (key === 'coordinator_code' || key === 'teacher_code') {
          return; // Skip auto-selection for co-ordinator and teacher
        }
        const options = dynamicOptions[key];
        // If a dropdown has exactly 1 option, and we haven't selected it yet
        if (options && options.length === 1) {
          const singleValue = options[0].value;
          
          // Check if it's currently empty
          const currentSelection = nextFilters[key];
          const isEmpty = !currentSelection || (Array.isArray(currentSelection) && currentSelection.length === 0);
          if (isEmpty) {
            // The safest fallback for Autocomplete single select is just the raw value.
            const filterConfig = currentConfig?.filters?.find((f: any) => f.key === key);
            if (filterConfig?.type === 'multiselect') {
              nextFilters[key] = [singleValue];
            } else {
              nextFilters[key] = singleValue;
            }
            isChanged = true;
          }
        }
      });
      return isChanged ? nextFilters : prev;
    });
    }
   },[selectedReport,dynamicOptions,currentConfig])
  // compute stable deps (stringified) so we can reference them in the effect deps below
  const groupByDep = JSON.stringify(filterValues['filters'] || [])
  const clusterDep = JSON.stringify(filterValues['cluster'] || [])
  const dynOptsDep = JSON.stringify(dynamicOptions || {})

  useEffect(() => {
    // snapshot reactive objects so the effect body doesn't reference them directly
    const fv = filterValues
    const dynOpts = dynamicOptions

    const groupBySelected: string[] = fv['filters'] || []
    const selectedClusters: string[] = (fv['cluster'] || []).map(String).filter(Boolean)

    if (!groupBySelected || !groupBySelected.length) return

    // helper to build encoded query pairs
    const encodePair = (key: string, value: string) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`

    const fetchDimensionValues = async (dimKey: string) => {
      // skip re-fetch for non-school dims if already loaded
      if (dimKey !== 'school' && dynOpts[dimKey] && dynOpts[dimKey].length) return

      const mdmPath = DIMENSION_TO_MDM_ENDPOINT[dimKey]
      if (!mdmPath) {
        return
      }

      try {
        // base pagination params
        const baseParams = [encodePair('[pagination][pageSize]', '10000'), encodePair('[pagination][page]', '1')]

        let resp: any = null

        // if school and clusters selected, try server-side filtered requests
        if (dimKey === 'school') {
          if (selectedClusters.length) {
            const csv = selectedClusters.join(',')

            // try common server filter: filters[cluster_id][$in]=1,2
            const url1 = `${mdmPath}?${baseParams.join('&')}&${encodePair(`filters[cluster_id][$in]`, csv)}`
            try {
              resp = await getRequest({ url: url1, serviceURL: 'mdm' })
            } catch (err1) {}

            // if first attempt failed or returned no data, try relation form: filters[cluster][id][$in]=1,2
            if (!resp || !resp?.data) {
              const url2 = `${mdmPath}?${baseParams.join('&')}&${encodePair(`filters[cluster][id][$in]`, csv)}`
              try {
                resp = await getRequest({ url: url2, serviceURL: 'mdm' })
              } catch (err2) {}
            }

            // if still no resp (or server errored), fetch all and we'll filter client-side below
            if (!resp || !resp?.data) {
              const urlAll = `${mdmPath}?${baseParams.join('&')}`
              resp = await getRequest({ url: urlAll, serviceURL: 'mdm' })
            }
          } else {
            // no clusters selected -> fetch all schools (or skip if you prefer)
            const urlAll = `${mdmPath}?${baseParams.join('&')}`
            resp = await getRequest({ url: urlAll, serviceURL: 'mdm' })
          }
        } else {
          // non-school dims: single fetch (cached above prevents repeat)
          const url = `${mdmPath}?${baseParams.join('&')}`
          resp = await getRequest({ url, serviceURL: 'mdm' })
        }

        let items = resp?.data ?? []

        // If we fetched all schools (because server-side filter was unsupported),
        // apply client-side filtering by cluster_id when clusters are selected
        if (dimKey === 'school') {
          if (selectedClusters.length) {
            items = (items || []).filter((item: any) => {
              const clusterId =
                item.attributes?.cluster_id ?? item.cluster_id ?? item.attributes?.clusterId ?? item.clusterId ?? ''

              // only accept schools whose cluster id matches selectedClusters
              return selectedClusters.includes(String(clusterId))
            })
          }
        }

        // normalize to { value, label } and preserve stable ids when available
        const list = (items || []).map((item: any, idx: number) => {
          const label =
            item.attributes?.name ||
            item.attributes?.source ||
            item.attributes?.value ||
            item.attributes?.label ||
            item.name ||
            item.school_name ||
            String(item.id)

          const rawId = item.id ?? item.code ?? null
          const value = rawId !== null && rawId !== undefined ? String(rawId) : `${label}-${idx}`

          return { value, label }
        })

        // dedupe by value, preserve first occurrence
        const deduped = list.reduce((acc: OptionItem[], cur: OptionItem) => {
          if (!acc.some(x => String(x.value) === String(cur.value))) acc.push(cur)

          return acc
        }, [] as OptionItem[])

        // set current results (replace, do not append old school options)
        setDynamicOptions((prev: any) => ({
          ...prev,
          [dimKey]: deduped
        }))

        // if schools were fetched and user had selections that no longer exist, trim them
        if (dimKey === 'school' && Array.isArray(fv['school']) && fv['school'].length) {
          const existingVals = (fv['school'] || []).filter((v: any) =>
            deduped.some((l: any) => String(l.value) === String(v))
          )
          if (existingVals.length !== (fv['school'] || []).length) {
            setFilterValues((prev: any) => ({ ...prev, school: existingVals }))
          }
        }
      } catch (err) {}
    }

    // fetch in parallel (each dim triggers its own fetchDimensionValues)
    groupBySelected.forEach(dim => {
      fetchDimensionValues(String(dim))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupByDep, clusterDep, dynOptsDep, currentConfig])

  const handleFilterChange = (filterKey: string, value: any) => {
    if(selectedReport==='class-wise'|| selectedReport==='student-wise'){
      setFilterValues((prev: any) => {
      const next = { ...prev, [filterKey]: value };
      
      if (HIERARCHY[filterKey]) {
        HIERARCHY[filterKey].forEach(childKey => {
          delete next[childKey]; // Deleting keeps MUI in perfect sync
        });
      }
      return next;
    });
    }else{
    setFilterValues((prev: any) => ({
      ...prev,
      [filterKey]: value
    }))
  }
  }

  const handleDownloadClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const formattedFilters: any = {}

    // Basic filters provided by config (dateRange, etc.)
    currentConfig?.filters.forEach((filter: FilterConfig) => {
      const value = filterValues[filter.key]

      if (filter.type === 'dateRange' && value) {
        formattedFilters.start_date = value.startDate ? dayjs(value.startDate).format('DD-MM-YYYY') : ''
        formattedFilters.end_date = value.endDate ? dayjs(value.endDate).format('DD-MM-YYYY') : ''
      } else if (filter.type === 'date' && value) {
        formattedFilters[filter.key] = dayjs(value).format('DD-MM-YYYY')
      } else if (value !== undefined && value !== null && value !== '') {
        // For multiselect group_by, keep as an array here — caller will normalize
        formattedFilters[filter.key] = value
      }
    })

    // include per-dimension selected values in payload
    const selectedGroupBy: string[] = filterValues['filters'] || []
    selectedGroupBy.forEach(dim => {
      const selectedValues = filterValues[dim] // we store per-dimension selections in filterValues[dim]
      if (selectedValues && Array.isArray(selectedValues) && selectedValues.length) {
        formattedFilters[dim] = selectedValues
      }
    })

    // Debug

    await onDownload(selectedReport, formattedFilters)
    handleReset()
    onClose()
  }

  const handleReset = () => {
    setSelectedReport('')
    setFilterValues({})
    setDynamicOptions({})
    setAllSchoolRows([])
    setAllMappingRows([])
    setAllStaffRows([])
    setSubjectNameMap(new Map())
    setInputValues({})
  }

  const handleCancel = () => {
    handleReset()
    onClose()
  }

  const isDownloadDisabled = () => {
    if (!selectedReport) return true

    if (currentConfig?.filters) {
      return currentConfig.filters.some((filter: FilterConfig) => {
        if (!filter.required) return false

        const value = filterValues[filter.key]

        if (filter.type === 'dateRange') {
          return !value?.startDate || !value?.endDate
        }
         
        // as for class-wise and student-wise reports we have status field which has active and inactive fields and maped with 0 and 1 to prevent
        // false disable due to 0, I have updated the code

        return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
      })
    }

    return false
  }

  const getParentKey = (key: string) => {
    const idx = FULL_HIERARCHY.indexOf(key);
    if (idx > 0) return FULL_HIERARCHY[idx - 1];
    return null;
  }

  const renderFilter = (filter: FilterConfig) => {
    const value = filterValues[filter.key]

    const parentKey = getParentKey(filter.key);
    const parentVal = parentKey ? filterValues[parentKey] : null;
    const isDisabled = parentKey 
      ? (parentVal === undefined || parentVal === null || parentVal === '' || (Array.isArray(parentVal) && parentVal.length === 0))
      : false;


    switch (filter.type) {
      case 'text':
        return (
          <TextField
            key={filter.key}
            fullWidth
            label={filter.label}
            placeholder={filter.placeholder}
            value={value || ''}
            onChange={e => handleFilterChange(filter.key, e.target.value)}
            required={filter.required}
          />
        )

      case 'select': {
       if (selectedReport === 'class-wise' || selectedReport === 'student-wise') {
  let customSelectOptions: any[] = [];
  const isAcademicField = ['subject_id', 'terms_id', 'domain_id', 'subdomain_id', 'criteria_id'].includes(filter.key);

  if (isAcademicField) {
    // FIX 1: Safely check for single-select values (no .length check needed for numbers/strings)
    const val = filterValues['school_id'];
    const hasSchoolSelected = val !== undefined && val !== null && val !== '';
    
    // FIX 2: Tell the UI that 'subject_id' and 'terms_id' do NOT need mappings to be loaded!
    const isMappingLoaded = allMappingRows.length > 0 || filter.key === 'terms_id' || filter.key === 'subject_id';
    
    if (hasSchoolSelected && isMappingLoaded) {
      customSelectOptions = dynamicOptions[filter.key] || [];
    } else {
      customSelectOptions = [];
    }
  } else if (filter.key in CASCADING_MAP) {
    customSelectOptions = dynamicOptions[filter.key] || [];
  } else {
    customSelectOptions = filter.options || [];
  }

  // Calculate disabled state (if not already defined higher up in renderFilter)
  // Ensures strictly top-down selection
  const isAutocompleteDisabled = isDisabled || (filter.key !== 'academic_year_id' && filter.key !== 'school_id' && customSelectOptions.length === 0);

  return (
    <Autocomplete
      key={filter.key}
      multiple={false} // Single select mode
      options={customSelectOptions}
      disabled={isAutocompleteDisabled}
      getOptionLabel={(option: any) => option.label || ''}
      isOptionEqualToValue={(opt: any, val: any) => String(opt.value) === String(val?.value || val)}
      
      // Autocomplete needs the full object or null to display correctly
      value={customSelectOptions.find((opt: any) => String(opt.value) === String(value)) || null}
      
      // Control inputValue so search text clears after selection
      inputValue={inputValues[filter.key] ?? ''}
      onInputChange={(_, newInputValue) => {
        // 'reset' fires when MUI syncs input with selected value — let it pass through
        setInputValues(prev => ({ ...prev, [filter.key]: newInputValue }));
      }}
      
      onChange={(_, newValue) => {
        handleFilterChange(filter.key, newValue ? newValue.value : '');
        // Clear search text after selection so user can search again
        setInputValues(prev => ({ ...prev, [filter.key]: newValue?.label ?? '' }));
      }}
      renderInput={params => (
        <TextField 
          {...params} 
          label={filter.label} 
          placeholder={filter.placeholder} 
          required={filter.required} 
          fullWidth 
          disabled={isDisabled} 
        />
      )}
      ListboxProps={{ style: { maxHeight: 300, background: '#fff' } }}
      
      // Wrap long text within the dropdown options
      renderOption={(props, option) => (
        <li {...props} key={String(option.value)} style={{ wordWrap: 'break-word', whiteSpace: 'normal', padding: '8px' }}>
          {option.label}
        </li>
      )}
      sx={{ width: '100%' }}
    />
     );
       }

        const selectOptions = filter.options || dynamicOptions[filter.key] || []

        return (
          <FormControl key={filter.key} fullWidth required={filter.required}>
            <InputLabel>{filter.label}</InputLabel>
            <Select
              value={value || ''}
              label={filter.label}
              onChange={e => handleFilterChange(filter.key, e.target.value)}
            >
              {selectOptions.map((option: any) => (
                <MenuItem key={String(option.value)} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      }

      case 'multiselect': {

        if (selectedReport === 'class-wise' || selectedReport === 'student-wise') {
          let customMultiOptions: any[] = [];
          
          const isAcademicField = ['subject_id', 'terms_id', 'domain_id', 'subdomain_id', 'criteria_id'].includes(filter.key);
          
          if (isAcademicField) {
            const schoolVal = filterValues['school_id'];
            const hasSchoolSelected = schoolVal !== undefined && schoolVal !== null && schoolVal !== '' && (!Array.isArray(schoolVal) || schoolVal.length > 0);
            const isMappingLoaded = allMappingRows.length > 0 || filter.key === 'terms_id';
            
            // GATEKEEPER: Only show options if a school is selected AND the mapping data is loaded
            if (hasSchoolSelected && isMappingLoaded) {
              customMultiOptions = dynamicOptions[filter.key] || [];
            } else {
              customMultiOptions = [];
            }
          } 
          else if (filter.key in CASCADING_MAP) {
            customMultiOptions = dynamicOptions[filter.key] || [];
          } 
          else {
            customMultiOptions = filter.options || [];
          }

          const isMultiDisabled = isDisabled || (filter.key !== 'academic_year_id' && filter.key !== 'school_id' && customMultiOptions.length === 0);

          return (
            <Autocomplete
              key={filter.key}
              multiple
              disabled={isMultiDisabled}
              disableCloseOnSelect // Keep dropdown open for multi-select
              options={customMultiOptions}
              getOptionLabel={(option: any) => option.label || ''}
              isOptionEqualToValue={(opt: any, val: any) => String(opt.value) === String(val.value)}
              
              // Filter the options array based on the selected values array
              value={customMultiOptions.filter((opt: any) => (value || []).includes(opt.value))}
              
              // Fix: clear the search text after each selection so user can keep searching
              inputValue={inputValues[filter.key] ?? ''}
              onInputChange={(_, newInputValue, reason) => {
                if (reason === 'input') {
                  // Only track user-typed text; ignore MUI resets on selection
                  setInputValues(prev => ({ ...prev, [filter.key]: newInputValue }));
                } else if (reason === 'clear') {
                  setInputValues(prev => ({ ...prev, [filter.key]: '' }));
                }
                // reason === 'reset' (fires after selection) → do nothing: keeps input at '' naturally
              }}
              
              onChange={(_, newValue) => {
                handleFilterChange(filter.key, newValue.map((v: any) => v.value));
                // Clear search text so user can immediately type and search for the next item
                setInputValues(prev => ({ ...prev, [filter.key]: '' }));
              }}
              
              // Handle chip rendering (showing a max of 6 before truncating)
              renderTags={(tagValue: any[], getTagProps) => {
                const MAX = 6
                if (tagValue.length <= MAX) {
                  return tagValue.map((option, index) => (
                    <Chip {...getTagProps({ index })} key={String(option.value)} label={option.label} size='small' sx={{ maxWidth: 160, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', mr: 0.5, mt: 0.5 }} />
                  ))
                }
                const shown = tagValue.slice(0, MAX)
                const hiddenCount = tagValue.length - MAX
                return (
                  <>
                    {shown.map((option, index) => (
                      <Chip {...getTagProps({ index })} key={String(option.value)} label={option.label} size='small' sx={{ maxWidth: 160, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', mr: 0.5, mt: 0.5 }} />
                    ))}
                    <Chip label={`+${hiddenCount} more`} size='small' sx={{ mr: 0.5, mt: 0.5 }} />
                  </>
                )
              }}
              renderInput={params => <TextField {...params} label={filter.label} placeholder={filter.placeholder} required={filter.required} fullWidth disabled={isDisabled} />}
              ListboxProps={{ style: { maxHeight: 300, background: '#fff' } }}
              
              // Wrap long text and include checkbox
              renderOption={(props, option, { selected }) => (
                <li {...props} key={String(option.value)} style={{ wordWrap: 'break-word', whiteSpace: 'normal', padding: '8px' }}>
                  <Checkbox checked={selected} style={{ marginRight: 8 }} size='small' />
                  {option.label}
                </li>
              )}
              sx={{ width: '100%', '& .MuiAutocomplete-inputRoot': { flexWrap: 'wrap' } }}
            />
          );
        }
        
        const multiOptions = filter.options || dynamicOptions[filter.key] || []

        return (
          <Autocomplete
            key={filter.key}
            multiple
            options={multiOptions}
            getOptionLabel={(option: any) => option.label}
            // ensure MUI compares by value (not label)
            isOptionEqualToValue={(opt: any, val: any) => String(opt.value) === String(val.value)}
            value={multiOptions.filter((opt: any) => (value || []).includes(opt.value))}
            onChange={(_, newValue) =>
              handleFilterChange(
                filter.key,
                newValue.map((v: any) => v.value)
              )
            }
            // === Make chips wrap & truncate long labels ===
            renderTags={(tagValue: any[], getTagProps) =>
              tagValue.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={String(option.value)}
                  label={option.label}
                  size='small'
                  sx={{
                    maxWidth: 120,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    mr: 0.5,
                    mt: 0.5
                  }}
                />
              ))
            }
            renderInput={params => (
              <TextField
                {...params}
                label={filter.label}
                placeholder={filter.placeholder}
                required={filter.required}
                fullWidth
              />
            )}
            // set explicit renderOption so React key uses option.value
            renderOption={(props, option) => (
              <li {...props} key={String(option.value)}>
                <Checkbox checked={(value || []).indexOf(option.value) > -1} style={{ marginRight: 8 }} size='small' />
                {option.label}
              </li>
            )}
            sx={{ width: '100%' }}
          />
        )
      }

      case 'date':
        return (
          <LocalizationProvider key={filter.key} dateAdapter={AdapterDayjs}>
            <DatePicker
              label={filter.label}
              value={value || null}
              onChange={newValue => handleFilterChange(filter.key, newValue)}
              format='DD-MM-YYYY'
              slots={{ openPickerIcon: CalendarIcon }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: filter.required
                },
                popper: {
                  disablePortal: false,
                  placement: 'auto'
                },
                desktopPaper: {
                  sx: {
                    zIndex: 1301
                  }
                }
              }}
            />
          </LocalizationProvider>
        )

      case 'dateRange':
        return (
          <Box key={filter.key}>
            <Typography variant='subtitle2' color='text.primary' sx={{ fontWeight: 500, mb: 2 }}>
              {filter.label} {filter.required && <span style={{ color: 'red' }}>*</span>}
            </Typography>
            <Stack spacing={2}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='Start Date'
                  value={value?.startDate || null}
                  onChange={newValue => handleFilterChange(filter.key, { ...value, startDate: newValue })}
                  format='DD-MM-YYYY'
                  slots={{ openPickerIcon: CalendarIcon }}
                  slotProps={{
                    textField: { fullWidth: true },
                    popper: {
                      disablePortal: true,
                      placement: 'auto'
                    },
                    desktopPaper: {
                      sx: {
                        zIndex: 1301
                      }
                    }
                  }}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label='End Date'
                  value={value?.endDate || null}
                  onChange={newValue => handleFilterChange(filter.key, { ...value, endDate: newValue })}
                  minDate={value?.startDate ? dayjs(value.startDate) : undefined}
                  format='DD-MM-YYYY'
                  slots={{ openPickerIcon: CalendarIcon }}
                  slotProps={{
                    textField: { fullWidth: true },
                    popper: {
                      disablePortal: true,
                      placement: 'auto'
                    }
                  }}
                />
              </LocalizationProvider>
            </Stack>
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <Drawer
      anchor='right'
      open={isOpen}
      onClose={handleCancel}
      sx={{ '.MuiDrawer-paper': { maxWidth: '500px', minWidth: '500px' } }}
    >
      <Box sx={{ p: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Stack direction='row' justifyContent='space-between' alignItems='center' spacing={2}>
          <Typography
            color={'customColors.mainText'}
            style={{ lineHeight: '30px', fontWeight: 500 }}
            sx={{ p: 2 }}
            variant='h6'
          >
            Download Report
          </Typography>
          <Button style={{ color: '#666' }} onClick={handleReset}>
            Reset
          </Button>
        </Stack>

        <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: 2, overflow: 'visible' }}>
          <Box sx={{ maxHeight: 'calc(100vh - 150px)', overflow: 'auto', overflowX: 'hidden' }}>
            <Card
              variant='outlined'
              style={{
                borderColor: '#e0e0e0',
                backgroundColor: '#fff',
                padding: '20px',
                marginBottom: '16px',
                overflow: 'visible'
              }}
            >
              <Stack spacing={3}>
                <FormControl fullWidth>
                  <InputLabel id='report-type-label'>Select Report Type</InputLabel>
                  <Select
                    labelId='report-type-label'
                    value={selectedReport}
                    label='Select Report Type'
                    onChange={handleReportChange}
                  >
                    {reportConfigs.map(report => (
                      <MenuItem key={report.value} value={report.value}>
                        {report.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Render the configured filters (dateRange, group_by multiselect, etc.) */}
                {currentConfig?.filters.map((filter: FilterConfig) => renderFilter(filter))}
                {/* Per-dimension selectors (stacked, full width) */}
                {(filterValues['filters'] || []).map((dim: string) => (
                  <Box key={`values-${dim}`} sx={{ mb: 2, width: '100%', display: 'block' }}>
                    <Typography
                      variant='subtitle2'
                      sx={{
                        mb: 1,
                        textTransform: 'capitalize',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{`Select ${dim} values (optional)`}</span>
                      <small style={{ color: '#666' }}>{(dynamicOptions[dim]?.length ?? 0) + ' entries found'}</small>
                    </Typography>

                    <Autocomplete
                      multiple
                      options={dynamicOptions[dim] || []}
                      getOptionLabel={(opt: any) => opt.label}
                      isOptionEqualToValue={(opt: any, val: any) => String(opt.value) === String(val.value)}
                      value={(dynamicOptions[dim] || []).filter((opt: any) =>
                        (filterValues[dim] || []).includes(opt.value)
                      )}
                      onChange={(_, newValue) => {
                        handleFilterChange(
                          dim,
                          newValue.map((v: any) => v.value)
                        )
                      }}
                      renderTags={(tagValue: any[], getTagProps) => {
                        const MAX = 6
                        if (tagValue.length <= MAX) {
                          return tagValue.map((option, index) => (
                            <Chip
                              {...getTagProps({ index })}
                              key={String(option.value)}
                              label={option.label}
                              size='small'
                              sx={{
                                maxWidth: 160,
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                mr: 0.5,
                                mt: 0.5
                              }}
                            />
                          ))
                        }

                        const shown = tagValue.slice(0, MAX)
                        const hiddenCount = tagValue.length - MAX

                        // show first N chips then a "+X more" chip

                        return (
                          <>
                            {shown.map((option, index) => (
                              <Chip
                                {...getTagProps({ index })}
                                key={String(option.value)}
                                label={option.label}
                                size='small'
                                sx={{
                                  maxWidth: 160,
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  overflow: 'hidden',
                                  mr: 0.5,
                                  mt: 0.5
                                }}
                              />
                            ))}
                            <Chip label={`+${hiddenCount} more`} size='small' sx={{ mr: 0.5, mt: 0.5 }} />
                          </>
                        )
                      }}
                      renderInput={params => (
                        <TextField {...params} placeholder={`Pick ${dim} values`} variant='outlined' fullWidth />
                      )}
                      sx={{
                        width: '100%',
                        '& .MuiAutocomplete-inputRoot': {
                          flexWrap: 'wrap'
                        }
                      }}
                      // PopperProps={{
                      //   style: { zIndex: 9999, minWidth: 220 },
                      //   strategy: 'fixed',
                      //   modifiers: [
                      //     { name: 'preventOverflow', options: { altBoundary: true, rootBoundary: 'viewport', padding: 8 } },
                      //     { name: 'flip', options: { fallbackPlacements: ['bottom', 'top'] } },
                      //     { name: 'computeStyles', options: { adaptive: false } }
                      //   ]
                      // }}
                      PaperComponent={props => (
                        <div
                          {...props}
                          style={{ maxHeight: 300, overflow: 'auto', minWidth: 220, background: '#fff' }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={String(option.value)}>
                          {option.label}
                        </li>
                      )}
                    />
                  </Box>
                ))}

                {selectedReport && currentConfig && (
                  <Box
                    sx={{
                      backgroundColor: '#f5f5f5',
                      padding: '12px',
                      borderRadius: '8px',
                      mt: 2
                    }}
                  >
                    <Typography variant='body2' color='text.secondary'>
                      {currentConfig.description}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Card>
          </Box>
        </Box>

        <Stack direction='row' justifyContent='end' spacing={2} mt={2} sx={{ alignSelf: 'flex-end' }}>
          <Button variant='outlined' color='inherit' onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant='contained'
            disabled={isDownloadDisabled()}
            onClick={handleDownloadClick}
            type='button'
            startIcon={<span className='icon-download'></span>}
          >
            Download
          </Button>
        </Stack>
      </Box>
    </Drawer>
  )
}
