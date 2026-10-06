import type { Request, Response } from 'express';
import { MaintenanceRepository } from '../../repositories/maintenance.repository.js';
import { VehicleRepository } from '../../repositories/vehicle.repository.js';
import { logger } from '../../utils/logger.js';

import { env } from '../../config/env.js';

const maintenanceRepository = new MaintenanceRepository();
const vehicleRepository = new VehicleRepository();

export class JiraWebhookController {
  async handleWebhook(req: Request, res: Response) {
    try {
      // Optional secret verification if configured
      if (env.JIRA_WEBHOOK_SECRET) {
        const headerSecret = req.headers['x-atlassian-webhook-secret'] || req.headers['x-hub-signature'];
        const querySecret = req.query.secret;
        if (headerSecret !== env.JIRA_WEBHOOK_SECRET && querySecret !== env.JIRA_WEBHOOK_SECRET) {
          logger.warn('[JIRA WEBHOOK] Unauthorized webhook attempt: Invalid secret');
          return res.status(401).json({ success: false, message: 'Invalid webhook secret' });
        }
      }

      const webhookEvent = req.body?.webhookEvent;
      const issue = req.body?.issue;

      if (!issue || !issue.key) {
        return res.status(400).json({ success: false, message: 'Invalid webhook payload: Missing Jira issue details' });
      }

      const issueKey = issue.key as string;
      const statusName = issue.fields?.status?.name || '';
      logger.info(`[JIRA WEBHOOK] Received event "${webhookEvent}" for issue "${issueKey}" with status "${statusName}"`);

      // Find corresponding TransitOps maintenance record
      const maintenance = await maintenanceRepository.findByJiraIssueKey(issueKey);

      if (!maintenance) {
        logger.info(`[JIRA WEBHOOK] No maintenance record linked to issue "${issueKey}"`);
        return res.status(404).json({ success: false, message: `No maintenance record found linked to Jira issue "${issueKey}"` });
      }

      // Check if ticket moved to Done / Resolved / Closed
      const isResolved = ['done', 'resolved', 'closed', 'completed'].includes(statusName.toLowerCase());

      if (isResolved) {
        // Mark maintenance record as Completed
        await maintenanceRepository.update(maintenance.id, {
          status: 'Completed',
          jira_status: statusName,
        });

        // Set vehicle status back to Available
        await vehicleRepository.update(maintenance.reg_no, {
          status: 'Available',
        });

        logger.info(
          `[JIRA WEBHOOK] Jira issue "${issueKey}" resolved. Vehicle "${maintenance.reg_no}" returned to "Available" status.`
        );
      } else {
        // Update current Jira status in maintenance record
        await maintenanceRepository.update(maintenance.id, {
          jira_status: statusName,
        });
      }

      return res.status(200).json({
        success: true,
        message: `Successfully processed Jira webhook for ${issueKey}`,
        data: {
          issueKey,
          status: statusName,
          vehicleRegNo: maintenance.reg_no,
          vehicleStatus: isResolved ? 'Available' : 'In_Shop',
        },
      });
    } catch (error) {
      logger.error('[JIRA WEBHOOK] Error processing webhook:', error);
      return res.status(500).json({ success: false, message: 'Error processing Jira webhook' });
    }
  }
}
