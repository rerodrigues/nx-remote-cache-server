import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers';
import type { S3StoreConfig } from './index.js';

export function buildCredentials(config: S3StoreConfig) {
  const fromConfig = async () => {
    if (!config.accessKeyId || !config.secretAccessKey) {
      const err = new Error('S3Store: no explicit credentials in config') as Error & {
        tryNextLink?: boolean;
      };
      err.tryNextLink = true;
      throw err;
    }
    return {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    };
  };
  return createCredentialChain(
    fromConfig,
    fromNodeProviderChain({ profile: process.env['AWS_PROFILE'] ?? config.ssoProfile }),
  );
}
