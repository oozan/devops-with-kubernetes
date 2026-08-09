# Exercise 4.10: separate code and configuration repositories

This directory contains application source code only. Kubernetes manifests,
Kustomize overlays, and Argo CD applications are stored in the separate
[`oozan/devops-with-kubernetes-config`](https://github.com/oozan/devops-with-kubernetes-config)
repository.

The GitHub Actions workflow builds immutable images from this repository and
updates the appropriate overlay in the config repository using a dedicated
write-enabled deploy key:

- commits to `main` update staging;
- tagged commits update production.

Argo CD watches the config repository, so the code pipeline never needs cluster
credentials. Database secrets remain outside both repositories.
