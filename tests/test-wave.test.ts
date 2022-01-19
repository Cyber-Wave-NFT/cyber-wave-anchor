import * as anchor from '@project-serum/anchor'
import * as borsh from 'borsh'
import { RegionInfo, RegionInfoSchema } from './borsh.classes'
import { serverMainKey, DEVNET_SOLPRICE } from './config/config'
import { Utils } from './utils/utils'
import { SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from "@solana/web3.js"

jest.setTimeout(30000000)
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)
	let centralRegionAccountPubkey: anchor.web3.PublicKey
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
			acc += cur.levelPower * cur.powerMagnified / 10000
			return acc
		}, 0)
		const SIZE = borsh.serialize(
			RegionInfoSchema,
			new RegionInfo(),
		  ).length + 8
		centralRegionAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			serverWalletAccount.publicKey,
			"CENTRAL_REGION1",
			cyberWave.programId
		)
		const centralRegionAccount = await cyberWave.provider.connection.getAccountInfo(centralRegionAccountPubkey)
		if (!centralRegionAccount) {
			const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
			let prevLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
			console.log(prevLamports / 1000000000)

			// 트랜잭션
			const serverTx = await cyberWave.rpc.initializeRegionData(
				{
				accounts: {
					myAccount: centralRegionAccountPubkey,
					user: serverWalletAccount.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				instructions: [
					anchor.web3.SystemProgram.createAccountWithSeed({
						fromPubkey: serverWalletAccount.publicKey,
						basePubkey: serverWalletAccount.publicKey,
						seed: "CENTRAL_REGION1",
						newAccountPubkey: centralRegionAccountPubkey,
						lamports,
						space: SIZE,
						programId: cyberWave.programId,
					}),
				],
			})
		}
		await cyberWave.rpc.sizeCalculate(
			new anchor.BN(res),
			{
			accounts: {
				centralRegionAccount: centralRegionAccountPubkey,
				solPriceAccount: new anchor.web3.PublicKey(DEVNET_SOLPRICE),
				recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
			},
			signers: [serverWalletAccount],
		})
		const result = await cyberWave.account.regionInfo.fetch(centralRegionAccountPubkey)
		console.log(result)
	})

})
