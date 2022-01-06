#![allow(unused)]
use anchor_lang::prelude::*;
use solana_program::clock::Clock;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("7xESfHY92n9LZ5GteyQX5hsJrj8kKfeYssh69TL1w3BM"); // juna
// declare_id!("BkZnVzwwiCfvZaF9EL57SjwS1dJquRJ596x8DGckrvvV"); // shlee

#[program]
pub mod register {
	use super::*;

	const EXP_LIMIT: u32 = 2_000_000;

	use super::*;
	pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		account_data.level = 1;
		account_data.exp = 0;
		account_data.power = 1000;
		account_data.last_calculated_at = 0;
		account_data.account_pubkey = "00000000000000000000000000000000".to_string();
		account_data.character_pubkey = "00000000000000000000000000000000".to_string();
		account_data.weapon_pubkey = "00000000000000000000000000000000".to_string();
		account_data.boost = 0;
		account_data.stunned_at = 0;
		account_data.ability_used_at = 0;
		account_data.region = "00000000".to_string();

		Ok(())
	}
    pub fn transfer_wrapper(ctx: Context<TransferWrapper>, amount: u64) -> ProgramResult {
        msg!("starting tokens: {}", ctx.accounts.sender_token.amount);
        let seeds = &[ctx.accounts.sender.key.as_ref(), ctx.accounts.sender.key.as_ref(),];
        let signer = &[&seeds[..]];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info().clone(),
            Transfer {
                from: ctx.accounts.sender_token.to_account_info().clone(),
                to: ctx.accounts.receiver_token.to_account_info().clone(),
                authority: ctx.accounts.sender.clone(),
            },
            signer
        );
        token::transfer(cpi_ctx, amount)?;
        ctx.accounts.sender_token.reload()?;
        msg!("remaining tokens: {}", ctx.accounts.sender_token.amount);
        Ok(())
    }

	pub fn move_region(ctx: Context<Register>, data: u32) -> ProgramResult {
		let mut account_data = &mut ctx.accounts.my_account;
		if data == 1 {
			account_data.region = "REGION_1".to_string()
		}
		if data == 2 {
			account_data.region = "REGION_2".to_string()
		}
		if data == 3 {
			account_data.region = "REGION_3".to_string()
		}
		if data == 4 {
			account_data.region = "REGION_4".to_string()
		}
		Ok(())
	}

	pub fn register(ctx: Context<Register>) -> ProgramResult {
		let mut account_data = &mut ctx.accounts.my_account;

		// register logic
		account_data.power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000; 	// 1% power up per level up 1.01^(level - 1) * 1000(default power)
		account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32; 	// total_exp = 50 * level^2
		account_data.last_calculated_at = Clock::get().unwrap().unix_timestamp as u32;		// register time
		account_data.region = "BASEMENT".to_string();										// default region

		// 추가 필요 목록
		// account pubKey
		// NFT pubKey
		Ok(())
	}

	pub fn unregister(ctx: Context<Register>) -> ProgramResult {
		use std::cmp;
		let mut account_data =  &mut ctx.accounts.my_account;
		// unregister logic
		account_data.region = "00000000".to_string();	// region clear

		// exp up occurs power up
		// so calculate level, exp, power when has to level up
		let mut time_elapsed = Clock::get().unwrap().unix_timestamp as u32 - account_data.last_calculated_at;
		while time_elapsed > 0 {
			// next level total exp - current exp
			// 50 * (current level + 1)^2 - current exp
			let need_exp_to_level_up = 50 * ((account_data.level + 1) as f64).powf(2_f64) as u32 - account_data.exp;
			let need_time_to_level_up = ((need_exp_to_level_up as f64 / (account_data.power as f64 / 3600_f64))) as u32;

			if need_time_to_level_up <= time_elapsed {
				// account_data.exp += ((need_time_to_level_up as f64 / 60_f64) * (account_data.power as f64 / 600_f64)) as u32;
				account_data.exp += need_exp_to_level_up;
				account_data.level += 1;
				account_data.power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000;
			} else {
				account_data.exp += ((time_elapsed as f64 / 60_f64) * (account_data.power as f64 / 600_f64)) as u32;
				break;
			}
			time_elapsed -= need_time_to_level_up;
		}
		account_data.last_calculated_at = 0;					// registered at time clear

		// cannot exceed MAX Exp
		account_data.exp = cmp::max(account_data.exp, EXP_LIMIT);
		Ok(())
	}
}

#[derive(Accounts)]
pub struct Register<'info> {
	#[account(mut)]
	pub my_account: Account<'info, ProgramAccountInfo>
}

#[derive(Accounts)]
pub struct TransferWrapper<'info> {
    #[account(mut)]
    pub sender_token: Account<'info, TokenAccount>,
    #[account(constraint = sender_token.mint == receiver_token.mint)]
    pub receiver_token: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub sender: AccountInfo<'info>,
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

#[account]
pub struct ProgramAccountInfo {
	pub level: u32,
	pub exp: u32,
	pub power: u32,
	pub last_calculated_at: u32,
	pub account_pubkey: String,
	pub character_pubkey: String,
	pub weapon_pubkey: String,
	pub boost: u32,
	pub stunned_at: u32,
	pub ability_used_at: u32,
	pub region: String
}

#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(zero)]
	pub my_account: Account<'info, ProgramAccountInfo>,
	#[account(mut)]
	pub user: Signer<'info>,
	pub system_program: Program<'info, System>,
}
