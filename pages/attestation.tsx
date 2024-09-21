import { SignProtocolClient, SpMode, EvmChains, IndexService } from "@ethsign/sp-sdk";
import { privateKeyToAccount } from "viem/accounts";
import config from './config.json';


const getSchemaID = (): string => {
    const schemaId = config.DISABILITY_PROOF_SCHEMA_ID;
    if (!schemaId) {
        throw new Error("Schema ID environment variable is not set");
    }
    return schemaId;
};

const getWalletAddress = (): string => {
    const walletAddress = config.WALLET_ADDRESS?.toLowerCase();
    if (!walletAddress) {
        throw new Error("Wallet address environment variable is not set");
    }
    return walletAddress;
};

type HexString = `0x${string}`;

const getPrivateKey = (): HexString => {
    const privateKey = config.PRIVATE_KEY;
    console.log("Private Key:", privateKey);
    if (!privateKey) {
        throw new Error("PRIVATE_KEY environment variable is not set");
    }
    if (!privateKey.startsWith('0x')) {
        throw new Error("PRIVATE_KEY must start with '0x'");
    }
    if (privateKey.length !== 66) {
        throw new Error("PRIVATE_KEY must be 32 bytes long (64 characters + '0x' prefix)");
    }
    return privateKey as HexString; // Type assertion to HexString
};


const initializeIndexService = async (): Promise<IndexService> => {
    return new IndexService("testnet");
};


const initializeSignClient = async () => {
    try {
        const privateKey = getPrivateKey();
        const client = new SignProtocolClient(SpMode.OnChain, {
            chain: EvmChains.sepolia,
            account: privateKeyToAccount(privateKey),
        });
        if (!client) {
            throw new Error("Failed to initialize SignProtocolClient");
        }
        return client;
    } catch (error) {
        console.error("Error initializing SignProtocolClient:", error.message);
        throw error;
    }
};


// Data type for the attestation data
interface AttestationData {
    walletAddress: string;
    pA: string[];
    pB_1: string[];
    pB_2: string[];
    pC: string[];
    expiredDate: number;
}

// Function to create attestation
const createAttestation = async (signClient: SignProtocolClient, schemaId: string, data: AttestationData): Promise<string> => {
    try {
        const attestationResponse = await signClient.createAttestation(
            {
                schemaId,
                data: {
                    walletAddress: data.walletAddress,
                    pA: data.pA,
                    pB_1: data.pB_1,
                    pB_2: data.pB_2,
                    pC: data.pC,
                    expiredDate: data.expiredDate,
                },
                indexingValue: data.walletAddress,
                attester: data.walletAddress,
            },
            {
                getTxHash: (txHash: string) => {
                    console.log("Transaction hash:", txHash);
                },
            }
        );

        console.log("Full attestation response:", JSON.stringify(attestationResponse, null, 2));
        console.log("Attestation created:", attestationResponse.attestationId);
        console.log(`https://sepolia.etherscan.io/tx/${attestationResponse.txHash}`);
        return attestationResponse.attestationId;

    } catch (error) {
        console.error("Error creating attestation:", error);
        throw error;
    }
};

// Function to verify attestation
const verifyAttestation = async (signClient: SignProtocolClient, attestationId: string): Promise<any> => {
    try {
        const attestation = await signClient.getAttestation(attestationId);
        console.log("Attestation verified:", attestation);
        return attestation;
    } catch (error) {
        console.error("Error verifying attestation:", error);
        throw error;
    }
};

// Main function to run the entire process
const runAttestationProcess = async (signClient: SignProtocolClient): Promise<any> => {
    try {
        const pa = [
            "0x11de610f0458c8c84efda2a6facdfb782fd35618247514d44e3cd137a0c79ff1",
            "0xa826843dc2bb3dc9af4972381bcff02b816c3332339d797dcf9f7f3b8e2e448"
        ];
        const pb = [
            [
                "0x246f7a8f35d0b3eefc2938948c7e3aa9718f3c64318590bc5d2e0d7c10abcca1",
                "0xf97326d2869dde327ab0ef3cdc5126e13f04bd1a42b7a3994da2150ae7990c4"
            ],
            [
                "0xce79b7cdd27fb74312e512152816450ec38017bcda782553ce390aa2263fcc1",
                "0x1d59d02d6bef8685f1a4eeb9dfa63c16427ec8fed51874e9380d0c378ff4e842"
            ]
        ];
        const pc = [
            "0x2c19786621e3b09a08eac2360e3715f623673f0018a1c4a8e989e670b7594100",
            "0x4ebbfac4112041d6619cefc3509cc9dfcc2191d271129af0fcb82dc1e6fe1da"
        ];
        const schemaId = getSchemaID();
        const exampleData: AttestationData = {
            walletAddress: getWalletAddress(),
            pA: pa,
            pB_1: pb[0],
            pB_2: pb[1],
            pC: pc,
            expiredDate: Math.floor(Date.now() / 1000) + 31536000,
        };

        const attestationId = await createAttestation(signClient, schemaId, exampleData);
        const verifiedAttestation = await verifyAttestation(signClient, attestationId);
        return verifiedAttestation;

    } catch (error) {
        console.error("Error in attestation process:", error);
    }
};

const querySchema = async (signClient: SignProtocolClient, schemaId: string): Promise<any> => {
    try {
        const schema = await signClient.getSchema(schemaId);
        console.log("Schema Info:", JSON.stringify(schema, null, 2));
        return schema;
    } catch (error) {
        console.error("Error querying schema:", error);
        throw error;
    }
};

const queryAttestationsByWalletAddress = async (indexService: IndexService, walletAddress: string, schemaId?: string): Promise<any> => {
    try {
        console.log(`Querying attestations for wallet: ${walletAddress}`);
        const queryParams: any = {
            mode: "onchain",
            page: 1,
            indexingValue: walletAddress,
        };

        if (schemaId) {
            queryParams.schemaId = schemaId;
        }

        console.log("Query params:", JSON.stringify(queryParams, null, 2));

        const attestations = await indexService.queryAttestationList(queryParams);
        return attestations;
    } catch (error) {
        console.error("Error querying attestations by wallet address:", error);
        throw error;
    }
};

// Export functions
export {
    initializeIndexService,
    initializeSignClient,
    runAttestationProcess,
    getSchemaID,
    getWalletAddress,
    querySchema,
    queryAttestationsByWalletAddress,
    createAttestation
};
