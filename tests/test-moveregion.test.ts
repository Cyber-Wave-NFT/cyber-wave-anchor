import * as anchor from '@project-serum/anchor'
import { clusterApiUrl, Connection, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import { Token, TOKEN_PROGRAM_ID, MintLayout, AccountLayout, AccountInfo } from "@solana/spl-token";
import * as borsh from 'borsh'
import { ProgramAccountInfoSchema, ProgramAccountInfo } from './borsh.classes';
import { clientKey, serverMainKey, SEED, mintPublicKey } from './config/config'
import config from '../jest.config';

jest.setTimeout(30000000)
describe('cpi', () => {
    // Configure the client to use the local cluster.
    const provider = anchor.Provider.local("https://api.devnet.solana.com")
    console.log(provider.wallet.publicKey.toBase58())
    anchor.setProvider(provider)

    // DAO 프로그램, register 프로그램 가져오기
    const cyberWave = anchor.workspace.CyberWave

    // 클라이언트 월렛 어카운트
    const clientWalletAccount = anchor.web3.Keypair.fromSecretKey(clientKey)
    const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)

    console.log(clientWalletAccount.publicKey.toBase58())
    console.log(serverWalletAccount.publicKey.toBase58())

    let newDataAccountPubkey: anchor.web3.PublicKey
    // let newDataAccount: AccountInfo

    it('Check data account', async () => {
        newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
            serverWalletAccount.publicKey,
            SEED,
            cyberWave.programId
        )
        const newDataAccount = await cyberWave.provider.connection.getAccountInfo(newDataAccountPubkey)

        // initialize, Check and create Dao Data Account
        if (newDataAccount !== null) {
            try{
                await cyberWave.rpc.moveRegion("REGION_01", {
                	accounts: {
                		myAccount: newDataAccountPubkey,
                		user: clientWalletAccount.publicKey,
                	},
                	signers: [clientWalletAccount, serverWalletAccount],
                })
                const result = await cyberWave.account.programAccountInfo.fetch(newDataAccountPubkey)
                console.log(result)
                // expect(result['level']).toBe(1)
            } catch (err) {
                console.log(err)
                fail(err)
            }
        }
    })
})
