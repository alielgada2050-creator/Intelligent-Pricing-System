# Contract Pricing Rules

## Reference currently present in the application

The local price data in `js/data/price-list.js` declares:

- Reference: `RFx 4000083770`
- Title: `العقد الموحد 2026 — الشركة السعودية للطاقة`
- Source label: `PRICING ATTACHMENT — BID FORM`
- Currency: SAR
- Declared item count: 920
- Local update date: `2026-08-10`

These are provenance fields stored with the application data. They do not prove that the workbook is complete, approved, in force for a given work order, or applicable to a particular item. The similarly named workbook in the repository is zero bytes and is not a usable verification source.

The local list contains item `802000001`, described as an additional percentage for emergency work, with unit `%` and a displayed local rate of `45`. This data does not independently verify the authoritative contract or establish the quantity/base formula. The application must not convert emergency status into a blanket uplift or assume the calculation basis; a commercial reviewer must verify the source clause and the separate line-item calculation.

## Rules for review and costing

1. Preserve the source item code, description, unit, source label, list version/date, and any user-supplied work-order price separately.
2. Prefer exact code-and-unit matches. A description-only or normalized match is a review suggestion, not an automatic equivalence.
3. Display missing prices and unit mismatches as unresolved. Never synthesize a contract price.
4. Do not overwrite or automatically revise a contract price from an imported file, an AI suggestion, a market estimate, or a work-order price.
5. Show a variance only when both values and their sources are present: absolute variance = work-order unit price − reference unit price; percentage variance = absolute variance ÷ reference unit price × 100. If the reference price is zero or missing, percentage variance is unavailable.
6. Do not infer that either value is a contractual cap/floor or that a price difference is an entitlement. Require human contractual review.
7. Emergency classification does not change item rates. Do not apply a blanket percentage or multiply the entire BOQ. If the applicable contract contains a percentage/additional-rate item, add that item separately, preserve its own code, description, unit, and source rate, and obtain human confirmation of applicability and calculation basis before submission.
8. A locally saved or “approved” application status is not evidence that SEC submitted, accepted, or approved a price.
9. Record the reviewer, date, reason, supporting document reference, and resulting decision when a price match is confirmed or rejected.

## Revenue and tax

Keep the reference unit rate, work-order unit rate, measured quantity, internally inspected quantity, client-accepted quantity, certificate status, and cash collection as separate fields/events. VAT must be shown separately from pre-tax revenue and excluded from profit calculations unless accounting policy explicitly requires otherwise.

## Production prerequisites

Before using this reference for an external submission, obtain the authoritative, complete price attachment and amendments; confirm item units, effective dates, the specific percentage item and its calculation basis, and contract interpretation with the responsible commercial reviewer. The application must retain the exact source document/version used for the decision.
