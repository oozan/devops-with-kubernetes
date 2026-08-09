set -eu

timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_name="todo-${timestamp}.sql.gz"
backup_file="/tmp/${backup_name}"

echo "Creating PostgreSQL backup ${backup_name}"

PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  --host="$POSTGRES_HOST" \
  --port="$POSTGRES_PORT" \
  --username="$POSTGRES_USER" \
  --dbname="$POSTGRES_DB" \
  --no-owner \
  --no-acl \
  | gzip > "$backup_file"

gcloud auth activate-service-account \
  --key-file="$GOOGLE_APPLICATION_CREDENTIALS" \
  --quiet

gcloud storage cp \
  "$backup_file" \
  "gs://${BACKUP_BUCKET}/${backup_name}"

echo "Uploaded gs://${BACKUP_BUCKET}/${backup_name}"
