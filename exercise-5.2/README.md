# Exercise 5.2 — Getting started with Istio service mesh

The exercise was completed on the existing `k3d-mooc` cluster with Istio 1.30.3 in ambient mode.

## Install Istio ambient on k3d

```sh
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=1.30.3 sh -
cd istio-1.30.3
export PATH="$PWD/bin:$PATH"

istioctl install \
  --context k3d-mooc \
  --set profile=ambient \
  --set values.global.platform=k3d \
  --set values.cni.cniBinDir=/var/lib/rancher/k3s/data/cni \
  --set values.cni.cniConfDir=/var/lib/rancher/k3s/agent/etc/cni/net.d \
  --skip-confirmation
```

The explicit CNI paths are required by the k3s 1.35 runtime used by this cluster.

## Install observability and deploy Bookinfo

```sh
kubectl --context k3d-mooc apply -f samples/addons/prometheus.yaml
kubectl --context k3d-mooc apply -f samples/addons/kiali.yaml

kubectl --context k3d-mooc apply -f samples/bookinfo/platform/kube/bookinfo.yaml
kubectl --context k3d-mooc apply -f samples/bookinfo/platform/kube/bookinfo-versions.yaml
kubectl --context k3d-mooc label namespace default istio.io/dataplane-mode=ambient --overwrite

kubectl --context k3d-mooc apply -f samples/bookinfo/gateway-api/bookinfo-gateway.yaml
kubectl --context k3d-mooc annotate gateway bookinfo-gateway \
  networking.istio.io/service-type=ClusterIP \
  --namespace=default --overwrite
```

## Verification

```sh
kubectl --context k3d-mooc port-forward service/bookinfo-gateway-istio 8080:80
curl http://localhost:8080/productpage
```

The response contained:

```html
<title>Simple Bookstore App</title>
```

Kiali 2.26.1 reported a healthy connection to Prometheus 3.10.0 and the Istio API after Bookinfo traffic was generated.

## Authorization and traffic management

The remainder of the ambient getting-started guide was completed before its cleanup section:

```sh
kubectl --context k3d-mooc apply -f samples/curl/curl.yaml
istioctl --context k3d-mooc waypoint apply --enroll-namespace --wait

kubectl --context k3d-mooc apply -f manifests/productpage-ztunnel.yaml
kubectl --context k3d-mooc apply -f manifests/productpage-waypoint.yaml
kubectl --context k3d-mooc apply -f manifests/reviews-route.yaml
```

The tests confirmed that the L7 policy rejected `DELETE`, allowed `GET` from the `curl` service account, and routed Bookinfo reviews traffic approximately 90/10 between v1 and v2. One 100-request test produced an 87/13 split.
