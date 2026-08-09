# Exercise 3.9: DBaaS vs DIY PostgreSQL

The Project currently runs PostgreSQL inside Kubernetes as a StatefulSet. An
alternative would be a managed Database as a Service (DBaaS), such as Google
Cloud SQL for PostgreSQL.

| Area | DBaaS | DIY PostgreSQL in Kubernetes |
| --- | --- | --- |
| Initial work | Create an instance, database, users, networking, and credentials. The provider supplies the database platform and documented connection options. | Design and maintain the StatefulSet, persistent storage, secrets, networking, health probes, initialization, upgrades, backups, and recovery process. Production use also needs a high-availability design. |
| Initial cost | Starts charging as soon as the managed instance is running. Cost includes provisioned compute and storage, and may include backup, network, and high-availability charges. | Can have a low additional cash cost when an existing cluster has spare capacity, but still consumes node CPU, memory, persistent disks, and engineering time. A dedicated or highly available setup adds nodes and storage and can cost as much as, or more than, DBaaS. |
| Ongoing maintenance | The provider handles the database service, infrastructure failures, many patches, monitoring integrations, and optional automated failover. The team still owns schema migrations, users, query performance, capacity choices, and application-level security. | The team owns PostgreSQL and Kubernetes operations: patching, version upgrades, replication, failover, storage capacity, monitoring, alerting, security updates, disaster recovery, and testing restores. This gives more control but creates a larger operational burden. |
| Availability and scaling | High availability, replicas, maintenance windows, and vertical scaling are usually supported as managed settings, although they increase the bill and can introduce provider-specific constraints. | Every availability and scaling mechanism must be designed and operated by the team. Scaling storage may be easy, while scaling writes, changing storage classes, or building safe failover is substantially harder. |
| Backups | Automated backups, retention policies, snapshots, and point-in-time recovery are commonly built in. Restores can usually be started through a console, CLI, or API, but retention and backup storage may cost extra. Restore procedures still need to be tested. | Backups must be implemented, secured, scheduled, monitored, retained, and copied away from the cluster. For this Project, a CronJob can run `pg_dump` and upload the result to Cloud Storage. The team must also protect credentials, manage retention, and regularly test `pg_restore`. |
| Security | The provider offers encryption, IAM integration, private networking, audit features, and managed security updates. Correct configuration and least-privilege access remain the team's responsibility. | The team has complete control over configuration and data placement, but must secure images, passwords, network access, disks, backups, PostgreSQL settings, and the Kubernetes cluster itself. |
| Portability and control | Easier to operate, but provider-specific IAM, networking, backup, and failover features can increase vendor lock-in. Some low-level database settings may be unavailable. | Maximum control over PostgreSQL versions, extensions, and configuration. Standard containers and dumps improve portability, although the Kubernetes and storage configuration still requires migration work. |

## Choice for this Project

DIY PostgreSQL is useful here because it teaches StatefulSets, persistent
volumes, secrets, and backup automation while reusing the existing course
cluster. For a small production team, DBaaS would normally be the safer choice:
its higher visible monthly price buys automated maintenance, availability, and
much simpler backup and recovery operations. DIY is reasonable when strict
control, unusual extensions, regulatory constraints, or existing database
operations expertise justify the extra work.
