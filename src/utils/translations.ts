import type { Language } from "../types";

export interface TranslationDictionary {
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
    common: {
      english: "EN",
      thai: "TH",
      kcalPerDay: "kcal/day",
      grams: "g",
    },
    page: {
      brandTagline: "Built for better habits",
      eyebrow: "Personal health calculator",
      titleStart: "Know your numbers.",
      titleHighlight: "Feel your best.",
      subtitle:
        "Get a clear estimate of your BMI, BMR, and TDEE in seconds—so you can make more informed choices for your health goals.",
      footer:
        "Calculations are estimates based on the Mifflin-St Jeor equation and standard activity multipliers.",
      resultPlaceholderTitle: "Your results will appear here",
      resultPlaceholderDescription:
        "Complete the form to get an estimate of your BMI, resting calorie burn, and daily maintenance calories.",
    },
    form: {
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
      macrosTitle: "Daily macronutrient targets",
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
      hamwi:
        "Hamwi: 106 lb + 6 lb/in (male), or 100 lb + 5 lb/in (female), above 5 feet; converted to kg. Supported heights: 152.4–220 cm.",
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
      cutting:
        "Cutting uses TDEE minus 500 kcal per day, a commonly used starting deficit for fat loss.",
      bulking:
        "Bulking uses TDEE plus 500 kcal per day, a commonly used starting surplus for weight gain.",
    },
  },
  th: {
    common: {
      english: "EN",
      thai: "TH",
      kcalPerDay: "กิโลแคลอรี/วัน",
      grams: "กรัม",
    },
    page: {
      brandTagline: "เพื่อสุขภาพที่ดีขึ้นทุกวัน",
      eyebrow: "เครื่องคำนวณสุขภาพส่วนบุคคล",
      titleStart: "รู้จักตัวเลขของคุณ",
      titleHighlight: "เพื่อสุขภาพที่ดีขึ้น",
      subtitle:
        "ดูค่าประมาณ BMI, BMR และ TDEE ได้ในไม่กี่วินาที เพื่อช่วยให้คุณวางแผนดูแลสุขภาพได้อย่างมั่นใจยิ่งขึ้น",
      footer:
        "ผลการคำนวณเป็นเพียงค่าประมาณ โดยอ้างอิงสมการ Mifflin-St Jeor และตัวคูณระดับกิจกรรมมาตรฐาน",
      resultPlaceholderTitle: "ผลลัพธ์ของคุณจะแสดงที่นี่",
      resultPlaceholderDescription:
        "กรอกข้อมูลให้ครบเพื่อดูค่าประมาณ BMI พลังงานที่ร่างกายใช้ขณะพัก และพลังงานที่ควรได้รับต่อวันเพื่อรักษาน้ำหนัก",
    },
    form: {
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
      macrosTitle: "เป้าหมายสารอาหารต่อวัน",
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
      hamwi:
        "Hamwi: ชาย 106 ปอนด์ + 6 ปอนด์/นิ้ว หญิง 100 ปอนด์ + 5 ปอนด์/นิ้ว ที่เกิน 5 ฟุต แล้วแปลงเป็นกิโลกรัม รองรับส่วนสูง 152.4–220 ซม.",
      devine:
        "Devine: 50 กก. สำหรับชาย หรือ 45.5 กก. สำหรับหญิง แล้วบวก 2.3 กก. ต่อทุก 1 นิ้วที่สูงเกิน 5 ฟุต",
      robinson:
        "Robinson: 52 กก. สำหรับชาย หรือ 49 กก. สำหรับหญิง แล้วบวก 1.9 กก. หรือ 1.7 กก. ต่อทุก 1 นิ้วที่สูงเกิน 5 ฟุต",
      miller:
        "Miller: 56.2 กก. สำหรับชาย หรือ 53.1 กก. สำหรับหญิง แล้วบวก 1.41 กก. หรือ 1.36 กก. ต่อทุก 1 นิ้วที่สูงเกิน 5 ฟุต",
      macros:
        "เป้าหมายสารอาหารจะแบ่งพลังงานต่อวันเป็นโปรตีน ไขมัน และคาร์โบไฮเดรต โปรตีนและคาร์โบไฮเดรตให้พลังงาน 4 กิโลแคลอรีต่อกรัม ส่วนไขมันให้พลังงาน 9 กิโลแคลอรีต่อกรัม",
      maintenance: "การรักษาน้ำหนักใช้ค่า TDEE โดยประมาณ เพื่อช่วยคงน้ำหนักปัจจุบัน",
      cutting:
        "การลดน้ำหนักใช้ค่า TDEE ลบ 500 กิโลแคลอรีต่อวัน ซึ่งเป็นจุดเริ่มต้นที่นิยมใช้สำหรับการลดไขมัน",
      bulking:
        "การเพิ่มน้ำหนักใช้ค่า TDEE บวก 500 กิโลแคลอรีต่อวัน ซึ่งเป็นจุดเริ่มต้นที่นิยมใช้สำหรับการเพิ่มน้ำหนัก",
    },
  },
};

/** Returns the complete translation dictionary for the requested language. */
export function getTranslations(language: Language): TranslationDictionary {
  return translations[language];
}
