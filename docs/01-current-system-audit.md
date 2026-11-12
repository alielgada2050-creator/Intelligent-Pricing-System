# Current System Audit and Migration Plan

## Scope and evidence

This audit covers the checked-in browser application, its JavaScript and CSS modules, the supplied platform requirements, and the files present in the workspace. It does not claim that external SEC systems, production hosting, or other workspaces were inspected.

## Current architecture

- A single-page application in `index.html` with a large inline `App` object and client-side renderers.
- CSS is in `css/style.css`; domain and utility code is loaded as ordered browser scripts from `js/`.
- The page loads reference data and browser modules before initializing navigation on `DOMContentLoaded`.
- The main application store is `localStorage` (`ps_sec_v3`). Other modules use additional local-storage keys. There is no API server, relational database, authentication service, or cross-device synchronization in this repository.
- The project has no package manifest, test runner configuration, build pipeline, or automated release workflow at the time of this audit.
- An offline snapshot of the pre-enhancement working files is stored outside the repository in the session backup directory.

## Existing capabilities

- Dashboard, contracts, BOQ creation, saved BOQs, price search, comparison, certificate preparation, backup, AI analysis, voice assistance, and profitability screens.
- A local price list containing 920 items. `js/data/price-list.js` declares the source as `PRICING ATTACHMENT — BID FORM`, the reference `RFx 4000083770`, and update date `2026-08-10`. These fields describe local metadata; they are not independent verification of contractual authority or current validity.
- BOQ calculations and VAT display are implemented in browser code. BOQ workflow states are saved locally and do not establish submission to, or approval by, SEC.
- PDF/text and spreadsheet reading depend on browser-side libraries and parsers; extracted content is not a verified source record.
- A local profitability view with editable baseline/actual/commitment values. Its initial category split is a model allocation, not measured job cost.

## Verified behavior

- The HTML page and referenced JavaScript load from a local HTTP server.
- All 15 existing navigation destinations rendered during browser verification.
- A BOQ could be created, priced, saved, advanced through its local workflow, reloaded, and connected to its local profitability record.
- JavaScript syntax checks passed for the 20 files under `js/`.
- Testing exposed an invalid formatted numeric BOQ input; the input was corrected to use an unformatted number.

## Gaps and risks

- Work orders, documents, revisions, field diaries, procurement, equipment, labor, inspections, accepted quantities, and collection records are not a single server-backed work-order record.
- Local storage is device/browser scoped, can be cleared or exhausted, and does not provide team access, concurrency control, server authorization, or reliable synchronization.
- The previous client-only Google preview and demo login have been disabled. The login screen is informational until an OTP/identity provider and trusted verification service are configured; local browser state is not access control.
- Imported documents and locally stored project information have no server-side access policy or managed file storage.
- The tracked `العقد الموحد 20206.xlsx` file is zero bytes, so it cannot serve as a valid source workbook.
- Some features depend on external CDN/network availability. Offline behavior, multi-device recovery, OCR, cross-device collaboration, and production authentication were not established by the browser checks.
- Voice recognition previously offered Saudi and Egyptian Arabic locale choices. Browser speech recognition/synthesis availability and voice quality vary by browser/device; a voice example was not present in the supplied attachments.
- The existing Odoo option is a client-side CSV product-import staging file. It is not a live Odoo connection, does not create quotations/orders, and cannot validate target Odoo fields, units, categories, or access rights.
- Emergency status is a BOQ classification only; it does not modify item rates. Any applicable contract percentage must be entered as its own price-list item and reviewed against the authoritative clause and calculation basis.
- The current workflow can display local “approved” status without an external approval document. Such a status must not be presented as SEC acceptance.
- The existing profitability budget allocation is estimated and the interface accepts manually entered amounts. It must not be mistaken for verified actual cost or accounting profit.

## Data sources and financial boundaries

