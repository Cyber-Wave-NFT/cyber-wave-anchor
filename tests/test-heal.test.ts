import * as anchor from '@project-serum/anchor'
import * as borsh from 'borsh'
import { ProgramAccountInfoSchema, ProgramAccountInfo } from './borsh.classes'
import { clientKey, serverMainKey } from './config/config'

jest.setTimeout(30000000)
describe('heal', () => {
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

    // let newDataAccount: AccountInfo
    const HEAL_NFT = "abcd12344"
    const INJURED_NFT = "defg12344"

    const SIZE = borsh.serialize(
        ProgramAccountInfoSchema,
        new ProgramAccountInfo(),
    ).length + 8

    it('heal', async () => {
        // 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
        const healDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
            serverWalletAccount.publicKey,
            HEAL_NFT,
            cyberWave.programId
        )
        const injuredDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
            serverWalletAccount.publicKey,
            INJURED_NFT,
            cyberWave.programId
        )
        const healDataAccount = await cyberWave.provider.connection.getAccountInfo(healDataAccountPubkey)
        const injuredDataAccount = await cyberWave.provider.connection.getAccountInfo(injuredDataAccountPubkey)
        if (!healDataAccount){
            const lamports = await cyberWave.provider.connection.getMinimumBalanceForRentExemption(SIZE)
            const healInstructions: anchor.web3.TransactionInstruction[] = [
                // create account
                anchor.web3.SystemProgram.createAccountWithSeed({
                    fromPubkey: serverWalletAccount.publicKey,
                    basePubkey: serverWalletAccount.publicKey,
                    seed: HEAL_NFT,
                    newAccountPubkey: healDataAccountPubkey,
                    lamports,
                    space: SIZE,
                    programId: cyberWave.programId,
                }),
            ]
            // 트랜잭션 실제 발생
            const tx = await cyberWave.rpc.initialize(
                clientWalletAccount.publicKey.toString(),
                "",
                "",
                "",
                "",
                "",
                "",
                "ZINX00",
                {
                    accounts: {
                        myAccount: healDataAccountPubkey,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                    instructions: healInstructions,
                    signers: [serverWalletAccount],
                }
            )
        }
        if (!injuredDataAccount) {
            const lamports = await cyberWave.provider.connection.getMinimumBalanceForRentExemption(SIZE)
            const injuredInstructions: anchor.web3.TransactionInstruction[] = [
                // create account
                anchor.web3.SystemProgram.createAccountWithSeed({
                    fromPubkey: serverWalletAccount.publicKey,
                    basePubkey: serverWalletAccount.publicKey,
                    seed: INJURED_NFT,
                    newAccountPubkey: injuredDataAccountPubkey,
                    lamports,
                    space: SIZE,
                    programId: cyberWave.programId,
                }),
            ]
            console.log(injuredDataAccountPubkey.toBase58())
            console.log(clientWalletAccount.publicKey.toBase58())
            // 트랜잭션 실제 발생
            const tx = await cyberWave.rpc.initialize(
                clientWalletAccount.publicKey.toString(),
                "",
                "",
                "",
                "",
                "",
                "",
                "0",
                {
                    accounts: {
                        myAccount: injuredDataAccountPubkey,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                    instructions: injuredInstructions,
                    signers: [serverWalletAccount],
                }
            )
        }
        await cyberWave.rpc.tmpInjuredCharacter({
            accounts: {
                injuredCharacterAccount: injuredDataAccountPubkey
            },
            signers: [],
        })
        const healDataAccountBefore = await cyberWave.account.programAccountInfo.fetch(healDataAccountPubkey)
        const injuredDataAccountBefore = await cyberWave.account.programAccountInfo.fetch(injuredDataAccountPubkey)
        console.log("healDataAccount:", healDataAccountBefore)
        console.log("injuredDataAccount:", injuredDataAccountBefore)
        const serverTx = await cyberWave.rpc.healCharacter({
            accounts: {
                healCharacterAccount: healDataAccountPubkey,
                injuredCharacterAccount: injuredDataAccountPubkey,
            },
            signers: [serverWalletAccount],
        })

        if (healDataAccount.characterType === "ARIES0") {
            const currentTime = Math.floor(Date.now() / 1000)
            const ts = await cyberWave.account.programAccountInfo.all()
            const accounts = ts
                .filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === clientWalletAccount.publicKey.toBase58() &&
                    elem.account.lastCalculatedAt != 0))
            let totalAries = accounts.reduce((acc: any, account: any) =>
                acc + (account.account.characterType === "ARIES0" && account.account.stunEndAt <= currentTime ? 1 : 0)
                , 0)
            await Promise.all(accounts.map(async (elem: { publicKey: any, account: any }) => {
                const allyDataAccountPubkey = elem.publicKey
                await cyberWave.rpc.updatePower(
                    totalAries,
                    {
                        accounts: {
                            updateAccount: allyDataAccountPubkey,
                        },
                        signers: [serverWalletAccount],
                    }
                )
            }))
        }

        const healDataAccountAfter = await cyberWave.account.programAccountInfo.fetch(healDataAccountPubkey)
        const injuredDataAccountAfter = await cyberWave.account.programAccountInfo.fetch(injuredDataAccountPubkey)
        console.log("healDataAccount:", healDataAccountAfter)
        console.log("injuredDataAccount:", injuredDataAccountAfter)
    })
})
