# Exercise 4.8: project GitOps

The project is deployed from Git with Argo CD. Every change to the project on
`main` builds and publishes the frontend, backend, and broadcaster images. The
workflow then commits their immutable SHA tags to `kustomization.yaml`, and
Argo CD automatically synchronizes that commit to the `project` namespace.

The workflow does not use cluster credentials: Git is the deployment API.