- The in-app price array and CSV are local reference data. Preserve their provenance, update date, currency, and source row; require a human to confirm contractual applicability.
- Do not infer a material bill of quantities from BOQ descriptions alone. No verified resource recipe is present in the inspected data.
- VAT is displayed as a separate pricing component in BOQ calculations. Operational cost and revenue reports should preserve the entered tax basis and must not infer tax treatment from missing invoice data.
- Execution revenue, customer-approved work, submitted certificates, and cash collection are distinct business events. The current platform does not contain evidence-backed server records for these events.

## Security and governance observations

- Browser local storage is not encrypted storage and is not an authorization boundary.
- A role label or locally stored session cannot protect records from a user with browser access.
- Client-rendered screens and client-side checks are suitable only for a local prototype/trusted single-device workflow; production financial approval requires trusted server-side identity, authorization, validation, audit retention, and backups.
- Do not upload project or identity data to an external AI, MCP, or integration provider without explicit approval and an appropriate data-handling agreement.

## Technical debt

- Large inline HTML/JavaScript module, global functions, inline event handlers, and shared mutable application state make isolated testing and incremental migration harder.
- Persistence behavior and error handling vary between modules.
- No migration/version strategy covers the whole application data model.
- No repeatable unit, integration, responsive, offline, or financial regression suite existed before this change.
- A zero-byte workbook and local-only authentication/approval semantics must be resolved before production claims.

## Incremental migration plan

1. **Foundation and audit (current):** preserve the existing application; document verified behavior, trust boundaries, data provenance, and gaps. Add a tested domain module for work-order-linked execution records without changing the existing BOQ format.
2. **BOQ and pricing:** add source/version metadata, unit-aware review, non-destructive revisions, price variance reports, and a final-review checklist. Verify the percentage item and calculation basis against the authoritative contract.
3. **Resources and procurement:** add evidence-backed material movements, actual labor/equipment cost records, waste/logistics reconciliation, and inspections. Do not generate “actual” costs from estimates.
4. **Field workflow:** introduce a PWA and local IndexedDB/outbox for field capture, then define conflict-safe synchronization with a central API. Browser-local records alone are not team synchronization.
5. **Quality and payment:** connect inspected/accepted quantities, evidence, and certificate revisions; keep submission, approval, and collection states separate.
6. **Production architecture:** decide on hosting, identity, database, file storage, backups, retention, privacy, and recovery targets with the project owner. Migrate to a versioned API and relational database only after those operational decisions are approved.
7. **Release verification:** establish automated business-rule, migration, import/export, accessibility, responsive, security, and offline/sync tests before production use.

## Scope delivered in this iteration

The application gains a local-first field operations ledger linked to a saved BOQ. It records daily execution, material movements, labor, equipment, waste/logistics, and local inspection results; records changes as audit events; shows accepted quantity separately from executed quantity; and includes operational costs in the existing profitability forecast only when an actual amount and evidence reference are entered. This is a single-browser workflow, not a shared production system.

The voice assistant now uses generic Arabic or English, can speak local price-list answers, and supports voice search without adding items to the BOQ. Dictated BOQ takeoff remains separate from voice questions. Odoo product-export CSVs leave accounting cost blank rather than copying the sale/reference price into cost.

The in-page AI assistant can connect to a local Ollama or LM Studio model without an API key. Cloud providers remain optional; their prompts/context are sent to the selected provider, and browser storage is not a secure place for production credentials. See [AI assistant setup](./ai-assistant.md).

## Decisions and inputs still needed

- The user mentioned an example for voice behavior, but no audio/sample attachment was available in this request. A recording or example transcript is needed to tune recognition/response style.
- The optional local AI assistant requires Ollama or LM Studio and a compatible model installed and running on the user's device. Cloud providers require explicit configuration and send prompts/context externally. The voice search itself calls no AI provider; it searches the local reference list.
- A real Odoo connector requires the deployed Odoo version, base URL, company/database context, field mappings and an approved least-privilege integration identity. Credentials must be held by a trusted server, never in frontend code or browser storage.
- Multi-user field operations require a selected backend, identity provider, database, file storage, synchronization/conflict policy, backup and recovery targets. None can be inferred from this browser-only repository.
