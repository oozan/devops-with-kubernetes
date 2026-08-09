# Exercise 4.9: staging and production GitOps

The project base is deployed through two Kustomize overlays:

- `overlays/staging` is updated by every commit to `main`. Its broadcaster only
  logs messages and it does not include the database backup CronJob.
- `overlays/production` is updated by tagged commits. Its broadcaster forwards
  messages and its database is backed up.

Argo CD automatically synchronizes both namespaces. The PostgreSQL secrets are
created outside Argo CD and are intentionally not stored in Git.
