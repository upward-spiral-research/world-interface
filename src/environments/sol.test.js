const Sol = require('./sol');
const { Keypair } = require('@solana/web3.js');

const RPC_URL = 'https://api.devnet.solana.com';
const sol = new Sol(RPC_URL);

const senderKeypair = Keypair.generate();
const recipientPublicKey = Keypair.generate().publicKey;

async function airdrop() {
    console.log("Requesting airdrop...");
    const signature = await sol.connection.requestAirdrop(senderKeypair.publicKey, 1e9);
    await sol.connection.confirmTransaction({
        signature,
        ...(await sol.connection.getLatestBlockhash())
    });
    console.log("Airdrop confirmed.");
}

async function testSignTransaction() {
    const signedTransaction = await sol.signTransaction({
        fromPrivateKey: Array.from(senderKeypair.secretKey),
        toPublicKey: recipientPublicKey,
        amount: 1000,
    });

    console.log("Signed Transaction:", signedTransaction);
    return signedTransaction;
}

async function testSubmitTransaction(signedTransaction) {
    const submissionResult = await sol.submitTransaction(signedTransaction.content);
    console.log("Transaction Submission Result:", submissionResult);
}

async function runTests() {
    try {
        await airdrop();
        const signedTransaction = await testSignTransaction();
        await testSubmitTransaction(signedTransaction);
    } catch (error) {
        console.error("Test Error:", error);
    }
}

runTests();