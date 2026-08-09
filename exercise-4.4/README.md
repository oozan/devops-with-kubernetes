# Exercise 4.4: Ping-pong canary analysis

Ping-pong is deployed as an Argo Rollout. At 50% canary weight, the rollout
runs `ping-pong-cpu-usage`, an AnalysisTemplate backed by Prometheus.

The analysis sums the five-minute CPU usage rate of every non-infrastructure
container in the `exercises` namespace:

```promql
sum(
  rate(
    container_cpu_usage_seconds_total{
      namespace="exercises",
      container!="",
      container!="POD"
    }[5m]
  )
)
```

The production threshold is `0.2` CPU cores. The rollback behavior was also
tested in GKE with an intentionally tiny threshold of `0.000001`. Prometheus
returned `0.002882` and `0.003535`; the AnalysisRun failed, the Rollout entered
the `Degraded` phase, and Argo removed the candidate pod while keeping both
stable `4.4` pods. The final `0.2` configuration was then restored and the
Rollout returned to `Healthy`.
