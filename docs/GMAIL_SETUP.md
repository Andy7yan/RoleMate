# Gmail setup

The repository ships a `GmailConnector` contract and a fixture-backed mock. A live connector is not enabled because a public OAuth client requires a project owner, consent-screen configuration and possibly Google verification.

For local development, a contributor can create a Google Cloud OAuth desktop client and supply its client configuration outside the repository. Passwords are never accepted. Refresh and access tokens belong in Windows Credential Manager through the secure-storage abstraction, not in SQLite, the Vault or `.env` files.

The intended live flow is:

1. User starts OAuth from the Gmail screen.
2. Google returns a token to a loopback callback.
3. OpenJobAgent stores the token in the OS credential store.
4. Search finds confirmations, assessments, interviews, recruiter mail, rejections and offers.
5. Classification links a message to an application after review.
6. Draft replies remain drafts until the user approves sending.

The mock covers search, classification, drafting and the approval gate. It does not prove Google API connectivity.
