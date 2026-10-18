# Licensed Care Connections — Authoritative Research Notes

**Prepared:** September 10, 2026  
**Scope:** U.S.-oriented planning notes for attorney and compliance review; not legal advice.

## Key findings

1. HHS states that all telehealth services provided by HIPAA-covered health care providers and health plans must comply with HIPAA. Covered entities should use remote-communication vendors that comply with HIPAA and will enter into Business Associate Agreements (BAAs). [1]
2. A business associate is an entity that creates, receives, maintains, or transmits PHI on behalf of a covered entity. HHS expressly includes certain health-app developers, cloud providers, IT vendors, and patient-portal chat or scheduling vendors when their services involve PHI. [2]
3. A BAA must define permitted and required PHI uses/disclosures, prohibit other uses except as required by law, require applicable Security Rule compliance, require security-incident and breach reporting, and bind downstream subcontractors that handle PHI. Known material violations must be cured or the agreement terminated if feasible. [2]
4. A provider-to-provider disclosure for treatment may not require a BAA when each provider acts independently for treatment; the exact contractual and data-flow relationship determines whether Patients Compass is a referral source, business associate, subcontractor, or separate consumer-health service. [2]
5. Cross-state telehealth practice depends on state law. Options may include a full license, temporary practice, reciprocity, compact participation, or telehealth registration. Providers should verify the patient’s physical location and obtain consent before the appointment. [3]
6. Telehealth consent requirements vary by state. HHS recommends explaining what the visit involves, patient rights and privacy responsibilities, observers, forms, and documenting required consent before or during check-in. Intake and consent forms should receive legal review. [4]
7. Federal and state privacy laws can apply beyond HIPAA. HHS notes that states increasingly regulate consumer health data and commonly require transparency, restrictions on commercial use, and stronger user control. [5]
8. The FTC Health Breach Notification Rule can apply to non-HIPAA health apps, personal-health-record vendors, related entities, and service providers. Unauthorized disclosure—not only hacking—may trigger notification. July 2024 amendments clarify coverage of health apps and similar technologies. [6]
9. Under the FTC rule, covered breaches can require notice to affected U.S. individuals, the FTC, and sometimes media, generally without unreasonable delay and no later than 60 calendar days for individual notices. HIPAA-covered entities and business associates instead follow HHS breach duties for PHI; an organization operating in both roles may face both regimes. [6]
10. The HIPAA Security Rule requires an accurate and thorough risk analysis plus reasonable administrative, physical, and technical safeguards. HHS identifies access control, audit controls, data integrity, authentication, transmission security, incident procedures, contingency planning, workforce training, and periodic evaluation as core controls. [7]
11. A cloud provider that stores or processes ePHI on behalf of a covered entity or business associate is itself a business associate, even if the data is encrypted and the provider lacks the decryption key. A compliant BAA is required before that storage or processing begins. [8]
12. HHS recommends documenting the shared-responsibility model between customer and cloud/technology vendor. Related service-level terms should address availability, backups and recovery, data return after termination, security responsibilities, retention, and disclosure limits without conflicting with the BAA. [8]
13. HHS sample BAA provisions cover permitted uses, safeguards, incident and breach reporting, downstream subcontractors, access/amendment/accounting support, HHS access to records, return or destruction at termination, and termination rights for material breach. HHS warns that sample language may not satisfy state contract law and does not replace legal review. [9]

## Product implication

The lowest-risk initial implementation is a **partner referral and scheduling handoff** in which Patients Compass remains an education/navigation service, shares no health information by default, and sends the user to an independently operated licensed-provider platform. Any embedded intake, document exchange, clinical messaging, appointment management, or PHI synchronization requires a data-flow-specific legal classification, signed contracts, security review, consent design, and incident-response allocation before launch.

## Sources

[1]: https://telehealth.hhs.gov/providers/telehealth-policy/hipaa-for-telehealth-technology "HHS — HIPAA Rules for telehealth technology"
[2]: https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html "HHS — Business Associates"
[3]: https://telehealth.hhs.gov/licensure/licensing-across-state-lines "HHS — Licensing across state lines"
[4]: https://telehealth.hhs.gov/providers/preparing-patients-for-telehealth/obtaining-informed-consent "HHS — Obtaining informed consent"
[5]: https://telehealth.hhs.gov/providers/best-practice-guides/privacy-and-security-telehealth/privacy-laws-and-policy-guidance "HHS — Privacy laws and policy guidance"
[6]: https://www.ftc.gov/business-guidance/resources/complying-ftcs-health-breach-notification-rule-0 "FTC — Complying with the Health Breach Notification Rule"
[7]: https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html "HHS — Summary of the HIPAA Security Rule"
[8]: https://www.hhs.gov/hipaa/for-professionals/special-topics/health-information-technology/cloud-computing/index.html "HHS — Guidance on HIPAA and Cloud Computing"
[9]: https://www.hhs.gov/hipaa/for-professionals/covered-entities/sample-business-associate-agreement-provisions/index.html "HHS — Sample Business Associate Agreement Provisions"
