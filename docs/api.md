# API Reference

Base URL: `http://localhost:5000/api`

All responses are JSON.

- Success: `{ "success": true, "data": ..., "meta": ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`

Authenticated routes need `Authorization: Bearer <accessToken>`. The refresh token lives in an httpOnly cookie (`refresh_token`, path `/api/auth`) and is never returned in the body.

## Auth

| Method | Path                      | Auth   | Body                                  | Notes                                                        |
| ------ | ------------------------- | ------ | ------------------------------------- | ------------------------------------------------------------ |
| POST   | /auth/register            | -      | email, password, displayName, handle? | Creates user and channel; returns user, channel, accessToken |
| POST   | /auth/login               | -      | email, password                       | Returns user, channel, accessToken                           |
| POST   | /auth/refresh             | cookie | -                                     | Rotates the refresh token; returns new accessToken           |
| POST   | /auth/logout              | cookie | -                                     | Revokes the current refresh token                            |
| POST   | /auth/logout-all          | yes    | -                                     | Revokes all sessions                                         |
| GET    | /auth/me                  | yes    | -                                     | Current user and channel                                     |
| POST   | /auth/verify-email        | -      | token                                 | Single-use, expires in 24h                                   |
| POST   | /auth/resend-verification | yes    | -                                     | 5 per hour                                                   |
| POST   | /auth/forgot-password     | -      | email                                 | Always returns 200                                           |
| POST   | /auth/reset-password      | -      | token, password                       | Expires in 1h; revokes all sessions                          |
| POST   | /auth/change-password     | yes    | currentPassword, newPassword          | Revokes other sessions; returns a new accessToken            |

## Users

| Method | Path      | Auth | Body                     |
| ------ | --------- | ---- | ------------------------ |
| PATCH  | /users/me | yes  | displayName?, avatarUrl? |
| DELETE | /users/me | yes  | password                 |

## Channels

| Method | Path              | Auth | Body                                                 |
| ------ | ----------------- | ---- | ---------------------------------------------------- |
| GET    | /channels/me      | yes  | -                                                    |
| PATCH  | /channels/me      | yes  | handle?, name?, description?, avatarUrl?, bannerUrl? |
| GET    | /channels/:handle | -    | -                                                    |

## Error codes

`VALIDATION_ERROR`, `INVALID_JSON`, `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `INVALID_CREDENTIALS`, `EMAIL_TAKEN`, `HANDLE_TAKEN`, `ACCOUNT_DISABLED`, `TOKEN_REUSED`, `NOT_FOUND`, `TOO_MANY_REQUESTS`.

On `TOKEN_EXPIRED` the client should call `POST /auth/refresh` once, then retry the request.

## Rate limits

- General API: 600 requests per 15 minutes per IP
- Auth endpoints: 20 per 15 minutes
- Forgot-password and resend-verification: 5 per hour
