import * as anchor from '@project-serum/anchor'
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
    const HEAL_NFT = "abcd"
    const INJURED_NFT = "defg"

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
        const currentTime = Math.floor(Date.now() / 1000)
        if (healDataAccount.character_type !== "heal" || healDataAccount.ability_able_at > currentTime || injuredDataAccount.stun_end_at > currentTime) {
            throw new Error()
        }
        const tx = await cyberWave.rpc.healCharacter({
            accounts: {
                healCharacterAccount: healDataAccountPubkey,
                injuredCharacterAccount: injuredDataAccountPubkey,
            },
            signers: [serverWalletAccount],
        })
        const healDataAccountAfter = await cyberWave.provider.connection.getAccountInfo(healDataAccountPubkey)
        const injuredDataAccountAfter = await cyberWave.provider.connection.getAccountInfo(injuredDataAccountPubkey)
        console.log("healDataAccount:", healDataAccountAfter)
        console.log("injuredDataAccount:", injuredDataAccountAfter)
    })
})
