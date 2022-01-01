import * as anchor from '@project-serum/anchor'
import { clusterApiUrl, Connection, PublicKey, Keypair, Transaction } from "@solana/web3.js"
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout } from "@solana/spl-token"

describe('cpi', () => {
	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.Provider.env())

	// DAO 프로그램, register 프로그램 가져오기
	const dao = anchor.workspace.Dao
	const register = anchor.workspace.Register

	// 로컬 월렛 키페어 가져오기
	const key = Uint8Array.from(
		[182,150,222,7,91,100,132,163,126,132,192,174,252,86,128,175,119,194,160,54,184,114,126,120,196,84,73,145,194,4,223,79,81,114,140,35,118,155,201,165,129,171,210,168,11,147,82,133,170,79,244,33,239,13,116,38,28,71,194,81,144,1,104,88]
	)

	// 클라이언트 월렛 어카운트
	const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(key)

	let newDataAccount
	const GREETING_SIZE = 48
	it('test amu', async () => {
		const SEED = "11111111112222222222333333333346" // spl token
		// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
		newDataAccount = await anchor.web3.PublicKey.createWithSeed(
			clientWalletAccount.publicKey,
			SEED,
			dao.programId,
		)
		// newDataAccount가 가지고있는 DAO 소속 data account
		const dataAccount = await dao.provider.connection.getAccountInfo(newDataAccount)
		// data account가 null이면 DAO가 홀딩하는 data account를 만들어준다.
		// null이 아니면 그냥 해당 데이터 어카운트를 사용한다.
		if (dataAccount === null) {
			console.log(
				'Creating account',
				newDataAccount.toBase58(),
				'to say hello to',
			)

			// 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
			const lamports = await dao.provider.connection.getMinimumBalanceForRentExemption(GREETING_SIZE)

			// 트랜잭션
			let createNewAccDao = new anchor.web3.Transaction().add(
				// create account
				anchor.web3.SystemProgram.createAccountWithSeed({
					fromPubkey: clientWalletAccount.publicKey,
					basePubkey: clientWalletAccount.publicKey,
					seed: SEED,
					newAccountPubkey: newDataAccount,
					lamports,
					space: GREETING_SIZE,
					programId: dao.programId,
				})
			)

			// 트랜잭션 실제 발생
			await dao.provider.send(createNewAccDao, [clientWalletAccount])
		} else {
			console.log('success')
			console.log(dataAccount)
		}
	})


	// it('setup data account and create to dao program', async () => {
	// 	newDataAccount = Keypair.generate()

	// 	const lamports = await connection.getMinimumBalanceForRentExemption(GREETING_SIZE)
	
	// 	let create_mint_tx = new Transaction().add(
	// 	  // create mint account
	// 	  SystemProgram.createAccount({
	// 		fromPubkey: program.provider.wallet.publicKey,
	// 		newAccountPubkey: mint.publicKey,
	// 		space: MintLayout.span,
	// 		lamports: lamports,
	// 		programId: TOKEN_PROGRAM_ID,
	// 	  }),
	// 	  // init mint account
	// 	  Token.createInitMintInstruction(
	// 		TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
	// 		mint.publicKey, // mint pubkey
	// 		6, // decimals
	// 		program.provider.wallet.publicKey, // mint authority
	// 		program.provider.wallet.publicKey // freeze authority (if you don't need it, you can set `null`)
	// 	  )
	// 	)
	
	// 	await program.provider.send(create_mint_tx, [mint])
	// 	// Add your test here.
	// 	// const tx = await program.rpc.initialize({})
	// 	// console.log("Your transaction signature", tx)
	// 	// console.log(await program.provider.connection.getParsedAccountInfo(mint))
	// 	sender_token = Keypair.generate()
	// 	let create_sender_token_tx = new Transaction().add(
	// 	  // create token account
	// 	  SystemProgram.createAccount({
	// 		fromPubkey: program.provider.wallet.publicKey,
	// 		newAccountPubkey: sender_token.publicKey,
	// 		space: AccountLayout.span,
	// 		lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
	// 		programId: TOKEN_PROGRAM_ID,
	// 	  }),
	// 	  // init mint account
	// 	  Token.createInitAccountInstruction(
	// 		TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
	// 		mint.publicKey, // mint
	// 		sender_token.publicKey, // token account
	// 		program.provider.wallet.publicKey // owner of token account
	// 	  )
	// 	)
	
	// 	await program.provider.send(create_sender_token_tx, [sender_token])
	
	// 	receiver = Keypair.generate()
	// 	receiver_token = Keypair.generate()
	// 	let create_receiver_token_tx = new Transaction().add(
	// 	  // create token account
	// 	  SystemProgram.createAccount({
	// 		fromPubkey: program.provider.wallet.publicKey,
	// 		newAccountPubkey: receiver_token.publicKey,
	// 		space: AccountLayout.span,
	// 		lamports: await Token.getMinBalanceRentForExemptAccount(program.provider.connection),
	// 		programId: TOKEN_PROGRAM_ID,
	// 	  }),
	// 	  // init mint account
	// 	  Token.createInitAccountInstruction(
	// 		TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
	// 		mint.publicKey, // mint
	// 		receiver_token.publicKey, // token account
	// 		receiver.publicKey // owner of token account
	// 	  )
	// 	)
	
	// 	await program.provider.send(create_receiver_token_tx, [receiver_token])
	
	// 	let mint_tokens_tx = new Transaction().add(
	// 	  Token.createMintToInstruction(
	// 		TOKEN_PROGRAM_ID, // always TOKEN_PROGRAM_ID
	// 		mint.publicKey, // mint
	// 		sender_token.publicKey, // receiver (sholud be a token account)
	// 		program.provider.wallet.publicKey, // mint authority
	// 		[], // only multisig account will use. leave it empty now.
	// 		2e6 // amount. if your decimals is 8, you mint 10^8 for 1 token.
	// 	  )
	// 	)
	
	// 	await program.provider.send(mint_tokens_tx)
	
	// 	console.log("token balance: ", await program.provider.connection.getTokenAccountBalance(sender_token.publicKey))
	// })
	// it("Performs CPI from register to dao", async () => {
	// 	try{
	// 		// Initialize a new puppet account.
	// 		const newDaoAccount = anchor.web3.Keypair.generate()
	// 		const register = anchor.workspace.Register
	// 		const registerAccount = anchor.web3.Keypair.generate()
	// 		const dao = anchor.workspace.Dao
	// 		const [programSigner, bump] = await anchor.web3.PublicKey.findProgramAddress([newDaoAccount.publicKey.toBuffer()], dao.programId)
	// 		console.log(programSigner.toString())
	// 		//puppet.account.puppetAccount.createProgramAddress({from})
    //   		console.log(newDaoAccount.publicKey.toString())

	// 		console.log(dao.programId.toString())
	// 		console.log(register.programId.toString())

	// 		// Invoke the puppet master to perform a CPI to the puppet.
	// 		await register.rpc.register(new anchor.BN(0), {
	// 			accounts: {
	// 				myAccount: newDaoAccount.publicKey,
	// 				daoProgram: dao.programId,
	// 				authority : provider.wallet.publicKey
	// 			},
	// 			signers:[programSigner]
	// 		})

	// 		// Check the state updated.
	// 		const result = await dao.account.account.fetch(newDaoAccount.publicKey)
	// 		console.log(result["data"])
	// 		expect(result["data"]).toBe(new anchor.BN(0))
	// 		}
	// 		catch(err){
	// 			console.log(err)
	// 			fail(err)
	// 		}
		
	// })
})
