-- AlterTable
ALTER TABLE "Maintenance" ADD COLUMN "jira_issue_key" TEXT,
ADD COLUMN "jira_issue_id" TEXT,
ADD COLUMN "jira_issue_url" TEXT,
ADD COLUMN "jira_status" TEXT;
