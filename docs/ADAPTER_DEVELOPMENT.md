# Adapter development

## Opportunity sources

An `OpportunitySource` returns source records without ranking them. The job engine then canonicalizes URLs, computes duplicate fingerprints and applies hard filters before any optional Codex fit analysis.

New network adapters must use documented public feeds or endpoints, set a clear user agent, obey rate limits and retain only source material permitted by the publisher. Private applicant insights, browser-cookie reuse, prohibited scraping and anti-bot bypasses are rejected during review.

Each adapter needs:

- a stable source ID;
- fixture data with no personal information;
- normalization and duplicate tests;
- timeout and error behavior;
- an adapter-health result;
- documentation of terms and access assumptions.

## Form adapters

Site-specific adapters may improve labels or field mappings. They cannot weaken sensitive-field rules, CAPTCHA/MFA boundaries or final-submit protection. `auto_submit_allowlisted` requires a named adapter, explicit user enablement and dedicated tests; the generic detector always returns false for auto-submit.
