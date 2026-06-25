# Frontend Product Implementation Prompt

Use the following prompt in your frontend creation tool.

---

## Prompt

Build a production-ready frontend for the **DHA Digital Assessment Platform**.

This is an authenticated product application, not a marketing website. The interface should feel like a quiet, professional enterprise operations tool built for repeated daily use.

### Technology

Use:

- Next.js with the App Router
- TypeScript
- Tailwind CSS
- shadcn/ui where useful
- React Hook Form
- Zod validation
- TanStack Query for API state
- Lucide icons

Use server-side Next.js route handlers as a backend-for-frontend layer.

Never expose `API_TOKEN_SECRET` in browser code, client-side environment variables, local storage, page source, or network requests originating directly from the browser. Store it only in a server environment variable such as:

```env
BACKEND_API_URL=http://127.0.0.1:8000
BACKEND_API_TOKEN_SECRET=<server-only-secret>
```

Next.js server route handlers must proxy public authentication requests to the FastAPI backend and attach:

```http
Authorization: Bearer <BACKEND_API_TOKEN_SECRET>
```

### Product Roles

Support exactly two roles:

- `admin`
- `user`

Admin capabilities:

- View the dashboard.
- Run tool synchronization.
- Create baselines.
- Create and update reviews.
- Publish reviews.
- Invite users.
- Invite additional administrators.
- View users and pending invitations.
- Change user roles.
- Activate or disable users.
- Resend or revoke invitations.
- Review authentication audit logs.

User capabilities:

- View the dashboard.
- Run tool synchronization.
- Create baselines.
- Create and update reviews.
- Publish reviews.
- Manage their own profile and password.

Hide admin navigation and actions from users, but also handle backend `403` responses because frontend hiding is not authorization.

### Backend Response Format

All FastAPI responses use:

```ts
type ApiResponse<T> = {
  status: "success" | "error";
  message: string;
  data: T | null;
};
```

Display `message` in toast notifications. For validation responses, show field-level errors when `data.errors` is present.

### Authentication Strategy

Use a secure HTTP-only cookie for the user JWT.

Recommended cookie:

```text
name: dha_access_token
httpOnly: true
secure: true in production
sameSite: lax
path: /
```

Do not store the JWT in local storage.

The Next.js server should:

1. Receive login or password-setup requests from the browser.
2. Call FastAPI.
3. Read `data.access_token`.
4. Store it in the HTTP-only cookie.
5. Return the user profile to the frontend without exposing the token.

For authenticated FastAPI calls, server route handlers must read the JWT cookie and send:

```http
Authorization: Bearer <user-access-token>
```

When FastAPI returns `401`, clear the cookie and redirect the user to `/login`.

When FastAPI returns `403`, show an access-denied state without clearing a valid session.

### User Type

```ts
type UserRole = "admin" | "user";
type UserStatus = "invited" | "active" | "disabled";

type User = {
  id: string;
  username: string | null;
  email: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image: string | null;
  role: UserRole;
  status: UserStatus;
  is_active: boolean;
  is_verified: boolean;
  invited_by: string | null;
  invited_at: string | null;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  permissions: string[];
};
```

### Required Screens

#### 1. Login

Route:

```text
/login
```

Fields:

- Email
- Password
- Show/hide password button
- Sign in button
- Forgot password link

Backend:

```http
POST /login
```

```json
{
  "email": "serviceAccount@cxontology.com",
  "password": "Welcome@123"
}
```

On success:

- Store the access token in an HTTP-only cookie.
- Fetch `/users/me`.
- Redirect to `/dashboard`.

Handle:

- Invalid credentials.
- Disabled accounts.
- Network errors.
- Loading state.

#### 2. Initial Admin Setup

Route:

```text
/setup/admin
```

This is only for the first product deployment.

Fields:

- Username
- Admin email
- Password
- Confirm password

Backend:

```http
POST /signup
```

```json
{
  "username": "service-account",
  "email": "serviceAccount@cxontology.com",
  "password": "Welcome@123"
}
```

If the backend responds that bootstrap has already been completed, redirect to `/login`.

This route should not appear in the standard navigation.

#### 3. Invitation Set Password

Email link format:

```text
/set-password?token=<invitation-token>
```

When the page loads, call:

```http
GET /auth/invitations/verify?token=<invitation-token>
```

Show:

- Invited email
- Assigned role
- Display name
- Invitation expiration

Fields:

- Username
- Password
- Confirm password

Submit:

```http
POST /auth/set-password
```

