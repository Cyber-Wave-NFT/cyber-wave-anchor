import * as anchor from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token"

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
		
		const serverKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185]);
		const serverMainAccount = anchor.web3.Keypair.fromSecretKey(serverKey);

		// 제2의 지갑
		const clientKey = Buffer.from([248,5,10,46,193,72,250,211,21,18,41,213,218,78,53,139,74,180,150,14,53,74,45,170,13,249,139,142,166,242,196,249,74,95,186,189,4,6,75,155,134,150,50,38,195,1,128,28,61,215,77,69,133,229,172,137,58,11,151,105,4,187,54,77])
		const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(clientKey)

		console.log('server pubkey: ', serverMainAccount.publicKey.toBase58())

		const mintPubkey = new anchor.web3.PublicKey("92sPFo54jPKN75FuY5HXC7qMC8z31YR8juRJi9Z3Z2BK")
		mint = new Token(
			provider.connection,
			mintPubkey,
			TOKEN_PROGRAM_ID,
			clientWalletAccount
		);

		console.log(TOKEN_PROGRAM_ID.toBase58());
		console.log('mint: ', mint.publicKey.toBase58());

		sender = clientWalletAccount;
		receiver = serverMainAccount;

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

		}
		// Transfer Spl Token
		instructions.push(
		  Token.createTransferInstruction(
		    TOKEN_PROGRAM_ID,
		    senderTokenAccount.address,
		    associatedRecieverTokenAddr,
		    sender.publicKey,
		    [sender],
		    1
		  )
		);

		const transaction = new anchor.web3.Transaction().add(...instructions)
		
		const transactionSignature = await provider.connection.sendTransaction(
			transaction,
			[sender],
			{ skipPreflight: true }
		);
		
		await provider.connection.confirmTransaction(transactionSignature);
		// receiverTokenAccount = await provider.connection.getAccountInfo(associatedRecieverTokenAddr);
		receiverTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
		receiver.publicKey
		)

		console.log(receiverTokenAccount.owner.toBase58())
		console.log(receiverTokenAccount.mint.toBase58())
		console.log(receiverTokenAccount.address.toBase58())
	})
})

