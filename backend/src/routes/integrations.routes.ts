import { Router } from 'express';
import { JiraWebhookController } from '../controllers/integrations/jiraWebhook.controller.js';

const router = Router();
const jiraWebhookController = new JiraWebhookController();

// POST /api/v1/integrations/jira/webhook - Webhook listener for Jira issue status updates
router.post('/jira/webhook', jiraWebhookController.handleWebhook);

export default router;
