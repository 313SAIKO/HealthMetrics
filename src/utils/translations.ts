import {
  PROFILE_LIMITS,
  BMI_BOUNDARIES,
  IDEAL_WEIGHT_HEIGHT,
  ENERGY_POLICY,
} from "../core/policy";
import type { ValidationErrorCode } from "../core/validation";
import type { Language } from "../types";

export interface TranslationDictionary {
  validation: Record<ValidationErrorCode, string>;
  common: {
    english: string;
    thai: string;
    kcalPerDay: string;
    grams: string;
  };
  page: {
    brandTagline: string;
    eyebrow: string;
    titleStart: string;
    titleHighlight: string;
    subtitle: string;
    footer: string;
    resultPlaceholderTitle: string;
    resultPlaceholderDescription: string;
  };
  form: {
    eyebrow: string;
    title: string;
    description: string;
    eligibility: string;
    ageHint: string;
    weightHint: string;
    heightHint: string;
    gender: string;
    male: string;
    female: string;
    age: string;
    weight: string;
    height: string;
    activityLevel: string;
    calculate: string;
  };
  activity: {
    basal: string;
    sedentary: string;
    light: string;
    moderate: string;
    heavy: string;
    athlete: string;
  };
  results: {
    eyebrow: string;
    title: string;
    bmi: string;
    bmiRoundingNote: string;
    unsupportedHeight: string;
    withheldPlan: string;
    bmr: string;
    tdee: string;
    atRest: string;
    maintenanceCalories: string;
    disclaimer: string;
    formulaTitle: string;
    activityTableTitle: string;
    activityTableDescription: string;
    idealWeightTitle: string;
    idealWeightDescription: string;
    formula: string;
    estimatedWeight: string;
    macrosTitle: string;
    macrosDescription: string;
    maintenance: string;
    cutting: string;
    bulking: string;
    moderateCarb: string;
    lowerCarb: string;
    higherCarb: string;
    protein: string;
    fat: string;
    carbs: string;
  };
  bmiCategory: {
    underweight: string;
    normalWeight: string;
    overweight: string;
    obesity: string;
  };
  education: {
    bmi: string;
    bmr: string;
    tdee: string;
    idealWeight: string;
    hamwi: string;
    devine: string;
    robinson: string;
    miller: string;
    macros: string;
    maintenance: string;
    cutting: string;
    bulking: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    validation: {
      age: `Enter a whole age from ${PROFILE_LIMITS.age.min} to ${PROFILE_LIMITS.age.max} years.`,
      weight: `Enter a weight from ${PROFILE_LIMITS.weight.min} to ${PROFILE_LIMITS.weight.max} kg.`,
      height: `Enter a height from ${PROFILE_LIMITS.height.min} to ${PROFILE_LIMITS.height.max} cm.`,
      activity: "Choose an activity from the list.",
      gender: "Choose the sex used by the equation.",
    },
    common: {
      english: "EN",
      thai: "TH",
      kcalPerDay: "kcal/day",
      grams: "g",
    },
    page: {
      brandTagline: "Built for better habits",
      eyebrow: "Your health estimates and history",
      titleStart: "Know your numbers.",
      titleHighlight: "Feel your best.",
      subtitle:
        "Calculate your BMI, BMR, and TDEE, then sign in to save your assessments and compare your recorded measurements.",
      footer:
        "Calculations are estimates based on the Mifflin-St Jeor equation and standard activity multipliers.",
      resultPlaceholderTitle: "Your results will appear here",
      resultPlaceholderDescription:
        "Complete the form to get an estimate of your BMI, resting calorie burn, and daily maintenance calories.",
    },
    form: {
      eligibility: `For adults aged ${PROFILE_LIMITS.age.min}–${PROFILE_LIMITS.age.max} who are not pregnant or breastfeeding. Uses international adult BMI categories. Estimates are not personalized nutrition prescriptions.`,
      ageHint: `Whole years: ${PROFILE_LIMITS.age.min}–${PROFILE_LIMITS.age.max}`,
      weightHint: `${PROFILE_LIMITS.weight.min}–${PROFILE_LIMITS.weight.max} kg`,
      heightHint: `${PROFILE_LIMITS.height.min}–${PROFILE_LIMITS.height.max} cm`,
      eyebrow: "Your details",
      title: "Let’s calculate your health metrics",
      description:
        "Enter a few details to estimate your BMI, daily calorie needs, and basal metabolism.",
      gender: "Gender",
      male: "Male",
      female: "Female",
      age: "Age",
      weight: "Weight",
      height: "Height",
      activityLevel: "Activity level",
      calculate: "Calculate my results",
    },
    activity: {
      basal: "Basal metabolic rate",
      sedentary: "Sedentary — little or no exercise",
      light: "Lightly active — exercise 1–3 days/week",
      moderate: "Moderately active — exercise 3–5 days/week",
      heavy: "Very active — exercise 6–7 days/week",
      athlete: "Extra active — intense exercise or physical job",
    },
    results: {
      bmiRoundingNote:
        "Categories and plan availability use BMI before rounding. A < sign means the actual value is just below the displayed boundary.",
      unsupportedHeight: "Height outside supported range",
      withheldPlan: `This plan is withheld for BMI below ${BMI_BOUNDARIES[0]} or cutting targets below ${ENERGY_POLICY.minimumCutting.toLocaleString("en-US")} kcal/day. Consult a qualified professional.`,
      eyebrow: "Your results",
      title: "A snapshot of your daily needs",
      bmi: "Body Mass Index (BMI)",
      bmr: "Basal Metabolic Rate (BMR)",
      tdee: "Total Daily Energy Expenditure (TDEE)",
      atRest: "Energy your body uses at complete rest",
      maintenanceCalories: "Estimated calories to maintain your weight",
      disclaimer:
        "These estimates are for general informational purposes and are not a substitute for medical advice.",
      formulaTitle: "How these numbers are calculated",
      activityTableTitle: "TDEE by activity level",
      activityTableDescription:
        "Compare your estimated daily calorie needs at each activity level.",
      idealWeightTitle: "Ideal weight range",
      idealWeightDescription:
        "Four clinical formulas provide useful reference estimates based on your height.",
      formula: "Formula",
      estimatedWeight: "Estimated weight",
      macrosTitle: "Illustrative macronutrient splits",
      macrosDescription:
        "Illustrative calorie splits only, not a nutrition prescription. A displayed plan is not necessarily suitable for you.",
      maintenance: "Maintenance",
      cutting: "Cutting",
      bulking: "Bulking",
      moderateCarb: "Moderate carb",
      lowerCarb: "Lower carb",
      higherCarb: "Higher carb",
      protein: "Protein",
      fat: "Fat",
      carbs: "Carbs",
    },
    bmiCategory: {
      underweight: "Underweight",
      normalWeight: "Normal weight",
      overweight: "Overweight",
      obesity: "Obesity",
    },
    education: {
      bmi: "BMI compares your weight with your height. Formula: weight (kg) ÷ height (m)².",
      bmr: "BMR estimates the calories your body uses at complete rest. We use the Mifflin-St Jeor equation: male = (10 × weight) + (6.25 × height) − (5 × age) + 5; female = (10 × weight) + (6.25 × height) − (5 × age) − 161.",
      tdee: "TDEE estimates your daily calorie use. Formula: BMR × activity multiplier.",
      idealWeight:
        "Ideal weight is a height-based reference, not a diagnosis or a universal goal. Results vary because each formula uses a different reference population.",
      hamwi: `Hamwi: 106 lb + 6 lb/in (male), or 100 lb + 5 lb/in (female), above 5 feet; converted to kg. Supported heights: ${IDEAL_WEIGHT_HEIGHT.min}–${IDEAL_WEIGHT_HEIGHT.max} cm.`,
      devine:
        "Devine: 50 kg (male) or 45.5 kg (female), plus 2.3 kg for every inch over 5 feet.",
      robinson:
        "Robinson: 52 kg (male) or 49 kg (female), plus 1.9 kg or 1.7 kg per inch over 5 feet.",
      miller:
        "Miller: 56.2 kg (male) or 53.1 kg (female), plus 1.41 kg or 1.36 kg per inch over 5 feet.",
      macros:
        "Macronutrient targets divide your daily calories between protein, fat, and carbohydrates. Protein and carbs provide 4 kcal per gram; fat provides 9 kcal per gram.",
      maintenance:
        "Maintenance uses your estimated TDEE to help maintain your current weight.",
      cutting: `Cutting illustrates TDEE minus ${ENERGY_POLICY.adjustment} kcal per day, subject to the product limits.`,
      bulking: `Bulking illustrates TDEE plus ${ENERGY_POLICY.adjustment} kcal per day, subject to the product limits.`,
    },
  },
  th: {
    validation: {
      age: `รองรับอายุจำนวนเต็ม ${PROFILE_LIMITS.age.min}–${PROFILE_LIMITS.age.max} ปี`,
      weight: `กรอกน้ำหนัก ${PROFILE_LIMITS.weight.min}–${PROFILE_LIMITS.weight.max} กก.`,
      height: `กรอกส่วนสูง ${PROFILE_LIMITS.height.min}–${PROFILE_LIMITS.height.max} ซม.`,
      activity: "เลือกระดับกิจกรรมจากรายการ",
      gender: "เลือกเพศที่ใช้ในสมการ",
    },
    common: {
      english: "EN",
      thai: "TH",
      kcalPerDay: "กิโลแคลอรี/วัน",
      grams: "กรัม",
    },
    page: {
      brandTagline: "เพื่อสุขภาพที่ดีขึ้นทุกวัน",
      eyebrow: "คำนวณและบันทึกข้อมูลสุขภาพส่วนบุคคล",
      titleStart: "รู้จักตัวเลขของคุณ",
      titleHighlight: "เพื่อสุขภาพที่ดีขึ้น",
      subtitle:
        "คำนวณค่าประมาณ BMI, BMR และ TDEE พร้อมบันทึกประวัติในบัญชีส่วนตัว และเปรียบเทียบข้อมูลที่วัดไว้แต่ละครั้ง",
      footer:
        "ผลการคำนวณเป็นเพียงค่าประมาณ โดยอ้างอิงสมการ Mifflin-St Jeor และตัวคูณระดับกิจกรรมมาตรฐาน",
      resultPlaceholderTitle: "ผลลัพธ์ของคุณจะแสดงที่นี่",
      resultPlaceholderDescription:
        "กรอกข้อมูลให้ครบเพื่อดูค่าประมาณ BMI พลังงานที่ร่างกายใช้ขณะพัก และพลังงานที่ควรได้รับต่อวันเพื่อรักษาน้ำหนัก",
    },
    form: {
      eligibility: `สำหรับผู้ใหญ่อายุ ${PROFILE_LIMITS.age.min}–${PROFILE_LIMITS.age.max} ปีที่ไม่ได้ตั้งครรภ์หรือให้นม ใช้เกณฑ์ BMI ผู้ใหญ่สากล ผลเป็นค่าประมาณ ไม่ใช่แผนโภชนาการเฉพาะบุคคล`,
      ageHint: `อายุจำนวนเต็ม ${PROFILE_LIMITS.age.min}–${PROFILE_LIMITS.age.max} ปี`,
      weightHint: `${PROFILE_LIMITS.weight.min}–${PROFILE_LIMITS.weight.max} กก.`,
      heightHint: `${PROFILE_LIMITS.height.min}–${PROFILE_LIMITS.height.max} ซม.`,
      eyebrow: "ข้อมูลของคุณ",
      title: "มาคำนวณข้อมูลสุขภาพของคุณกัน",
      description:
        "กรอกข้อมูลเล็กน้อยเพื่อดูค่าประมาณ BMI พลังงานที่ควรได้รับต่อวัน และอัตราการเผาผลาญพื้นฐาน",
      gender: "เพศ",
      male: "ชาย",
      female: "หญิง",
      age: "อายุ",
      weight: "น้ำหนัก",
      height: "ส่วนสูง",
      activityLevel: "ระดับกิจกรรม",
      calculate: "คำนวณผลลัพธ์",
    },
    activity: {
      basal: "อัตราการเผาผลาญพื้นฐาน",
      sedentary: "ไม่ออกกำลังกายเลย หรือออกกำลังกายน้อยมาก",
      light: "ออกกำลังกายเบา ๆ 1–3 วัน/สัปดาห์",
      moderate: "ออกกำลังกายปานกลาง 3–5 วัน/สัปดาห์",
      heavy: "ออกกำลังกายหนัก 6–7 วัน/สัปดาห์",
      athlete: "ออกกำลังกายหนักมาก หรือทำงานที่ใช้แรงกาย",
    },
    results: {
      bmiRoundingNote:
        "จัดกลุ่มและกำหนดการแสดงแผนจาก BMI ก่อนปัดเศษ เครื่องหมาย < หมายถึงค่าจริงต่ำกว่าเส้นแบ่งที่แสดงเล็กน้อย",
      unsupportedHeight: "ไม่รองรับส่วนสูงนี้",
      withheldPlan: `ไม่แสดงแผนนี้เมื่อ BMI ต่ำกว่า ${BMI_BOUNDARIES[0]} หรือเป้าหมายลดน้ำหนักต่ำกว่า ${ENERGY_POLICY.minimumCutting.toLocaleString("en-US")} kcal/วัน โปรดปรึกษาผู้เชี่ยวชาญ`,
      eyebrow: "ผลลัพธ์ของคุณ",
      title: "สรุปความต้องการพลังงานในแต่ละวัน",
      bmi: "ดัชนีมวลกาย (BMI)",
      bmr: "พลังงานพื้นฐาน (BMR)",
      tdee: "พลังงานที่ใช้ต่อวัน (TDEE)",
      atRest: "พลังงานที่ร่างกายใช้ขณะพัก",
      maintenanceCalories: "พลังงานโดยประมาณเพื่อรักษาน้ำหนัก",
      disclaimer: "ผลลัพธ์นี้เป็นเพียงข้อมูลประกอบการดูแลสุขภาพ และไม่ใช่คำแนะนำทางการแพทย์",
      formulaTitle: "วิธีคำนวณตัวเลขเหล่านี้",
      activityTableTitle: "TDEE ตามระดับกิจกรรม",
      activityTableDescription:
        "เปรียบเทียบพลังงานที่ร่างกายใช้ต่อวันโดยประมาณในแต่ละระดับกิจกรรม",
      idealWeightTitle: "น้ำหนักอ้างอิงที่เหมาะสม",
      idealWeightDescription: "สูตรทางคลินิก 4 สูตรช่วยให้ค่าประมาณอ้างอิงจากส่วนสูงของคุณ",
      formula: "สูตร",
      estimatedWeight: "น้ำหนักโดยประมาณ",
      macrosTitle: "ตัวอย่างการแบ่งพลังงานเป็นสารอาหาร",
      macrosDescription:
        "ตัวอย่างการแบ่งพลังงาน ไม่ใช่แผนโภชนาการเฉพาะบุคคล การแสดงแผนไม่ได้ยืนยันว่าเหมาะสมกับคุณ",
      maintenance: "รักษาน้ำหนัก",
      cutting: "ลดน้ำหนัก",
      bulking: "เพิ่มน้ำหนัก",
      moderateCarb: "คาร์โบไฮเดรตปานกลาง",
      lowerCarb: "คาร์โบไฮเดรตต่ำ",
      higherCarb: "คาร์โบไฮเดรตสูง",
      protein: "โปรตีน",
      fat: "ไขมัน",
      carbs: "คาร์โบไฮเดรต",
    },
    bmiCategory: {
      underweight: "น้ำหนักต่ำกว่าเกณฑ์",
      normalWeight: "น้ำหนักอยู่ในเกณฑ์ปกติ",
      overweight: "น้ำหนักเกินเกณฑ์",
      obesity: "โรคอ้วน",
    },
    education: {
      bmi: "BMI ใช้เปรียบเทียบน้ำหนักกับส่วนสูง สูตรคือ น้ำหนัก (กก.) ÷ ส่วนสูง (ม.)²",
      bmr: "BMR คือค่าประมาณพลังงานที่ร่างกายใช้ขณะพัก เราใช้สมการ Mifflin-St Jeor: ชาย = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) + 5; หญิง = (10 × น้ำหนัก) + (6.25 × ส่วนสูง) − (5 × อายุ) − 161",
      tdee: "TDEE คือค่าประมาณพลังงานที่ร่างกายใช้ต่อวัน สูตรคือ BMR × ตัวคูณระดับกิจกรรม",
      idealWeight:
        "น้ำหนักอ้างอิงที่เหมาะสมคำนวณจากส่วนสูง ไม่ใช่การวินิจฉัยหรือเป้าหมายตายตัว โดยแต่ละสูตรอ้างอิงจากกลุ่มประชากรที่ต่างกัน",
      hamwi: `Hamwi: ชาย 106 ปอนด์ + 6 ปอนด์/นิ้ว หญิง 100 ปอนด์ + 5 ปอนด์/นิ้ว ที่เกิน 5 ฟุต แล้วแปลงเป็นกิโลกรัม รองรับส่วนสูง ${IDEAL_WEIGHT_HEIGHT.min}–${IDEAL_WEIGHT_HEIGHT.max} ซม.`,
      devine:
        "Devine: 50 กก. สำหรับชาย หรือ 45.5 กก. สำหรับหญิง แล้วบวก 2.3 กก. ต่อทุก 1 นิ้วที่สูงเกิน 5 ฟุต",
      robinson:
        "Robinson: 52 กก. สำหรับชาย หรือ 49 กก. สำหรับหญิง แล้วบวก 1.9 กก. หรือ 1.7 กก. ต่อทุก 1 นิ้วที่สูงเกิน 5 ฟุต",
      miller:
        "Miller: 56.2 กก. สำหรับชาย หรือ 53.1 กก. สำหรับหญิง แล้วบวก 1.41 กก. หรือ 1.36 กก. ต่อทุก 1 นิ้วที่สูงเกิน 5 ฟุต",
      macros:
        "เป้าหมายสารอาหารจะแบ่งพลังงานต่อวันเป็นโปรตีน ไขมัน และคาร์โบไฮเดรต โปรตีนและคาร์โบไฮเดรตให้พลังงาน 4 กิโลแคลอรีต่อกรัม ส่วนไขมันให้พลังงาน 9 กิโลแคลอรีต่อกรัม",
      maintenance: "การรักษาน้ำหนักใช้ค่า TDEE โดยประมาณ เพื่อช่วยคงน้ำหนักปัจจุบัน",
      cutting: `ตัวอย่างการลดน้ำหนักใช้ค่า TDEE ลบ ${ENERGY_POLICY.adjustment} กิโลแคลอรีต่อวัน ภายใต้ข้อจำกัดของเครื่องมือ`,
      bulking: `ตัวอย่างการเพิ่มน้ำหนักใช้ค่า TDEE บวก ${ENERGY_POLICY.adjustment} กิโลแคลอรีต่อวัน ภายใต้ข้อจำกัดของเครื่องมือ`,
    },
  },
};

/** Returns the complete translation dictionary for the requested language. */
export function getTranslations(language: Language): TranslationDictionary {
  return translations[language];
}
