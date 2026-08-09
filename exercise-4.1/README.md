# Exercise 4.1: Readiness probes

Ping-pong exposes `/healthz` and returns success only after a live `SELECT 1`
query to PostgreSQL. The log-output server exposes `/healthz` and returns
success only when it can receive a successful response from ping-pong.

The probes were tested in GKE by scaling the PostgreSQL StatefulSet to zero.
Before the database was available, the new application pods reported:

```text
log-output   1/2   Running
ping-pong    0/1   Running
```

After PostgreSQL was restored, the same pods automatically became ready:

```text
log-output   2/2   Running
ping-pong    1/1   Running
postgres-0   1/1   Running
```
