import * as anchor from '@project-serum/anchor'

const { SystemProgram } = anchor.web3
describe('puppet-master', () => {

	const provider = anchor.Provider.local('https://api.devnet.solana.com')

	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.Provider.env())

	it("Performs CPI from register to dao", async () => {
		try{
			// Initialize a new puppet account.
			const newDaoAccount = anchor.web3.Keypair.generate()
			const register = anchor.workspace.Register
			const registerAccount = anchor.web3.Keypair.generate()
			const dao = anchor.workspace.Dao
			const [programSigner, bump] = await anchor.web3.PublicKey.findProgramAddress([newDaoAccount.publicKey.toBuffer()], dao.programId)
			console.log(programSigner.toString())
			//puppet.account.puppetAccount.createProgramAddress({from})
      		console.log(newDaoAccount.publicKey.toString())

			console.log(dao.programId.toString())
			console.log(register.programId.toString())

			// Invoke the puppet master to perform a CPI to the puppet.
			await register.rpc.register(new anchor.BN(0), {
				accounts: {
					myAccount: newDaoAccount.publicKey,
					daoProgram: dao.programId,
					authority : provider.wallet.publicKey
				},
				signers:[programSigner]
			})

			// Check the state updated.
			const result = await dao.account.account.fetch(newDaoAccount.publicKey)
			console.log(result["data"])
			expect(result["data"]).toBe(new anchor.BN(0))
			}
			catch(err){
				console.log(err)
			}
		
	})
})
