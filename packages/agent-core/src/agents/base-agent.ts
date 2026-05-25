/**
 * Base Agent class for all specialist agents in SentinelOS
 * Provides common infrastructure for autonomous investigation
 */

import { AgentTask, AgentState, AgentMessage, AgentType } from '@sentinelos/shared';
import { v4 as uuidv4 } from 'uuid';
import pino from 'pino';

const logger = pino();

/**
 * Base agent with LangGraph integration
 */
export abstract class BaseAgent {
  protected agent_id: string;
  protected agent_type: AgentType;
  protected state: AgentState;
  protected message_history: AgentMessage[] = [];
  protected tasks: Map<string, AgentTask> = new Map();

  constructor(agent_type: AgentType, agent_id?: string) {
    this.agent_id = agent_id || `agent_${uuidv4()}`;
    this.agent_type = agent_type;
    this.state = {
      agent_id: this.agent_id,
      agent_type,
      state: 'idle',
      current_task_id: undefined,
      tasks_completed: 0,
      tasks_in_progress: 0,
      success_rate: 0,
      average_time_ms: 0,
      capabilities: this.getCapabilities(),
      tools_available: this.getAvailableTools(),
      config: this.getDefaultConfig(),
      metrics: {
        total_tasks: 0,
        successful_tasks: 0,
        failed_tasks: 0,
        average_confidence: 0,
      },
      last_activity_at: Date.now(),
    };
  }

  /**
   * Get agent capabilities (override in subclasses)
   */
  protected abstract getCapabilities(): string[];

  /**
   * Get available tools (override in subclasses)
   */
  protected abstract getAvailableTools(): string[];

  /**
   * Get default configuration
   */
  protected getDefaultConfig() {
    return {
      temperature: 0.7,
      max_tokens: 2000,
      timeout_ms: 30000,
      retry_policy: {
        max_retries: 3,
        backoff_ms: 1000,
      },
    };
  }

  /**
   * Accept a task
   */
  async acceptTask(task: AgentTask): Promise<void> {
    logger.info({ agent_id: this.agent_id, task_id: task.task_id }, 'Accepting task');

    task.state = 'accepted';
    this.tasks.set(task.task_id, task);
    this.state.current_task_id = task.task_id;
    this.state.tasks_in_progress++;
    this.state.state = 'active';
    this.state.last_activity_at = Date.now();
  }

  /**
   * Execute a task (to be implemented by subclasses)
   */
  abstract executeTask(task: AgentTask): Promise<AgentTask>;

  /**
   * Complete a task
   */
  async completeTask(task: AgentTask, success: boolean = true): Promise<void> {
    logger.info(
      { agent_id: this.agent_id, task_id: task.task_id, success },
      'Completing task'
    );

    if (success) {
      this.state.metrics.successful_tasks++;
      this.state.success_rate =
        this.state.metrics.successful_tasks / this.state.metrics.total_tasks;
    } else {
      this.state.metrics.failed_tasks++;
    }

    this.state.tasks_in_progress--;
    this.state.tasks_completed++;
    this.state.state = this.state.tasks_in_progress === 0 ? 'idle' : 'active';
    this.state.last_activity_at = Date.now();
  }

  /**
   * Add message to conversation
   */
  addMessage(role: 'user' | 'assistant' | 'system', content: string): AgentMessage {
    const message: AgentMessage = {
      message_id: uuidv4(),
      agent_id: this.agent_id,
      timestamp: Date.now(),
      role,
      content,
      conversation_id: this.state.current_task_id || 'system',
      parent_message_id: this.message_history.length > 0
        ? this.message_history[this.message_history.length - 1].message_id
        : undefined,
    };

    this.message_history.push(message);
    return message;
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): AgentMessage[] {
    return this.message_history;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.message_history = [];
  }

  /**
   * Get agent status
   */
  getStatus(): AgentState {
    return { ...this.state };
  }

  /**
   * Think step (reasoning)
   */
  async think(context: Record<string, any>, prompt: string): Promise<string> {
    logger.debug({ agent_id: this.agent_id }, 'Thinking');

    // Add system prompt
    this.addMessage('system', `You are a ${this.agent_type} in SentinelOS. ${this.getSystemPrompt()}`);

    // Add context
    if (Object.keys(context).length > 0) {
      this.addMessage(
        'system',
        `Context: ${JSON.stringify(context)}`
      );
    }

    // Add user prompt
    this.addMessage('user', prompt);

    // In production, this would call Claude API
    const response = await this.generateResponse(prompt, context);
    this.addMessage('assistant', response);

    return response;
  }

  /**
   * Generate response (to be implemented by subclasses)
   */
  protected abstract generateResponse(prompt: string, context: Record<string, any>): Promise<string>;

  /**
   * Get system prompt for this agent type
   */
  protected abstract getSystemPrompt(): string;

  /**
   * Call a tool
   */
  async callTool(tool_name: string, tool_input: Record<string, any>): Promise<any> {
    logger.debug({ agent_id: this.agent_id, tool_name }, 'Calling tool');

    // Validate tool is available
    if (!this.state.tools_available.includes(tool_name)) {
      throw new Error(`Tool ${tool_name} not available for ${this.agent_type}`);
    }

    // Tool execution is delegated to subclasses
    return this.executeTool(tool_name, tool_input);
  }

  /**
   * Execute tool (to be implemented by subclasses)
   */
  protected abstract executeTool(tool_name: string, tool_input: Record<string, any>): Promise<any>;

  /**
   * Update metrics
   */
  protected updateMetrics(duration_ms: number, confidence?: number): void {
    const total = this.state.metrics.total_tasks;
    const oldAvg = this.state.average_time_ms;
    this.state.average_time_ms = (oldAvg * total + duration_ms) / (total + 1);

    if (confidence !== undefined) {
      const oldConfidence = this.state.metrics.average_confidence;
      this.state.metrics.average_confidence = (oldConfidence * total + confidence) / (total + 1);
    }

    this.state.metrics.total_tasks++;
  }

  /**
   * Get agent info
   */
  getInfo() {
    return {
      agent_id: this.agent_id,
      agent_type: this.agent_type,
      state: this.state.state,
      capabilities: this.state.capabilities,
      tools: this.state.tools_available,
      metrics: this.state.metrics,
      last_activity: new Date(this.state.last_activity_at || 0).toISOString(),
    };
  }
}

export default BaseAgent;
