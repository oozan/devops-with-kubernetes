# Exercise 5.7: Deploy to serverless

Ping-pong runs as a Knative Service and scales to zero when idle. Its counter is
stored in a separate PostgreSQL StatefulSet with a persistent volume.

Log Output remains a Kubernetes Deployment. It reads the count through the
Knative service's cluster-local fully qualified domain name:

```text
http://pingpong.exercises.svc.cluster.local/pings
```

For browser access, Log Output proxies `/pingpong` to the same Knative service
and is exposed through NodePort `30080`, mapped to `localhost:8082` by the
exercise's k3d cluster.

```bash
kubectl apply -k manifests
curl http://localhost:8082/
curl http://localhost:8082/pingpong
```
