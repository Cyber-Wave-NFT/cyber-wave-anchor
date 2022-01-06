import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout, u64, AccountInfo } from "@solana/spl-token";

describe('token-cpi', () => {

	const register = anchor.workspace.Register

	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)
	// anchor.setProvider(anchor.Provider.env());

	let mint: Token;
	let sender: any;
	let senderTokenAccount: any;
	let receiver: any;
	let receiverTokenAccount: any;

	let sender_token;
	let receiver_token;

	it('setup mints and token accounts', async () => {
		const junaKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185]);
		const junaClientWalletAccount = anchor.web3.Keypair.fromSecretKey(junaKey);

		// 내 제2의 지갑
		const aKey = Buffer.from([194,247,80,243,85,43,70,110,30,50,140,20,228,33,227,7,116,243,56,210,37,188,210,203,37,84,28,35,223,36,172,219,137,217,186,125,7,222,191,70,53,192,235,235,77,111,169,91,176,251,255,148,10,122,240,81,246,26,138,236,116,9,250,104]);
		const aClientWalletAccount = anchor.web3.Keypair.fromSecretKey(aKey);

		console.log('juna pubkey: ', junaClientWalletAccount.publicKey.toBase58());

		const mintPubkey = new anchor.web3.PublicKey("5CBMkYWprc5XLhDDLYHf8GJzgJBmkdoBc4WwoTBWd2Lj");
			mint = new Token(
			provider.connection,
			mintPubkey,
			TOKEN_PROGRAM_ID,
			aClientWalletAccount
		);

		console.log(TOKEN_PROGRAM_ID.toBase58());
		console.log('mint: ', mint.publicKey.toBase58());
		const lamports = await Token.getMinBalanceRentForExemptMint(register.provider.connection);
		console.log(lamports / 1000000000);

		sender = aClientWalletAccount;
		receiver = junaClientWalletAccount;

		console.log('sender: ', sender.publicKey.toBase58());
		console.log('receiver: ', receiver.publicKey.toBase58());

		senderTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
			sender.publicKey
		);
		
		// Get the derived address of the destination wallet which will hold the custom token
		const associatedRecieverTokenAddr = await Token.getAssociatedTokenAddress(
		mint.associatedProgramId,
		mint.programId,
		mint.publicKey,
		receiver.publicKey
		);

		const receiverAccount = await provider.connection.getAccountInfo(associatedRecieverTokenAddr);
		const instructions: anchor.web3.TransactionInstruction[] = []; 
		if (receiverAccount === null) {
		// create Association Account
		instructions.push(
			Token.createAssociatedTokenAccountInstruction(
			mint.associatedProgramId,
			mint.programId,
			mint.publicKey,
			associatedRecieverTokenAddr,
			receiver.publicKey,
			sender.publicKey
			)
		)

		const transaction = new anchor.web3.Transaction().add(...instructions);
		transaction.feePayer = sender;
		transaction.recentBlockhash = (await provider.connection.getRecentBlockhash()).blockhash;
		
		const transactionSignature = await provider.connection.sendTransaction(
			transaction,
			[sender],
			{ skipPreflight: true }
		);
		
		await provider.connection.confirmTransaction(transactionSignature);
		}
		// Transfer Spl Token
		// instructions.push(
		//   Token.createTransferInstruction(
		//     TOKEN_PROGRAM_ID,
		//     senderTokenAccount.address,
		//     associatedRecieverTokenAddr,
		//     sender.publicKey,
		//     [sender],
		//     1
		//   )
		// );

		// receiverTokenAccount = await provider.connection.getAccountInfo(associatedRecieverTokenAddr);
		receiverTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
		receiver.publicKey
		);

		console.log(receiverTokenAccount.owner.toBase58());
		console.log(receiverTokenAccount.mint.toBase58());
		console.log(receiverTokenAccount.address.toBase58());
	});

	it('transfter wrapper', async () => {
        let amount = new anchor.BN(1);
        console.log(amount);
        await register.rpc.transferWrapper(amount, {
            accounts: {
                sender: sender.publicKey,
                senderToken: senderTokenAccount.address,
                receiverToken: receiverTokenAccount.address,
                mint: mint.publicKey,
                tokenProgram: TOKEN_PROGRAM_ID,
            }
        })

        console.log("sender token balance: ", await register.provider.connection.getTokenAccountBalance(senderTokenAccount.publicKey));
        console.log("receiver token balance: ", await register.provider.connection.getTokenAccountBalance(receiverTokenAccount.publicKey));
    });
});

