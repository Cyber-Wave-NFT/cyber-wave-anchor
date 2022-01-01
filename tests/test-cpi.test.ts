import * as anchor from '@project-serum/anchor'

describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)

	// DAO 프로그램, register 프로그램 가져오기
	const dao = anchor.workspace.Dao
	const register = anchor.workspace.Register

	// 로컬 월렛 키페어 가져오기
	const key = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])

	// 클라이언트 월렛 어카운트
	const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(key)

	let newDataAccount: anchor.web3.PublicKey
	const GREETING_SIZE = 48
	it('test amu', async () => {
		const SEED = '11111111112222222222333333333346' // spl token
		// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
		newDataAccount = await anchor.web3.PublicKey.createWithSeed(clientWalletAccount.publicKey, SEED, dao.programId)
		// newDataAccount가 가지고있는 DAO 소속 data account
		const dataAccount = await dao.provider.connection.getAccountInfo(newDataAccount)
		// data account가 null이면 DAO가 홀딩하는 data account를 만들어준다.
		// null이 아니면 그냥 해당 데이터 어카운트를 사용한다.
		if (dataAccount === null) {
			console.log('Creating account', newDataAccount.toBase58(), 'to say hello to')

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
				}),
			)

			// 트랜잭션 실제 발생
			await dao.provider.send(createNewAccDao, [clientWalletAccount])
		} else {
			console.log('success')
			console.log(dataAccount)
		}
	})

	it('Send transaction to register program', async () => {
		try {
			const newAccount = anchor.web3.Keypair.generate()
			const tx = await dao.rpc.initialize({
				accounts: {
					myAccount: newAccount.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [newAccount],
			})
			console.log('Your transaction signature', tx)
			await register.rpc.register(new anchor.BN(1), {
				accounts: {
					myAccount: newAccount.publicKey,
					daoProgram: dao.programId,
				},
			})

			const result = await dao.account.programAccountInfo.fetch(newAccount.publicKey)
			console.log(result['level'])
			expect(result['level']).toBe(1)
		} catch (err) {
			fail(err)
		}
	})
})
