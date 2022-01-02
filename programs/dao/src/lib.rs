use anchor_lang::prelude::*;

// declare_id!("GdySSAQ5BGoa11mUHoHDeJZdmyZQbreguyBJLu8XMvS9"); // juna
declare_id!("5TY1ftQBHvXTxuccJSEbVBQMTYdFhKf9JJCZvFry6BYx"); // shlee

#[program]
pub mod dao {
	use super::*;
	pub fn initialize(ctx: Context<Initialize>) -> ProgramResult {
		let account_data = &mut ctx.accounts.my_account;
		account_data.level = 1;
		account_data.exp = 0;
		account_data.power = 1000;
		account_data.registered_at = 0;
		account_data.exp_per_minute = 0;
		account_data.character_pubkey = "00000000000000000000000000000000".to_string();
		account_data.weapon_pubkey = "00000000000000000000000000000000".to_string();
		account_data.boost = 0;
		account_data.stunned_at = 0;
		account_data.ability_used_at = 0;
		account_data.region = "00000000".to_string();
		
		Ok(())
	}

	pub fn set_data(ctx: Context<SetData>, data: ProgramAccountInfo) -> ProgramResult {
		let account_data = &mut ctx.accounts.account;
		account_data.level = data.level;
		account_data.exp = data.exp;
		account_data.power = data.power;
		account_data.registered_at = data.registered_at;
		account_data.exp_per_minute = data.exp_per_minute;
		account_data.character_pubkey = data.character_pubkey;
		account_data.weapon_pubkey = data.weapon_pubkey;
		account_data.boost = data.boost;
		account_data.stunned_at = data.stunned_at;
		account_data.ability_used_at = data.ability_used_at;
		account_data.region = data.region;

		Ok(())
	}
}

#[derive(Accounts)]
pub struct Initialize<'info> {
	#[account(zero)]
	pub my_account: Account<'info, ProgramAccountInfo>,
	#[account(mut)]
	pub user: Signer<'info>,
	pub system_program: Program<'info, System>,
}

#[account]
pub struct ProgramAccountInfo {
	pub level: u32,
	pub exp: u32,
	pub power: u32,
	pub registered_at: u32,
	pub exp_per_minute: u32,
	pub character_pubkey: String,
	pub weapon_pubkey: String,
	pub boost: u32,
	pub stunned_at: u32,
	pub ability_used_at: u32,
	pub region: String
}

#[derive(Accounts)]
pub struct SetData<'info> {
	#[account(mut)]
	pub account: Account<'info, ProgramAccountInfo>,
}
