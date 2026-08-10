# Exercise 5.4 — Wikipedia with init and sidecar

The Pod contains three containers that share an `emptyDir` volume:

- An init container downloads the Kubernetes Wikipedia page before nginx starts.
- nginx serves the shared directory.
- A sidecar waits for a random interval between 300 and 900 seconds, downloads `Special:Random`, and atomically replaces `index.html`.

## Deploy and verify

```sh
kubectl --context k3d-mooc apply -k manifests
kubectl --context k3d-mooc rollout status deployment/wikipedia -n exercises
kubectl --context k3d-mooc logs deployment/wikipedia -n exercises -c wikipedia-updater
kubectl --context k3d-mooc port-forward service/wikipedia -n exercises 8080:80
curl http://localhost:8080 | grep '<title>'
```

The initial response is the Kubernetes Wikipedia page. After the sidecar's random delay, the title changes to a random Wikipedia article.

The live test first returned `<title>Kubernetes - Wikipedia</title>`. With an accelerated test interval, the sidecar logged `Wikipedia page updated` and nginx served a different random article. The deployment was then restored and verified with the required 300–900 second range.
