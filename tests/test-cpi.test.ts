import * as anchor from '@project-serum/anchor'
import { AccountInfo } from '@solana/spl-token'
import * as borsh from 'borsh'
class ProgramAccountInfo {
	level = 0
	exp = 0
	power = 0
	registered_at = 0
	exp_per_minute = 0
	character_pubkey = ""
	weapon_pubkey = ""
	boost = 0
	stunned_at = 0
	ability_used_at = 0
	region = ""
	constructor(fields: {
		level: number, 
		exp: number,
		power: number,
		registered_at: number,
		exp_per_minute: number,
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
			this.registered_at = fields.registered_at;
			this.exp_per_minute = fields.exp_per_minute;
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
		['registered_at', 'u64'],
		['exp_per_minute', 'u32'],
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
	const dao = anchor.workspace.Dao
	const register = anchor.workspace.Register

	// 로컬 월렛 키페어 가져오기
	const aKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])
	const bKey = Buffer.from([182,218,165,125,105,218,250,172,86,209,102,1,218,251,206,177,250,78,56,113,20,4,22,171,78,111,161,40,244,247,244,144,57,245,94,190,210,65,28,230,82,227,71,169,143,213,13,89,123,225,138,180,163,29,68,0,88,235,40,114,106,104,234,184])

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
		const SEED = 'nft_3' // spl token
		// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
		newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
			bClientWalletAccount.publicKey,
			SEED,
			dao.programId
		)
		// newDataAccount가 가지고있는 DAO 소속 data account
		const newDataAccount = await dao.provider.connection.getAccountInfo(newDataAccountPubkey)
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
					fromPubkey: aClientWalletAccount.publicKey,
					basePubkey: bClientWalletAccount.publicKey,
					seed: SEED,
					newAccountPubkey: newDataAccountPubkey,
					lamports,
					space: SIZE,
					programId: dao.programId,
				}),
			)

			// 트랜잭션 실제 발생
			await dao.provider.send(createNewAccDao, [aClientWalletAccount])
			const tx = await dao.rpc.initialize({
				accounts: {
					myAccount: newDataAccountPubkey,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [],
			})
			// await register.rpc.register(false, {
			// 	accounts: {
			// 		myAccount: newDataAccountPubkey,
			// 		daoProgram: dao.programId,
			// 	},
			// })
			// const result = await dao.account.programAccountInfo.fetch(newDataAccountPubkey)
			// console.log(result['level'])

			console.log('Your transaction signature', tx)
			console.log(`newDataAccount:${newDataAccountPubkey}`)

			let postLamports = await provider.connection.getBalance(bClientWalletAccount.publicKey)
			console.log(postLamports / 1000000000)
		} else {
			console.log('success')
			console.log(newDataAccountPubkey.toBase58())
		}
	})

	it('Send transaction to register program', async () => {
		try {
			console.log("is it deposit?")
			console.log(newDataAccountPubkey.toBase58())

			const isDeposit = true
			const dataAccount = await dao.account.programAccountInfo.fetch(newDataAccountPubkey)
			if (isDeposit && dataAccount['registered_at'] !== 0) {
				console.log("You are trying to register but Already registered")
			} else if (!isDeposit && dataAccount['registered_at'] === 0) {
				console.log("You are trying to unregister but isn't Registered.")
			}

			await register.rpc.register(isDeposit, {
				accounts: {
					myAccount: newDataAccountPubkey,
					daoProgram: dao.programId,
				},
			})

			const result = await dao.account.programAccountInfo.fetch(newDataAccountPubkey)
			console.log(result['level'])
			// expect(result['level']).toBe(1)
		} catch (err) {
			console.log(err)
			fail(err)
		}
	})
})
