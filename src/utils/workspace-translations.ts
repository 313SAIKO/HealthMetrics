import type { Language } from "../types";

const en = {
  account: "Your account",
  accountHelp:
    "Save your health estimates privately and revisit your measurements.",
  signIn: "Sign in",
  signUp: "Create account",
  signOut: "Sign out",
  name: "Name",
  email: "Email",
  password: "Password",
  passwordHint: "Use 8–128 characters. Use a unique password for this account.",
  loadingSession: "Checking your session…",
  working: "Please wait…",
  signedIn: "Signed in as",
  sessionError: "We could not check your session.",
  retry: "Try again",
  authRequired: "Sign in to save and view your records.",
  networkError:
    "The request could not be completed. Check your connection and try again.",
  invalidCredentials: "The email or password is incorrect.",
  emailExists: "An account with this email already exists. Try signing in.",
  invalidRequest: "Check the information and try again.",
  expired: "Your session has expired. Please sign in again.",
  forbidden: "This request was blocked. Refresh the page and try again.",
  notFound: "This record is no longer available.",
  rateLimited: "Too many requests. Please wait a little before trying again.",
  saveTitle: "Save this assessment",
  saveHelp:
    "Only save measurements that were actually taken. Saving sends this profile to your account; calculating alone does not.",
  title: "Record title",
  titlePlaceholder: "For example, morning check-in",
  measuredAt: "Measurement date",
  save: "Save assessment",
  saved: "Assessment saved to your history.",
  history: "Assessment history",
  historyLink: "Assessment history",
  back: "Back to calculator",
  historyHelp:
    "Revisit your recorded measurements and compare two assessments. Differences are observations, not predictions or medical advice.",
  privateHistory: "Your records are only available to your account.",
  noRecords: "No assessments yet",
  noRecordsHelp:
    "Calculate and save your first assessment from the calculator.",
  noFiltered: "No assessments match these dates.",
  loadingRecords: "Loading your assessments…",
  loadError: "We could not load your assessments.",
  from: "From date",
  to: "To date",
  filter: "Apply dates",
  reset: "Clear dates",
  invalidDates: "The start date must be on or before the end date.",
  records: "records",
  previous: "Previous",
  next: "Next",
  page: "Page",
  view: "View saved results",
  hide: "Hide saved results",
  edit: "Edit",
  remove: "Delete",
  confirmDelete: "Delete this assessment permanently?",
  deleteHelp:
    "This removes the saved measurement and its results from your account.",
  confirm: "Delete permanently",
  cancel: "Cancel",
  deleted: "Assessment deleted.",
  updated: "Assessment updated and recalculated.",
  editTitle: "Edit assessment",
  editHelp:
    "Saving updates the profile and recalculates this record using the current formula version.",
  update: "Save changes",
  titleError: "Enter a title from 1 to 120 characters.",
  dateError: "Enter a valid measurement date that is not in the future.",
  compare: "Compare",
  compareHelp:
    "Select two saved assessments to compare. Values use each record’s saved calculation.",
  compareLimit: "Two assessments selected. Deselect one to choose another.",
  comparison: "Assessment comparison",
  comparisonScroll:
    "Scroll horizontally to see both assessments and their differences.",
  clearComparison: "Clear comparison",
  metric: "Metric",
  difference: "Second minus first",
  noDifference: "—",
  age: "Age (years)",
  weight: "Weight (kg)",
  height: "Height (cm)",
  activity: "Activity level",
  gender: "Equation sex",
  bmi: "BMI (kg/m²)",
  bmr: "BMR (kcal/day)",
  tdee: "TDEE (kcal/day)",
  snapshot: "Saved calculation",
  version: "Formula version",
  savedAt: "Saved on",
  estimatedEnergy: "Estimated daily energy",
  privacy: "The calculator remains available without an account.",
};

