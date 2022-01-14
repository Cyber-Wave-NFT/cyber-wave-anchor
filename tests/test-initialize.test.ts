import * as anchor from '@project-serum/anchor'
import { clusterApiUrl, Connection } from "@solana/web3.js"
import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import * as metaplex from '@metaplex/js'
import * as borsh from 'borsh'
import { ProgramAccountInfoSchema, ProgramAccountInfo } from './borsh.classes'
import { clientKey, serverMainKey, SEED, mintPublicKey } from './config/config'
import fetch from 'node-fetch'

interface DetailedMetadata {
    attributes: { [key: string]: string }[]
    description: string
    external_url: string
    image: string
    name: string
    properties: string | {}[]
    seller_fee_basis_point: number
    symbol: string
    status: {}[]
}

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

    const SIZE = borsh.serialize(
        ProgramAccountInfoSchema,
        new ProgramAccountInfo(),
    ).length + 8

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
            clientWalletAccount.publicKey
        )
        const associatedReceiverTokenAddr = await Token.getAssociatedTokenAddress(
            mint.associatedProgramId,
            mint.programId,
            mint.publicKey,
            serverWalletAccount.publicKey
        )
        // 클라 퍼블릭키, SPL token ID, DAO 프로그램 ID로 새 데이터 어카운트 생성 (혹은 이미 있는 어카운트 가져오기)
        newDataAccountPubkey = await anchor.web3.PublicKey.createWithSeed(
            serverWalletAccount.publicKey,
            SEED,
            cyberWave.programId
        )

        const newDataAccount = await cyberWave.provider.connection.getAccountInfo(newDataAccountPubkey)

        // initialize, Check and create Dao Data Account
        if (newDataAccount === null) {
            // get arweave uri
            const metadataAccounts = await metaplex.programs.metadata.Metadata.getPDA(mint.publicKey)
            const metadata = await metaplex.programs.metadata.Metadata.load(
                provider.connection,
                metadataAccounts
            )

            // get metadata from arweave uri
            const res = await fetch(metadata.data.data.uri)
            // unwrap response as json
            const detailMetadata: DetailedMetadata = await res.json() as any

            //users.attributes[0-12]["trait_type"|"value"]
            const powerAtts = ["jacket", "head add-on", "facewear", "tattoo", "clothes", "neckwear", "skin type"]
            let attributes: { [key: string]: string } = {}
            for (var att of detailMetadata.attributes) {
                if (powerAtts.includes(Object.values(att)[0])) {
                    attributes[Object.values(att)[0]] = Object.values(att)[1]
                }
            }

            const sender = clientWalletAccount
            const receiver = serverWalletAccount

            const lamports = await provider.connection.getMinimumBalanceForRentExemption(SIZE)
            const instructions: anchor.web3.TransactionInstruction[] = [
                anchor.web3.SystemProgram.createAccountWithSeed({
                    fromPubkey: clientWalletAccount.publicKey,
                    basePubkey: serverWalletAccount.publicKey,
                    seed: SEED,
                    newAccountPubkey: newDataAccountPubkey,
                    lamports,
                    space: SIZE,
                    programId: cyberWave.programId,
                }),
            ]

            // data account가 null이면 DAO가 홀딩하는 data account를 만들어준다.
            // null이 아니면 그냥 해당 데이터 어카운트를 사용한다.
            console.log('Creating account', newDataAccountPubkey.toBase58(), 'to say hello to')

            // 데이터 사이즈에 맞는 최소 rent비 무시 적재량 계산
            let prevLamports = await provider.connection.getBalance(clientWalletAccount.publicKey)
            console.log(prevLamports / 1000000000)

            const receiverAccount = await provider.connection.getAccountInfo(associatedReceiverTokenAddr)

            if (receiverAccount === null) {
                instructions.push(
                    Token.createAssociatedTokenAccountInstruction(
                        mint.associatedProgramId,
                        mint.programId,
                        mint.publicKey,
                        associatedReceiverTokenAddr,
                        receiver.publicKey,
                        sender.publicKey
                    )
                )
            }
            instructions.push(
                Token.createTransferInstruction(
                    TOKEN_PROGRAM_ID,
                    senderTokenAccount.address,
                    associatedReceiverTokenAddr,
                    sender.publicKey,
                    [sender],
                    1
                )
            )

            // 트랜잭션 실제 발생
            const tx = await cyberWave.rpc.initialize(
                attributes["jacket"] ?? "",
                attributes["head add-on"] ?? "",
                attributes["facewear"] ?? "",
                attributes["tattoo"] ?? "",
                attributes["clothes"] ?? "",
                attributes["neckwear"] ?? "",
                (attributes["skin type"]?.split(" ").pop()?.toUpperCase() ?? "").padEnd(6, '0'),
                {   
                    accounts: {
                        myAccount: newDataAccountPubkey,
                        user: clientWalletAccount.publicKey,
                        systemProgram: anchor.web3.SystemProgram.programId,
                    },
                    instructions: instructions,
                    signers: [clientWalletAccount, serverWalletAccount],
                }
            )

            const result = await cyberWave.account.programAccountInfo.fetch(newDataAccountPubkey)
            console.log('Your transaction signature', tx)
            console.log(`newDataAccount:${newDataAccountPubkey}`)
            console.log(result)

            let postLamports = await provider.connection.getBalance(serverWalletAccount.publicKey)
            console.log(postLamports / 1000000000)

            // TODO: 모듈화 하기
            // after initialize update allies' power (Aries)
            const ts = await cyberWave.account.programAccountInfo.all()
            const accounts = ts
                .filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === clientWalletAccount.publicKey.toBase58()))
            let totalAries = accounts.reduce((acc: any, account: any) => 
                acc + (account.account.characterType === "ARIES0" ? 1 : 0)
            , 0)

            // update all aries power in wallet
            // when aries update all
            if ((attributes["skin type"]?.split(" ").pop()?.toUpperCase() ?? "") === "ARIES") {
                await accounts.forEach(async (elem: { publicKey: any, account: any }) => {
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
                })
            } else { // if not aries update initialized data account only
                await cyberWave.rpc.updatePower(
                    totalAries,
                    {
                        accounts: {
                            updateAccount: newDataAccountPubkey,
                        },
                        signers: [serverWalletAccount],
                    }
                )
            }
            const allAccount = await cyberWave.account.programAccountInfo.all()

            console.log("Initialization finish")
        } else {
            console.log('No initialization')
        }
    })
})