```json
{
  "token": "<invitation-token>",
  "password": "Welcome@123",
  "username": "new-user"
}
```

On success:

- Store the returned JWT in an HTTP-only cookie.
- Redirect to `/dashboard`.

Show dedicated states for:

- Checking invitation.
- Invalid invitation.
- Expired invitation.
- Revoked invitation.
- Account already activated.

#### 4. Forgot Password

Route:

```text
/forgot-password
```

Backend:

```http
POST /auth/forgot-password
```

```json
{
  "email": "user@cxontology.com"
}
```

Always show the same success message:

```text
If an active account exists for this email, a reset link has been sent.
```

Do not reveal whether the account exists.

#### 5. Reset Password

Email link format:

```text
/reset-password?token=<reset-token>
```

Fields:

- New password
- Confirm new password

Backend:

```http
POST /auth/reset-password
```

```json
{
  "token": "<reset-token>",
  "password": "Updated@123"
}
```

After success, redirect to `/login` with a password-reset confirmation.

#### 6. Dashboard

Route:

```text
/dashboard
```

This is the first authenticated screen.

Build a compact operational dashboard with:

- Current assessment status.
- Recent tool synchronizations.
- Baseline status.
- Reviews awaiting action.
- Recently published reviews.
- Clear primary action to start tool sync.

Do not fabricate backend data. Create typed placeholder service interfaces and polished empty states until product workflow APIs are available.

#### 7. Tool Sync

Route:

```text
/tools/sync
```

The user enters one target website URL and starts the assessment tools.

Show:

- URL input.
- Tool selection.
- Current status per tool.
- Queued, running, completed, and failed states.
- Start time and completion time.
- Link to generated artifacts when returned by the backend.

Available crawler endpoints currently include:

- `/crawl`
- `/crawl/gtmetrix`
- `/crawl/catchpoint`
- `/crawl/pagespeed`
- `/crawl/webpage`
- `/crawl/httpsecurityheaders`
- `/crawl/ssllabs`
- `/crawl/beacon`
- `/crawl/dnschecker`
- `/crawl/websitepulse`
- `/crawl/pingdom`
- `/crawl/silktide`

These crawler endpoints use `X-API-Key` authentication. Attach the key only from Next.js server route handlers, never from browser code.

#### 8. Baselines

Route:

```text
/baselines
```

Build:

- Baseline list.
- Create baseline action.
- Draft, ready, and archived states.
- Assessment date.
- Target URL.
- Included tools.
- Owner.
- Comparison action.

Use frontend mock adapters only until baseline APIs are implemented. Keep the API service layer replaceable.

#### 9. Reviews

Routes:

```text
/reviews
/reviews/[reviewId]
```

Support the workflow:

```text
Draft -> In Review -> Approved -> Published
```

Include:

- Assessment findings.
- Tool evidence.
- Reviewer notes.
- Status history.
- Update action.
- Publish action.
- Role-aware action availability.

Do not allow status changes only in client state. Prepare API mutation functions for future backend enforcement.

#### 10. Profile

Route:

```text
/settings/profile
```

Load:

```http
GET /users/me
```

Update:

```http
PATCH /users/me
```

```json
{
  "username": "new-user",
  "display_name": "New User",
  "first_name": "New",
  "last_name": "User",
  "profile_image": null
}
```

#### 11. Change Password

Route:

```text
/settings/security
```

Backend:

```http
POST /users/me/change-password
```

```json
{
  "current_password": "Welcome@123",
  "new_password": "Updated@123"
}
```

After success:

- Clear the JWT cookie.
- Redirect to `/login`.
- Explain that the user must sign in again.

#### 12. User Administration

Admin route:

```text
/admin/users
```

Tabs:

- Users
- Pending invitations
- Audit logs

Users API:

```http
GET /users
GET /users/{user_id}
PATCH /users/{user_id}
```

Update request:

```json
{
  "role": "admin",
  "is_active": true
}
```

User table columns:

- Name
- Email
- Role
- Status
- Verified
- Last login
- Created date
- Actions

Actions:

- View details
- Promote to admin
- Change admin to user
- Disable user
- Activate user

Use a confirmation dialog for role and status changes.

Do not show unsafe actions for the currently signed-in administrator, such as disabling their own account.

#### 13. Invite User

Use a modal or side panel from `/admin/users`.

Backend:

```http
POST /users/invitations
```

```json
{
  "email": "new.user@cxontology.com",
  "display_name": "New User",
  "role": "user"
}
```

