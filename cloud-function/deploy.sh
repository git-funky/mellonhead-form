#!/bin/bash
# Deploy the contact form Cloud Function to GCP project co-mellonhead
# Run from inside the cloud-function/ directory:
#   chmod +x deploy.sh && ./deploy.sh
#
# Required environment variables (set before running):
#   export NOTION_TOKEN=your_notion_token
#   export NOTION_DATABASE_ID=your_database_id

set -e

PROJECT_ID="co-mellonhead"
FUNCTION_NAME="contactForm"
REGION="us-central1"

if [ -z "$NOTION_TOKEN" ] || [ -z "$NOTION_DATABASE_ID" ]; then
  echo "Error: NOTION_TOKEN and NOTION_DATABASE_ID must be set as environment variables."
  echo "  export NOTION_TOKEN=your_notion_token"
  echo "  export NOTION_DATABASE_ID=your_database_id"
  exit 1
fi

echo "Deploying $FUNCTION_NAME to project $PROJECT_ID ($REGION)..."

gcloud functions deploy "$FUNCTION_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=contactForm \
  --set-env-vars="NOTION_TOKEN=${NOTION_TOKEN},NOTION_DATABASE_ID=${NOTION_DATABASE_ID}" \
  --source=.

echo ""
echo "Deploy complete. Your function URL:"
gcloud functions describe "$FUNCTION_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format="value(httpsTrigger.url)"
