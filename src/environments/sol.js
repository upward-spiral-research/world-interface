const { Connection, Transaction, SystemProgram, Keypair } = require('@solana/web3.js');

class Sol {
    constructor(options) {
        const { solanaRpcUrl } = options;
        this.connection = new Connection(solanaRpcUrl || 'https://api.mainnet-beta.solana.com');
    }

    getCommands() {
        return [
            { name: "sign_transaction", description: "Sign a Solana transaction off-chain" },
            { name: "submit_transaction", description: "Submit a signed transaction to the Solana network" },
            { name: "help", description: "Show Sol help" },
        ];
    }

    async handleCommand(command, params) {
        const action = command.toLowerCase();

        switch (action) {
            case "sign_transaction":
                return this.signTransaction(params);
            case "submit_transaction":
                return this.submitTransaction(params);
            case "help":
                return this.help();
            default:
                return { error: `Unknown action: ${action}` };
        }
    }

    async signTransaction({ fromPrivateKey, toPublicKey, amount }) {
        try {
            const fromKeypair = Keypair.fromSecretKey(new Uint8Array(fromPrivateKey));
            const { blockhash } = await this.connection.getLatestBlockhash();
            const transaction = new Transaction({
                recentBlockhash: blockhash,
                feePayer: fromKeypair.publicKey,
            }).add(
                SystemProgram.transfer({
                    fromPubkey: fromKeypair.publicKey,
                    toPubkey: toPublicKey,
                    lamports: amount,
                })
            );
            transaction.sign(fromKeypair);
            const serializedTransaction = transaction.serialize();
            const base64Transaction = Buffer.from(serializedTransaction).toString('base64');
            return {
                title: "Transaction Signed Successfully",
                content: base64Transaction,
            };
        } catch (error) {
            return {
                title: "Error Signing Transaction",
                content: error.message,
            };
        }
    }

    async submitTransaction(base64Transaction) {
        try {
            const buffer = Buffer.from(base64Transaction, 'base64');
            const transaction = Transaction.from(buffer);
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            const signature = await this.connection.sendRawTransaction(transaction.serialize());
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight,
            });
            return {
                title: "Transaction Submitted Successfully",
                content: `Transaction signature: ${signature}, Confirmation Status: ${confirmation.value.err ? 'Failed' : 'Confirmed'}`,
            };
        } catch (error) {
            return {
                title: "Error Submitting Transaction",
                content: error.message,
            };
        }
    }

    help() {
        return {
            title: "Sol Help",
            content: `Available commands:
sign_transaction - Sign a Solana transaction off-chain
submit_transaction - Submit a signed transaction to the Solana network`,
        };
    }
}

module.exports = Sol;