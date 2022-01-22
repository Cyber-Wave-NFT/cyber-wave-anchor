import * as anchor from '@project-serum/anchor'
import { serverMainKey } from '../config/config'


export async function checkStunEnd() {
    const serverWalletAccount = anchor.web3.Keypair.fromSecretKey(serverMainKey)
    const cyberWave = anchor.workspace.CyberWave
    const ts = await cyberWave.account.programAccountInfo.all()
    const accounts = ts
        .filter((elem: { publicKey: any, account: any }) => (elem.account.accountPubkey === '61KqL2ZUFeYrEqKbFKGSZ9URJj1Y7YyWNR94ZPSnsjRv' &&
            elem.account.lastCalculatedAt != 0))
    const lastCalTime = accounts.
        reduce((acc: any, elem: { publicKey: any, account: any }) =>
        {return acc < elem.account.lastCalculatedAt ? elem.account.lastCalculatedAt : acc;}
            , 0)
    const lastStunEndTime = accounts.
        reduce((acc: any, elem: { publicKey: any, account: any }) => 
        { return acc < elem.account.stunEndAt ? elem.account.stunEndAt : acc; }
            , 0)
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime >= lastStunEndTime && lastStunEndTime > lastCalTime) {
        let totalAries = accounts.reduce((acc: any, account: any) =>
            acc + (account.account.characterType === "ARIES0" ? 1 : 0)
            , 0)
        await Promise.all(accounts.map(async (elem: { publicKey: any, account: any }) => {
            const allyDataAccountPubkey = elem.publicKey
            await cyberWave.rpc.updateStunEnd(
                totalAries,
                lastStunEndTime,
                {
                    accounts: {
                        updateAccount: allyDataAccountPubkey,
                    },
                    signers: [serverWalletAccount],
                }
            )
        }))
    }
}