# Licensed Care Connections
## Third-Party Telehealth Integration and BAA Checklist

> **Planning document — legal, privacy, security, and clinical leadership must approve the actual architecture and contracts before launch.** This checklist is designed for a U.S. partner integration and assumes that Patients Compass begins with a no-PHI-by-default referral handoff.

**Prepared by:** Manus AI  
**Prepared:** September 10, 2026

## Recommended Architecture

| Stage | Data flow | Recommendation | Compliance burden |
|---|---|---|---|
| 1. Referral handoff | Patients Compass sends the user to the partner; no health data is transferred | **Launch first** | Lowest |
| 2. Scheduling bridge | Limited identity/contact and appointment metadata move through APIs | Launch only after role classification, contracts, consent, and security review | Moderate |
| 3. Clinical integration | Intake, documents, messages, video, records, or results move between systems | Defer until a BAA and full HIPAA/security program are operational | High |

The safest MVP uses a server-generated, short-lived handoff token containing only a random nonce and partner/campaign identifier. Do not place names, email addresses, symptoms, diagnoses, lab values, document names, appointment reasons, or other health information in query strings, browser storage, analytics payloads, referrer headers, or support logs.

## Partner Due Diligence

| Area | Required evidence |
|---|---|
| Corporate and clinical responsibility | Legal entity, states served, licensed-provider model, credentialing process, malpractice coverage, disciplinary monitoring, and clinical escalation owner |
| Privacy and role | HIPAA covered-entity/business-associate analysis, Notice of Privacy Practices, consumer-health privacy assessment, data-flow diagram, data inventory, and purpose limitations |
| Security program | Current risk analysis, security policies, independent assessment or SOC 2 report, penetration-test summary, vulnerability management, workforce training, and incident-response plan |
| Infrastructure | Hosting regions, encryption, key management, backups, disaster recovery, RTO/RPO, availability history, and full subprocessors list |
| Product controls | MFA, role-based access, audit logs, session management, consent capture, patient-location verification, accessibility, and record export/deletion workflows |
| Incident history | Material security incidents, regulatory investigations, corrective actions, cyber insurance, and named incident contacts |

## BAA Decision and Contract Sequence

1. **Map each data flow.** Identify who creates, receives, maintains, or transmits every data element, for whose benefit, and for what purpose.
2. **Classify each party.** Counsel must determine whether Patients Compass is a referral source, separate consumer-health service, covered entity, business associate, or business-associate subcontractor for that flow. HHS states that app, cloud, IT, messaging, and scheduling vendors can be business associates when their service involves PHI on behalf of a covered entity.[1]
3. **Do not transfer PHI before signature.** If Patients Compass or any infrastructure vendor will handle PHI on behalf of a covered partner, execute a compliant BAA before production processing begins—even when stored data is encrypted and the vendor cannot decrypt it.[2]
4. **Map downstream vendors.** List hosting, storage, email, observability, support, analytics, video, identity, and AI services. Any subcontractor that handles PHI must accept equivalent restrictions through a downstream BAA.[1]
5. **Negotiate the BAA and security exhibit.** Use the clause checklist below and align it with the main services agreement, data-processing terms, and SLA.
6. **Approve the shared-responsibility matrix.** State which party owns identity proofing, MFA, role authorization, audit review, encryption, keys, backups, consent, patient rights, deletion, breach assessment, and notices.
7. **Complete risk analysis and remediation.** Record threats, likelihood, impact, controls, residual risk, owner, and due date. HHS requires regulated entities to assess risks to confidentiality, integrity, and availability and periodically reevaluate safeguards.[3]
8. **Validate before go-live.** Complete security testing, privacy review, legal sign-off, data-restoration test, incident tabletop, and documented production approval.

## BAA Clause Checklist

| Clause | Minimum negotiated outcome |
|---|---|
| Permitted uses | Exact services and minimum-necessary data; no advertising, sale, unrelated profiling, or model training |
| Safeguards | Compliance with applicable Security Rule safeguards and the attached security responsibility matrix |
| Security incidents | Immediate operational escalation plus a short contractual notification deadline; include required facts and continuing updates |
| Breach duties | Investigation cooperation, risk assessment, evidence preservation, notification responsibilities, costs, and regulator/media coordination |
| Subcontractors | Prior disclosure, equivalent downstream obligations, change notification, and responsibility for subcontractor acts |
| Individual rights | Timely support for access, amendment, restriction, and accounting requests where applicable |
| Audit/regulator access | Records and cooperation needed for compliance review and HHS access |
| Data location/transfer | Approved regions and restrictions on unapproved transfers |
| Retention/termination | Return or destruction, deletion certification, limited legal-retention exception, and continued safeguards for retained data |
| Termination | Right to cure or terminate for material privacy/security breach |
| Insurance/indemnity | Appropriate cyber/privacy coverage and allocation of third-party claims and response costs |
| SLA alignment | Availability, support, backup, disaster recovery, RTO/RPO, data portability, and exit assistance consistent with the BAA |

