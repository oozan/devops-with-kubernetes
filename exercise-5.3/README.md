# Exercise 5.3 — Log app, the Service Mesh Edition

The `exercises` namespace is enrolled in Istio ambient mode and uses a waypoint proxy for Layer 7 routing.

The Log app calls `greeter-svc` and prints its response with the existing log output. Two greeter versions return distinct greetings. An `HTTPRoute` attached to the parent service sends 75% of requests to v1 and 25% to v2.

```sh
docker pull --platform linux/amd64 \
  europe-north1-docker.pkg.dev/oo-devops-k8s-2026/dwk-repo/log-output:5.3-amd64
docker pull --platform linux/amd64 \
  europe-north1-docker.pkg.dev/oo-devops-k8s-2026/dwk-repo/greeter:5.3-amd64
k3d image import --cluster mooc \
  europe-north1-docker.pkg.dev/oo-devops-k8s-2026/dwk-repo/log-output:5.3-amd64 \
  europe-north1-docker.pkg.dev/oo-devops-k8s-2026/dwk-repo/greeter:5.3-amd64

kubectl --context k3d-mooc apply -k manifests
kubectl --context k3d-mooc wait --for=condition=available \
  deployment/log-output deployment/greeter-v1 deployment/greeter-v2 \
  -n exercises --timeout=180s

kubectl --context k3d-mooc port-forward service/log-output -n exercises 8080:3000
curl http://localhost:8080
```

Example output includes either:

```text
Greeter: Hello from greeter v1
```

or:

```text
Greeter: Hello from greeter v2
```

The live 100-request test produced a 72/28 v1/v2 split. Kiali's `exercises` traffic graph showed both greeter versions and both version-specific services.
