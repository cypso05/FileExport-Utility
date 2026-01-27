/**
 * ExportAutomation.jsx
 * Production-Standard, Error-Free Automation Script (JavaScript/JSX).
 * FIXES APPLIED:
 * 1. Lexical Declaration: Added block scopes for 'percentage' cases in evaluateDataTypeCondition and evaluateProductCondition.
 * 2. Unused Variable: Renamed 'context' to '_context' to allow future extensibility without warnings.
 */

// Define the class responsible for managing and evaluating automation rules
export class ExportAutomation {
  constructor(rules = []) {
    this.rules = rules;
    this.isRunning = false;
  }

  /**
   * Generates a unique ID and adds a rule.
   * @param {object} rule The rule configuration.
   */
  addRule(rule) {
    this.rules.push({
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      ...rule
    });
  }

  /**
   * Removes a rule by its ID.
   * @param {string} ruleId The ID of the rule to remove.
   */
  removeRule(ruleId) {
    this.rules = this.rules.filter(rule => rule.id !== ruleId);
  }

  // --- Rule Evaluation ---

  /**
   * Evaluates all enabled rules against the data and context.
   * @param {Array<object>} data The data set to evaluate.
   * @param {object} [_context={}] Optional execution context (for future use).
   * @returns {Promise<Array<object>>} An array of rules that were triggered.
   */
  async evaluateRules(data, _context = {}) {
    const triggeredRules = [];

    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      const shouldTrigger = await this.evaluateRule(rule, data, _context);

      if (shouldTrigger) {
        triggeredRules.push(rule);
        // Track the last time a rule was triggered
        rule.lastTriggered = new Date().toISOString();
      }
    }

