import * as anchor from '@project-serum/anchor'
import * as borsh from 'borsh'
import { ProgramAccountInfo, ProgramAccountInfoSchema } from './borsh.classes'

jest.setTimeout(30000000)
describe('cpi', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.Provider.local("https://api.devnet.solana.com")
	console.log(provider.wallet.publicKey.toBase58())
	anchor.setProvider(provider)

	// DAO 프로그램, register 프로그램 가져오기
	const register = anchor.workspace.Register
	const waveSizeCalculation = anchor.workspace.WaveSizeCalculation

	// 로컬 월렛 키페어 가져오기
	const clientWalletKey = Buffer.from([27,81,124,213,249,242,152,45,212,167,200,161,9,96,58,203,232,4,201,30,99,191,222,174,66,178,120,40,80,181,162,2,123,181,112,155,206,105,144,205,15,98,43,19,29,175,201,37,106,60,94,158,35,195,120,224,95,239,53,54,67,86,118,185])
	const b_key = Buffer.from([182,218,165,125,105,218,250,172,86,209,102,1,218,251,206,177,250,78,56,113,20,4,22,171,78,111,161,40,244,247,244,144,57,245,94,190,210,65,28,230,82,227,71,169,143,213,13,89,123,225,138,180,163,29,68,0,88,235,40,114,106,104,234,184])

	// 클라이언트 월렛 어카운트
	const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(clientWalletKey)
	const b_clientWalletAccount = anchor.web3.Keypair.fromSecretKey(b_key)
	
	console.log(clientWalletAccount.publicKey.toBase58())
	console.log(b_clientWalletAccount.publicKey.toBase58())

	it('test amu', async () => {

		const conn = new anchor.web3.Connection("https://api.devnet.solana.com/")
		const k = await conn.getProgramAccounts(register.programId)
		const kk = k.filter((elem) => (elem.account.data.length === 56)).map((elem) => {
			console.log(elem.account.data.length)
			const slicedData = elem.account.data.slice(8, elem.account.data.length)
			console.log(slicedData.length)
			const pp = borsh.deserialize(
				ProgramAccountInfoSchema,
				ProgramAccountInfo,
				slicedData
			)
			console.log(pp)
			return pp
		})
	})

})
