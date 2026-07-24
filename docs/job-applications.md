# Job Application Tracker

> Personal operating document for Andy's Sydney job search. This file is the source of truth for application status until the RoleMate dashboard persists the same data locally.
>
> Last verified: 2026-07-24 (Australia/Sydney)

## Status rules

Only two application states are used:

- **TBS — To Be Submitted:** selected for application, but final submission has not been explicitly confirmed.
- **Submitted:** Andy has explicitly confirmed the application was submitted. Record the submission date and a follow-up due date.

Safety and workflow rules:

1. Never move an application to `Submitted` without Andy's explicit confirmation.
2. Never submit an application automatically without explicit authorization.
3. Default follow-up due date is **7 calendar days after submission**, unless the employer provides a different timeline.
4. A follow-up reminder may mean checking the ATS portal/email rather than contacting a recruiter when no suitable contact exists.
5. Record meaningful outcomes in `Latest update`: online assessment, interview, rejection, withdrawal, offer, or employer communication.

## TBS — To Be Submitted

The links below were individually checked on 2026-07-24. Prefer employer-hosted application pages where available.

| Priority | Company | Exact role | Recommended resume | Deadline | Eligibility / rationale | Direct application |
|---|---|---|---|---|---|---|
| P0 | Nuix | Associate Software Engineer, AI Team | Industrial, one page | Rolling | Best overall match: Java/Python/React/TypeScript, AI/agentic product work, Scrum and testing | [Apply / listing](https://au.linkedin.com/jobs/view/associate-software-engineer-ai-team-at-nuix-4442594641) |
| P0 | TikTok | Backend Software Engineer Graduate (Trust and Safety Engineering) — 2027 Start (BS/MS), Job Code A144848 | Industrial, one page | Rolling | Strong backend and platform fit; international applicants considered; one of only two TikTok applications | [Official application](https://lifeattiktok.com/search/7605166042878068997) |
| P0 | TikTok | Machine Learning Engineer Graduate (Trust and Safety Engineering) — 2027 Start (BS/MS), Job Code A61654 | Research, two pages | Rolling | Strong match to LLM research, PyTorch, experimental design and statistical analysis; use as second TikTok application | [Official application](https://lifeattiktok.com/search/7605165402553944325) |
| P0 | Arista Networks | Graduate Software Engineer, EOS — Sydney | Industrial, one page | Rolling | Very strong networking/systems match: Java sockets, TCP/UDP, RDT, C, algorithms and Linux; student visa explicitly accepted | [Direct listing](https://au.linkedin.com/jobs/view/graduate-software-engineer-eos-sydney-at-arista-networks-4439161117) |
| P0 | Freelancer.com | Software Engineering Internship (Dec 2026–March 2027) | Industrial, one page | Rolling | Final-year candidates accepted; TypeScript, Python, SQL, Linux and production web work match; potential junior conversion | [Direct listing](https://au.linkedin.com/jobs/view/software-engineering-internship-dec-2026-march-2027-at-freelancer-com-4432319333) |
| P0 | Citadel Securities | Software Engineer — Intern (Australia) | Research, two pages | Rolling | Strong algorithms, statistics, Python and systems profile; official Sydney application is open | [Official application](https://www.citadelsecurities.com/careers/details/software-engineer-intern-australia/) |
| P0 | ResMed | Graduate Software Engineer | Industrial, one page | Rolling | AWS, programming, CI/CD and test-engineering role; WorkTrace and software-engineering projects are relevant | [Direct listing](https://au.linkedin.com/jobs/view/graduate-software-engineer-at-resmed-4414656386) |
| P1 | MYOB | Associate Developer — MYOB Business | Industrial, one page | Rolling | Full-stack SaaS role using React, Node/JavaScript, SQL, AWS/Azure and CI/CD; apply despite C#/.NET gap | [Direct listing](https://au.linkedin.com/jobs/view/associate-developer-at-myob-4438154848) |
| P1 | swipejobs | AI Graduate Program | Research, two pages | Rolling | Direct fit to Python, AI/ML experimentation, agentic products, analytics and technical product leadership | [Direct listing](https://au.linkedin.com/jobs/view/ai-graduate-program-at-swipejobs-4376974326) |

### TikTok application decision

TikTok permits at most two applications globally and considers them in application order. Recommended order:

1. Backend Software Engineer Graduate — Trust & Safety.
2. Machine Learning Engineer Graduate — Trust & Safety.

Do not use a slot on the weaker-fit TikTok LIVE frontend/mobile/intern roles unless one of the two recommended roles closes.

## Submitted — Follow-up Required

Move an entry here only after explicit confirmation.

| Company | Exact role | Submitted on | Follow-up due | Latest update | Application / portal link |
|---|---|---|---|---|---|
| Amazon Web Services | Software Development Graduate, AWS, 2027 Sydney — Job ID 10462014 | 2026-07-24 | 2026-07-31 | Application submitted. Required online assessment is pending and expires **2026-08-23 18:34 Australia/Sydney**. | [Official application](https://www.amazon.jobs/en-gb/jobs/10462014/software-development-graduate-aws-2027-sydney) |

## Active application tasks

Treat these as part of the same preparation queue as remaining resume submissions. Do not mark a task complete without Andy's confirmation.

| Priority | Company | Task | Due | Preparation / completion criteria |
|---|---|---|---|---|
| P0 | Amazon Web Services | Prepare for and complete the required online assessment for Job ID 10462014 | 2026-08-23 18:34 Australia/Sydney | Practise timed data-structures and algorithms coding in the chosen language; review Amazon Leadership Principles and Workstyles scenarios; read the provider instructions and system requirements before starting; complete the assessment before expiry. |

## Removed from active TBS after verification

These were previously listed but are not currently valid active applications for Andy.

- **IAG — Digital Retail Engineering & Operations Graduate Program 2027:** the exact official job page now says the position has been filled, despite the general graduate-program page still showing a second intake.
- **Schneider Electric — 2027 Graduate Program, Technical:** requires the applicant to already be a citizen/PR or hold a subclass 485 visa with at least two years remaining at the time of application. A current student visa does not satisfy the published requirement.
- **Westpac — Technology Cyber / Engineering / Data, Digital & AI Graduate Programs:** requires Australian/NZ citizenship or Australian permanent residency at application.
- **EY — 2027 Graduate Program:** the standard program requires citizen/PR status. International students can only submit an Expression of Interest, must independently obtain PR or another suitable visa, and EY does not sponsor residency.
- **Citadel Securities — 2027 Graduate Quantitative Trader:** substantially weaker fit than Software Engineering; no current official Sydney graduate-specific application page was verified.
- **TikTok — Software Engineer Intern, TikTok LIVE:** weaker than the two recommended TikTok graduate roles and consumes one of the two global application slots.

## Watchlist / currently not eligible

- **Optiver — Graduate Software Developer 2027:** expression of interest only; formal applications closed.
- **The GPT Group — Technology Graduate:** unrestricted work rights required.
- **Accenture — Junior Desktop Engineers:** Australian citizen or permanent resident only; also asks for desktop-support experience.
- **DXC Technology — Technical Graduate Pathways:** closed and citizen/PR only.
- **Mastercard — Software Engineer Launch:** citizen/PR only.
- **Rabobank — Technology Graduate:** citizen/PR only.
- **Amazon — 2026 SDE Internship:** must return to study after internship.
- **The Trade Desk — Software Engineering Internship:** graduation window is May 2027–March 2028.
- **Macquarie — Technology Summer Internship:** second-last-year students only.

## Update protocol

When Andy reports a submission, update the document in one commit:

1. Remove the role from `TBS`.
2. Add it to `Submitted`.
3. Set `Submitted on` to the confirmed date.
4. Set `Follow-up due` to seven calendar days later unless a different employer timeline is known.
5. Preserve the original listing or application portal link.
6. Add any mandatory assessment, interview, or document request to `Active application tasks` with its exact deadline.