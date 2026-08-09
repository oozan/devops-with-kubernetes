# Exercise 4.3: Prometheus

Prometheus was installed with the official community Helm chart in the
`prometheus` namespace:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prom prometheus-community/prometheus \
  --namespace prometheus \
  --create-namespace \
  -f exercise-4.3/prometheus-values.yaml
```

The Prometheus GUI/API was accessed through its service:

```bash
kubectl port-forward svc/prom-prometheus-server -n prometheus 9090:80
```

The PromQL query that counts pods created by StatefulSets in the `prometheus`
namespace is:

```promql
count(kube_pod_info{namespace="prometheus", created_by_kind="StatefulSet"})
```

Verified result in GKE:

```text
3
```
