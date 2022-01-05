import * as anchor from '@project-serum/anchor'
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout } from "@solana/spl-token";
import * as borsh from 'borsh'
class ProgramAccountInfo {
	level = 1
	exp = 0
	power = 0
	last_calculated_at = 0
	account_pubkey = "00000000000000000000000000000000"
	character_pubkey = "00000000000000000000000000000000"
	weapon_pubkey = "00000000000000000000000000000000"
	boost = 0
	stunned_at = 0
	ability_used_at = 0
	region = "00000000"
	constructor(fields: {
		level: number, 
		exp: number,
		power: number,
		last_calculated_at: number,
		account_pubkey: string,
		character_pubkey: string,
		weapon_pubkey: string,
		boost: number,
		stunned_at: number,
		ability_used_at: number,
		region: string
	} | undefined = undefined) {
		if (fields) {
			this.level = fields.level;
			this.exp = fields.exp;
			this.power = fields.power;
			this.last_calculated_at = fields.last_calculated_at;
			this.account_pubkey = fields.account_pubkey;
			this.character_pubkey = fields.character_pubkey;
			this.weapon_pubkey = fields.weapon_pubkey;
			this.boost = fields.boost;
			this.stunned_at = fields.stunned_at;
			this.ability_used_at = fields.ability_used_at;
			this.region = fields.region;
		}
	}
}
  
/**
 * Borsh schema definition for greeting accounts
 */
const ProgramAccountInfoSchema = new Map([
	[ProgramAccountInfo, {kind: 'struct', fields: [
		['level', 'u32'],
		['exp', 'u32'],
		['power', 'u32'],
		['last_calculated_at', 'u64'],
		['account_pubkey', 'String'],
		['character_pubkey', 'String'],
		['weapon_pubkey', 'String'],
		['boost', 'u32'],
		['stunned_at', 'u32'],
		['ability_used_at', 'u32'],
		['region', 'String']
	]}],
])
jest.setTimeout(30000000)
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)
	
	// DAO 프로그램, register 프로그램 가져오기
	const register = anchor.workspace.Register

	// 로컬 월렛 키페어 가져오기
	const aKey = Buffer.from([146,219,107,202,40,70,152,107,243,15,197,169,181,103,176,60,200,8,217,218,80,70,10,16,160,239,211,23,32,22,123,209,114,199,53,40,48,182,79,148,11,105,50,209,175,133,180,244,57,166,121,73,128,147,52,18,178,198,209,38,157,114,25,64])
	const bKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])

	// 클라이언트 월렛 어카운트
	const aClientWalletAccount = anchor.web3.Keypair.fromSecretKey(aKey)
	const bClientWalletAccount = anchor.web3.Keypair.fromSecretKey(bKey)

	console.log(aClientWalletAccount.publicKey.toBase58())
	console.log(bClientWalletAccount.publicKey.toBase58())

	let newDataAccountPubkey: anchor.web3.PublicKey
	// let newDataAccount: AccountInfo

	const SIZE = borsh.serialize(
		ProgramAccountInfoSchema,
		new ProgramAccountInfo(),
	  ).length + 8
	it('Check and create Dao Data Account', async () => {
		const SEED = 'nft_200012' // spl token
		// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
		newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			aClientWalletAccount.publicKey,
			SEED,
			register.programId
		)
		// newDataAccount가 가지고있는 DAO 소속 data account
		const newDataAccount = await register.provider.connection.getAccountInfo(newDataAccountPubkey)
		// data account가 null이면 DAO가 홀딩하는 data account를 만들어준다.
		// null이 아니면 그냥 해당 데이터 어카운트를 사용한다.
		if (newDataAccount === null) {
			console.log('Creating account', newDataAccountPubkey.toBase58(), 'to say hello to')

			// 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
			const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
			let prevLamports = await provider.connection.getBalance(aClientWalletAccount.publicKey)
			console.log(prevLamports / 1000000000)

			// 트랜잭션
			let createNewAccDao = new anchor.web3.Transaction().add(
				// create account
				anchor.web3.SystemProgram.createAccountWithSeed({
					fromPubkey: bClientWalletAccount.publicKey,
					basePubkey: aClientWalletAccount.publicKey,
					seed: SEED,
					newAccountPubkey: newDataAccountPubkey,
					lamports,
					space: SIZE,
					programId: register.programId,
				}),
			)

			// 트랜잭션 실제 발생
			await register.provider.send(createNewAccDao, [aClientWalletAccount, bClientWalletAccount])
			const tx = await register.rpc.initialize({
				accounts: {
					myAccount: newDataAccountPubkey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [],
			})
			await register.rpc.register({
				accounts: {
					myAccount: newDataAccountPubkey,

				},
			})
			const dataAccount = await register.account.programAccountInfo.fetch(newDataAccountPubkey)
			console.log('Your transaction signature', tx)
			console.log(`newDataAccount:${newDataAccountPubkey}`)

			let postLamports = await provider.connection.getBalance(bClientWalletAccount.publicKey)
			console.log(postLamports / 1000000000)
		} else {
			console.log('success')
			console.log(newDataAccountPubkey.toBase58())
		}
	})

	it('Send transaction to register program and send SPL_TOKEN', async () => {
		let mint;
		let sender_token;
		let receiver;
		let receiver_token;

		try {
			console.log("is it deposit?")
			console.log(newDataAccountPubkey.toBase58())

			const isDeposit = false
			const dataAccount = await register.account.programAccountInfo.fetch(newDataAccountPubkey)

			// NFT owner를 바꾸는 식으로 구현한 다음
			// NFT의 onwer를 확인하여 등록여부를 확인하는거로 바뀌어야함
			// if (isDeposit && dataAccount['registeredAt'] !== 0) {
			// 	console.log("You are trying to register but Already registered")
			// 	return
			// } else if (!isDeposit && dataAccount['registeredAt'] === 0) {
			// 	console.log("You are trying to unregister but isn't Registered.")
			// 	return
			// }

			if (isDeposit) {
				await register.rpc.register({
					accounts: {
						myAccount: newDataAccountPubkey
					},
				})
			} else {
				await register.rpc.unregister({
					accounts: {
						myAccount: newDataAccountPubkey
					},
				})
			}

			const result = await register.account.programAccountInfo.fetch(newDataAccountPubkey)
			console.log(result)
			// expect(result['level']).toBe(1)
		} catch (err) {
			console.log(err)
			fail(err)
		}
	})
})
