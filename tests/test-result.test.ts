import * as anchor from '@project-serum/anchor'
import * as borsh from 'borsh'
import { RegionResultInfo, RegionResultInfoSchema } from './borsh.classes'
import { serverMainKey } from './config/config'
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

	// 클라이언트 월렛 어카운트
	const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)
	
	console.log(serverWalletAccount.publicKey.toBase58())

	it('test rns', async () => {
		const ts = await cyberWave.account.programAccountInfo.all()
		const accounts = ts.map((elem: {publicKey: any, account: Object}) => (elem.account))
			.filter((account: any) => (account.lastCalculatedAt != 0))
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

		const currTime = Math.floor(Date.now() / 1000)
		// e.g. REGION_RESULT_11_28
		const regionResultSeed = Utils.getRegionResultSeed(currTime)

		centralRegionResultAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			serverWalletAccount.publicKey,
			regionResultSeed,
			cyberWave.programId
		)
		const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
		let prevLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
		console.log(prevLamports / 1000000000)
		const centralRegionResultAccount = await cyberWave.provider.connection.getAccountInfo(centralRegionResultAccountPubkey)
		// 트랜잭션
		if (!centralRegionResultAccount){
			const serverTx = await cyberWave.rpc.initializeRegionResultData(
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
							seed: regionResultSeed,
							newAccountPubkey: centralRegionResultAccountPubkey,
							lamports,
							space: SIZE,
							programId: cyberWave.programId,
						}),
					],
				})
		}
		await cyberWave.rpc.regionResultCalculate(
			new anchor.BN(res.region_1),
			new anchor.BN(res.region_2),
			new anchor.BN(res.region_3),
			new anchor.BN(res.region_4),
			{
			accounts: {
				centralRegionAccount: centralRegionAccountPubkey,
				centralRegionResultAccount: centralRegionResultAccountPubkey,
				solPriceAccount: new anchor.web3.PublicKey("J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix"),
				recentBlockhashes: new anchor.web3.PublicKey("SysvarRecentB1ockHashes11111111111111111111")
			},
			signers: [serverWalletAccount],
		})
		const result = await cyberWave.account.regionResultInfo.fetch(centralRegionResultAccountPubkey)
		console.log(result)
	})

})