HHS sample provisions include permitted uses, safeguards, incident reporting, subcontractors, access/amendment/accounting support, regulator access, return/destruction, and termination for material breach.[4]

## Technical Requirements

### Identity and Access

Use OAuth 2.0/OIDC Authorization Code with PKCE for user handoff where supported. Authenticate server-to-server calls with rotating credentials or mutual TLS; never expose partner secrets to the browser. Require MFA for staff, unique user IDs, least-privilege role-based access, rapid deprovisioning, session expiration, and privileged-access review.

### Data Minimization and Consent

Default to no PHI transfer. If data transfer is later enabled, require an explicit, recipient-specific authorization and show the exact data categories before transmission. Record consent version, timestamp, actor, recipient, purpose, and revocation state. Verify the patient’s current physical location before clinical scheduling or care, and ensure the provider—not Patients Compass—captures legally required telehealth informed consent.[5][6]

### API and Webhook Security

Use TLS for every connection, strict schema validation, payload size limits, replay protection, idempotency keys, timestamped HMAC or asymmetric webhook signatures, IP/rate controls where appropriate, and secret rotation. Reject unsigned or stale callbacks. Log event IDs and outcomes without logging clinical payloads.

### Storage and Encryption

Keep referral metadata separate from clinical information. Encrypt sensitive data in transit and at rest with managed keys, documented rotation, restricted key administrators, encrypted backups, and tested restoration. Avoid persistent local files. Confirm every cloud service that handles ePHI signs an appropriate BAA; encryption alone does not eliminate business-associate status.[2]

### Audit and Monitoring

Record authentication, consent, referral creation, data release, provider access, administrative change, export, deletion, and integration failure events. Logs should identify actor, action, target, time, result, and correlation ID without duplicating clinical content. Protect logs from alteration, restrict access, define retention, monitor anomalies, and review privileged activity.

### Privacy-Safe Analytics

Do not send health content, provider specialty choices that reveal conditions, appointment reasons, record identifiers, or user IDs to general analytics or advertising tools. Disable third-party pixels on handoff, consent, intake, and appointment pages unless specifically approved for the data and legal context.

### Reliability and Incident Response

Define availability, support severity, recovery objectives, backups, data portability, and exit procedures. Maintain named 24/7 security contacts, evidence-preservation procedures, breach decision ownership, notification timelines, user-notice templates, regulator coordination, and at least annual tabletop exercises. HHS identifies incident procedures, contingency planning, audit controls, and periodic evaluation as core safeguards.[3]

### Interoperability

If clinical exchange becomes necessary, prefer a documented standards-based interface such as FHIR with narrowly scoped resources and permissions. Validate resource ownership and patient identity; use separate test tenants and synthetic data; and prohibit production PHI in developer tools, screenshots, issue trackers, or test fixtures.

## Go-Live Gates

| Gate | Pass condition |
|---|---|
| Legal role | Written counsel determination for each data flow and state launch scope |
| Contracts | Services agreement, BAA if applicable, privacy/security exhibits, SLA, and subprocessors approved |
| Provider eligibility | License/location rules, credentialing, malpractice, and consent ownership documented |
| Data boundary | Production data-flow diagram and inventory match the implemented system |
| Security | Risk analysis, penetration test, access review, backup restore, webhook test, and incident tabletop completed |
| Privacy | Updated Terms/Privacy, pre-handoff notice, consent records, user-rights workflow, and no-PHI analytics validation completed |
| Operations | Support routing clearly separates navigation issues from clinical, billing, record, and emergency matters |
| Release | Legal, privacy, security, engineering, and business owners sign the production approval record |

## References

[1]: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html "HHS — Business Associates"
[2]: https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html "HHS — Guidance on HIPAA and Cloud Computing"
[3]: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html "HHS — Summary of the HIPAA Security Rule"
[4]: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html "HHS — Sample Business Associate Agreement Provisions"
[5]: https://telehealth.hhs.gov/licensure/licensing-across-state-lines "HHS — Licensing across state lines"
[6]: https://telehealth.hhs.gov/providers/preparing-patients-for-telehealth/obtaining-informed-consent "HHS — Obtaining informed consent"
