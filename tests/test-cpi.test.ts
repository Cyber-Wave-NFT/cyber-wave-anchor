import * as anchor from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as borsh from 'borsh'
import { ProgramAccountInfoSchema, ProgramAccountInfo } from './borsh.classes';

jest.setTimeout(30000000)
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)
	
	// DAO 프로그램, register 프로그램 가져오기
	// TODO: register 이름 바꾸기
	const register = anchor.workspace.CyberWave

	// 로컬 월렛 키페어 가져오기
	// 61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv
	const clientKey = Buffer.from([248,5,10,46,193,72,250,211,21,18,41,213,218,78,53,139,74,180,150,14,53,74,45,170,13,249,139,142,166,242,196,249,74,95,186,189,4,6,75,155,134,150,50,38,195,1,128,28,61,215,77,69,133,229,172,137,58,11,151,105,4,187,54,77])
	// 9KucZiDa1jfp9gX7r7rp1r7VxVCrxUsShvpDkg98KbsW
	const serverMainKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])
	
	// 클라이언트 월렛 어카운트
	const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(clientKey)
	const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)

	console.log(clientWalletAccount.publicKey.toBase58())
	console.log(serverWalletAccount.publicKey.toBase58())

	let newDataAccountPubkey: anchor.web3.PublicKey
	// let newDataAccount: AccountInfo

	let mint: Token;
	const SIZE = borsh.serialize(
		ProgramAccountInfoSchema,
		new ProgramAccountInfo(),
	  ).length + 8
	  
	const SEED = '92sPFo54jPKaasd' // spl token
	const mintPubkey = new anchor.web3.PublicKey("92sPFo54jPKN75FuY5HXC7qMC8z31YR8juRJi9Z3Z2BK")
	mint = new Token(
				provider.connection,
				mintPubkey,
				TOKEN_PROGRAM_ID,
				clientWalletAccount
			)

	it('Check nft token account', async () => {
		//check nft token account, before (initialize, register)
		const senderTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
			clientWalletAccount.publicKey
		)
		const associatedReceiverTokenAddr = await Token.getAssociatedTokenAddress(
			mint.associatedProgramId,
			mint.programId,
			mint.publicKey,
			serverWalletAccount.publicKey
		)

		newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			serverWalletAccount.publicKey,
			SEED,
			register.programId
		)

		const metaDataProgramPubkey = new anchor.web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s")
		// get nft token metadata public key
		const a = ""
		const [metadataPubkey, metadataPubkeyBump] = await anchor.web3.PublicKey.findProgramAddress([Buffer.from("metadata", "utf-8"), metaDataProgramPubkey.toBuffer(), mint.publicKey.toBuffer()], metaDataProgramPubkey)
		console.log(metadataPubkey.toBase58())
		const newDataAccount = await register.provider.connection.getAccountInfo(newDataAccountPubkey)

		// initialize, Check and create Dao Data Account
		if (newDataAccount === null){
			const sender = clientWalletAccount
			const receiver = serverWalletAccount
			
			// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
			newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
				serverWalletAccount.publicKey,
				SEED,
				register.programId
			)
			const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
			const instructions: anchor.web3.TransactionInstruction[] = [
				anchor.web3.SystemProgram.createAccountWithSeed({
					fromPubkey: clientWalletAccount.publicKey,
					basePubkey: serverWalletAccount.publicKey,
					seed: SEED,
					newAccountPubkey: newDataAccountPubkey,
					lamports,
					space: SIZE,
					programId: register.programId,
				}),
			]
			// newDataAccount가 가지고있는 DAO 소속 data account
			const newDataAccount = await register.provider.connection.getAccountInfo(newDataAccountPubkey)
			// data account가 null이면 DAO가 홀딩하는 data account를 만들어준다.
			// null이 아니면 그냥 해당 데이터 어카운트를 사용한다.
			// TODO: null 밖에서 확인했으니 지워야할듯
			if (newDataAccount === null) {
				console.log('Creating account', newDataAccountPubkey.toBase58(), 'to say hello to')

				// 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
				let prevLamports = await provider.connection.getBalance(clientWalletAccount.publicKey)
				console.log(prevLamports / 1000000000)

				const receiverAccount = await provider.connection.getAccountInfo(associatedReceiverTokenAddr);

				if (receiverAccount === null) {
					instructions.push(
						Token.createAssociatedTokenAccountInstruction(
						mint.associatedProgramId,
						mint.programId,
						mint.publicKey,
						associatedReceiverTokenAddr,
						receiver.publicKey,
						sender.publicKey
						)
					)
				}
				instructions.push(
					Token.createTransferInstruction(
						TOKEN_PROGRAM_ID,
						senderTokenAccount.address,
						associatedReceiverTokenAddr,
						sender.publicKey,
						[sender],
						1
					)
				)

				// 트랜잭션 실제 발생
				const tx = await register.rpc.initialize({
					accounts: {
						myAccount: newDataAccountPubkey,
						metaData: metadataPubkey,
						user: clientWalletAccount.publicKey,
						systemProgram: anchor.web3.SystemProgram.programId,
					},
					instructions: instructions,
					signers: [clientWalletAccount, serverWalletAccount],
				})

				const result = await register.account.programAccountInfo.fetch(newDataAccountPubkey)
				console.log('Your transaction signature', tx)
				console.log(`newDataAccount:${newDataAccountPubkey}`)
				console.log(result)
				
				let postLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
				console.log(postLamports / 1000000000)
			} else {
				console.log('success')
				console.log(newDataAccountPubkey.toBase58())
			}
		}
		else{
			try {
				console.log("is it deposit?")
				// console.log(newDataAccountPubkey.toBase58())

				const isDeposit = true
				// const dataAccount = await register.account.programAccountInfo.fetch(newDataAccountPubkey)

				// NFT owner를 바꾸는 식으로 구현한 다음
				// NFT의 onwer를 확인하여 등록여부를 확인하는거로 바뀌어야함
				// if (isDeposit && dataAccount['registeredAt'] !== 0) {
				//  console.log("You are trying to register but Already registered")
				//  return
				// } else if (!isDeposit && dataAccount['registeredAt'] === 0) {
				//  console.log("You are trying to unregister but isn't Registered.")
				//  return
				// }

				if (isDeposit) {
					// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
					newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
						serverWalletAccount.publicKey,
						SEED,
						register.programId
					)
					const sender = clientWalletAccount
					const receiver = serverWalletAccount
					const mintPubkey = new anchor.web3.PublicKey("92sPFo54jPKN75FuY5HXC7qMC8z31YR8juRJi9Z3Z2BK")
					mint = new Token(
						provider.connection,
						mintPubkey,
						TOKEN_PROGRAM_ID,
						clientWalletAccount
					)
					const senderTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
						sender.publicKey
					)
					const associatedReceiverTokenAddr = await Token.getAssociatedTokenAddress(
						mint.associatedProgramId,
						mint.programId,
						mint.publicKey,
						receiver.publicKey
					)
					//token 옮기기
					const instructions: anchor.web3.TransactionInstruction[] = [
						Token.createTransferInstruction(
							TOKEN_PROGRAM_ID,
							senderTokenAccount.address,
							associatedReceiverTokenAddr,
							sender.publicKey,
							[sender],
							1
						)
					]

					// 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
					let prevLamports = await provider.connection.getBalance(clientWalletAccount.publicKey)
					console.log(prevLamports / 1000000000)

					// 트랜잭션 실제 발생
					const tx = await register.rpc.register({
						accounts: {
							myAccount: newDataAccountPubkey,
							user: clientWalletAccount.publicKey,
						},
						instructions: instructions,
						signers: [clientWalletAccount, serverWalletAccount],
					})

					console.log('Your transaction signature', tx)
					const result = await register.account.programAccountInfo.fetch(newDataAccountPubkey)
					console.log(result)

					let postLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
					console.log(postLamports / 1000000000)

				} else {
					const receiver = clientWalletAccount
					const sender = serverWalletAccount
					// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
					newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
						serverWalletAccount.publicKey,
						SEED,
						register.programId
					)
					const mintPubkey = new anchor.web3.PublicKey("92sPFo54jPKN75FuY5HXC7qMC8z31YR8juRJi9Z3Z2BK")
					mint = new Token(
						provider.connection,
						mintPubkey,
						TOKEN_PROGRAM_ID,
						serverWalletAccount
					)
					const senderTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
						sender.publicKey
					)
					const associatedReceiverTokenAddr = await Token.getAssociatedTokenAddress(
						mint.associatedProgramId,
						mint.programId,
						mint.publicKey,
						receiver.publicKey
					)
					const instructions: anchor.web3.TransactionInstruction[] = [
						Token.createTransferInstruction(
							TOKEN_PROGRAM_ID,
							senderTokenAccount.address,
							associatedReceiverTokenAddr,
							sender.publicKey,
							[sender],
							1
						)
					]

					// 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
					let prevLamports = await provider.connection.getBalance(clientWalletAccount.publicKey)
					console.log(prevLamports / 1000000000)

					// 트랜잭션 실제 발생
					const tx = await register.rpc.unregister({
						accounts: {
							myAccount: newDataAccountPubkey,
							user: clientWalletAccount.publicKey,
						},
						instructions: instructions,
						signers: [clientWalletAccount, serverWalletAccount],
					})

					console.log('Your transaction signature', tx)
					const result = await register.account.programAccountInfo.fetch(newDataAccountPubkey)
					console.log(result)
					let postLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
					console.log(postLamports / 1000000000)
				}
				// await register.rpc.moveRegion("REGION_03", {
				// 	accounts: {
				// 		myAccount: newDataAccountPubkey,
				// 		user: clientWalletAccount.publicKey,
				// 	},
				// 	signers: [clientWalletAccount, serverWalletAccount],
				// })
				const result = await register.account.programAccountInfo.fetch(newDataAccountPubkey)
				console.log(result)
				// expect(result['level']).toBe(1)
			} catch (err) {
				console.log(err)
				fail(err)
			}
		}
	})
})
