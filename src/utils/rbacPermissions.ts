/**
 * Marketing FE – RBAC Permission Map
 *
 * Maps frontend route paths to the backend permission keys required to access them.
 * Used by PermissionGuard to gate access to pages.
 *
 * Permission key naming convention: <module>_<method>_<resource>
 *
 * Modules covered:
 *  _ Enquiry API
 *  _ Admission API
 *  _ School Visit API
 *  _ Workflow API
 *  _ Registration API
 *  _ Reports API
 */

export interface RbacPermission {
  path: string;
  service: string;
  permissions: string[];
}

export const rbacPermissions: RbacPermission[] = [
  // ─────────────────────────────────────────────────────────────
  // ENQUIRY MODULE
  // ─────────────────────────────────────────────────────────────
  {
    path: '/enquiry/create',
    service: 'enquiry',
    permissions: ['enquiry_post_create'],
  },
  {
    path: '/enquiry/list',
    service: 'enquiry',
    permissions: ['enquiry_cc_list'],
  },
  {
    path: '/enquiry/global-search',
    service: 'enquiry',
    permissions: ['enquiry_list_global_search'],
  },
  {
    path: '/enquiry/[enquiryId]',
    service: 'enquiry',
    permissions: ['enquiry_get_enquiryId'],
  },
  {
    path: '/enquiry/[enquiryId]/edit',
    service: 'enquiry',
    permissions: ['enquiry_patch_enquiryId'],
  },
  {
    path: '/enquiry/[enquiryId]/timeline',
    service: 'enquiry',
    permissions: ['enquiry_get_enquiryId_timeline'],
  },
  {
    path: '/enquiry/[enquiryId]/documents',
    service: 'enquiry',
    permissions: [
      'enquiry_get_enquiryId_document_documentId',
      'enquiry_enquiryId_upload_document_documentId',
    ],
  },
  {
    path: '/enquiry/[enquiryId]/parent-details',
    service: 'enquiry',
    permissions: ['enquiry_enquiryId_parent_details'],
  },
  {
    path: '/enquiry/[enquiryId]/contact-details',
    service: 'enquiry',
    permissions: ['enquiry_enquiryId_contact_details'],
  },
  {
    path: '/enquiry/[enquiryId]/medical-details',
    service: 'enquiry',
    permissions: ['enquiry_enquiryId_medical_details'],
  },
  {
    path: '/enquiry/[enquiryId]/bank-details',
    service: 'enquiry',
    permissions: ['enquiry_enquiryId_bank_details'],
  },
  {
    path: '/enquiry/[enquiryId]/similar-enquiries',
    service: 'enquiry',
    permissions: ['enquiry_get_enquiryId_similar_enquiries'],
  },
  {
    path: '/enquiry/[enquiryId]/merge',
    service: 'enquiry',
    permissions: [
      'enquiry_merge_targetEnquiryId',
      'enquiry_post_enquiryId_merge_enquiry_details',
      'enquiry_get_enquiryId_merge_enquiry_details',
    ],
  },
  {
    path: '/enquiry/[enquiryId]/transfer',
    service: 'enquiry',
    permissions: [
      'enquiry_patch_transfer',
      'enquiry_get_enquiryId_transfer_enquiry_details',
    ],
  },
  {
    path: '/enquiry/[enquiryId]/reassign',
    service: 'enquiry',
    permissions: [
      'enquiry_patch_reassign',
      'enquiry_post_reassign',
      'enquiry_get_enquiryId_reassign_enquiry_details',
    ],
  },
  {
    path: '/enquiry/[enquiryId]/reopen',
    service: 'enquiry',
    permissions: ['enquiry_patch_reopen'],
  },
  {
    path: '/enquiry/[enquiryId]/status',
    service: 'enquiry',
    permissions: ['enquiry_patch_enquiryId_status'],
  },
  {
    path: '/enquiry/[enquiryId]/move-to-next-stage',
    service: 'enquiry',
    permissions: ['enquiry_enquiryId_move_to_next_stage'],
  },
  {
    path: '/enquiry/ivt/create',
    service: 'enquiry',
    permissions: ['enquiry_createIvtEnquiry'],
  },
  {
    path: '/enquiry/validate-guardian',
    service: 'enquiry',
    permissions: [
      'enquiry_map_correct_guardian',
      'enquiry_validate_child_parent',
    ],
  },
  {
    path: '/enquiry/validate-sibling',
    service: 'enquiry',
    permissions: ['enquiry_map_correct_sibling'],
  },

  // ─────────────────────────────────────────────────────────────
  // ADMISSION MODULE
  // ─────────────────────────────────────────────────────────────
  {
    path: '/admission/[enquiryId]/create',
    service: 'admission',
    permissions: ['admission_enquiryId_create'],
  },
  {
    path: '/admission/[enquiryId]',
    service: 'admission',
    permissions: ['admission_get_enquiryId'],
  },
  {
    path: '/admission/[enquiryId]/edit',
    service: 'admission',
    permissions: ['admission_patch_enquiryId'],
  },
  {
    path: '/admission/[enquiryId]/subject-details',
    service: 'admission',
    permissions: ['admission_enquiryId_subject_details'],
  },
  {
    path: '/admission/[enquiryId]/vas',
    service: 'admission',
    permissions: [
      'admission_enquiryId_vas_add',
      'admission_enquiryId_vas_remove',
    ],
  },
  {
    path: '/admission/[enrolmentNumber]/student-details',
    service: 'admission',
    permissions: ['admission_enrolmentNumber_student_details'],
  },
  {
    path: '/admission/approval-status',
    service: 'admission',
    permissions: ['admission_update_approval_status'],
  },

  // ─────────────────────────────────────────────────────────────
  // SCHOOL VISIT MODULE
  // ─────────────────────────────────────────────────────────────
  {
    path: '/school-visit/slots',
    service: 'school-visit',
    permissions: ['school_get_visit_slots'],
  },
  {
    path: '/school-visit/unavailable',
    service: 'school-visit',
    permissions: [
      'school_visit_post_unavailable_add',
      'school_visit_post_unavailable_available_slot_list',
    ],
  },
  {
    path: '/school-visit/[enquiryId]/schedule',
    service: 'school-visit',
    permissions: ['school_visit_post_enquiryId_schedule'],
  },
  {
    path: '/school-visit/[enquiryId]/cancel',
    service: 'school-visit',
    permissions: ['school_visit_post_enquiryId_cancel'],
  },
  {
    path: '/school-visit/[enquiryId]/complete',
    service: 'school-visit',
    permissions: ['school_visit_post_enquiryId_complete'],
  },
  {
    path: '/school-visit/[enquiryId]/reschedule',
    service: 'school-visit',
    permissions: ['school_visit_post_enquiryId_reschedule'],
  },

  // ─────────────────────────────────────────────────────────────
  // WORKFLOW MODULE
  // (shares permission keys with School Visit — no separate keys needed)
  // ─────────────────────────────────────────────────────────────
  {
    path: '/workflow/slots',
    service: 'workflow',
    permissions: ['school_get_visit_slots'],
  },
  {
    path: '/workflow/unavailable',
    service: 'workflow',
    permissions: ['school_visit_post_unavailable_add'],
  },

  // ─────────────────────────────────────────────────────────────
  // REGISTRATION MODULE
  // ─────────────────────────────────────────────────────────────
  {
    path: '/registration/list',
    service: 'registration',
    permissions: ['enquiry_post_registration_list'],
  },
  {
    path: '/registration/global-search',
    service: 'registration',
    permissions: ['enquiry_get_registration_list_global_search'],
  },

  // ─────────────────────────────────────────────────────────────
  // REPORTS MODULE
  // (sourced from enquiry API — AY_level report routes)
  // ─────────────────────────────────────────────────────────────
  {
    path: '/reports/enquiry',
    service: 'reports',
    permissions: ['enquiry_ay_enquiry_report'],
  },
  {
    path: '/reports/admission',
    service: 'reports',
    permissions: ['enquiry_get_ay_admission_enquiry_report'],
  },
  {
    path: '/reports/appointment',
    service: 'reports',
    permissions: [
      'enquiry_get_ay_appointment_report',
      'enquiry_appointment_report', // admission module path variant
    ],
  },
  {
    path: '/reports/source-wise-conversion',
    service: 'reports',
    permissions: ['enquiry_get_ay_source_wise_conversion_report'],
  },
];