const th: typeof en = {
  account: "บัญชีผู้ใช้",
  accountHelp: "บันทึกค่าประมาณสุขภาพเป็นประวัติส่วนตัว เพื่อกลับมาดูข้อมูลที่วัดไว้ได้",
  signIn: "เข้าสู่ระบบ",
  signUp: "สร้างบัญชี",
  signOut: "ออกจากระบบ",
  name: "ชื่อ",
  email: "อีเมล",
  password: "รหัสผ่าน",
  passwordHint: "ใช้ 8–128 ตัวอักษร และเลือกรหัสผ่านที่ไม่ซ้ำกับบัญชีอื่น",
  loadingSession: "กำลังตรวจสอบบัญชี…",
  working: "กำลังดำเนินการ…",
  signedIn: "เข้าสู่ระบบเป็น",
  sessionError: "ตรวจสอบบัญชีไม่สำเร็จ",
  retry: "ลองอีกครั้ง",
  authRequired: "เข้าสู่ระบบเพื่อบันทึกและดูประวัติของคุณ",
  networkError: "ดำเนินการไม่สำเร็จ โปรดตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง",
  invalidCredentials: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  emailExists: "อีเมลนี้มีบัญชีอยู่แล้ว ลองเข้าสู่ระบบ",
  invalidRequest: "โปรดตรวจสอบข้อมูลแล้วลองอีกครั้ง",
  expired: "เซสชันหมดอายุ โปรดเข้าสู่ระบบอีกครั้ง",
  forbidden: "คำขอถูกปฏิเสธ โปรดรีเฟรชหน้าแล้วลองอีกครั้ง",
  notFound: "ไม่พบรายการนี้แล้ว",
  rateLimited: "มีคำขอมากเกินไป โปรดรอสักครู่แล้วลองอีกครั้ง",
  saveTitle: "บันทึกผลการประเมิน",
  saveHelp:
    "บันทึกเฉพาะข้อมูลที่วัดจริง การบันทึกจะส่งข้อมูลนี้ไปยังบัญชีของคุณ การคำนวณเพียงอย่างเดียวจะไม่ส่งข้อมูล",
  title: "ชื่อรายการ",
  titlePlaceholder: "เช่น วัดตอนเช้า",
  measuredAt: "วันที่วัด",
  save: "บันทึกผลการประเมิน",
  saved: "บันทึกผลลงในประวัติแล้ว",
  history: "ประวัติการประเมิน",
  historyLink: "ประวัติการประเมิน",
  back: "กลับไปเครื่องคำนวณ",
  historyHelp:
    "ดูข้อมูลที่เคยวัดและเปรียบเทียบการประเมินสองรายการ ส่วนต่างแสดงสิ่งที่บันทึกไว้ ไม่ใช่การคาดการณ์หรือคำแนะนำทางการแพทย์",
  privateHistory: "ประวัติเหล่านี้เปิดดูได้ผ่านบัญชีของคุณเท่านั้น",
  noRecords: "ยังไม่มีประวัติการประเมิน",
  noRecordsHelp: "คำนวณแล้วบันทึกรายการแรกได้จากหน้าเครื่องคำนวณ",
  noFiltered: "ไม่มีรายการในช่วงวันที่นี้",
  loadingRecords: "กำลังโหลดประวัติ…",
  loadError: "โหลดประวัติไม่สำเร็จ",
  from: "ตั้งแต่วันที่",
  to: "ถึงวันที่",
  filter: "ใช้ช่วงวันที่",
  reset: "ล้างช่วงวันที่",
  invalidDates: "วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด",
  records: "รายการ",
  previous: "ก่อนหน้า",
  next: "ถัดไป",
  page: "หน้า",
  view: "ดูผลที่บันทึก",
  hide: "ซ่อนผลที่บันทึก",
  edit: "แก้ไข",
  remove: "ลบ",
  confirmDelete: "ลบการประเมินนี้ถาวรหรือไม่",
  deleteHelp: "ข้อมูลที่วัดและผลการประเมินนี้จะถูกลบออกจากบัญชีของคุณ",
  confirm: "ลบถาวร",
  cancel: "ยกเลิก",
  deleted: "ลบการประเมินแล้ว",
  updated: "แก้ไขข้อมูลและคำนวณใหม่แล้ว",
  editTitle: "แก้ไขการประเมิน",
  editHelp: "เมื่อบันทึก ระบบจะแก้ไขข้อมูลและคำนวณรายการนี้ใหม่ด้วยสูตรเวอร์ชันปัจจุบัน",
  update: "บันทึกการแก้ไข",
  titleError: "กรอกชื่อรายการ 1–120 ตัวอักษร",
  dateError: "กรอกวันที่วัดให้ถูกต้องและไม่เป็นวันที่ในอนาคต",
  compare: "เปรียบเทียบ",
  compareHelp: "เลือกประวัติสองรายการเพื่อเปรียบเทียบ โดยใช้ผลที่บันทึกไว้ของแต่ละรายการ",
  compareLimit: "เลือกครบสองรายการแล้ว ยกเลิกรายการหนึ่งเพื่อเลือกใหม่",
  comparison: "เปรียบเทียบการประเมิน",
  comparisonScroll: "เลื่อนตารางแนวนอนเพื่อดูทั้งสองรายการและผลต่าง",
  clearComparison: "ล้างการเปรียบเทียบ",
  metric: "ข้อมูล",
  difference: "รายการที่สอง − รายการแรก",
  noDifference: "—",
  age: "อายุ (ปี)",
  weight: "น้ำหนัก (กก.)",
  height: "ส่วนสูง (ซม.)",
  activity: "ระดับกิจกรรม",
  gender: "เพศที่ใช้ในสมการ",
  bmi: "BMI (กก./ม.²)",
  bmr: "BMR (กิโลแคลอรี/วัน)",
  tdee: "TDEE (กิโลแคลอรี/วัน)",
  snapshot: "ผลคำนวณที่บันทึกไว้",
  version: "เวอร์ชันสูตร",
  savedAt: "บันทึกเมื่อ",
  estimatedEnergy: "พลังงานต่อวันโดยประมาณ",
  privacy: "ใช้เครื่องคำนวณได้โดยไม่ต้องมีบัญชี",
};

export const workspaceTranslations = { en, th };

export function getWorkspaceTranslations(language: Language) {
  return language === "th" ? th : en;
}

export function todayLocal(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function validMeasurementDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value > todayLocal()) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function formatMeasurementDate(
  value: string,
  language: Language,
): string {
  return new Intl.DateTimeFormat(language === "th" ? "th-TH" : "en-GB", {
    dateStyle: "medium",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00`));
}
