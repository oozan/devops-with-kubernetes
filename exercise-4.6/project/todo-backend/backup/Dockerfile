FROM google/cloud-sdk:alpine

RUN apk add --no-cache postgresql-client

COPY backup.sh /usr/local/bin/backup.sh

ENTRYPOINT ["/bin/sh", "/usr/local/bin/backup.sh"]
