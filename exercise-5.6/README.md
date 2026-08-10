# Exercise 5.6 — Trying serverless

Knative Serving 1.23.0 was installed with Kourier and Magic DNS on a dedicated Kubernetes 1.34.1 k3d cluster.

## Cluster and Knative installation

```sh
k3d cluster create knative \
  --port 8082:30080@agent:0 \
  --port 8081:80@loadbalancer \
  --agents 2 \
  --k3s-arg '--disable=traefik@server:0' \
  --image rancher/k3s:v1.34.1-k3s1

kubectl --context k3d-knative apply -f \
  https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-crds.yaml
kubectl --context k3d-knative apply -f \
  https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-core.yaml
kubectl --context k3d-knative apply -f \
  https://github.com/knative-extensions/net-kourier/releases/download/knative-v1.23.0/kourier.yaml
kubectl --context k3d-knative patch configmap/config-network \
  --namespace knative-serving --type merge \
  --patch '{"data":{"ingress-class":"kourier.ingress.networking.knative.dev"}}'
kubectl --context k3d-knative apply -f \
  https://github.com/knative/serving/releases/download/knative-v1.23.0/serving-default-domain.yaml
```

## Service, autoscaling, and traffic split

```sh
kubectl --context k3d-knative apply -f manifests/hello-v1.yaml
kubectl --context k3d-knative wait --for=condition=Ready kservice/hello --timeout=180s

HOST=$(kubectl --context k3d-knative get kservice hello \
  -o jsonpath='{.status.url}' | sed 's#http://##')
curl -H "Host: $HOST" http://localhost:8081

kubectl --context k3d-knative apply -f manifests/hello-v2-split.yaml
kubectl --context k3d-knative wait --for=condition=Ready kservice/hello --timeout=180s
```

The first request returned `Hello World!`. The service scaled to zero after becoming idle and cold-started successfully on the next request. Knative reported 50% traffic for both revisions, and a 40-request test returned 20 responses from each revision.
