# Playwright API Test Framework

A modular and scalable API test automation framework built with [Playwright](https://playwright.dev/), designed for maintainability, environment flexibility, and dynamic service switching.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [How baseURL Works](#how-baseurl-works)
- [Writing Tests](#writing-tests)
- [Dynamic URL Switching](#dynamic-url-switching)
- [Verification Methods](#verification-methods)
- [Utility Methods](#utility-methods)
- [Jira Integration](#jira-integration)
- [Running Tests](#running-tests)
- [Reports](#reports)

---

## Features

- **Environment-based configuration** — Switch between DEV, STG, PRD via `.env`
- **Dynamic URL switching** — Switch between multiple service URLs within a single test
- **Data-driven testing** — Test data separated from test logic
- **Path parameter support** — Automatic path parameter substitution in endpoints
- **Header normalization** — Underscores in header keys auto-converted to hyphens
- **Token masking** — Sensitive tokens masked in console logs
- **API request logging** — Automatic detailed logging of all API requests/responses
- **Jira integration** — Automatic bug ticket creation on test failure
- **Multiple reporters** — HTML, JSON, Allure, and Jira

---

## Project Structure

```
Playwright-API/
├── .env                                # Environment variables
├── playwright.config.js                 # Playwright configuration
├── fixtures/
│   └── api.fixture.js                  # Custom test fixture for API requests
├── resources/
│   ├── apiactions/
│   │   ├── base.js                     # API request handler (sendRequest, useService)
│   │   └── verifications.js            # Response verification methods
│   ├── data/
│   │   ├── constant/
│   │   │   └── endpoints.js            # API endpoint definitions
│   │   ├── json/
│   │   │   └── config.json             # Per-environment configuration (URLs, tokens)
│   │   └── test/
│   │       └── user.js                 # Test data for user tests
│   ├── dataobjects/
│   │   └── config.js                   # Config reader functions
│   └── utility/
│       ├── utility.js                   # Utility helpers (logging, random data, dates)
│       ├── jira.reporter.js            # Custom Playwright reporter for Jira
│       └── jira.service.js             # Jira API service
├── tests/
│   └── user.spec.js                    # User API test cases
└── reports/
    └── json-report/                    # JSON test reports
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm

### Installation

```bash
npm install
```

### Install Playwright Browsers

```bash
npx playwright install
```

---

## Configuration

### Environment Variables (`.env`)

```env
# Target environment: DEV, STG, PRD
environment = STG
region = KOREA

# Jira Integration (optional)
JIRA_ENABLED=false
JIRA_BASE_URL=
JIRA_EMAIL=
JIRA_API_TOKEN=
JIRA_PROJECT_KEY=
JIRA_DEFAULT_ASSIGNEE=
```

### Environment Config (`resources/data/json/config.json`)

Each environment has its own set of configuration values:

```json
{
  "STG": {
    "baseUrl": "",
    "apiBaseUrl": "http://localhost:3000",
    "userName": "",
    "password": "",
    "token": "Bearer <your-token>",
    "services": {
      "user": "http://localhost:3000",
      "payment": "http://localhost:4000",
      "notification": "http://localhost:5000"
    }
  },
  "PRD": {
    "baseUrl": "",
    "apiBaseUrl": "",
    "userName": "",
    "password": "",
    "token": "",
    "services": {
      "user": "",
      "payment": "",
      "notification": ""
    }
  }
}
```

| Field | Description |
|-------|-------------|
| `baseUrl` | Base URL for UI testing |
| `apiBaseUrl` | Default base URL for API testing |
| `userName` | Username for authentication |
| `password` | Password for authentication |
| `token` | Authorization token |
| `services` | Named service URLs for dynamic switching |

### Config Reader (`resources/dataobjects/config.js`)

Provides accessor functions for the current environment's configuration:

| Function | Returns |
|----------|---------|
| `getBaseUrl()` | UI base URL |
| `getApiBaseUrl()` | Default API base URL |
| `getUserName()` | Username |
| `getPassword()` | Password |
| `getToken()` | Auth token |
| `getServiceUrl(serviceName)` | URL for a named service |

---

## How baseURL Works

The framework resolves the full API URL through this flow:

```
.env (environment=STG)
  → config.json (STG.apiBaseUrl = "http://localhost:3000")
  → config.js getApiBaseUrl()
  → playwright.config.js use.baseURL
  → Playwright's APIRequestContext (auto-prepends baseURL to relative paths)
  → Tests use relative endpoints (e.g., "/api/users") which resolve to full URLs
```

1. The `.env` file sets the active environment (`environment = STG`)
2. `config.json` maps each environment to its configuration values
3. `config.js` reads the environment variable and returns the corresponding `apiBaseUrl`
4. `playwright.config.js` assigns this to Playwright's `baseURL` option
5. Playwright's `APIRequestContext` automatically prepends the `baseURL` to all relative endpoint paths

---

## Writing Tests

### Test Structure

Tests use the custom `apitest` fixture which provides the `api` object:

```js
import apitest from '../fixtures/api.fixture.js';
import Verifications from '../resources/apiactions/verifications.js';
import { testData } from '../resources/data/test/user.js';
import { endpoints } from '../resources/data/constant/endpoints.js';

apitest('TC01 - Get API Users', async ({ api }) => {
    await api.sendApiRequest('GET', endpoints.users, testData.tc01);
    await Verifications.verifyStatusCode(api.response, 200);
});
```

### Test Data Format (`resources/data/test/`)

Test data is defined as objects with the following structure:

```js
const testData = {
    tc01: {
        headers: { Authorization: "Bearer <token>" },
        params: {},           // Query parameters
        body: null,           // Request body (for POST/PUT/PATCH)
        pathParams: {},        // Path parameters (e.g., { id: '2' })
        response: {}           // Expected response (for exact match verification)
    }
};
```

### Endpoint Definitions (`resources/data/constant/endpoints.js`)

Endpoints are defined as relative paths with optional path parameter placeholders:

```js
const endpoints = {
    users: '/api/users',
    userById: '/api/users/{id}',
}
```

---

## Dynamic URL Switching

The framework supports switching between different service URLs within a test using `api.useService(serviceName)`.

### Setup

Define service URLs in `config.json` under the `services` key for each environment:

```json
{
  "STG": {
    "apiBaseUrl": "http://localhost:3000",
    "services": {
      "user": "http://localhost:3000",
      "payment": "http://localhost:4000",
      "notification": "http://localhost:5000"
    }
  }
}
```

### Usage

```js
// Use default URL (from playwright.config.js baseURL) — no switch needed
apitest('Default service test', async ({ api }) => {
    await api.sendApiRequest('GET', endpoints.users, testData.tc01);
});

// Switch to a specific service
apitest('Payment service test', async ({ api }) => {
    await api.useService('payment');
    await api.sendApiRequest('GET', endpoints.payments, testData.tc02);
});

// Switch multiple times in a single test
apitest('Cross-service test', async ({ api }) => {
    await api.useService('user');
    await api.sendApiRequest('GET', endpoints.users, testData.tc01);

    await api.useService('notification');
    await api.sendApiRequest('POST', endpoints.notify, testData.tc03);
});
```

> **Note:** `useService()` disposes the current API request context and creates a new one with the service's base URL. It is an async method — always use `await`.

---

## Verification Methods

The `Verifications` class (`resources/apiactions/verifications.js`) provides the following assertion methods:

| Method | Description |
|--------|-------------|
| `verifyStatusCode(response, expectedCode)` | Asserts the HTTP status code |
| `verifyResponseBodyProperty(responseBody, key, expectedValue)` | Asserts a specific property value |
| `verifyResponseBodyContains(responseBody, expectedKeyValues)` | Asserts multiple key-value pairs in the response |
| `verifyResponseBodyHasKey(responseBody, key)` | Asserts a key exists in the response |
| `verifyResponseBodyIsArray(responseBody)` | Asserts the response body is an array |
| `verifyResponseBodyArrayLength(responseBody, expectedLength)` | Asserts the array length |
| `verifyResponseExactMatch(actualResponseBody, expectedResponse)` | Asserts the entire response matches exactly |

### Example

```js
await Verifications.verifyStatusCode(api.response, 200);
await Verifications.verifyResponseBodyContains(api.responseBody, {
    success: true,
    message: 'Users retrieved successfully.'
});
await Verifications.verifyResponseBodyProperty(api.responseBody.data[0], 'role', 'admin');
```

---

## Utility Methods

The `Utility` class (`resources/utility/utility.js`) provides helper methods:

| Method | Description |
|--------|-------------|
| `generateRandomChar(length)` | Generates a random alphanumeric string |
| `generateRandomNumber(min, max)` | Generates a random integer within a range |
| `generateRandomIpAddress()` | Generates a random IP address (192.168.x.x) |
| `getDateToday(format)` | Returns today's date (`shortDate`, `YYYY-MM-DD`, `mmddyyyy`) |
| `logApiDetails(method, endpoint, headers, body, status, responseBody)` | Logs API request/response details with token masking |

---

## Jira Integration

The framework can automatically create Jira bug tickets when tests fail.

### Setup

1. Enable Jira in `.env`:
   ```env
   JIRA_ENABLED=true
   JIRA_BASE_URL=https://jira.company.com
   JIRA_API_TOKEN=your-personal-access-token
   JIRA_PROJECT_KEY=PROJ
   JIRA_DEFAULT_ASSIGNEE=username
   ```

2. The custom reporter (`resources/utility/jira.reporter.js`) is already configured in `playwright.config.js`.

### Behavior

- When a test fails, the reporter checks if an existing open ticket with the same test name exists
- If found, it adds a comment with the new failure details
- If not found, it creates a new bug ticket with error details, stack trace, and environment info
- Tickets are labeled with `automated-test` and `test-failure`

---

## Running Tests

### NPM Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test-dev` | Run tests against DEV environment |
| `npm run test-stg` | Run tests against STG environment |
| `npm run test-prd` | Run tests against PRD environment |
| `npm run test-smoke` | Run tests tagged with `@smoke` |
| `npm run test-chrome` | Run tests on Chrome |
| `npm run report` | Open HTML test report |
| `npm run allure-report` | Generate and open Allure report |

### Direct Commands

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/user.spec.js

# Run against a specific environment
ENV=STG npx playwright test

# Run tests with a specific tag
npx playwright test --grep @smoke

# Run tests in headed mode (for debugging)
npx playwright test --headed

# View test trace
npx playwright show-trace
```

---

## Reports

The framework generates multiple report formats:

| Report | Location |
|--------|----------|
| HTML Report | `reports/playwright-report/` |
| JSON Report | `reports/json-report/report.json` |
| Allure Report | `reports/allure-results/` |

To open the HTML report:
```bash
npm run report
```

To generate and open the Allure report:
```bash
npm run allure-report
```

---

## Author

**Mark Angelo M. Remos**
