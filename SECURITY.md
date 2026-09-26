# Security policy

## Supported versions

Security fixes go into the latest release only. Update to it before reporting.

## Reporting a vulnerability

Report privately through GitHub: open the repository's **Security** tab and choose **Report a vulnerability** ([direct link](https://github.com/jboho/md-to-pdf/security/advisories/new)). Please don't open a public issue for a security problem.

Include the app version (**MD to PDF → About MD to PDF**), your macOS version, steps to reproduce, and what an attacker gains.

## What counts

MD to PDF is meant to work fully offline and to treat the Markdown you open as untrusted. Examples of things worth reporting:

- A document that makes the app load anything from the network, run script, or navigate away from the app.
- A document or file name that writes a PDF outside the chosen output folder.
- A way to make the signed app run code other than its own, for example through environment variables or files placed next to it.

The in-app feedback form only opens a prefilled GitHub issue in your browser; it sends nothing on its own.
