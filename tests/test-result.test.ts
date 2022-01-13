import * as anchor from '@project-serum/anchor'
import * as borsh from 'borsh'
import { RegionResultInfo, RegionResultInfoSchema } from './borsh.classes'
import { Utils } from './utils/utils'

jest.setTimeout(30000000)
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)
	let centralRegionAccountPubkey: anchor.web3.PublicKey
	let centralRegionResultAccountPubkey: anchor.web3.PublicKey
	// DAO 프로그램, register 프로그램 가져오기
	const cyberWave = anchor.workspace.CyberWave

	// 로컬 월렛 키페어 가져오기
	const serverMainKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])

	// 클라이언트 월렛 어카운트
	const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)
	
	console.log(serverWalletAccount.publicKey.toBase58())

	it('test rns', async () => {
		const ts = await cyberWave.account.programAccountInfo.all()
		const accounts = ts.map((elem: {publicKey: any, account: Object}) => (elem.account))
		console.log(accounts)
		const res = accounts.reduce((acc: any, cur: any) => {
			if (cur.region === "REGION_01") {
				acc.region_1 += cur.levelPower * cur.powerMagnified / 10000
			}
			if (cur.region === "REGION_02") {
				acc.region_2 += cur.levelPower * cur.powerMagnified / 10000
			}
			if (cur.region === "REGION_03") {
				acc.region_3 += cur.levelPower * cur.powerMagnified / 10000
			}
			if (cur.region === "REGION_04") {
				acc.region_4 += cur.levelPower * cur.powerMagnified / 10000
			}
			return acc
		}, { region_1: 0, region_2: 0, region_3: 0, region_4: 0 })
		const SIZE = borsh.serialize(
			RegionResultInfoSchema,
			new RegionResultInfo(),
		  ).length + 8
		centralRegionAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			serverWalletAccount.publicKey,
			"CENTRAL_REGION1",
			cyberWave.programId
		)
		centralRegionResultAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			serverWalletAccount.publicKey,
			"CENTRAL_REGION_RESULT",
			cyberWave.programId
		)
		const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
		let prevLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
		console.log(prevLamports / 1000000000)
		const centralRegionResultAccount = await cyberWave.provider.connection.getAccountInfo(centralRegionResultAccountPubkey)
		// 트랜잭션
		if (!centralRegionResultAccount){
			const tx = await cyberWave.rpc.initializeRegionResultData(
				{
					accounts: {
						myAccount: centralRegionResultAccountPubkey,
						user: serverWalletAccount.publicKey,
						systemProgram: anchor.web3.SystemProgram.programId,
					},
					instructions: [
						anchor.web3.SystemProgram.createAccountWithSeed({
							fromPubkey: serverWalletAccount.publicKey,
							basePubkey: serverWalletAccount.publicKey,
							seed: "CENTRAL_REGION_RESULT",
							newAccountPubkey: centralRegionResultAccountPubkey,
							lamports,
							space: SIZE,
							programId: cyberWave.programId,
						}),
					],
					signers: [serverWalletAccount],
				})
		}
		await cyberWave.rpc.regionResultCalculate(
			Utils.makeId(8),
			Utils.makeId(8),
			Utils.makeId(8),
			Utils.makeId(8),
			new anchor.BN(res.region_1),
			new anchor.BN(res.region_2),
			new anchor.BN(res.region_3),
			new anchor.BN(res.region_4),
			{
			accounts: {
				centralRegionAccount: centralRegionAccountPubkey,
				centralRegionResultAccount: centralRegionResultAccountPubkey,
			},
			signers: [],
		})
		const result = await cyberWave.account.regionResultInfo.fetch(centralRegionResultAccountPubkey)
		console.log(result)
	})

})
