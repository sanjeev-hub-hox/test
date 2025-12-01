import * as dotenv from 'dotenv';
dotenv.config();

export const APPLICATION_ID = 1;
export const SERVICE_NAME = 'admin_service';
export const apiResponse = {};
export const constants = {
  SWAGGER_API_ROOT: 'api-docs',
  SWAGGER_API_NAME: 'Notification And Reminder APIs',
  SWAGGER_API_BASE_PATH: '',
  SWAGGER_API_DESCRIPTION:
    'This documentation includes the CRUD operations related to notifications and reminders and other APIs related to notification portals',
  SWAGGER_API_CURRENT_VERSION: '1.0.0'
};

export const chunkArray = (array: any[], size: number): any[][] => {
  const chunks: any[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const ID_SIZE = 6;

export const PORTALS = [
  {
    id: 1,
    name: 'Academics',
    icon: 'academics_icon.png',
    image: 'academics_image.png',
    isActive: true,
    orderNo: 1,
    url: 'http://academics.ampersand.com'
  },
  {
    id: 2,
    name: 'Marketing',
    icon: 'marketing_icon.png',
    image: 'marketing_image.png',
    isActive: true,
    orderNo: 1,
    url: 'http://marketing.ampersand.com'
  },
  {
    id: 3,
    name: 'Transport',
    icon: 'transport_icon.png',
    image: 'transport_image.png',
    isActive: true,
    orderNo: 1,
    url: 'http://transport.ampersand.com'
  }
];

export const DELIVERY_STATUS = {
  PENDING: 'Pending',
  SUCCESS: 'Success',
  FAILED: 'Failed'
};

export const CRON_TIME = '10:00';

export const EMAIL_CONFIG = {
  CC: ['testcc@testers.com'],
  BCC: ['testbcc@testers.com']
};

export const SEND_NOTIFICATION_CHANNELS = ['In-app', 'Email', 'SMS', 'Whatsapp'];

export const SEND_NOTIFICATION_CHANNELS_WITH_TEMPLATE_SLUG = ['Email', 'SMS'];

export const SEND_NOTIFICATION_CHANNELS_WITHOUT_TEMPLATE_SLUG = ['In-app', 'Whatsapp'];

export const TEMPLATE_CONFIG = {
  template_types: [
    {
      value: 'Notification',
      display_name: 'Notification'
    },
    {
      value: 'Reminder',
      display_name: 'Reminder'
    }
  ],
  template_channels: [
    {
      value: 'In-app',
      display_name: 'In-app'
    },
    {
      value: 'Email',
      display_name: 'Email'
    },
    {
      value: 'SMS',
      display_name: 'SMS'
    },
    {
      value: 'Whatsapp',
      display_name: 'Whatsapp'
    }
  ]
};

export const AUTH_ACTIVE = true;
export const MDM_API_URLS = {
  // GRADE: '/api/ac-grades',
  // BOARD: '/api/ac-boards',
  // SCHOOL: '/api/ac-schools',
  // ACADEMIC_YEAR: '/api/ac-academic-years',
  // GENDER: '/api/genders',
  // OCCUPATION: '/api/occupations',
  // COUNTRY: '/api/countries',
  // STATE: '/api/states',
  // CITY: '/api/cities',
  // BLOOD_GROUP: '/api/blood-groups',
  // GLOBAL_USER: '/api/co-global-users/register',
  // STREAM: '/api/ac-streams',
  // SHIFT: '/api/ac-shifts',
  // GLOBAL_ID_GENERATOR: (id: number) =>
  //   `/api/global-number-generators/${id}/generator`,
  RBAC_USER_PERMISSION: '/api/rbac-role-permissions/role-permissions-for-user',
  EXTERNAL_USER_PERMISSION: '/api/rbac-role-permissions/role-permissions-for-external'
  // REGISTRATION_FEE_CREATE_REQUEST: '',
  // HR_EMPLOYEE_MASTER: '/api/hr-employee-masters',
  // BRAND: '/api/ac-brands',
};

export const RETRY_THRESHOLD = 3;
export const IN_TO_OUT_TYPE = 1; // Announcement
export const OUT_TO_IN_TYPE = 2; // PSR
export const IN_TO_IN_TYPE = 3; // ISR
export const TICKET_TOKEN =
  'daab45fc5eeed66cf456080a8300a68ca564b924891e154f5f36c80438873b6e70932225dac1bdf9e9e60e82bba5edbf4130ddcf9722ed148d5952a5bb059a514375393817e57c43d97a85dfca549a53a61e080f3eb57d18bf4555bee35b71d19e591649c45b2c2d93018930d9cab082a9a85bb888ab0aed2ccb9f1119e53933';

export const MDM_URL = `${process.env.MDM_BASE_URL}/api`;
export const PSR_TICKET_GENERATION_URL = MDM_URL + '/global-number-generators/ticket_psr/generator';
export const ISR_TICKET_GENERATION_URL = MDM_URL + '/global-number-generators/ticket_isr/generator';
export const EMPLOYEE_DETAILS = MDM_URL + '/hr-employee-masters';
export const USER_DETAILS = MDM_URL + '/co-global-users';
export const STUDENT_USER_DETAILS = MDM_URL + '/co-global-users/by-student-ids';
export const STUDENT_DETAILS = MDM_URL + '/ac-students';
export const COMMUNICATION_CATEGORY = MDM_URL + '/msg-categories';
export const COMMUNICATION_SUB_CATEGORY = MDM_URL + '/msg-sub-categories';
export const COMMUNICATION_SUB_TYPE = MDM_URL + '/msg-communication-sub-types';
export const COMMUNICATION_SUB_SUB_TYPE = MDM_URL + '/msg-communication-sub-sub-types';
export const COMMUNICATION_PRIORITY = MDM_URL + '/msg-priorities';
export const COMMUNICATION_GROUP = MDM_URL + '/msg-groups';
export const COMMUNICATION_GROUP_EMPLOYEE = MDM_URL + '/msg-groups/get-user';
export const RBAC_USER_PERMISSION = MDM_URL + '/rbac-role-permissions/role-permissions-for-user';
export const HRIS_MASTER = MDM_URL + '/hr-hris-masters';
export const WORKFLOW = MDM_URL + '/co-workflows';
export const HR_EMPLOYEE_MASTER = MDM_URL + '/hr-employee-masters';
export const SEGMENT_LOB = MDM_URL + '/segment-lobs';
export const SCHOOL = MDM_URL + '/ac-schools';
export const WORKFLOW_INIT = `${process.env.ADMIN_BASE_URL}/admin/workflow/logs`;
export const ACADEMICS_WORKLOAD = `${process.env.ACADEMICS_BASE_URL}/employeeDetail/workload-allocation/list`;
export const AC_STUDENTS = MDM_URL + '/ac-students/search-student';
export const SIBLING_LIST = `${MDM_URL}/ac-students/list-siblings`;
export const RBAC_ROLE_PERMISSIONS = `${MDM_URL}/rbac-role-permissions/role-permissions-for-user`;

export const NOTIFICATION_LIST_TYPE = {
  active: 'active',
  all_today: 'all-today',
  read_today: 'read-today',
  unread_today: 'unread-today',
  all_this_week: 'all-this_week',
  read_this_week: 'read-this_week',
  unread_this_week: 'unread-this_week'
};

export const ANNOUNCEMENT_ID = '67b6d34d6f289a31d8f832d7';

export const ADMIN_EMAIL_LIST = ['ps10@vgos.org'];

export const ADMIN_PERMISSIONS = ['create', 'view', 'edit', 'delete'];
