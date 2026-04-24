# Zivo Privacy Policy

**Last updated: 2026-04-25**

## Overview

Zivo is a Chrome extension that helps users find the cheapest flight combinations on Korean–Japanese routes and autofills booking forms with saved passenger information.

## Data We Collect

### Stored Locally (chrome.storage.sync)

- Passenger name (English romanization)
- Date of birth
- Phone number
- Frequently used routes

Passport number and passport expiry date are **never** stored in `chrome.storage.sync` or any local storage.

### Stored on Server (encrypted)

When you save your profile:

- Passport number — encrypted with **AES-256-GCM** before being written to the database. The plaintext never leaves the server.
- Passport expiry date — encrypted with **AES-256-GCM**.
- A randomly generated device UUID used to identify your profile (no account required).

### Flight Search Data

- Search queries (origin, destination, dates) are sent to our backend server to retrieve flight offers from Duffel. They are not logged beyond standard server access logs.
- Search results are cached in Redis for 5 minutes to improve performance.

## Data We Do NOT Collect

- Credit card numbers, CVV, or any payment information. All payments are processed directly on the airline's or OTA's website.
- Browsing history outside of the matched airline booking pages listed in the extension manifest.
- Any data from pages not listed in `content_scripts.matches`.

## Autofill Behavior

The extension injects a content script **only** on the following airline booking sites:

- koreanair.com · flyasiana.com · jal.co.jp · ana.co.jp
- jejuair.net · jinair.com · airbusan.com · twayair.com
- flypeach.com · jetstar.com

When a matching page is detected, Zivo reads your saved profile from `chrome.storage.sync` and fills the passenger form fields. No data is sent to any third party during autofill.

## Data Sharing

We do not sell, rent, or share your personal information with third parties. Flight search queries are forwarded to the **Duffel** flights API solely to retrieve available offers.

## Data Deletion

To delete your data, uninstall the extension. Locally cached profile data in `chrome.storage.sync` is removed automatically by Chrome upon uninstall. To remove server-side encrypted data, contact us at the email below.

## Security

- AES-256-GCM encryption for all sensitive fields at rest
- TLS 1.3 for all client–server communication
- JWT authentication with short-lived tokens
- No plaintext passport or biometric data is ever logged

## Contact

For privacy questions or data deletion requests: **youngg662@naver.com**
