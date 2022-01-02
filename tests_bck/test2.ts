/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as anchor from '@project-serum/anchor';
import web3, {
	Keypair,
	Connection,
	PublicKey,
	LAMPORTS_PER_SOL,
	TransactionInstruction,
	Transaction,
	sendAndConfirmTransaction,
} from '@solana/web3.js'
const {
    SystemProgram
} = anchor.web3;
import * as assert from "assert";
import fs from 'mz/fs'
import path from 'path'
import * as borsh from 'borsh'

import {getPayer, getRpcUrl, createKeypairFromFile} from './utils/utils'

describe('dao', () => {
    /**
     * Connection to the network
     */
    let connection: Connection

    /**
     * Keypair associated to the fees' payer
     */
    let payer: Keypair

    /**
     * Hello world's program id
     */
    let programId: PublicKey

    /**
     * The public key of the account we are saying hello to
     */
    let dataAccountPubkey: PublicKey

    const dao = anchor.workspace.Dao;
    const register = anchor.workspace.Register;

    class ProgramAccountInfo {
        level = 0
        exp = 0
        power = 0
        registered_at = 0
        exp_per_minute = 0
        character_pubkey = ""
        weapon_pubkey = ""
        boost = 0
        stunned_at = 0
        ability_used_at = 0
        region = ""
        constructor(fields: {
            level: number, 
            exp: number,
            power: number,
            registered_at: number,
            exp_per_minute: number,
            character_pubkey: string,
            weapon_pubkey: string,
            boost: number,
            stunned_at: number,
            ability_used_at: number,
            region: string
        } | undefined = undefined) {
            if (fields) {
                this.level = fields.level
                this.exp = fields.exp
                this.power = fields.power
                this.registered_at = fields.registered_at
                this.exp_per_minute = fields.exp_per_minute
                this.character_pubkey = fields.character_pubkey
                this.weapon_pubkey = fields.weapon_pubkey
                this.boost = fields.boost
                this.stunned_at = fields.stunned_at
                this.ability_used_at = fields.ability_used_at
                this.region = fields.region
            }
        }
    }

    /**
     * Borsh schema definition for greeting accounts
     */
    const ProgramAccountInfoSchema = new Map([
        [ProgramAccountInfo, {kind: 'struct', fields: [
            ['level', 'u32'],
            ['exp', 'u32'],
            ['power', 'u32'],
            ['registered_at', 'u64'],
            ['exp_per_minute', 'u32'],
            ['character_pubkey', 'String'],
            ['weapon_pubkey', 'String'],
            ['boost', 'u32'],
            ['stunned_at', 'u32'],
            ['ability_used_at', 'u32'],
            ['region', 'String']
        ]}],
    ])

    /**
     * The expected size of each greeting account.
     */
    const GREETING_SIZE = borsh.serialize(
        ProgramAccountInfoSchema,
        new ProgramAccountInfo(),
    ).length

    it("establish Connection", async () => {
        const rpcUrl = await getRpcUrl()
        connection = new Connection(rpcUrl, 'confirmed')
        const version = await connection.getVersion()
        console.log('Connection to cluster established:', rpcUrl, version)
    });

    it("establish Payer" , async () => {
        let fees = 0
        if (!payer) {
            const {feeCalculator} = await connection.getRecentBlockhash()

            // Calculate the cost to fund the greeter account
            fees += await connection.getMinimumBalanceForRentExemption(GREETING_SIZE)

            // Calculate the cost of sending transactions
            fees += feeCalculator.lamportsPerSignature * 100 // wag

            payer = await getPayer()
        }

        let lamports = await connection.getBalance(payer.publicKey)
        if (lamports < fees) {
            // If current balance is not enough to pay for fees, request an airdrop
            const sig = await connection.requestAirdrop(
                payer.publicKey,
                fees - lamports,
            )
            await connection.confirmTransaction(sig)
            lamports = await connection.getBalance(payer.publicKey)
        }

        console.log(
            'Using account',
            payer.publicKey.toBase58(),
            'containing',
            lamports / LAMPORTS_PER_SOL,
            'SOL to pay for fees',
        )
    });
});
