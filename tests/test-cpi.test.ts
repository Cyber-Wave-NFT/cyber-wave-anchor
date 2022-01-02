import * as anchor from '@project-serum/anchor'
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
]);
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)

	// DAO 프로그램, register 프로그램 가져오기
	const dao = anchor.workspace.Dao
	const register = anchor.workspace.Register

	// 로컬 월렛 키페어 가져오기
	const a_key = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])
	const b_key = Buffer.from([182,218,165,125,105,218,250,172,86,209,102,1,218,251,206,177,250,78,56,113,20,4,22,171,78,111,161,40,244,247,244,144,57,245,94,190,210,65,28,230,82,227,71,169,143,213,13,89,123,225,138,180,163,29,68,0,88,235,40,114,106,104,234,184])

	// 클라이언트 월렛 어카운트
	const a_clientWalletAccount = anchor.web3.Keypair.fromSecretKey(a_key)
	const b_clientWalletAccount = anchor.web3.Keypair.fromSecretKey(b_key)

	console.log(a_clientWalletAccount.publicKey.toBase58())
	console.log(b_clientWalletAccount.publicKey.toBase58())

	let newDataAccount: anchor.web3.PublicKey

	const SIZE = borsh.serialize(
		ProgramAccountInfoSchema,
		new ProgramAccountInfo(),
	  ).length + 8
	it('test amu', async () => {
		const SEED = '11111111112222222222333333333320' // spl token
		// 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
		newDataAccount = await anchor.web3.PublicKey.createWithSeed(
			b_clientWalletAccount.publicKey,
			SEED,
			dao.programId
		)
		// newDataAccount가 가지고있는 DAO 소속 data account
		const dataAccount = await dao.provider.connection.getAccountInfo(newDataAccount)
		// data account가 null이면 DAO가 홀딩하는 data account를 만들어준다.
		// null이 아니면 그냥 해당 데이터 어카운트를 사용한다.
		if (dataAccount === null) {
			console.log('Creating account', newDataAccount.toBase58(), 'to say hello to')

			// 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
			const lamports = await dao.provider.connection.getMinimumBalanceForRentExemption(SIZE)

			// 트랜잭션
			let createNewAccDao = new anchor.web3.Transaction().add(
				// create account
				anchor.web3.SystemProgram.createAccountWithSeed({
					fromPubkey: a_clientWalletAccount.publicKey,
					basePubkey: b_clientWalletAccount.publicKey,
					seed: SEED,
					newAccountPubkey: newDataAccount,
					lamports,
					space: SIZE,
					programId: dao.programId,
				}),
			)

			// 트랜잭션 실제 발생
			await dao.provider.send(createNewAccDao, [a_clientWalletAccount])
			const tx = await dao.rpc.initialize({
				accounts: {
					myAccount: newDataAccount,
					user: provider.wallet.publicKey,
					systemProgram: anchor.web3.SystemProgram.programId,
				},
				signers: [],
			})
			console.log('Your transaction signature', tx)
			console.log(`newDataAccount:${newDataAccount}`)
		} else {
			console.log('success')
			console.log(newDataAccount.toBase58())
		}
	})

	it('Send transaction to register program', async () => {
		try {
			await register.rpc.register(new anchor.BN(1), {
				accounts: {
					myAccount: newDataAccount,
					daoProgram: dao.programId,
				},
			})

			const result = await dao.account.programAccountInfo.fetch(newDataAccount)
			console.log(result['level'])
			expect(result['level']).toBe(1)
		} catch (err) {
			throw new Error()
		}
	})
})
