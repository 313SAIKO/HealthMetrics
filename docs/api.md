# API contract

All endpoints are served by the same origin. Authenticated requests use Better Auth's HttpOnly session cookie. Responses containing personal records are not cacheable. Send `Content-Type: application/json` and the configured `Origin` on mutations.

## Authentication

| Method | Route | Body / response |
| --- | --- | --- |
| POST | `/api/auth/sign-up/email` | `{name, email, password}`; creates an account and session. |
| POST | `/api/auth/sign-in/email` | `{email, password}`; creates a session. |
| POST | `/api/auth/sign-out` | `{}`; revokes the current session. |
| GET | `/api/auth/get-session` | `{user, session}` or `null`. |

Passwords are handled by Better Auth; the application never stores plaintext passwords. Public deployments must use HTTPS. Registration does not verify ownership of an email address in this release.

## Assessments

| Method | Route | Result |
| --- | --- | --- |
| GET | `/api/assessments` | `{items, total, page, pageSize}`. |
| POST | `/api/assessments` | Creates and returns an assessment. |
| GET | `/api/assessments/:id` | Returns one owned assessment. |
| PATCH | `/api/assessments/:id` | Replaces its input and returns a recomputed assessment. |
| DELETE | `/api/assessments/:id` | Deletes an owned assessment; status 204. |

List query parameters: `from` and `to` as inclusive `YYYY-MM-DD` dates; `page` and `pageSize` for bounded pagination. An empty list is a successful response, not an error.

Create and PATCH accept a full input object:

```json
{
  "title": "Morning measurement",
  "measuredAt": "2026-11-20",
  "profile": {
    "gender": "M",
    "age": 30,
    "weight": 70,
    "height": 175,
    "activityMultiplier": 1.2
  }
}
```

The server derives the owner from the session, validates all values, and computes `result` itself. An assessment response includes `id`, `title`, `measuredAt`, `profile`, `result`, `formulaVersion`, `createdAt` and `updatedAt`. Do not submit an owner or a computed result.

Application errors have shape `{error: {code, message?, fields?}}`. Typical statuses are 400 for invalid input, 401 for absent/expired sessions, 403 for an invalid origin and 404 for a record that is absent or belongs to someone else. Auth endpoints use Better Auth's standard error format. The UI translates error codes rather than exposing internal server messages.
