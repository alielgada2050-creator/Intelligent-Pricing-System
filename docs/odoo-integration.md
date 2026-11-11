# Odoo Integration Status and Safe Rollout

## What exists

The application has an `ERPIntegration` browser module with CSV exports for Odoo, SAP, and a generic BOQ. The Odoo option produces a **product import staging CSV** for a human to review and import using Odoo's data import UI. It is not an API integration and does not create a quotation, purchase order, invoice, or project in Odoo.

The export preserves the item reference, Arabic item description, reference unit, quantity rate, and a product type. The `Cost` column is intentionally blank: a contract sale/reference price is not an evidenced contractor cost. A missing reference price remains blank rather than being replaced with zero or another price.

## Import prerequisites

- Confirm the Odoo version and use that version's supported product import field names.
- Map contract units and product categories to records that actually exist in the target Odoo database. This template does not create those records.
- Confirm language, currency, tax treatment, company, sales/pricelist behavior, and whether products should be services or stockable goods.
- Review every row and price source before import. Importing product data does not constitute a submitted or accepted SEC BOQ.
- Keep sale price, contractor cost, purchase commitment, and actual cost as different values.

## Live API connector prerequisites

Do not place an Odoo API key or password in HTML, JavaScript, query strings, local storage, or a downloadable client configuration. A live connector needs a trusted backend/proxy that stores credentials in a server-side secret manager, enforces TLS, validates user input, restricts access to the required Odoo models/actions, records audit events, redacts secrets from logs, and requires explicit user confirmation before external write operations.

Before implementation, obtain:

1. Odoo version and hosted/on-premises deployment details.
2. Base URL and database/company context through an approved secure channel.
3. Whether scope is read-only lookup, export-only, or creation of draft records; default to export-only.
4. An approved service identity with least privilege and a rotation/revocation owner.
5. Target model/field mapping, unit/category mappings, error/retry behavior, and test environment.

No API call or data transfer is enabled by this repository.
