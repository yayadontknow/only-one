declare namespace NodeJS {
  export interface ProcessEnv {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    GITHUB_ID: string;
    GITHUB_SECRET: string;
    FACEBOOK_ID: string;
    FACEBOOK_SECRET: string;
    TWITTER_ID: string;
    TWITTER_SECRET: string;
    GOOGLE_ID: string;
    GOOGLE_SECRET: string;
    AUTH0_ID: string;
    AUTH0_SECRET: string;

    // Custom environment variables
    PRIVATE_KEY: string;
    WALLET_ADDRESS: string;
    DYNAMIC_ENVIRONMENT_ID: string;
    DISABILITY_PROOF_SCHEMA_ID: string;
    FULL_DISABILITY_PROOF_SCHEMA_ID: string;
    CONTRACT_ADDRESS: string;
    PROVIDER_URL: string;
    RPC_PRIVATE_KEY: string;
  }
}
