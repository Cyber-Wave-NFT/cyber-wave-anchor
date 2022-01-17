import * as anchor from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { cyberPublicKey } from './config/config'
import { serverMainKey } from './config/config'
import { Utils } from './utils/utils'

jest.setTimeout(30000000)
describe('wave-result', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	anchor.setProvider(provider)
	// DAO 프로그램, register 프로그램 가져오기
	const cyberWave = anchor.workspace.CyberWave

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
			const serverTx = await cyberWave.rpc.calculateResultFromAccount(
				new anchor.BN(transferTokenAmount),
				Utils.makeId(8),
				{
				accounts: {
					updateAccount: account.pubKey,
					regionResultAccount: centralRegionResultAccountPubkey
				},
				instructions: instructions,
				signers: [serverWalletAccount],
			})
		})
		const currentTime = Date.now() / 1000;
		const totalAries = ts.reduce((acc: any, elem: { publicKey: any, account: any }) =>
			acc + ((elem.account.characterType === "ARIES0" && elem.account.stunEndAt < currentTime) ? 1 : 0)
			, 0)
		await accounts.forEach(async (account: any) => {
			const serverTx = await cyberWave.rpc.calculateExpLevel(
				new anchor.BN(totalAries),
				{
					accounts: {
						updateAccount: account.pubKey,
						regionResultAccount: centralRegionResultAccountPubkey
					},
					signers: [serverWalletAccount],
				})
		})
	})

})
