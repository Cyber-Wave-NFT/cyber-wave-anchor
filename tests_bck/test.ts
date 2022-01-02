import * as anchor from '@project-serum/anchor';
const { SystemProgram } = anchor.web3;
import * as assert from "assert";
describe('dao', () => {

	const provider = anchor.Provider.local();

	// Configure the client to use the local cluster.
	anchor.setProvider(anchor.Provider.env());

	// it('Is initialized!', async () => {
	//   // Add your test here.
	//   const program = anchor.workspace.Dao;
	//   const tx = await program.rpc.initialize();
	//   console.log("Your transaction signature", tx);
	// });

	it("is initialized" , async () => {
		try{
			const dataAccount = anchor.web3.Keypair.generate();
			const dao = anchor.workspace.Dao;
			await dao.rpc.initialize({
				accounts: {
					account: dataAccount.publicKey,
					user: provider.wallet.publicKey,
					systemProgram: SystemProgram.programId,
				},
				//instructions:[await puppet.account.puppetAccount.createInstruction(puppetAccount)],
				signers: [dataAccount]
			});
		}
		catch(err){
			console.log(err);
		}
		
	});


	it("Performs CPI from puppet master to puppet", async () => {
		try{
			// Initialize a new puppet account.
			const newDataAccount = anchor.web3.Keypair.generate();
			const dao = anchor.workspace.Dao;
			const register = anchor.workspace.Register;
			const [programSigner, bump] = await anchor.web3.PublicKey.findProgramAddress([newDataAccount.publicKey.toBuffer()], dao.programId);
			console.log(programSigner.toString());
			//puppet.account.puppetAccount.createProgramAddress({from})
	 
			console.log(dao.programId.toString());
			console.log(register.programId.toString());

			// const tx = await register.rpc.initialize({
			// 	accounts: {
			// 		account: newDataAccount.publicKey,
			// 		user: provider.wallet.publicKey,
			// 		systemProgram: SystemProgram.programId,
			// 	},
			// 	//instructions:[await puppet.account.puppetAccount.createInstruction(newPuppetAccount)],
			// 	signers: [newDataAccount],
			// });

			// Invoke the puppet master to perform a CPI to the puppet.
			await register.rpc.pullStrings(new anchor.BN(111), bump, {
				accounts: {
					let account_data = &mut ctx.accounts.account;
					level: 1;
					exp: 0;
					account_data.power = data.power;
					account_data.registered_at = data.registered_at;
					account_data.exp_per_minute = data.exp_per_minute;
					account_data.character_pubkey = data.character_pubkey;
					account_data.weapon_pubkey = data.weapon_pubkey;
					account_data.boost = data.boost;
					account_data.stunned_at = data.stunned_at;
					account_data.ability_used_at = data.ability_used_at;
					account_data.region = data.region;
				},
				//signers:[programSigner]
			});

		// Check the state updated.
		const result = await register.account.puppetAccount.fetch(newPuppetAccount.publicKey);
		console.log(result["data"]);
		assert.ok(result["data"].eq(new anchor.BN(111)));
		}
		catch(err){
			console.log(err);
		}
		
	});

	

});
