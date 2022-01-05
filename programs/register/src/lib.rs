#![allow(unused)]
use anchor_lang::prelude::*;
use dao::program::Dao;
use dao::{self, ProgramAccountInfo};
use solana_program::clock::Clock;
use dao::cpi::accounts::SetData;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

// declare_id!("7xESfHY92n9LZ5GteyQX5hsJrj8kKfeYssh69TL1w3BM"); // juna
declare_id!("BkZnVzwwiCfvZaF9EL57SjwS1dJquRJ596x8DGckrvvV"); // shlee

#[program]
pub mod register {
	use super::*;

	const EXP_LIMIT: u32 = 2_000_000;

	use super::*;
    pub fn transfer_wrapper(ctx: Context<TransferWrapper>, amount: u64) -> ProgramResult {
        msg!("starting tokens: {}", ctx.accounts.sender_token.amount);
        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        ctx.accounts.sender_token.reload()?;
        msg!("remaining tokens: {}", ctx.accounts.sender_token.amount);
        Ok(())
    }

	pub fn register(ctx: Context<Register>) -> ProgramResult {
		let cpi_program = ctx.accounts.dao_program.to_account_info();
		let mut account_data = ProgramAccountInfo {
			level: ctx.accounts.my_account.level,
			exp: ctx.accounts.my_account.exp,
			power: ctx.accounts.my_account.power,
			last_calculated_at: ctx.accounts.my_account.last_calculated_at,
			account_pubkey: ctx.accounts.my_account.account_pubkey.clone(),
			character_pubkey: ctx.accounts.my_account.character_pubkey.clone(),
			weapon_pubkey: ctx.accounts.my_account.weapon_pubkey.clone(),
			boost: ctx.accounts.my_account.boost,
			stunned_at: ctx.accounts.my_account.stunned_at,
			ability_used_at: ctx.accounts.my_account.ability_used_at,
			region: ctx.accounts.my_account.region.clone()
		};

		// register logic
		account_data.power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000; 	// 1% power up per level up 1.01^(level - 1) * 1000(default power)
		account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32; 	// total_exp = 50 * level^2
		account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;		// register time
		account_data.region = "BASEMENT".to_string();										// default region

		// 추가 필요 목록
		// account pubKey
		// NFT pubKey

		// Set Data to DAO Program
		let cpi_accounts = SetData {
			account: ctx.accounts.my_account.to_account_info(),
		};
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		dao::cpi::set_data(cpi_ctx, account_data)?;
		Ok(())
	}

	pub fn unregister(ctx: Context<Register>) -> ProgramResult {
		use std::cmp;

		let cpi_program = ctx.accounts.dao_program.to_account_info();
		let mut account_data = ProgramAccountInfo {
			level: ctx.accounts.my_account.level,
			exp: ctx.accounts.my_account.exp,
			power: ctx.accounts.my_account.power,
			last_calculated_at: ctx.accounts.my_account.last_calculated_at,
			account_pubkey: ctx.accounts.my_account.account_pubkey.clone(),
			character_pubkey: ctx.accounts.my_account.character_pubkey.clone(),
			weapon_pubkey: ctx.accounts.my_account.weapon_pubkey.clone(),
			boost: ctx.accounts.my_account.boost,
			stunned_at: ctx.accounts.my_account.stunned_at,
			ability_used_at: ctx.accounts.my_account.ability_used_at,
			region: ctx.accounts.my_account.region.clone()
		};

		// unregister logic
		account_data.region = "00000000".to_string();	// region clear

		// exp up occurs power up
		// so calculate level, exp, power when has to level up
		let mut time_elapsed = Clock::get().unwrap().unix_timestamp as u32 - account_data.last_calculated_at;
		while time_elapsed > 0 {
			// next level total exp - current exp
			// 50 * (current level + 1)^2 - current exp
			let need_exp_to_level_up = 50 * ((account_data.level + 1) as f64).powf(2_f64) as u32 - account_data.exp;
			let need_time_to_level_up = ((need_exp_to_level_up as f64 / (account_data.power as f64 / 600_f64)) * 60_f64) as u32;

			if need_time_to_level_up <= time_elapsed {
				// account_data.exp += ((need_time_to_level_up as f64 / 60_f64) * (account_data.power as f64 / 600_f64)) as u32;
				account_data.exp += need_exp_to_level_up;
				account_data.level += 1;
				account_data.power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000;
			} else {
				account_data.exp += ((time_elapsed as f64 / 60_f64) * (account_data.power as f64 / 600_f64)) as u32;
			}
			time_elapsed -= need_time_to_level_up;
		}
		account_data.last_calculated_at = 0;					// registered at time clear

		// cannot exceed MAX Exp
		account_data.exp = cmp::max(account_data.exp, EXP_LIMIT);

		// Set Data to DAO Program
		let cpi_accounts = SetData {
			account: ctx.accounts.my_account.to_account_info(),
		};
		let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
		dao::cpi::set_data(cpi_ctx, account_data)?;
		Ok(())
	}
}

#[derive(Accounts)]
pub struct Register<'info> {
	#[account(mut)]
	pub my_account: Account<'info, ProgramAccountInfo>,
	pub dao_program: Program<'info, Dao>,
}

#[derive(Accounts)]
pub struct TransferWrapper<'info> {
    pub sender: Signer<'info>,
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(mut)]
    pub receiver_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

impl<'info> TransferWrapper<'info> {
    fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_token.to_account_info(),
                to: self.receiver_token.to_account_info(),
                authority: self.sender.to_account_info(),
            },
        )
    }
}