# Security policy

## Supported versions

Hardvoxel is alpha software. Security fixes are applied to the latest commit on `main`.

## Reporting a vulnerability

Do not open a public issue.

Email `hello@hardvoxel.com` with:

- a description of the issue;
- the affected version or commit;
- a minimal reproduction, if possible;
- any suggested fix.

You will get an acknowledgement within a few days. Please give time for a fix before public
disclosure.

## Scope

The CLI runs Docker commands on the machine where it is invoked. It does not expose a network
service by itself. Vulnerabilities in Docker, the host operating system, or third-party images
are out of scope for this project.