Role selector options:

- User
- Admin

After success:

- Show email delivery status.
- Refresh pending invitations.
- Close the form only after showing confirmation.

Pending invitation actions:

```http
POST /users/{user_id}/resend-invitation
DELETE /users/{user_id}/invitation
```

#### 14. Audit Logs

Admin tab:

```http
GET /users/audit-logs?limit=100
```

Columns:

- Timestamp
- Action
- Actor email
- Target email
- Details

Add client-side filtering by action and actor.

#### 15. Logout

Backend:

```http
POST /logout
```

After the request:

- Clear the HTTP-only JWT cookie even if the backend request fails.
- Redirect to `/login`.

### Application Layout

Authenticated layout:

- Compact left navigation.
- Top bar with current section, notifications placeholder, and user menu.
- Main content area optimized for tables and operational workflows.

Navigation:

- Dashboard
- Tool Sync
- Baselines
- Reviews
- Admin Users, visible only to admins
- Profile

Use familiar Lucide icons and tooltips for collapsed navigation.

Do not use:

- A marketing hero page.
- Decorative gradient backgrounds.
- Oversized cards.
- Nested cards.
- Excessive rounded corners.
- Purple-dominated styling.
- Visible tutorial text describing the interface.

Use a neutral enterprise palette with restrained blue, green, amber, and red status colors. Keep cards at 8px radius or less.

### Route Protection

Public routes:

- `/login`
- `/setup/admin`
- `/forgot-password`
- `/reset-password`
- `/set-password`

Authenticated routes:

- `/dashboard`
- `/tools/sync`
- `/baselines`
- `/reviews`
- `/settings/profile`
- `/settings/security`

Admin-only routes:

- `/admin/users`

Implement Next.js middleware for basic cookie presence checks. Perform authoritative user and role verification server-side by calling:

```http
GET /users/me
```

### API Client Organization

Use this structure:

```text
src/
  app/
  components/
  features/
    auth/
    users/
    dashboard/
    tools/
    baselines/
    reviews/
  lib/
    api/
      client.ts
      auth.ts
      users.ts
      crawler.ts
    auth/
      session.ts
      permissions.ts
  types/
    api.ts
    auth.ts
    assessment.ts
```

Do not call `fetch` directly from visual components. Keep HTTP calls in the API modules.

### Form Validation

Passwords:

- Minimum 8 characters, matching the current backend requirement.
- Require password confirmation in the frontend.
- Display clear mismatch errors.

Username:

- 2 to 80 characters.

Email:

- Valid email format.

Role:

- Only `admin` or `user`.

### Loading and Error States

Every asynchronous page must include:

- Initial loading state.
- Empty state.
- Error state.
- Retry action.
- Mutation progress.
- Disabled submit controls while processing.

Never display raw exception traces or backend internals.

### Accessibility

- Meet WCAG 2.1 AA expectations.
- Ensure complete keyboard navigation.
- Use visible focus states.
- Associate labels and validation messages with inputs.
- Use semantic tables.
- Announce toast and form errors to screen readers.
- Keep text contrast compliant.

### Acceptance Criteria

The implementation is complete when:

1. The first administrator can be bootstrapped.
2. Admin and user accounts can log in.
3. Admins can invite users and additional admins.
4. Invitation links validate before showing the password form.
5. Invited users can set a password and enter the dashboard.
6. Users can recover and change passwords.
7. Users can update their profile.
8. Admins can list, inspect, promote, disable, and activate users.
9. Admins can resend and revoke invitations.
10. Admins can view audit logs.
11. Role-based navigation and route protection work.
12. Tokens and API secrets are not stored in local storage.
13. The application-level API secret never reaches browser JavaScript.
14. The interface works on desktop, tablet, and mobile.
15. TypeScript builds without errors.

Generate the actual working application screens and API integration layer. Do not generate a landing page or a static visual mockup.

---

## Current Backend References

- Authentication routes: `app/api/routes/user_routes.py`
- Request schemas: `app/schemas/user_schema.py`
- User model: `app/models/user_model.py`
- Authentication service: `app/services/auth.py`
- Authentication API documentation: `docs/authentication-api.md`
- Postman collection: `postman/DHA-CWV.postman_collection.json`

## Important Backend Note

The existing public authentication endpoints require `API_TOKEN_SECRET`. A browser-only React or Vite application cannot use that secret safely. Use the server-side proxy described above, or change the backend contract before deploying a browser-only frontend.
