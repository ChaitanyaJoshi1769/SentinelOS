/**
 * Kafka consumer for real-time telemetry ingestion
 * Handles high-volume event streaming with deduplication
 */

import { Kafka, Consumer, logLevel } from 'kafkajs';
import { TelemetryEvent } from '@sentinelos/shared';
import pino from 'pino';

const logger = pino();

/**
 * Kafka telemetry consumer
 */
export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private initialized = false;

  constructor(
    brokers: string[],
    private groupId: string,
    private topics: string[],
    private messageHandler: (event: TelemetryEvent) => Promise<void>,
    private errorHandler?: (error: Error, topic: string) => void
  ) {
    this.kafka = new Kafka({
      clientId: 'sentinelos-consumer',
      brokers,
      logLevel: logLevel.ERROR,
    });

    this.consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
    });
  }

  /**
   * Connect and start consuming
   */
  async connect(): Promise<void> {
    try {
      await this.consumer.connect();

      // Subscribe to topics
      for (const topic of this.topics) {
        await this.consumer.subscribe({
          topic,
          fromBeginning: false,
        });
      }

      // Run consumer
      await this.consumer.run({
        partitionsConsumedConcurrently: 3,
        eachMessage: async ({ topic, partition, message }) => {
          await this.handleMessage(topic, partition, message);
        },
      });

      this.initialized = true;
      logger.info({ topics: this.topics }, 'Kafka consumer connected');
    } catch (error) {
      logger.error({ error }, 'Failed to connect Kafka consumer');
      throw error;
    }
  }

  /**
   * Disconnect consumer
   */
  async disconnect(): Promise<void> {
    if (this.initialized) {
      await this.consumer.disconnect();
      this.initialized = false;
      logger.info('Kafka consumer disconnected');
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(topic: string, partition: number, message: any): Promise<void> {
    try {
      const { key, value, offset, timestamp } = message;

      if (!value) {
        logger.warn({ topic, partition, offset }, 'Empty message value');
        return;
      }

      // Parse message
      let event: TelemetryEvent;
      try {
        const parsed = JSON.parse(value.toString());
        event = parsed;
      } catch (error) {
        logger.error({ error, topic, partition }, 'Failed to parse message');
        return;
      }

      // Handle event
      try {
        await this.messageHandler(event);
      } catch (error) {
        logger.error({ error, event_id: event.event_id }, 'Message handler failed');
        if (this.errorHandler) {
          this.errorHandler(error as Error, topic);
        }
      }
    } catch (error) {
      logger.error({ error }, 'Message handling failed');
    }
  }

  /**
   * Get consumer status
   */
  isConnected(): boolean {
    return this.initialized;
  }
}

export default KafkaConsumer;
