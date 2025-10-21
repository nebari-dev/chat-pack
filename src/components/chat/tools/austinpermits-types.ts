export const ApplicantColumns = [
  "full_name",
  "organization",
  "phone",
  "address_1",
  "address_2",
  "city",
  "zip",
  "applicant_id",
] as const;

export type ApplicantColumn = typeof ApplicantColumns[number];

export interface ApplicantRow {
  full_name: string | null;
  organization: string | null;
  phone: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  zip: string | null;
  applicant_id: number | null;
}

export const ConstructionPermitColumns = [
  "permit_type",
  "permit_type_desc",
  "permit_num",
  "permit_class_mapped",
  "permit_class",
  "work_class",
  "condominium",
  "project_name",
  "description",
  "tcad_id",
  "property_legal_description",
  "applied_date",
  "issued_date",
  "day_issued",
  "calendar_year_issued",
  "fiscal_year_issued",
  "issued_in_last_30_days",
  "issuance_method",
  "status_current",
  "status_date",
  "expires_date",
  "completed_date",
  "total_existing_bldg_sqft",
  "remodel_repair_sqft",
  "total_new_add_sqft",
  "total_valuation_remodel",
  "total_job_valuation",
  "number_of_floors",
  "housing_units",
  "building_valuation",
  "building_valuation_remodel",
  "electrical_valuation",
  "electrical_valuation_remodel",
  "mechanical_valuation",
  "mechanical_valuation_remodel",
  "plumbing_valuation",
  "plumbing_valuation_remodel",
  "medgas_valuation",
  "medgas_valuation_remodel",
  "original_address_1",
  "original_city",
  "original_state",
  "original_zip",
  "council_district",
  "jurisdiction",
  "link",
  "project_id",
  "master_permit_num",
  "latitude",
  "longitude",
  "location",
  "certificate_of_occupancy",
  "total_lot_sqft",
  "contractor_id",
  "applicant_id",
] as const;

export type ConstructionPermitColumn = typeof ConstructionPermitColumns[number];

export interface ConstructionPermitRow {
  permit_type: string | null;
  permit_type_desc: string | null;
  permit_num: string | null;
  permit_class_mapped: string | null;
  permit_class: string | null;
  work_class: string | null;
  condominium: boolean | null;
  project_name: string | null;
  description: string | null;
  tcad_id: string | null;
  property_legal_description: string | null;
  applied_date: string | null; 
  issued_date: string | null; 
  day_issued: string | null;
  calendar_year_issued: number | null;
  fiscal_year_issued: number | null;
  issued_in_last_30_days: boolean | null;
  issuance_method: string | null;
  status_current: string | null;
  status_date: string | null; 
  expires_date: string | null; 
  completed_date: string | null; 
  total_existing_bldg_sqft: number | null;
  remodel_repair_sqft: number | null;
  total_new_add_sqft: number | null;
  total_valuation_remodel: number | null;
  total_job_valuation: number | null;
  number_of_floors: number | null;
  housing_units: number | null;
  building_valuation: number | null;
  building_valuation_remodel: number | null;
  electrical_valuation: number | null;
  electrical_valuation_remodel: number | null;
  mechanical_valuation: number | null;
  mechanical_valuation_remodel: number | null;
  plumbing_valuation: number | null;
  plumbing_valuation_remodel: number | null;
  medgas_valuation: number | null;
  medgas_valuation_remodel: number | null;
  original_address_1: string | null;
  original_city: string | null;
  original_state: string | null;
  original_zip: number | null;
  council_district: number | null;
  jurisdiction: string | null;
  link: string | null;
  project_id: number | null;
  master_permit_num: number | null;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  certificate_of_occupancy: boolean | null;
  total_lot_sqft: number | null;
  contractor_id: number | null;
  applicant_id: number | null;
}

export const ContractorColumns = [
  "trade",
  "company_name",
  "full_name",
  "phone",
  "address_1",
  "address_2",
  "city",
  "zip",
  "contractor_id",
] as const;

export type ContractorColumn = typeof ContractorColumns[number];

export interface ContractorRow {
  trade: string | null;
  company_name: string | null;
  full_name: string | null;
  phone: string | null;
  address_1: string | null;
  address_2: string | null;
  city: string | null;
  zip: string | null;
  contractor_id: number | null;
}

export type TableName = "applicant" | "construction_permit" | "contractor";

export type AnyRow = ApplicantRow | ConstructionPermitRow | ContractorRow;

export type AnyColumn =
  | ApplicantColumn
  | ConstructionPermitColumn
  | ContractorColumn;
