import * as anchor from '@project-serum/anchor';
const { SystemProgram } = anchor.web3;
import * as assert from "assert";
describe('puppet-master', () => {

	const provider = anchor.Provider.local('https://api.devnet.solana.com');

	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.Provider.env());

	// it('Is initialized!', async () => {
	// 	// Add your test here.
	// 	const program = anchor.workspace.Dao;
	// 	const tx = await program.rpc.initialize();
	// 	console.log("Your transaction signature", tx);
	// });
	// const registerAccount = anchor.web3.Keypair.generate();

	// it("is initialized" , async () => {
	// 	try{
	// 		const registerAccount = anchor.web3.Keypair.generate();
	// 		const register = anchor.workspace.Register;
	// 		await register.rpc.initialize({
	// 			accounts: {
	// 				puppetAccount: registerAccount.publicKey,
	// 				user: provider.wallet.publicKey,
	// 				systemProgram: SystemProgram.programId,
	// 			},
	// 			//instructions:[await puppet.account.puppetAccount.createInstruction(puppetAccount)],
	// 			signers: [registerAccount]
			
	// 		});
	// 	}
	// 	catch(err){
	// 		console.log(err);
	// 	}
		
	// });


	it("Performs CPI from register to dao", async () => {
		try{
			// Initialize a new puppet account.
			const newDaoAccount = anchor.web3.Keypair.generate();
			const register = anchor.workspace.Register;
			const registerAccount = anchor.web3.Keypair.generate();
			const dao = anchor.workspace.Dao;
			const [programSigner, bump] = await anchor.web3.PublicKey.findProgramAddress([newDaoAccount.publicKey.toBuffer()], dao.programId);
			console.log(programSigner.toString());
			//puppet.account.puppetAccount.createProgramAddress({from})
	

			console.log(dao.programId.toString());
			console.log(register.programId.toString());

			// const tx = await puppet.rpc.initialize({
			// 	accounts: {
			// 		puppetAccount: newPuppetAccount.publicKey,
			// 		user: provider.wallet.publicKey,
			// 		systemProgram: SystemProgram.programId,
			// 	},
			// 	//instructions:[await puppet.account.puppetAccount.createInstruction(newPuppetAccount)],
			// 	signers: [newPuppetAccount],
			// });

			// Invoke the puppet master to perform a CPI to the puppet.
			await register.rpc.register(new anchor.BN(0), {
				accounts: {
					my_account: newDaoAccount.publicKey,
					dao_program: dao.programId,
					authority : provider.wallet.publicKey
				},
				signers:[programSigner]
			});

		// Check the state updated.
		const result = await dao.account.account.fetch(newDaoAccount.publicKey);
		console.log(result["data"]);
		assert.ok(result["data"].eq(new anchor.BN(0)));
		}
		catch(err){
			console.log(err);
		}
		
	});

	

});
