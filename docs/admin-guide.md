# Admin guide

## Becoming an admin

Admins are created in the database. Register a normal account, then set its role:

```js
db.users.updateOne({ email: 'you@example.com' }, { $set: { role: 'admin' } });
```

Sign out and back in. The sidebar and the menu next to the bell now include **Admin**.

## Admin dashboard

The dashboard at `/admin` has four tabs.

### Overview

Totals for users, channels, published videos, comments, total views, pending reports and banned users.

### Users

Search by name, username or email. **Ban** asks for an optional reason and blocks the account immediately. **Unban** restores it. You cannot ban yourself.

### Videos

Filter by status (processing, published, failed). **Delete** removes a video together with its comments, reactions, views, history entries, playlist entries and Cloudinary files.

### Audit log

Every admin action is recorded with the actor, the action, the target and the time. Examples: `admin.banUser`, `admin.unbanUser`, `admin.deleteVideo`, `admin.deleteComment`, `admin.setChannelVerification` and `admin.reviewReport`.

## Actions available through the API

These actions do not have a screen yet and are used through the API (see `docs/api.md`):

| Task               | Request                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Verify a channel   | `PATCH /api/v1/admin/channels/:channelId/verify` with `{ "isVerified": true }`             |
| Delete any comment | `DELETE /api/v1/admin/comments/:commentId`                                                 |
| List reports       | `GET /api/v1/reports?status=pending`                                                       |
| Review a report    | `PATCH /api/v1/reports/:reportId` with `{ "status": "resolved", "reviewNote": "Removed" }` |

Report statuses are `pending`, `reviewing`, `resolved` and `dismissed`. Reviewing a report records who handled it and appears in the audit log.

## Moderation workflow

1. Check the Overview tab for pending reports.
2. List pending reports and open the reported content.
3. Delete the content or ban the user if it breaks the rules.
4. Mark the report `resolved` with a note, or `dismissed` if no action is needed.
5. Review the audit log regularly.

## Good practice

- Give a reason whenever you ban a user.
- Keep the number of admin accounts small.
- Do not use the seeded demo accounts as admins in production.
## Reports and verification

The **Reports** tab lists reports by status (pending, reviewing, resolved, dismissed). Each row links to the reported video, comment, channel or user. **Review** marks a report as being looked at, **Resolve** closes it after action was taken, and **Dismiss** closes it with no action. Each action asks for an optional note that is saved with the report and written to the audit log.

On any channel page, admins see **Verify channel** or **Remove badge** to toggle the verified badge.

Deleting a comment is still done through the API:

`DELETE /api/v1/admin/comments/:commentId`
