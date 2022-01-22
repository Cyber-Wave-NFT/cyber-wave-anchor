import * as anchor from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { cyberPublicKey } from './config/config'
import { serverMainKey, DEVNET_SOLPRICE } from './config/config'
import { Utils } from './utils/utils'
import { SYSVAR_RECENT_BLOCKHASHES_PUBKEY } from "@solana/web3.js"
import { checkStunEnd } from './module/module'

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
			.filter((elem: {publicKey: any, account: any}) => (elem.account.accountPubkey === '61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv' && 
																elem.account.lastCalculatedAt != 0))
			.map((elem: {publicKey: any, account: any}) => ({ pubKey: elem.publicKey, 
															region: elem.account.region, 
															power: elem.account.powerMagnified * elem.account.levelPower / 10000,
															lastCalculatedAt: elem.account.lastCalculatedAt }))
		console.log(accounts)

		const numAttack = accounts.reduce((acc: any, elem: { pubKey: any, region: any, power: number, lastCalculatedAt: number }) =>
			acc + (elem.region !== "CYBERWAVE" ? 1 : 0)
			, 0)
		if (numAttack > 0) {
			const attackSurvivors = accounts.filter((account: any) => account.region !== "CYBERWAVE")
			const basementTime = attackSurvivors[0].lastCalculatedAt + 86400 - (attackSurvivors[0].lastCalculatedAt - 3600) % 86400;
			const regionResultSeed = Utils.getRegionResultSeed(basementTime)

			const centralRegionResultAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
				serverWalletAccount.publicKey,
				regionResultSeed,
				cyberWave.programId
			)
			const result = await cyberWave.account.regionResultInfo.fetch(centralRegionResultAccountPubkey)

			await Promise.all(accounts.map(async (account: any) => {
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
					transferTokenAmount = result.region1ZombiePower * account.power / result.region1CharactersPower
				}
				else if (account.region === "REGION_02") {
					transferTokenAmount = result.region2ZombiePower * account.power / result.region2CharactersPower
				}
				else if (account.region === "REGION_03") {
					transferTokenAmount = result.region3ZombiePower * account.power / result.region3CharactersPower
				}
				else if (account.region === "REGION_04") {
					transferTokenAmount = result.region4ZombiePower * account.power / result.region4CharactersPower
				} else {
					transferTokenAmount = 0
				}

				if (account.region !== "CYBERWAVE") {
					// const instructions: anchor.web3.TransactionInstruction[] = [
					// 	Token.createTransferInstruction(
					// 		TOKEN_PROGRAM_ID,
					// 		senderTokenAccount.address,
					// 		associatedReceiverTokenAddr,
					// 		serverWalletAccount.publicKey,
					// 		[serverWalletAccount],
					// 		transferTokenAmount
					// 	)
					// ]
					const serverTx = await cyberWave.rpc.calculateResultFromAccount(
						new anchor.BN(transferTokenAmount),
						{
							accounts: {
								updateAccount: account.pubKey,
								regionResultAccount: centralRegionResultAccountPubkey,
								solPriceAccount: new anchor.web3.PublicKey(DEVNET_SOLPRICE),
								recentBlockhashes: SYSVAR_RECENT_BLOCKHASHES_PUBKEY
							},
							// instructions: instructions,
							signers: [serverWalletAccount],
						})
				}
			}))

			const currentTime = Math.floor(Date.now() / 1000)
			const ts = await cyberWave.account.programAccountInfo.all()
			const afterAccounts = ts
				.filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === '61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv' &&
					elem.account.lastCalculatedAt != 0)) 
			const survivedAries = afterAccounts
				.reduce((acc: any, elem: { publicKey: any, account: any }) =>
					acc + ((elem.account.characterType === "ARIES0" && elem.account.stunEndAt < currentTime) ? 1 : 0), 0)
			const totalAries = afterAccounts
				.reduce((acc: any, elem: { publicKey: any, account: any }) =>
					acc + ((elem.account.characterType === "ARIES0") ? 1 : 0), 0)
			const prevTs = await cyberWave.account.programAccountInfo.all()
			const resss = prevTs
				.filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === '61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv' &&
					elem.account.lastCalculatedAt != 0))
			console.log(resss)
			await Promise.all(afterAccounts.map(async (account: any) => {
				const serverTx = await cyberWave.rpc.calculateExpLevel(
					new anchor.BN(basementTime),
					new anchor.BN(survivedAries),
					new anchor.BN(totalAries),
					{
						accounts: {
							updateAccount: account.pubKey,
							regionResultAccount: centralRegionResultAccountPubkey
						},
						signers: [serverWalletAccount],
					})
			}))
			const afterTs = await cyberWave.account.programAccountInfo.all()
			const ress = afterTs
				.filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === '61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv' &&
					elem.account.lastCalculatedAt != 0))
			console.log(ress)
		}
		
	})

})
