# Exercise 5.1 — DIY CRD & Controller

`DummySite` is a namespaced custom resource with a `website_url` property. The controller watches DummySites across the cluster and creates an owned Deployment and Service for each resource.

The generated Deployment uses a curl init container to download the page into an `emptyDir` volume. nginx serves the downloaded `index.html` from the same volume.

## Deploy and test

```sh
kubectl apply -k manifests
kubectl apply -f manifests/example-dummysite.yaml
kubectl wait --for=condition=available deployment/example-dummysite --timeout=120s
kubectl port-forward service/example-dummysite 8080:80
curl http://localhost:8080
```

Deleting the DummySite also removes the generated resources through Kubernetes owner references.
