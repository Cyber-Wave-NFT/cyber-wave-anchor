use anchor_lang::prelude::*;
use dao::program::Dao;
use dao::{self, ProgramAccountInfo};
use std::time::SystemTime;
use dao::cpi::accounts::SetData;

declare_id!("7xESfHY92n9LZ5GteyQX5hsJrj8kKfeYssh69TL1w3BM");

#[program]
pub mod register {
	use super::*;

	pub fn register(ctx: Context<Register>, is_deposit: bool) -> ProgramResult {
		let cpi_program = ctx.accounts.dao_program.to_account_info();
		let mut account_data = ProgramAccountInfo {
			level: ctx.accounts.my_account.level,
			exp: ctx.accounts.my_account.exp,
			power: ctx.accounts.my_account.power,
			registered_at: ctx.accounts.my_account.registered_at,
			exp_per_minute: ctx.accounts.my_account.exp_per_minute,
			character_pubkey: ctx.accounts.my_account.character_pubkey.clone(),
			weapon_pubkey: ctx.accounts.my_account.weapon_pubkey.clone(),
			boost: ctx.accounts.my_account.boost,
			stunned_at: ctx.accounts.my_account.stunned_at,
			ability_used_at: ctx.accounts.my_account.ability_used_at,
			region: ctx.accounts.my_account.region.clone()
		};
		// account_data.level += is_deposit as u32;
		if is_deposit {
			// account_data.level += is_deposit as u32;
			account_data.power = 1.01_f64.powf((account_data.level - 1) as f64) as u32 * 1000;
			account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32;
			// account_data.exp_per_minute = account_data.power / 600;
			// account_data.registered_at = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs();
			// account_data.region = "BASEMENT".to_string();
		} else {
			// account_data.level -= is_deposit as u32;
			// let time_elapsed: u64 = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() - account_data.registered_at;
			// account_data.region = "00000000".to_string();
			// account_data.registered_at = 0;
			// account_data.exp += ((time_elapsed as u32) / 60) * account_data.exp_per_minute;
			// account_data.level = 1 + ((account_data.exp / 50) as f64).sqrt().round() as u32;
			// account_data.exp_per_minute = 0;
		}
		
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
