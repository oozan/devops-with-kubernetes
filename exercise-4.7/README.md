# Exercise 4.7: Log output GitOps

The Log output application is managed by the declarative Argo CD Application
in `argocd/application.yaml`. Argo CD watches the `main` branch and
automatically synchronizes `exercise-4.7/log-output` to the `exercises`
namespace with pruning and self-healing enabled.

The GitHub Actions workflow builds and publishes a uniquely tagged Log output
image for each application change. It then updates and commits
`log-output/kustomization.yaml`. Argo CD pulls that Git commit and updates the
cluster; the workflow does not receive Kubernetes credentials or deploy with
`kubectl`.
