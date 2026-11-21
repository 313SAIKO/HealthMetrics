# HealthMetrics

Thai/English adult health estimates. Calculations run locally in the browser; no profile is sent to a backend or persisted.

## Development

Use Node 24 (see .nvmrc). Install with npm ci, then npm run dev. Run npm run check for type checking, lint, tests and a production build. Run npm start after building. CI runs the same checks. Commit package-lock.json when updating dependencies.

## Supported use and product limits

This general information tool supports whole ages 20–78, weights 20–300 kg and heights 100–220 cm. These are product input limits, not clinical validation of every possible combination. It is not intended for children, pregnancy, breastfeeding, or personalized dietary treatment. Do not use its results to prescribe a diet.

BMI uses international adult boundaries 18.5, 25 and 30, without rounding before classification. Mifflin–St Jeor estimates resting energy; activity multipliers estimate TDEE. These are estimates, particularly for unusual body composition or medical conditions.

Ideal-weight formulas are displayed only for heights 152.4–220 cm. Hamwi uses the original sex-specific pound equation converted using 0.45359237 kg/lb. Devine, Robinson and Miller retain their published metric coefficients. Reference weights are not personal goals.

Macro distributions are illustrative calorie splits. Cutting subtracts 500 kcal and is withheld below 1,500 kcal/day or BMI 18.5. Bulking is also withheld for underweight users, who should obtain individualized advice. The 1,500 cutoff is a conservative product restriction, not a universal safe intake. Availability of a plan does not establish its suitability. Clinical review is required before expanding these features to nutrition treatment.

## References

- [CDC adult categories](https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html)
- [CDC child and teen categories](https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html)
- [Original Mifflin–St Jeor study](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [Ideal-weight equations, Table 3](https://pmc.ncbi.nlm.nih.gov/articles/PMC4841935/)
- [NIDDK Body Weight Planner and exclusions](https://www.niddk.nih.gov/bwp)

## Deployment

Production requires Node 24 and npm run build followed by npm start. Keep Next.js and its dependency tree patched; npm audit should be checked during updates. Static export is an optional future deployment choice; the current build uses standard Next hosting.
