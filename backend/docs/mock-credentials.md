# Mock Login Credentials

These are the temporary credentials consumed by `src/components/auth/mock-user-context.tsx`. Replace them with Keycloak/real IdP hookups when ready.

| Persona             | Role        | Username | Password       | Default Route           |
|---------------------|-------------|----------|----------------|-------------------------|
| Alex                | Student     | `alex`   | `alex123`      | `/tutor`                |
| Ms. Rivera          | Counselor   | `rivera` | `counselor123` | `/counselor-dashboard`  |
| Mr. Holmes          | Teacher     | `holmes` | `teacher123`   | `/teacher-planning`     |
| Principal Taylor    | Principal   | `taylor` | `principal123` | `/principal-analytics`  |
| Test User           | Full Access | `test`   | `letmein`      | `/chat`                 |

> **Note:** These secrets are purely for local development. Do not reuse them in any hosted environment.
