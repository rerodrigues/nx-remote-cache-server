# Security Policy

## Supported versions

Security fixes go into the latest release of each package in this repository. Older versions do not receive backports, so please upgrade to the latest release before reporting an issue.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Use GitHub's private vulnerability reporting: open the [Security tab](https://github.com/rerodrigues/nx-remote-cache-server/security) of this repository and choose "Report a vulnerability". Only the maintainer can see the report.

Please include:

- The affected package and version, or the Docker image and tag.
- Steps to reproduce, or a proof of concept.
- The impact you expect, for example cache poisoning, unauthorized access or information disclosure.

## What to expect

- An acknowledgment of your report within a few days.
- An assessment and, if the report is confirmed, a fix timeline.
- Credit in the published security advisory, if you want it.

This project is maintained in spare time, so response times are best effort. Please give the maintainer a reasonable chance to release a fix before you disclose the issue publicly.

## Scope

In scope: the packages in this repository and the Cacheiro Instants Docker images published to GHCR.

Out of scope: vulnerabilities in third-party dependencies that are not reachable through Cacheiro, and deployments that run without `auth.token` on an untrusted network. Running without authentication is supported but documented as unsafe outside a trusted network.