    return triggeredRules;
  }

  async evaluateRule(rule, data, _context) {
    try {
      const conditions = rule.conditions || [];

      // All conditions must be met for the rule to trigger (AND logic)
      for (const condition of conditions) {
        const met = await this.evaluateCondition(condition, data, _context);

        if (!met) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Error evaluating rule ${rule.id} (${rule.name}):`, error);
      return false;
    }
  }

  async evaluateCondition(condition, data, _context) {
  /* eslint-disable-next-line no-unused-vars */
  const unused = _context; // explicitly acknowledge it's unused

  const { type, operator, value, field } = condition;

  switch (type) {
    case 'data_count':
      return this.evaluateCountCondition(data.length, operator, value);

    case 'time_based':
      return this.evaluateTimeCondition(operator, value);

    case 'data_type':
      return this.evaluateDataTypeCondition(data, operator, value, field);

    case 'product_exists':
      return this.evaluateProductCondition(data, operator, value);

    default:
      console.warn(`Unknown condition type: ${type}`);
      return false;
  }
}


  // --- Condition Implementations ---

  evaluateCountCondition(actualCount, operator, expectedValue) {
    const numExpectedValue = Number(expectedValue);

    switch (operator) {
      case 'greater_than':
        return actualCount > numExpectedValue;
      case 'less_than':
        return actualCount < numExpectedValue;
      case 'equals':
        return actualCount === numExpectedValue;
      case 'greater_than_equals':
        return actualCount >= numExpectedValue;
      case 'less_than_equals':
        return actualCount <= numExpectedValue;
      default:
        console.warn(`Unknown count operator: ${operator}`);
        return false;
    }
  }

  evaluateTimeCondition(operator, value) {
    const now = new Date();
    let currentHour;
    let currentDay;

    switch (operator) {
      case 'time_of_day':
        currentHour = now.getHours();
        return currentHour === parseInt(String(value), 10);

      case 'day_of_week':
        currentDay = now.getDay();
        return currentDay === parseInt(String(value), 10);

      case 'scheduled':
        if (typeof value !== 'object' || value === null) return false;
        return this.checkSchedule(value, now);

      default:
        console.warn(`Unknown time operator: ${operator}`);
        return false;
    }
  }

  evaluateDataTypeCondition(data, operator, expectedType, field) {
    if (!data.length) return false;

    const matchingItems = data.filter(item => {
      const checkValue = field ? item[field] : item;
      if (checkValue !== undefined && checkValue !== null) {
        return checkValue === expectedType;
      }
      return false;
    });

    const dataLength = data.length;
    const matchingLength = matchingItems.length;

    switch (operator) {
      case 'contains':
        return matchingLength > 0;
      case 'all':
        return matchingLength === dataLength;
      case 'percentage': { // Block scope added
        const expectedPercentage = parseInt(String(expectedType), 10);
        if (isNaN(expectedPercentage)) return false;
        const percentage = (matchingLength / dataLength) * 100;
        return percentage >= expectedPercentage;
      }
      default:
        console.warn(`Unknown data type operator: ${operator}`);
        return false;
    }
  }

  evaluateProductCondition(data, operator, value) {
    if (!data.length) return false;

    const itemsWithProduct = data.filter(item => item.product);
    const dataLength = data.length;
    const itemsWithProductLength = itemsWithProduct.length;

    switch (operator) {
      case 'has_product':
        return itemsWithProductLength > 0;
      case 'all_have_products':
        return itemsWithProductLength === dataLength;
      case 'percentage_with_products': { // Block scope added
        const expectedPercentage = parseInt(String(value), 10);
        if (isNaN(expectedPercentage)) return false;
        const percentage = (itemsWithProductLength / dataLength) * 100;
        return percentage >= expectedPercentage;
      }
      default:
        console.warn(`Unknown product condition operator: ${operator}`);
        return false;
    }
  }

  checkSchedule(schedule, currentTime) {
    const { type, value } = schedule;
    const numericValue = parseInt(String(value), 10);
    if (isNaN(numericValue)) return false;

    switch (type) {
      case 'hourly':
        return currentTime.getMinutes() === 0;
      case 'daily':
        return currentTime.getHours() === numericValue;
      case 'weekly':
        return currentTime.getDay() === numericValue;
      default:
        console.warn(`Unknown schedule type: ${type}`);
        return false;
    }
  }

  // --- Action Execution ---

  async executeRuleActions(rule, data) {
    const actions = rule.actions || [];
    const results = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, data);
        results.push({
          action: action.type,
          success: true,
          result
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during action execution';
        console.error(`Action execution failed for ${action.type}:`, error);
        results.push({
          action: action.type,
          success: false,
          error: errorMessage
        });
      }
    }

    return results;
  }

  async executeAction(action, data) {
    const { type, config } = action;

    switch (type) {
      case 'export_csv':
        return await this.exportAsCSV(data, config);
      case 'export_pdf':
        return await this.exportAsPDF(data, config);
      case 'send_email':
        return await this.sendExportEmail(data, config);
      case 'upload_cloud':
        return await this.uploadToCloud(data, config);
      case 'webhook':
        return await this.triggerWebhook(data, config);
      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  // --- Placeholder Action Methods ---

  async exportAsCSV(data, config) {
    console.log('Automated CSV export:', data.length, 'items', config);
    return { format: 'csv', itemCount: data.length };
  }

  async exportAsPDF(data, config) {
    console.log('Automated PDF export:', data.length, 'items', config);
    return { format: 'pdf', itemCount: data.length };
  }

  async sendExportEmail(data, config) {
    console.log('Automated email export:', data.length, 'items', config);
    return {
      action: 'email',
      recipients: config.recipients,
      itemCount: data.length
    };
  }

  async uploadToCloud(data, config) {
    console.log('Automated cloud upload:', data.length, 'items', config);
    return {
      service: config.service,
      itemCount: data.length
    };
  }

  async triggerWebhook(data, config) {
    console.log('Automated webhook trigger:', data.length, 'items', config);

    const url = config.url;
    if (!url) throw new Error('Webhook URL not configured.');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.headers || {})
        },
        body: JSON.stringify({
          data: data,
          timestamp: new Date().toISOString(),
          event: 'automated_export'
        })
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => response.statusText);
        throw new Error(`Webhook failed with status ${response.status}: ${errorBody}`);
      }

      return await response.json().catch(() => ({ status: 'success', message: 'No JSON response body.' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Webhook execution failed: ${errorMessage}`);
    }
  }

  // --- Utility ---

  getRuleSummary() {
    const enabledRules = this.rules.filter(rule => rule.enabled);
    const disabledRules = this.rules.filter(rule => !rule.enabled);

    return {
      total: this.rules.length,
      enabled: enabledRules.length,
      disabled: disabledRules.length,
      rules: this.rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        conditions: rule.conditions?.length || 0,
        actions: rule.actions?.length || 0,
        lastTriggered: rule.lastTriggered
      }))
    };
  }
}

/**
 * Creates a set of default automation rules.
 * @returns {Array<object>} An array of default rule configurations.
 */
export const createDefaultAutomationRules = () => {
  return [
    {
      name: 'Daily Backup',
      description: 'Automatically backup scan history daily',
      conditions: [
        {
          type: 'time_based',
          operator: 'scheduled',
          value: { type: 'daily', value: 2 } // 2 AM
        }
      ],
      actions: [
        {
          type: 'export_csv',
          config: {
            includeTimestamps: true,
            includeProductInfo: true
          }
        },
        {
          type: 'upload_cloud',
          config: {
            service: 'google_drive',
            folder: 'QR Scanner Backups'
          }
        }
      ]
    },
    {
      name: 'Large Batch Export',
      description: 'Export when batch scan exceeds 100 items',
      conditions: [
        {
          type: 'data_count',
          operator: 'greater_than',
          value: 100
        }
      ],
      actions: [
        {
          type: 'export_csv',
          config: {
            includeTimestamps: true,
            includeProductInfo: true
          }
        }
      ]
    },
    {
      name: 'Product Inventory Alert',
      description: 'Send email when products are scanned',
      conditions: [
        {
          type: 'product_exists',
          operator: 'has_product',
          value: true
        }
      ],
      actions: [
        {
          type: 'send_email',
          config: {
            recipients: ['inventory@company.com'],
            subject: 'New Products Scanned'
          }
        }
      ]
    }
  ];
};
