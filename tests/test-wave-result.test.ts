import * as anchor from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { cyberPublicKey } from './config/config'

jest.setTimeout(30000000)
describe('wave-result', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	anchor.setProvider(provider)
	// DAO 프로그램, register 프로그램 가져오기
	const cyberWave = anchor.workspace.CyberWave

	// 로컬 월렛 키페어 가져오기
	const serverMainKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])

	// 클라이언트 월렛 어카운트
	const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)
	
	console.log(serverWalletAccount.publicKey.toBase58())

	it('test calculate result', async () => {
		const ts = await cyberWave.account.programAccountInfo.all()
		const accounts = ts
			.filter((elem: {publicKey: any, account: any}) => (elem.account.accountPubkey === '61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv'))
			.map((elem: {publicKey: any, account: any}) => ({ pubKey: elem.publicKey, region: elem.account.region, power: elem.account.powerMagnified * elem.account.levelPower / 10000 }))
		console.log(accounts)
		const centralRegionResultAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			serverWalletAccount.publicKey,
			"CENTRAL_REGION_RESULT",
			cyberWave.programId
		)
		const result = await cyberWave.account.regionResultInfo.fetch(centralRegionResultAccountPubkey)
		await accounts.forEach(async (account: any) => {
			const mintPubkey = new anchor.web3.PublicKey(cyberPublicKey)
			const mint = new Token(
				provider.connection,
				mintPubkey,
				TOKEN_PROGRAM_ID,
				serverWalletAccount
			)
			const associatedReceiverTokenAddr = await Token.getAssociatedTokenAddress(
				mint.associatedProgramId,
				mint.programId,
				mint.publicKey,
				serverWalletAccount.publicKey
			)
	        const senderTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
				serverWalletAccount.publicKey
			)
			let transferTokenAmount: number
			if (account.region === "REGION_01") {
				transferTokenAmount = result.region_1_zombie_power * account.power / result.region_1_characters_power
			}
			else if (account.region === "REGION_02") {
				transferTokenAmount = result.region_2_zombie_power * account.power / result.region_2_characters_power
			}
			else if (account.region === "REGION_03") {
				transferTokenAmount = result.region_3_zombie_power * account.power / result.region_3_characters_power
			}
			else if (account.region === "REGION_04") {
				transferTokenAmount = result.region_4_zombie_power * account.power / result.region_4_characters_power
			} else {
				transferTokenAmount = 0
			}
			const instructions: anchor.web3.TransactionInstruction[] = [
				Token.createTransferInstruction(
					TOKEN_PROGRAM_ID,
					senderTokenAccount.address,
					associatedReceiverTokenAddr,
					serverWalletAccount.publicKey,
					[serverWalletAccount],
					transferTokenAmount
				)
			]
			const tx = await cyberWave.rpc.calculateResultFromAccount({
				accounts: {
					updateAccount: account.pubKey,
					regionResultAccount: centralRegionResultAccountPubkey
				},
				instructions: instructions,
				signers: [serverWalletAccount],
			})
		})
	})

})
