/**
 * Truth Archive — Daily Topic Autopilot
 *
 * Triggered every 24 h by EventBridge. Picks the next unpublished topic from
 * the S3 queue, generates a full HTML page via OpenAI, deploys it to the VPS,
 * updates the section index, and writes /data/latest-topic.json for the
 * homepage "New Today" banner.
 */

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { generateContent } from './ai.mjs';
import { renderHTML } from './template.mjs';
import { deployFile, updateSectionIndex, writeLatestTopic } from './ssh-deploy.mjs';

const REGION      = process.env.AWS_REGION   || 'us-east-1';
const QUEUE_BUCKET = process.env.QUEUE_BUCKET || 'ta-autopilot';
const QUEUE_KEY   = 'topic-queue.json';

const s3  = new S3Client({ region: REGION });
const ssm = new SSMClient({ region: REGION });

/**
 * Retrieves a decrypted SSM Parameter Store value.
 * @param {string} name - Parameter name
 * @returns {Promise<string>}
 */
async function getParam(name) {
  const resp = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return resp.Parameter.Value;
}

/**
 * Reads and parses the topic queue JSON from S3.
 * @returns {Promise<Array>}
 */
async function readQueue() {
  const resp = await s3.send(new GetObjectCommand({ Bucket: QUEUE_BUCKET, Key: QUEUE_KEY }));
  return JSON.parse(await resp.Body.transformToString());
}

/**
 * Persists the updated topic queue back to S3.
 * @param {Array} queue
 */
async function writeQueue(queue) {
  await s3.send(new PutObjectCommand({
    Bucket:      QUEUE_BUCKET,
    Key:         QUEUE_KEY,
    Body:        JSON.stringify(queue, null, 2),
    ContentType: 'application/json',
  }));
}

export const handler = async () => {
  console.log('Autopilot triggered:', new Date().toISOString());

  // 1. Fetch queue and pick the next pending topic
  const queue   = await readQueue();
  const pending = queue.filter(t => !t.published);

  if (pending.length === 0) {
    console.log('Queue exhausted — nothing to publish');
    return { statusCode: 200, body: 'Queue empty' };
  }

  const topic = pending[0];
  console.log(`Publishing: "${topic.title}" → ${topic.slug}.html`);

  // 2. Pull SSH secrets from SSM (no AI key needed — Bedrock uses IAM role)
  const [sshKey, sshHost, sshUser, webRoot] = await Promise.all([
    getParam('/ta/vps-ssh-key'),
    getParam('/ta/vps-host'),
    getParam('/ta/vps-user'),
    getParam('/ta/vps-webroot'),
  ]);

  const sshConfig = { host: sshHost, username: sshUser, privateKey: sshKey };

  // 3. Generate content via AWS Bedrock (Claude Sonnet) — uses Lambda IAM role
  const content = await generateContent(topic);

  // 4. Render full HTML page
  const html = renderHTML(topic, content);

  // 5. Deploy files to the server
  await deployFile(sshConfig, webRoot, topic, html);
  await updateSectionIndex(sshConfig, webRoot, topic, content);
  await writeLatestTopic(sshConfig, webRoot, topic, content);

  // 6. Mark topic as published and persist queue
  const entry = queue.find(t => t.id === topic.id);
  entry.published    = true;
  entry.publishedAt  = new Date().toISOString();
  await writeQueue(queue);

  console.log(`Done. Published: "${topic.title}"`);
  return { statusCode: 200, body: `Published: ${topic.title}` };
};
