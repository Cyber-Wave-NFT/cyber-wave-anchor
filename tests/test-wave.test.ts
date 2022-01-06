import * as anchor from '@project-serum/anchor'
import * as borsh from 'borsh'
import { ProgramAccountInfo, ProgramAccountInfoSchema, RegionInfo, RegionInfoSchema } from './borsh.classes'

jest.setTimeout(30000000)
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)
	let newDataAccountPubkey: anchor.web3.PublicKey
	// DAO 프로그램, register 프로그램 가져오기
	const register = anchor.workspace.Register
	const waveSizeCalculation = anchor.workspace.WaveSizeCalculation

	// 로컬 월렛 키페어 가져오기
	const clientWalletKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])
	const bKey = Buffer.from([182,218,165,125,105,218,250,172,86,209,102,1,218,251,206,177,250,78,56,113,20,4,22,171,78,111,161,40,244,247,244,144,57,245,94,190,210,65,28,230,82,227,71,169,143,213,13,89,123,225,138,180,163,29,68,0,88,235,40,114,106,104,234,184])

	// 클라이언트 월렛 어카운트
	const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(clientWalletKey)
	const bClientWalletAccount = anchor.web3.Keypair.fromSecretKey(bKey)
	
	console.log(clientWalletAccount.publicKey.toBase58())
	console.log(bClientWalletAccount.publicKey.toBase58())

	it('test rns', async () => {
		const ts = await register.account.programAccountInfo.all()
		const accounts = ts.map((elem: {publicKey: any, account: Object}) => (elem.account))
		console.log(accounts)
		const res = accounts.reduce((acc: any, cur: any) => {
			acc += cur.power
			return acc
		}, 0)
		const SIZE = borsh.serialize(
			RegionInfoSchema,
			new RegionInfo(),
		  ).length + 8
		newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			bClientWalletAccount.publicKey,
			"CENTRAL_REGION1",
			waveSizeCalculation.programId
		)
		const newDataAccount = await register.provider.connection.getAccountInfo(newDataAccountPubkey)
		if (!newDataAccount) {
			const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
			let prevLamports = await provider.connection.getBalance(bClientWalletAccount.publicKey)
			console.log(prevLamports / 1000000000)

			// 트랜잭션
			let createNewAccDao = new anchor.web3.Transaction().add(
				// create account
				anchor.web3.SystemProgram.createAccountWithSeed({
					fromPubkey: bClientWalletAccount.publicKey,
					basePubkey: bClientWalletAccount.publicKey,
					seed: "CENTRAL_REGION1",
					newAccountPubkey: newDataAccountPubkey,
					lamports,
					space: SIZE,
					programId: waveSizeCalculation.programId,
				}),
			)

			// 트랜잭션 실제 발생
			await waveSizeCalculation.provider.send(createNewAccDao, [bClientWalletAccount])
			const tx = await waveSizeCalculation.rpc.initialize(
				{
				accounts: {
					myAccount: newDataAccountPubkey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [],
			})
		}
		const random1 = Math.random()
		const random2 = Math.random()
		const random3 = Math.random()
		const random4 = Math.random()
		const allRandom = random1 + random2 + random3 + random4
		await waveSizeCalculation.rpc.sizeCalculate(
			new anchor.BN(12345),
			new anchor.BN(Math.round((random1 / allRandom) * 100)),
			new anchor.BN(Math.round((random2 / allRandom) * 100)),
			new anchor.BN(Math.round((random3 / allRandom) * 100)),
			new anchor.BN(Math.round((random4 / allRandom) * 100)),
			{
			accounts: {
				centralRegionAccount: newDataAccountPubkey,
			},
			signers: [],
		})
		const result = await waveSizeCalculation.account.regionInfo.fetch(newDataAccountPubkey)
		console.log(result)
	})

})
