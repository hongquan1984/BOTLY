# Secret scanning

Enable the repository pre-commit check once per checkout:

```powershell
git config --local core.hooksPath .githooks
```

The hook scans staged blobs before a commit and blocks Supabase secret API key formats and JWTs whose decoded role is `service_role`. Run `npm run secrets:scan` for a workspace source scan and `npm run secrets:scan:self-test` to verify the detector. The scan never prints a matched credential.

This local hook is a guardrail, not a substitute for server-side repository secret scanning or credential rotation. If a credential was committed previously, remove it from history only after replacement and revocation, and coordinate any history rewrite with repository collaborators.
