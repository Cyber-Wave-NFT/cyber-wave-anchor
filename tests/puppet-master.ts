import * as anchor from '@project-serum/anchor';
const { SystemProgram } = anchor.web3;
import * as assert from "assert";
describe('puppet-master', () => {

  const provider = anchor.Provider.local();

  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  it('Is initialized!', async () => {
    // Add your test here.
    const program = anchor.workspace.PuppetMaster;
    const tx = await program.rpc.initialize();
    console.log("Your transaction signature", tx);
  });
  const puppetAccount = anchor.web3.Keypair.generate();

  it("is initialized" , async () => {
    try{
      const puppetAccount = anchor.web3.Keypair.generate();


      const puppet = anchor.workspace.Puppet;
  
      await puppet.rpc.initialize({
        accounts: {
          puppetAccount: puppetAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        //instructions:[await puppet.account.puppetAccount.createInstruction(puppetAccount)],
        signers: [puppetAccount]
      
      });
    }
    catch(err){
      console.log(err);
    }
    
  });


  it("Performs CPI from puppet master to puppet", async () => {
    try{
       // Initialize a new puppet account.
    const newPuppetAccount = anchor.web3.Keypair.generate();
      const puppetMaster = anchor.workspace.PuppetMaster;
      const pupMasterAccount = anchor.web3.Keypair.generate();
      const puppet = anchor.workspace.Puppet;
      const [programSigner, bump] = await anchor.web3.PublicKey.findProgramAddress([newPuppetAccount.publicKey.toBuffer()], puppet.programId);
     // console.log(programSigner.toString());
      //puppet.account.puppetAccount.createProgramAddress({from})
   

      console.log(puppetMaster.programId.toString());
      console.log(puppet.programId.toString());

    const tx = await puppet.rpc.initialize({
      accounts: {
        puppetAccount: newPuppetAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      },
      //instructions:[await puppet.account.puppetAccount.createInstruction(newPuppetAccount)],
      signers: [newPuppetAccount],
    });

    // Invoke the puppet master to perform a CPI to the puppet.
    await puppetMaster.rpc.pullStrings(new anchor.BN(111), bump, {
       accounts: {
          puppet: newPuppetAccount.publicKey,
          puppetProgram: puppet.programId,
          authority : provider.wallet.publicKey
       },
       //signers:[programSigner]
    });

    // Check the state updated.
    const result = await puppet.account.puppetAccount.fetch(newPuppetAccount.publicKey);
    console.log(result["data"]);
    assert.ok(result["data"].eq(new anchor.BN(111)));
    }
    catch(err){
      console.log(err);
    }
    
  });

  

});
