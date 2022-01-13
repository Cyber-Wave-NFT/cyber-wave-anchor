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
	const serverMainKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])
	const clientKey = Buffer.from([6,47,179,252,50,159,110,185,226,7,125,211,8,220,207,220,93,30,98,221,88,235,0,62,38,247,67,47,171,86,243,228,234,167,128,167,139,174,181,164,94,129,41,59,157,64,164,48,61,60,26,133,57,176,25,73,112,74,136,40,112,115,174,238])

	// 클라이언트 월렛 어카운트
	const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(clientKey)
	const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)
	
	console.log(clientWalletAccount.publicKey.toBase58())
	console.log(serverWalletAccount.publicKey.toBase58())

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
			serverWalletAccount.publicKey,
			"CENTRAL_REGION1",
			waveSizeCalculation.programId
		)
		const newDataAccount = await register.provider.connection.getAccountInfo(newDataAccountPubkey)
		if (!newDataAccount) {
			const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
			let prevLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
			console.log(prevLamports / 1000000000)

			// 트랜잭션
			const tx = await waveSizeCalculation.rpc.initialize(
				{
				accounts: {
					myAccount: newDataAccountPubkey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				instructions: [
					anchor.web3.SystemProgram.createAccountWithSeed({
						fromPubkey: serverWalletAccount.publicKey,
						basePubkey: serverWalletAccount.publicKey,
						seed: "CENTRAL_REGION1",
						newAccountPubkey: newDataAccountPubkey,
						lamports,
						space: SIZE,
						programId: waveSizeCalculation.programId,
					}),
				],
				signers: [serverWalletAccount],
			})
		}
		await waveSizeCalculation.rpc.sizeCalculate(
			new anchor.BN(res),
			new anchor.BN(makeId(8)),
			new anchor.BN(makeId(8)),
			new anchor.BN(makeId(8)),
			new anchor.BN(makeId(8)),
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
