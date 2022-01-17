import * as anchor from '@project-serum/anchor'
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { TIMEOUT, clientKey, serverMainKey, SEED, mintPublicKey } from './config/config'

jest.setTimeout(TIMEOUT)
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

    const mintPubkey = new anchor.web3.PublicKey(mintPublicKey)
    let mint = new Token(
        provider.connection,
        mintPubkey,
        TOKEN_PROGRAM_ID,
        clientWalletAccount
    )

    it('Check data account', async () => {
        //check data account, before (initialize, register)
        const senderTokenAccount = await mint.getOrCreateAssociatedAccountInfo(
            serverWalletAccount.publicKey
        )
        const associatedReceiverTokenAddr = await Token.getAssociatedTokenAddress(
            mint.associatedProgramId,
            mint.programId,
            mint.publicKey,
            clientWalletAccount.publicKey
        )

        newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
            serverWalletAccount.publicKey,
            SEED,
            cyberWave.programId
        )
        
        try {
            console.log("is it deposit?")
            console.log(newDataAccountPubkey.toBase58())

            // nft owner 확인
            const res = await provider.connection.getTokenLargestAccounts(mintPubkey)
            const ownerTokenAccount = res.value.find((x) => x.amount === "1") ?? ""
            if (ownerTokenAccount) {
                const info = await mint.getAccountInfo(ownerTokenAccount.address)
                const ownerWalletAccount = info.owner.toBase58()
            }
            // TODO else 일때는..?
            const isDeposit = (ownerTokenAccount === serverWalletAccount.publicKey.toBase58()) ? false : true

            // NFT owner를 바꾸는 식으로 구현한 다음
            // NFT의 onwer를 확인하여 등록여부를 확인하는거로 바뀌어야함
            // if (isDeposit && dataAccount['registeredAt'] !== 0) {
            //  console.log("You are trying to register but Already registered")
            //  return
            // } else if (!isDeposit && dataAccount['registeredAt'] === 0) {
            //  console.log("You are trying to unregister but isn't Registered.")
            //  return
            // }

            if (!isDeposit) {
                // register
            }
            else {
                const receiver = clientWalletAccount
                const sender = serverWalletAccount

                // 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
                let prevLamports = await provider.connection.getBalance(clientWalletAccount.publicKey)
                console.log(prevLamports / 1000000000)
                const prevResult = await cyberWave.account.programAccountInfo.fetch(newDataAccountPubkey)
                console.log(prevResult)

                const serverInstructions: anchor.web3.TransactionInstruction[] = [
                    Token.createTransferInstruction(
                        TOKEN_PROGRAM_ID,
                        senderTokenAccount.address,
                        associatedReceiverTokenAddr,
                        sender.publicKey,
                        [sender],
                        1
                    )
                ]

                // 트랜잭션 실제 발생
                const serverTx = await cyberWave.rpc.unregister({
                    accounts: {
                        myAccount: newDataAccountPubkey,
                    },
                    instructions: serverInstructions,
                    signers: [serverWalletAccount],
                })

                console.log('Your transaction signature', serverTx)
                let postLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
                console.log(postLamports / 1000000000)
                const postResult = await cyberWave.account.programAccountInfo.fetch(newDataAccountPubkey)
                console.log(postResult)
            }
            const result = await cyberWave.account.programAccountInfo.fetch(newDataAccountPubkey)
            console.log(result)
            // expect(result['level']).toBe(1)

            // update power when aries unregister
            if (result.characterType === "ARIES0") {
                const ts = await cyberWave.account.programAccountInfo.all()
                const accounts = ts
                    .filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === clientWalletAccount.publicKey.toBase58() &&
                        elem.account.lastCalculatedAt != 0))
                let totalAries = accounts.reduce((acc: any, account: any) =>
                    acc + (account.account.characterType === "ARIES0" ? 1 : 0)
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

        } catch (err) {
            console.log(err)
            fail(err)
        }
    })
})
