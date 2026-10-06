import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { BadRequestError } from '../errors/index.js';
import { jiraSyncTotal } from '../middleware/metrics.middleware.js';

export interface CreateMaintenanceIssueParams {
  regNo: string;
  vehicleModel?: string;
  serviceType: string;
  cost: number;
  date: string | Date;
  description?: string;
}

export interface JiraIssueResult {
  key: string;
  id: string;
  url: string;
  status: string;
}

export class JiraService {
  private host: string;
  private email: string;
  private apiToken: string;
  private projectKey: string;

  constructor() {
    this.host = env.JIRA_HOST.replace(/\/+$/, '');
    this.email = env.JIRA_EMAIL;
    this.apiToken = env.JIRA_API_TOKEN;
    this.projectKey = env.JIRA_PROJECT_KEY || 'FLEET';
  }

  public isConfigured(): boolean {
    return Boolean(this.host && this.email && this.apiToken);
  }

  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return `Basic ${credentials}`;
  }

  /**
   * Create a Jira issue when vehicle maintenance is logged
   */
  async createMaintenanceIssue(params: CreateMaintenanceIssueParams): Promise<JiraIssueResult> {
    const summary = `[FLEET: ${params.regNo}] ${params.serviceType.replace(/_/g, ' ')} Required`;
    const formattedDate = new Date(params.date).toLocaleDateString();

    if (!this.isConfigured()) {
      throw new BadRequestError(
        'Jira integration is not configured. Please configure JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN in environment variables.'
      );
    }

    try {
      const body = {
        fields: {
          project: {
            key: this.projectKey,
          },
          summary,
          issuetype: {
            name: 'Task',
          },
          labels: ['transitops', 'maintenance', params.serviceType.toLowerCase()],
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: `A new fleet maintenance work order was generated from TransitOps.`,
                  },
                ],
              },
              {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          { type: 'text', text: `Vehicle Reg: `, marks: [{ type: 'strong' }] },
                          { type: 'text', text: params.regNo },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          { type: 'text', text: `Service Type: `, marks: [{ type: 'strong' }] },
                          { type: 'text', text: params.serviceType },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          { type: 'text', text: `Estimated Cost: `, marks: [{ type: 'strong' }] },
                          { type: 'text', text: `$${params.cost}` },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          { type: 'text', text: `Scheduled Date: `, marks: [{ type: 'strong' }] },
                          { type: 'text', text: formattedDate },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      };

      const response = await fetch(`${this.host}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new BadRequestError(`Jira API error (${response.status}): ${errorText}`);
      }

      const data = (await response.json()) as { id: string; key: string; self: string };
      const issueUrl = `${this.host}/browse/${data.key}`;

      jiraSyncTotal.inc({ event_type: 'issue_created', status: 'success' });
      logger.info(`Successfully created Jira issue ${data.key} for vehicle ${params.regNo}`);
      return {
        key: data.key,
        id: data.id,
        url: issueUrl,
        status: 'To Do',
      };
    } catch (error: any) {
      jiraSyncTotal.inc({ event_type: 'issue_created', status: 'error' });
      logger.error('Failed to create Jira issue:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new BadRequestError(`Failed to create Jira issue: ${error.message || 'Unknown Jira error'}`);
    }
  }

  /**
   * Fetch Jira issue details by key
   */
  async getIssue(issueKey: string): Promise<any> {
    if (!this.isConfigured()) {
      throw new BadRequestError(
        'Jira integration is not configured. Please configure JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN in environment variables.'
      );
    }

    const response = await fetch(`${this.host}/rest/api/3/issue/${issueKey}`, {
      method: 'GET',
      headers: {
        Authorization: this.getAuthHeader(),
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new BadRequestError(`Failed to fetch Jira issue ${issueKey} (${response.status}): ${errorText}`);
    }

    return await response.json();
  }
}

export const jiraService = new JiraService();
